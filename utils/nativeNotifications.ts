// Native push + local notifications wrapper.
// - Push (APNs/FCM) delivers server-sent messages (friend invites, tournament
//   round starting, streak-in-jeopardy) — requires the user to have granted
//   Notification permission AND an APNs cert wired to Firebase Cloud Messaging.
// - Local notifications are scheduled from JS and fire on-device — used for
//   "keep your streak alive!" reminders 22h after last play.
//
// The web build is a no-op; only Capacitor iOS/Android has real behavior.

import { isNative } from './nativeBridge';

export interface NotifPermission {
    granted: boolean;
    determined: boolean; // false if the user has never been asked
}

/**
 * Ask the user for notification permission.
 * On iOS, this shows the system OS-level prompt (once per install).
 */
export const requestNotificationPermission = async (): Promise<NotifPermission> => {
    if (!isNative()) return { granted: false, determined: true };
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const status = await PushNotifications.checkPermissions();
        if (status.receive === 'granted') return { granted: true, determined: true };
        if (status.receive === 'denied')  return { granted: false, determined: true };
        const req = await PushNotifications.requestPermissions();
        return { granted: req.receive === 'granted', determined: true };
    } catch (e) {
        console.warn('[notifications] permission check failed:', e);
        return { granted: false, determined: false };
    }
};

/**
 * Register for APNs (via Capacitor) and return the device token.
 * The token needs to be sent to your backend/Firebase so pushes can target
 * this device.
 */
export const registerForPush = async (
    onToken: (token: string) => void,
    onError?: (err: any) => void,
): Promise<void> => {
    if (!isNative()) return;
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.addListener('registration', (t) => onToken(t.value));
        await PushNotifications.addListener('registrationError', (e) => onError?.(e));
        await PushNotifications.register();
    } catch (e) {
        onError?.(e);
    }
};

/**
 * Schedule a local reminder to fire ~22h after the last time the player
 * played. Cancels any existing "streak" reminder so we don't stack them.
 */
export const scheduleStreakReminder = async (lastPlayedMs: number, streakCount: number): Promise<void> => {
    if (!isNative()) return;
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        // Cancel prior reminder if any
        const pending = await LocalNotifications.getPending();
        const priorIds = pending.notifications.filter(n => n.id === 100).map(n => ({ id: n.id }));
        if (priorIds.length) await LocalNotifications.cancel({ notifications: priorIds });

        // Fire 22 hours after last play — before the streak actually breaks.
        const at = new Date(lastPlayedMs + 22 * 60 * 60 * 1000);
        if (at.getTime() < Date.now() + 5 * 60 * 1000) return; // too soon, skip

        await LocalNotifications.schedule({
            notifications: [{
                id: 100,
                title: streakCount > 0 ? `🔥 ${streakCount}-day streak in jeopardy!` : "Ready for today's puzzle?",
                body: streakCount > 0
                    ? "A quick daily challenge keeps your streak alive."
                    : "One quick puzzle to start the day.",
                schedule: { at, allowWhileIdle: true },
                sound: undefined,
                smallIcon: 'ic_notification',
            }],
        });
    } catch (e) {
        console.warn('[notifications] scheduleStreakReminder failed:', e);
    }
};

/** Cancel the pending streak reminder (call when the user opens the app). */
export const clearStreakReminder = async (): Promise<void> => {
    if (!isNative()) return;
    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id: 100 }] });
    } catch {}
};
