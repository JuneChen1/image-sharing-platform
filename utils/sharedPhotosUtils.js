const { In } = require('typeorm');
const { dataSource } = require('../db/data-source');
const { escapeLike } = require('./sqlUtils');

async function attachCategories(photos) {
  if (photos.length === 0) return photos;

  const linkRepo = dataSource.getRepository('SharedPhotoCategories');
  const links = await linkRepo.find({
    where: { sharedPhotos: { id: In(photos.map((photo) => photo.id)) } },
    relations: { categories: true, sharedPhotos: true }
  });

  const categoriesByPhotoId = {};
  links.forEach((link) => {
    const photoId = link.sharedPhotos.id;
    if (!categoriesByPhotoId[photoId]) {
      categoriesByPhotoId[photoId] = [link.categories.name];
      return;
    }
    categoriesByPhotoId[photoId].push(link.categories.name);
  });

  return photos.map((photo) => ({
    ...photo,
    categories: categoriesByPhotoId[photo.id] || []
  }));
}

async function attachFavoritesCount(photos) {
  if (photos.length === 0) return photos;

  const result = await dataSource.query(
    `SELECT shared_photo_id, COUNT(*)::int AS count
     FROM favorites
     WHERE shared_photo_id = ANY($1)
     GROUP BY shared_photo_id`,
    [photos.map((photo) => photo.id)]
  );

  const countMap = Object.fromEntries(
    result.map((r) => [r.shared_photo_id, r.count])
  );

  return photos.map((photo) => ({
    ...photo,
    favorites_count: countMap[photo.id] || 0
  }));
}

// 標記「這個使用者是否已把照片加入任何收藏庫」。訪客（沒有 userId）不回傳 is_collected 欄位
async function attachIsCollected(photos, userId) {
  if (!userId || photos.length === 0) return photos;

  const result = await dataSource.query(
    `SELECT DISTINCT shared_photo_id
     FROM favorites
     WHERE user_id = $1 AND shared_photo_id = ANY($2)`,
    [userId, photos.map((photo) => photo.id)]
  );

  const collectedIds = new Set(result.map((r) => r.shared_photo_id));

  return photos.map((photo) => ({
    ...photo,
    is_collected: collectedIds.has(photo.id)
  }));
}

// category / q 篩選條件。用 EXISTS 比對分類而不是 JOIN，JOIN 會讓一張照片重複出現
function buildPhotoFilter(category, q) {
  const params = [];
  const conditions = [];
  if (category) {
    params.push(category);
    conditions.push(`
      AND EXISTS (
        SELECT 1 FROM shared_photo_categories spc
        JOIN categories c ON c.id = spc.category_id
        WHERE spc.shared_photo_id = sp.id AND c.name = $${params.length}
      )
    `);
  }
  if (q) {
    params.push(escapeLike(q));
    conditions.push(`
      AND (
        sp.photographer_name ILIKE '%' || $${params.length} || '%'
        OR EXISTS (
          SELECT 1 FROM shared_photo_categories spc
          JOIN categories c ON c.id = spc.category_id
          WHERE spc.shared_photo_id = sp.id AND c.name ILIKE '%' || $${params.length} || '%'
        )
      )
    `);
  }

  return { params, whereClause: `WHERE TRUE ${conditions.join(' ')}` };
}

module.exports = {
  attachCategories,
  attachFavoritesCount,
  attachIsCollected,
  buildPhotoFilter
};
