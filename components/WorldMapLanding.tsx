import React, { useState, useEffect } from 'react';
import { WORLDS } from '../constants/game';
import { MONEY_LESSONS, MONEY_LEVEL_BASE, MONEY_WORLD, getMoneyTipOfDay, currentSavingsGoal } from '../constants/finlit';
import { CoinIcon, CoinAmount } from './CoinIcon';
import { World, LevelResult, Theme } from '../types';
import { ICONS } from './icons';

interface WorldMapLandingProps {
  resultsByLevel: { [level: number]: LevelResult };
  currentLevelIndex: number;
  onSelectLevel: (levelIndex: number) => void;
  onContinue: () => void;
  userName?: string;
  quizCorrect?: number[];
  balance?: number;
  earned?: number;
  spent?: number;
  streak?: number;
  savedGoalPeak?: number;
  onOpenShop?: () => void;
}

// One accent color per biome — drives each world's identity, progress bars and rings.
const ACCENT: Record<Theme, string> = {
  day:        '#34d399',
  dusk:       '#818cf8',
  night:      '#60a5fa',
  desert:     '#fbbf24',
  alpine:     '#94a3b8',
  crystal:    '#22d3ee',
  sunset:     '#f472b6',
  cyber:      '#10b981',
  volcanic:   '#f87171',
  galaxy:     '#a78bfa',
  sunrise:    '#2dd4bf',
  'my-world': '#60a5fa',
  builder:    '#60a5fa',
  arena:      '#fbbf24',
};

const getWorldProgress = (world: World, resultsByLevel: { [level: number]: LevelResult }) => {
  const completed = world.levels.filter(l => (resultsByLevel[l]?.time || 0) > 0).length;
  const total = world.levels.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
};

const starsFor = (pct: number) => (pct >= 100 ? 3 : pct >= 60 ? 2 : pct >= 25 ? 1 : 0);

const worldMedalStars = (world: World, resultsByLevel: { [level: number]: LevelResult }) => {
  const total = world.levels.length;
  if (!total) return 0;
  const medalSum = world.levels.reduce((s, l) => {
    const r = resultsByLevel[l];
    if (!r) return s;
    const m = r.medal ?? ((r.time || 0) > 0 ? 1 : 0);
    return s + m;
  }, 0);
  return starsFor((medalSum / (3 * total)) * 100);
};

