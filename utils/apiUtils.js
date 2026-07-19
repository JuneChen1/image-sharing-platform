function getUnsplashImageId(url) {
  if (!url.startsWith('https://unsplash.com/photos/')) {
    return {
      success: false
    };
  }
  const index = url.lastIndexOf('-');
  const imageId = url.slice(index + 1);

  return { success: true, imageId };
}

module.exports = { getUnsplashImageId };
