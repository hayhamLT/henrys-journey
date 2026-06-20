
import React, { useEffect, useRef, useState } from 'react';
import { ICONS } from './icons';
import { getDailyLeaderboard } from '../firebase';
import { interestRateLabel } from '../constants/finlit';
import { CoinAmount } from './CoinIcon';
import { TournamentPlayer } from '../types';

interface DailyChallengeHubProps {
    dateStr: string;
    lives: number;
    currentLevel: number;
    isCompleted: boolean;
    streak?: number;
    onPlay: () => void;
    onExit: () => void;
}

// Time remaining until the next daily resets (local midnight).
const useDailyCountdown = (): string => {
    const [label, setLabel] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(24, 0, 0, 0);
            const diff = next.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setLabel(h > 0 ? `${h}h ${m}m` : `${m}m`);
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, []);
    return label;
};

const DailyChallengeHub: React.FC<DailyChallengeHubProps> = ({ dateStr, lives, currentLevel, isCompleted, streak = 0, onPlay, onExit }) => {
    const isFailed = lives <= 0;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [leaders, setLeaders] = useState<TournamentPlayer[]>([]);
    const countdown = useDailyCountdown();

    // Pull today's leaderboard (best score per player).
    useEffect(() => {
        let cancelled = false;
        if (dateStr) {
            getDailyLeaderboard(dateStr).then(rows => { if (!cancelled) setLeaders(rows); }).catch(() => {});
        }
        return () => { cancelled = true; };
    }, [dateStr, isCompleted]);

    // Auto-scroll to current level & Reset Parallax
    useEffect(() => {
        document.body.style.setProperty('--scroll-y', '0px');

        if (scrollRef.current) {
            // Delay scroll until AFTER the entry animation (approx 700ms) completes
            const timer = setTimeout(() => {
                const currentElement = scrollRef.current?.querySelector('.current-level-node');
                if (currentElement) {
                    currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 800);
            
            return () => clearTimeout(timer);
        }
        
        return () => {
            document.body.style.setProperty('--scroll-y', '0px');
        };
    }, [currentLevel]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        requestAnimationFrame(() => {
            document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            
            {/* Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 shadow-sm shrink-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--accent-orange)] scale-125"><ICONS.Star filled /></div>
                    <div>
                        <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide">Daily Allowance</h2>
                        <p className="text-xs text-white/50 font-medium">Earn your coins every day</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {streak > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 px-3 py-1.5">
                            <span className="text-base" aria-hidden="true">🔥</span>
                            <span className="font-display text-sm font-bold text-orange-300">{streak} day{streak === 1 ? '' : 's'}</span>
                        </div>
                    )}
                    {countdown && (
                        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5" title="Time until the next daily challenge">
                            <span className="text-white/40"><ICONS.Time /></span>
                            <span className="font-display text-sm font-bold text-white/70 tabular-nums">{countdown}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div 
                className="flex-grow overflow-y-auto no-scrollbar p-4 pb-32 md:pb-8 pt-6"
                ref={scrollRef}
                onScroll={handleScroll}
            >
                <div className="max-w-xl lg:max-w-4xl mx-auto w-full lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
                  <div className="lg:min-w-0">

                    {/* Hero Button */}
                    <div className="w-full mx-auto mb-8 relative group perspective-1000 animate-in fade-in slide-in-from-bottom-8 duration-700 px-2 sm:px-0">
                        <button
                            onClick={(!isFailed && !isCompleted) ? onPlay : undefined}
                            disabled={isFailed || isCompleted}
                            className={`w-full relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 group liquid-glass p-0 border border-white/10 
                                ${(!isFailed && !isCompleted) ? 'hover:scale-[1.02] active:scale-95 hover:border-orange-500/30 hover:shadow-[0_0_40px_rgba(251,146,60,0.2)] cursor-pointer' : 'cursor-default opacity-90'}
                            `}
                        >
                            {/* Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#431407]/80 via-[#7c2d12]/60 to-transparent z-0"></div>

                            {/* Animated Theme Glow */}
                            <div
                                className="absolute inset-0 opacity-20 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-40"
                                style={{ background: `linear-gradient(135deg, #fb923c, #c2410c)` }}
                            />

                            {/* Horizontal Content Layout */}
                            <div className="relative p-6 flex flex-row items-center justify-between z-10 h-32 sm:h-36">

                                {/* Left: Info */}
                                <div className="flex flex-col items-start justify-center h-full text-left pl-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-orange-400'} animate-pulse shadow-[0_0_8px_currentColor]`}></div>
                                        <span className="text-[10px] font-black text-white/60">
                                            {isFailed ? "Oh no!" : isCompleted ? "Allowance collected!" : "Today's allowance"}
                                        </span>
                                    </div>

                                    <h2 className="font-display text-xl sm:text-3xl font-black text-white drop-shadow-lg mb-1 group-hover:text-orange-400 transition-colors duration-300 truncate max-w-[200px] sm:max-w-xs">
                                        Today's Run
                                    </h2>

                                    <div className="text-[10px] font-bold text-orange-400 opacity-80 group-hover:translate-x-2 transition-transform duration-300 flex items-center gap-2">
                                        {isFailed ? (
                                            <span className="text-red-400 flex items-center gap-1"><ICONS.Remove/> Out of lives</span>
                                        ) : isCompleted ? (
                                            <span className="text-green-400 flex items-center gap-1"><ICONS.Check/> Coins earned!</span>
                                        ) : (
                                            <>
                                                <span>Level {currentLevel + 1}</span>
                                                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                                <span>{lives} Lives</span>
                                                <ICONS.Right />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Action Icon */}
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 mr-2">
                                    {(!isFailed && !isCompleted) ? (
                                        <>
                                            <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 scale-75 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                                            <div className="absolute inset-0 rounded-full border border-orange-500/20 scale-50 group-hover:scale-125 opacity-0 group-hover:opacity-50 transition-all duration-700 delay-75 ease-out" />
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-orange-500/40 shadow-lg group-hover:bg-orange-500/30 group-hover:scale-110 transition-all duration-300 group-active:scale-95">
                                                <div className="text-orange-100 scale-125 ml-1 drop-shadow-md group-hover:text-white transition-colors"><ICONS.Play /></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border border-white/10 shadow-lg ${isFailed ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                                            <div className="scale-150">
                                                {isFailed ? <ICONS.Remove /> : <ICONS.Check />}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </button>
                    </div>

                    {/* Today's Top Players */}
                    {leaders.length > 0 && (
                        <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-px bg-white/5 flex-grow"></div>
                                <span className="text-[10px] font-black text-white/30">Today's Top Earners</span>
                                <div className="h-px bg-white/5 flex-grow"></div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 divide-y divide-white/5 overflow-hidden">
                                {leaders.slice(0, 5).map((p, i) => (
                                    <div key={p.id || i} className="flex items-center gap-3 px-4 py-2.5">
                                        <span className={`font-display w-5 text-center text-sm font-bold ${i === 0 ? 'text-amber-300' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-white/40'}`}>{i + 1}</span>
                                        {p.photoURL
                                            ? <img src={p.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                                            : <div className="w-7 h-7 rounded-full bg-white/10" />}
                                        <span className="flex-grow truncate text-sm font-semibold text-white/85">{p.name}</span>
                                        <span className="font-display text-sm font-bold text-amber-200"><CoinAmount n={Number(p.score) || 0} /></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mission Trajectory Grid */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px bg-white/5 flex-grow"></div>
                            <span className="text-[10px] font-black text-white/30">Level Map</span>
                            <div className="h-px bg-white/5 flex-grow"></div>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 place-items-center px-2">
                            {Array.from({ length: 20 }).map((_, idx) => {
                                const levelNum = idx + 1;
                                const isDone = idx < currentLevel;
                                const isActive = idx === currentLevel && !isCompleted && !isFailed;
                                const isFailureSpot = idx === currentLevel && isFailed;
                                const isLocked = idx > currentLevel;

                                return (
                                    <div 
                                        key={idx} 
                                        className={`
                                            relative w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500
                                            ${isActive 
                                                ? 'current-level-node bg-white text-[var(--accent-orange)] shadow-[0_0_15px_rgba(251,146,60,0.5)] scale-110 z-10 border-white font-black' 
                                                : ''}
                                            ${isFailureSpot 
                                                ? 'current-level-node bg-red-500/20 text-red-500 border-red-500/50 grayscale-[0.2]' 
                                                : ''}
                                            ${isDone 
                                                ? 'bg-[var(--accent-orange)]/20 backdrop-blur-sm text-[var(--accent-orange)] border-[var(--accent-orange)]/30' 
                                                : ''}
                                            ${isLocked
                                                ? 'bg-black/20 backdrop-blur-sm text-white/25 border-white/5'
                                                : ''}
                                        `}
                                    >
                                        {/* Glow Effect for Active */}
                                        {isActive && <div className="absolute inset-0 rounded-xl bg-white opacity-40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }}></div>}
                                        
                                        {/* Status Icon or Number */}
                                        {isDone ? (
                                            <div className="scale-90"><ICONS.Check /></div>
                                        ) : isFailureSpot ? (
                                            <div className="scale-90"><ICONS.Remove /></div>
                                        ) : (
                                            <span className={`font-display text-sm font-black ${isActive ? 'scale-110' : ''}`}>
                                                {levelNum}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer for Failed/Completed */}
                    {(isCompleted || isFailed) && (
                        <div className="text-center pb-8 pt-8 animate-in fade-in slide-in-from-bottom-4">
                            <button onClick={onExit} className="modern-button w-full py-4 text-xs font-black bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md">
                                Back to Menu
                            </button>
                        </div>
                    )}
                  </div>

                  {/* Desktop-only side rail: reinforces the saving habit */}
                  <aside className="hidden lg:flex lg:flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Saving streak */}
                    <div className="rounded-2xl border border-orange-400/25 bg-orange-500/[0.07] p-5 text-center">
                        <div className="text-3xl mb-1" role="img" aria-hidden="true">🔥</div>
                        <p className="font-display text-4xl font-black text-orange-300 leading-none">{streak}</p>
                        <p className="text-[11px] font-bold text-orange-200/70 mt-1 uppercase tracking-wide">day saving streak</p>
                        <p className="text-[11px] text-white/40 mt-2 leading-relaxed">
                            {streak > 0 ? 'Come back tomorrow to keep it going!' : 'Finish today to start your streak!'}
                        </p>
                    </div>

                    {/* Interest reminder — ties the streak to growing money */}
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg" role="img" aria-hidden="true">🌱</span>
                            <p className="font-display text-sm font-bold text-emerald-200">Your money grows</p>
                        </div>
                        <p className="text-[11px] text-white/55 leading-relaxed">
                            Saved coins earn <span className="font-bold text-emerald-300">{interestRateLabel(streak)}/day</span> in interest.
                            A longer streak means a higher rate!
                        </p>
                    </div>

                    {/* How it works */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="font-display text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">How allowance works</p>
                        <ol className="space-y-2.5">
                            {[
                                { n: '1', t: 'Play the daily run', d: 'Earn coins each day.' },
                                { n: '2', t: 'Keep your coins', d: 'Save instead of spending.' },
                                { n: '3', t: 'Watch them grow', d: 'Interest adds up overnight.' },
                            ].map(s => (
                                <li key={s.n} className="flex gap-3">
                                    <span className="font-display shrink-0 w-5 h-5 rounded-full bg-orange-400/20 text-orange-300 text-[10px] font-black flex items-center justify-center">{s.n}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white/80 leading-tight">{s.t}</p>
                                        <p className="text-[10px] text-white/40 leading-tight">{s.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                  </aside>
                </div>
            </div>
        </div>
    );
};

export default DailyChallengeHub;
