const appError = require('./appError');
const {
  verifyCustomCategories,
  isSafeText,
  isHttpsUrl
} = require('./validUtils');
const { noteMaxLength, originUrlMaxLength } = require('../config/constants');

// 分類：multipart 沒有陣列，只送一個時 multer 給字串、送多個時給陣列。
// 先 trim、不分大小寫去重（保留第一次出現的寫法，與資料庫 categories.name 的 citext 一致），再驗證數量與內容，
// 所以 ["Cat", "cat"] 只算 1 個
function parseCategories(raw) {
  const list = raw === undefined ? [] : [].concat(raw);
  if (!list.every((name) => typeof name === 'string')) {
    throw appError('INVALID_CATEGORIES');
  }

  const unique = new Map();
  list.forEach((name) => {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!unique.has(key)) unique.set(key, trimmed);
  });

  // 去重後不合格（空的、超過 10 個、含 < >、太長）
  const names = [...unique.values()];
  if (!verifyCustomCategories(names)) throw appError('INVALID_CATEGORIES');

  return names;
}

function parseIsOriginal(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw appError('INVALID_FIELDS');
}

// 原創：連結選填（例如作品集），有填就要合格；非原創：連結必填
function parseOriginUrl(value, isOriginal) {
  if (value !== undefined && typeof value !== 'string') {
    throw appError('INVALID_FIELDS');
  }

  const trimmed = (value ?? '').trim();
  if (trimmed === '') {
    if (!isOriginal) throw appError('ORIGIN_URL_REQUIRED');
    return null;
  }

  if (!isHttpsUrl(trimmed, originUrlMaxLength)) {
    throw appError('INVALID_ORIGIN_URL');
  }
  return trimmed;
}

// 備註：選填，空字串當作沒有備註（存成 NULL）
function parseNote(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') throw appError('INVALID_NOTE');

  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!isSafeText(trimmed, noteMaxLength)) throw appError('INVALID_NOTE');
  return trimmed;
}

// 驗證並整理上傳表單的文字欄位（req.body）；任何一項不合格就丟 appError
function parseUploadFields(body) {
  const isOriginal = parseIsOriginal(body.isOriginal);

  return {
    customCategories: parseCategories(body.customCategories),
    isOriginal,
    originUrl: parseOriginUrl(body.originUrl, isOriginal),
    note: parseNote(body.note)
  };
}

module.exports = { parseUploadFields };
