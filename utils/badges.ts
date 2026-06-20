// --- Money-literacy badges ----------------------------------------------------
// Activates the previously-dead Badge system (the Badge type + user.badges field
// already exist and round-trip through Firebase; ProfileTab already renders
// them). Badges frame SAVING and MASTERY as the achievement. The engine is a
// pure, idempotent evaluator: given the current progress it returns the set of
// earned badge ids; App diffs that against what the user already has and awards
// the difference once. Icons are limited to the existing Badge.icon enum.

import { Badge, LevelResult } from '../types';
import { LEVELS_PER_WORLD } from '../constants/game';

export interface BadgeState {
  resultsByLevel: { [level: number]: LevelResult };
  lifetimeScore: number; // total coins ever earned (never un-earns on spend)
  streak: number;        // current daily streak
}

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: Badge['icon'];
  rarity: NonNullable<Badge['rarity']>;
  earned: (s: BadgeState) => boolean;
}

const goldCount = (r: BadgeState['resultsByLevel']): number =>
  Object.values(r).filter(x => (x?.medal || 0) >= 3).length;

const worldAllGold = (r: BadgeState['resultsByLevel'], world: number): boolean => {
  for (let i = 0; i < LEVELS_PER_WORLD; i++) {
    if (((r[world * LEVELS_PER_WORLD + i]?.medal) || 0) < 3) return false;
  }
  return true;
};

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_gold', name: 'First Gold', description: 'Earned your first Gold medal — a flawless delivery!', icon: 'star', rarity: 'rare', earned: s => goldCount(s.resultsByLevel) >= 1 },
  { id: 'ten_gold', name: 'Gold Rush', description: 'Earned 10 Gold medals.', icon: 'speed', rarity: 'epic', earned: s => goldCount(s.resultsByLevel) >= 10 },
  { id: 'meadow_master', name: 'Meadow Master', description: 'Gold on every level of The Meadow.', icon: 'crown', rarity: 'epic', earned: s => worldAllGold(s.resultsByLevel, 0) },
  { id: 'save_100', name: 'First Savings', description: 'Earned your first 100 coins.', icon: 'trophy', rarity: 'common', earned: s => s.lifetimeScore >= 100 },
  { id: 'save_500', name: 'Smart Saver', description: 'Earned 500 coins.', icon: 'trophy', rarity: 'rare', earned: s => s.lifetimeScore >= 500 },
  { id: 'save_1000', name: 'Coin Collector', description: 'Earned 1,000 coins.', icon: 'trophy', rarity: 'epic', earned: s => s.lifetimeScore >= 1000 },
  { id: 'save_2500', name: 'Money Master', description: 'Earned 2,500 coins.', icon: 'trophy', rarity: 'legendary', earned: s => s.lifetimeScore >= 2500 },
  { id: 'streak_3', name: 'On a Roll', description: 'Kept a 3-day daily streak.', icon: 'flame', rarity: 'rare', earned: s => s.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Kept a 7-day daily streak.', icon: 'flame', rarity: 'epic', earned: s => s.streak >= 7 },
];

// Ids of every badge currently earned (idempotent — App awards only new ones).
export const evaluateBadges = (s: BadgeState): string[] =>
  BADGE_DEFS.filter(d => d.earned(s)).map(d => d.id);

// Build the persistable Badge object for an id (timestamp supplied by caller so
// this stays pure / testable).
export const makeBadge = (id: string, timestamp: number): Badge | null => {
  const d = BADGE_DEFS.find(x => x.id === id);
  if (!d) return null;
  return { id: d.id, name: d.name, description: d.description, icon: d.icon, timestamp, rarity: d.rarity };
};
