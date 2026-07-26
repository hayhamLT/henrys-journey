

import React, { useMemo } from 'react';
import { ICONS } from './icons';
import { World, LevelResult } from '../types';
import { CoinAmount } from './CoinIcon';
import { MEDAL_NAME, MEDAL_COLOR } from '../utils/medals';

// Small medal chip (🥇/🥈/🥉 + tinted name) for a cleared level; falls back to
// a plain "Completed" check for legacy results saved before medals existed.
export const MedalChip: React.FC<{ medal?: number }> = ({ medal }) => {
    if (!medal) {
        return (
            <div className="flex items-center gap-1 text-[var(--accent-green)]">
                <ICONS.Check /> <span className="text-xs font-bold">Completed</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1" title={`${MEDAL_NAME[medal]} medal`}>
            <span className="text-sm" aria-hidden="true">{medal >= 3 ? '🥇' : medal === 2 ? '🥈' : '🥉'}</span>
            <span className="text-xs font-bold" style={{ color: MEDAL_COLOR[medal] }}>{MEDAL_NAME[medal]}</span>
        </div>
    );
};

export const LevelScoreDetail: React.FC<{ result: LevelResult, levelDisplayNumber: number }> = ({ result, levelDisplayNumber }) => {
    if (!result.scoreBreakdown || result.scoreBreakdown.total === 0) { // Handle migrated data with no scores
        return (
             <div className="sharp-indicator p-3 bg-[var(--panel-bg-dark)]">
                <div className="flex justify-between items-center">
                    <span className="font-bold">Level {levelDisplayNumber}</span>
                    <span className="text-[var(--accent-green)] text-xs font-bold">Completed</span>
                </div>
                <div className="text-xs text-center text-[var(--text-dark)] mt-1">No detailed score data available.</div>
            </div>
        )
    }

    const { gemScore, moveBonus, timeBonus, completionBonus, total } = result.scoreBreakdown as any; 
    // using 'as any' to handle potential old local storage data gracefully if needed, though strictly typed it's completionBonus now.

    return (
        <div className="sharp-indicator p-3 bg-[var(--panel-bg-dark)]">
            <div className="flex justify-between items-center">
                <span className="font-bold">Level {levelDisplayNumber}</span>
                <MedalChip medal={result.medal} />
            </div>
            <div className="border-t border-[var(--panel-border)] my-2"></div>
            <div className="flex justify-between items-center font-bold text-lg">
                <span>Coins</span>
                <span><CoinAmount n={total} /></span>
            </div>
            {/* Money-framed receipt: each bonus is a money habit, not a game stat. */}
            <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-xs text-[var(--text-dark)] mt-2">
                <span title="Coins from the packages you saved">Saved: <strong className="text-[var(--text-color)]">{gemScore}</strong></span>
                <span title="Bonus for not wasting moves — smart spending">Smart: <strong className="text-[var(--text-color)]">{moveBonus}</strong></span>
                <span title="Bonus for deciding quickly">Quick: <strong className="text-[var(--text-color)]">{timeBonus}</strong></span>
                <span title="Goal & completion bonus">Goal: <strong className="text-[var(--text-color)]">{completionBonus || (result.scoreBreakdown as any).starBonus || 0}</strong></span>
            </div>
        </div>
    );
};


export const WorldScoreSummary: React.FC<{
  world: World;
  resultsByLevel: { [level: number]: LevelResult };
  isOpenDefault: boolean;
}> = ({ world, resultsByLevel, isOpenDefault }) => {
  const { completedLevels, totalLevels, progressPercent } = useMemo(() => {
    const total = world.levels.length;
    const completed = world.levels.filter(l => resultsByLevel[l] && resultsByLevel[l].time > 0).length;
    const progress = total > 0 ? (completed / world.levels.length) * 100 : 0;
    return {
      completedLevels: completed,
      totalLevels: world.levels.length,
      progressPercent: progress,
    };
  }, [world, resultsByLevel]);

  const completedLevelsInWorld = useMemo(() => world.levels.filter(l => resultsByLevel[l] && resultsByLevel[l].time > 0), [world.levels, resultsByLevel]);
  
  if (world.isCustom) return null;

  return (
    <details className="overflow-hidden rounded group" open={isOpenDefault}>
      <summary className="list-none cursor-pointer">
        <div className={`theme-${world.theme} modern-panel p-3 relative overflow-hidden group-hover:bg-[var(--panel-bg-dark)] transition-colors duration-200`}>
          <div className="absolute inset-0" style={{
              backgroundColor: `var(--bg-start)`,
              backgroundImage: `linear-gradient(125deg, transparent 50%, var(--bg-end) 50%), linear-gradient(55deg, var(--bg-start) 40%, transparent 40%)`,
              opacity: 0.2
          }}></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-grow">
                <h3 className="font-bold text-lg leading-tight">{world.name}</h3>
                <div className="text-xs text-[var(--text-dark)] tracking-wide font-semibold">{completedLevels} / {totalLevels} Levels</div>
              </div>
            </div>
            <div className="w-full bg-[var(--panel-bg-dark)] h-2 rounded overflow-hidden mt-2 border border-black/5">
              <div className="bg-[var(--accent-green)] h-full" style={{ width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }}></div>
            </div>
          </div>
        </div>
      </summary>

      <div className={`theme-${world.theme} bg-[var(--panel-bg-dark)] p-3`}>
        {completedLevelsInWorld.length > 0 ? (
          <div className="space-y-2">
            {completedLevelsInWorld.map((levelIndex, i) => {
              const levelResult = resultsByLevel[levelIndex];
              const displayIndex = world.levels.indexOf(levelIndex);
              return <LevelScoreDetail key={levelIndex} result={levelResult} levelDisplayNumber={displayIndex + 1} />;
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--text-dark)] p-4">No levels completed in this world yet.</p>
        )}
      </div>
    </details>
  );
};