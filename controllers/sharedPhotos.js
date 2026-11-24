const {
  getUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo,
  trackUnsplashDownload
} = require('../utils/unsplashApiUtils');
const {
  verifyUnsplashImageId,
  verifyCustomCategories,
  isPositiveInteger,
  isValidString,
  isValidUUID
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const {
  attachCategories,
  attachFavoritesCount,
  attachIsCollected,
  buildPhotoFilter
} = require('../utils/sharedPhotosUtils');
const { dataSource } = require('../db/data-source');
const { In } = require('typeorm');
const { parseUploadFields } = require('../utils/uploadUtils');
const { processUploadedImage } = require('../utils/imageUtils');
const storage = require('../utils/storage');
const { getPositiveIntEnv } = require('../utils/env');
const {
  uploadDailyLimitDefault,
  uploadTotalLimitDefault
} = require('../config/constants');

const shareImageWithUrl = async (req, res, next) => {
  const { url, customCategories } = req.body;
  if (!isValidString(url)) {
    next(appError('URL_REQUIRED'));
    return;
  }
  if (!verifyCustomCategories(customCategories)) {
    next(appError('INVALID_CATEGORIES'));
    return;
  }

  const { success, imageId } = getUnsplashImageId(url);
  if (!success || !verifyUnsplashImageId(imageId)) {
    next(appError('INVALID_URL'));
    return;
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const existing = await sharePhotosRepo.findOneBy({
      unsplash_id: imageId,
      user: { id: user.id }
    });

    if (existing) return next(appError('ALREADY_SHARED'));

    const result = await fetchUnsplashPhoto(imageId);

    if (!result.success) {
      if (result.status === 404)
        return next(appError('UNSPLASH_PHOTO_NOT_FOUND'));

      const errorCode =
        result.status === 403 ? 'UNSPLASH_BUSY' : 'UNSPLASH_API_ERROR';
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(errorCode));
    }

    const uniqueNames = [
      ...new Map(
        customCategories.map((name) => [name.trim().toLowerCase(), name.trim()])
      ).values()
    ];
    const shareInfo = getUnsplashImageInfo(result);

    // save to the database
    await dataSource.transaction(async (manager) => {
      const sharePhotosRepo = manager.getRepository('SharedPhotos');
      const categoriesRepo = manager.getRepository('Categories');
      const joinRepo = manager.getRepository('SharedPhotoCategories');

      // 分類名稱一次新增進 categories 表，遇到已經存在的就跳過，不報錯
      await manager.query(
        `INSERT INTO categories (name)
        SELECT unnest($1::text[])
        ON CONFLICT (name) DO NOTHING`,
        [uniqueNames]
      );

      const categories = await categoriesRepo.find({
        where: { name: In(uniqueNames) }
      });

      const savedPhoto = await sharePhotosRepo
        .save({
          ...shareInfo,
          user: { id: user.id }
        })
        .catch((err) => {
          // 避免使用者連點兩次分享按鈕產生的 race condition
          if (err.code === '23505') {
            throw appError('ALREADY_SHARED');
          }
          throw err;
        });

      const links = categories.map((category) =>
        joinRepo.create({ sharedPhotos: savedPhoto, categories: category })
      );

      await joinRepo.save(links);
    });

    // 回報下載事件（Unsplash API 規定）：不等結果，失敗也不影響分享
    trackUnsplashDownload(result.data.links?.download_location, shareInfo);

    res.status(200).json({ status: 'success', data: shareInfo });
  } catch (error) {
    next(error);
  }
};

