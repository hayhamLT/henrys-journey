
import React, { useState, useEffect } from 'react';
import { ICONS } from './icons';
import { LiveTournament } from '../types';
import LoginModal from './LoginModal';
import { getTournamentPlayerCount } from '../firebase';
import { getMoneyTipOfDay } from '../constants/finlit';

interface TournamentHubProps {
  onJoin: (seed: number, length: number, targetScore?: number) => void;
  onJoinLive: (tournamentId: string, name: string, endTime: number, seed: number, difficulty: 'easy' | 'mixed' | 'hard') => void;
  onExit: () => void;
  isGuest?: boolean;
  onLogin?: () => Promise<void>;
}

const getUpcomingTournaments = (): LiveTournament[] => {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const currentHourStart = Math.floor(now / hourMs) * hourMs;
    const nextHourStart = currentHourStart + hourMs;
    const baseSeed = Math.floor(currentHourStart / 1000);
    
    return [
        {
            id: `hourly-easy-${currentHourStart}`,
            name: "Rookie Arena",
            type: 'Hourly',
            startTime: currentHourStart,
            endTime: nextHourStart,
            length: -1,
            seed: baseSeed + 1,
            playerCount: 0,
            difficulty: 'easy'
        },
        {
            id: `hourly-mixed-${currentHourStart}`,
            name: "Pro Arena",
            type: 'Hourly',
            startTime: currentHourStart,
            endTime: nextHourStart,
            length: -1,
            seed: baseSeed + 2,
            playerCount: 0,
            difficulty: 'mixed'
        },
        {
            id: `hourly-hard-${currentHourStart}`,
            name: "Elite Arena",
            type: 'Hourly',
            startTime: currentHourStart,
            endTime: nextHourStart,
            length: -1,
            seed: baseSeed + 3,
            playerCount: 0,
            difficulty: 'hard'
        }
    ];
};

const TournamentCard: React.FC<{ t: LiveTournament, onClick: () => void, isJoining: boolean, isGuest?: boolean }> = ({ t, onClick, isJoining, isGuest }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [playerCount, setPlayerCount] = useState<number | null>(null);

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            if (t.endTime && now >= t.startTime && now < t.endTime) {
                const diff = t.endTime - now;
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
                setIsLive(true);
            } else {
                setTimeLeft("Soon");
                setIsLive(false);
            }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [t.startTime, t.endTime]);

    useEffect(() => {
        if (isLive && t.type === 'Hourly') {
            const fetchCount = async () => {
                const realCount = await getTournamentPlayerCount(t.id);
                setPlayerCount(realCount);
            };
            fetchCount();
            const interval = setInterval(fetchCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isLive, t.id, t.type]);

    // Dark Theme Colors
    // Difficulty is shown as a cool PRESTIGE ramp (sky → indigo → violet), not a
    // green=good / red=danger scale — those hues are reserved for in-game role-colors.
    let accentColor = 'text-indigo-300';
    let borderColor = 'border-indigo-500/30';
    let badgeColor = 'bg-indigo-500/20 text-indigo-200';
    let hoverColor = 'group-hover:border-indigo-400/50';
    let iconBg = 'bg-indigo-500/10 border-indigo-500/20';
    let label = 'Standard';

    if (t.difficulty === 'easy') {
        accentColor = 'text-sky-300';
        borderColor = 'border-sky-500/30';
        badgeColor = 'bg-sky-500/20 text-sky-200';
        hoverColor = 'group-hover:border-sky-400/50';
        iconBg = 'bg-sky-500/10 border-sky-500/20';
        label = 'Rookie';
    } else if (t.difficulty === 'hard') {
        accentColor = 'text-violet-300';
        borderColor = 'border-violet-500/30';
        badgeColor = 'bg-violet-500/20 text-violet-200';
        hoverColor = 'group-hover:border-violet-400/50';
        iconBg = 'bg-violet-500/10 border-violet-500/20';
        label = 'Elite';
    } else {
        label = 'Pro';
    }

    return (
        <button 
            onClick={!isJoining ? onClick : undefined}
            disabled={isJoining}
            className={`w-full bg-black/40 backdrop-blur-md rounded-xl border p-4 flex items-center gap-4 relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] group text-left ${borderColor} ${hoverColor}`}
        >
            {/* Live Indicator */}
            {isLive && (
                <div className="absolute top-0 right-0 bg-[var(--accent-red)] text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg animate-pulse shadow-sm">
                    Live
                </div>
            )}

            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105 ${iconBg}`}>
                <div className={`scale-125 ${accentColor}`}><ICONS.Trophy /></div>
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-black font-display text-lg text-white leading-none">{t.name}</h3>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${badgeColor}`}>{label}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/50">
                    <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">
                        <span className={`${isLive && parseInt(timeLeft.split(':')[1]) < 30 ? 'text-red-400 animate-pulse' : 'text-white/40'}`}><ICONS.Time /></span> 
                        <span className="font-mono text-white/80">{timeLeft}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">
                        <ICONS.User /> <span className="text-white/80">{playerCount !== null ? playerCount : '-'}</span>
                    </span>
                </div>
            </div>

            <div className="shrink-0 text-white/20 group-hover:text-[var(--accent-blue)] transition-colors transform group-hover:translate-x-1 pl-2">
                {isJoining ? (
                    <div className="w-5 h-5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                ) : isGuest ? (
                    <ICONS.Lock />
                ) : (
                    <div className="scale-125"><ICONS.Right /></div>
                )}
            </div>
        </button>
    );
};

