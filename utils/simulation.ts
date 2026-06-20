
import { CellType, Move, Position, MoveWithId, FailureType, LevelResult, Level } from '../types';
import { POINTS } from '../constants/game';
import { countRequiredObjectiveGems, getObjectiveConstraintCount, getObjectiveMoveLimit, getObjectiveScoreTarget, getRequiredObjectiveGemTarget, isRequiredObjectiveGemType } from './objectives';
import { computeMedal } from './medals';

// Every collectible "package" cell type (colored keys included). Boost pads are
// a separate bonus and are NOT counted here.
const PACKAGE_TYPES: CellType[] = [
    CellType.Package, CellType.Package_Blue, CellType.Package_Purple, CellType.Package_Circuit,
    CellType.Package_Red, CellType.Package_Orange, CellType.Package_Cyan,
    CellType.PhaseShifter, CellType.Package_AutoSolver, CellType.Package_Savings, CellType.Inflating_Coin, CellType.Liquid_Cash,
];

// W6 inflating-coin values: a fresh grab (on/before turn T) is worth far more than
// a stale one — the gap is what makes "beat inflation" bite.
const INFLATE_FRESH = 30;
const INFLATE_STALE = 6;

// W8 "emergency fund": the run wallet doubles as a reserve. A Shock drains it (and
// is lethal if it can't cover the cost); Liquid_Cash refills it up to a cap.
const SHOCK_COST = 3, LIQUID_REFILL = 3, RESERVE_CAP = 5;

export interface VisualStep {
    pos: Position;
    collect?: { type: CellType, score: number };
    isCrumble?: boolean;
    crumblePos?: Position;
    isFailure?: boolean;
    failType?: FailureType;
    hitPos?: Position;
    sound?: string;
    comboIndex?: number; // 1-based length of the unbroken collect chain at this pickup
}

export interface SimulationResult {
    path: (Position & { isTeleport?: boolean; isCollision?: boolean })[];
    visualSteps: Map<number, VisualStep>;
    visualStepToMoveIndex: number[];
    outcome: { 
        success: boolean; 
        finalResult?: LevelResult; 
        failure?: FailureType;
    };
    newSequence: MoveWithId[]; // Sequence with effects attached
}

