import React, { useEffect, useState } from 'react';
import { CoinIcon } from './CoinIcon';

const LOADING_LINES = [
  'Counting your coins…',
  'Lining up the next payday…',
  'Polishing the gems…',
  'Planning a smart route…',
  'Stacking the savings…',
];

interface LoadingIndicatorProps {
  // Only show once loading has lasted this long, so quick level swaps don't
  // flash an overlay — the normal outro→intro transition finishes first and
  // only a genuinely slow level-generation shows this.
  delayMs?: number;
  index?: number;
}

// A small branded loading overlay: a coin spinning inside a ring, with a
// money-themed line. Replaces the blank screen during slow level generation.
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ delayMs = 900, index = 0 }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!show) return null;
  const line = LOADING_LINES[Math.abs(index) % LOADING_LINES.length];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-slate-950/45 backdrop-blur-sm pointer-events-none animate-in fade-in duration-300">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[3px] border-amber-400/15 border-t-amber-400 animate-spin" />
        <CoinIcon className="text-3xl" />
      </div>
      <p className="mt-4 font-display text-sm font-bold text-amber-200/80 tracking-wide">{line}</p>
    </div>
  );
};

export default LoadingIndicator;
