const admin = require('firebase-admin');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set. Run this script via firebase emulators:exec.');
  }

  const projectId = process.env.GCLOUD_PROJECT || 'henry-s-journey';
  admin.initializeApp({ projectId });
  const db = admin.firestore();

  const now = Date.now();
  const recipientUid = `verify-to-${now}`;
  const senderUid = `verify-from-${now}`;

  await db.collection('users').doc(recipientUid).set({
    displayName: 'Verify Recipient',
    searchName: 'verify recipient',
    photoURL: '',
    lastLogin: now,
    totalScore: 0
  }, { merge: true });
  // Email now lives in the owner-only private subdoc (matches the new contract).
  await db.collection('users').doc(recipientUid).collection('private').doc('contact').set({
    email: 'verify-recipient@example.com'
  }, { merge: true });

  await db.collection('users').doc(senderUid).set({
    displayName: 'Verify Sender',
    searchName: 'verify sender',
    email: 'verify-sender@example.com',
    photoURL: '',
    lastLogin: now,
    totalScore: 0
  }, { merge: true });

  const inviteRef = await db.collection('invites').add({
    fromUid: senderUid,
    fromName: 'Verify Sender',
    toUid: recipientUid,
    status: 'pending',
    type: 'challenge',
    timestamp: now,
    date: 'verify'
  });

  const timeoutMs = 12000;
  const pollEveryMs = 500;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const mailSnap = await db.collection('mail').where('inviteId', '==', inviteRef.id).limit(1).get();
    if (!mailSnap.empty) {
      const mailData = mailSnap.docs[0].data();
      console.log('VERIFY_OK invite trigger enqueued mail', {
        inviteId: inviteRef.id,
        mailId: mailSnap.docs[0].id,
        to: mailData.to,
        source: mailData.source || 'unknown'
      });
      return;
    }
    await wait(pollEveryMs);
  }

  throw new Error(`VERIFY_FAIL no mail doc found for invite ${inviteRef.id} within ${timeoutMs}ms`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
