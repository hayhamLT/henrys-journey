
import { Level, Position, Move, CellType } from '../types';

interface QueueState {
  pos: Position;
  moves: Move[];
  collectedMask: number;
  crumbledMask: number;
  // Run wallet (W1). Bounded (0..startWallet, small) so it barely grows the
  // search. Stepping a WantTile drains it; the goal requires wallet >= exitPrice.
  wallet: number;
}

interface SolveOptions {
  requireAllGems: boolean;
}

const packageTypes = [
  CellType.Package,
  CellType.Package_Blue,
  CellType.Package_Purple,
  CellType.Package_Circuit,
  CellType.Package_Red,
  CellType.Package_Orange,
  CellType.Package_Cyan,
  CellType.PhaseShifter,
  CellType.Package_AutoSolver,
  CellType.Package_Savings,
  CellType.Inflating_Coin,
  CellType.Liquid_Cash,
];

export const solve = (level: Level, options: SolveOptions = { requireAllGems: true }): { isSolvable: boolean; path: Move[] | null } => {
  const { grid, start, end } = level;
  if (!start || !end) return { isSolvable: false, path: null };
  const rows = grid.length;
  const cols = grid[0].length;

  const allCollectibles: Position[] = [];
  const crumblingFloors: Position[] = [];
  const wantTiles = new Set<string>();
  const shockTiles = new Set<string>();
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (packageTypes.includes(cell)) {
        allCollectibles.push({ row: r, col: c });
      }
      if (cell === CellType.CrumblingFloor) {
        crumblingFloors.push({ row: r, col: c });
      }
      if (cell === CellType.WantTile) {
        wantTiles.add(`${r},${c}`);
      }
      if (cell === CellType.Shock) {
        shockTiles.add(`${r},${c}`);
      }
    });
  });
  // W8 "emergency fund": the run wallet doubles as a reserve. Shocks drain it (and
  // are lethal if it can't cover the cost); liquid-cash refills it up to a cap.
  const SHOCK_COST = 3, LIQUID_REFILL = 3, RESERVE_CAP = 5;

  // Run-wallet config (W1). Inactive (startWallet undefined) → wallet stays a
  // constant 0 and exitPrice is null, so the extra state dimension is a no-op
  // and does not change behaviour for the other 99% of levels.
  const startWallet = level.startWallet ?? 0;
  const wantCost = level.wantCost ?? 0;
  const exitPrice = level.exitPrice ?? null;
  const drainPerStep = !!level.drainPerStep; // W4: purse loses 1 per step

  // STRICT VICTORY CONDITION: Only Green Gems (CellType.Package) are required to exit.
  // Keys are implicit requirements (needed for traversal), so the solver will naturally collect them
  // if and only if they are necessary to reach the required Gems or the Exit.
  const requiredGems = options.requireAllGems
      ? allCollectibles.filter(p => {
          const t = grid[p.row][p.col];
          return t === CellType.Package || t === CellType.Package_Savings || t === CellType.Inflating_Coin || t === CellType.Liquid_Cash;
        })
      : [];

  const circuitLinks = level.circuitLinks || {};
  const fieldToKeyMap = new Map<string, string[]>();
  for (const keyPosStr in circuitLinks) {
    for (const fieldPosStr of circuitLinks[keyPosStr]) {
      if (!fieldToKeyMap.has(fieldPosStr)) {
        fieldToKeyMap.set(fieldPosStr, []);
      }
      fieldToKeyMap.get(fieldPosStr)!.push(keyPosStr);
    }
  }

  // Pre-calculate teleporter links for performance
  const teleporterMap = new Map<string, Position>();
  const teleporters: { pos: Position, type: CellType }[] = [];
  grid.forEach((row, r) => row.forEach((cell, c) => {
      if (cell >= CellType.Teleporter_A && cell <= CellType.Teleporter_F) {
          teleporters.push({ pos: { row: r, col: c }, type: cell });
      }
  }));

  const teleporterPairs: { [key in CellType]?: CellType } = {
    [CellType.Teleporter_A]: CellType.Teleporter_B, [CellType.Teleporter_B]: CellType.Teleporter_A,
    [CellType.Teleporter_C]: CellType.Teleporter_D, [CellType.Teleporter_D]: CellType.Teleporter_C,
    [CellType.Teleporter_E]: CellType.Teleporter_F, [CellType.Teleporter_F]: CellType.Teleporter_E,
  };

  teleporters.forEach(t1 => {
      const partnerType = teleporterPairs[t1.type];
      const partner = teleporters.find(t2 => t2.type === partnerType);
      if (partner) {
          teleporterMap.set(`${t1.pos.row},${t1.pos.col}`, partner.pos);
      }
  });

  const queue: QueueState[] = [{ pos: start, moves: [], collectedMask: 0, crumbledMask: 0, wallet: startWallet }];
  const visited = new Set<string>(); // key: "row,col,collectedMask,crumbledMask,wallet"

  const getVisitedKey = (pos: Position, collected: number, crumbled: number, wallet: number) => `${pos.row},${pos.col},${collected},${crumbled},${wallet}`;

  visited.add(getVisitedKey(start, 0, 0, startWallet));

  const isMoveValid = (pos: Position, collected: number, crumbled: number) => {
    if (pos.row < 0 || pos.row >= rows || pos.col < 0 || pos.col >= cols) return false;
    
    let cellType = grid[pos.row][pos.col];
    const crumblingIndex = crumblingFloors.findIndex(f => f.row === pos.row && f.col === pos.col);
    if (crumblingIndex !== -1 && (crumbled & (1 << crumblingIndex))) {
      cellType = CellType.Hole;
    }
    
    if ([CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Purple, CellType.ForceField_Red, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(cellType)) {
        const posStr = `${pos.row},${pos.col}`;
        const unlockingKeys = fieldToKeyMap.get(posStr);
        let isUnlocked = false;
        if (unlockingKeys) {
            for (const keyPosStr of unlockingKeys) {
                const gemIndex = allCollectibles.findIndex(g => `${g.row},${g.col}` === keyPosStr);
                if (gemIndex !== -1 && (collected & (1 << gemIndex))) {
                    isUnlocked = true;
                    break;
                }
            }
        }
        if (!isUnlocked) {
            return false;
        } else {
            // If it's unlocked, treat it as an empty square for the rest of validation
            cellType = CellType.Empty;
        }
    }

    // Toll gates are treated as impassable here: a W7 level's REQUIRED gems are
    // always reachable toll-free, so the win route never needs to pay a toll. This
    // keeps the wallet from branching the BFS into the node cap on dense boss levels
    // (the optional toll-gated bonuses are not the solver's concern).
    const invalidCells = [CellType.Wall, CellType.Bomb, CellType.Trap, CellType.Hole, CellType.OutOfBounds, CellType.Toll_Gate];
    const wallLike = [CellType.Wall_H_Left, CellType.Wall_H_Right, CellType.Wall_V_Top, CellType.Wall_V_Bottom];
    if (invalidCells.includes(cellType) || wallLike.includes(cellType)) {
        return false;
    }
    return true;
  };

  // Node cap: the BFS state is (pos × collectedMask × crumbledMask × wallet), so a
  // level with many collectibles can blow up to millions of states and take seconds.
  // Cap it generously — the median solve visits well under a thousand nodes, so this
  // only trips on pathological layouts, which we treat as "too complex" (unsolvable)
  // and the generator simply rolls another candidate. Keeps level loads snappy.
  //
  // We dequeue with a HEAD POINTER (queue[head++]) rather than queue.shift(): shift()
  // is O(n), so on a big late-world solve where the frontier grows to tens of
  // thousands, draining it degraded to ~O(n²) and a single hard board (e.g. campaign
  // level 79, a 9-wide W7 layout with 3 portals) took ~5s and blew the cap before
  // finding its route. With O(1) dequeue each node-pop is cheap, so we can both keep
  // loads snappy AND raise the cap enough to actually reach those late-game solutions.
  let nodes = 0;
  let head = 0;
  while (head < queue.length) {
    if (++nodes > 250000) return { isSolvable: false, path: null };
    const { pos, moves, collectedMask, crumbledMask, wallet } = queue[head++];

    const allRequiredGemsCollected = requiredGems.every(gem => {
        const gemGlobalIndex = allCollectibles.findIndex(g => g.row === gem.row && g.col === gem.col);
        if (gemGlobalIndex === -1) return true; // Should not happen
        return (collectedMask & (1 << gemGlobalIndex)) !== 0;
    });

    // Goal also requires affording the exit (W1): a route that spent its wallet
    // on a want cannot win, so the BFS keeps searching for a solvent route.
    const canAffordExit = exitPrice === null || wallet >= exitPrice;

    if (pos.row === end.row && pos.col === end.col && allRequiredGemsCollected && canAffordExit) {
      return { isSolvable: true, path: moves };
    }

    const directions: { move: Move; dr: number; dc: number }[] = [
      { move: Move.Up, dr: -1, dc: 0 }, { move: Move.Down, dr: 1, dc: 0 },
      { move: Move.Left, dr: 0, dc: -1 }, { move: Move.Right, dr: 0, dc: 1 },
    ];

    for (const { move, dr, dc } of directions) {
      let currentPos = { row: pos.row, col: pos.col };
      let nextPos = { row: pos.row + dr, col: pos.col + dc };
      
      let nextCrumbledMask = crumbledMask;
      const prevCrumblingIndex = crumblingFloors.findIndex(f => f.row === currentPos.row && f.col === currentPos.col);
      if (prevCrumblingIndex !== -1 && grid[currentPos.row][currentPos.col] === CellType.CrumblingFloor) {
          nextCrumbledMask |= (1 << prevCrumblingIndex);
      }

      if (!isMoveValid(nextPos, collectedMask, nextCrumbledMask)) continue;

      let nextCollectedMask = collectedMask;
      
      // Check for item at the move target cell (A)
      const gemIndexA = allCollectibles.findIndex(g => g.row === nextPos.row && g.col === nextPos.col);
      if (gemIndexA !== -1) {
        nextCollectedMask |= (1 << gemIndexA);
      }

      // W4: every step drains 1 from the purse; stepping a WantTile drains more
      // (wants are never teleporters, so this is checked at the move target).
      let nextWallet = wallet;
      if (drainPerStep) nextWallet = Math.max(0, nextWallet - 1);
      if (wantTiles.has(`${nextPos.row},${nextPos.col}`)) {
        nextWallet = Math.max(0, nextWallet - wantCost);
      }
      // (W7 tolls are impassable for the solver — see invalidCells above.)

      // W8: a shock drains the reserve and is LETHAL if it can't be covered — prune
      // the state (no surviving route crosses this shock with this little reserve).
      if (shockTiles.has(`${nextPos.row},${nextPos.col}`)) {
        if (nextWallet < SHOCK_COST) continue;
        nextWallet = Math.max(0, nextWallet - SHOCK_COST);
      }
      // W8: liquid cash refills the reserve the first time it is collected.
      if (gemIndexA !== -1 && grid[nextPos.row][nextPos.col] === CellType.Liquid_Cash && !(collectedMask & (1 << gemIndexA))) {
        nextWallet = Math.min(RESERVE_CAP, nextWallet + LIQUID_REFILL);
      }

      let finalPos = { ...nextPos };
      const partnerPos = teleporterMap.get(`${nextPos.row},${nextPos.col}`);
      if (partnerPos) {
          finalPos = partnerPos;
          // Check for item at the teleport destination cell (B)
          const gemIndexB = allCollectibles.findIndex(g => g.row === finalPos.row && g.col === finalPos.col);
          if (gemIndexB !== -1) {
            nextCollectedMask |= (1 << gemIndexB);
          }
      }

      const visitedKey = getVisitedKey(finalPos, nextCollectedMask, nextCrumbledMask, nextWallet);
      if (visited.has(visitedKey)) continue;
      visited.add(visitedKey);

      const newMoves = [...moves, move];
      queue.push({ pos: finalPos, moves: newMoves, collectedMask: nextCollectedMask, crumbledMask: nextCrumbledMask, wallet: nextWallet });
    }
  }

  return { isSolvable: false, path: null };
};
