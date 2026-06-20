import React, { useMemo, useEffect } from 'react';
import { ICONS } from './icons';
import { UserProfile, HatState, TransientStatus, LevelResult, World, CustomLevelEntry } from '../types';
import LevelSelector from './LevelSelector';

interface MainMenuProps {
  onContinue: () => void;
  onNewGame: () => void;
  onBuilder: () => void;
  onSettings: () => void;
  onTournament: () => void;
  onCoop?: () => void;
  hasSaveGame: boolean;
  user: UserProfile | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onOpenSocial: (tab?: 'friends' | 'inbox' | 'profile') => void;
  inboxCount: number;
  onDailyChallenge?: () => void;
  onOpenHelp: () => void;
  onUpdateName?: (newName: string) => void;
  onUpdatePhoto?: (newPhoto: string) => void;
  hatState?: HatState;
  totalScore?: number;
  completedLevels?: number;
  transientStatusMessage?: TransientStatus | null;
  resultsByLevel?: { [level: number]: LevelResult };
  currentLevelIndex?: number;
  allWorlds?: World[];
  onSelectLevel?: (levelIndex: number) => void;
  onOpenShop?: () => void;
  customLevels?: CustomLevelEntry[];
  isDemoStarting?: boolean;
}

const getWorldProgress = (world: World | undefined, resultsByLevel: { [level: number]: LevelResult } | undefined) => {
  if (!world || !resultsByLevel) return { completed: 0, total: world?.levels.length || 0, percent: 0 };
  const completed = world.levels.filter(levelIndex => (resultsByLevel[levelIndex]?.time || 0) > 0).length;
  const total = world.levels.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
};

const LogoDisplay = () => (
  <div className="flex flex-col items-center justify-center mb-5 mt-5 select-none">
    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-none text-center">
      Henry's Journey
    </h1>
    <p className="mt-2 text-xs sm:text-sm text-white/60">Choose world. Choose level. Play.</p>
  </div>
);

const ContinueCard: React.FC<{
  onPlay: () => void;
  currentLevelIndex: number;
  world?: World;
  worldProgress: { completed: number; total: number; percent: number };
  isDemoStarting?: boolean;
}> = ({ onPlay, currentLevelIndex, world, worldProgress, isDemoStarting }) => {
  const label = currentLevelIndex === 0 ? 'Start' : 'Resume';
  const glowClass = isDemoStarting ? 'ring-2 ring-[var(--accent-cyan)] shadow-[0_0_24px_rgba(34,211,238,0.45)] scale-[1.01]' : '';

  return (
    <div className="mx-auto mb-6 w-full max-w-3xl px-2 sm:px-4">
      <button
        onClick={onPlay}
        className={`group relative w-full overflow-hidden rounded-2xl border border-white/12 bg-black/30 backdrop-blur-xl p-4 sm:p-5 text-left transition-all duration-300 hover:bg-black/40 hover:-translate-y-0.5 active:scale-[0.99] ${glowClass}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:18px_18px] opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-300/18 via-sky-500/10 to-emerald-300/10 opacity-75 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 relative z-10">
            <div className="inline-flex rounded-full border border-teal-200/25 bg-teal-300/15 px-2 py-0.5 text-[9px] font-black text-teal-100">Playing</div>
            <div className="mt-1 truncate font-display text-xl sm:text-2xl font-black text-white">{world?.name || 'Unknown'}</div>
            <div className="mt-2 text-xs text-white/70">Level {String(currentLevelIndex + 1).padStart(3, '0')} • {worldProgress.percent}% complete</div>
          </div>

          <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white">
            <ICONS.Play />
          </div>
        </div>

        <div className="relative z-10 mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: `${worldProgress.percent}%` }} />
        </div>

        <div className="relative z-10 mt-3 text-[11px] sm:text-xs text-[var(--accent-cyan)]">{label}</div>
      </button>
    </div>
  );
};

const MainMenu: React.FC<MainMenuProps> = (props) => {
  const { resultsByLevel, currentLevelIndex = 0, allWorlds, onSelectLevel, onContinue } = props;

  const currentWorld = useMemo(() => {
    if (!allWorlds) return undefined;
    return allWorlds.find(w => w.levels.includes(currentLevelIndex));
  }, [allWorlds, currentLevelIndex]);

  const worldProgress = useMemo(() => getWorldProgress(currentWorld, resultsByLevel), [currentWorld, resultsByLevel]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-12%] top-[-8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.16),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[14%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_55%)] blur-3xl" />
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-3 sm:p-4 pb-24 md:pb-8" onScroll={handleScroll}>
        <div className="max-w-5xl mx-auto w-full relative z-10">
          <LogoDisplay />

          <div className="mx-auto mb-2 w-full max-w-3xl px-2 sm:px-4">
            <div className="text-[10px] text-white/45">World Navigator</div>
          </div>

          <ContinueCard
            onPlay={onContinue}
            currentLevelIndex={currentLevelIndex}
            world={currentWorld}
            worldProgress={worldProgress}
            isDemoStarting={props.isDemoStarting}
          />

          {resultsByLevel && allWorlds && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LevelSelector
                resultsByLevel={resultsByLevel}
                currentLevelIndex={currentLevelIndex}
                allWorlds={allWorlds}
                onSelectLevel={onSelectLevel || (() => {})}
                onDeleteLevel={() => {}}
                customLevels={props.customLevels}
                onPublishLevel={undefined}
                onChallenge={undefined}
                disableAutoScroll={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
