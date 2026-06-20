
import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../firebase';
import { LeaderboardEntry } from '../types';
import { ICONS } from './icons';
import LoginRequiredPanel from './LoginRequiredPanel';
import TournamentLeaderboard from './TournamentLeaderboard';
import { BOTS } from '../constants/bots';
import { CoinAmount } from './CoinIcon';

interface LeaderboardTabProps {
    isGuest?: boolean;
    onLogin?: () => void;
    onJoinTournament?: () => void;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ isGuest, onLogin, onJoinTournament }) => {
    const [activeView, setActiveView] = useState<'global' | 'hourly'>('global');
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only attempt to fetch if NOT guest, to prevent permission denied errors
        if (activeView === 'global' && !isGuest) {
            const fetchLeaders = async () => {
                setLoading(true);
                try {
                    const realUsers = await getLeaderboard();
                    
                    // Convert Bots to Leaderboard Entries
                    const botEntries: LeaderboardEntry[] = BOTS.map((bot, index) => ({
                        id: `bot-global-${bot.name}`,
                        name: bot.name,
                        score: bot.totalScore,
                        photoURL: `https://ui-avatars.com/api/?name=${bot.name}&background=${bot.color.replace('#', '')}&color=fff&size=128`,
                        rank: 0 // Calculated below
                    }));

                    // Merge and Sort
                    const allEntries = [...realUsers, ...botEntries];
                    allEntries.sort((a, b) => b.score - a.score);
                    
                    // Assign Ranks
                    const rankedEntries = allEntries.map((entry, index) => ({
                        ...entry,
                        rank: index + 1
                    }));

                    setLeaders(rankedEntries.slice(0, 50)); // Top 50
                } catch (e) {
                    console.error("Failed to load global leaderboard", e);
                }
                setLoading(false);
            };
            fetchLeaders();
        } else {
            // Either Guest or not viewing global
            setLoading(false);
            if (activeView === 'global' && isGuest) {
                setLeaders([]);
            }
        }
    }, [activeView, isGuest]);

    const getCurrentHourlyId = () => {
        const now = Date.now();
        const hourMs = 60 * 60 * 1000;
        const currentHourStart = Math.floor(now / hourMs) * hourMs;
        return `hourly-${currentHourStart}`;
    };

    return (
        <div className="h-full flex flex-col p-1 gap-3">
            {/* Header Section */}
            <div className="shrink-0 space-y-3">
                <div className="modern-panel p-4 bg-gradient-to-br from-[var(--panel-bg)] to-[var(--panel-bg-dark)]">
                    <div className="flex items-center gap-3">
                        <div className="text-[var(--accent-yellow)] scale-125"><ICONS.Trophy /></div>
                        <div>
                            <h3 className="text-lg font-black font-display text-white">Rankings</h3>
                            <p className="text-xs text-[var(--text-dark)]">Leaderboards & Live Events</p>
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex bg-black/30 backdrop-blur-sm p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => setActiveView('global')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeView === 'global' ? 'bg-[var(--accent-blue)] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        All Time
                    </button>
                    <button 
                        onClick={() => setActiveView('hourly')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeView === 'hourly' ? 'bg-[var(--accent-red)] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <span>Hourly Arena</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${activeView === 'hourly' ? 'bg-white' : 'bg-red-500'} animate-pulse shadow-[0_0_5px_red]`}></div>
                    </button>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-grow overflow-hidden relative rounded-xl border border-white/5 bg-[var(--panel-bg-dark)] backdrop-blur-md">
                {activeView === 'global' ? (
                    <div className="absolute inset-0 overflow-y-auto no-scrollbar space-y-2 p-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-dark)]">
                                <div className="w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-xs font-bold">Loading...</span>
                            </div>
                        ) : isGuest ? (
                             <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                                <div className="text-[var(--accent-blue)] scale-150 opacity-50"><ICONS.Lock /></div>
                                <p className="text-sm text-[var(--text-dark)]">Sign in to view global rankings and see where you stand among the best players.</p>
                                {onLogin && (
                                    <button onClick={onLogin} className="modern-button px-6 py-2 text-xs font-bold">Login</button>
                                )}
                             </div>
                        ) : leaders.length === 0 ? (
                            <div className="text-center p-8 text-[var(--text-dark)] text-sm">
                                No records found yet. Be the first!
                            </div>
                        ) : (
                            leaders.map((entry) => (
                                <div 
                                    key={entry.id} 
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-white/5
                                        ${entry.rank === 1 ? 'bg-[var(--accent-yellow)]/10 border-[var(--accent-yellow)]/30' : 
                                          entry.rank === 2 ? 'bg-gray-300/10 border-gray-300/30' : 
                                          entry.rank === 3 ? 'bg-amber-700/10 border-amber-700/30' : 'bg-black/20 border-white/5'}
                                    `}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-lg
                                        ${entry.rank === 1 ? 'text-[var(--accent-yellow)] drop-shadow-md' : 
                                          entry.rank === 2 ? 'text-gray-300' : 
                                          entry.rank === 3 ? 'text-amber-600' : 'text-[var(--text-dark)]'}
                                    `}>
                                        #{entry.rank}
                                    </div>
                                    
                                    <div className="relative">
                                        <img 
                                            src={entry.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} 
                                            alt={entry.name}
                                            className="w-10 h-10 rounded-full border border-white/10 bg-black/50 object-cover"
                                        />
                                        {entry.rank <= 3 && (
                                            <div className="absolute -top-1 -right-1 text-[var(--accent-yellow)] bg-black/80 rounded-full p-0.5">
                                                <ICONS.Star filled width="10" height="10" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="font-bold text-sm truncate text-white/90">{entry.name}</div>
                                        <div className="text-[10px] text-[var(--text-dark)] font-bold">Explorer</div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-black text-[var(--text-color)]"><CoinAmount n={entry.score} /></div>
                                        <div className="text-[10px] text-[var(--text-dark)]">Coins</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="flex-grow relative">
                            <TournamentLeaderboard tournamentId={getCurrentHourlyId()} currentUid={isGuest ? 'guest' : undefined} />
                        </div>
                        {/* Play Now Overlay Button - Only visible if not already joined via main menu */}
                        {!window.location.hash.includes('tournament') && (
                            <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
                                <button 
                                    onClick={onJoinTournament}
                                    className="pointer-events-auto modern-button w-full max-w-sm py-4 bg-[var(--accent-red)] text-white shadow-lg shadow-red-900/50 hover:scale-105 border-none flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <ICONS.Trophy />
                                    <span className="font-black">Join Arena Now</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardTab;
