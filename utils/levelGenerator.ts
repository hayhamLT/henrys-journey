
import { CellType, Level, Move, Position } from '../types';
import { solve } from './solver';
import { simulateGame } from './simulation';
import { WORLDS, POINTS, LEVELS_PER_WORLD, TOTAL_LEVELS } from '../constants/game';
import { TUTORIAL_LEVELS } from '../constants/levels';
import { isMoneyLevel, moneyLessonIndex, MONEY_LESSONS, MONEY_LESSON_DIFFICULTY, MONEY_WORLD, moneyLessonObjective } from '../constants/finlit';
import { random, setSeed } from './random';

// --- Configuration ---

interface DensityConfig {
    erosionRate: number;
    pathCrumbleChance: number;
    wallToHoleChance: number;
    wallToBombChance: number;
    hazardDensity: number;
    trapDensity: number;
    boostCount: number;
    lockCount: number;
    minLocks: number;
    layeredLocks: boolean;
    portalPairs: number;
    gemCount: number;
    autoSolverChance: number;
}

// --- Difficulty curve -------------------------------------------------------
// Each array holds one anchor per world boundary (index 0..WORLDS.length). We
// interpolate BETWEEN consecutive anchors using how far the player is through
// the current world, so difficulty rises a little EVERY level instead of
// stepping once per world. The trailing entry is the value the final world
// ramps toward.
const EROSION       = [0.20, 0.28, 0.34, 0.38, 0.42, 0.46, 0.50, 0.53, 0.56, 0.58, 0.60];
const CRUMBLE       = [0.03, 0.06, 0.10, 0.16, 0.24, 0.32, 0.40, 0.46, 0.52, 0.56, 0.60];
const WALL_HOLE     = [0.30, 0.36, 0.42, 0.46, 0.50, 0.55, 0.58, 0.61, 0.64, 0.66, 0.68];
const WALL_BOMB     = [0.00, 0.04, 0.08, 0.12, 0.16, 0.20, 0.24, 0.27, 0.30, 0.32, 0.34];
const HAZARD        = [0.15, 0.25, 0.38, 0.50, 0.60, 0.70, 0.78, 0.84, 0.90, 0.93, 0.95];
// Trap density only matters from the Dunes (world 3) onward — see worldGate.
const TRAP          = [0.00, 0.00, 0.00, 0.10, 0.13, 0.16, 0.18, 0.20, 0.22, 0.23, 0.24];
const LOCKS         = [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3];
const MIN_LOCKS     = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 3];
const PORTALS       = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 3];
const GEMS          = [1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const AUTOSOLVE     = [0.05, 0.08, 0.10, 0.12, 0.13, 0.15, 0.16, 0.18, 0.19, 0.20, 0.20];
const CRUMBLE_RATIO = [0.12, 0.18, 0.25, 0.32, 0.38, 0.43, 0.48, 0.53, 0.58, 0.61, 0.64];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// --- Per-world mechanic gating ---------------------------------------------
// Each world INTRODUCES exactly one new element and inherits everything from
// the worlds before it. This mirrors the money curriculum in constants/game.ts
// (earn → needs/wants → compare → traps → don't-waste → save → goals → budget →
// risk → mastery). Gating is the single source of truth for "what can appear in
// world N", so a later mechanic never leaks into an earlier world and every
// world genuinely feels new.
interface WorldGate {
    maxLocks: number;       // forcefield key/gate pairs allowed
    layeredLocks: boolean;  // 2-3 stacked, multi-colour locks
    maxPortals: number;     // teleporter pairs allowed
    traps: boolean;         // deadly decoy tiles
    crumble: boolean;       // floor collapses behind you
    bombs: boolean;         // hazard mines
    boost: boolean;         // optional bonus pads
    wantTax: boolean;       // "needs before wants" — impulse-buy want drains a run wallet
    compareRoutes: boolean; // "compare your choices" — teleporter must be a real shortcut
    inspectScam: boolean;   // "spot the money trap" — disguised deals you must inspect
    purseDrain: boolean;    // "don't waste it" — a purse that drains every step + on wants
    growCoin: boolean;      // "saving for big goals" — a savings gem worth more the later you grab it
    inflation: boolean;     // "reach your goal, beat inflation" — coins go stale after turn T
    tollGate: boolean;      // "balancing your money" — priced tolls you can't all afford
    reserveShock: boolean;  // "managing risk" — keep a liquid reserve to absorb shocks
    moveObjective: boolean; // "don't waste" — tight move limit
    scoreObjective: boolean;// "savings goal" — minimum score
    comboObjective: boolean;// stacked objectives
}

export const worldGate = (worldIdx: number): WorldGate => ({
    maxLocks:        worldIdx >= 5 ? 3 : worldIdx >= 1 ? 1 : 0,
    layeredLocks:    worldIdx >= 5,
    maxPortals:      worldIdx >= 7 ? 3 : worldIdx >= 4 ? 2 : worldIdx >= 2 ? 1 : 0,
    traps:           worldIdx >= 3,
    crumble:         worldIdx >= 4,
    bombs:           worldIdx >= 8,
    boost:           true,
    // The Factory (world 1) introduces the run-wallet + impulse-buy "want".
    // Scoped to its intro world for now; later phases reuse it as a decoy/fee.
    wantTax:         worldIdx === 1,
    // The Abyss (world 2) — "compare your choices": require the teleporter to be a
    // genuine shortcut with a viable (longer) walk-around so picking matters.
    compareRoutes:   worldIdx === 2,
    // Sandstorm Dunes (world 3) — "spot the money trap": disguised gold deals you
    // must inspect before committing a route over them.
    inspectScam:     worldIdx === 3,
    // Snowy Peak (world 4) — "don't waste it": a purse that drains every step and
    // on impulse-buy splurges; arrive home above the floor.
    purseDrain:      worldIdx === 4,
    // Crystal Caves (world 5) — "saving for big goals": a savings gem worth more
    // the later you grab it (let it grow before cashing out).
    growCoin:        worldIdx === 5,
    // Sunset Shores (world 6) — "reach your goal, beat inflation": fresh coins lose
    // value if grabbed late; hit the savings goal before they go stale.
    inflation:       worldIdx === 6,
    // Lost Temple (world 7) — "balancing your money": priced toll-gates gating
    // optional bonuses, with a budget that can't fund them all — allocate it.
    tollGate:        worldIdx === 7,
    // Volcanic Isles (world 8) — "managing risk": shocks drain your reserve and are
    // lethal if it can't cover them; collect liquid cash first to build the buffer.
    reserveShock:    worldIdx === 8,
    moveObjective:   worldIdx >= 4,
    scoreObjective:  worldIdx >= 6,
    comboObjective:  worldIdx >= 7,
});

// Sky Kingdom (world 9) — "Money Mastery": rather than cram every wallet mechanic
// onto one board (they'd fight over the same wallet), each of the world's 10 levels
// revisits ONE money verb at peak puzzle difficulty, rotating across the verbs so
// the whole journey is recalled. Ends on 'grow' (the savings capstone). Returns
// 'none' for every world except 9.
export const world9Pick = (levelIdx: number): 'grow' | 'inflation' | 'toll' | 'shock' | 'want' | 'none' => {
    if (Math.floor(levelIdx / LEVELS_PER_WORLD) !== 9) return 'none';
    const lw = levelIdx % LEVELS_PER_WORLD;
    return (['want', 'grow', 'toll', 'inflation', 'shock', 'grow', 'toll', 'inflation', 'shock', 'grow'] as const)[lw];
};

// --- Monotonic difficulty target -------------------------------------------
// The #1 complaint was "level N+1 can be easier than N". We fix that by giving
// every level a TARGET difficulty number that only ever rises, then generating
// many candidates and keeping the one whose MEASURED difficulty lands closest
// to that target. Within a world the target ramps up; each new world dips a
// little (the new mechanic is introduced gently) but always peaks higher than
// the previous world. The result is a smooth, always-climbing curve.
const DIFF_START = [4, 8, 13, 18, 24, 30, 36, 42, 48, 56];
const DIFF_END   = [10, 16, 22, 28, 34, 42, 48, 54, 62, 72];

export const difficultyTarget = (levelIdx: number): number => {
    const { worldIdx, t } = worldProgress(levelIdx);
    const i = Math.max(0, Math.min(worldIdx, DIFF_START.length - 1));
    return lerp(DIFF_START[i], DIFF_END[i], t);
};

// Measure how hard a finished candidate actually plays: route length is the
// dominant signal a kid feels, then each layered mechanic adds weight. Used to
// pick the candidate closest to difficultyTarget(levelIdx).
const measureDifficulty = (level: Level): number => {
    const par = level.par ?? (level.solution?.length ?? 0);
    let gems = 0, hazards = 0, crumble = 0, portals = 0;
    for (const row of level.grid) {
        for (const cell of row) {
            if (cell === CellType.Package || cell === CellType.Package_Blue ||
                cell === CellType.Package_Red || cell === CellType.Package_Circuit) gems++;
            else if (cell === CellType.Bomb || cell === CellType.Trap) hazards++;
            else if (cell === CellType.CrumblingFloor) crumble++;
            else if (isPortalCell(cell)) portals++;
        }
    }
    const locks = level.circuitLinks ? Object.keys(level.circuitLinks).length : 0;
    let objWeight = 0;
    if (level.objective) {
        // combo stacks constraints; min_score/max_moves each add one. A bare
        // collect_ratio is a RELAXATION of the implicit collect-all rule (it lets
        // players skip pickups), so it adds no difficulty — it must not push W0
        // above the floor of the curve.
        objWeight = level.objective.type === 'combo' ? 6
            : level.objective.type === 'collect_ratio' ? 0
            : 3;
    }
    return par
        + locks * 3
        + (portals / 2) * 3   // portals counted as cells; /2 → pairs, 3 pts per pair
        + gems * 1.5
        + hazards * 1.0
        + crumble * 1.0
        // NOTE: the W1 "want"/priced-exit deliberately carry NO difficulty weight.
        // They are The Factory's constant theme (present on ~every W1 level), not a
        // within-world discriminator — weighting them would bias the candidate
        // picker toward the rare want-free maze and the lesson would vanish.
        + objWeight;
};

// Sample an anchor curve at (worldIdx + t) where t is 0..1 progress through the world.
const sampleCurve = (curve: number[], worldIdx: number, t: number): number => {
    const i = Math.max(0, Math.min(worldIdx, curve.length - 2));
    return lerp(curve[i], curve[i + 1], t);
};

const worldProgress = (levelIdx: number): { worldIdx: number; levelInWorld: number; t: number } => {
    const worldIdx = Math.floor(levelIdx / LEVELS_PER_WORLD);
    const levelInWorld = levelIdx % LEVELS_PER_WORLD;
    const t = LEVELS_PER_WORLD > 1 ? levelInWorld / (LEVELS_PER_WORLD - 1) : 0;
    return { worldIdx, levelInWorld, t };
};

const isBossLevelIdx = (levelIdx: number): boolean =>
    levelIdx > 0 && (levelIdx % LEVELS_PER_WORLD) === LEVELS_PER_WORLD - 1;

// --- Signature archetypes ---------------------------------------------------
// Each non-boss level past the opening world is stamped with a deterministic
// "personality" so two adjacent levels at the same difficulty still FEEL
// different — a tight minefield, a sprawling labyrinth, a guarded vault, a
// speedrun, etc. Derived from the level index (not the maze RNG) so a given
// level number always has the same identity even though its layout varies.
type ForcedObjective = 'tight_moves' | 'high_score' | undefined;
interface Archetype {
    name: string;
    erosionMul?: number;
    hazardMul?: number;
    crumbleMul?: number;
    gemBonus?: number;
    lockBonus?: number;
    portalBonus?: number;
    sizeBonus?: number;
    forceObjective?: ForcedObjective;
}

// Archetypes give each level a distinct PERSONALITY without blowing up the
// difficulty — the monotonic target band (difficultyTarget) owns magnitude now,
// so multipliers are kept mild and any mechanic bonus is re-clamped by the
// world gate. The point is variety in feel (twisty vs open, guarded vs greedy),
// not swings that make one level far easier than its neighbour.
const ARCHETYPES: Archetype[] = [
    { name: 'Balanced' },
    // Tight, twisty corridors (low erosion) — fewer open shortcuts.
    { name: 'Labyrinth', erosionMul: 0.78, hazardMul: 0.8, crumbleMul: 0.85, sizeBonus: 1 },
    // A little more open with extra hazards lining the route.
    { name: 'Minefield', hazardMul: 1.2, erosionMul: 1.08 },
    // Guarded treasure: an extra lock and a portal redistribute, not pile on.
    { name: 'Vault', gemBonus: 1, lockBonus: 1, hazardMul: 0.8 },
    // Lean and direct — rewards a clean line.
    { name: 'Speedrun', hazardMul: 0.85, erosionMul: 1.05, forceObjective: 'tight_moves' },
    // Coin-rich: more pickups, fewer hazards (net similar difficulty).
    { name: 'Treasure', gemBonus: 1, hazardMul: 0.75, forceObjective: 'high_score' },
    // Fragile footing emphasised over raw hazard count.
    { name: 'Gauntlet', crumbleMul: 1.2, hazardMul: 1.1 },
];

export const getLevelArchetype = (levelIdx: number): Archetype => {
    const { worldIdx } = worldProgress(levelIdx);
    // Opening world and every boss stay clean and readable.
    if (worldIdx === 0 || isBossLevelIdx(levelIdx)) return ARCHETYPES[0];
    // Multiplier must be coprime with ARCHETYPES.length so adjacent levels cycle
    // through different personalities instead of collapsing to one.
    const pick = ((levelIdx * 5 + 2) % ARCHETYPES.length + ARCHETYPES.length) % ARCHETYPES.length;
    const arch = ARCHETYPES[pick];
    // Don't impose harsh scoring objectives before players have their footing.
    if (worldIdx < 3 && arch.forceObjective) {
        return { ...arch, forceObjective: undefined };
    }
    return arch;
};

const getDensityForLevel = (levelIdx: number): DensityConfig => {
    const { worldIdx, t } = worldProgress(levelIdx);
    const a = getLevelArchetype(levelIdx);
    const gate = worldGate(worldIdx);

    const cfg: DensityConfig = {
        erosionRate:       clamp01(sampleCurve(EROSION, worldIdx, t) * (a.erosionMul ?? 1)),
        // Crumbling floors are a Snowy-Peak (world 4) mechanic.
        pathCrumbleChance: gate.crumble ? clamp01(sampleCurve(CRUMBLE, worldIdx, t) * (a.crumbleMul ?? 1)) : 0,
        wallToHoleChance:  clamp01(sampleCurve(WALL_HOLE, worldIdx, t)),
        // Bomb mines only appear in the Volcanic Isles (world 8) onward.
        wallToBombChance:  gate.bombs ? clamp01(sampleCurve(WALL_BOMB, worldIdx, t)) : 0,
        hazardDensity:     gate.bombs ? clamp01(sampleCurve(HAZARD, worldIdx, t) * (a.hazardMul ?? 1)) : 0,
        // Trap tiles are introduced in the Sandstorm Dunes (world 3).
        trapDensity:       gate.traps ? clamp01(sampleCurve(TRAP, worldIdx, t) * (a.hazardMul ?? 1)) : 0,
        // Boost pads are the Meadow gimmick and a friendly bonus everywhere.
        boostCount:        gate.boost ? (worldIdx === 0 ? 2 : 1) : 0,
        lockCount:         Math.round(sampleCurve(LOCKS, worldIdx, t)) + (a.lockBonus ?? 0),
        minLocks:          Math.round(sampleCurve(MIN_LOCKS, worldIdx, t)),
        layeredLocks:      gate.layeredLocks,
        portalPairs:       Math.round(sampleCurve(PORTALS, worldIdx, t)) + (a.portalBonus ?? 0),
        gemCount:          Math.round(sampleCurve(GEMS, worldIdx, t)) + (a.gemBonus ?? 0),
        autoSolverChance:  sampleCurve(AUTOSOLVE, worldIdx, t),
    };

    // Clamp every mechanic to its world gate so a later mechanic can never leak
    // into an earlier world. Worlds before the lock/portal intro get exactly 0.
    cfg.lockCount = Math.max(0, Math.min(gate.maxLocks, cfg.lockCount));
    // Layered-lock worlds (Crystal Caves+) guarantee at least 2 stacked locks.
    if (gate.layeredLocks) cfg.lockCount = Math.max(2, cfg.lockCount);
    cfg.minLocks = Math.max(0, Math.min(cfg.lockCount, cfg.minLocks));
    cfg.portalPairs = Math.max(0, Math.min(gate.maxPortals, cfg.portalPairs));
    cfg.gemCount = Math.max(1, Math.min(5, cfg.gemCount));
    return cfg;
};

const getMaxCrumblePathRatio = (levelIdx: number): number => {
    const { worldIdx, t } = worldProgress(levelIdx);
    if (!worldGate(worldIdx).crumble) return 0;
    const a = getLevelArchetype(levelIdx);
    return Math.min(0.7, sampleCurve(CRUMBLE_RATIO, worldIdx, t) * (a.crumbleMul ?? 1));
};

const getSizeForLevel = (levelIdx: number): { rows: number; cols: number } => {
    const baseSize = 5 + Math.floor((Math.min(levelIdx, TOTAL_LEVELS) / TOTAL_LEVELS) * 6);
    const a = getLevelArchetype(levelIdx);
    let finalSize = baseSize + (a.sizeBonus ?? 0);
    // Bosses use carved silhouette shapes (star/skull/diamond) whose thin arms
    // hold few walkable cells — give them extra room so they stay solvable.
    if (isBossLevelIdx(levelIdx)) finalSize = baseSize + 2;
    finalSize = Math.max(5, Math.min(12, finalSize));
    return { rows: finalSize, cols: finalSize };
};

type ShapeType = 'heart' | 'skull' | 'star' | 'diamond' | 'circle' | 'organic_island' | 'rectangle';

const getShapeMask = (shape: ShapeType, rows: number, cols: number): boolean[][] => {
    const isCircle = (r: number, c: number, radius: number) => {
        const centerR = (rows - 1) / 2;
        const centerC = (cols - 1) / 2;
        const dr = r - centerR;
        const dc = c - centerC;
        return (dr*dr + dc*dc) <= (radius * radius);
    };

    const mask: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const nr = r / (rows - 1 || 1);
            const nc = c / (cols - 1 || 1);
            
            if (shape === 'rectangle') {
                mask[r][c] = true;
            } else if (shape === 'circle') {
                mask[r][c] = isCircle(r, c, Math.min(rows, cols) / 2 - 0.5);
            } else if (shape === 'diamond') {
                const dist = Math.abs(nr - 0.5) + Math.abs(nc - 0.5);
                mask[r][c] = dist <= 0.5;
            } else if (shape === 'heart') {
                const x = (nc - 0.5) * 2.5; 
                const y = -(nr - 0.45) * 2.5; 
                const val = Math.pow(x*x + y*y - 1, 3) - x*x*y*y*y;
                mask[r][c] = val <= 0;
            } else if (shape === 'star') {
                const distCenter = Math.sqrt(Math.pow(nr - 0.5, 2) + Math.pow(nc - 0.5, 2));
                const angle = Math.atan2(nc - 0.5, nr - 0.5);
                // Fuller body + thicker arms so the star has room to be solvable.
                const radius = 0.36 + 0.18 * Math.cos(5 * angle);
                mask[r][c] = distCenter <= radius;
            } else if (shape === 'skull') {
                const inHead = isCircle(r, c, Math.min(rows, cols) * 0.35);
                const inJaw = nr > 0.6 && nr < 0.9 && nc > 0.35 && nc < 0.65;
                mask[r][c] = inHead || inJaw;
            } else if (shape === 'organic_island') {
                const dr = (nr - 0.5) * 2;
                const dc = (nc - 0.5) * 2;
                const distSq = dr * dr + dc * dc;
                const threshold = 0.6 + (random() * 0.5);
                mask[r][c] = distSq < threshold;
            }
        }
    }
    return mask;
};