const TournamentHub: React.FC<TournamentHubProps> = ({ onJoin, onJoinLive, onExit, isGuest, onLogin }) => {
    const [tournaments, setTournaments] = useState<LiveTournament[]>([]);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        setTournaments(getUpcomingTournaments());
    }, []);

    const handleJoinClick = (t: LiveTournament) => {
        if (joiningId) return;
        if (isGuest) {
            setShowLoginModal(true);
            return;
        }
        
        setJoiningId(t.id);
        setTimeout(() => {
            if (t.type === 'Hourly' && t.endTime) {
                onJoinLive(t.id, t.name, t.endTime, t.seed, t.difficulty);
            } else {
                onJoin(t.seed, t.length, t.targetScore);
            }
        }, 500);
    };

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 shadow-sm shrink-0 z-10 flex items-center">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--accent-blue)] scale-125"><ICONS.Trophy /></div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black font-display text-white">Earnings Arena</h2>
                        <p className="text-xs text-white/50 font-medium">Compete to earn the most coins</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto no-scrollbar p-4 sm:p-8 relative">
                <div className="max-w-xl lg:max-w-4xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
                  <div className="space-y-3 lg:min-w-0">
                    {tournaments.map(t => (
                        <TournamentCard
                            key={t.id}
                            t={t}
                            isJoining={joiningId === t.id}
                            isGuest={isGuest}
                            onClick={() => handleJoinClick(t)}
                        />
                    ))}

                    <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 text-center relative overflow-hidden group backdrop-blur-md">
                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                        <p className="text-[10px] text-indigo-300 font-bold mb-2 relative z-10">Coming Soon</p>
                        <h3 className="text-white font-black font-display text-lg mb-1 relative z-10">Weekly Marathon</h3>
                        <p className="text-[10px] text-indigo-300 relative z-10">100 Levels. One Chance. Global Glory.</p>
                    </div>
                  </div>

                  {/* Desktop-only side rail */}
                  <aside className="hidden lg:flex lg:flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg" role="img" aria-hidden="true">🏆</span>
                            <p className="font-display text-sm font-bold text-amber-200">How earning works</p>
                        </div>
                        <ol className="space-y-2.5">
                            {[
                                { n: '1', t: 'Pick an arena', d: 'Rookie, Pro, or Elite.' },
                                { n: '2', t: 'Earn fast', d: 'Collect the most coins before time runs out.' },
                                { n: '3', t: 'Climb the ranks', d: 'Top earners lead the board.' },
                            ].map(s => (
                                <li key={s.n} className="flex gap-3">
                                    <span className="font-display shrink-0 w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center">{s.n}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white/80 leading-tight">{s.t}</p>
                                        <p className="text-[10px] text-white/40 leading-tight">{s.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg" role="img" aria-hidden="true">💡</span>
                            <p className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/60">Money Tip</p>
                        </div>
                        <p className="text-[11px] text-white/55 leading-relaxed">{getMoneyTipOfDay()}</p>
                    </div>
                  </aside>
                </div>
            </div>

            {showLoginModal && onLogin && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                    onLogin={async () => {
                        try {
                            await onLogin();
                            setShowLoginModal(false);
                        } catch(e) {
                            console.error(e);
                        }
                    }}
                    featureName="Arena Access"
                    description="Sign in to compete in live earning events and track your rank against real players."
                />
            )}
        </div>
    );
};

export default TournamentHub;
