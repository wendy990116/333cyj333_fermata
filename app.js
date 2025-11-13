// Register service workers
(async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      // FCM worker must be at root path
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service workers registered');
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
  if (!('Notification' in window)) throw new Error('This browser does not support notifications');
  if (!firebase.messaging?.isSupported?.() || !firebase.messaging.isSupported()) throw new Error('Messaging not supported');

  messaging = firebase.messaging();
  // 需要在使用者操作下觸發
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission denied');
  const token = await messaging.getToken({ vapidKey: 'BPXpZoklt6iKHYiJGa71DevdGzCPh9V3KFZnGP3JWdC00bIr2nj-1UJ9okBJGjxBGP9QfNq6NPB6XpvvGLhxK10' });
  console.log('FCM token', token);

  // 存 token（用 token 當 doc id 方便去重）
  await db.collection('tokens').doc(token).set({
    createdAt: Date.now(),
    ua: navigator.userAgent,
  }, { merge: true });

  alert('通知啟用完成 ✨');
}

enableBtn?.addEventListener('click', async () => {
  try {
    // iOS 提示：若不是從主畫面打開，告知用戶
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS && !isIOSStandalone()) {
      alert('iOS 需要先用 Safari「加入主畫面」再開啟，才能允許推播唷。');
      return;
    }
    await initMessaging();
  } catch (e) {
    alert('啟用通知失敗：' + e.message);
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