const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getNeighbors = (pos: Position, rows: number, cols: number): Position[] => {
    const dirs = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];
    const neighbors: Position[] = [];
    for (const d of dirs) {
        const nr = pos.row + d.r;
        const nc = pos.col + d.c;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            neighbors.push({ row: nr, col: nc });
        }
    }
    return shuffle(neighbors);
};

const traceSolutionPath = (start: Position, moves: Move[], portals: {A: Position, B: Position}[]): Position[] => {
    const path = [start];
    let curr = { ...start };
    const checkPortal = (p: Position) => {
        for(const pair of portals) {
            if(pair.A.row === p.row && pair.A.col === p.col) return pair.B;
            if(pair.B.row === p.row && pair.B.col === p.col) return pair.A;
        }
        return null;
    };
    for (const move of moves) {
        if (move === Move.Up) curr.row--;
        else if (move === Move.Down) curr.row++;
        else if (move === Move.Left) curr.col--;
        else if (move === Move.Right) curr.col++;
        path.push({ ...curr });
        const jump = checkPortal(curr);
        if (jump) {
            curr = { ...jump };
            path.push({ ...curr });
        }
    }
    return path;
};

const isPortalCell = (cell: CellType) => {
    return cell === CellType.Teleporter_A ||
        cell === CellType.Teleporter_B ||
        cell === CellType.Teleporter_C ||
        cell === CellType.Teleporter_D ||
        cell === CellType.Teleporter_E ||
        cell === CellType.Teleporter_F;
};

