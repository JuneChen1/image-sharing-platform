const { dataSource } = require('./data-source');
const Categories = require('./entities/categories');
const SharedPhotos = require('./entities/shared_photos');
const SharedPhotoCategories = require('./entities/shared_photo_categories');

async function clearAll() {
  const ORDER = [SharedPhotoCategories, SharedPhotos, Categories];
  for (const name of ORDER) {
    if (dataSource.hasMetadata(name)) {
      await dataSource.createQueryBuilder().delete().from(name).execute();
    }
  }
}

async function main() {
  await dataSource.initialize();
  await clearAll();

  const categoriesRepo = dataSource.getRepository(Categories);
  const sharedPhotosRepo = dataSource.getRepository(SharedPhotos);
  const sharedPhotoCategoriesRepo = dataSource.getRepository(
    SharedPhotoCategories
  );

  const [animal, nature, food, coffee, city, architecture, technology, travel] =
    await categoriesRepo.save([
      { name: 'Animal' },
      { name: 'Nature' },
      { name: 'Food' },
      { name: 'Coffee' },
      { name: 'City' },
      { name: 'Architecture' },
      { name: 'Technology' },
      { name: 'Travel' }
    ]);

  const savedPhotos = await sharedPhotosRepo.save([
    {
      unsplash_id: 'gKXKBY-C-Dk',
      unsplash_page_url:
        'https://unsplash.com/photos/black-and-white-cat-lying-on-brown-bamboo-chair-inside-room-gKXKBY-C-Dk',
      image_url:
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'madhatterzone',
      photographer_url: 'https://unsplash.com/@madhatterzone'
    },
    {
      unsplash_id: '75715CVEJhI',
      unsplash_page_url:
        'https://unsplash.com/photos/selective-focus-photography-of-orange-and-white-cat-on-brown-table-75715CVEJhI',
      image_url:
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'sadmax',
      photographer_url: 'https://unsplash.com/@sadmax'
    },
    {
      unsplash_id: 'yihlaRCCvd4',
      unsplash_page_url:
        'https://unsplash.com/photos/dog-running-on-beach-during-daytime-yihlaRCCvd4',
      image_url:
        'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'o5ky',
      photographer_url: 'https://unsplash.com/@o5ky'
    },
    {
      unsplash_id: 'm_uSWBJWr0s',
      unsplash_page_url:
        'https://unsplash.com/photos/green-and-gray-rock-formation-beside-body-of-water-under-cloudy-sky-during-daytime-m_uSWBJWr0s',
      image_url:
        'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'daymnous',
      photographer_url: 'https://unsplash.com/@daymnous'
    },
    {
      unsplash_id: 'Joo3UBw789Q',
      unsplash_page_url:
        'https://unsplash.com/photos/green-mountains-under-blue-sky-during-daytime-Joo3UBw789Q',
      image_url:
        'https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'danangele',
      photographer_url: 'https://unsplash.com/@danangele'
    },
    {
      unsplash_id: 'kcA-c3f_3FE',
      unsplash_page_url:
        'https://unsplash.com/photos/vegetable-and-meat-on-bowl-kcA-c3f_3FE',
      image_url:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'pwign',
      photographer_url: 'https://unsplash.com/@pwign'
    },
    {
      unsplash_id: 'MqT0asuoIcU',
      unsplash_page_url:
        'https://unsplash.com/photos/pizza-on-chopping-board-MqT0asuoIcU',
      image_url:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'briewilly',
      photographer_url: 'https://unsplash.com/@briewilly'
    },
    {
      unsplash_id: 'PhYq704ffdA',
      unsplash_page_url:
        'https://unsplash.com/photos/low-angle-photo-of-city-high-rise-buildings-during-daytime-PhYq704ffdA',
      image_url:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'seanpollock',
      photographer_url: 'https://unsplash.com/@seanpollock'
    },
    {
      unsplash_id: 'K67sBVqLLuw',
      unsplash_page_url:
        'https://unsplash.com/photos/grayscale-photo-of-low-angle-view-of-building-K67sBVqLLuw',
      image_url:
        'https://images.unsplash.com/photo-1527576539890-dfa815648363?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'joakimnadell',
      photographer_url: 'https://unsplash.com/@joakimnadell'
    },
    {
      unsplash_id: '72CrKMqbwkM',
      unsplash_page_url:
        'https://unsplash.com/photos/traffic-filled-highways-crisscross-a-city-at-golden-hour-72CrKMqbwkM',
      image_url:
        'https://images.unsplash.com/photo-1785788684002-f500e756047d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'jonasdegener',
      photographer_url: 'https://unsplash.com/@jonasdegener'
    },
    {
      unsplash_id: 'xSiQBSq-I0M',
      unsplash_page_url:
        'https://unsplash.com/photos/a-woman-sitting-on-a-bed-using-a-laptop-xSiQBSq-I0M',
      image_url:
        'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'surface',
      photographer_url: 'https://unsplash.com/@surface'
    },
    {
      unsplash_id: 'Q1p7bh3SHj8',
      unsplash_page_url:
        'https://unsplash.com/photos/photo-of-outer-space-Q1p7bh3SHj8',
      image_url:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'nasa',
      photographer_url: 'https://unsplash.com/@nasa'
    },
    {
      unsplash_id: 'xfngap_DToE',
      unsplash_page_url:
        'https://unsplash.com/photos/ice-capped-mountain-at-daytime-xfngap_DToE',
      image_url:
        'https://images.unsplash.com/photo-1554629947-334ff61d85dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'mvds',
      photographer_url: 'https://unsplash.com/@mvds'
    },
    {
      unsplash_id: 'eUFfY6cwjSU',
      unsplash_page_url:
        'https://unsplash.com/photos/aerial-view-of-mountain-eUFfY6cwjSU',
      image_url:
        'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'borisbaldinger',
      photographer_url: 'https://unsplash.com/@borisbaldinger'
    },
    {
      unsplash_id: 'zEdCT0qrodE',
      unsplash_page_url:
        'https://unsplash.com/photos/cafe-late-on-table-zEdCT0qrodE',
      image_url:
        'https://images.unsplash.com/photo-1556742526-795a8eac090e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'nate_dumlao',
      photographer_url: 'https://unsplash.com/@nate_dumlao'
    },
    {
      unsplash_id: 'zUNs99PGDg0',
      unsplash_page_url:
        'https://unsplash.com/photos/shallow-focus-photography-of-coffee-late-in-mug-on-table-zUNs99PGDg0',
      image_url:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      photographer_name: 'nate_dumlao',
      photographer_url: 'https://unsplash.com/@nate_dumlao'
    }
  ]);

  await sharedPhotoCategoriesRepo.save([
    { sharePhotos: savedPhotos[0], categories: animal },
    { sharePhotos: savedPhotos[1], categories: animal },
    { sharePhotos: savedPhotos[2], categories: animal },
    { sharePhotos: savedPhotos[2], categories: travel },
    { sharePhotos: savedPhotos[3], categories: nature },
    { sharePhotos: savedPhotos[4], categories: nature },
    { sharePhotos: savedPhotos[4], categories: travel },
    { sharePhotos: savedPhotos[5], categories: food },
    { sharePhotos: savedPhotos[6], categories: food },
    { sharePhotos: savedPhotos[7], categories: city },
    { sharePhotos: savedPhotos[7], categories: travel },
    { sharePhotos: savedPhotos[8], categories: architecture },
    { sharePhotos: savedPhotos[9], categories: city },
    { sharePhotos: savedPhotos[10], categories: technology },
    { sharePhotos: savedPhotos[11], categories: technology },
    { sharePhotos: savedPhotos[11], categories: nature },
    { sharePhotos: savedPhotos[12], categories: travel },
    { sharePhotos: savedPhotos[12], categories: nature },
    { sharePhotos: savedPhotos[13], categories: travel },
    { sharePhotos: savedPhotos[13], categories: nature },
    { sharePhotos: savedPhotos[14], categories: coffee },
    { sharePhotos: savedPhotos[14], categories: food },
    { sharePhotos: savedPhotos[15], categories: coffee },
    { sharePhotos: savedPhotos[15], categories: food }
  ]);

  console.log('seed 完成');
  await dataSource.destroy();
}

main().catch((e) => {
  console.error('seed 失敗：', e.message);
  process.exit(1);
});
