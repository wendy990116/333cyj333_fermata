// Register service workers
let swRegistration = null;

(async () => {
  if ('serviceWorker' in navigator) {
    try {
      // 註冊一般的 service worker
      await navigator.serviceWorker.register('sw.js');
      console.log('Service worker registered');
      
      // 等待 service worker 啟動
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
    } catch (e) {
      console.warn('SW register failed', e);
    }
  }
})();

// Firebase config ——— 替換成你的專案設定 ——
const firebaseConfig = {
  apiKey: "AIzaSyAFYAQO__cSHFpZUZbEImfQusyTZoSQ15Y",
  authDomain: "cyj333-g7.firebaseapp.com",
  projectId: "cyj333-g7",
  storageBucket: "cyj333-g7.firebasestorage.app",
  messagingSenderId: "990374083387",
  appId: "1:990374083387:web:e78405fbcc133aed28151e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let messaging;

const enableBtn = document.getElementById('enablePush');

function isIOSStandalone() {
  // iOS PWA: 必須以「加入主畫面」方式開啟才能收推播
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function initMessaging() {
  console.log('開始初始化通知...');
  
  if (!('Notification' in window)) {
    console.error('瀏覽器不支援通知');
    throw new Error('此瀏覽器不支援通知功能');
  }
  
  console.log('檢查 Firebase Messaging 支援...');
  if (!firebase.messaging?.isSupported?.() || !firebase.messaging.isSupported()) {
    console.error('Firebase Messaging 不支援');
    throw new Error('此裝置不支援 Firebase 推播');
  }

  // 確保 service worker 已經啟動
  console.log('等待 Service Worker 啟動...');
  await navigator.serviceWorker.ready;
  console.log('Service Worker 已就緒');
  
  messaging = firebase.messaging();
  
  // 需要在使用者操作下觸發
  console.log('請求通知權限...');
  console.log('目前權限狀態:', Notification.permission);
  
  const perm = await Notification.requestPermission();
  console.log('權限請求結果:', perm);
  
  if (perm !== 'granted') {
    throw new Error('通知權限被拒絕，請到手機設定開啟');
  }
  
  console.log('取得 FCM token...');
  const token = await messaging.getToken({ 
    vapidKey: 'BPXpZoklt6iKHYiJGa71DevdGzCPh9V3KFZnGP3JWdC00bIr2nj-1UJ9okBJGjxBGP9QfNq6NPB6XpvvGLhxK10',
    serviceWorkerRegistration: await navigator.serviceWorker.ready
  });
  
  console.log('FCM token 取得成功:', token);

  // 存 token（用 token 當 doc id 方便去重）
  console.log('儲存 token 到資料庫...');
  await db.collection('tokens').doc(token).set({
    createdAt: Date.now(),
    ua: navigator.userAgent,
  }, { merge: true });

  console.log('通知啟用完成！');
  alert('通知啟用完成 ✨');
}

enableBtn?.addEventListener('click', async () => {
  console.log('=== 點擊啟用通知按鈕 ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
  console.log('目前通知權限:', Notification.permission);
  
  // 禁用按鈕避免重複點擊
  enableBtn.disabled = true;
  enableBtn.textContent = '處理中...';
  
  try {
    // iOS 提示：若不是從主畫面打開，告知用戶
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS && !isIOSStandalone()) {
      alert('iOS 需要先用 Safari「加入主畫面」再開啟，才能允許推播唷。');
      enableBtn.disabled = false;
      enableBtn.textContent = '啟用通知';
      return;
    }
    
    await initMessaging();
    enableBtn.textContent = '已啟用 ✓';
  } catch (e) {
    console.error('啟用通知失敗:', e);
    alert('啟用通知失敗：' + e.message + '\n\n請檢查:\n1. 是否已允許瀏覽器通知權限\n2. 手機設定是否封鎖了通知');
    enableBtn.disabled = false;
    enableBtn.textContent = '啟用通知';
  }
});

// 監聽即時訊息（Firestore）
const list = document.getElementById('messages');
function render(msg) {
  const li = document.createElement('li');
  li.className = 'msg';
  li.innerHTML = `
    <div class="bubble">
      <div class="text">${(msg.text || '').replace(/</g,'&lt;')}</div>
      ${msg.audioUrl ? `<audio class="audio" controls preload="none" src="${msg.audioUrl}"></audio>` : ''}
      <div class="meta">${msg.createdAt ? new Date(msg.createdAt.seconds ? msg.createdAt.seconds*1000 : msg.createdAt).toLocaleString() : ''}</div>
    </div>
  `;
  list.appendChild(li);
}

db.collection('messages').orderBy('createdAt', 'desc').limit(50).onSnapshot(snap => {
  list.innerHTML = '';
  snap.forEach(doc => render(doc.data()));
});

// 前景訊息
if (firebase.messaging?.isSupported?.() && firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  messaging.onMessage(payload => {
    console.log('Foreground message:', payload);
    // 可選：響鈴或提示
  });
}
