import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from './icons';
import { LevelResult, World, CustomLevelEntry, Theme } from '../types';

interface LevelSelectorProps {
  resultsByLevel: { [level: number]: LevelResult };
  currentLevelIndex: number;
  onSelectLevel: (levelIndex: number, autoRun?: boolean) => void;
  allWorlds: World[];
  onDeleteLevel: (levelIndex: number) => void;
  onPublishLevel?: (levelIndex: number) => void;
  onChallenge?: (level: CustomLevelEntry) => void;
  customLevels?: CustomLevelEntry[];
  disableAutoScroll?: boolean;
}

const getWorldProgress = (world: World, resultsByLevel: { [level: number]: LevelResult }) => {
  const completed = world.levels.filter(levelIndex => (resultsByLevel[levelIndex]?.time || 0) > 0).length;
  const total = world.levels.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent, isComplete: percent >= 100 };
};

const getTargetLevel = (world: World, resultsByLevel: { [level: number]: LevelResult }, currentLevelIndex: number) => {
  if (world.levels.includes(currentLevelIndex)) return currentLevelIndex;
  const firstIncomplete = world.levels.find(levelIndex => !resultsByLevel[levelIndex] || resultsByLevel[levelIndex].time === 0);
  return firstIncomplete ?? world.levels[0];
};

const WORLD_THEME_STYLE: Record<Theme, { gradient: string; glow: string; badge: string; icon: string }> = {
  day: {
    gradient: 'from-cyan-300/35 via-sky-500/20 to-emerald-300/20',
    glow: 'rgba(34, 211, 238, 0.45)',
    badge: 'text-cyan-100 border-cyan-200/30 bg-cyan-300/20',
    icon: 'MEADOW'
  },
  sunrise: {
    gradient: 'from-amber-300/35 via-orange-400/20 to-rose-400/20',
    glow: 'rgba(251, 191, 36, 0.45)',
    badge: 'text-amber-100 border-amber-200/30 bg-amber-300/20',
    icon: 'DAWN'
  },
  sunset: {
    gradient: 'from-orange-300/35 via-pink-400/20 to-red-400/20',
    glow: 'rgba(251, 146, 60, 0.45)',
    badge: 'text-orange-100 border-orange-200/30 bg-orange-300/20',
    icon: 'COAST'
  },
  dusk: {
    gradient: 'from-indigo-300/35 via-slate-600/20 to-cyan-500/20',
    glow: 'rgba(129, 140, 248, 0.45)',
    badge: 'text-indigo-100 border-indigo-200/30 bg-indigo-300/20',
    icon: 'GEAR'
  },
  night: {
    gradient: 'from-slate-300/25 via-blue-700/30 to-slate-700/30',
    glow: 'rgba(56, 189, 248, 0.35)',
    badge: 'text-sky-100 border-sky-200/30 bg-sky-300/20',
    icon: 'VOID'
  },
  alpine: {
    gradient: 'from-slate-100/30 via-sky-400/20 to-blue-300/20',
    glow: 'rgba(125, 211, 252, 0.4)',
    badge: 'text-sky-50 border-sky-100/30 bg-sky-200/20',
    icon: 'PEAK'
  },
  desert: {
    gradient: 'from-yellow-200/35 via-amber-400/20 to-orange-500/20',
    glow: 'rgba(251, 191, 36, 0.45)',
    badge: 'text-yellow-100 border-yellow-200/30 bg-yellow-300/20',
    icon: 'DUNE'
  },
  crystal: {
    gradient: 'from-cyan-200/35 via-violet-400/20 to-blue-400/20',
    glow: 'rgba(103, 232, 249, 0.45)',
    badge: 'text-cyan-50 border-cyan-100/30 bg-cyan-300/20',
    icon: 'GEM'
  },
  cyber: {
    gradient: 'from-lime-300/30 via-cyan-400/25 to-slate-500/20',
    glow: 'rgba(132, 204, 22, 0.4)',
    badge: 'text-lime-100 border-lime-200/30 bg-lime-300/20',
    icon: 'GRID'
  },
  volcanic: {
    gradient: 'from-red-400/35 via-orange-600/25 to-zinc-600/20',
    glow: 'rgba(239, 68, 68, 0.45)',
    badge: 'text-red-100 border-red-200/30 bg-red-300/20',
    icon: 'LAVA'
  },
  galaxy: {
    gradient: 'from-blue-300/30 via-indigo-500/30 to-slate-600/25',
    glow: 'rgba(96, 165, 250, 0.45)',
    badge: 'text-blue-100 border-blue-200/30 bg-blue-300/20',
    icon: 'SKY'
  },
  'my-world': {
    gradient: 'from-emerald-300/30 via-cyan-400/20 to-slate-500/20',
    glow: 'rgba(52, 211, 153, 0.4)',
    badge: 'text-emerald-100 border-emerald-200/30 bg-emerald-300/20',
    icon: 'BUILD'
  },
  builder: {
    gradient: 'from-emerald-300/30 via-cyan-400/20 to-slate-500/20',
    glow: 'rgba(52, 211, 153, 0.4)',
    badge: 'text-emerald-100 border-emerald-200/30 bg-emerald-300/20',
    icon: 'BUILD'
  },
  arena: {
    gradient: 'from-fuchsia-300/30 via-rose-400/20 to-slate-500/20',
    glow: 'rgba(244, 114, 182, 0.4)',
    badge: 'text-rose-100 border-rose-200/30 bg-rose-300/20',
    icon: 'ARENA'
  }
};