const pruneMeaninglessMechanics = (
    grid: CellType[][],
    pathCells: Position[],
    portals: {A: Position, B: Position}[],
    circuitLinks: Level['circuitLinks']
) => {
    const pathSet = new Set(pathCells.map(p => `${p.row},${p.col}`));
    const nearPathSet = new Set<string>([...pathSet]);
    for (const p of pathCells) {
        getNeighbors(p, grid.length, grid[0].length).forEach(n => nearPathSet.add(`${n.row},${n.col}`));
    }

    for (let i = portals.length - 1; i >= 0; i--) {
        const pair = portals[i];
        const keyA = `${pair.A.row},${pair.A.col}`;
        const keyB = `${pair.B.row},${pair.B.col}`;
        const used = pathSet.has(keyA) || pathSet.has(keyB);
        if (!used) {
            grid[pair.A.row][pair.A.col] = CellType.Empty;
            grid[pair.B.row][pair.B.col] = CellType.Empty;
            // CRITICAL: drop the pair from the portals array too. Every later
            // block traces the solution with this array — a pruned pair left in
            // it makes traceSolutionPath "teleport" through plain floor, so
            // wants/scams/tolls get placed relative to a phantom route.
            portals.splice(i, 1);
        }
    }

    if (circuitLinks) {
        Object.entries(circuitLinks).forEach(([keyPos, lockPositions]) => {
        const keyUsed = pathSet.has(keyPos);
        const lockUsed = lockPositions.some(lp => pathSet.has(lp));
        if (!keyUsed && !lockUsed) {
            const [kr, kc] = keyPos.split(',').map(Number);
            if (grid[kr]?.[kc] !== undefined) grid[kr][kc] = CellType.Empty;
            lockPositions.forEach(lp => {
                const [lr, lc] = lp.split(',').map(Number);
                if (grid[lr]?.[lc] !== undefined) grid[lr][lc] = CellType.Empty;
            });
            delete circuitLinks[keyPos];
        }
        });
    }

    const rows = grid.length;
    const cols = grid[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            const cell = grid[r][c];
            if ((cell === CellType.Bomb || cell === CellType.Trap) && !nearPathSet.has(key)) {
                grid[r][c] = CellType.Empty;
            }
            if (isPortalCell(cell) && !nearPathSet.has(key) && !pathSet.has(key)) {
                grid[r][c] = CellType.Empty;
            }
        }
    }
};

const generateMaze = (rows: number, cols: number, erosionRate: number): CellType[][] => {
    const grid: CellType[][] = Array.from({ length: rows }, () => Array(cols).fill(CellType.Wall));
    const startR = Math.floor(random() * rows);
    const startC = Math.floor(random() * cols);
    const stack = [{r: startR, c: startC}];
    grid[startR][startC] = CellType.Empty;
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getNeighbors({row: current.r, col: current.c}, rows, cols);
        const validNeighbors = neighbors.filter(n => {
            if (grid[n.row][n.col] !== CellType.Wall) return false;
            const emptyNs = getNeighbors(n, rows, cols).filter(nn => grid[nn.row][nn.col] === CellType.Empty).length;
            return emptyNs <= 1; 
        });
        if (validNeighbors.length > 0) {
            const next = validNeighbors[0];
            grid[next.row][next.col] = CellType.Empty;
            stack.push({r: next.row, c: next.col});
        } else {
            stack.pop();
        }
    }
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(grid[r][c] === CellType.Wall) {
                const ns = getNeighbors({row: r, col: c}, rows, cols).filter(n => grid[n.row][n.col] === CellType.Empty);
                if (ns.length >= 2 && random() < erosionRate) {
                    grid[r][c] = CellType.Empty;
                }
            }
        }
    }
    return grid;
};

