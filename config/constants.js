module.exports = {
  nameMaxLength: 50,
  unsplashBaseUrl: 'https://api.unsplash.com',
  headers: {
    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
  }
};
