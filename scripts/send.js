// 用於 GitHub Actions / 本地：每天呼叫一次，送推播 + 新增一則訊息
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey && privateKey.includes('\n')) privateKey = privateKey.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const db = getFirestore();
const messaging = getMessaging();

(async () => {
  const snap = await db.collection('tokens').get();
  const tokens = snap.docs.map(d => d.id).filter(Boolean);

  // 寫入當日訊息
  const doc = await db.collection('messages').add({
    text: '今日小訊息（來自 GitHub Actions）',
    audioUrl: 'https://example.com/audio/today.mp3',
    createdAt: FieldValue.serverTimestamp(),
  });

  if (tokens.length) {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: '🎧 今日更新', body: '點進來聽音檔＋文字' },
      data: { url: '/', messageId: doc.id, kind: 'daily' },
    });

    const invalid = [];
    res.responses.forEach((r, i) => { if (!r.success) invalid.push(tokens[i]); });
    const batch = db.batch();
    invalid.forEach(t => batch.delete(db.collection('tokens').doc(t)));
    if (invalid.length) await batch.commit();
    console.log('Sent:', tokens.length, 'Invalid removed:', invalid.length);
  } else {
    console.log('No tokens yet.');
  }
})().catch(e => { console.error(e); process.exit(1); });
