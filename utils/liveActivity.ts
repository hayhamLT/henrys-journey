// Live Activity control from JS.
//
// The actual Swift code lives in ios/App/HenryActivity/. This file is the
// JS-side façade — a stub in the browser, a real bridge on native.
//
// Integration path: call startLevelActivity() when a level begins,
// updateLevelActivity() as the player picks up coins / moves, and
// endLevelActivity() on success or fail. All calls are safe no-ops off-iOS.

import { isNative } from './nativeBridge';

export interface LevelSnapshot {
    coinsCollected: number;
    coinsTarget: number;
    movesUsed: number;
    movesBudget: number;
    levelName: string;
    worldName: string;
}

let currentActivityId: string | null = null;

async function callPlugin(method: string, data?: any) {
    // The plugin is registered from Swift with the name 'HenryActivity'.
    const cap = (window as any).Capacitor;
    if (!cap?.Plugins?.HenryActivity) return null;
    try {
        return await cap.Plugins.HenryActivity[method](data ?? {});
    } catch (e) {
        console.warn(`[liveActivity] ${method} failed:`, e);
        return null;
    }
}

export const startLevelActivity = async (snap: LevelSnapshot): Promise<void> => {
    if (!isNative()) return;
    const r = await callPlugin('start', snap);
    currentActivityId = r?.activityId ?? null;
};

export const updateLevelActivity = async (snap: LevelSnapshot): Promise<void> => {
    if (!isNative() || !currentActivityId) return;
    await callPlugin('update', { activityId: currentActivityId, ...snap });
};

export const endLevelActivity = async (): Promise<void> => {
    if (!isNative() || !currentActivityId) return;
    await callPlugin('end', { activityId: currentActivityId });
    currentActivityId = null;
};
