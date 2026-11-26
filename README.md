# 圖個方便 | PicShare - 圖片分享網站

一個讓使用者上傳、分享與收藏照片的社群網站。本專案為架站與全端開發練習作品，旨在練習檔案上傳與處理、雲端部署、資料庫設計（CRUD）以及符合著作權規範的網頁呈現。

本專案原本以 [Unsplash API](https://unsplash.com/documentation) 作為照片來源，現已改為使用者自行上傳。

🔗 前往網頁：<https://picshare.junenaga.com>

---

## 專案特點
* 上傳圖片的安全處理： 以檔案內容（而非副檔名）判斷格式、限制檔案大小與像素、重新編碼為 WebP 並移除 EXIF（含拍攝位置）。
* 版權友善設計： 上傳時須標示是否為原創；非原創必須填寫來源連結並確認已取得授權。使用者條款載明著作權通知與取下方式，管理者可強制下架並留下稽核紀錄。
* 可替換的儲存層： 圖片儲存包成獨立模組，開發時存本機磁碟，線上存私有的 Amazon S3，切換只需改環境變數。
* 快取與下架兼顧： 圖片由後端代為讀取並設定快取標頭與 ETag，前面由 Cloudflare 快取；快取時間刻意設短，下架的圖片能在合理時間內消失。
* 容器化與雲端部署： 以 Docker Compose 打包，部署在 AWS（EC2＋RDS＋S3），透過 Cloudflare Tunnel 對外提供 HTTPS，主機不對外開放任何網站用的入站埠。

---

## 功能清單 (Features)

* 上傳分享： 登入後以拖放或選擇檔案上傳一張圖片（JPEG／PNG／WebP，最大 5 MB），設定分類（可用空白一次輸入多個，最多 10 個）、是否原創、來源連結與備註後分享。每人每天最多上傳 10 張、總量 100 張。
* 首頁瀏覽與篩選： 首頁提供標籤選單，依分類瀏覽照片；搜尋框可搜尋分享者或分類，並可切換「最新／熱門」排序。分類、排序與頁碼會記在網址上，從詳情頁返回時停在原本的位置。
* 照片詳情頁： 每張照片有自己的網址，顯示作者、來源、分類與備註，可收藏、下載，自己的照片可取消分享。
* 帳號系統： 註冊、登入、登出、修改個人資料、忘記密碼和刪除帳號。刪除帳號或取消分享時，上傳的圖片檔案會一併刪除。
* 收藏庫： 可新增、改名、刪除。同一張照片可放進多個收藏庫，每人最多 10 個收藏庫。
* 分享紀錄： 查看自己（或其他使用者）分享過的照片。
* 管理後台： 僅管理員可進入。可搜尋與篩選使用者、停權／解除停權、強制刪除照片、匯出刪除紀錄 CSV。
* 中英雙語介面： 繁體中文與 English 可隨時切換。
* 隱私權政策與使用者條款： 說明收集的資料、上傳內容的處理、著作權規範與取下方式。

---

## 安全設計
* 帳號安全：密碼只存 bcrypt 雜湊值，以 JWT 驗證登入，並對登入、註冊、上傳等操作做請求限流。
* 上傳檔案：只接受特定圖片格式（不收 SVG），限制大小與像素，由伺服器重新編碼；儲存檔名由系統產生，讀取時嚴格檢查路徑。
* 輸入與輸出：後端做輸入驗證，前端輸出做 escape，降低注入與 XSS 風險；使用者填寫的連結只接受 `https://`。
* 機密與雲端權限：機密只放在後端環境變數，S3 為私有 bucket，前端載入的 CDN 檔案加上 SRI 完整性檢查。

---

## 專案技術
1. Node.js v24.x
2. Express v5.3.0
3. pg v8.23.1
4. typeorm v1.1.2
5. multer v2.5.0
6. sharp v0.35.5
7. @aws-sdk/client-s3 v3
8. dotenv v17.4.2
9. cors v2.8.6
10. express-rate-limit v8.7.2
11. bcrypt v6.0.0
12. jsonwebtoken v9.0.3
13. nodemailer v10.3.1
14. Bootstrap v5.3.3（CDN）
15. JavaScript（前端無框架）
16. Docker、Docker Compose

---

## 第三方服務
1. PostgreSQL
2. Amazon S3（線上的圖片儲存）
3. SMTP 郵件服務（忘記密碼時寄送重設連結；使用 Brevo，以自己的網域寄信）
4. 部署：AWS（EC2、RDS、S3）、Cloudflare（DNS、Tunnel）

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
> Unsplash 功能停用中，`UNSPLASH_ACCESS_KEY` 是選填欄位，不用設定。

> 上傳的圖片預設存在專案根目錄的 `uploads/`（不進版控），不需要任何雲端帳號。要改存 S3 時設定 `STORAGE_DRIVER=s3`、`S3_BUCKET`、`S3_REGION`，憑證由 AWS CLI profile 或 IAM Role 提供。

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
>
> 容器內的程式沒有權限寫入本機磁碟，用 Docker 執行時要上傳圖片，請使用 S3（`STORAGE_DRIVER=s3`）。

---

### ⚖️ 著作權與免責聲明
使用者上傳的圖片，著作權屬上傳者或原著作權人；上傳者須保證擁有權利或已取得授權。來自 Unsplash 的照片，著作權屬原攝影師，依 Unsplash 授權使用。著作權通知與取下方式請見網站的使用者條款。