const findPath = (grid: CellType[][], start: Position, end: Position, portals: {A: Position, B: Position}[], blockers: Position[] = []): Position[] | null => {
    const rows = grid.length;
    const cols = grid[0].length;
    const q: { pos: Position, path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>([`${start.row},${start.col}`]);
    const blockerSet = new Set(blockers.map(b => `${b.row},${b.col}`));
    let iterations = 0;
    while (q.length > 0) {
        iterations++;
        if (iterations > 5000) return null;
        q.sort((a, b) => {
            const distA = Math.abs(a.pos.row - end.row) + Math.abs(a.pos.col - end.col);
            const distB = Math.abs(b.pos.row - end.row) + Math.abs(b.pos.col - end.col);
            return distA - distB;
        });
        const { pos, path } = q.shift()!;
        if (pos.row === end.row && pos.col === end.col) return path;
        let neighbors = getNeighbors(pos, rows, cols);
        for (const p of portals) {
            if (p.A.row === pos.row && p.A.col === pos.col) neighbors.push(p.B);
            if (p.B.row === pos.row && p.B.col === pos.col) neighbors.push(p.A);
        }
        for (const n of neighbors) {
            const key = `${n.row},${n.col}`;
            const cell = grid[n.row][n.col];
            const isHardBlocker = cell === CellType.Wall || cell === CellType.Hole || cell === CellType.Bomb || cell === CellType.OutOfBounds;
            const isLogicalBlocker = blockerSet.has(key);
            if (!visited.has(key) && !isHardBlocker && !isLogicalBlocker) {
                visited.add(key);
                q.push({ pos: n, path: [...path, n] });
            }
        }
    }
    return null;
};

const isChokePoint = (grid: CellType[][], start: Position, end: Position, candidate: Position, portals: {A: Position, B: Position}[]): boolean => {
    if ((candidate.row === start.row && candidate.col === start.col) || (candidate.row === end.row && candidate.col === end.col)) return false;
    const pathWithoutCandidate = findPath(grid, start, end, portals, [candidate]);
    return pathWithoutCandidate === null;
};

const getReachableWithDist = (grid: CellType[][], start: Position, blocked: Position, portals: {A: Position, B: Position}[]): {pos: Position, dist: number}[] => {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set<string>();
    const reachable: {pos: Position, dist: number}[] = [];
    const q: {pos: Position, dist: number}[] = [{pos: start, dist: 0}];
    visited.add(`${start.row},${start.col}`);
    visited.add(`${blocked.row},${blocked.col}`);
    while(q.length > 0) {
        const curr = q.shift()!;
        reachable.push(curr);
        let neighbors = getNeighbors(curr.pos, rows, cols);
        for(const p of portals) {
            if(curr.pos.row===p.A.row && curr.pos.col===p.A.col) neighbors.push(p.B);
            if(curr.pos.row===p.B.row && curr.pos.col===p.B.col) neighbors.push(p.A);
        }
        for(const n of neighbors) {
            const key = `${n.row},${n.col}`;
            const cell = grid[n.row][n.col];
            const isBlocker = cell === CellType.Wall || cell === CellType.Hole || cell === CellType.Bomb || cell === CellType.OutOfBounds ||
                              [CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Red, 
                               CellType.ForceField_Purple, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(cell);
            if (!visited.has(key) && !isBlocker) {
                visited.add(key);
                q.push({ pos: n, dist: curr.dist + 1 });
            }
        }
    }
    return reachable;
}

export const attemptGenerateLevel = (levelIdx: number, customRows?: number, customCols?: number, relaxed = false): Level | null => {
    const size = getSizeForLevel(levelIdx);
    const rows = customRows || size.rows;
    const cols = customCols || size.cols;
    const config = getDensityForLevel(levelIdx);
    const worldIdx = Math.floor(levelIdx / LEVELS_PER_WORLD);
    const theme = WORLDS[worldIdx]?.theme || 'day';
    let grid = generateMaze(rows, cols, config.erosionRate);
    const isBossLevel = isBossLevelIdx(levelIdx);
    
    // Determine shape. If it's a custom generation request (from Builder), force 'rectangle' to fill the box.
    // Otherwise use level-based organic shapes.
    let shape: ShapeType;
    if (customRows && customCols) {
        shape = 'rectangle';
    } else {
        shape = isBossLevel ? 'circle' : 'organic_island';
        if (isBossLevel) {
            if (worldIdx === 1) shape = 'skull';
            else if (worldIdx === 2) shape = 'star';
            else if (worldIdx === 3) shape = 'diamond';
            else if (worldIdx === 4) shape = 'circle';
        }
    }

    const mask = getShapeMask(shape, rows, cols);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!mask[r][c]) {
                grid[r][c] = CellType.Hole;
            }
        }
    }
    let emptyCells: Position[] = [];
    grid.forEach((r, ri) => r.forEach((c, ci) => {
        if (c === CellType.Empty) emptyCells.push({row: ri, col: ci});
    }));
    if (emptyCells.length < 1) return null;
    const startPool = emptyCells;
    let start = startPool[Math.floor(random() * startPool.length)];
    const portals: {A: Position, B: Position}[] = [];
    const portalTypes = [[CellType.Teleporter_A, CellType.Teleporter_B], [CellType.Teleporter_C, CellType.Teleporter_D], [CellType.Teleporter_E, CellType.Teleporter_F]];
    let portalsPlaced = 0;
    let portalCandidates = emptyCells.filter(p => Math.abs(p.row - start.row) + Math.abs(p.col - start.col) > 1); 
    shuffle(portalCandidates);
    while (portalsPlaced < config.portalPairs && portalCandidates.length >= 2) {
        const p1 = portalCandidates.shift()!;
        const p2 = portalCandidates.shift()!;
        const type = portalTypes[portalsPlaced % 3];
        grid[p1.row][p1.col] = type[0];
        grid[p2.row][p2.col] = type[1];
        portals.push({A: p1, B: p2});
        portalsPlaced++;
    }
    const allReachableFromStart = getReachableWithDist(grid, start, {row: -1, col: -1}, portals);
    if (allReachableFromStart.length < 5) return null;
    const circuitLinks: Level['circuitLinks'] = {};
    const lockTypes = [
        [CellType.Package_Circuit, CellType.ForceField],
        [CellType.Package_Blue, CellType.ForceField_Blue],
        [CellType.Package_Red, CellType.ForceField_Red]
    ];
    let locksPlaced = 0;
    const guardedGemSpots: Position[] = [];
    if (config.lockCount > 0) {
        const reachableSorted = [...allReachableFromStart].sort((a, b) => b.dist - a.dist);
        const deepPointsCandidates = reachableSorted.slice(0, Math.ceil(reachableSorted.length * 0.4)).map(r => r.pos);
        shuffle(deepPointsCandidates);
        for (const deepPoint of deepPointsCandidates) {
            if (locksPlaced >= config.lockCount) break;
            if (Math.abs(deepPoint.row - start.row) + Math.abs(deepPoint.col - start.col) <= 1) continue;
            const pathToDeep = findPath(grid, start, deepPoint, portals);
            if (!pathToDeep || pathToDeep.length < 3) continue;
            const potentialChokePoints: Position[] = [];
            for(let i = 1; i < pathToDeep.length - 1; i++) {
                const candidate = pathToDeep[i];
                if (grid[candidate.row][candidate.col] === CellType.Empty && isChokePoint(grid, start, deepPoint, candidate, portals)) {
                    potentialChokePoints.push(candidate);
                }
            }
            shuffle(potentialChokePoints);
            if (potentialChokePoints.length > 0) {
                const lockPos = potentialChokePoints[0];
                const reachableWithoutLock = getReachableWithDist(grid, start, lockPos, portals);
                const keyCandidates = reachableWithoutLock.filter(item => grid[item.pos.row][item.pos.col] === CellType.Empty);
                if (keyCandidates.length > 0) {
                    // Hide the key deep in the lock-free region so fetching it is a
                    // real detour the player has to plan around — not a tile that
                    // happens to sit on the way to the lock.
                    const byDepth = [...keyCandidates].sort((a, b) => b.dist - a.dist);
                    const deepKeys = byDepth.slice(0, Math.max(1, Math.ceil(byDepth.length * 0.4)));
                    const bestKey = shuffle(deepKeys)[0].pos;
                    const type = lockTypes[locksPlaced];
                    grid[lockPos.row][lockPos.col] = type[1]; 
                    grid[bestKey.row][bestKey.col] = type[0]; 
                    circuitLinks[`${bestKey.row},${bestKey.col}`] = [`${lockPos.row},${lockPos.col}`];
                    locksPlaced++;
                    guardedGemSpots.push(deepPoint);
                }
            }
        }
    }
    let gemsPlaced = 0;
    for (const spot of guardedGemSpots) {
        if (grid[spot.row][spot.col] === CellType.Empty) {
            grid[spot.row][spot.col] = CellType.Package;
            gemsPlaced++;
        }
    }
    // Spread the remaining gems with farthest-point sampling instead of dumping
    // them all in the single most-distant corner. Each new gem is the empty cell
    // that maximises its MINIMUM distance to the start and to every gem already
    // placed — so packages land in distinct pockets and the player has to plan a
    // real collecting tour (and pick an order) rather than grab one cluster.
    const gemAnchors: Position[] = [start, ...guardedGemSpots];
    const freeGemCells = (): Position[] => {
        const out: Position[] = [];
        grid.forEach((row, ri) => row.forEach((c, ci) => {
            if (c === CellType.Empty && (ri !== start.row || ci !== start.col)) {
                out.push({ row: ri, col: ci });
            }
        }));
        return out;
    };
    while (gemsPlaced < config.gemCount) {
        const candidates = freeGemCells();
        if (candidates.length === 0) break;
        let best: Position | null = null;
        let bestScore = -1;
        for (const cand of candidates) {
            let minDist = Infinity;
            for (const a of gemAnchors) {
                const d = Math.abs(cand.row - a.row) + Math.abs(cand.col - a.col);
                if (d < minDist) minDist = d;
            }
            // small deterministic jitter so equidistant ties don't always resolve
            // to the same scan-order cell (keeps variety across re-rolls).
            const score = minDist + random() * 0.5;
            if (score > bestScore) { bestScore = score; best = cand; }
        }
        if (!best) break;
        grid[best.row][best.col] = CellType.Package;
        gemAnchors.push(best);
        gemsPlaced++;
    }
    const tempGrid = grid.map(r => [...r]);
    tempGrid[start.row][start.col] = CellType.Start;
    const solveResult = solve({ grid: tempGrid, start, end: start, circuitLinks }, { requireAllGems: true });
    if (!solveResult.isSolvable || !solveResult.path) return null; 
    
    // SOLUTION PATH CRUMBLING LOGIC
    // We trace the path and selectively turn standard floor tiles into CrumblingFloor
    const solutionPathCells = traceSolutionPath(start, solveResult.path, portals);
    const protectedSet = new Set(solutionPathCells.map(p => `${p.row},${p.col}`));
    
    // 1. Transform path tiles into CrumblingFloors with a hard cap to avoid mono-fragile maps.
    const uniquePathFloors: Position[] = [];
    const seenPathFloors = new Set<string>();
    for (const p of solutionPathCells) {
        const key = `${p.row},${p.col}`;
        if (seenPathFloors.has(key)) continue;
        seenPathFloors.add(key);
        if (grid[p.row][p.col] === CellType.Empty && (p.row !== start.row || p.col !== start.col)) {
            uniquePathFloors.push(p);
        }
    }

    const crumbleBudget = Math.max(
        0,
        Math.floor(uniquePathFloors.length * getMaxCrumblePathRatio(levelIdx))
    );
    // Walkable degree of a tile (how many floor neighbours it has). Degree-2
    // tiles are corridor pinch-points: collapsing one forces a one-way commitment
    // and a deliberate collection order — far more interesting than crumbling an
    // open plaza tile the player can just walk around.
    const walkableDegree = (p: Position): number =>
        getNeighbors(p, rows, cols).filter(n => {
            const cell = grid[n.row][n.col];
            return cell !== CellType.Wall && cell !== CellType.Hole &&
                   cell !== CellType.Bomb && cell !== CellType.OutOfBounds;
        }).length;
    // Shuffle first (variety), then stably bias corridor tiles to the front so
    // the crumble budget is spent on pinch-points before open floor.
    shuffle(uniquePathFloors);
    uniquePathFloors.sort((a, b) => walkableDegree(a) - walkableDegree(b));
    let crumbled = 0;
    for (const p of uniquePathFloors) {
        if (crumbled >= crumbleBudget) break;
        // Corridor pinch-points get a strongly boosted chance (meaningful ordering
        // tension) while open plaza tiles use the base rate. Kept probabilistic so
        // corridors that must be crossed twice aren't always forced unsolvable.
        const isCorridor = walkableDegree(p) <= 2;
        const chance = isCorridor ? Math.min(0.85, config.pathCrumbleChance * 2.2 + 0.2) : config.pathCrumbleChance;
        if (random() < chance) {
            grid[p.row][p.col] = CellType.CrumblingFloor;
            crumbled++;
        }
    }

    // 2. Erosion and hazard placement for non-path cells
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if (protectedSet.has(`${r},${c}`)) continue;
            const cell = grid[r][c];
            if (cell === CellType.OutOfBounds) continue;
            if (cell === CellType.Wall) {
                const wallToHoleChance = config.wallToHoleChance + (isBossLevel ? 0.2 : 0);
                if (random() < wallToHoleChance) {
                    grid[r][c] = CellType.Hole;
                } else if (random() < config.wallToBombChance) {
                    grid[r][c] = CellType.Bomb;
                }
            } else if (cell === CellType.Empty) {
                // Keep most stable floors intact in early worlds; raise attrition
                // gradually. Bosses are sparse carved silhouettes, so HALVE empty
                // attrition there — punching holes in thin arms disconnects them.
                const emptyToHoleChance = Math.min(0.2, config.erosionRate * 0.18 * (isBossLevel ? 0.4 : 1));
                if (random() < emptyToHoleChance) {
                    grid[r][c] = CellType.Hole;
                } else if (random() < config.trapDensity) {
                    // Trap tiles (Sandstorm Dunes+): deadly decoys. Off the required
                    // path; far ones get pruned so survivors sit beside the route as
                    // tempting "too good to be true" shortcuts.
                    grid[r][c] = CellType.Trap;
                } else if (random() < config.hazardDensity) {
                    grid[r][c] = CellType.Bomb;
                }
            }
        }
    }
    grid[start.row][start.col] = CellType.Start;
    
    // Verify solvability again after crumbling transformations
    let finalSolve = solve({ grid, start, end: start, circuitLinks }, { requireAllGems: true });
    if (!finalSolve.isSolvable || !finalSolve.path) return null;

    const finalPathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
    pruneMeaninglessMechanics(grid, finalPathCells, portals, circuitLinks);

    finalSolve = solve({ grid, start, end: start, circuitLinks }, { requireAllGems: true });
    if (!finalSolve.isSolvable || !finalSolve.path) return null;

    // Boost pads (the Meadow gimmick, friendly bonus elsewhere): optional bonus
    // pickups placed on safe floor tiles just OFF the required path, so taking
    // them is a tempting detour for extra coins — never needed to win. Placed
    // last so solvability and par are untouched.
    if (config.boostCount > 0) {
        const finalSolveCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const pathSet = new Set(finalSolveCells.map(p => `${p.row},${p.col}`));
        const boostCandidates: Position[] = [];
        for (const p of finalSolveCells) {
            for (const n of getNeighbors(p, rows, cols)) {
                const key = `${n.row},${n.col}`;
                if (pathSet.has(key)) continue;
                if (grid[n.row][n.col] === CellType.Empty) boostCandidates.push(n);
            }
        }
        shuffle(boostCandidates);
        const placedKeys = new Set<string>();
        let boosted = 0;
        for (const p of boostCandidates) {
            if (boosted >= config.boostCount) break;
            const key = `${p.row},${p.col}`;
            if (placedKeys.has(key)) continue;
            grid[p.row][p.col] = CellType.Boost;
            placedKeys.add(key);
            boosted++;
        }
    }

    // The Factory (world 1) — "Needs before wants": a run wallet + ONE impulse-buy
    // WANT tile on a tempting shortcut. Stepping the want drains the wallet below
    // the exit price, so the only winning plan is to skip the want and get home.
    // Placed after boosts (off the solved path) so the want-free route stays the
    // intended solution; the solver re-verifies it is still solvent.
    let walletConfig: { startWallet: number; wantCost: number; exitPrice: number; drainPerStep?: boolean } | null = null;
    if (worldGate(worldIdx).wantTax || world9Pick(levelIdx) === 'want') {
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const pathIndex = new Map<string, number>();
        pathCells.forEach((p, i) => { if (!pathIndex.has(`${p.row},${p.col}`)) pathIndex.set(`${p.row},${p.col}`, i); });

        // Prefer a SHORTCUT: an empty off-path cell whose on-path neighbours are
        // far apart in route order, so cutting through it visibly saves steps
        // (genuinely tempting). Fall back to any near-path cell so the want still
        // sits on the natural route rather than in a dead corner.
        // A WANT reads best as a "gap" in a wall right beside the route: it looks
        // like a shortcut but drains the wallet, so the kid must resist it. Walls
        // beside the path are plentiful (mazes are wall-dense), and converting one
        // to a walkable want never removes the want-free route — using the gap
        // means stepping the want — so the level stays solvable & solvent. Empty
        // off-path cells are an equally valid fallback. The want is always OFF the
        // solved path, so it is always avoidable.
        const shortcut: Position[] = [];     // touches 2+ path cells far apart in route order
        const besideRoute: Position[] = [];  // touches the path
        const anyOff: Position[] = [];       // any off-path wall/empty cell
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell !== CellType.Wall && cell !== CellType.Empty) continue;
                if (pathIndex.has(`${r},${c}`)) continue;
                anyOff.push({ row: r, col: c });
                const idxs = getNeighbors({ row: r, col: c }, rows, cols)
                    .map(n => pathIndex.get(`${n.row},${n.col}`))
                    .filter((i): i is number => i !== undefined);
                if (idxs.length === 0) continue;
                besideRoute.push({ row: r, col: c });
                if (idxs.length >= 2 && (Math.max(...idxs) - Math.min(...idxs)) >= 2) {
                    shortcut.push({ row: r, col: c });
                }
            }
        }
        const candidates = shortcut.length > 0 ? shortcut : besideRoute.length > 0 ? besideRoute : anyOff;
        if (candidates.length > 0) {
            shuffle(candidates);
            const w = candidates[0];
            const wOrig = grid[w.row][w.col]; // may be Wall — restore it, not Empty, on revert
            grid[w.row][w.col] = CellType.WantTile;
            // 4 − 2 < 3: a single want bankrupts the exit, but the want-free route
            // keeps the full wallet and clears it. Small + bounded for the solver.
            const startWallet = 4, wantCost = 2, exitPrice = 3;
            // The original solved path never steps the off-path want, so it stays
            // a solvent solution; this re-solve just guards against an edge case.
            const check = solve({ grid, start, end: start, circuitLinks, startWallet, wantCost, exitPrice }, { requireAllGems: true });
            if (check.isSolvable && check.path) {
                finalSolve = check;             // re-adopt the proven-solvent path as canonical
                walletConfig = { startWallet, wantCost, exitPrice };
            } else {
                grid[w.row][w.col] = wOrig; // revert — no want this level
            }
        }
        // VERB INVARIANT (strict attempts): world 1's lesson IS the want — a
        // board without one teaches nothing, so reject the candidate and let
        // the search roll another layout. The relaxed fallback may still ship
        // without it so a level always loads.
        if (!relaxed && !walletConfig) return null;
    }

    // The Abyss (world 2) — "Compare your choices": the teleporter must be a
    // GENUINE shortcut with a viable (longer) walk-around, so choosing the cheaper
    // route is a real decision the par/medal already rewards. We re-solve with the
    // teleporters turned into plain floor (no warp) and require that walk route to
    // exist AND be clearly longer; otherwise there is no comparison — reject the
    // candidate so generateBestCandidate tries another layout.
    if (!finalSolve.path) return null; // re-narrow after the want block may have re-adopted the solve
    if (!relaxed && worldGate(worldIdx).compareRoutes) {
        // VERB INVARIANT: world 2's lesson IS the teleporter shortcut. pruning now
        // splices unused pairs out of `portals`, so length 0 = no shortcut survived
        // on the route → reject (this used to silently ship portal-less W2 boards).
        if (portals.length === 0) return null;
        const walkGrid = grid.map(row => row.map(c => isPortalCell(c) ? CellType.Empty : c));
        const walkSolve = solve({ grid: walkGrid, start, end: start, circuitLinks }, { requireAllGems: true });
        const portalLen = finalSolve.path.length;
        const walkLen = walkSolve.path?.length ?? 0;
        // Require BOTH a viable walk-around (so there's a genuine choice, not a
        // mandatory portal) AND the portal saving at least 2 steps (so picking it
        // is a real, medal-relevant decision). Random portals rarely make big
        // shortcuts, so a modest absolute saving keeps generation reliable.
        if (!walkSolve.isSolvable || walkLen < portalLen + 2) return null;
    }

    // Sandstorm Dunes (world 3) — "Spot the money trap": disguise 2-3 tiles as gold
    // coins. ONE sits ON the solved route as a SAFE "sealed deal" (underlying stays
    // Empty) so the player is FORCED to inspect before committing a route over it;
    // 1-2 OFF-path tiles become SCAMS (underlying Trap) that look like coins but
    // kill if stepped. The disguise/inspect/commit-guard are planning-layer only —
    // the simulation uses the true cell types. Scams stay OFF the solution so an
    // inspected-safe route always exists.
    let disguised: string[] | undefined;
    let inspectBudget: number | undefined;
    if (worldGate(worldIdx).inspectScam) {
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const pathKeys = new Set(pathCells.map(p => `${p.row},${p.col}`));
        const onPathEmpties = pathCells.filter(p =>
            p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols &&  // traceSolutionPath can emit an out-of-bounds step
            grid[p.row][p.col] === CellType.Empty && !(p.row === start.row && p.col === start.col));
        const offDecoys: Position[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== CellType.Empty || pathKeys.has(`${r},${c}`)) continue;
                if (getNeighbors({ row: r, col: c }, rows, cols).some(n => pathKeys.has(`${n.row},${n.col}`))) {
                    offDecoys.push({ row: r, col: c });
                }
            }
        }
        if (onPathEmpties.length > 0 && offDecoys.length > 0) {
            shuffle(onPathEmpties);
            shuffle(offDecoys);
            const sealed = onPathEmpties[0];
            const marks: string[] = [`${sealed.row},${sealed.col}`];      // safe sealed deal (stays Empty)
            const scamCount = Math.min(offDecoys.length, random() < 0.5 ? 2 : 1);
            for (let i = 0; i < scamCount; i++) {
                const s = offDecoys[i];
                grid[s.row][s.col] = CellType.Trap;                       // scam: lethal true type
                marks.push(`${s.row},${s.col}`);
            }
            // Confirm a route avoiding the scams still solves (solver treats Trap as
            // blocked). Scams are off-path, so the original solution survives.
            const safeSolve = solve({ grid, start, end: start, circuitLinks }, { requireAllGems: true });
            if (safeSolve.isSolvable && safeSolve.path) {
                finalSolve = safeSolve;              // re-adopt the scam-avoiding path as the canonical solution
                disguised = marks;
                inspectBudget = marks.length;        // enough to inspect every disguised deal
            } else {
                for (let i = 1; i < marks.length; i++) {
                    const [r, c] = marks[i].split(',').map(Number);
                    grid[r][c] = CellType.Empty;       // revert scams
                }
            }
        }
        // VERB INVARIANT (strict attempts): a world-3 board with nothing to
        // inspect skips the "spot the money trap" lesson — reject it.
        if (!relaxed && !disguised) return null;
    }

    // Snowy Peak (world 4) — "Don't waste it": a draining PURSE. It loses a coin
    // every step (so wandering empties it) and a chunk on each impulse-buy want.
    // You must reach home with the purse still above the floor. Calibrated so the
    // tight, want-free route survives with a small buffer, but a splurge — or too
    // much wandering — runs you dry. Wants sit beside the route (off the solution),
    // so the want-free path is always solvent.
    if (!finalSolve.path) return null; // re-narrow after the disguise block may have re-adopted the solve
    if (worldGate(worldIdx).purseDrain) {
        const par0 = finalSolve.path.length;
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const onPath = new Set(pathCells.map(p => `${p.row},${p.col}`));
        const beside: Position[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if ((cell !== CellType.Wall && cell !== CellType.Empty) || onPath.has(`${r},${c}`)) continue;
                if (getNeighbors({ row: r, col: c }, rows, cols).some(n => onPath.has(`${n.row},${n.col}`))) {
                    beside.push({ row: r, col: c });
                }
            }
        }
        shuffle(beside);
        const wantN = Math.min(beside.length, random() < 0.5 ? 2 : 1);
        const wantOrig = beside.slice(0, wantN).map(b => grid[b.row][b.col]); // may be Wall — restore on revert
        for (let i = 0; i < wantN; i++) grid[beside[i].row][beside[i].col] = CellType.WantTile;
        const floor = 2, buffer = 2, sw = par0 + floor + buffer;
        const check = solve({ grid, start, end: start, circuitLinks, startWallet: sw, wantCost: 4, exitPrice: floor, drainPerStep: true }, { requireAllGems: true });
        if (check.isSolvable && check.path) {
            finalSolve = check;             // re-adopt the proven-solvent (drain-aware) path as canonical
            walletConfig = { startWallet: sw, wantCost: 4, exitPrice: floor, drainPerStep: true };
        } else {
            for (let i = 0; i < wantN; i++) grid[beside[i].row][beside[i].col] = wantOrig[i]; // revert (rare)
        }
    }

    // Crystal Caves (world 5) — "Saving for big goals": place ONE savings gem on a
    // cell the solved route already walks (so it's reachable without changing par).
    // It is worth more the LATER you collect it, so the optimal play does other
    // work first and cashes it out late. The win only needs it collected (it's a
    // required gem); the GOLD medal needs it grabbed "ripe" (step >= ripeStep) —
    // the speed bonus is suppressed so patience isn't punished (see simulation).
    let growConfig: { growPerStep: number; ripeStep: number } | null = null;
    if (worldGate(worldIdx).growCoin || world9Pick(levelIdx) === 'grow') {
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const onPathEmpties = pathCells.filter(p =>
            p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols &&
            grid[p.row][p.col] === CellType.Empty && !(p.row === start.row && p.col === start.col));
        if (onPathEmpties.length > 0) {
            // Place the gem EARLY on the route (first third): the naive path now
            // grabs it green, so a ripe grab requires genuinely re-sequencing the
            // tour (do other work first) — not just idling next to a late gem.
            const g = onPathEmpties[Math.floor(random() * Math.max(1, Math.ceil(onPathEmpties.length / 3)))];
            grid[g.row][g.col] = CellType.Package_Savings;
            // The savings gem is now a REQUIRED collectible; re-solve and ADOPT that
            // path as the solution so it provably collects the gem (on portal-heavy
            // world-9 levels the traced path can otherwise miss it → missed_gem).
            const gCheck = solve({ grid, start, end: start, circuitLinks }, { requireAllGems: true });
            if (gCheck.isSolvable && gCheck.path) {
                growConfig = { growPerStep: 6, ripeStep: Math.max(4, Math.ceil(gCheck.path.length * 0.5)) };
                finalSolve = gCheck;
            } else {
                grid[g.row][g.col] = CellType.Empty; // revert — no savings gem this level
            }
        }
        // VERB INVARIANT (strict attempts): no savings gem = no saving lesson.
        if (!relaxed && !growConfig) return null;
    }

    if (!finalSolve.path) return null; // re-narrow after the grow block may have re-adopted the solve

    // Sunset Shores (world 6) — "Reach your goal, beat inflation": 1-2 FRESH coins
    // placed early on the route lose most of their value if grabbed after turn T.
    // The savings goal (min_score) is set just BELOW a fresh-grab run's score, so
    // letting coins go stale drops you under the goal. We simulate the solved route
    // through the value function to choose a goal that is always achievable.
    let inflateConfig: { inflateAt: number; minScore: number } | null = null;
    if (worldGate(worldIdx).inflation || world9Pick(levelIdx) === 'inflation') {
        const par0 = finalSolve.path.length;
        const T = Math.max(3, Math.ceil(par0 * 0.6));
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const seen = new Set<string>();
        const earlyEmpties: Position[] = [];
        pathCells.forEach((p, i) => {
            const k = `${p.row},${p.col}`;
            if (i > 0 && i <= T && p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols &&
                grid[p.row][p.col] === CellType.Empty && !seen.has(k)) { seen.add(k); earlyEmpties.push(p); }
        });
        if (earlyEmpties.length > 0) {
            shuffle(earlyEmpties);
            const n = Math.min(earlyEmpties.length, 2);
            for (let k = 0; k < n; k++) grid[earlyEmpties[k].row][earlyEmpties[k].col] = CellType.Inflating_Coin;
            const moveSeq = (finalSolve.path as Move[]).map((m, idx) => ({ move: m, id: idx }));
            // Simulate the fresh-grab solution WITH a placeholder goal so the score
            // already includes the multi-objective bonus the final level will carry.
            // The goal is then one inflation-gap (~27) below it (margin 18), so the
            // fresh solution clears it but letting any one coin go stale drops under.
            const inflTimeLimit = Math.ceil(par0 * 1.5) + 15;
            const tempLevel: Level = { grid, start, end: start, circuitLinks, par: par0, timeLimit: inflTimeLimit, inflateAt: T, objective: { type: 'min_score', minScore: 1 } };
            // Calibrate at levelTime = timeLimit (ZERO time bonus): the goal must
            // be clearable by a kid who plans slowly — the timer ticks while they
            // think. Fresh-vs-stale (~27/coin) still dwarfs the 18-point margin,
            // so letting a coin go stale still drops you under the goal.
            const sim = simulateGame(grid, start, moveSeq, tempLevel, inflTimeLimit);
            if (sim.outcome.success && sim.outcome.finalResult) {
                inflateConfig = { inflateAt: T, minScore: Math.max(1, sim.outcome.finalResult.scoreBreakdown.total - 18) };
            } else {
                for (let k = 0; k < n; k++) grid[earlyEmpties[k].row][earlyEmpties[k].col] = CellType.Empty; // revert
            }
        }
        // VERB INVARIANT (strict attempts): no fresh coins = no inflation lesson.
        if (!relaxed && !inflateConfig) return null;
    }

    // Lost Temple (world 7) — "Balancing your money": place 2-3 priced TOLL gates,
    // each with a bonus (a Boost) just past it, on spurs OFF the required route. The
    // budget (run wallet) can't fund every toll, so the player allocates it among the
    // bonuses. Required gems stay toll-free, so the level always solves without paying.
    let tollConfig: { startWallet: number; tollPrices: { [k: string]: number } } | null = null;
    if (worldGate(worldIdx).tollGate || world9Pick(levelIdx) === 'toll') {
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const used = new Set(pathCells.map(p => `${p.row},${p.col}`));
        const placedCells: { row: number; col: number; orig: CellType }[] = [];
        const tolls: { [k: string]: number } = {};
        const convertible = (r: number, c: number) =>
            r >= 0 && r < rows && c >= 0 && c < cols && !used.has(`${r},${c}`) &&
            (grid[r][c] === CellType.Empty || grid[r][c] === CellType.Wall);
        const TOLL_PRICES = [3, 2, 4]; // varied — so "which toll to skip" is a real comparison
        for (const p of pathCells) {
            if (Object.keys(tolls).length >= 3) break;
            for (const a of getNeighbors(p, rows, cols)) {
                if (!convertible(a.row, a.col)) continue;
                const b = getNeighbors(a, rows, cols).find(n => convertible(n.row, n.col));
                if (b) {
                    const aOrig = grid[a.row][a.col], bOrig = grid[b.row][b.col]; // may be Wall
                    grid[a.row][a.col] = CellType.Toll_Gate;
                    grid[b.row][b.col] = CellType.Boost;
                    tolls[`${a.row},${a.col}`] = TOLL_PRICES[Object.keys(tolls).length % TOLL_PRICES.length];
                    used.add(`${a.row},${a.col}`); used.add(`${b.row},${b.col}`);
                    placedCells.push({ row: a.row, col: a.col, orig: aOrig }, { row: b.row, col: b.col, orig: bOrig });
                    break; // one toll per path cell
                }
            }
        }
        const n = Object.keys(tolls).length;
        if (n >= 2) {
            // Prices vary (2/3/4) and the budget covers everything EXCEPT the
            // priciest toll. The kid can buy all-but-one bonus, and the best plan
            // is computable — skip the worst deal — so the allocation is a real
            // comparison, not an arbitrary pick among identical tolls.
            const prices = Object.values(tolls);
            const budget = prices.reduce((s, v) => s + v, 0) - Math.max(...prices);
            // The solver never models tolls, so this block used to be the ONE
            // escape from the verify-or-revert rule. Re-simulate the certified
            // solution with the toll economics live: if it crosses a toll it
            // can't afford (e.g. after a divergent path trace), the level would
            // ship hard-broke — revert instead of shipping it.
            const moveSeq = (finalSolve.path as Move[]).map((m, idx) => ({ move: m, id: idx }));
            const tollProbe: Level = { grid, start, end: start, circuitLinks, par: finalSolve.path.length, timeLimit: Math.ceil(finalSolve.path.length * 1.5) + 15, startWallet: budget, tollPrices: tolls };
            const tollSim = simulateGame(grid, start, moveSeq, tollProbe, 0);
            if (tollSim.outcome.success) {
                tollConfig = { startWallet: budget, tollPrices: tolls };
            } else {
                for (const c of placedCells) grid[c.row][c.col] = c.orig; // revert — certified path hit a toll
            }
        } else {
            for (const c of placedCells) grid[c.row][c.col] = c.orig; // revert to original (Wall/Empty)
        }
        // VERB INVARIANT (strict attempts): no tolls = no budgeting lesson.
        if (!relaxed && !tollConfig) return null;
    }

    // Volcanic Isles (world 8) — "Managing risk / emergency fund": put a SHOCK on
    // the route (it drains the reserve and is lethal if it can't cover the cost) and
    // a LIQUID_CASH coin EARLIER on the route (it refills the reserve). The starting
    // reserve is below the shock cost, so the player MUST collect the liquid first —
    // build your emergency fund before the surprise hits.
    let reserveConfig: { startWallet: number } | null = null;
    if (worldGate(worldIdx).reserveShock || world9Pick(levelIdx) === 'shock') {
        const pathCells = traceSolutionPath(start, finalSolve.path as Move[], portals);
        const empties: { p: Position; i: number }[] = [];
        pathCells.forEach((p, i) => {
            if (i > 0 && p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols &&
                grid[p.row][p.col] === CellType.Empty && !(p.row === start.row && p.col === start.col)) {
                empties.push({ p, i });
            }
        });
        if (empties.length >= 2) {
            const shockTarget = Math.ceil(finalSolve.path.length * 0.45);
            const shockE = empties.find(e => e.i >= shockTarget) ?? empties[empties.length - 1];
            const liquidE = empties.find(e => e.i < shockE.i) ?? empties[0];
            if (liquidE.i < shockE.i) {
                grid[shockE.p.row][shockE.p.col] = CellType.Shock;
                grid[liquidE.p.row][liquidE.p.col] = CellType.Liquid_Cash;
                const sw = 1; // reserve < shock cost (3) → you NEED the liquid (+3) to survive
                const check = solve({ grid, start, end: start, circuitLinks, startWallet: sw }, { requireAllGems: true });
                if (check.isSolvable && check.path) {
                    finalSolve = check;             // re-adopt the liquid-before-shock path as the canonical solution
                    reserveConfig = { startWallet: sw };
                } else {
                    grid[shockE.p.row][shockE.p.col] = CellType.Empty;
                    grid[liquidE.p.row][liquidE.p.col] = CellType.Empty; // revert
                }
            }
        }
        // VERB INVARIANT (strict attempts): no shock+liquid = no emergency-fund lesson.
        if (!relaxed && !reserveConfig) return null;
    }

    if (!finalSolve.path) return null; // re-narrow after any block re-adopted the solve
    const pathLength = finalSolve.path.length;
    const baselineTimeLimit = Math.ceil(pathLength * 1.5) + 15;

    // Score objectives are calibrated against a SIMULATED run of the certified
    // solution at levelTime = timeLimit — i.e. ZERO time bonus. The timer ticks
    // while a kid plans, so any goal that bakes in the time bonus is unwinnable
    // for slow planners (this shipped as 7% of the campaign, 40% of world 7).
    // Simulating (instead of the old analytic estimate) also prices in every
    // wallet mechanic — drains, tolls, savings growth, inflation — automatically.
    // (Generalizes the W6 simulate-and-calibrate pattern to all objectives.)
    const calibLevel: Level = {
        grid, start, end: start, circuitLinks, par: pathLength, timeLimit: baselineTimeLimit,
        ...(walletConfig ?? {}),
        ...(growConfig ?? {}),
        ...(inflateConfig ? { inflateAt: inflateConfig.inflateAt } : {}),
        ...(tollConfig ? { startWallet: tollConfig.startWallet, tollPrices: tollConfig.tollPrices } : {}),
        ...(reserveConfig ? { startWallet: reserveConfig.startWallet } : {}),
    };
    const calibSeq = (finalSolve.path as Move[]).map((m, idx) => ({ move: m, id: idx }));
    const calibSim = simulateGame(grid, start, calibSeq, calibLevel, baselineTimeLimit);
    if (!calibSim.outcome.success || !calibSim.outcome.finalResult) {
        // The certified solution must clear its own level — a failure here means
        // some mechanic broke it; reject rather than ship a suspect board.
        if (!relaxed) return null;
    }
    const pessimisticScore = calibSim.outcome.finalResult?.scoreBreakdown.total
        ?? (config.gemCount * POINTS.gem_value + POINTS.level_clear_base + POINTS.par_met_bonus);

    const archetype = getLevelArchetype(levelIdx);
    const gate = worldGate(worldIdx);
    let objective: Level['objective'] | undefined;

    // Objectives are GATED to the world that introduces them, so each goal type
    // debuts as that world's money concept and never appears early:
    //   • max_moves  → Snowy Peak (world 4): "don't waste a step"
    //   • min_score  → Sunset Shores (world 6): "hit your savings goal"
    //   • combo      → Lost Temple (world 7): "balance every goal at once"
    // Collecting EVERY package is always required (the saving lesson), so we no
    // longer hand out collect_ratio goals that would let players skip pickups.
    const tightMoves = pathLength + (random() < 0.5 ? 0 : 1);
    const scoreGoal = (mul: number, floor: number): Level['objective'] =>
        ({ type: 'min_score', minScore: Math.max(floor, Math.floor(pessimisticScore * mul)) });

    if (growConfig) {
        // Crystal Caves grow levels: no SCORE/TIME pressure (that would contradict
        // "let your savings grow"), but a LOOSE move budget bounds the old stall
        // exploit — pacing in place forever is no longer free; RE-SEQUENCING the
        // tour is how you ripen the gem. The stored solution always fits.
        objective = { type: 'max_moves', maxMoves: pathLength + Math.max(3, Math.ceil(pathLength * 0.6)) };
    } else if (inflateConfig) {
        // Sunset Shores: the savings GOAL is a min_score set just below a fresh-grab
        // run's score (computed at gen time), so it is always reachable but letting
        // coins go stale drops you under it.
        objective = { type: 'min_score', minScore: inflateConfig.minScore };
    } else if (worldIdx === 0) {
        // The Meadow — "Earning": coins are OPTIONAL income, not a forced fetch.
        // Relax the implicit collect-all gate to "grab at least one coin and get
        // home" (collect_ratio 0.25 → requiredGemTarget = 1) so deciding to work
        // for each extra coin is a real choice. The in-level coin HUD and the
        // all-coins Gold medal carry the mastery target. Every later world keeps
        // the collect-all rule by setting no objective here.
        objective = { type: 'collect_ratio', ratio: 0.25 };
    } else if (gate.comboObjective && random() < 0.55) {
        // "Balance everything": collect all (implicit) + stay under moves + hit
        // score. The gate is 90% of the PESSIMISTIC (zero-time-bonus) run; the
        // real run also earns the multi-objective bonus on top, so even a slow
        // planner clears it with headroom — speed is the medals' job, not the
        // win condition's.
        const minScore = Math.max(80, Math.floor(pessimisticScore * 0.9));
        objective = {
            type: 'combo',
            objectives: [
                { type: 'max_moves', maxMoves: tightMoves + 1 },
                { type: 'min_score', minScore },
            ],
        };
    } else if (archetype.forceObjective === 'tight_moves' && gate.moveObjective) {
        objective = { type: 'max_moves', maxMoves: pathLength };
    } else if (archetype.forceObjective === 'high_score' && gate.scoreObjective) {
        objective = scoreGoal(0.85, 60);
    } else if (gate.scoreObjective && random() < 0.55) {
        objective = scoreGoal(0.83, 60);
    } else if (gate.moveObjective && random() < 0.5) {
        objective = { type: 'max_moves', maxMoves: tightMoves };
    }

    return {
        grid, start, end: start, circuitLinks, theme,
        solution: finalSolve.path as Move[],
        par: pathLength,
        timeLimit: baselineTimeLimit,
        objective,
        ...(walletConfig ?? {}),
        ...(disguised ? { disguised, inspectBudget } : {}),
        ...(growConfig ?? {}),
        ...(inflateConfig ? { inflateAt: inflateConfig.inflateAt } : {}),
        ...(tollConfig ? { startWallet: tollConfig.startWallet, tollPrices: tollConfig.tollPrices } : {}),
        ...(reserveConfig ? { startWallet: reserveConfig.startWallet } : {}),
    };
}