const LevelSelector: React.FC<LevelSelectorProps> = ({ resultsByLevel, currentLevelIndex, onSelectLevel, allWorlds }) => {
  const sortedWorlds = useMemo(() => [...allWorlds].sort((a, b) => {
    if (a.isCustom && !b.isCustom) return 1;
    if (!a.isCustom && b.isCustom) return -1;
    return 0;
  }), [allWorlds]);

  const getIsUnlocked = (world: World, index: number) => {
    if (index === 0 || world.isCustom) return true;
    const prevWorld = sortedWorlds[index - 1];
    if (!prevWorld) return true;
    const lastLevelOfPrevWorld = prevWorld.levels[prevWorld.levels.length - 1];
    return !!(resultsByLevel[lastLevelOfPrevWorld] && resultsByLevel[lastLevelOfPrevWorld].time > 0);
  };

  const currentWorldIndex = useMemo(() => {
    const found = sortedWorlds.findIndex(world => world.levels.includes(currentLevelIndex));
    return found >= 0 ? found : 0;
  }, [sortedWorlds, currentLevelIndex]);

  const [activeWorldIndex, setActiveWorldIndex] = useState(currentWorldIndex);
  const [hoveredWorldIndex, setHoveredWorldIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveWorldIndex(currentWorldIndex);
  }, [currentWorldIndex]);

  const activeWorld = sortedWorlds[activeWorldIndex] || sortedWorlds[0];
  if (!activeWorld) return null;

  const activeUnlocked = getIsUnlocked(activeWorld, activeWorldIndex);
  const activeProgress = getWorldProgress(activeWorld, resultsByLevel);
  const activeTargetLevel = getTargetLevel(activeWorld, resultsByLevel, currentLevelIndex);
  const selectedPreviewIndex = hoveredWorldIndex ?? activeWorldIndex;
  const previewWorld = sortedWorlds[selectedPreviewIndex] || activeWorld;
  const previewUnlocked = getIsUnlocked(previewWorld, selectedPreviewIndex);
  const previewProgress = getWorldProgress(previewWorld, resultsByLevel);
  const previewTargetLevel = getTargetLevel(previewWorld, resultsByLevel, currentLevelIndex);
  const previewTheme = WORLD_THEME_STYLE[previewWorld.theme] || WORLD_THEME_STYLE.day;
  const shouldReduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="mx-auto w-full max-w-4xl px-2 sm:px-3 pb-8">
      <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] tracking-wide text-white/50">Worlds</div>
          <div className="text-[10px] tracking-wide text-white/45">Use arrow keys to browse</div>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveWorldIndex(prev => Math.min(prev + 1, sortedWorlds.length - 1));
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveWorldIndex(prev => Math.max(prev - 1, 0));
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (activeUnlocked) {
                onSelectLevel(activeTargetLevel);
              }
            }
          }}
        >
          {sortedWorlds.map((world, index) => {
            const unlocked = getIsUnlocked(world, index);
            const active = index === activeWorldIndex;
            const progress = getWorldProgress(world, resultsByLevel);
            const theme = WORLD_THEME_STYLE[world.theme] || WORLD_THEME_STYLE.day;
            const isHovered = index === hoveredWorldIndex;

            return (
              <button
                key={`${world.name}-${index}`}
                type="button"
                onClick={() => setActiveWorldIndex(index)}
                onMouseEnter={() => setHoveredWorldIndex(index)}
                onMouseLeave={() => setHoveredWorldIndex(null)}
                className={`relative w-full overflow-hidden rounded-xl border px-3 py-3 text-left transform-gpu transition-all duration-300 ${active ? 'border-white/30 bg-white/10 scale-[1.01]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:-translate-y-0.5'} ${!unlocked ? 'opacity-70' : ''}`}
                style={{ boxShadow: active || isHovered ? `0 0 18px ${theme.glow}` : 'none' }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-70 transition-transform duration-500 ${active || isHovered ? 'scale-[1.04]' : 'scale-100'}`}
                  style={{
                    animation: shouldReduceMotion ? 'none' : 'selectorPulse 6s ease-in-out infinite',
                    animationDelay: `${index * 140}ms`
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:18px_18px] opacity-[0.08]" />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 relative z-10">
                    <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wide ${theme.badge}`}>
                      {theme.icon}
                    </div>
                    <div className="truncate font-display text-sm sm:text-base font-black text-white tracking-wide">{world.name}</div>
                    <div className="mt-1 text-[10px] sm:text-xs text-white/70">{progress.completed}/{progress.total} • {progress.percent}%</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/35">
                      <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>
                  <div className="relative z-10 text-xs font-black tracking-wide text-white/90">
                    {unlocked ? (progress.isComplete ? 'Clear' : 'Open') : 'Locked'}
                  </div>
                </div>

                  <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
                  <div className="text-[10px] tracking-wide text-white/70">
                    {world.gimmickTitle || 'Core Skills'}
                  </div>
                    <button
                    type="button"
                    disabled={!unlocked}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (unlocked) {
                        onSelectLevel(getTargetLevel(world, resultsByLevel, currentLevelIndex));
                      }
                    }}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black tracking-wide transition-transform duration-200 ${unlocked ? 'border-white/40 bg-white/15 text-white hover:bg-white/20 hover:scale-[1.03]' : 'border-white/15 bg-black/30 text-white/40 cursor-not-allowed'}`}
                  >
                    {unlocked ? <ICONS.Play /> : <ICONS.Lock />}
                    Go
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl p-3 sm:p-4">
        <div
          className={`mb-3 rounded-xl border border-white/15 bg-gradient-to-br ${previewTheme.gradient} p-3 transition-all duration-300`}
          style={{
            boxShadow: `0 0 16px ${previewTheme.glow}`,
            animation: shouldReduceMotion ? 'none' : 'selectorRise 420ms ease-out'
          }}
        > 
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-base sm:text-lg font-black text-white tracking-wide truncate">{previewWorld.name}</div>
              <div className="text-[10px] sm:text-xs text-white/80">{previewWorld.gimmickTitle || 'Core Skills'} • Next Level {String(previewTargetLevel + 1).padStart(3, '0')}</div>
            </div>
            <div className="text-right text-[11px] font-black tracking-wide text-white/85">
              {previewUnlocked ? `${previewProgress.percent}% explored` : 'Locked'}
            </div>
          </div>
          <p className="mt-2 text-xs text-white/75">{previewWorld.gimmickDescription || 'Explore this world to uncover new mechanics and harder pathing challenges.'}</p>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="font-display text-base sm:text-lg font-black text-white tracking-wide truncate">{activeWorld.name}</div>
            <div className="text-[10px] sm:text-xs text-white/55">{activeProgress.completed}/{activeProgress.total} complete</div>
          </div>

          <button
            type="button"
            disabled={!activeUnlocked}
            onClick={() => activeUnlocked && onSelectLevel(activeTargetLevel)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] sm:text-xs font-black tracking-wide transition-all ${activeUnlocked ? 'border-teal-200/50 bg-teal-200/20 text-white hover:bg-teal-200/30' : 'border-white/10 bg-black/20 text-white/30 cursor-not-allowed'}`}
          >
            {activeUnlocked ? <ICONS.Play /> : <ICONS.Lock />}
            {activeUnlocked ? 'Keep Going!' : 'Locked'}
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {activeWorld.levels.map((levelIndex, idx) => {
            const completed = (resultsByLevel[levelIndex]?.time || 0) > 0;
            const current = levelIndex === currentLevelIndex;
            const selectable = activeUnlocked;
            const isTarget = levelIndex === activeTargetLevel;

            return (
              <button
                key={levelIndex}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && onSelectLevel(levelIndex)}
                className={`relative h-9 rounded-lg border text-[11px] font-black transition-all ${current ? 'border-white bg-white text-slate-950' : completed ? 'border-transparent bg-[var(--accent-cyan)] text-slate-950' : selectable ? 'border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-white/10 bg-black/20 text-white/25 cursor-not-allowed'} ${isTarget && selectable ? 'ring-2 ring-teal-300/45' : ''}`}
                aria-label={`Level ${idx + 1}`}
              >
                <span className="relative z-10">{String(idx + 1).padStart(2, '0')}</span>
                {completed && !current && (
                  resultsByLevel[levelIndex]?.medal ? (
                    <span className="absolute right-0.5 top-0.5 text-[10px] leading-none" aria-hidden="true">
                      {resultsByLevel[levelIndex].medal! >= 3 ? '🥇' : resultsByLevel[levelIndex].medal === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="absolute right-1 top-1 text-[8px] text-slate-900">
                      <ICONS.Check />
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-[10px] tracking-wide text-white/45">
          Tip: bright level = your best next move.
        </div>
      </div>

      <style>{`
        @keyframes selectorPulse {
          0% { transform: scale(1) translateY(0px); }
          50% { transform: scale(1.03) translateY(-1px); }
          100% { transform: scale(1) translateY(0px); }
        }

        @keyframes selectorRise {
          0% { opacity: 0; transform: translateY(8px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LevelSelector;
