import React from 'react';
import { CoinIcon } from './CoinIcon';

interface CoinTripProps {
  collected: number;
  total: number;
}

// A lightweight in-level readout of the coins earned on THIS run — deliberately
// separate from the persistent wallet balance (shown in the Header) and from the
// end-of-level points. It reinforces "every coin you walk to is money you earned."
// On The Meadow, coins are OPTIONAL income (the win is just getting home), so this
// is the headline number a kid watches climb, with all-coins as the Gold-medal goal.
// Built once here; later worlds layer the draining purse / reserve / savings onto it.
const CoinTrip: React.FC<CoinTripProps> = ({ collected, total }) => {
  if (total <= 0) return null;
  const complete = collected >= total;

  return (
    <div className="flex justify-center w-full px-4 pb-2 pointer-events-none">
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border shadow-lg transition-colors duration-300 ${
          complete ? 'border-amber-300/60 shadow-amber-900/20' : 'border-white/10'
        }`}
      >
        <CoinIcon className="text-base" />
        <span className="font-display font-black text-amber-200 text-sm leading-none tabular-nums">
          {/* re-key the number so each pickup gives a little pop */}
          <span key={collected} className="inline-block animate-in zoom-in-75 duration-200">
            {collected}
          </span>
          <span className="text-white/35 font-bold">/{total}</span>
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 leading-none">
          coins
        </span>
      </div>
    </div>
  );
};

export default CoinTrip;