// Generate several candidates and keep the one whose MEASURED difficulty lands
// closest to difficultyTarget(targetIdx). Because the target only ever rises,
// this is what makes the campaign strictly progressive: a level can no longer
// come out far easier (or harder) than its neighbours just because of a lucky
// maze roll. `genIdx` controls the layout/mechanic budget; `targetIdx` controls
// the difficulty band (they're equal for the campaign, but Money Mountain maps
// its lessons onto gentle campaign-equivalent bands).
// Fixed salt so every campaign board is REPRODUCIBLE: level N is the same board
// for every kid, every session, every retry — bug reports become reproducible,
// retries stop silently swapping the puzzle, and the background preloader can no
// longer shift the RNG stream under a level load. (Daily/coop/tournament seed
// themselves per mode before calling attemptGenerateLevel directly.)
const CAMPAIGN_SALT = 0x51ED0;

const generateBestCandidate = async (genIdx: number, targetIdx: number): Promise<Level | null> => {
    const target = difficultyTarget(targetIdx);
    let best: Level | null = null;
    let bestDelta = Infinity;
    const startMs = Date.now();
    for (let i = 0; i < 80; i++) {
        setSeed(CAMPAIGN_SALT + genIdx * 9973 + i * 101);
        const level = attemptGenerateLevel(genIdx);
        if (level) {
            const delta = Math.abs(measureDifficulty(level) - target);
            if (delta < bestDelta) { best = level; bestDelta = delta; }
            if (bestDelta <= 3) break;            // close enough — stay snappy
            if (best && i >= 16) break;           // good-enough after a real sample
        }
        // Wall-clock budget: heavy late-world layouts (many collectibles + portals
        // + per-candidate calibration/toll re-sims) make each candidate slow, so
        // cap the search once we have a usable level rather than dragging on.
        if (best && Date.now() - startMs > 1200) break;
        // HARD cap even with no candidate yet: the verb invariants can make a
        // stubborn index reject every strict attempt, and without this the loop
        // would burn all 80 heavy solves (seen: a 9.8s load). Bail to the relaxed
        // fallback instead of hanging the level transition.
        if (!best && Date.now() - startMs > 2500) break;
        await new Promise(r => setTimeout(r, 0));
    }
    // Fallback: if strict per-world checks (e.g. the W2 shortcut requirement)
    // rejected every candidate, generate a relaxed one so a level ALWAYS loads.
    for (let i = 0; i < 24 && !best && Date.now() - startMs < 4000; i++) {
        setSeed(CAMPAIGN_SALT + genIdx * 9973 + 7919 + i * 101);
        best = attemptGenerateLevel(genIdx, undefined, undefined, true);
        if (best) console.warn(`[levelGen] relaxed fallback used for level ${genIdx} (attempt ${i}) — verb guarantees may be loosened`);
    }
    // NOTE: a rare heavy W7-class solve can still make a single candidate take
    // multiple seconds (solver O(n) queue vs 90k node cap — see audit roadmap #9,
    // a dedicated solver-perf pass). The 1s background preloader hides this in
    // sequential play; loadLevel's null-fallback covers the (bounded) worst case.
    return best;
};

