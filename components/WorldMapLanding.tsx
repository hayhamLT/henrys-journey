import React, { useState } from 'react';
import { WORLDS } from '../constants/game';
import { MONEY_LESSONS, MONEY_LEVEL_BASE, MONEY_WORLD, getMoneyTipOfDay, interestRateLabel, currentSavingsGoal } from '../constants/finlit';
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

// World stars reflect MASTERY (average medal), not mere completion — so the map
// rewards replaying for Gold. Legacy clears (pre-medals) count as Bronze.
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
      stroke={filled ? color : 'rgba(255,255,255,0.14)'}
      strokeWidth="1"
    />
  </svg>
);

// A thin labelled progress bar reused everywhere.
const Bar: React.FC<{ pct: number; color: string; track?: string }> = ({ pct, color, track = 'rgba(255,255,255,0.08)' }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: track }}>
    <div
      className="h-full rounded-full transition-[width] duration-700 ease-out"
      style={{ width: `${pct}%`, background: color, boxShadow: pct > 0 ? `0 0 8px ${color}66` : 'none' }}
    />
  </div>
);

const WorldMapLanding: React.FC<WorldMapLandingProps> = ({
  resultsByLevel,
  currentLevelIndex,
  onSelectLevel,
  onContinue,
  userName,
  quizCorrect = [],
  balance = 0,
  earned = 0,
  spent = 0,
  savedGoalPeak = 0,
  streak = 0,
  onOpenShop,
}) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [moneyOpen, setMoneyOpen] = useState(false);
  const moneyTip = getMoneyTipOfDay();

  const totalLevels = WORLDS.reduce((n, w) => n + w.levels.length, 0);
  const totalDone = WORLDS.reduce(
    (n, w) => n + w.levels.filter(l => (resultsByLevel[l]?.time || 0) > 0).length, 0
  );
  const campaignPercent = totalLevels ? Math.round((totalDone / totalLevels) * 100) : 0;
  const isFreshStart = currentLevelIndex === WORLDS[0]?.levels[0] && totalDone === 0;

  // The world the player is currently in — drives the hero card's theme + copy.
  const currentWorldIdx = Math.max(0, WORLDS.findIndex(w => w.levels.includes(currentLevelIndex)));
  const currentWorld = WORLDS[currentWorldIdx] ?? WORLDS[0];
  const heroAccent = ACCENT[currentWorld.theme] ?? '#34d399';
  const levelInWorld = currentLevelIndex - currentWorld.levels[0] + 1;
  const heroProgress = getWorldProgress(currentWorld, resultsByLevel);

  // Savings goal (piggy meter), now a slim glanceable bar.
  const goal = currentSavingsGoal(Math.max(savedGoalPeak, balance));
  const goalPct = Math.max(0, Math.min(100, Math.round((balance / goal) * 100)));

  // Money Mountain — a parallel learning track, unlocks after the tutorial.
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
    <div className="h-full w-full overflow-y-auto">
      <style>{`
        @keyframes hj-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes hj-shimmer { 0% { transform: translateX(-120%); } 55%,100% { transform: translateX(120%); } }
        @keyframes hj-pulse { 0% { box-shadow: 0 0 0 0 currentColor; } 70% { box-shadow: 0 0 0 12px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        .hj-rise { animation: hj-rise .5s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <div className="mx-auto flex w-full max-w-lg md:max-w-xl flex-col gap-3 px-4 pb-28 pt-3 md:pb-6">

        {/* ── 1 · Top bar : avatar + greeting + coin chip ── */}
        <div className="hj-rise flex items-center gap-3" style={{ animationDelay: '0ms' }}>
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', boxShadow: '0 0 0 1.5px rgba(52,211,153,0.4), 0 4px 14px rgba(16,185,129,0.3)' }}
          >
            <div className="scale-[2]"><ICONS.Bot /></div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-lg font-black leading-tight text-white">
              {userName ? `Hi, ${userName}!` : "Henry's Journey"}
            </h1>
            <p className="truncate text-xs font-semibold text-white/40">Earn, save &amp; spend smart</p>
          </div>
          <button
            type="button"
            onClick={onOpenShop}
            className="flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-2 pr-3 transition-transform active:scale-95"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)' }}
          >
            <span className="font-display text-sm font-black text-amber-200"><CoinAmount n={balance} /></span>
            {streak > 0 && (
              <span className="ml-0.5 flex items-center gap-0.5 text-[11px] font-black text-orange-300">
                <ICONS.Flame /> {streak}
              </span>
            )}
          </button>
        </div>

        {/* ── 2 · Savings goal : one slim tappable line ── */}
        <button
          type="button"
          onClick={onOpenShop}
          className="hj-rise flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-transform active:scale-[0.99]"
          style={{ animationDelay: '50ms', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}
        >
          <span className="text-base" aria-hidden="true">🐷</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-[11px] font-black uppercase tracking-wide text-amber-200/90">Savings goal</span>
              <span className="text-[11px] font-bold text-white/55"><CoinAmount n={balance} /> / {goal.toLocaleString()}</span>
            </div>
            <Bar pct={goalPct} color="linear-gradient(90deg,#fbbf24,#fcd34d)" track="rgba(0,0,0,0.3)" />
          </div>
        </button>

        {/* ── 3 · HERO : continue your adventure ── */}
        <button
          type="button"
          onClick={onContinue}
          className="hj-rise group relative mt-1 overflow-hidden rounded-3xl p-4 text-left transition-all duration-150 active:translate-y-[2px] active:scale-[0.99]"
          style={{
            animationDelay: '100ms',
            background: `linear-gradient(150deg, ${heroAccent}26 0%, rgba(15,23,42,0.85) 55%, rgba(15,23,42,0.95) 100%)`,
            border: `1px solid ${heroAccent}55`,
            boxShadow: `0 0 0 1px ${heroAccent}22, 0 10px 34px ${heroAccent}26`,
          }}
        >
          {/* shimmer sweep */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.10) 50%, transparent 62%)', animation: 'hj-shimmer 4.5s ease-in-out infinite' }}
          />
          {/* glow blob */}
          <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl" style={{ background: `${heroAccent}33` }} />

          <div className="relative flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-display text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: heroAccent }}>
                  {isFreshStart ? '▸ Start here' : '▸ Continue'}
                </span>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => <Star key={i} filled={i < worldMedalStars(currentWorld, resultsByLevel)} color={heroAccent} size={11} />)}
                </div>
              </div>
              <h2 className="font-display truncate text-xl font-black leading-tight text-white">{currentWorld.name}</h2>
              <p className="mb-2.5 truncate text-xs font-semibold text-white/55">
                {currentWorld.moneyConcept?.emoji} {currentWorld.moneyConcept?.title} · Level {Math.min(Math.max(levelInWorld, 1), currentWorld.levels.length)} of {currentWorld.levels.length}
              </p>
              <Bar pct={heroProgress.percent} color={heroAccent} />
            </div>

            {/* big play orb */}
            <span
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ background: `linear-gradient(160deg, ${heroAccent}, ${heroAccent}cc)`, boxShadow: `0 6px 18px ${heroAccent}66`, color: `${heroAccent}` }}
            >
              <span className="absolute inset-0 rounded-full" style={{ animation: 'hj-pulse 2.6s ease-out infinite' }} />
              <span className="scale-[1.6] text-slate-950"><ICONS.Play /></span>
            </span>
          </div>
        </button>

        {/* ── 4 · Worlds ── */}
        <div className="mt-2 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-black uppercase tracking-wider text-white/70">Worlds</h3>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
            {totalDone}/{totalLevels} cleared · {campaignPercent}%
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {worldEntries.map(({ world, idx, progress, isLocked, defaultLevel, isCurrent }) => {
            const accent = ACCENT[world.theme] ?? '#34d399';
            const stars = worldMedalStars(world, resultsByLevel);
            const isOpen = expanded === idx;

            return (
              <div
                key={world.name}
                className="hj-rise overflow-hidden rounded-2xl border transition-all duration-200"
                style={{
                  animationDelay: `${150 + idx * 35}ms`,
                  borderColor: isLocked ? 'rgba(255,255,255,0.06)' : isCurrent ? `${accent}66` : 'rgba(255,255,255,0.08)',
                  background: isLocked ? 'rgba(255,255,255,0.02)' : isCurrent ? `${accent}10` : 'rgba(255,255,255,0.04)',
                  opacity: isLocked ? 0.6 : 1,
                  boxShadow: isCurrent && !isLocked ? `0 0 0 1px ${accent}44, 0 6px 22px ${accent}1f` : 'none',
                }}
              >
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => (isLocked ? undefined : setExpanded(isOpen ? null : idx))}
                  className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left transition-transform active:scale-[0.99]"
                >
                  {/* medallion */}
                  <span
                    className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black"
                    style={{
                      background: isLocked ? 'rgba(255,255,255,0.05)' : `linear-gradient(150deg, ${accent}33, ${accent}14)`,
                      color: isLocked ? 'rgba(255,255,255,0.3)' : accent,
                      boxShadow: isLocked ? 'none' : `inset 0 0 0 1px ${accent}44`,
                    }}
                  >
                    {isLocked ? <ICONS.Lock /> : idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-display truncate text-[15px] font-black ${isLocked ? 'text-white/45' : 'text-white'}`}>
                        {world.name}
                      </span>
                      {isCurrent && !isLocked && (
                        <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide" style={{ background: `${accent}30`, color: accent }}>
                          here
                        </span>
                      )}
                    </div>
                    {isLocked ? (
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-white/35">Clear the world before to unlock</p>
                    ) : (
                      <>
                        <p className="mt-0.5 mb-1.5 truncate text-[11px] font-semibold text-white/45">
                          {world.moneyConcept?.emoji} {world.moneyConcept?.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1"><Bar pct={progress.percent} color={accent} /></div>
                          <span className="shrink-0 text-[10px] font-bold text-white/40">{progress.completed}/{progress.total}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isLocked && (
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex gap-0.5">{[0, 1, 2].map(i => <Star key={i} filled={i < stars} color={accent} />)}</div>
                      <span className={`text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><ICONS.Up /></span>
                    </div>
                  )}
                </button>

                {/* expanded : gimmick + level dots + play */}
                {isOpen && !isLocked && (
                  <div className="border-t px-3.5 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-white/35">{world.gimmickTitle}</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {world.levels.map((levelIdx, li) => {
                        const done = (resultsByLevel[levelIdx]?.time || 0) > 0;
                        const isActiveLevel = levelIdx === currentLevelIndex;
                        return (
                          <button
                            key={levelIdx}
                            onClick={() => onSelectLevel(levelIdx)}
                            title={`Level ${li + 1}`}
                            className="font-display h-8 w-8 rounded-xl text-[12px] font-black transition-transform duration-150 active:scale-90"
                            style={{
                              background: isActiveLevel ? accent : done ? `${accent}2e` : 'rgba(255,255,255,0.06)',
                              color: isActiveLevel ? '#0f172a' : done ? accent : 'rgba(255,255,255,0.3)',
                              boxShadow: isActiveLevel ? `0 2px 0 ${accent}99` : 'none',
                            }}
                          >
                            {li + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => onSelectLevel(defaultLevel)}
                      className="font-display flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition-transform active:scale-[0.98]"
                      style={{ background: `${accent}22`, color: accent, border: `1.5px solid ${accent}44` }}
                    >
                      <span className="scale-90"><ICONS.Play /></span> Play World {idx + 1}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── 5 · Money Mountain : special bonus track ── */}
        <div
          className="hj-rise mt-1 overflow-hidden rounded-2xl border transition-all duration-200"
          style={{
            animationDelay: '520ms',
            borderColor: moneyUnlocked ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)',
            background: moneyUnlocked ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
            opacity: moneyUnlocked ? 1 : 0.6,
            boxShadow: moneyUnlocked ? '0 0 0 1px rgba(251,191,36,0.15), 0 4px 20px rgba(251,191,36,0.08)' : 'none',
          }}
        >
          <button
            type="button"
            disabled={!moneyUnlocked}
            onClick={() => moneyUnlocked && setMoneyOpen(o => !o)}
            className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left transition-transform active:scale-[0.99]"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
              style={{ background: moneyUnlocked ? 'linear-gradient(150deg,rgba(251,191,36,0.3),rgba(251,191,36,0.12))' : 'rgba(255,255,255,0.05)', boxShadow: moneyUnlocked ? 'inset 0 0 0 1px rgba(251,191,36,0.4)' : 'none' }}
            >
              {moneyUnlocked ? <CoinIcon className="text-xl" /> : <ICONS.Lock />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-display truncate text-[15px] font-black ${moneyUnlocked ? 'text-white' : 'text-white/45'}`}>{MONEY_WORLD.name}</span>
                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide" style={{ background: 'rgba(251,191,36,0.2)', color: moneyAccent }}>Learn &amp; Earn</span>
              </div>
              {moneyUnlocked ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1"><Bar pct={(moneyDone / MONEY_LESSONS.length) * 100} color={moneyAccent} /></div>
                  <span className="shrink-0 text-[10px] font-bold text-white/40">{moneyDone}/{MONEY_LESSONS.length}</span>
                </div>
              ) : (
                <p className="mt-0.5 text-[11px] font-semibold text-white/40">Finish the tutorial to unlock</p>
              )}
            </div>
            {moneyUnlocked && <span className={`shrink-0 text-white/30 transition-transform duration-200 ${moneyOpen ? 'rotate-180' : ''}`}><ICONS.Up /></span>}
          </button>

          {moneyOpen && moneyUnlocked && (
            <div className="border-t px-3.5 py-3" style={{ borderColor: 'rgba(251,191,36,0.12)' }}>
              <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-amber-300/55">10 money lessons · earn bonus coins</p>
              <div className="mb-3 flex flex-col gap-1.5">
                {MONEY_LESSONS.map((lesson, i) => {
                  const levelIdx = MONEY_LEVEL_BASE + i;
                  const done = (resultsByLevel[levelIdx]?.time || 0) > 0;
                  const unlocked = isLessonUnlocked(i);
                  const bonusEarned = quizCorrect.includes(i);
                  return (
                    <button
                      key={levelIdx}
                      disabled={!unlocked}
                      onClick={() => onSelectLevel(levelIdx)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
                      style={{ background: done ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}` }}
                    >
                      <span className="text-base">{unlocked ? lesson.emoji : '🔒'}</span>
                      <span className={`font-display flex-1 truncate text-xs font-bold ${done ? 'text-amber-200' : 'text-white/70'}`}>{i + 1}. {lesson.title}</span>
                      {done && <span className="text-[10px] font-bold text-emerald-400">✓</span>}
                      {bonusEarned && <span title="Lesson bonus earned" className="flex items-center"><CoinIcon className="text-xs" /></span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onSelectLevel(firstUnfinishedLesson)}
                className="font-display w-full rounded-xl py-2.5 text-sm font-black transition-transform active:scale-[0.98]"
                style={{ background: 'rgba(251,191,36,0.18)', color: moneyAccent, border: '1.5px solid rgba(251,191,36,0.35)' }}
              >
                {moneyDone === 0 ? 'Start Learning' : moneyDone >= MONEY_LESSONS.length ? 'Play Again' : 'Continue Learning'}
              </button>
            </div>
          )}
        </div>

        {/* ── 6 · Money tip : subtle footer line ── */}
        <p className="hj-rise mt-1 px-1 text-center text-[11px] font-medium leading-relaxed text-white/35" style={{ animationDelay: '560ms' }}>
          💡 {moneyTip}
        </p>
      </div>
    </div>
  );
};

export default WorldMapLanding;
