// 所有錯誤的 HTTP 狀態碼與預設訊息集中在這裡，使用方式：appError('EMAIL_TAKEN')
// 新增錯誤時，前端 public/js/i18n.js 的 zh、en 也要補上 error.<CODE>
module.exports = {
  // 欄位與格式
  INVALID_FIELDS: { status: 400, message: '欄位未填寫正確' },
  INVALID_NAME: { status: 400, message: '名稱格式錯誤' },
  INVALID_CATEGORIES: { status: 400, message: '分類格式錯誤' },
  INVALID_URL: { status: 400, message: '網址錯誤' },
  URL_REQUIRED: { status: 400, message: '網址為必填' },
  INVALID_ID: { status: 400, message: 'ID格式錯誤' },
  INVALID_PHOTO_ID: { status: 400, message: 'photo id 格式錯誤' },
  INVALID_COLLECTION_ID: { status: 400, message: 'collection id 格式錯誤' },
  INVALID_UNSPLASH_ID: { status: 400, message: '無效的 unsplashId 格式' },
  INVALID_PAGE: { status: 400, message: '頁數只能是正整數' },
  INVALID_PAGINATION: {
    status: 400,
    message: '頁數(page)和每頁筆數(limit)只能是正整數'
  },
  LIMIT_TOO_LARGE: { status: 400, message: '每頁筆數(limit)不能大於100' },
  INVALID_SORT: { status: 400, message: '排序只能是 latest 或 popular' },
  SEARCH_KEYWORD_REQUIRED: { status: 400, message: '搜尋關鍵字為必填' },
  NOTHING_TO_UPDATE: { status: 400, message: '沒有可更新的欄位' },
  PAYLOAD_TOO_LARGE: { status: 413, message: '傳送的內容太大，請縮小後再試' },

  // 帳號與密碼
  EMAIL_TAKEN: { status: 409, message: 'Email 已被使用' },
  EMAIL_IMMUTABLE: { status: 400, message: 'Email 不可修改' },
  INVALID_CREDENTIALS: { status: 400, message: '使用者不存在或密碼輸入錯誤' },
  PASSWORD_MISMATCH: { status: 400, message: '兩次輸入的密碼不一致' },
  OLD_PASSWORD_WRONG: { status: 400, message: '舊密碼錯誤' },
  NEW_PASSWORD_SAME_AS_OLD: { status: 400, message: '新密碼不可與舊密碼相同' },
  PASSWORD_WRONG: { status: 400, message: '密碼錯誤' },
  RESET_LINK_INVALID: { status: 400, message: '重設連結無效或已過期' },

  // 登入狀態與權限
  UNAUTHORIZED: { status: 401, message: '請先登入' },
  TOKEN_INVALID: { status: 401, message: '無效的 token' },
  TOKEN_EXPIRED: { status: 401, message: 'Token 已過期' },
  ACCOUNT_BANNED: {
    status: 403,
    message: '您的帳號已被停權，如有疑問請聯絡管理者'
  },
  FORBIDDEN: { status: 403, message: '您沒有權限執行此操作' },
  CANNOT_BAN_SELF: { status: 403, message: '無法停權自己的帳號' },
  CANNOT_BAN_ADMIN: { status: 403, message: '無法停權管理者帳號' },
  CANNOT_DELETE_ADMIN: { status: 403, message: '不可刪除管理者帳號' },

  // 資源
  NOT_FOUND: { status: 404, message: '查無此資料' },
  USER_NOT_FOUND: { status: 404, message: '查無此使用者' },
  ROUTE_NOT_FOUND: { status: 404, message: 'Page Not Found' },

  // 收藏庫與分享
  COLLECTION_LIMIT_REACHED: { status: 400, message: '最多只能有 10 個收藏庫' },
  COLLECTION_NAME_TAKEN: { status: 409, message: '已有同名的收藏庫' },
  ALREADY_IN_COLLECTION: { status: 409, message: '不可重複加入' },
  ALREADY_SHARED: { status: 409, message: '你已經分享過這張照片了' },

  // Unsplash 上游（查單張照片回 404 用 UNSPLASH_PHOTO_NOT_FOUND；其他路徑上游回 404 時呼叫端會用 { status: 404 } 覆寫）
  UNSPLASH_PHOTO_NOT_FOUND: { status: 404, message: '找不到這張圖片' },
  UNSPLASH_BUSY: { status: 502, message: '圖片服務目前較忙碌，請稍後再試' },
  UNSPLASH_API_ERROR: { status: 502, message: 'Unsplash API error' },
  PHOTO_DATA_INCOMPLETE: {
    status: 502,
    message: '這張照片目前的資料不完整，暫時無法分享，請稍後再試'
  },

  // 系統
  TOO_MANY_REQUESTS: { status: 429, message: '請求過於頻繁，請稍後再試' },
  TOO_MANY_ATTEMPTS: { status: 429, message: '嘗試次數過多，請稍後再試' },
  SERVER_ERROR: { status: 500, message: '伺服器發生錯誤，請稍後再試' }
};
