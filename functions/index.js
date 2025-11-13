const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 每日排程（Asia/Taipei 時區）。
// 注意：排程可能需要啟用計費方案（免費額度每日一次足夠使用）。
exports.sendDaily = functions.pubsub
  .schedule('0 8 * * *') // 每天 08:00
  .timeZone('Asia/Taipei')
  .onRun(async () => {
    const db = admin.firestore();
    const tokensSnap = await db.collection('tokens').get();
    const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);

    // 當日訊息（可改為從你的 CMS/資料表拉）
    const msgDoc = await db.collection('messages').add({
      text: '今日小訊息：喝水深呼吸～',
      audioUrl: 'https://example.com/audio/today.mp3',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: '🎧 今日更新',
          body: '點進來聽音檔＋文字',
        },
        data: {
          url: '/',               // 點擊導向
          messageId: msgDoc.id,   // 客戶端可用來定位訊息
          kind: 'daily',
        },
      };

      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: payload.notification,
        data: payload.data,
        android: { priority: 'high' },
        apns: { headers: { 'apns-push-type': 'alert', 'apns-priority': '10' } },
      });

      // 移除失效 token
      const invalid = [];
      res.responses.forEach((r, i) => {
        if (!r.success) invalid.push(tokens[i]);
      });
      const batch = db.batch();
      invalid.forEach(t => batch.delete(db.collection('tokens').doc(t)));
      if (invalid.length) await batch.commit();
    }

    return null;
  });
