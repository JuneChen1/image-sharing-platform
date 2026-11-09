module.exports = {
  nameMaxLength: 50,
  emailMaxLength: 100,
  collectionNameMaxLength: 100,
  collectionMaxCount: 10,
  categoryMaxCount: 10,
  unsplashBaseUrl: 'https://api.unsplash.com',
  unsplashTimeoutMs: 10000, // 對 Unsplash 的請求最多等幾毫秒，超過就當成失敗
  headers: {
    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
  }
};
