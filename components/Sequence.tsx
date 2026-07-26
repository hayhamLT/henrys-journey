
import React, { useEffect, useRef } from 'react';
import { Move, MoveWithId, GameStatus, MoveEffect, CellType } from '../types';
import { ICONS } from './icons';
import { triggerHaptic } from '../utils/haptics';

interface SequenceProps {
  sequence: MoveWithId[];
  isExecuting: boolean;
  failedMoveIndex: number | null;
  currentMoveIndex: number | null;
  gameStatus: GameStatus;
  isTouchDevice: boolean;
  isPhasingMode: boolean;
  onTogglePhase: (id: number) => void;
  isTutorialActive: boolean;
  tutorialHintMove?: Move | null;
  highlightedButton?: 'run' | 'undo' | null;
  isLoading?: boolean;
  onRemoveLastMove: () => void;
  onRun: (recordVideo?: boolean) => void;
  onRetry?: () => void;
  autoSolvers?: number;
  onAutoSolve?: () => void;
  hasAutoSolved?: boolean; 
  label?: string; 
  accentColor?: string;
  isReady?: boolean;
  isOnline?: boolean;
  currentUserRole?: 'host' | 'guest' | null;
  isGhostAtEnd?: boolean;
  isAutoplayActive?: boolean;
}

const MoveIcon: React.FC<{ move: Move }> = ({ move }) => {
  const Icon = ICONS[move];
  return (
      <div style={{ transform: 'scale(0.85)' }}>
          <Icon />
      </div>
  );
};

