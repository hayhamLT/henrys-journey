/* ===========================================================================
   ONE-TIME MIGRATION: move users/{uid}.email -> users/{uid}/private/contact
   ---------------------------------------------------------------------------
   Legacy user docs stored `email` on the world-readable public doc, so any
   signed-in user could read/enumerate every (child) user's email. The app now
   writes email only to the owner/admin-readable private subdoc; run this once
   to backfill existing docs and strip the public `email` field.

   Run with the Admin SDK (NOT shipped to the client):
     GOOGLE_APPLICATION_CREDENTIALS=<service-account.json> \
       GCLOUD_PROJECT=henry-s-journey node functions/scripts/migrateEmailsToPrivate.js
   or against the emulator:
     firebase emulators:exec "node functions/scripts/migrateEmailsToPrivate.js"

   Idempotent: re-running is safe (docs without a top-level email are skipped).
   =========================================================================== */
const admin = require('firebase-admin');

async function main() {
  const projectId = process.env.GCLOUD_PROJECT || 'henry-s-journey';
  admin.initializeApp({ projectId });
  const db = admin.firestore();
  const { FieldValue } = admin.firestore;

  const usersSnap = await db.collection('users').get();
  let migrated = 0, skipped = 0;
  for (const userDoc of usersSnap.docs) {
    const email = userDoc.data()?.email;
    if (!email) { skipped++; continue; }
    await db.collection('users').doc(userDoc.id).collection('private').doc('contact')
      .set({ email }, { merge: true });
    await db.collection('users').doc(userDoc.id)
      .update({ email: FieldValue.delete() });
    migrated++;
  }
  console.log(`MIGRATION DONE migrated=${migrated} skipped(noEmail)=${skipped} total=${usersSnap.size}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
