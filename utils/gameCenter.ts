// Game Center leaderboard integration.
//
// - Prompts the user to sign in on first launch (once).
// - Submits arena / tournament scores to the leaderboard.
// - Opens the native Game Center UI for viewing the board.
//
// Leaderboards must be created in App Store Connect first, and their IDs
// pasted into LEADERBOARDS below.

import { isNative } from './nativeBridge';

export const LEADERBOARDS = {
    arena_all_time: 'com.henrysjourney.arena.alltime',
    daily_challenge: 'com.henrysjourney.daily',
    total_coins: 'com.henrysjourney.coins.total',
    longest_streak: 'com.henrysjourney.streak.longest',
} as const;

type LeaderboardId = typeof LEADERBOARDS[keyof typeof LEADERBOARDS];

async function callPlugin(method: string, data?: any): Promise<any> {
    const cap = (window as any).Capacitor;
    if (!cap?.Plugins?.GameServices) return null;
    try {
        return await cap.Plugins.GameServices[method](data ?? {});
    } catch (e) {
        console.warn(`[gameCenter] ${method} failed:`, e);
        return null;
    }
}

let signedInPromise: Promise<boolean> | null = null;

/**
 * Ensure the user is signed in to Game Center. Idempotent — the first call
 * kicks off auth, subsequent calls await the same promise.
 * Returns true on success, false if the user declined or unavailable.
 */
export const ensureGameCenter = async (): Promise<boolean> => {
    if (!isNative()) return false;
    if (signedInPromise) return signedInPromise;
    signedInPromise = (async () => {
        const r = await callPlugin('signIn');
        return !!r?.success;
    })();
    return signedInPromise;
};

/** Submit a score to a Game Center leaderboard. */
export const submitScore = async (leaderboard: LeaderboardId, score: number): Promise<void> => {
    if (!isNative()) return;
    if (!(await ensureGameCenter())) return;
    await callPlugin('submitScore', { leaderboardId: leaderboard, score });
};

/** Open the native Game Center leaderboard UI. */
export const openLeaderboard = async (leaderboard: LeaderboardId): Promise<void> => {
    if (!isNative()) return;
    if (!(await ensureGameCenter())) return;
    await callPlugin('showLeaderboard', { leaderboardId: leaderboard });
};