const Sequence: React.FC<SequenceProps> = ({ sequence, isExecuting, failedMoveIndex, currentMoveIndex, gameStatus, isTouchDevice, isPhasingMode, onTogglePhase, isTutorialActive, tutorialHintMove, highlightedButton, isLoading, onRemoveLastMove, onRun, onRetry, autoSolvers = 0, onAutoSolve, hasAutoSolved, label, accentColor, isReady, isOnline, currentUserRole, isGhostAtEnd, isAutoplayActive }) => {
  const isGuided = !isPhasingMode && isExecuting;
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const placeholderText = isPhasingMode
    ? "Select to phase..."
    : isGuided
    ? "Running..."
    : isTouchDevice
    ? "Swipe"
    : (isOnline ? "Planning..." : "Plan path");

  const isAccepting = gameStatus === GameStatus.Executing && failedMoveIndex === null;
  const isFailure = gameStatus === GameStatus.Failure;
  const isSuccess = gameStatus === GameStatus.Success;
  // On both failure AND success the action button replays the level (success
  // replay = chase a better medal; resetToPlanning cancels the pending auto-advance).
  const isRetryable = isFailure || isSuccess;

  const displayedSequence = sequence;
  const activeDisplayIndex = currentMoveIndex;
  const failedDisplayIndex = failedMoveIndex;

  useEffect(() => {
      if (containerRef.current && activeDisplayIndex !== null) {
          const scrollContainer = containerRef.current;
          const innerContainer = scrollContainer.firstElementChild;
          if (!innerContainer) return;

          const targetIndex = Math.min(activeDisplayIndex, innerContainer.children.length - 1);
          const activeItem = innerContainer.children[targetIndex] as HTMLElement;
          
          if (activeItem) {
              activeItem.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'center'
              });
          }
      }
  }, [activeDisplayIndex]);

  useEffect(() => {
      if (endRef.current && displayedSequence.length > 0 && !isExecuting) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
      }
  }, [displayedSequence.length, isExecuting]);

  const hasSequence = sequence.length > 0;
  const shouldAlignLeft = displayedSequence.length > 0 || !!tutorialHintMove;

  const getEffectClasses = (effect?: MoveEffect) => {
      if (!effect) return '';
      
      const itemType = effect.itemType;

      if (effect.type === 'collect' || effect.type === 'unlock') {
          if (itemType === CellType.Package_Blue || itemType === CellType.ForceField_Blue) return 'text-blue-500 bg-blue-500/10 border-blue-500/50';
          if (itemType === CellType.Package_Red || itemType === CellType.ForceField_Red) return 'text-red-500 bg-red-500/10 border-red-500/50';
          if (itemType === CellType.Package_Purple || itemType === CellType.ForceField_Purple) return 'text-purple-500 bg-purple-500/10 border-purple-500/50';
          if (itemType === CellType.Package_Orange || itemType === CellType.ForceField_Orange) return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
          if (itemType === CellType.Package_Cyan || itemType === CellType.ForceField_Cyan) return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/50';
          if (itemType === CellType.Package_Circuit || itemType === CellType.ForceField) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
          if (itemType === CellType.Package) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50';
          return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50';
      }
      
      if (effect.type === 'teleport') {
          if (itemType === CellType.Teleporter_A || itemType === CellType.Teleporter_B) return 'text-[var(--accent-cyan)] bg-cyan-500/10 border-cyan-500/50';
          if (itemType === CellType.Teleporter_C || itemType === CellType.Teleporter_D) return 'text-[var(--accent-magenta)] bg-fuchsia-500/10 border-fuchsia-500/50';
          if (itemType === CellType.Teleporter_E || itemType === CellType.Teleporter_F) return 'text-[var(--accent-yellow)] bg-yellow-500/10 border-yellow-500/50';
          return 'text-purple-500 bg-purple-500/10 border-purple-500/50';
      }

      if (effect.type === 'collision') return 'text-red-500 bg-red-500/10 border-red-500/50';
      return '';
  };

  return (
    <div 
        className={`w-full bg-slate-950/80 backdrop-blur-2xl border-t border-white/15 flex flex-row items-stretch h-20 sm:h-20 select-none overflow-hidden transition-all duration-300 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.6)] ${isFailure ? 'shadow-[0_-8px_30px_rgba(239,68,68,0.4)] border-red-500/40' : isSuccess ? 'shadow-[0_-8px_30px_rgba(251,191,36,0.3)] border-amber-500/40' : ''}`}
    >
      
      {/* Auto Solver Button - Section 1 */}
      <div className="shrink-0 w-16 sm:w-20 h-full flex flex-col items-center justify-center border-r border-white/5 relative z-30">
          {label ? (
              // Dark chip + bright accent text — high contrast on the dark glass bar
              // (the old white chip made the cyan/orange accent nearly unreadable).
              <span
                  className="font-black text-[10px] tracking-wide px-2 py-1 rounded bg-black/40 border shadow-sm"
                  style={{ color: accentColor || '#cbd5e1', borderColor: `${accentColor || '#94a3b8'}66` }}
              >{label}</span>
          ) : (
              <div className="relative group flex flex-col items-center justify-center h-full w-full hover:bg-white/5 transition-colors">
                  <button
                      onClick={() => {
                          triggerHaptic('light');
                          onAutoSolve?.();
                      }}
                      disabled={isExecuting || isTutorialActive || isLoading || autoSolvers <= 0 || hasAutoSolved || isAutoplayActive}
                      aria-label="Auto Solve"
                      title="Auto Solve Path"
                      className="w-full h-full flex flex-col items-center justify-center group-hover:scale-105 transition-transform"
                  >
                      <div className={`scale-90 sm:scale-100 ${autoSolvers > 0 && !hasAutoSolved ? 'text-[var(--accent-cyan)]' : 'text-white/30'} transition-colors`}>
                          <ICONS.CPU />
                      </div>
                  </button>
                  {autoSolvers > 0 && !hasAutoSolved && (
                      <div className="absolute top-3 right-3 z-50 bg-[var(--accent-cyan)] text-white text-[9px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center shadow-sm border border-white pointer-events-none">
                          {autoSolvers}
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* Scrolling Move List - Section 2 (Middle) */}
      <div 
        ref={containerRef}
        className="flex-grow flex flex-row flex-nowrap gap-1 p-2 items-center overflow-x-auto no-scrollbar relative bg-transparent"
      >
        <div className="flex flex-row flex-nowrap gap-1 w-full items-center min-w-full px-2 h-full" style={{ justifyContent: shouldAlignLeft ? 'flex-start' : 'center' }}>
            {displayedSequence.length === 0 && !tutorialHintMove ? (
            <div className="w-full text-center text-white/30 text-[11px] font-bold tracking-wide whitespace-nowrap opacity-70">
                {placeholderText}
            </div>
            ) : (
            <>
                {displayedSequence.map(({ move, id, isPhased, owner, effect }, index) => {
                const isPastMove = gameStatus === GameStatus.Success || (activeDisplayIndex !== null && index < activeDisplayIndex);
                const effectClass = getEffectClasses(effect);
                
                const itemClasses = [
                    'relative group move-item-anim flex-shrink-0',
                    'move-enter-anim',
                    index === failedDisplayIndex ? 'failed' : 
                    index === activeDisplayIndex ? 'executing' : 
                    effectClass ? effectClass : 
                    isAccepting ? 'accepting' : null,
                    isPastMove && index !== failedDisplayIndex && !effectClass ? 'faded-out' : null,
                    isPhased ? 'border-purple-400 ring-2 ring-purple-100' : null,
                    (isPhasingMode || isPhased) && !isExecuting ? 'cursor-pointer animate-pulse' : '',
                ].filter(Boolean).join(' ');

                let borderColor = undefined;
                let bgColor = undefined;
                let color = undefined;
                
                if (isOnline && owner && !effectClass && index !== activeDisplayIndex && index !== failedDisplayIndex) {
                    borderColor = owner === 'host' ? '#06b6d4' : '#f97316';
                    bgColor = owner === 'host' ? '#ecfeff' : '#fff7ed';
                    color = owner === 'host' ? '#0891b2' : '#c2410c';
                }

                const pseudoRandom = (id * 9301 + 49297) % 233280;
                const enterRot = (pseudoRandom / 233280) * 30 - 15;

                const style: React.CSSProperties = {
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                    color: color,
                    '--enter-rot': `${enterRot}deg`,
                } as React.CSSProperties;
                
                if (isAccepting) style.animationDelay = `${index * 0.04}s`;
                if (isFailure) style.animationDelay = `${index * 0.05}s`;

                return (
                    <div 
                    key={id} 
                    className={itemClasses}
                    style={style}
                    onClick={() => {
                        if ((isPhasingMode || isPhased) && !isExecuting) {
                            triggerHaptic('light');
                            onTogglePhase(id);
                        }
                    }}
                    >
                        <MoveIcon move={move} />
                    </div>
                );
                })}
                
                {tutorialHintMove && gameStatus === GameStatus.Planning && (
                    <div className="relative group flex-shrink-0 flex items-center justify-center w-10 h-10 border-2 border-dashed border-[var(--accent-cyan)] rounded-lg animate-pulse bg-cyan-500/20">
                        <div className="text-[var(--accent-cyan)]">
                            <MoveIcon move={tutorialHintMove} />
                        </div>
                    </div>
                )}
            </>
            )}
            <div ref={endRef} className="w-20 sm:w-28 h-full flex-shrink-0" />
        </div>
      </div>

      {/* Undo & Run/Retry Buttons - Section 3 (Right) */}
      <div className="shrink-0 flex items-center h-full border-l border-white/10 bg-transparent">
          <button
              onClick={() => {
                  triggerHaptic('light');
                  onRemoveLastMove();
              }}
              disabled={isExecuting || !hasSequence || (isTutorialActive && highlightedButton !== 'undo') || isLoading || isAutoplayActive}
              aria-label="Undo"
              className={`h-full w-14 sm:w-16 flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 group border-r border-white/10 transition-all duration-150 ${highlightedButton === 'undo' ? 'bg-red-500/20 animate-pulse' : ''}`}
          >
              <div className="text-white/40 group-hover:text-red-400 group-hover:scale-110 transition-all duration-150 scale-90 sm:scale-100">
                  <ICONS.Backspace />
              </div>
          </button>
          
          <button
              onClick={(e) => {
                  triggerHaptic(isFailure ? 'warning' : 'medium');
                  if (isRetryable) {
                      onRetry?.();
                  } else {
                      onRun((e as React.MouseEvent<HTMLButtonElement>).shiftKey);
                  }
              }}
              disabled={isExecuting || (isTutorialActive && highlightedButton !== 'run') || isLoading || isAutoplayActive}
              aria-label={isFailure ? "Retry" : isSuccess ? "Replay" : "Run"}
              title={isFailure ? "Retry Level" : isSuccess ? "Replay to beat your best" : "Hold Shift + Click to Record"}
              className={`h-full w-16 sm:w-20 flex flex-col items-center justify-center hover:bg-white/10 active:scale-95 group transition-all duration-150 outline-none
                ${highlightedButton === 'run' ? 'bg-emerald-500/25 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]' : ''}
                ${isAutoplayActive ? 'bg-cyan-500/25' : ''}
                ${isFailure ? 'bg-red-500/20 hover:bg-red-500/30 border-t-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}
                ${isSuccess ? 'bg-amber-500/20 hover:bg-amber-500/30 border-t-2 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : ''}
                `}
          >
              <div className={`transition-all duration-150 group-hover:scale-110
                ${isAutoplayActive ? 'text-[var(--accent-cyan)] animate-pulse' :
                  (isFailure ? 'text-[var(--accent-red)] animate-pulse scale-110' :
                  (isSuccess ? 'text-[var(--accent-yellow)]' :
                  (isReady || isGhostAtEnd ? 'text-[var(--accent-green)] drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-white/40 group-hover:text-[var(--accent-green)]')))}`}>
                  {isRetryable ? <ICONS.Retry /> : <ICONS.Play />}
              </div>
          </button>
      </div>
    </div>
  );
};

export default React.memo(Sequence);
