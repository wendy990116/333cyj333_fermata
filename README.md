# PWA Daily Chat + Web Push（FCM）範本

目標：每天定時推播 → 點通知進來是「聊天室風格」畫面（一則文字 + 一段音檔）。

## 你會得到什麼
- 前端：PWA（可安裝到主畫面），支援 Android / iOS（iOS 需 16.4+ 並「加入主畫面」）。
- 推播：Firebase Cloud Messaging（FCM Web Push）。
- 資料：Firestore 儲存 `messages`（text、audioUrl、createdAt）與 `tokens`（裝置 token）。
- 定時：兩種方案擇一
  1) **Cloud Functions（排程）**：`functions/index.js`
  2) **GitHub Actions（免費 Cron）**：`.github/workflows/daily.yml` + `scripts/send.js`

---

## 快速開始（30 分鐘搞定）
1. **建立 Firebase 專案** → 啟用 Cloud Firestore、Cloud Messaging。
2. 下載 **Web App** 的設定，把 `app.js` / `firebase-messaging-sw.js` 內的 `firebaseConfig` 替換掉。
3. 在 FCM 產生 **Web Push VAPID Key**，把 `app.js` 的 `vapidKey` 填好。
4. 佈署到 HTTPS（推薦 GitHub Pages / Netlify）。
5. 手機打開網址：
   - Android：允許通知 →（建議）加入主畫面。
   - iOS：**Safari → 分享 → 加入主畫面** → 從主畫面開啟 → 按「啟用通知」。

> iOS 限制：普通 Safari 分頁不能收推播，必須從主畫面打開的 Web App。

6. Firestore 結構：
   - `messages/{autoId}`: `{ text: string, audioUrl?: string, createdAt: Timestamp }`
   - `tokens/{token}`: `{ createdAt: number, ua: string }`

7. 放一筆訊息測試：在 `messages` 建一筆文件（記得 `createdAt = serverTimestamp()`），前端就會顯示。

---

## 每天定時推播（選一種）

### 方案 A：Cloud Functions（Pub/Sub 排程）
> 可能需要開啟計費（免費額度夠每日一次使用）。
1) `cd functions && npm i firebase-admin firebase-functions`  
2) 修改 `index.js`：
   - 換上你的網址（`click_action`/`url`）。
   - 決定每天幾點（`timeZone('Asia/Taipei')` + cron）。
   - `audioUrl` 可放在雲端（e.g., Firebase Storage/任意 CDN）。
3) 部署：`firebase deploy --only functions`

### 方案 B：GitHub Actions（免費 cron）
1) 把本專案推到 GitHub。
2) 設定 GitHub Secrets：
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`（注意以 `-----BEGIN PRIVATE KEY-----` 開頭，換行要處理為多行）
3) 調整 `.github/workflows/daily.yml` 的排程時間（UTC）。
4) 調整 `scripts/send.js` 的訊息內容 / 文字 / 連結。
5) 每天到點會自動送出推播，同時在 Firestore 新增一則 `messages`。

---

## 安全性建議
- 將 token 存為文件 ID 減少重複。
- 在服務端發送推播時，先過濾無效 token（捕捉傳送錯誤後刪除）。
- iOS/Android 省電模式會影響到達時間，屬正常現象。

---

## 自訂
- UI 在 `styles.css`、render 在 `app.js → render()`。
- 想做「分組推播」：在 `tokens` 文件裡加 `group` 欄位，服務端按 group 分發送。
- 想讓使用者回覆：新增輸入框，將回覆寫回 Firestore（本範本預設唯讀 Feed）。

---

## 常見問題
- **iOS 沒跳通知？** 需 iOS 16.4+，且一定要「加入主畫面」後從主畫面開啟。
- **點通知沒有進到聊天？** 確認 `firebase-messaging-sw.js` 的 `url`/sw `notificationclick` 有帶 `/` 或你的路由。
- **每日音檔放哪？** 上傳到 Firebase Storage（匿名讀取或用簽名網址），把連結寫進當日 `messages`。

祝順利 ✨
