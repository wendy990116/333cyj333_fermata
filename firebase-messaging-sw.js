// Firebase Messaging Service Worker (compat for simplicity)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// 背景推播
messaging.onBackgroundMessage((payload) => {
  const data = payload.notification || {};
  const body = data.body || (payload.data && payload.data.body) || '';
  const title = data.title || (payload.data && payload.data.title) || '新訊息';
  const url = (payload.data && payload.data.url) || '/';

  self.registration.showNotification(title, {
    body,
    data: { url },
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
  });
});
