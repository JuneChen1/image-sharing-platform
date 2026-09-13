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

module.exports = { attachCategories };
