// Firebase 初始設定
const firebaseConfig = {
  apiKey: "AIzaSyAFYAQO__cSHFpZUZbEImfQusyTZoSQ15Y",
  authDomain: "cyj333-g7.firebaseapp.com",
  projectId: "cyj333-g7",
  storageBucket: "cyj333-g7.appspot.com",
  messagingSenderId: "990374083387",
  appId: "1:990374083387:web:e78405fbcc133aed28151e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// 密碼設定
const PASSWORD = "333cyj1116";

// 表單 DOM 取得
const form = document.getElementById("uploadForm");
const transcript = document.getElementById("transcript");
const mediaFile = document.getElementById("mediaFile");
const dateInput = document.getElementById("dateInput");
const result = document.getElementById("result");

// 日期自動是今天
dateInput.value = new Date().toISOString().slice(0,10);

// 密碼驗證
let inputPass = null;
while (inputPass !== PASSWORD) {
  inputPass = prompt("請輸入上傳密碼：");
  if (inputPass === null) break;
}
if (inputPass !== PASSWORD) {
  document.body.innerHTML = "<h2>❌ 密碼錯誤，暫時無法使用上傳頁面。</h2>";
}

// 表單送出
form.onsubmit = async (e) => {
  e.preventDefault();
  result.textContent = "";

  if (!transcript.value.trim()) {
    result.textContent = "請填寫逐字稿文字";
    return;
  }
  if (!mediaFile.files[0]) {
    result.textContent = "請選擇音檔或影片檔案";
    return;
  }

  const file = mediaFile.files[0];
  const mimeType = file.type;
  const isVideo = mimeType.startsWith("video/");
  const mediaType = isVideo ? "video" : "audio";
  const dateStr = dateInput.value;
  const remoteName = `media/${dateStr}_${file.name}`;

  result.textContent = "上傳中...";

  try {
    const snap = await storage.ref(remoteName).put(file);
    const url = await snap.ref.getDownloadURL();

    await db.collection("messages").add({
      text: transcript.value.trim(),
      mediaUrl: url,
      mediaType: mediaType,
      fileName: file.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      date: dateStr
    });

    result.textContent = "✓ 上傳成功！";
    form.reset();
    dateInput.value = new Date().toISOString().slice(0,10);
  } catch (err) {
    result.textContent = "上傳錯誤：" + err.message;
  }
};