const Star: React.FC<{ filled: boolean; color: string; size?: number }> = ({ filled, color, size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.46 9.44l6.6-.96L12 2.5z"
      fill={filled ? color : 'rgba(255,255,255,0.08)'}
      stroke={filled ? color : 'rgba(255,255,255,0.18)'}
      strokeWidth="1.2"
    />
  </svg>
);

const Bar: React.FC<{ pct: number; color: string; track?: string; height?: string }> = ({ 
  pct, 
  color, 
  track = 'rgba(255,255,255,0.08)',
  height = 'h-2'
}) => (
  <div className={`${height} w-full overflow-hidden rounded-full relative`} style={{ background: track }}>
    <div
      className="h-full rounded-full transition-[width] duration-700 ease-out relative"
      style={{ width: `${pct}%`, background: color, boxShadow: pct > 0 ? `0 0 12px ${color}88` : 'none' }}
    />
  </div>
);

const WorldMapLanding: React.FC<WorldMapLandingProps> = ({
  resultsByLevel,
  currentLevelIndex,
  onSelectLevel,
  onContinue,
  userName,
  balance = 0,
  savedGoalPeak = 0,
  streak = 0,
  onOpenShop,
}) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'campaign' | 'mountain'>('campaign');
  const moneyTip = getMoneyTipOfDay();

  // Handle Scroll for Parallax Clouds
  useEffect(() => {
    document.body.style.setProperty('--scroll-y', '0px');
    return () => {
      document.body.style.setProperty('--scroll-y', '0px');
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => {
      document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
    });
  };

  const totalLevels = WORLDS.reduce((n, w) => n + w.levels.length, 0);
  const totalDone = WORLDS.reduce(
    (n, w) => n + w.levels.filter(l => (resultsByLevel[l]?.time || 0) > 0).length, 0
  );
  const campaignPercent = totalLevels ? Math.round((totalDone / totalLevels) * 100) : 0;
  const isFreshStart = currentLevelIndex === WORLDS[0]?.levels[0] && totalDone === 0;

  const currentWorldIdx = Math.max(0, WORLDS.findIndex(w => w.levels.includes(currentLevelIndex)));
  const currentWorld = WORLDS[currentWorldIdx] ?? WORLDS[0];
  const heroAccent = ACCENT[currentWorld.theme] ?? '#34d399';
  const levelInWorld = currentLevelIndex - currentWorld.levels[0] + 1;
  const heroProgress = getWorldProgress(currentWorld, resultsByLevel);

  const goal = currentSavingsGoal(Math.max(savedGoalPeak, balance));
  const goalPct = Math.max(0, Math.min(100, Math.round((balance / goal) * 100)));

  const moneyUnlocked = (resultsByLevel[4]?.time || 0) > 0;
  const moneyDone = MONEY_WORLD.levels.filter(l => (resultsByLevel[l]?.time || 0) > 0).length;
  const moneyAccent = '#fbbf24';
  const isLessonUnlocked = (i: number) => i === 0 || (resultsByLevel[MONEY_LEVEL_BASE + i - 1]?.time || 0) > 0;
  const firstUnfinishedLesson = MONEY_WORLD.levels.find(l => (resultsByLevel[l]?.time || 0) === 0)
    ?? MONEY_WORLD.levels[MONEY_WORLD.levels.length - 1];

  const worldEntries = WORLDS.map((world, idx) => {
    const progress = getWorldProgress(world, resultsByLevel);
    const isLocked = idx > 0 && !((resultsByLevel[WORLDS[idx - 1].levels.slice(-1)[0]]?.time || 0) > 0);
    const firstUnfinished = world.levels.find(l => (resultsByLevel[l]?.time || 0) === 0);
    const defaultLevel = firstUnfinished ?? world.levels[world.levels.length - 1];
    const isCurrent = world.levels.includes(currentLevelIndex);
    return { world, idx, progress, isLocked, defaultLevel, isCurrent };
  });

  return (
    <div onScroll={handleScroll} className="h-full w-full overflow-y-auto bg-transparent text-slate-100 select-none">
      <style>{`
        @keyframes hj-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes hj-shimmer { 0% { transform: translateX(-120%); } 50%,100% { transform: translateX(120%); } }
        @keyframes hj-pulse-glow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.08); } }
        @keyframes hj-badge-pulse { 0%, 100% { box-shadow: 0 0 12px rgba(52,211,153,0.3); } 50% { box-shadow: 0 0 22px rgba(52,211,153,0.7); } }
        .hj-rise { animation: hj-rise .45s cubic-bezier(.16,1,.3,1) both; }
        .glass-panel { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .glass-card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
      `}</style>

      <div className="mx-auto flex w-full max-w-lg md:max-w-xl flex-col gap-4 px-4 pb-28 pt-4 md:pb-8">

        {/* ── 1 · TOP GAME HUD : Player Card & Stats Ticker ── */}
        <div className="hj-rise glass-panel rounded-3xl border border-white/10 p-3.5 shadow-2xl" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between gap-3">
            
            {/* Player Info & Live Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg"
                style={{ animation: 'hj-badge-pulse 3s infinite' }}
              >
                <div className="scale-[2.2]"><ICONS.Bot /></div>
                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display truncate text-base font-black tracking-tight text-white">
                    {userName || "Player 1"}
                  </h1>
                  <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <p className="truncate text-xs font-semibold text-slate-400">
                  World {currentWorldIdx + 1} • {currentWorld.name}
                </p>
              </div>
            </div>

            {/* Currency & Streak HUD Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {streak > 0 && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 shadow-inner">
                  <span className="text-orange-400 text-xs animate-bounce"><ICONS.Flame /></span>
                  <span className="font-display text-xs font-black text-orange-300">{streak}</span>
                </div>
              )}
              <button
                type="button"
                onClick={onOpenShop}
                className="flex items-center gap-2 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 to-amber-600/10 px-3 py-1.5 shadow-lg transition-transform active:scale-95 hover:border-amber-400/60"
              >
                <CoinIcon className="text-base" />
                <span className="font-display text-sm font-black text-amber-300"><CoinAmount n={balance} /></span>
              </button>
            </div>

          </div>

          {/* Savings Goal Progress Indicator */}
          <button
            type="button"
            onClick={onOpenShop}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-left transition-colors hover:bg-amber-500/10"
          >
            <span className="text-lg" aria-hidden="true">🐷</span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/80">Savings Goal</span>
                <span className="text-[10px] font-bold text-slate-300"><CoinAmount n={balance} /> / {goal.toLocaleString()}</span>
              </div>
              <Bar pct={goalPct} color="linear-gradient(90deg, #fbbf24, #f59e0b)" track="rgba(255,255,255,0.06)" height="h-1.5" />
            </div>
          </button>
        </div>

        {/* ── 2 · HERO CAMPAIGN BANNER : Featured Play Button ── */}
        <div
          className="hj-rise group relative overflow-hidden rounded-3xl border p-5 text-left shadow-2xl transition-all duration-200"
          style={{
            animationDelay: '70ms',
            background: `radial-gradient(circle at 80% 20%, ${heroAccent}35 0%, rgba(15, 23, 42, 0.95) 75%)`,
            borderColor: `${heroAccent}66`,
            boxShadow: `0 12px 40px -10px ${heroAccent}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {/* Animated Background Shimmer */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)',
              animation: 'hj-shimmer 4s ease-in-out infinite',
            }}
          />

          {/* Ambient Glow Orb */}
          <span
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl"
            style={{ background: heroAccent, animation: 'hj-pulse-glow 4s ease-in-out infinite' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="font-display inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm"
                  style={{ background: heroAccent, color: '#090d16' }}
                >
                  {isFreshStart ? 'NEW GAME' : 'CONTINUE CAMPAIGN'}
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <Star key={i} filled={i < worldMedalStars(currentWorld, resultsByLevel)} color={heroAccent} size={12} />
                  ))}
                </div>
              </div>

              <h2 className="font-display truncate text-2xl font-black leading-tight text-white tracking-tight">
                {currentWorld.name}
              </h2>
              <p className="mb-3 truncate text-xs font-semibold text-slate-300">
                Level {Math.min(Math.max(levelInWorld, 1), currentWorld.levels.length)} of {currentWorld.levels.length} • {currentWorld.gimmickTitle}
              </p>

              <div className="max-w-xs">
                <Bar pct={heroProgress.percent} color={heroAccent} height="h-2" />
              </div>
            </div>

            {/* Glowing 3D Play Button */}
            <button
              type="button"
              onClick={onContinue}
              className="relative self-end sm:self-center flex h-14 sm:h-16 items-center justify-center gap-3 rounded-2xl px-6 font-display text-sm font-black tracking-wider uppercase text-slate-950 shadow-2xl transition-all duration-150 active:scale-95 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, #ffffff 0%, ${heroAccent} 100%)`,
                boxShadow: `0 8px 25px ${heroAccent}88, inset 0 2px 0 #ffffff`,
              }}
            >
              <span>PLAY NOW</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/20 text-slate-950">
                <ICONS.Play />
              </span>
            </button>
          </div>
        </div>

        {/* ── 3 · LOBBY NAVIGATION TABS ── */}
        <div className="hj-rise flex items-center justify-between border-b border-white/10 pb-2 pt-1" style={{ animationDelay: '120ms' }}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`font-display flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'campaign'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>Worlds</span>
              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                {WORLDS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mountain')}
              className={`font-display flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'mountain'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>Event Track</span>
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                10
              </span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            {totalDone}/{totalLevels} Cleared ({campaignPercent}%)
          </span>
        </div>

        {/* ── 4 · CAMPAIGN WORLDS TAB ── */}
        {activeTab === 'campaign' && (
          <div className="flex flex-col gap-3">
            {worldEntries.map(({ world, idx, progress, isLocked, defaultLevel, isCurrent }) => {
              const accent = ACCENT[world.theme] ?? '#34d399';
              const stars = worldMedalStars(world, resultsByLevel);
              const isOpen = expanded === idx;

              return (
                <div
                  key={world.name}
                  className="hj-rise glass-card overflow-hidden rounded-2xl border transition-all duration-200"
                  style={{
                    animationDelay: `${140 + idx * 30}ms`,
                    borderColor: isLocked
                      ? 'rgba(255,255,255,0.06)'
                      : isCurrent
                      ? `${accent}77`
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: isCurrent && !isLocked ? `0 0 20px ${accent}25` : 'none',
                    opacity: isLocked ? 0.55 : 1,
                  }}
                >
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => (isLocked ? undefined : setExpanded(isOpen ? null : idx))}
                    className="flex w-full items-center gap-4 p-3.5 text-left transition-colors hover:bg-white/5"
                  >
                    {/* World Medallion Badge */}
                    <div
                      className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black shadow-md border"
                      style={{
                        background: isLocked ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${accent}33, ${accent}10)`,
                        color: isLocked ? 'rgba(255,255,255,0.3)' : accent,
                        borderColor: isLocked ? 'rgba(255,255,255,0.08)' : `${accent}55`,
                      }}
                    >
                      {isLocked ? <ICONS.Lock /> : idx + 1}
                    </div>

                    {/* World Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-display truncate text-base font-black ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                          {world.name}
                        </span>
                        {isCurrent && !isLocked && (
                          <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider" style={{ background: `${accent}30`, color: accent }}>
                            CURRENT
                          </span>
                        )}
                      </div>

                      {isLocked ? (
                        <p className="text-xs font-semibold text-slate-500">Complete previous world to unlock</p>
                      ) : (
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1">
                            <Bar pct={progress.percent} color={accent} height="h-1.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stars & Toggle */}
                    {!isLocked && (
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map(i => <Star key={i} filled={i < stars} color={accent} size={11} />)}
                        </div>
                        <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          <ICONS.Up />
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Expanded Stage Grid */}
                  {isOpen && !isLocked && (
                    <div className="border-t border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-display text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {world.gimmickTitle || 'Level Stages'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {progress.completed} of {progress.total} Cleared
                        </span>
                      </div>

                      <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                        {world.levels.map((levelIdx, li) => {
                          const done = (resultsByLevel[levelIdx]?.time || 0) > 0;
                          const isActiveLevel = levelIdx === currentLevelIndex;
                          return (
                            <button
                              key={levelIdx}
                              onClick={() => onSelectLevel(levelIdx)}
                              title={`Level ${li + 1}`}
                              className="font-display flex h-10 w-full items-center justify-center rounded-xl text-xs font-black transition-all active:scale-90 border"
                              style={{
                                background: isActiveLevel ? accent : done ? `${accent}20` : 'rgba(255,255,255,0.04)',
                                color: isActiveLevel ? '#090d16' : done ? accent : 'rgba(255,255,255,0.4)',
                                borderColor: isActiveLevel ? accent : done ? `${accent}40` : 'rgba(255,255,255,0.08)',
                                boxShadow: isActiveLevel ? `0 0 12px ${accent}66` : 'none',
                              }}
                            >
                              {li + 1}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => onSelectLevel(defaultLevel)}
                        className="font-display flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-98"
                        style={{ background: `${accent}25`, color: accent, border: `1px solid ${accent}55` }}
                      >
                        <ICONS.Play /> Enter World {idx + 1}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 5 · EVENT TRACK TAB (Money Mountain) ── */}
        {activeTab === 'mountain' && (
          <div
            className="hj-rise glass-panel overflow-hidden rounded-3xl border p-4 shadow-2xl transition-all"
            style={{
              animationDelay: '140ms',
              borderColor: moneyUnlocked ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)',
              boxShadow: moneyUnlocked ? '0 0 30px rgba(251,191,36,0.15)' : 'none',
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xl shadow-lg">
                  <CoinIcon className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-white">{MONEY_WORLD.name}</h3>
                  <p className="text-xs font-semibold text-amber-300/80">Special Puzzle Challenge Track</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-500/30">
                EVENT
              </span>
            </div>

            {moneyUnlocked ? (
              <div className="flex flex-col gap-2">
                <div className="mb-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Track Mastery</span>
                    <span>{moneyDone} / {MONEY_LESSONS.length} Cleared</span>
                  </div>
                  <Bar pct={(moneyDone / MONEY_LESSONS.length) * 100} color={moneyAccent} height="h-2" />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {MONEY_LESSONS.map((lesson, i) => {
                    const levelIdx = MONEY_LEVEL_BASE + i;
                    const done = (resultsByLevel[levelIdx]?.time || 0) > 0;
                    const unlocked = isLessonUnlocked(i);
                    return (
                      <button
                        key={levelIdx}
                        disabled={!unlocked}
                        onClick={() => onSelectLevel(levelIdx)}
                        className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all active:scale-[0.98] disabled:opacity-40 border"
                        style={{
                          background: done ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                          borderColor: done ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="text-lg">{unlocked ? lesson.emoji : '🔒'}</span>
                        <span className={`font-display flex-1 truncate text-xs font-bold ${done ? 'text-amber-200' : 'text-slate-300'}`}>
                          {i + 1}. {lesson.title}
                        </span>
                        {done && <span className="text-xs font-bold text-emerald-400">✓ CLEARED</span>}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => onSelectLevel(firstUnfinishedLesson)}
                  className="mt-3 font-display flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xl transition-all active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                >
                  <ICONS.Play /> {moneyDone === 0 ? 'START TRACK' : 'CONTINUE TRACK'}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-400">Complete the initial tutorial levels to unlock the Event Track.</p>
              </div>
            )}
          </div>
        )}

        {/* ── 6 · FOOTER TIP ── */}
        <p className="hj-rise mt-2 px-2 text-center text-xs font-medium leading-relaxed text-slate-500" style={{ animationDelay: '200ms' }}>
          💡 {moneyTip}
        </p>

      </div>
    </div>
  );
};

export default WorldMapLanding;
