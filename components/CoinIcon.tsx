import React from 'react';
import { formatCoins } from '../constants/finlit';

// A small premium GOLD coin (pure CSS) — replaces the flat/grey '🪙' emoji so the
// currency reads unmistakably as money on every surface, and matches the gold
// "collect" role-colour of the 3D coins. Scales to 1em of the surrounding text.
export const CoinIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`coin-icon ${className}`} aria-hidden="true" />
);

// Coin amount with the leading gold icon (replaces formatCoinsWithGlyph in JSX),
// e.g. <CoinIcon/> 1,250.
export const CoinAmount: React.FC<{ n: number, className?: string }> = ({ n, className = '' }) => (
  <span className={`inline-flex items-center gap-1 ${className}`}><CoinIcon /> {formatCoins(n)}</span>
);

export default CoinIcon;
