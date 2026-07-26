const functions = require('firebase-functions');
const { logger } = functions;
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const FALLBACK_ORIGIN = 'https://henrysjourney.app';

exports.enqueueInviteEmail = functions.firestore
  .document('invites/{inviteId}')
  .onCreate(async (snap, context) => {
  const inviteId = context.params.inviteId;

  if (!snap) {
    logger.warn('Invite trigger fired without document snapshot', { inviteId });
    return;
  }

  const invite = snap.data() || {};
  const toUid = String(invite.toUid || '').trim();
  const fromUid = String(invite.fromUid || '').trim();
  const fromName = String(invite.fromName || 'Player').trim() || 'Player';
  const inviteType = String(invite.type || 'challenge').trim();

  if (!toUid || !fromUid) {
    logger.warn('Invite missing required participant IDs', { inviteId, toUid, fromUid });
    return;
  }

  try {
    const toUserSnap = await db.collection('users').doc(toUid).get();
    if (!toUserSnap.exists) {
      logger.info('Invite recipient user document not found, skipping email', { inviteId, toUid });
      return;
    }

    // Email is now stored in the owner-only private subdoc. The Admin SDK
    // bypasses security rules, so it can read it directly. Fall back to any
    // legacy top-level email on un-migrated docs.
    const privateSnap = await db.collection('users').doc(toUid).collection('private').doc('contact').get();
    const toEmail = String(
      (privateSnap.exists ? privateSnap.data()?.email : '') || toUserSnap.data()?.email || ''
    ).trim();
    if (!toEmail) {
      logger.info('Invite recipient has no email, skipping email', { inviteId, toUid });
      return;
    }

    const customLevelId = invite.customLevelId ? String(invite.customLevelId) : '';
    const appOrigin = process.env.APP_ORIGIN || FALLBACK_ORIGIN;
    const inviteLink = customLevelId
      ? `${appOrigin}/?invite=${inviteId}&level=${encodeURIComponent(customLevelId)}`
      : `${appOrigin}/?invite=${inviteId}`;

    const inviteKind = inviteType === 'friend_request'
      ? 'friend request'
      : inviteType === 'coop'
        ? 'co-op invite'
        : 'challenge';

    await db.collection('mail').add({
      to: [toEmail],
      message: {
        subject: `${fromName} sent you a ${inviteKind} in Henry's Journey`,
        text: `${fromName} sent you a ${inviteKind} in Henry's Journey. Open: ${inviteLink}`,
        html: `<p><strong>${fromName}</strong> sent you a <strong>${inviteKind}</strong> in Henry's Journey.</p><p><a href="${inviteLink}">Open invite</a></p>`
      },
      inviteId,
      toUid,
      fromUid,
      type: 'invite_email',
      createdAt: Date.now(),
      source: 'functions.enqueueInviteEmail'
    });

    logger.info('Invite email enqueued', { inviteId, toUid, inviteType });
  } catch (error) {
    logger.error('Failed to enqueue invite email', { inviteId, error });
  }
});
