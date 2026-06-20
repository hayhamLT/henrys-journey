import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameStatus, FailureType, World, LevelResult, Level, TransientStatus, CellType } from '../types';
import AnimatedNumber from './AnimatedNumber';
import ModernNotification from './ModernNotification';
import { Tab as GlobalOverlayTab } from './GlobalOverlay';
import { CoinIcon } from './CoinIcon';

const SimpleTutorialText: React.FC<{ text: string, disablePulse?: boolean }> = ({ text, disablePulse }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part.length > 0);
  return (
    <span className={disablePulse ? '' : 'animate-pulse'}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-[var(--accent-cyan)] font-black">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

interface HeaderProps {
  levelIndex: number;
  world: World | null;
  allWorlds: World[];
  status: GameStatus;
  totalScore: number;
  failureType: FailureType;
  tutorialMessage?: string | null;
  tutorialStep: number;
  time: number;
  levelResult: LevelResult | null;
  currentLevel: Level;
  onOpenGlobalMenu: (tab: GlobalOverlayTab) => void;
  isTutorialActive: boolean;
  onSkipTutorial: () => void;
  transientStatusMessage: TransientStatus | null;
  isCustomLevel?: boolean;
  coopPlayers?: { name: string; isConnected: boolean; partnerStatus: { status: string; color: string } | null } | null;
  timeLabel?: string;
  titleOverride?: string;
  challengeMode?: 'standard' | 'daily';
  movesCount?: number;
  objectiveSummary?: string;
  objectiveStatusLine?: string | null;
  onExit: () => void;
  onOpenDailyHub?: () => void;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const Header: React.FC<HeaderProps> = ({
  levelIndex,
  world,
  status,
  totalScore,
  failureType,
  tutorialMessage,
  time,
  levelResult,
  currentLevel,
  onOpenGlobalMenu,
  isTutorialActive,
  transientStatusMessage,
  isCustomLevel,
  coopPlayers,
  timeLabel = 'TIME',
  titleOverride,
  challengeMode,
  movesCount = 0,
  objectiveSummary,
  objectiveStatusLine,
  onOpenDailyHub,
}) => {
  const SHOW_HEADER_NOTIFICATIONS = false;
  const [showNotification, setShowNotification] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const prevTotalScore = useRef(totalScore);

  const statusInfo = useMemo(() => {
    if (transientStatusMessage) {
      let colorClass = 'text-[var(--accent-cyan)]';
      if (transientStatusMessage.color === 'yellow') colorClass = 'text-[var(--accent-yellow)]';
      if (transientStatusMessage.color === 'red') colorClass = 'text-[var(--accent-red)]';
      return { type: 'info', content: transientStatusMessage.text, color: colorClass };
    }

    switch (status) {
      case GameStatus.Executing:
        return { type: 'executing', content: 'RUNNING...', color: 'text-[var(--accent-yellow)] animate-pulse' };
      case GameStatus.Success:
        return { type: 'success', content: 'COMPLETE!', color: 'text-[var(--accent-green)]' };
      case GameStatus.Failure: {
        let failureText = 'FAILED';
        if (failureType === 'wall') failureText = 'COLLISION';
        if (failureType === 'hole') failureText = 'FELL';
        if (failureType === 'bomb') failureText = 'BOOM';
        if (failureType === 'incomplete') failureText = 'STRANDED';
        if (failureType === 'missed_gem') failureText = 'MISSED GEM';
        if (failureType === 'out_of_moves') failureText = 'OUT OF MOVES';
        if (failureType === 'low_score') failureText = 'LOW SCORE';
        if (failureType === 'broke') failureText = 'BROKE!';
        return { type: 'failure', content: failureText, color: 'text-[var(--accent-red)]' };
      }
      default:
        return { type: 'default', content: '', color: '' };
    }
  }, [status, failureType, transientStatusMessage]);

  const showStatusText = !!transientStatusMessage || status === GameStatus.Failure || status === GameStatus.Success || status === GameStatus.Executing;

  useEffect(() => {
    if (totalScore !== prevTotalScore.current) {
      setIsUpdated(true);
      const timer = setTimeout(() => setIsUpdated(false), 500);
      prevTotalScore.current = totalScore;
      return () => clearTimeout(timer);
    }
  }, [totalScore]);

  const numericLevel = useMemo(() => {
    if (levelIndex === -1) return null;
    if (levelIndex >= 10000) return levelIndex - 9999;
    return levelIndex + 1;
  }, [levelIndex]);

  const startScore = levelResult ? totalScore - levelResult.scoreBreakdown.total : undefined;
  const targetTime = levelResult ? levelResult.time : time;

  const isDaily = challengeMode === 'daily';
  const par = currentLevel.par || 0;
  const hasTeleporters = useMemo(() => {
    return currentLevel.grid.some(row =>
      row.some(cell =>
        cell === CellType.Teleporter_A ||
        cell === CellType.Teleporter_B ||
        cell === CellType.Teleporter_C ||
        cell === CellType.Teleporter_D ||
        cell === CellType.Teleporter_E ||
        cell === CellType.Teleporter_F
      )
    );
  }, [currentLevel.grid]);

  const coachingTip = useMemo(() => {
    if (!SHOW_HEADER_NOTIFICATIONS) return null;
    // Simplified coaching tip for less distraction
    if (transientStatusMessage) return null;
    if (isTutorialActive) return null; // Hide tips during tutorial
    if (status === GameStatus.Success) return 'Level complete!';
    if (status === GameStatus.Failure) return 'Try again.';
    return null;
  }, [SHOW_HEADER_NOTIFICATIONS, transientStatusMessage, status, failureType, isTutorialActive]);

  // Show notification when coachingTip changes
  useEffect(() => {
    if (coachingTip) setShowNotification(true);
  }, [coachingTip]);
  const isTutorialLevel = levelIndex < 5 && !isCustomLevel && !challengeMode;

  const criticalStatusContent = showStatusText && statusInfo.content
    ? <div className={`text-xs sm:text-lg font-black ${statusInfo.color} whitespace-nowrap drop-shadow-md`}>{statusInfo.content}</div>
    : null;

  const compactNotification = useMemo(() => {
    // Remove compact notifications for less interruption
    return null;
  }, []);

  const titleContent = (
    <div className="flex flex-col items-center animate-in fade-in duration-500">
      {coopPlayers ? (
        <>
          <span className="text-[8px] sm:text-[9px] font-bold text-white/50 hidden sm:block">Partner</span>
          <span className={`text-xs sm:text-sm font-black truncate max-w-[120px] ${coopPlayers.isConnected ? 'text-white' : 'text-white/50'}`}>
            {coopPlayers.name}
          </span>
          {coopPlayers.partnerStatus && (
            <span className={`text-[8px] font-bold ${coopPlayers.partnerStatus.color}`}>
              {coopPlayers.partnerStatus.status}
            </span>
          )}
        </>
      ) : titleOverride ? (
        <>
          <span className="text-[8px] sm:text-[9px] font-bold text-white/50 mb-0.5 hidden sm:block">Level</span>
          <span className="text-xs sm:text-base font-black text-white whitespace-normal sm:truncate leading-none sm:leading-normal max-w-[120px] sm:max-w-xs block drop-shadow-sm">
            {titleOverride}
          </span>
          {world && !challengeMode && !isCustomLevel && (
            <span className="mt-1 text-[8px] sm:text-[9px] font-bold text-white/45 truncate max-w-[160px] sm:max-w-sm">
              {world.name}
            </span>
          )}
        </>
      ) : (
        <>
          {!isTutorialLevel && (
            <span className="text-[8px] sm:text-[9px] font-bold text-white/50 mb-0.5 hidden sm:block">World</span>
          )}
          <span className={`${isTutorialLevel ? 'text-xl sm:text-3xl' : 'text-xs sm:text-base'} font-black text-white truncate leading-none sm:leading-normal max-w-[180px] sm:max-w-md block drop-shadow-sm transition-all duration-300`}>
            {isTutorialLevel ? <SimpleTutorialText text={tutorialMessage || 'Ready!'} /> : (world?.name || (isCustomLevel ? 'My Space' : 'Unknown'))}
          </span>
          {!criticalStatusContent && isTutorialActive && tutorialMessage && !isTutorialLevel && (
            <div className="mt-1 text-[9px] sm:text-[10px] font-bold text-[var(--accent-cyan)] tracking-wide animate-pulse">
              <SimpleTutorialText text={tutorialMessage} disablePulse />
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="w-full pointer-events-none flex flex-col gap-2">
      {/* Modern interactive notification for coaching tips */}
      {SHOW_HEADER_NOTIFICATIONS && coachingTip && showNotification && (
        <ModernNotification
          message={coachingTip}
          actionLabel="Dismiss"
          onAction={() => setShowNotification(false)}
          onClose={() => setShowNotification(false)}
        />
      )}
      <header className="pointer-events-auto w-full bg-black/20 backdrop-blur-2xl border-b border-white/5 flex flex-row items-stretch h-16 lg:h-20 select-none overflow-hidden text-white pt-safe shadow-lg transition-colors duration-500">
        <button
          onClick={() => {
            if (challengeMode === 'daily' && onOpenDailyHub) onOpenDailyHub();
            else onOpenGlobalMenu('levels');
          }}
          className="group shrink-0 w-16 sm:w-20 h-full flex flex-col items-center justify-center border-r border-white/5 hover:bg-white/5 transition-colors"
          title={challengeMode === 'daily' ? 'Daily Progress' : 'Select Level'}
        >
          <span className="text-[8px] sm:text-[9px] font-black text-white/50 group-hover:text-[var(--accent-cyan)] transition-colors mb-0.5">
            {isDaily ? 'Daily' : (isCustomLevel ? 'Custom' : 'Level')}
          </span>
          <span className={`text-xl sm:text-2xl font-display font-black leading-none transition-colors ${isDaily ? 'text-[var(--accent-orange)]' : 'text-white'} group-hover:text-[var(--accent-cyan)] drop-shadow-sm`}>
            {numericLevel !== null ? ((levelIndex < 10000 && numericLevel > 200) ? '∞' : <AnimatedNumber value={numericLevel} />) : '?'}
          </span>
        </button>

        <div className="flex-grow h-full flex items-center justify-center relative overflow-hidden px-2 sm:px-4">
          <div className="text-center w-full flex flex-col items-center justify-center">
            {criticalStatusContent ? criticalStatusContent : titleContent}
            {!criticalStatusContent && compactNotification && (
              {/* Notification removed for easier learning */}
            )}
          </div>
        </div>

        <div className="shrink-0 w-16 sm:w-20 h-full flex flex-col items-center justify-center border-l border-white/5">
          {isDaily ? (
            <>
              <span className="text-[8px] sm:text-[9px] font-black text-white/50 mb-0.5">Par</span>
              <span className={`text-base sm:text-xl font-display font-bold leading-none tabular-nums tracking-tight ${movesCount > par ? 'text-[var(--accent-red)]' : 'text-white'}`}>
                {movesCount}/{par}
              </span>
            </>
          ) : (
            <>
              <span className="text-[8px] sm:text-[9px] font-black text-white/50 mb-0.5">{timeLabel || 'Time'}</span>
              <span className={`text-base sm:text-xl font-display font-bold leading-none tabular-nums tracking-tight ${levelResult ? 'text-teal-400' : 'text-white'}`}>
                {formatTime(targetTime)}
              </span>
            </>
          )}
        </div>

        <div className="shrink-0 w-20 sm:w-24 h-full flex flex-col items-center justify-center border-l border-white/5">
          <span className="text-[8px] sm:text-[9px] font-black text-white/50 mb-0.5">Coins</span>
          <span className={`text-base sm:text-xl font-display font-black leading-none tabular-nums tracking-tight transition-transform flex items-center gap-1 ${isUpdated ? 'scale-110 text-amber-300' : 'text-white'}`}>
            <CoinIcon className="text-sm" />
            <AnimatedNumber value={totalScore} startValue={startScore} />
          </span>
        </div>
      </header>
    </div>
  );
};

export default React.memo(Header);
