// Firebase Messaging Service Worker (compat for simplicity)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAFYAQO__cSHFpZUZbEImfQusyTZoSQ15Y",
  authDomain: "cyj333-g7.firebaseapp.com",
  projectId: "cyj333-g7",
  storageBucket: "cyj333-g7.firebasestorage.app",
  messagingSenderId: "990374083387",
  appId: "1:990374083387:web:e78405fbcc133aed28151e"
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
