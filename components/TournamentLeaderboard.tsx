
import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToTournamentLeaderboard, subscribeToTournamentUserScore } from '../firebase';
import { TournamentPlayer } from '../types';
import { ICONS } from './icons';

interface TournamentLeaderboardProps {
    tournamentId: string;
    currentUid?: string;
    compact?: boolean;
    theme?: 'light' | 'dark';
    variant?: 'list' | 'ticker';
}

interface Bot extends TournamentPlayer {
    skill: number; // Score multiplier
    speed: number; // Seconds per level
    seedOffset: number; // For randomness
}

// Name Generation Dictionaries
const ADJECTIVES = ["Cosmic", "Neon", "Hyper", "Solar", "Lunar", "Cyber", "Void", "Techno", "Astro", "Quantum", "Turbo", "Mecha", "Giga", "Star", "Rapid", "Nova", "Flux", "Zero", "Alpha", "Omega", "Sonic", "Dark", "Light", "Ultra", "Iron"];
const NOUNS = ["Pilot", "Scout", "Rider", "Surfer", "Walker", "Runner", "Master", "Ninja", "Core", "Mind", "Bot", "Link", "Wave", "Ray", "Beam", "Ace", "Dash", "Spark", "Glitch", "Vector", "Ghost", "Knight", "Lord", "King", "Queen"];

