import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { CoinIcon, CoinAmount } from './CoinIcon';

interface WalletProps {
  balance: number;   // coins available to spend now
  earned: number;    // lifetime coins earned (income)
  spent: number;     // lifetime coins spent (expenses)
  rateLabel?: string; // effective daily interest rate, e.g. "6%"
  streak?: number;    // daily streak (drives the rate)
  onClick?: () => void;
}

// The player's money at a glance. Balance is the headline; Earned (income) and
// Spent (expenses) below it quietly teach that what you keep = what you make
// minus what you spend.
const Wallet: React.FC<WalletProps> = ({ balance, earned, spent, rateLabel, streak = 0, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full text-left rounded-2xl border border-amber-400/25 overflow-hidden transition-all duration-200 disabled:cursor-default enabled:active:scale-[0.99] enabled:hover:border-amber-400/40"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.06) 100%)',
        boxShadow: '0 0 0 1px rgba(251,191,36,0.1), 0 4px 20px rgba(251,191,36,0.08)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <CoinIcon className="text-3xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/70">My Wallet</p>
            <span
              className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-black text-emerald-300/90 flex items-center gap-0.5"
              title={streak > 0 ? `Your ${streak}-day streak boosts your interest rate!` : 'Keep a daily streak to boost your rate!'}
            >
              <span aria-hidden="true">🌱</span> {rateLabel ? `${rateLabel}/day interest` : 'earns interest daily'}
              {streak > 0 && <span className="text-amber-300">🔥</span>}
            </span>
          </div>
          <p className="font-display text-2xl font-black leading-none text-amber-200">
            <AnimatedNumber value={balance} /> <span className="text-sm font-bold text-amber-300/60">Coins</span>
          </p>
        </div>
      </div>
      <div className="flex border-t border-amber-400/15 divide-x divide-amber-400/15">
        <div className="flex-1 px-4 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-400/70 flex items-center gap-1">
            <span aria-hidden="true">▲</span> Earned
          </p>
          <p className="font-display text-sm font-bold text-emerald-300 tabular-nums"><CoinAmount n={earned} /></p>
        </div>
        <div className="flex-1 px-4 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-rose-400/70 flex items-center gap-1">
            <span aria-hidden="true">▼</span> Spent
          </p>
          <p className="font-display text-sm font-bold text-rose-300 tabular-nums"><CoinAmount n={spent} /></p>
        </div>
      </div>
    </button>
  );
};

export default Wallet;
