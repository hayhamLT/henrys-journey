// --- Coin medals --------------------------------------------------------------
// A per-level mastery tier derived PURELY from data the simulation already
// computes (par, timeBonus, whether every collectible was taken). Medals never
// affect whether a level is passed/failed and are never fed into the level
// generator's difficulty measure — they are post-run presentation only, so the
// procedurally-generated monotonic-difficulty campaign stays untouched.
//
// 0 = none (failed / not cleared), 1 = Bronze, 2 = Silver, 3 = Gold.

export interface MedalInput {
  moves: number;       // moves the player actually used
  par: number;         // the level's par (optimal-ish move count)
  timeBonus: number;   // >0 means they finished with time to spare
  allGems: boolean;    // collected every package on the board
  allBoosts?: boolean; // collected every boost pad too (true if none on board)
  growLevel?: boolean; // W5: a "let it grow" level — Gold rewards patience, not speed
  growRipe?: boolean;  // W5: the savings gem was grabbed ripe (late enough)
}

// Gold  = flawless: within par, finished quickly, AND left NOTHING behind
//         (every package AND every boost pad) — a real mastery target even on
//         the objective-free early worlds.
// Silver = near-optimal (<= par+1) OR collected every package.
// Bronze = cleared.
export const computeMedal = (m: MedalInput): number => {
  const underPar = m.moves <= m.par;
  const allBoosts = m.allBoosts !== false; // default true when unspecified
  // W5 "Let it grow": speed is irrelevant (and the speed bonus is suppressed) —
  // Gold rewards collecting everything AND letting the savings gem RIPEN. This is
  // the whole point of the world, so the normal underPar/timeBonus rule is exempt.
  if (m.growLevel) {
    if (m.growRipe && m.allGems && allBoosts) return 3;
    if (m.allGems) return 2;
    return 1;
  }
  if (underPar && m.timeBonus > 0 && m.allGems && allBoosts) return 3;
  if (m.moves <= m.par + 1 || m.allGems) return 2;
  return 1;
};

export const MEDAL_NAME: Record<number, string> = {
  0: '',
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
};

// Amber/silver/bronze tints for the coin pips (CSS color strings).
export const MEDAL_COLOR: Record<number, string> = {
  1: '#cd7f32',
  2: '#cbd5e1',
  3: '#fbbf24',
};

// A run is "perfect" when it earns Gold AND the player lost no life that
// attempt — the rarest, loudest celebration tier.
export const isPerfectRun = (medal: number, lifeLost: boolean): boolean =>
  medal >= 3 && !lifeLost;