const getSharedImages = async (req, res, next) => {
  const pageNumber = req.query.page === undefined ? 1 : Number(req.query.page);
  const limitNumber =
    req.query.limit === undefined ? 20 : Number(req.query.limit);
  const category = req.query.category;
  const q = req.query.q;
  const sort = req.query.sort === undefined ? 'latest' : req.query.sort;

  const ALLOWED_SORTS = ['latest', 'popular'];

  if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
    return next(appError('INVALID_PAGINATION'));
  }

  if (limitNumber > 100) {
    return next(appError('LIMIT_TOO_LARGE'));
  }

  if (!ALLOWED_SORTS.includes(sort)) {
    return next(appError('INVALID_SORT'));
  }

  if (
    (category !== undefined && typeof category !== 'string') ||
    (q !== undefined && typeof q !== 'string')
  ) {
    return next(appError('INVALID_FIELDS'));
  }

  const skip = (pageNumber - 1) * limitNumber;
  const take = limitNumber;

  let data, total;
  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    if (sort === 'latest') {
      // 創建時間排序
      if (!category && !q) {
        let rawData;
        [rawData, total] = await sharePhotosRepo.findAndCount({
          relations: { user: true },
          skip,
          take,
          order: { created_at: 'DESC', id: 'ASC' }
        });
        data = rawData.map(({ user, ...photo }) => ({
          ...photo,
          user_id: user.id,
          user_name: user.name
        }));

        data = await attachFavoritesCount(data);
      } else {
        // 有帶 category 或 q 參數
        const { params, whereClause } = buildPhotoFilter(category, q);
        const countResult = await dataSource.query(
          `SELECT COUNT(*) FROM shared_photos sp ${whereClause}`,
          params
        );
        total = Number(countResult[0].count);

        const result = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          ${whereClause}
          ORDER BY sp.created_at DESC, sp.id
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
          `,
          [...params, take, skip]
        );

        data = await attachFavoritesCount(result);
      }
    } else if (sort === 'popular') {
      // 收藏數排序
      if (!category && !q) {
        const countResult = await sharePhotosRepo.count();
        total = countResult;

        data = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name, COUNT(DISTINCT f.user_id)::int AS favorites_count
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          LEFT JOIN favorites AS f ON f.shared_photo_id = sp.id
          GROUP BY sp.id, u.name
          ORDER BY favorites_count DESC, sp.created_at DESC, sp.id
          LIMIT $1 OFFSET $2
          `,
          [take, skip]
        );
      } else {
        // 有帶 category 或 q 參數
        const { params, whereClause } = buildPhotoFilter(category, q);
        const countResult = await dataSource.query(
          `SELECT COUNT(*) FROM shared_photos sp ${whereClause}`,
          params
        );
        total = Number(countResult[0].count);

        data = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name, COUNT(DISTINCT f.user_id)::int AS favorites_count
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          LEFT JOIN favorites AS f ON f.shared_photo_id = sp.id
          ${whereClause}
          GROUP BY sp.id, u.name
          ORDER BY favorites_count DESC, sp.created_at DESC, sp.id
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
          `,
          [...params, take, skip]
        );
      }
    }

    data = await attachCategories(data);
    data = await attachIsCollected(data, req.user?.id);

    res.status(200).json({
      status: 'success',
      data,
      pagination: { page: pageNumber, limit: limitNumber, total }
    });
  } catch (error) {
    next(error);
  }
};

// 單張照片的完整資料（和列表的一筆同格式）：sp.* + user_name + favorites_count + categories，登入者另有 is_collected。找不到回傳 null
const loadSharedPhotoDetail = async (sharedId, userId) => {
  const rows = await dataSource.query(
    `
    SELECT sp.*, u.name AS user_name
    FROM shared_photos sp
    JOIN users AS u ON u.id = sp.user_id
    WHERE sp.id = $1
    `,
    [sharedId]
  );

  if (rows.length === 0) return null;

  let data = await attachFavoritesCount(rows);
  data = await attachCategories(data);
  data = await attachIsCollected(data, userId);
  return data[0];
};

// 單張照片（詳情頁用）
const getSharedImageById = async (req, res, next) => {
  const { sharedId } = req.params;
  if (!isValidUUID(sharedId)) {
    return next(appError('INVALID_ID'));
  }

  try {
    const photo = await loadSharedPhotoDetail(sharedId, req.user?.id);
    if (!photo) return next(appError('NOT_FOUND'));

    res.status(200).json({ status: 'success', data: photo });
  } catch (error) {
    next(error);
  }
};

// 上傳自己的圖片。處理順序（先便宜、後貴）：欄位驗證 → 檢查上限 → 處理圖片 → 存檔 → 寫資料庫（失敗要把檔案刪掉）。
// 規格見 develop/upload-api-spec.md
const uploadSharedPhoto = async (req, res, next) => {
  const user = req.user;
  let key = null;

  try {
    if (!req.file) return next(appError('FILE_REQUIRED'));
    const { customCategories, isOriginal, originUrl, note } = parseUploadFields(
      req.body
    );

    // 數目前的列數：總量（保留中的上傳）與 24 小時內新增的數量。
    // 已知缺口：上傳後取消分享會讓列數減少，所以可以「上傳→取消→再上傳」繞過；每小時請求次數的限流會限制速度
    const [{ total, daily }] = await dataSource.query(
      `
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS daily
      FROM shared_photos
      WHERE user_id = $1 AND source_type = 'upload'
      `,
      [user.id]
    );
    if (
      total >= getPositiveIntEnv('UPLOAD_TOTAL_LIMIT', uploadTotalLimitDefault)
    ) {
      return next(appError('UPLOAD_TOTAL_LIMIT_REACHED'));
    }
    if (
      daily >= getPositiveIntEnv('UPLOAD_DAILY_LIMIT', uploadDailyLimitDefault)
    ) {
      return next(appError('UPLOAD_DAILY_LIMIT_REACHED'));
    }

    const imageBuffer = await processUploadedImage(req.file.buffer);

    key = storage.newKey(user.id);
    await storage.save(key, imageBuffer);

    const savedPhoto = await dataSource.transaction(async (manager) => {
      // 分類一次新增進 categories 表，已經存在的跳過（作法同 shareImageWithUrl）
      await manager.query(
        `INSERT INTO categories (name)
        SELECT unnest($1::text[])
        ON CONFLICT (name) DO NOTHING`,
        [customCategories]
      );
      const categories = await manager
        .getRepository('Categories')
        .find({ where: { name: In(customCategories) } });

      const photo = await manager.getRepository('SharedPhotos').save({
        source_type: 'upload',
        file_key: key,
        image_url: storage.publicUrl(key),
        is_original: isOriginal,
        origin_url: originUrl,
        note,
        user: { id: user.id }
      });

      const joinRepo = manager.getRepository('SharedPhotoCategories');
      await joinRepo.save(
        categories.map((category) =>
          joinRepo.create({ sharedPhotos: photo, categories: category })
        )
      );

      return photo;
    });

    const data = await loadSharedPhotoDetail(savedPhoto.id, user.id);
    res.status(201).json({ status: 'success', data });
  } catch (error) {
    // 已經存了檔案但後面失敗：把檔案刪掉，不留孤兒檔案（刪除失敗只記日誌，不蓋掉原本的錯誤）
    if (key) {
      await storage.remove(key).catch((removeError) => {
        console.error('清除上傳失敗後的孤兒檔案時出錯：', removeError);
      });
    }
    next(error);
  }
};

const cancelSharedPhoto = async (req, res, next) => {
  const { sharedId } = req.params;
  if (!isValidUUID(sharedId)) {
    return next(appError('INVALID_ID'));
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const data = await sharePhotosRepo.findOneBy({
      id: sharedId,
      user: { id: user.id }
    });

    if (!data) {
      return next(appError('NOT_FOUND'));
    }

    await dataSource.transaction(async (manager) => {
      await manager
        .getRepository('SharedPhotoCategories')
        .delete({ sharedPhotos: { id: data.id } });

      await manager
        .getRepository('Favorites')
        .delete({ sharedPhotos: { id: data.id } });

      await manager.getRepository('SharedPhotos').delete({ id: data.id });
    });

    res.status(200).json({
      status: 'success',
      message: '刪除成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareImageWithUrl,
  getSharedImages,
  getSharedImageById,
  uploadSharedPhoto,
  cancelSharedPhoto
};
