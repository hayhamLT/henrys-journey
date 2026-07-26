
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    try {
        // Capacitor Haptics (iOS/Android Native)
        if (type === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else if (type === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
        else if (type === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
        else if (type === 'success') await Haptics.notification({ type: NotificationType.Success });
        else if (type === 'warning') await Haptics.notification({ type: NotificationType.Warning });
        else if (type === 'error') await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
        // Fallback for standard Web API (Android Chrome only, ignored on iOS Safari)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            if (type === 'light') navigator.vibrate(10);
            else if (type === 'medium') navigator.vibrate(20);
            else if (type === 'heavy') navigator.vibrate(40);
            else if (type === 'success') navigator.vibrate([30, 50, 30]);
            else if (type === 'error') navigator.vibrate([50, 30, 50, 30, 50]);
        }
    }
};
