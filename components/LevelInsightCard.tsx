import React, { useRef, useState } from 'react';
import { ICONS } from './icons';

type InsightTone = 'success' | 'warning' | 'danger' | 'neutral';

interface LevelInsightCardProps {
  title: string;
  tip: string;
  tone: InsightTone;
  onDismiss: () => void;
}

const TONE_STYLES: Record<InsightTone, { border: string; icon: string; text: string; bar: string; iconAnim: string }> = {
  success: {
    border: 'border-[var(--accent-green)]/50',
    icon: 'text-[var(--accent-green)]',
    text: 'text-[var(--accent-green)]',
    bar: 'from-emerald-400/80 to-emerald-500/20',
    iconAnim: 'insight-icon-bob',
  },
  warning: {
    border: 'border-[var(--accent-yellow)]/50',
    icon: 'text-[var(--accent-yellow)]',
    text: 'text-[var(--accent-yellow)]',
    bar: 'from-amber-300/80 to-amber-500/20',
    iconAnim: 'insight-icon-bob',
  },
  danger: {
    border: 'border-[var(--accent-red)]/50',
    icon: 'text-[var(--accent-red)]',
    text: 'text-[var(--accent-red)]',
    bar: 'from-rose-400/80 to-rose-600/20',
    iconAnim: 'insight-icon-alert',
  },
  neutral: {
    border: 'border-[var(--accent-cyan)]/40',
    icon: 'text-[var(--accent-cyan)]',
    text: 'text-white',
    bar: 'from-cyan-300/70 to-cyan-600/20',
    iconAnim: 'insight-icon-bob',
  },
};

const LevelInsightCard: React.FC<LevelInsightCardProps> = ({ title, tip, tone, onDismiss }) => {
  const toneStyle = TONE_STYLES[tone];
  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    setDragY(Math.max(0, Math.min(72, delta)));
  };

  const handleTouchEnd = () => {
    if (dragY > 42) {
      onDismiss();
    }
    setDragY(0);
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`insight-card-subtle w-full max-w-lg rounded-lg border bg-black/55 backdrop-blur-lg px-3 py-2 shadow-xl transition-transform duration-150 ${toneStyle.border}`}
      style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 140 }}
    >
      <div className={`h-[1.5px] w-full rounded-full bg-gradient-to-r ${toneStyle.bar} insight-bar-sweep mb-1.5`} />
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${toneStyle.icon} ${toneStyle.iconAnim}`}>
          <ICONS.Info />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] sm:text-[11px] font-black tracking-wide ${toneStyle.text}`}>{title}</div>
          <div className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-snug">{tip}</div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss insight"
        >
          <ICONS.Remove />
        </button>
      </div>
    </div>
  );
};

export default LevelInsightCard;