export const generateLevelByIndex = async (levelIdx: number): Promise<Level | null> => {
    // Money Mountain lessons generate at a fixed, gentle campaign-equivalent
    // difficulty and wear the money-world skin regardless of campaign progress.
    if (isMoneyLevel(levelIdx)) {
        const lessonIdx = moneyLessonIndex(levelIdx);
        const effectiveIdx = MONEY_LESSON_DIFFICULTY[lessonIdx];
        const level = await generateBestCandidate(effectiveIdx, effectiveIdx);
        if (level) {
            level.theme = MONEY_WORLD.theme;
            level.name = MONEY_LESSONS[lessonIdx].title;
            // "Learn by doing": efficiency/budget lessons get a move limit so
            // finishing under it IS the lesson. Others keep collect-all rules.
            if (level.par) {
                const obj = moneyLessonObjective(lessonIdx, level.par);
                if (obj) level.objective = obj;
            }
        }
        return level;
    }
    if (levelIdx < 5 && levelIdx < TUTORIAL_LEVELS.length) {
        const base = TUTORIAL_LEVELS[levelIdx];
        return {
            ...base,
            grid: base.grid.map(row => [...row]),
            par: base.par || Math.ceil(base.solution?.length || 10),
            timeLimit: base.timeLimit || 45,
        };
    }
    return generateBestCandidate(levelIdx, levelIdx);
};

export const generateCustomLevel = async (rows: number, cols: number): Promise<Level | null> => {
    const area = rows * cols;
    let levelIdx = area > 40 ? 80 : 40;
    for (let i = 0; i < 50; i++) {
        const level = attemptGenerateLevel(levelIdx, rows, cols);
        if (level) return level;
        await new Promise(r => setTimeout(r, 0));
    }
    return null;
}
