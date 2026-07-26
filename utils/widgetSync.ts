// Push the game's current state into the App Group UserDefaults suite that
// the HenryWidget SwiftUI extension reads from on refresh. Web/dev is a no-op.
//
// Values written:
//   streak         Int   — current daily streak
//   savingsCurrent Int   — coins saved toward the current goal
//   savingsGoal    Int   — the target
//   currentLevel   Int   — 1-based level number to resume
//   worldName      String — display name of the current world

import { isNative } from './nativeBridge';

const GROUP = 'group.com.henrysjourney.app.shared';

export interface WidgetSnapshot {
    streak: number;
    savingsCurrent: number;
    savingsGoal: number;
    currentLevel: number;
    worldName: string;
}

export const pushWidgetSnapshot = async (snap: WidgetSnapshot): Promise<void> => {
    if (!isNative()) return;
    try {
        const { Preferences } = await import('@capacitor/preferences');
        // The Capacitor Preferences plugin supports a `group` option so the
        // write lands in the shared App Group container the widget reads from.
        await Preferences.configure({ group: GROUP } as any);
        await Preferences.set({ key: 'streak',         value: String(snap.streak) });
        await Preferences.set({ key: 'savingsCurrent', value: String(snap.savingsCurrent) });
        await Preferences.set({ key: 'savingsGoal',    value: String(snap.savingsGoal) });
        await Preferences.set({ key: 'currentLevel',   value: String(snap.currentLevel) });
        await Preferences.set({ key: 'worldName',      value: snap.worldName });

        // Ask WidgetKit to reload timelines so the change appears within seconds
        // rather than at the next 30-min tick.
        const w: any = (window as any);
        if (w.WidgetsBridge?.reloadAllTimelines) {
            try { await w.WidgetsBridge.reloadAllTimelines(); } catch {}
        }
    } catch (e) {
        console.warn('[widget] pushWidgetSnapshot failed:', e);
    }
};
