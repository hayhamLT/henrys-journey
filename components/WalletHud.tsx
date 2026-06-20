import React from 'react';
import { CoinIcon } from './CoinIcon';

interface WalletHudProps {
  wallet: number;      // projected wallet after the current planned route
  exitPrice: number;   // coins needed to get home (W1/W4)
  kind?: 'wallet' | 'budget' | 'reserve'; // W1/W4 wallet, W7 budget, W8 reserve
}

// W1 "Spend-to-pass" run-wallet readout. Shown live during PLANNING: as the kid
// routes through an impulse-buy WANT the wallet drops, and if it falls below the
// exit price the HUD turns red and warns they can't get home — so the cost of a
// "want" is felt before they ever hit Run. Distinct from the persistent meta
// wallet and from the coins-earned HUD (CoinTrip).
const WalletHud: React.FC<WalletHudProps> = ({ wallet, exitPrice, kind = 'wallet' }) => {
  const isBudget = kind === 'budget';   // W7: allocate across tolls
  const isReserve = kind === 'reserve'; // W8: keep a buffer for shocks
  const broke = kind === 'wallet' && wallet < exitPrice;

  return (
    <div className="flex justify-center w-full px-4 pb-2 pointer-events-none">
      <div
        className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border shadow-lg transition-colors duration-300 ${
          broke ? 'border-rose-400/60 shadow-rose-900/20' : 'border-amber-300/40'
        }`}
      >
        <CoinIcon className="text-base" />
        <span
          className={`font-display font-black text-sm leading-none tabular-nums transition-colors ${
            broke ? 'text-rose-300' : 'text-amber-200'
          }`}
        >
          <span key={wallet} className="inline-block animate-in zoom-in-75 duration-200">
            {wallet}
          </span>
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 leading-none">
          {isBudget ? 'budget' : isReserve ? 'reserve' : 'wallet'}
        </span>
        <span className="w-px h-3 bg-white/15" />
        <span className={`text-[10px] font-bold leading-none ${broke ? 'text-rose-300' : 'text-white/50'}`}>
          {isBudget ? `you can't buy every toll — choose`
            : isReserve ? `keep a buffer — shocks drain it`
            : broke ? `need ${exitPrice} to get home` : `home costs ${exitPrice}`}
        </span>
      </div>
    </div>
  );
};

export default WalletHud;
