const path = require('path');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

module.exports = {
  getPhotoPage(req, res) {
    res.sendFile(path.join(PUBLIC_DIR, 'photo.html'));
  }
};
