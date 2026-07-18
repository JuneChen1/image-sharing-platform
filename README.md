# 📸 圖個方便 | PicShare - 圖片分享網站

一個基於 [**Unsplash API**](https://unsplash.com/documentation) 開發的圖片分享與收藏社群網站。本專案為架站與全端開發練習作品，旨在練習第三方 API 串接、前後端代理整合、資料庫設計（CRUD）以及符合著作權規範的網頁呈現。

---

## 🚀 專案特點
* **合法授權素材：** 貼上 Unsplash 圖片網址後透過 API 動態獲取，並嚴格遵守官方導流與攝影師致謝規範（Attribution）。
* **版權友善設計：** 本站不代管、不代理下載圖片檔案，僅儲存圖片網址與分類等中繼資料。其他使用者點擊「下載」時，一律導向該張照片的原始 Unsplash 頁面，由使用者在 Unsplash 完成下載。
* **API 金鑰保護：** 實作後端代理層（Proxy Layer），前端不直接暴露 Unsplash Access Key，提升網站安全性。
* **資料庫輕量化：** 資料庫僅儲存圖片 ID、CDN 網址與必要元數據（Metadata），不佔用伺服器儲存空間。

---

## 📋 功能清單 (Features)

* **探索 Unsplash 圖片：** 首頁或探索頁可輸入關鍵字，即時向 Unsplash API 撈取高畫質攝影照片，方便使用者尋找想分享的圖片網址。
* **分享照片至社群：** 使用者貼上 **Unsplash 圖片網址**（目前僅限 Unsplash 來源），自行輸入一個或多個分類名稱後分享至本站首頁。
* **照片分類篩選：** 網站首頁提供標籤選單，供使用者依分類瀏覽他人分享的照片。
* **下載導流：** 其他使用者在分享列表點擊「下載」時，本站不代為下載或代理圖片檔案，而是將使用者導向該張照片的原始 Unsplash 頁面。
* **著作權致謝欄位：** 每張照片皆清晰標示「Photo by [攝影師] on Unsplash」並附帶官方要求的導流連結。

---

## 🔧 本地開發環境架設

### 1. 取得 Unsplash API 憑證
1. 前往 [Unsplash Developers](https://unsplash.com/developers) 註冊帳號。
2. 建立新應用程式 (New Application) 並取得 **Access Key**。

### 2. 環境變數設定
在後端專案根目錄建立 `.env` 檔案，並填入你的 API 金鑰：
```env
PORT=5000
UNSPLASH_ACCESS_KEY=你的_unsplash_access_key_放這裡
DATABASE_URL=你的_資料庫_連線字串
```

### 3. 安裝套件並啟動專案
```bash
npm install
npm start
```

---

### ⚖️ 著作權與免責聲明
本網站為個人程式設計練習專案，非營利使用。網站內所有攝影圖片皆經由 Unsplash API 引入，圖片著作權屬原攝影師與 Unsplash 平台所有。