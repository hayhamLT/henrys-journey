import React from 'react';
import { ICONS } from './icons';

interface ObjectiveChipsProps {
  celebrationKey: number;
  requiredTarget: number;
  collectedRequired: number;
  moveLimit: number | null;
  scoreTarget: number | null;
  currentScore: number;
  currentMoves: number;
  isCollectMet: boolean;
  isMoveLimitMet: boolean;
  isScoreMet: boolean;
  hasAnyObjective: boolean;
}

const ObjectiveChip: React.FC<{
  label: string;
  value: string;
  isMet: boolean;
  fillPercent: number;
  metClass: string;
  defaultClass: string;
  warnClass?: string;
  isWarning?: boolean;
}> = ({ label, value, isMet, fillPercent, metClass, defaultClass, warnClass, isWarning }) => {
  const stateClass = isWarning && warnClass ? warnClass : (isMet ? metClass : defaultClass);

  return (
    <div className={`relative text-[10px] font-bold tracking-wide rounded-full border px-2 py-0.5 shrink-0 flex items-center gap-1 overflow-hidden ${stateClass}`}>
      <div
        className="absolute left-0 top-0 h-full bg-white/10 transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
      />
      <div className="relative z-10 flex items-center gap-1">
        {isMet && <span className="scale-75"><ICONS.Check /></span>}
        <span>{label} {value}</span>
      </div>
    </div>
  );
};

const ObjectiveChips: React.FC<ObjectiveChipsProps> = ({
  celebrationKey,
  requiredTarget,
  collectedRequired,
  moveLimit,
  scoreTarget,
  currentScore,
  currentMoves,
  isCollectMet,
  isMoveLimitMet,
  isScoreMet,
  hasAnyObjective,
}) => {
  if (!hasAnyObjective) return null;

  const isAllComplete = hasAnyObjective && isCollectMet && isMoveLimitMet && isScoreMet;
  const packageProgress = requiredTarget > 0 ? (Math.min(collectedRequired, requiredTarget) / requiredTarget) * 100 : 0;
  const moveProgress = moveLimit && moveLimit > 0 ? (Math.min(currentMoves, moveLimit) / moveLimit) * 100 : 0;
  const scoreProgress = scoreTarget && scoreTarget > 0 ? (Math.min(currentScore, scoreTarget) / scoreTarget) * 100 : 0;
  const isMoveWarning = moveLimit !== null && currentMoves > moveLimit;

  return (
    <div className="w-full px-2 sm:px-3 mb-1">
      <div key={celebrationKey} className={`mx-auto w-fit max-w-full flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 backdrop-blur-md px-2 py-1 overflow-x-auto no-scrollbar ${isAllComplete ? 'objective-chip-pop' : ''}`}>
        <span className="text-[9px] font-black tracking-wide text-white/45 shrink-0">Objectives</span>

        {isAllComplete && (
          <div className="text-[10px] font-black tracking-wide rounded-full border px-2 py-0.5 shrink-0 flex items-center gap-1 text-[var(--accent-green)] border-[var(--accent-green)]/45 bg-emerald-500/15 objective-badge-pop">
            <span className="scale-75"><ICONS.Check /></span>
            Complete
          </div>
        )}

        {requiredTarget > 0 && (
          <ObjectiveChip
            label="Packages"
            value={`${Math.min(collectedRequired, requiredTarget)}/${requiredTarget}`}
            isMet={isCollectMet}
            fillPercent={packageProgress}
            metClass="text-[var(--accent-green)] border-[var(--accent-green)]/40 bg-emerald-500/10"
            defaultClass="text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 bg-cyan-500/10"
          />
        )}

        {moveLimit !== null && (
          <ObjectiveChip
            label="Moves"
            value={`${currentMoves}/${moveLimit}`}
            isMet={isMoveLimitMet}
            isWarning={isMoveWarning}
            fillPercent={moveProgress}
            metClass="text-[var(--accent-yellow)] border-[var(--accent-yellow)]/35 bg-yellow-500/10"
            defaultClass="text-[var(--accent-yellow)] border-[var(--accent-yellow)]/35 bg-yellow-500/10"
            warnClass="text-[var(--accent-red)] border-[var(--accent-red)]/40 bg-red-500/10"
          />
        )}

        {scoreTarget !== null && (
          <ObjectiveChip
            label="Score"
            value={`${Math.min(currentScore, scoreTarget)}/${scoreTarget}`}
            isMet={isScoreMet}
            fillPercent={scoreProgress}
            metClass="text-[var(--accent-magenta)] border-[var(--accent-magenta)]/40 bg-fuchsia-500/10"
            defaultClass="text-[var(--accent-magenta)] border-[var(--accent-magenta)]/30 bg-fuchsia-500/10"
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(ObjectiveChips);
