import React from 'react';
import { InterestResult } from '../constants/finlit';
import { CoinIcon } from './CoinIcon';

interface InterestOverlayProps {
  result: InterestResult;
  newBalance: number;
  onClose: () => void;
}

// "Your savings grew!" — the daily interest payout. A small, delightful moment
// that teaches: money you keep can earn more money on its own (interest), and
// a good daily habit (streak) makes it grow faster.
const InterestOverlay: React.FC<InterestOverlayProps> = ({ result, newBalance, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div
        className="w-full max-w-sm rounded-3xl border border-emerald-400/30 bg-slate-900/95 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300"
        style={{ boxShadow: '0 0 60px rgba(52,211,153,0.18), 0 20px 60px rgba(0,0,0,0.6)' }}
      >
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-4xl">
          <span role="img" aria-hidden="true">🌱</span>
        </div>

        <p className="font-display text-[10px] font-black uppercase tracking-widest text-emerald-300/70">Interest Earned</p>
        <h2 className="font-display text-2xl font-black text-white mt-1 mb-1">Your savings grew!</h2>
        <p className="text-sm text-white/60 leading-relaxed mb-5">
          You kept your coins, so they earned <span className="font-bold text-emerald-300">{result.rateLabel}</span> interest overnight.
        </p>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 mb-5">
          <p className="font-display text-4xl font-black text-emerald-300 leading-none">
            +{result.total.toLocaleString()} <CoinIcon className="text-lg" />
          </p>
          {result.streakBonus > 0 && (
            <p className="mt-2 text-xs font-bold text-amber-300">
              Includes +{result.streakBonus.toLocaleString()} 🔥 streak bonus ({result.streakDays}-day streak)!
            </p>
          )}
          <div className="mt-3 border-t border-white/10 pt-2 flex items-center justify-center gap-1.5 text-sm">
            <span className="text-white/50">New balance:</span>
            <span className="font-display font-bold text-amber-200">{newBalance.toLocaleString()} <CoinIcon /></span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="font-display w-full rounded-2xl py-3.5 text-base font-black text-slate-950 transition-all duration-150 active:translate-y-[2px] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(160deg, #4ade80 0%, #34d399 45%, #10b981 100%)',
            boxShadow: '0 4px 0 #047857, 0 6px 24px rgba(16,185,129,0.35)',
          }}
        >
          Sweet!
        </button>
      </div>
    </div>
  );
};

export default InterestOverlay;
