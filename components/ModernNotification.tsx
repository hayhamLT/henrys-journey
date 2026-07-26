import React, { useEffect } from 'react';

interface ModernNotificationProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}

const ModernNotification: React.FC<ModernNotificationProps> = ({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-black/90 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 animate-in fade-in duration-300">
      <span className="font-medium text-sm flex-1">{message}</span>
      {actionLabel && onAction && (
        <button
          className="bg-[var(--accent-cyan)] text-black font-bold px-3 py-1 rounded-lg hover:bg-teal-400 transition-colors text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
      <button
        className="ml-2 text-white/60 hover:text-white text-lg px-2"
        onClick={onClose}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default ModernNotification;
