const crypto = require('crypto');

// 上傳圖片的儲存層。其他程式（上傳 API、讀取路由、刪除）只呼叫這裡，不知道底下用哪個驅動。
// STORAGE_DRIVER=local（預設，存在本機磁碟）；之後會加 s3，介面一樣：save、read、remove
const DRIVERS = {
  local: () => require('./local')
};

const driverName = process.env.STORAGE_DRIVER || 'local';
if (!DRIVERS[driverName]) {
  throw new Error(`不支援的 STORAGE_DRIVER：${driverName}`);
}
const driver = DRIVERS[driverName]();

// 上傳的圖一律由 sharp 重新編碼成 WebP，所以副檔名與 Content-Type 固定
const CONTENT_TYPE = 'image/webp';

// key 的格式是 <使用者 id>/<隨機 uuid>.webp（都是我們自己產生的）。
// 讀取路由的 key 來自網址，所以嚴格比對這個格式，其他一律當作不存在，也擋掉 ../ 之類的路徑穿越
const KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

const isValidKey = (key) => typeof key === 'string' && KEY_PATTERN.test(key);

// 產生新的儲存 key（存進資料庫的 file_key）。檔名用隨機 uuid，不用使用者的原始檔名
const newKey = (userId) => `${userId}/${crypto.randomUUID()}.webp`;

// 網站上顯示用的圖片網址（存進資料庫的 image_url）。與驅動無關，換驅動不用改資料
const publicUrl = (key) => `/uploads/${key}`;

async function save(key, buffer) {
  if (!isValidKey(key)) throw new Error('不合法的儲存 key');
  await driver.save(key, buffer);
}

// 回傳 { stream, size }；key 格式不對或檔案不存在回傳 null
async function read(key) {
  if (!isValidKey(key)) return null;
  return driver.read(key);
}

// 回傳是否真的刪到檔案；key 格式不對或檔案不存在回傳 false
async function remove(key) {
  if (!isValidKey(key)) return false;
  return driver.remove(key);
}

// 一次刪多個檔案，用在「資料庫已經刪掉照片之後」順手清掉實體檔案。
// null／undefined（Unsplash 來源的照片沒有 file_key）會略過；單一檔案刪除失敗只記日誌，不丟錯：
// 資料已經刪成功了，不能因為清檔案失敗而讓整個請求變成失敗（最壞的結果是留下一個孤兒檔案，不會再有網址指向它）
async function removeMany(keys) {
  const validKeys = keys.filter((key) => key !== null && key !== undefined);
  await Promise.all(
    validKeys.map((key) =>
      remove(key).catch((error) => {
        console.error(`刪除上傳檔案失敗（key：${key}）：`, error);
      })
    )
  );
}

module.exports = {
  CONTENT_TYPE,
  isValidKey,
  newKey,
  publicUrl,
  save,
  read,
  remove,
  removeMany
};
