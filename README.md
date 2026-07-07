# 📸 Unsplash PicShare - 圖片分享社群網站 (練習專案)

一個基於 **Unsplash API** 開發的圖片分享與收藏社群網站。本專案為架站與全端開發練習作品，旨在練習第三方 API 串接、前後端代理整合、資料庫設計（CRUD）以及符合著作權規範的網頁呈現。

## 🚀 專案特點
* **合法授權素材：** 全站圖片皆透過 Unsplash API 動態獲取，並嚴格遵守官方導流與攝影師致謝規範（Attribution）。
* **API 金鑰保護：** 實作後端代理層（Proxy Layer），前端不直接暴露 Unsplash Access Key，提升網站安全性。
* **資料庫輕量化：** 資料庫僅儲存圖片 ID、CDN 網址與必要元數據（Metadata），不佔用伺服器儲存空間。