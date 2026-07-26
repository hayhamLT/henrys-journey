// Signature Apple platform integrations — Handoff, App Shortcuts, Screen
// Time / parental gate, and SharePlay hooks. All are Capacitor plugin bridges
// (Swift-side plugin work to follow); JS side has stable APIs so the game
// code can start calling them today and get progressively enriched.

import { isNative } from './nativeBridge';

async function callPlugin(name: string, method: string, data?: any) {
    const cap = (window as any).Capacitor;
    if (!cap?.Plugins?.[name]) return null;
    try {
        return await cap.Plugins[name][method](data ?? {});
    } catch (e) {
        console.warn(`[${name}] ${method} failed:`, e);
        return null;
    }
}

// ============================================================================
// Handoff — publish an NSUserActivity so the same level can resume on iPad,
// Mac, or another iPhone via iCloud continuity.
// ============================================================================

export interface HandoffActivity {
    type: string;         // Reverse-DNS, e.g. 'com.henrysjourney.playing-level'
    title: string;        // What appears in the multitasking switcher
    userInfo?: Record<string, any>;
    webpageURL?: string;  // Universal-link URL so non-app devices open web
    keywords?: string[];
}

export const publishActivity = (activity: HandoffActivity) =>
    isNative() && callPlugin('Handoff', 'publish', activity);

export const clearActivity = () =>
    isNative() && callPlugin('Handoff', 'clear');

// ============================================================================
// App Shortcuts — Siri, Spotlight, and the long-press-app-icon quick-actions.
// The Swift side registers AppIntents statically; here we can DONATE
// suggestions ranked by user habit.
// ============================================================================

export interface DonatableAction {
    id: string;            // e.g. 'openDailyChallenge'
    title: string;
    subtitle?: string;
    icon?: string;         // SF Symbol name
}

export const donateShortcut = (action: DonatableAction) =>
    isNative() && callPlugin('AppShortcuts', 'donate', action);

// ============================================================================
// Screen Time / parental gate for a kids-oriented educational game.
// Blocks real-money IAP unless a grown-up completes the challenge.
// ============================================================================

/**
 * Request that a grown-up unlock a payment / privacy-sensitive action.
 * On iOS this can escalate to the Screen Time Family Controls prompt when
 * available; otherwise falls back to a math-problem challenge modal.
 *
 * Returns true when a grown-up unlocked it, false on cancel.
 */
export const grownUpGate = async (reason: string): Promise<boolean> => {
    if (isNative()) {
        const r = await callPlugin('ParentalGate', 'challenge', { reason });
        if (r) return !!r?.approved;
    }
    // Web fallback: prompt with a random math problem beyond a kid's easy range.
    const a = 8 + Math.floor(Math.random() * 40);
    const b = 8 + Math.floor(Math.random() * 40);
    const ans = window.prompt(`Grown-up check: what is ${a} × ${b}?`);
    return !!ans && parseInt(ans, 10) === a * b;
};

// ============================================================================
// SharePlay — start a Group Activity so friends on FaceTime can play co-op in
// sync. Requires an ActivityIdentifier registered in Info.plist under
// NSUserActivityTypes. Full implementation lives on the Swift side.
// ============================================================================

export interface SharePlaySession {
    activityId: string;         // Corresponds to the NSUserActivity registered
    metadata?: Record<string, any>;
}

export const startSharePlay = (session: SharePlaySession) =>
    isNative() && callPlugin('SharePlay', 'start', session);

export const endSharePlay = () =>
    isNative() && callPlugin('SharePlay', 'end');
