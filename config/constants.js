module.exports = {
  nameMaxLength: 50,
  emailMaxLength: 100,
  collectionNameMaxLength: 100,
  categoryMaxCount: 10,
  unsplashBaseUrl: 'https://api.unsplash.com',
  headers: {
    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
  }
};