// Simple hash for deterministic pseudo-randomness
const pseudoRandom = (seed: number) => {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const generateBotIdentity = (seed: number) => {
    const r1 = pseudoRandom(seed);
    const r2 = pseudoRandom(seed + 123);
    const r3 = pseudoRandom(seed + 456);
    
    const adj = ADJECTIVES[Math.floor(r1 * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(r2 * NOUNS.length)];
    const number = Math.floor(r3 * 99);
    
    const name = `${adj}_${noun}${number > 80 ? `_${number}` : ''}`;
    
    // Generate distinct color
    const hue = Math.floor(r1 * 360);
    const sat = 70 + Math.floor(r2 * 30);
    const lit = 50 + Math.floor(r3 * 10);
    const color = `hsl(${hue}, ${sat}%, ${lit}%)`;
    
    return { name, color };
};

const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({ tournamentId, currentUid, compact = false, theme = 'dark', variant = 'list' }) => {
    const [realPlayers, setRealPlayers] = useState<TournamentPlayer[]>([]);
    const [currentUserData, setCurrentUserData] = useState<TournamentPlayer | null>(null);
    const [bots, setBots] = useState<Bot[]>([]);
    const [simulatedBots, setSimulatedBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Extract timestamp from ID "hourly-1234567890" or use pure hash of string
    const tournamentStartTime = useMemo(() => {
        const parts = tournamentId.split('-');
        if (parts.length > 1) {
            // Find the last numeric part which is usually the timestamp
            for (let i = parts.length - 1; i >= 0; i--) {
                const ts = parseInt(parts[i]);
                if (!isNaN(ts) && ts > 1600000000000) return ts; // Basic timestamp validation
            }
        }
        // Fallback hash for non-timestamp IDs
        let hash = 0;
        for (let i = 0; i < tournamentId.length; i++) {
            hash = ((hash << 5) - hash) + tournamentId.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [tournamentId]);

    // 1. Initialize Dynamic Bots
    useEffect(() => {
        const seedBase = tournamentStartTime;
        // Use seedBase to determine bot count (5 to 12 bots)
        const botCount = 5 + Math.floor(pseudoRandom(seedBase) * 8); 
        
        const generatedBots: Bot[] = Array.from({ length: botCount }).map((_, i) => {
            // Unique seed for this bot in this specific tournament
            const botSeed = seedBase + (i * 99997) + (tournamentId.length * 123);
            const identity = generateBotIdentity(botSeed);
            
            // Skill varies slightly per tournament based on seed
            const r1 = pseudoRandom(botSeed + 111);
            const r2 = pseudoRandom(botSeed + 222);
            
            // Difficulty curve: Higher index bots are smarter
            const baseSkill = 0.8 + (i / botCount) * 0.4; 
            const skill = baseSkill + (r1 * 0.2); 
            
            const speed = 30 + (r2 * 25); // 30s to 55s per level average

            return {
                id: `bot-${identity.name}`, 
                name: identity.name,
                score: 0,
                photoURL: `https://ui-avatars.com/api/?name=${identity.name}&background=${identity.color.replace(/[^\w\s]/gi, '').replace('hsl', '')}&color=fff&size=128`,
                skill,
                speed,
                seedOffset: i * 999, 
                timestamp: Date.now()
            };
        });

        setBots(generatedBots);
        setSimulatedBots(generatedBots);
    }, [tournamentStartTime, tournamentId]);

    // 2. Subscribe to Real Tournament Participants (Top 50)
    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToTournamentLeaderboard(tournamentId, (data) => {
            setRealPlayers(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [tournamentId]);

    // 3. Subscribe to Current User's Score (to ensure they see themselves even if not in Top 50)
    useEffect(() => {
        if (!currentUid || !tournamentId || currentUid === 'guest') return;
        
        const unsubscribe = subscribeToTournamentUserScore(tournamentId, currentUid, (data) => {
            if (data) setCurrentUserData(data);
        });
        return () => unsubscribe();
    }, [tournamentId, currentUid]);

    // 4. Live Simulation of Bot Scores (Deterministic Time-Based)
    useEffect(() => {
        const updateBots = () => {
            const now = Date.now();
            // Use local elapsed time if ID is timestamp, else simulated progression
            const isTimestampId = tournamentId.includes('hourly');
            const startTime = isTimestampId ? tournamentStartTime : (now - 1000 * 60 * 30); // Assume started 30 mins ago for non-hourly
            
            const elapsedSeconds = Math.max(0, (now - startTime) / 1000); 

            setSimulatedBots(bots.map(bot => {
                // Determine base levels completed
                const baseLevels = elapsedSeconds / bot.speed;
                
                // Add noise using trig functions for consistent "live" feel
                const progressNoise = Math.sin(elapsedSeconds * 0.05 + bot.seedOffset) * 0.5; 
                
                const effectiveLevels = Math.max(0, baseLevels + progressNoise);
                const scorePerLevel = 350; 
                const scoreNoise = Math.cos(elapsedSeconds * 0.1 + bot.seedOffset) * 50;
                
                let targetScore = Math.floor(effectiveLevels * scorePerLevel * bot.skill + scoreNoise);
                if (targetScore < 0) targetScore = 0;

                return { 
                    ...bot, 
                    score: targetScore,
                    timestamp: now 
                };
            }));
        };

        updateBots();
        const interval = setInterval(updateBots, 2000);
        return () => clearInterval(interval);
    }, [bots, tournamentStartTime, tournamentId]);

    // 5. Merge & Sort Final List
    const sortedPlayers = useMemo(() => {
        const all = [...realPlayers, ...simulatedBots];
        
        // If current user is valid but missing from top 50, inject them
        if (currentUserData && !all.some(p => p.id === currentUserData.id)) {
            all.push(currentUserData);
        }

        // Remove duplicate IDs (real player takes precedence if ID collision, though rare with bot- prefix)
        const unique = Array.from(new Map(all.map(item => [item.id || item.name, item])).values());
        
        unique.sort((a, b) => b.score - a.score);
        
        return unique.map((p, index) => ({
            ...p,
            rank: index + 1
        }));
    }, [realPlayers, simulatedBots, currentUserData]);

    const getPlayerStatus = (player: TournamentPlayer) => {
        // Bots are always Active during the tournament window
        if (player.id?.startsWith('bot-')) return 'active';
        
        // Real players check timestamp (2 mins threshold)
        const now = Date.now();
        if (player.timestamp && (now - player.timestamp) < 2 * 60 * 1000) {
            return 'active';
        }
        return 'idle';
    }

    const isLight = theme === 'light';
    const textColor = isLight ? 'text-slate-700' : 'text-white';
    const subTextColor = isLight ? 'text-slate-400' : 'text-white/50';
    const rowHoverColor = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';
    const borderColor = isLight ? 'border-slate-100' : 'border-white/5';
    const headerBg = isLight ? 'bg-slate-50' : 'bg-black/20';
    const bgClass = compact ? 'bg-transparent' : (isLight ? 'bg-white' : 'bg-[var(--panel-bg-dark)]');

    // --- TICKER MODE ---
    if (variant === 'ticker') {
        const myEntry = sortedPlayers.find(p => p.id === currentUid || (!p.id && p.name === currentUid));
        const leader = sortedPlayers[0];
        const score = myEntry?.score || 0;
        const rank = myEntry?.rank || '-';
        const diff = leader && myEntry ? leader.score - myEntry.score : 0;

        return (
            <div className="w-full max-w-6xl mx-auto mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/50 shadow-lg px-4 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">Rank</span>
                            <span className="text-sm font-black text-slate-800">#{rank}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">Score</span>
                            <span className="text-sm font-black text-[var(--accent-blue)]">{score.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {leader && diff > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Leader</span>
                            <span className="font-bold text-slate-600 hidden sm:inline">{leader.score.toLocaleString()}</span>
                            <span className="font-black text-[var(--accent-red)] bg-red-50 px-1.5 py-0.5 rounded text-[10px]">+{diff.toLocaleString()}</span>
                        </div>
                    )}
                    {leader && diff === 0 && (
                        <div className="text-xs font-black text-[var(--accent-yellow)] bg-yellow-50 px-2 py-1 rounded flex items-center gap-1">
                            <ICONS.Trophy /> Leader
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- LIST MODE ---
    return (
        <div className={`w-full h-full flex flex-col ${bgClass}`}>
            {!compact && (
                <div className={`p-3 border-b ${borderColor} flex justify-between items-center ${headerBg}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${subTextColor}`}>Live Standings</span>
                        <span className="bg-red-500/20 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">Live</span>
                    </div>
                    {loading && <div className="w-3 h-3 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />}
                </div>
            )}
            
            <div className={`flex-grow overflow-y-auto no-scrollbar space-y-1 ${compact ? 'p-0' : 'p-2'}`}>
                {sortedPlayers.length === 0 && !loading && (
                    <div className={`text-center p-8 text-xs ${subTextColor}`}>Waiting for players...</div>
                )}
                {sortedPlayers.map((p, idx) => {
                    const isMe = p.id === currentUid || (!p.id && p.name === currentUid);
                    const status = getPlayerStatus(p);
                    const isBot = p.id?.startsWith('bot-');
                    
                    // Dynamic Row Style
                    let rowStyle = `${compact ? `px-3 py-2 border-b ${borderColor} last:border-0` : 'p-2 rounded-lg border border-transparent'} transition-all duration-500 ${compact ? rowHoverColor : 'bg-transparent'}`;
                    
                    if (isMe) {
                        if (compact) rowStyle += ` ${isLight ? 'bg-blue-50' : 'bg-white/10'}`;
                        else rowStyle += ` bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/30`;
                    } else if (!compact) {
                        rowStyle += ` ${isLight ? 'bg-slate-50' : 'bg-white/5'}`;
                    }

                    return (
                        <div 
                            key={`${p.id || p.name}-${idx}`} 
                            className={`flex items-center ${rowStyle}`}
                        >
                            <div className={`w-6 flex items-center justify-center font-bold text-xs mr-1 ${p.rank !== undefined && p.rank <= 3 ? 'text-[var(--accent-yellow)]' : subTextColor}`}>
                                {p.rank}
                            </div>
                            
                            {!compact && (
                                <div className="relative">
                                    <img 
                                        src={p.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} 
                                        className={`w-8 h-8 rounded-full mr-3 object-cover border ${borderColor} ${isLight ? 'bg-slate-100' : 'bg-black'}`}
                                        alt="avatar"
                                    />
                                    {status === 'active' && (
                                        <div className="absolute -bottom-0.5 right-2.5 w-2.5 h-2.5 bg-[var(--accent-green)] border-2 border-white rounded-full" title="In Game"></div>
                                    )}
                                </div>
                            )}

                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className={`text-xs font-bold truncate max-w-[100px] ${isMe ? 'text-[var(--accent-blue)]' : textColor}`}>
                                        {p.name}
                                    </div>
                                    {isMe && !compact && <span className="text-[8px] bg-[var(--accent-blue)] text-white px-1 rounded font-black">You</span>}
                                </div>
                                {!compact && (
                                    <div className={`text-[10px] ${subTextColor}`}>
                                        {status === 'active' ? (isBot ? 'Playing...' : 'In Game') : 'Offline'}
                                    </div>
                                )}
                            </div>
                            
                            <div className={`font-mono text-xs ${isMe ? (isLight ? 'text-slate-900 font-black' : 'text-white font-bold') : (isLight ? 'text-slate-500' : 'text-white/60')}`}>
                                {p.score.toLocaleString()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TournamentLeaderboard;
