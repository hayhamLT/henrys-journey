// Thin façade over Capacitor + our WKWebView shell so the rest of the app
// doesn't have to know which environment it's in.
//
// Everything here is a no-op / graceful fallback in a plain web browser, so
// the same source runs identically in dev, in a native Capacitor build, and
// inside the hand-rolled WKWebView shell.

import { Capacitor } from '@capacitor/core';

/** True when running inside Capacitor (iOS/Android). */
export const isNative = (): boolean => {
    try { return Capacitor.isNativePlatform(); } catch { return false; }
};

/** True when running inside our hand-rolled WKWebView shell (window.HJ bridge). */
export const isCustomShell = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).HJ;
};

/** True if we're in any native shell (Capacitor OR custom). */
export const isNativeShell = (): boolean => isNative() || isCustomShell();

// ============================================================================
// External links
// ============================================================================

/**
 * Open a URL in the appropriate browser for the platform.
 * - Capacitor: SFSafariViewController (in-app browser, dismissable)
 * - Custom shell: native share pref
 * - Web: window.open in a new tab
 */
export const openExternalUrl = async (url: string): Promise<void> => {
    if (isNative()) {
        try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url, presentationStyle: 'popover' });
            return;
        } catch (e) {
            console.warn('[nativeBridge] Browser.open failed, falling back:', e);
        }
    }
    // Fallback: standard web open
    window.open(url, '_blank', 'noopener,noreferrer');
};

// ============================================================================
// Haptics — game-event mapped
// ============================================================================

export type HapticEvent =
    | 'button'          // any UI button tap (already fired automatically in custom shell)
    | 'select'          // picking an item / menu item
    | 'coin'            // coin pickup
    | 'package'         // package delivered
    | 'purchase'        // purchase confirmed
    | 'levelComplete'   // level cleared
    | 'medalGold'       // gold medal earned
    | 'medalSilver'     // silver medal earned
    | 'medalBronze'     // bronze medal earned
    | 'hazardHit'       // failure / bomb / trap
    | 'gameOver';       // level failed

/** Fire a haptic mapped to a semantic game event. Safe on all platforms. */
export const haptic = async (event: HapticEvent): Promise<void> => {
    // Capacitor Haptics (preferred on native)
    if (isNative()) {
        try {
            const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
            switch (event) {
                case 'button':
                case 'select':
                case 'coin':
                    return void Haptics.impact({ style: ImpactStyle.Light });
                case 'package':
                case 'purchase':
                    return void Haptics.impact({ style: ImpactStyle.Medium });
                case 'levelComplete':
                case 'medalGold':
                    return void Haptics.notification({ type: NotificationType.Success });
                case 'medalSilver':
                case 'medalBronze':
                    return void Haptics.impact({ style: ImpactStyle.Medium });
                case 'hazardHit':
                    return void Haptics.notification({ type: NotificationType.Warning });
                case 'gameOver':
                    return void Haptics.notification({ type: NotificationType.Error });
            }
        } catch (e) {
            // Fall through
        }
    }
    // Custom WKWebView shell bridge
    if (isCustomShell()) {
        const map: Record<HapticEvent, string> = {
            button: 'light', select: 'selection', coin: 'light',
            package: 'medium', purchase: 'medium',
            levelComplete: 'success', medalGold: 'success',
            medalSilver: 'medium', medalBronze: 'medium',
            hazardHit: 'warning', gameOver: 'error',
        };
        (window as any).HJ.haptic(map[event]);
        return;
    }
    // Web fallback: navigator.vibrate (Android web / limited)
    try {
        if (navigator.vibrate) {
            const pattern = event === 'gameOver' ? [30, 40, 30]
                : event === 'levelComplete' ? [30, 30, 30]
                : 15;
            navigator.vibrate(pattern);
        }
    } catch {}
};

// ============================================================================
// Share
// ============================================================================

export interface ShareOptions { title?: string; text?: string; url?: string; }

/** Native share sheet on iOS/Android; Web Share API on browser. */
export const share = async (opts: ShareOptions): Promise<boolean> => {
    if (isNative()) {
        try {
            const { Share } = await import('@capacitor/share');
            await Share.share(opts);
            return true;
        } catch (e) {
            console.warn('[nativeBridge] Share failed:', e);
            return false;
        }
    }
    if (isCustomShell()) {
        (window as any).HJ.share(opts.text || '', opts.url || '');
        return true;
    }
    if ((navigator as any).share) {
        try {
            await (navigator as any).share(opts);
            return true;
        } catch {
            return false;
        }
    }
    // Fallback: copy URL to clipboard
    try {
        await navigator.clipboard.writeText(opts.url || opts.text || '');
        return true;
    } catch {
        return false;
    }
};

// ============================================================================
// Biometric authentication (Face ID / Touch ID) for confirming purchases
// ============================================================================

/**
 * Prompt Face ID / Touch ID.
 * Returns true on success, false on cancel/fail. Never throws.
 * On web / non-supporting platforms, returns true immediately (no gate).
 */
export const confirmWithBiometrics = async (reason: string): Promise<boolean> => {
    if (!isNative()) return true;
    try {
        // @capacitor-community/native-biometric supports Face ID / Touch ID
        const mod: any = await import('capacitor-native-biometric').catch(() => null);
        if (!mod?.NativeBiometric) return true; // plugin not installed → don't block
        const avail = await mod.NativeBiometric.isAvailable();
        if (!avail.isAvailable) return true; // no biometry set up → don't block
        await mod.NativeBiometric.verifyIdentity({
            reason,
            title: "Confirm purchase",
            subtitle: reason,
            description: "Use Face ID / Touch ID to confirm",
        });
        return true;
    } catch (e) {
        return false;
    }
};

// ============================================================================
// Persistent preferences (Capacitor Preferences ↔ localStorage)
// ============================================================================

export const setPref = async (key: string, value: string): Promise<void> => {
    if (isNative()) {
        try {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key, value });
            return;
        } catch {}
    }
    try { localStorage.setItem(key, value); } catch {}
};

export const getPref = async (key: string): Promise<string | null> => {
    if (isNative()) {
        try {
            const { Preferences } = await import('@capacitor/preferences');
            const r = await Preferences.get({ key });
            return r.value ?? null;
        } catch {}
    }
    try { return localStorage.getItem(key); } catch { return null; }
};

// ============================================================================
// Clipboard
// ============================================================================

export const writeToClipboard = async (text: string): Promise<boolean> => {
    if (isNative()) {
        try {
            const mod: any = await import('@capacitor/clipboard').catch(() => null);
            if (mod?.Clipboard) { await mod.Clipboard.write({ string: text }); return true; }
        } catch {}
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Last-resort textarea trick
        try {
            const el = document.createElement('textarea');
            el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
            document.body.appendChild(el); el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            return true;
        } catch { return false; }
    }
};