export const simulateGame = (
    grid: CellType[][], 
    startPos: Position, 
    moveSequence: MoveWithId[], 
    currentLevel: Level,
    levelTime: number
): SimulationResult => {
    const boostScoreValue = 10;
    const visualSteps = new Map<number, VisualStep>();
    const visualStepToMoveIndex: number[] = [];
    
    let currentRow = startPos.row; 
    let currentCol = startPos.col;
    const path: (Position & { isTeleport?: boolean; isCollision?: boolean })[] = [{ row: currentRow, col: currentCol }];
    
    let failType: FailureType = null; 
    let hitPos: Position | null = null;
    
    const totalRequiredGems = countRequiredObjectiveGems(grid);
    const requiredGemTarget = getRequiredObjectiveGemTarget(currentLevel, totalRequiredGems);
    const objectiveMoveLimit = getObjectiveMoveLimit(currentLevel);
    const objectiveScoreTarget = getObjectiveScoreTarget(currentLevel);
    const objectiveConstraintCount = getObjectiveConstraintCount(currentLevel, totalRequiredGems, requiredGemTarget);
    
    let collectedCount = 0;
    let collectedRequiredCount = 0;
    let collectedBoostScore = 0;
    let collectedBoostCount = 0;
    let totalCollectiblePackages = 0;
    let totalBoostCells = 0;
    // Combo chain: consecutive pickups with no empty move between them. Drives a
    // rising-pitch SFX, an "xN" popup, and an additive comboBonus folded into the
    // completion score (NOT gemScore) so success math + difficulty stay untouched.
    let comboCount = 0;
    let comboBonus = 0;
    // Run wallet (W1 "Spend-to-pass"): starts at startWallet, drained by stepping
    // WantTiles. null = this level has no wallet mechanic. To WIN you must reach
    // home with wallet >= exitPrice (see outcome block), else fail 'broke'.
    let wallet: number | null = (typeof currentLevel.startWallet === 'number') ? currentLevel.startWallet : null;
    const wantCost = currentLevel.wantCost ?? 0;
    const drainPerStep = !!currentLevel.drainPerStep; // W4: purse loses 1 per step
    const tollPrices = currentLevel.tollPrices ?? {};  // W7: priced toll gates
    const hasToll = Object.keys(tollPrices).length > 0;
    // W5 "Let it grow": the savings gem is worth more the later you grab it. We
    // track the step it was collected and the bonus over a flat gem so the score
    // (and the Gold-medal "ripe" check) reward patience. Grow levels also suppress
    // the speed bonus so waiting is not punished.
    const growPerStep = currentLevel.growPerStep ?? 0;
    const ripeStep = currentLevel.ripeStep ?? 0;
    const hasSavingsGem = grid.some(row => row.includes(CellType.Package_Savings));
    // W6 inflation: coins grabbed on/before inflateAt are FRESH, otherwise STALE.
    const inflateAt = currentLevel.inflateAt ?? null;
    const hasInflating = grid.some(row => row.includes(CellType.Inflating_Coin));
    let inflateBonus = 0; // value of inflating coins beyond a flat gem (folded into score)
    // W5 grow levels AND W6 inflation levels suppress the speed bonus so the score
    // reflects coin VALUE (patience / freshness), not move/time efficiency.
    const suppressSpeedBonus = hasSavingsGem || hasInflating;
    let savingsCollected = false;
    let savingsStep = 0;
    let savingsBonus = 0; // growth value beyond the flat gem_value the gem already scores
    const tempCollectedMask: Record<string, boolean> = {};
    const tempCrumbledMask: Record<string, boolean> = {};
    const teleporters: Record<string, Position> = {};

    // Map Teleporters (and tally total collectibles for the "all gems" medal signal)
    grid.forEach((row, r) => row.forEach((cell, c) => {
        if (PACKAGE_TYPES.includes(cell)) totalCollectiblePackages++;
        if (cell === CellType.Boost) totalBoostCells++;
        if (cell >= CellType.Teleporter_A && cell <= CellType.Teleporter_F) {
            const pairs: Record<number, number> = { 
                [CellType.Teleporter_A]: CellType.Teleporter_B, [CellType.Teleporter_B]: CellType.Teleporter_A, 
                [CellType.Teleporter_C]: CellType.Teleporter_D, [CellType.Teleporter_D]: CellType.Teleporter_C, 
                [CellType.Teleporter_E]: CellType.Teleporter_F, [CellType.Teleporter_F]: CellType.Teleporter_E 
            };
            const partnerType = pairs[cell];
            grid.forEach((pr, tr) => pr.forEach((pc, tc) => { if (pc === partnerType) { teleporters[`${r},${c}`] = { row: tr, col: tc }; } }));
        }
    }));

    const newSequence: MoveWithId[] = moveSequence.map(m => ({ ...m, effect: undefined }));
    let visualStepCounter = 0;
    visualSteps.set(0, { pos: {row: currentRow, col: currentCol} });

    for (let i = 0; i < newSequence.length; i++) {
        const move = newSequence[i].move; 
        const previousRow = currentRow; 
        const previousCol = currentCol; 
        let nextRow = currentRow; 
        let nextCol = currentCol;
        
        if (move === Move.Up) nextRow--; 
        else if (move === Move.Down) nextRow++; 
        else if (move === Move.Left) nextCol--; 
        else if (move === Move.Right) nextCol++;
        
        visualStepCounter++; 
        visualStepToMoveIndex[visualStepCounter] = i; 
        
        // 1. Boundary Check
        if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length) { 
            failType = 'hole'; 
            hitPos = { row: nextRow, col: nextCol }; 
            path.push({ row: nextRow, col: nextCol }); 
            visualSteps.set(visualStepCounter, { pos: {row: nextRow, col: nextCol}, isFailure: true, failType: 'hole', hitPos });
            break; 
        }

        const cell = grid[nextRow][nextCol]; 
        const posKey = `${nextRow},${nextCol}`; 
        let isBlocked = false; 
        let blockType: FailureType = null;

        // 2. Collision Check (Walls, Bombs, Forcefields)
        if (cell === CellType.Wall) { isBlocked = true; blockType = 'wall'; } 
        else if (cell === CellType.Bomb) { isBlocked = true; blockType = 'bomb'; }
        else if ([CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Red, CellType.ForceField_Purple, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(cell)) {
            let hasKey = false; 
            if (currentLevel.circuitLinks) { 
                for (const [keyPos, targets] of Object.entries(currentLevel.circuitLinks)) { 
                    if ((targets as string[]).includes(`${nextRow},${nextCol}`)) { 
                        if (tempCollectedMask[keyPos]) hasKey = true; 
                        break; 
                    } 
                } 
            }
            if (!hasKey) { isBlocked = true; blockType = 'wall'; }
        }
        else if (cell === CellType.Toll_Gate) {
            // W7: a toll is a ONE-TIME purchase — once paid you may re-cross free (so
            // a bonus down a dead-end spur isn't a trap). The first cross needs the
            // price; if you can't afford it, blocked → 'broke'.
            const price = tollPrices[posKey] ?? 0;
            const alreadyPaid = tempCollectedMask[posKey];
            if (!alreadyPaid && (wallet === null || wallet < price)) { isBlocked = true; blockType = 'broke'; }
        }

        if (isBlocked) {
            failType = blockType; 
            path.push({ row: nextRow, col: nextCol, isCollision: true }); 
            hitPos = { row: nextRow, col: nextCol }; 
            newSequence[i].effect = { type: 'collision' };
            visualSteps.set(visualStepCounter, { pos: {row: currentRow, col: currentCol}, isFailure: true, failType: blockType, hitPos });
            break; 
        }

        const stepData: VisualStep = { pos: {row: nextRow, col: nextCol} };
        let didCollect = false; // did THIS move pick anything up? (drives combo reset)

        // 3. Hazard/Power-up Check
        if (cell === CellType.Hole || tempCrumbledMask[posKey]) { 
            failType = 'hole'; 
            path.push({ row: nextRow, col: nextCol }); 
            visualSteps.set(visualStepCounter, { pos: {row: nextRow, col: nextCol}, isFailure: true, failType: 'hole' });
            break; 
        }
        if (cell === CellType.Shock) {
            // W8: a surprise bill. Your reserve absorbs it if it can; if it can't,
            // the shock wipes you out ('broke') — the emergency-fund lesson.
            if (wallet !== null && wallet >= SHOCK_COST) {
                wallet -= SHOCK_COST;
                stepData.sound = 'removeMove';
            } else {
                failType = 'broke';
                path.push({ row: nextRow, col: nextCol });
                visualSteps.set(visualStepCounter, { pos: {row: nextRow, col: nextCol}, isFailure: true, failType: 'broke' });
                break;
            }
        }
        if (cell === CellType.Trap) {
            failType = 'trap';
            path.push({ row: nextRow, col: nextCol });
            visualSteps.set(visualStepCounter, { pos: {row: nextRow, col: nextCol}, isFailure: true, failType: 'trap' });
            break;
        }
        if (cell === CellType.Boost && !tempCollectedMask[posKey]) {
            tempCollectedMask[posKey] = true;
            collectedBoostScore += boostScoreValue;
            collectedBoostCount++;
            comboCount++; didCollect = true;
            comboBonus += Math.max(0, comboCount - 1) * 2;
            stepData.sound = 'collect';
            stepData.collect = { type: CellType.Boost, score: boostScoreValue };
            stepData.comboIndex = comboCount;
            newSequence[i].effect = { type: 'collect', itemType: CellType.Boost };
        }

        // 4. Move Successful
        currentRow = nextRow;
        currentCol = nextCol;
        path.push({ row: currentRow, col: currentCol });

        // W4 "Don't waste it": the purse loses a coin every single step, so a
        // wandering route runs you dry before you reach home.
        if (wallet !== null && drainPerStep) {
            wallet = Math.max(0, wallet - 1);
        }

        // Impulse-buy "want": walkable, no reward — stepping it DRAINS the run
        // wallet (charged each step; the optimal route simply avoids it). The
        // wallet HUD already telegraphs this loss during planning.
        if (wallet !== null && cell === CellType.WantTile) {
            wallet = Math.max(0, wallet - wantCost);
            stepData.sound = 'removeMove';
        }

        // W7: the FIRST time you cross a toll, pay its price (once); re-crossing is free.
        if (wallet !== null && cell === CellType.Toll_Gate && !tempCollectedMask[posKey]) {
            tempCollectedMask[posKey] = true;
            wallet = Math.max(0, wallet - (tollPrices[posKey] ?? 0));
            stepData.sound = 'removeMove';
        }
        
        // Handle Crumbling Floor leaving
        const prevCellType = grid[previousRow][previousCol];
        if (prevCellType === CellType.CrumblingFloor) { 
            tempCrumbledMask[`${previousRow},${previousCol}`] = true; 
            stepData.isCrumble = true; 
            stepData.crumblePos = { row: previousRow, col: previousCol };
        }

        // 5. Collection Logic
        const isPackage = [CellType.Package, CellType.Package_Blue, CellType.Package_Purple, CellType.Package_Circuit, CellType.Package_Red, CellType.Package_Orange, CellType.Package_Cyan, CellType.PhaseShifter, CellType.Package_AutoSolver, CellType.Package_Savings, CellType.Inflating_Coin, CellType.Liquid_Cash].includes(cell);
        if (isPackage && !tempCollectedMask[`${currentRow},${currentCol}`]) {
            tempCollectedMask[`${currentRow},${currentCol}`] = true;
            collectedCount++;
            if (isRequiredObjectiveGemType(cell)) { collectedRequiredCount++; }
            comboCount++; didCollect = true;
            comboBonus += Math.max(0, comboCount - 1) * 2;

            // W5: the savings gem ripens — worth more the later (higher step i) you
            // grab it, capped. The extra over a flat gem is savingsBonus.
            let collectScore = POINTS.gem_value;
            if (cell === CellType.Package_Savings) {
                savingsCollected = true;
                savingsStep = i;
                savingsBonus = Math.min(growPerStep * i, growPerStep * 12);
                collectScore = POINTS.gem_value + savingsBonus;
            } else if (cell === CellType.Inflating_Coin) {
                // W6: fresh (grabbed on/before T) is worth a lot; stale is worth little.
                const v = (inflateAt === null || i <= inflateAt) ? INFLATE_FRESH : INFLATE_STALE;
                inflateBonus += v - POINTS.gem_value; // the coin already scores a flat gem via collectedCount
                collectScore = v;
            } else if (cell === CellType.Liquid_Cash) {
                // W8: collecting liquid cash refills your reserve (the emergency fund).
                if (wallet !== null) wallet = Math.min(RESERVE_CAP, wallet + LIQUID_REFILL);
            }

            const isUnlock = [CellType.Package_Circuit, CellType.Package_Blue, CellType.Package_Red, CellType.Package_Purple, CellType.Package_Orange, CellType.Package_Cyan].includes(cell);
            stepData.collect = { type: cell, score: collectScore };
            stepData.sound = isUnlock ? 'unlock' : 'collect';
            stepData.comboIndex = comboCount;
            newSequence[i].effect = { type: isUnlock ? 'unlock' : 'collect', itemType: cell };
        }

        // 6. Teleport Logic
        const teleportDest = teleporters[`${currentRow},${currentCol}`];
        if (teleportDest) { 
            const sourceTeleporterType = grid[currentRow][currentCol];
            newSequence[i].effect = { type: 'teleport', itemType: sourceTeleporterType };
            visualSteps.set(visualStepCounter, stepData);
            
            currentRow = teleportDest.row; 
            currentCol = teleportDest.col; 
            path.push({ row: currentRow, col: currentCol, isTeleport: true }); 
            
            visualStepCounter++;
            visualStepToMoveIndex[visualStepCounter] = i; 
            
            // Check for packages at destination immediately
            const destCell = grid[currentRow][currentCol];
            const destPosKey = `${currentRow},${currentCol}`;
            const isDestPackage = [CellType.Package, CellType.Package_Blue, CellType.Package_Purple, CellType.Package_Circuit, CellType.Package_Red, CellType.Package_Orange, CellType.Package_Cyan, CellType.PhaseShifter, CellType.Package_AutoSolver, CellType.Package_Savings, CellType.Inflating_Coin, CellType.Liquid_Cash].includes(destCell);
            const isDestBoost = destCell === CellType.Boost;
            
            let destCollect = undefined;
            let destSound = 'teleport';
            let destComboIndex: number | undefined;

            if (isDestPackage && !tempCollectedMask[destPosKey]) {
                tempCollectedMask[destPosKey] = true;
                collectedCount++;
                if (isRequiredObjectiveGemType(destCell)) { collectedRequiredCount++; }
                comboCount++; didCollect = true;
                comboBonus += Math.max(0, comboCount - 1) * 2;
                destComboIndex = comboCount;

                let destScore = POINTS.gem_value;
                if (destCell === CellType.Package_Savings) {
                    savingsCollected = true;
                    savingsStep = i;
                    savingsBonus = Math.min(growPerStep * i, growPerStep * 12);
                    destScore = POINTS.gem_value + savingsBonus;
                } else if (destCell === CellType.Inflating_Coin) {
                    const v = (inflateAt === null || i <= inflateAt) ? INFLATE_FRESH : INFLATE_STALE;
                    inflateBonus += v - POINTS.gem_value;
                    destScore = v;
                } else if (destCell === CellType.Liquid_Cash) {
                    // W8: collecting liquid cash refills your reserve (the emergency fund).
                    if (wallet !== null) wallet = Math.min(RESERVE_CAP, wallet + LIQUID_REFILL);
                }
                const isUnlock = [CellType.Package_Circuit, CellType.Package_Blue, CellType.Package_Red, CellType.Package_Purple, CellType.Package_Orange, CellType.Package_Cyan].includes(destCell);
                destCollect = { type: destCell, score: destScore };
                destSound = isUnlock ? 'unlock' : 'collect';
            } else if (isDestBoost && !tempCollectedMask[destPosKey]) {
                tempCollectedMask[destPosKey] = true;
                collectedBoostScore += boostScoreValue;
                collectedBoostCount++;
                comboCount++; didCollect = true;
                comboBonus += Math.max(0, comboCount - 1) * 2;
                destComboIndex = comboCount;
                destCollect = { type: CellType.Boost, score: boostScoreValue };
                destSound = 'collect';
            }

            visualSteps.set(visualStepCounter, {
                pos: {row: teleportDest.row, col: teleportDest.col},
                sound: destSound,
                collect: destCollect,
                comboIndex: destComboIndex
            });
        } else {
            visualSteps.set(visualStepCounter, stepData);
        }
        // A move that picked nothing up breaks the combo chain.
        if (!didCollect) comboCount = 0;
    }
    
    // 7. Determine Final Outcome
    let finalResult: LevelResult | undefined;
    let success = false;
    
    if (!failType) {
        const finalPos = path[path.length - 1]; 
        const isAtDestination = finalPos.row === currentLevel.start.row && finalPos.col === currentLevel.start.col;
        const meetsCollectionObjective = collectedRequiredCount >= requiredGemTarget;
        const meetsMoveObjective = objectiveMoveLimit === null || moveSequence.length <= objectiveMoveLimit;
        let meetsScoreObjective = objectiveScoreTarget === null;
        
        // Run-wallet (W1): you must arrive home still able to "afford the exit".
        // Spending on a WantTile drops the wallet below exitPrice → 'broke'.
        const meetsWalletObjective = currentLevel.exitPrice == null
            || (wallet !== null && wallet >= currentLevel.exitPrice);

        if (isAtDestination) {
            if (!meetsWalletObjective) {
                failType = 'broke';
            } else if (meetsCollectionObjective && meetsMoveObjective) {
                // W5 savings growth + W6 inflation are folded into the gem score.
                const gemScore = collectedCount * POINTS.gem_value + savingsBonus + inflateBonus;
                const completionScore = POINTS.level_clear_base + collectedBoostScore + comboBonus;
                const par = currentLevel.par || Math.max(1, moveSequence.length);

                // W5 "Let it grow": suppress the speed bonus so WAITING for the gem to
                // ripen is never punished (otherwise Gold would reward finishing fast,
                // inverting the lesson). Gold instead rewards a ripe grab (see medal).
                let moveBonus = 0;
                if (!suppressSpeedBonus && moveSequence.length <= par) {
                    moveBonus = POINTS.par_met_bonus + (par - moveSequence.length) * POINTS.per_move_saved_bonus;
                }

                const effectiveTimeLimit = currentLevel.timeLimit || (par * 3 + 15);
                const timeBonus = suppressSpeedBonus ? 0 : Math.max(0, Math.floor((effectiveTimeLimit - levelTime) * POINTS.per_second_saved_bonus));
                const baseTotal = gemScore + completionScore + moveBonus + timeBonus;
                const objectiveBonus = objectiveConstraintCount > 1
                    ? Math.floor(baseTotal * 0.12 * (objectiveConstraintCount - 1))
                    : 0;
                const totalLevelScore = baseTotal + objectiveBonus;
                meetsScoreObjective = objectiveScoreTarget === null || totalLevelScore >= objectiveScoreTarget;
                
                if (meetsScoreObjective) {
                    success = true;
                    const allGems = totalCollectiblePackages > 0
                        ? collectedCount === totalCollectiblePackages
                        : true;
                    // All boost pads grabbed too (or none on the board). Gold
                    // requires this — so even objective-free early worlds have a
                    // "leave nothing behind" mastery target to chase.
                    const allBoosts = totalBoostCells > 0
                        ? collectedBoostCount === totalBoostCells
                        : true;
                    const underPar = moveSequence.length <= par;
                    // W5/W6: on value-time levels speed is suppressed, so Gold =
                    // collected everything (W6) AND, for W5, grabbed the savings gem
                    // ripe. W6 already required a fresh-enough run just to WIN.
                    const growRipe = hasSavingsGem ? (savingsCollected && savingsStep >= ripeStep) : true;
                    const medal = computeMedal({
                        moves: moveSequence.length,
                        par,
                        timeBonus: Math.floor(timeBonus),
                        allGems,
                        // W7: the toll-gated bonuses can't ALL be afforded on one run,
                        // so "leave nothing behind" can't gate Gold here.
                        allBoosts: hasToll ? true : allBoosts,
                        growLevel: suppressSpeedBonus,
                        growRipe,
                    });
                    finalResult = {
                        time: levelTime,
                        moves: moveSequence.length,
                        gems: `${Math.min(collectedRequiredCount, requiredGemTarget)}/${requiredGemTarget}`,
                        scoreBreakdown: {
                            gemScore,
                            moveBonus: Math.floor(moveBonus),
                            timeBonus: Math.floor(timeBonus),
                            completionBonus: completionScore + objectiveBonus,
                            total: totalLevelScore
                        },
                        allGems,
                        allBoosts,
                        underPar,
                        medal,
                    };
                } else {
                    // Home with everything collected, but the score/savings goal
                    // was not met (e.g. W6 coins went stale) → low_score, not a
                    // silent non-success.
                    failType = 'low_score';
                }
            } else if (!meetsCollectionObjective) {
                failType = 'missed_gem'; 
            } else if (!meetsMoveObjective) {
                failType = 'out_of_moves';
            } else if (!meetsScoreObjective) {
                failType = 'low_score';
            }
        } else {
            failType = meetsMoveObjective ? 'incomplete' : 'out_of_moves'; 
        }
    }

    return {
        path,
        visualSteps,
        visualStepToMoveIndex,
        outcome: { success, finalResult, failure: failType },
        newSequence
    };
};
