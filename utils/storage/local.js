const fs = require('fs');
const path = require('path');

// 本機磁碟驅動：開發階段用。目錄預設放在專案根目錄的 uploads/，也可以用 UPLOADS_DIR 指定。
// 不放進 public/：public/ 會被 express.static 直接送出，等於繞過下架與快取設定，圖片一律走專用的讀取路由
const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads')
);

// key 轉成實際檔案路徑，並確認沒有跑出 UPLOADS_DIR（防路徑穿越）。
// index.js 已經用嚴格格式檢查過 key，這裡是第二道防線
function resolvePath(key) {
  const filePath = path.resolve(UPLOADS_DIR, key);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('不合法的儲存路徑');
  }
  return filePath;
}

async function save(key, buffer) {
  const filePath = resolvePath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  // wx：檔案已存在就失敗，不會默默蓋掉別人的圖
  await fs.promises.writeFile(filePath, buffer, { flag: 'wx' });
}

// 找不到回傳 null；找到回傳 { stream, size }
async function read(key) {
  const filePath = resolvePath(key);
  try {
    const stat = await fs.promises.stat(filePath);
    return { stream: fs.createReadStream(filePath), size: stat.size };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// 刪除成功回傳 true，檔案本來就不存在回傳 false（不當成錯誤：重複刪除不該讓取消分享失敗）
async function remove(key) {
  try {
    await fs.promises.unlink(resolvePath(key));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

module.exports = { save, read, remove };
