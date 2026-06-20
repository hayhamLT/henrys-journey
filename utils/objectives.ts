import { CellType, Level } from '../types';

const REQUIRED_GEM_TYPES: CellType[] = [CellType.Package, CellType.Package_Savings, CellType.Inflating_Coin, CellType.Liquid_Cash];

export const isRequiredObjectiveGemType = (cellType: CellType) => REQUIRED_GEM_TYPES.includes(cellType);

export const countRequiredObjectiveGems = (grid: CellType[][]) => {
  let total = 0;
  grid.forEach((row) => row.forEach((cell) => {
    if (isRequiredObjectiveGemType(cell)) total += 1;
  }));
  return total;
};

export const getRequiredObjectiveGemTarget = (level: Level, totalRequired: number) => {
  if (totalRequired <= 0) return 0;

  if (level.objective?.type === 'combo') {
    const collectObjective = level.objective.objectives.find(obj => obj.type === 'collect_ratio');
    if (collectObjective?.type === 'collect_ratio') {
      const ratio = Math.max(0.25, Math.min(1, collectObjective.ratio));
      return Math.max(1, Math.min(totalRequired, Math.ceil(totalRequired * ratio)));
    }
  }

  if (level.objective?.type === 'collect_ratio') {
    const ratio = Math.max(0.25, Math.min(1, level.objective.ratio));
    return Math.max(1, Math.min(totalRequired, Math.ceil(totalRequired * ratio)));
  }
  return totalRequired;
};

export const getObjectiveMoveLimit = (level: Level) => {
  if (level.objective?.type === 'combo') {
    const moveObjective = level.objective.objectives.find(obj => obj.type === 'max_moves');
    if (moveObjective?.type === 'max_moves') {
      return Math.max(1, Math.floor(moveObjective.maxMoves));
    }
  }

  if (level.objective?.type === 'max_moves') {
    return Math.max(1, Math.floor(level.objective.maxMoves));
  }
  return null;
};

export const getObjectiveScoreTarget = (level: Level) => {
  if (level.objective?.type === 'combo') {
    const scoreObjective = level.objective.objectives.find(obj => obj.type === 'min_score');
    if (scoreObjective?.type === 'min_score') {
      return Math.max(1, Math.floor(scoreObjective.minScore));
    }
  }

  if (level.objective?.type === 'min_score') {
    return Math.max(1, Math.floor(level.objective.minScore));
  }
  return null;
};

export const getObjectiveConstraintCount = (level: Level, totalRequired: number, requiredTarget: number) => {
  let count = 0;
  if (totalRequired > 0 && requiredTarget > 0) count += 1;
  if (getObjectiveMoveLimit(level) !== null) count += 1;
  if (getObjectiveScoreTarget(level) !== null) count += 1;
  return count;
};

export const getObjectiveLabel = (level: Level, totalRequired: number, requiredTarget: number) => {
  const moveLimit = getObjectiveMoveLimit(level);
  const scoreTarget = getObjectiveScoreTarget(level);

  const parts: string[] = [];
  if (totalRequired <= 0) parts.push('Reach portal');
  else if (requiredTarget >= totalRequired) parts.push(`Collect all ${totalRequired} packages`);
  else parts.push(`Collect ${requiredTarget}/${totalRequired} packages`);

  if (moveLimit !== null) parts.push(`≤${moveLimit} moves`);
  if (scoreTarget !== null) parts.push(`Score ≥${scoreTarget}`);

  return parts.join(' • ');
};
