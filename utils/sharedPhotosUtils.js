const { In } = require('typeorm');
const { dataSource } = require('../db/data-source');

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

module.exports = { attachCategories, attachFavoritesCount };
