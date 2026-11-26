# 圖個方便 | PicShare - 圖片分享網站

一個基於 [Unsplash API](https://unsplash.com/documentation) 開發的圖片分享與收藏社群網站。本專案為架站與全端開發練習作品，旨在練習第三方 API 串接、前後端代理整合、資料庫設計（CRUD）以及符合著作權規範的網頁呈現。

🔗 前往網頁：<https://picshare.junenaga.com>

---

## 專案特點
* 合法授權素材： 貼上 Unsplash 圖片網址後透過 API 動態獲取，並嚴格遵守官方導流與攝影師致謝規範（Attribution）。
* 版權友善設計： 本站不代管、不代理下載圖片檔案，僅儲存圖片網址與分類等中繼資料。其他使用者點擊「下載」時，一律導向該張照片的原始 Unsplash 頁面，由使用者在 Unsplash 完成下載。
* API 金鑰保護： 實作後端代理層（Proxy Layer），前端不直接暴露 Unsplash Access Key，提升網站安全性。
* 資料庫輕量化： 資料庫僅儲存圖片 ID、CDN 網址與必要元數據（Metadata），不佔用伺服器儲存空間。
* 容器化與雲端部署： 以 Docker Compose 打包，部署在 AWS（EC2＋RDS），透過 Cloudflare Tunnel 對外提供 HTTPS，主機不對外開放任何入站埠。

---

## 功能清單 (Features)

* 探索 Unsplash 圖片： 在「找圖片」頁輸入關鍵字，即時向 Unsplash API 撈取高畫質攝影照片，方便使用者尋找想分享的圖片（未登入也能搜尋）。
* 首頁瀏覽與篩選： 網站首頁提供標籤選單，供使用者依分類瀏覽他人分享的照片；搜尋框可搜尋站內照片的分享者或分類，並可切換「最新／熱門」排序。
* 帳號系統： 註冊、登入、登出、修改個人資料、忘記密碼和刪除帳號等功能。
* 分享照片至社群： 登入後貼上 **Unsplash 圖片網址**（目前僅限 Unsplash 來源），自行輸入一個或多個分類名稱（可用空白一次輸入多個，最多 10 個）後分享至本站首頁。
* 下載導流： 其他使用者在分享列表點擊「下載」時，本站不代為下載或代理圖片檔案，而是將使用者導向該張照片的原始 Unsplash 頁面。
* 收藏庫： 可新增、改名、刪除。同一張照片可放進多個收藏庫，每人最多 10 個收藏庫。
* 分享紀錄： 查看自己（或其他使用者）分享過的照片。
* 管理後台： 僅管理員可進入。可搜尋與篩選使用者、停權／解除停權、強制刪除照片、匯出刪除紀錄 CSV，並查看 Unsplash API 剩餘額度。
* 中英雙語介面： 繁體中文與 English 可隨時切換。
* 著作權致謝欄位： 每張照片皆清晰標示攝影師並附帶官方要求的導流連結。
* 隱私權政策與使用者條款： 站內提供兩份頁面，說明收集的資料、第三方服務與使用規範。

---

## 安全設計
* 帳號安全：密碼只存 bcrypt 雜湊值，以 JWT 驗證登入，並對登入與註冊等敏感操作做請求限流。
* 輸入與輸出：後端做輸入驗證，前端輸出做 escape，降低注入與 XSS 風險。
* 機密與依賴：API 金鑰只存在後端環境變數，前端載入的 CDN 檔案加上 SRI 完整性檢查。

---

## 專案技術
1. Node.js v24.x
2. Express v5.3.0
3. pg v8.23.1
4. typeorm v1.1.2
5. dotenv v17.4.2
6. cors v2.8.6
7. express-rate-limit v8.7.2
8. bcrypt v6.0.0
9. jsonwebtoken v9.0.3
10. nodemailer v10.3.1
11. Bootstrap v5.3.3（CDN）
12. JavaScript（前端無框架）
13. Docker、Docker Compose

---

## 第三方服務
1. PostgreSQL
2. Unsplash API
3. SMTP 郵件服務（忘記密碼時寄送重設連結；使用 Brevo，以自己的網域寄信）
4. 部署：AWS（EC2、RDS）、Cloudflare（DNS、Tunnel）


🚀 取得 Unsplash API 憑證
*  前往 [Unsplash Developers](https://unsplash.com/developers) 註冊帳號。
*  建立新應用程式 (New Application) 並取得 **Access Key**。
---

## 本地開發環境架設
1. 複製專案
```bash
git clone https://github.com/JuneChen1/image-sharing-platform.git
```

2. 移動到專案資料夾
```bash
cd image-sharing-platform
```

3. 環境變數設定：將 `.env.example` 改成 `.env`，並填入相關欄位（各欄位的說明、必填與選填、範例值請見 `.env.example` 裡的註解；部署用的變數如 `DATABASE_SSL`、`TRUST_PROXY`、`TUNNEL_TOKEN` 也在裡面，本機開發不用設）

4. 安裝套件：
```bash
npm install
```

5. 建立資料表：
```bash
npm run migration:run
```

6. （選用）種子資料與管理員帳號：
```bash
npm run seed
npm run seed:admin
```
> ⚠️ `npm run seed` 會**先清空所有資料表**，再寫入示範用的分類、帳號與照片，**只能在空的開發資料庫執行**。`npm run seed:admin` 會用 `.env` 的 `ADMIN_USERNAME`、`ADMIN_EMAIL`、`ADMIN_PASSWORD` 建立管理員，對已存在的帳號只會設定角色，不會清空資料或改密碼。

7. 啟動專案：
```bash
npm start
```

---

## 使用 Docker 執行（選用）

資料庫放在容器外面（本機或雲端的 PostgreSQL），Compose 只啟動後端。

1. 依上方步驟設定好 `.env`。資料庫在**本機**時，另外在 `.env` 加 `DOCKER_DATABASE_URL`（主機名要用 `host.docker.internal`，說明見 `.env.example`）；連雲端資料庫（例如 RDS）直接用 `DATABASE_URL` 即可。

2. 建立映像檔並啟動：
```bash
docker compose up --build
```

3. 建立資料表（不會自動執行）：
```bash
docker compose run --rm app npm run migration:run
```

4. 開啟 <http://localhost:3000>，健康檢查在 <http://localhost:3000/health>。

> 容器的 3000 埠只綁在本機（`127.0.0.1`），不會對區域網路開放。

---

### ⚖️ 著作權與免責聲明
網站內所有攝影圖片皆經由 Unsplash API 引入，圖片著作權屬原攝影師與 Unsplash 平台所有。