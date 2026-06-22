
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, Badge, LevelResult, CustomLevelEntry } from '../types';
import { ICONS } from './icons';
import LoginRequiredPanel from './LoginRequiredPanel';
import { CoinAmount } from './CoinIcon';

// --- MILESTONES DATA ---
const MILESTONES = [
    // --- Levels (Progression) ---
    { id: 'lvl_1', name: 'Novice', desc: 'Complete 1 Level', threshold: 1, type: 'levels', icon: 'Check', color: 'bg-slate-500', colorDark: 'bg-slate-900', text: 'text-slate-100' },
    { id: 'lvl_5', name: 'Apprentice', desc: 'Complete 5 Levels', threshold: 5, type: 'levels', icon: 'Map', color: 'bg-blue-500', colorDark: 'bg-blue-900', text: 'text-blue-100' },
    { id: 'lvl_10', name: 'Adventurer', desc: 'Complete 10 Levels', threshold: 10, type: 'levels', icon: 'Map', color: 'bg-indigo-500', colorDark: 'bg-indigo-900', text: 'text-indigo-100' },
    { id: 'lvl_20', name: 'Pathfinder', desc: 'Complete 20 Levels', threshold: 20, type: 'levels', icon: 'Map', color: 'bg-cyan-500', colorDark: 'bg-cyan-900', text: 'text-cyan-100' },
    { id: 'lvl_35', name: 'Explorer', desc: 'Complete 35 Levels', threshold: 35, type: 'levels', icon: 'Map', color: 'bg-teal-500', colorDark: 'bg-teal-900', text: 'text-teal-100' },
    { id: 'lvl_50', name: 'Master Mind', desc: 'Complete 50 Levels', threshold: 50, type: 'levels', icon: 'Trophy', color: 'bg-purple-500', colorDark: 'bg-purple-900', text: 'text-purple-100' },
    { id: 'lvl_75', name: 'Veteran', desc: 'Complete 75 Levels', threshold: 75, type: 'levels', icon: 'Trophy', color: 'bg-fuchsia-500', colorDark: 'bg-fuchsia-900', text: 'text-fuchsia-100' },
    { id: 'lvl_100', name: 'Legend', desc: 'Complete 100 Levels', threshold: 100, type: 'levels', icon: 'Crown', color: 'bg-amber-500', colorDark: 'bg-amber-900', text: 'text-amber-100' },
    { id: 'lvl_150', name: 'Titan', desc: 'Complete 150 Levels', threshold: 150, type: 'levels', icon: 'Crown', color: 'bg-orange-500', colorDark: 'bg-orange-900', text: 'text-orange-100' },
    { id: 'lvl_200', name: 'Demigod', desc: 'Complete 200 Levels', threshold: 200, type: 'levels', icon: 'Crown', color: 'bg-red-500', colorDark: 'bg-red-900', text: 'text-red-100' },
    
    // --- Score (Cumulative) ---
    { id: 'scr_1k', name: 'Rookie Scorer', desc: 'Earn 1,000 Points', threshold: 1000, type: 'score', icon: 'Star', color: 'bg-yellow-600', colorDark: 'bg-yellow-900', text: 'text-yellow-100' },
    { id: 'scr_5k', name: 'Point Earner', desc: 'Earn 5,000 Points', threshold: 5000, type: 'score', icon: 'Star', color: 'bg-yellow-500', colorDark: 'bg-yellow-900', text: 'text-yellow-100' },
    { id: 'scr_10k', name: 'Score Hunter', desc: 'Earn 10,000 Points', threshold: 10000, type: 'score', icon: 'Star', color: 'bg-yellow-400', colorDark: 'bg-yellow-800', text: 'text-yellow-100' },
    { id: 'scr_25k', name: 'Big Spender', desc: 'Earn 25,000 Points', threshold: 25000, type: 'score', icon: 'Star', color: 'bg-orange-400', colorDark: 'bg-orange-800', text: 'text-orange-100' },
    { id: 'scr_50k', name: 'High Roller', desc: 'Earn 50,000 Points', threshold: 50000, type: 'score', icon: 'Star', color: 'bg-orange-500', colorDark: 'bg-orange-900', text: 'text-orange-100' },
    { id: 'scr_100k', name: 'Tycoon', desc: 'Earn 100,000 Points', threshold: 100000, type: 'score', icon: 'Star', color: 'bg-red-500', colorDark: 'bg-red-900', text: 'text-red-100' },
    { id: 'scr_250k', name: 'Magnate', desc: 'Earn 250,000 Points', threshold: 250000, type: 'score', icon: 'Star', color: 'bg-red-600', colorDark: 'bg-red-950', text: 'text-red-100' },

    // --- Gems (Collection - Calculated) ---
    { id: 'gem_50', name: 'Collector', desc: 'Collect 50 Coins', threshold: 50, type: 'gems', icon: 'Gem', color: 'bg-emerald-500', colorDark: 'bg-emerald-900', text: 'text-emerald-100' },
    { id: 'gem_200', name: 'Jeweler', desc: 'Collect 200 Coins', threshold: 200, type: 'gems', icon: 'Gem', color: 'bg-teal-500', colorDark: 'bg-teal-900', text: 'text-teal-100' },
    { id: 'gem_500', name: 'Treasure Hunter', desc: 'Collect 500 Coins', threshold: 500, type: 'gems', icon: 'Gem', color: 'bg-green-600', colorDark: 'bg-green-900', text: 'text-green-100' },

    // --- Perfect Runs (Efficiency - Calculated) ---
    { id: 'prf_5', name: 'Planner', desc: '5 Perfect Runs', threshold: 5, type: 'perfect', icon: 'Vision', color: 'bg-pink-400', colorDark: 'bg-pink-800', text: 'text-pink-100' },
    { id: 'prf_20', name: 'Tactician', desc: '20 Perfect Runs', threshold: 20, type: 'perfect', icon: 'Vision', color: 'bg-pink-500', colorDark: 'bg-pink-900', text: 'text-pink-100' },
    { id: 'prf_50', name: 'Strategist', desc: '50 Perfect Runs', threshold: 50, type: 'perfect', icon: 'Vision', color: 'bg-rose-500', colorDark: 'bg-rose-900', text: 'text-rose-100' },
    // --- Streak Achievements ---
    { id: 'strk_5', name: 'Hot Streak', desc: 'Win 5 levels in a row', threshold: 5, type: 'streak', icon: 'Fire', color: 'bg-orange-500', colorDark: 'bg-orange-900', text: 'text-orange-100' },
    { id: 'strk_10', name: 'Unstoppable', desc: 'Win 10 levels in a row', threshold: 10, type: 'streak', icon: 'Fire', color: 'bg-red-500', colorDark: 'bg-red-900', text: 'text-red-100' },
];

interface ProfileTabProps {
    user: UserProfile | null;
    isGuest?: boolean;
    totalScore: number;
    completedLevels: number;
    onUpdateName?: (name: string) => void;
    onUpdatePhoto?: (photo: string) => void;
    onLogout?: () => void;
    onLogin?: () => Promise<void>;
    onDeleteAccount?: () => void;
    resultsByLevel?: { [level: number]: LevelResult };
}

const StatCard: React.FC<{ label: string, value: React.ReactNode, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between h-full group hover:bg-black/50 transition-colors shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold tracking-wide text-white/40`}>{label}</span>
            <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity scale-90 bg-white/5 p-1.5 rounded-lg`}>{icon}</div>
        </div>
        <div className="text-2xl font-black text-white font-display">{value}</div>
    </div>
);

const TrophyItem: React.FC<{ name: string, desc: string, icon: keyof typeof ICONS, colorClass: string, locked?: boolean, date?: string, threshold?: number, progress?: number }> = ({ name, desc, icon, colorClass, locked, date, threshold, progress }) => {
    const Icon = ICONS[icon] || ICONS.Trophy;
    return (
        <div className={`aspect-square rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden transition-all group border
            ${locked ? 'bg-white/5 border-white/5 opacity-40 grayscale' : `bg-gradient-to-br ${colorClass} border-transparent shadow-lg hover:scale-[1.03] hover:shadow-xl`}
        `}>
            {/* Background Pattern */}
            {!locked && <div className="absolute -right-4 -bottom-4 text-white opacity-10 scale-[2.5] rotate-12"><Icon /></div>}
            
            <div className={`self-start ${locked ? 'text-white/20' : 'text-white'}`}>
                <div className="scale-110"><Icon /></div>
            </div>
            
            <div>
                <div className={`text-[9px] font-black leading-tight ${locked ? 'text-white/30' : 'text-white'}`}>
                    {locked ? 'Locked' : name}
                </div>
                {!locked && date && <div className="text-[8px] opacity-70 mt-0.5 font-mono">{date}</div>}
                {locked && typeof threshold === 'number' && typeof progress === 'number' && (
                    <>
                        <div className="mt-1 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: `${Math.min(100, Math.round((progress / threshold) * 100))}%` }} />
                        </div>
                        <div className="text-[8px] text-white/30 mt-0.5 font-mono">{progress}/{threshold}</div>
                    </>
                )}
            </div>
        </div>
    );
};

const ProfileTab: React.FC<ProfileTabProps> = ({ user, isGuest, totalScore, completedLevels, onUpdateName, onUpdatePhoto, onLogout, onLogin, onDeleteAccount, resultsByLevel = {} }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) setNewName(user.name);
    }, [user]);

    // Calculate Detailed Stats
    const { totalGems, perfectLevels } = useMemo(() => {
        let gems = 0;
        let perfect = 0;
        
        Object.values(resultsByLevel).forEach((res) => {
            const result = res as LevelResult;
            if (result.scoreBreakdown) {
                // Gem Score is gem_value * count. gem_value is 20.
                gems += Math.floor((result.scoreBreakdown.gemScore || 0) / 20);
                
                // If moveBonus > 0, it means the player beat or met PAR
                if ((result.scoreBreakdown.moveBonus || 0) > 0) {
                    perfect++;
                }
            }
        });
        
        return { totalGems: gems, perfectLevels: perfect };
    }, [resultsByLevel]);

    // Compute Milestones & Badges
    const { unlockedMilestones, lockedMilestones, userBadges } = useMemo(() => {
        const unlocked: any[] = [];
        const locked: any[] = [];
        
        MILESTONES.forEach(m => {
            let val = 0;
            if (m.type === 'score') val = totalScore;
            else if (m.type === 'levels') val = completedLevels;
            else if (m.type === 'gems') val = totalGems;
            else if (m.type === 'perfect') val = perfectLevels;
            else if (m.type === 'streak') val = (user as any)?.currentStreak || 0;

            const isUnlocked = val >= m.threshold;
            const item = { ...m, isSystem: true, locked: !isUnlocked, date: isUnlocked ? 'Unlocked' : undefined };
            if (isUnlocked) unlocked.push(item);
            else locked.push(item);
        });

        // Sort unlocked milestones by difficulty (threshold) descending
        unlocked.sort((a, b) => b.threshold - a.threshold);

        const badges = (user?.badges || []).map(b => ({
            id: b.id,
            name: b.name,
            desc: b.description,
            icon: b.icon as keyof typeof ICONS,
            colorClass: b.rarity === 'legendary' ? 'from-amber-600 to-amber-800' : 
                        b.rarity === 'epic' ? 'from-purple-600 to-purple-800' :
                        b.rarity === 'rare' ? 'from-cyan-600 to-cyan-800' : 'from-slate-600 to-slate-800',
            locked: false,
            date: new Date(b.timestamp).toLocaleDateString(),
            isSystem: false
        }));

        return { unlockedMilestones: unlocked, lockedMilestones: locked, userBadges: badges };
    }, [totalScore, completedLevels, totalGems, perfectLevels, user?.badges]);

    // Determine Best "Showcase" Item
    const showcaseItem = useMemo(() => {
        if (userBadges.length > 0) return userBadges[0]; // Use most recent badge
        if (unlockedMilestones.length > 0) return unlockedMilestones[0]; // Best system milestone
        return null;
    }, [unlockedMilestones, userBadges]);

    if (!user || (isGuest && onLogin)) {
        return (
            <LoginRequiredPanel
                featureName="Explorer Profile"
                description="Sign in to view your career stats, save your progress to the cloud, and earn trophies."
                onLogin={onLogin || (async () => {})}
                variant="dark"
            />
        );
    }

    const handleSave = () => {
        if (newName.trim() && onUpdateName) {
            onUpdateName(newName.trim());
            setIsEditing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 256; 
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
                else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    if(onUpdatePhoto) onUpdatePhoto(canvas.toDataURL('image/jpeg', 0.8));
                    setUploading(false);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Construct rank
    const rankTitle = totalScore > 100000 ? "Grandmaster" : totalScore > 25000 ? "Commander" : totalScore > 5000 ? "Explorer" : "Cadet";

    return (
        <div className="flex flex-col space-y-6">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* IDENTITY CARD */}
            <div className="bg-black/30 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-lg relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[var(--accent-blue)]/10 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-5 relative z-10">
                    {/* Avatar */}
                    <div className="relative group cursor-pointer shrink-0" onClick={() => !uploading && fileInputRef.current?.click()}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                            {uploading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/></div>
                            ) : (
                                <img src={user.picture || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Avatar" />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ICONS.Upload />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                        {isEditing ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        maxLength={20}
                                        className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-sm text-white font-bold tracking-wide w-full"
                                    />
                                    <button onClick={handleSave} className="bg-[var(--accent-green)] text-black p-1.5 rounded-lg"><ICONS.Check /></button>
                                    <button onClick={() => { setIsEditing(false); setNewName(user.name); }} className="bg-white/10 text-white p-1.5 rounded-lg"><ICONS.Remove /></button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide truncate">{user.name}</h1>
                                <div className="text-white/20 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100"><div className="scale-75">✎</div></div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-[9px] font-black px-2 py-0.5 rounded tracking-wide border border-[var(--accent-blue)]/30">
                                {rankTitle}
                            </span>
                            <span className="text-[10px] font-mono text-white/30 tracking-wide">
                                ID: {user.uid ? user.uid.slice(0, 6) : 'GUEST'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Coins" value={<CoinAmount n={totalScore} />} icon={<ICONS.Score />} color="text-yellow-400" />
                <StatCard label="Levels Done" value={completedLevels} icon={<ICONS.Check />} color="text-green-400" />
                <StatCard label="Coins Collected" value={totalGems} icon={<ICONS.Gem />} color="text-emerald-400" />
                <StatCard label="Perfect Runs" value={perfectLevels} icon={<ICONS.Vision />} color="text-pink-400" />
            </div>

            {/* SHOWCASE & AWARDS */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-1 border-b border-white/10 pb-2">
                    <h3 className="text-xs font-black text-white/40 tracking-wide">Awards Case</h3>
                    <span className="text-[9px] font-bold text-white/30">{unlockedMilestones.length + userBadges.length} Unlocked</span>
                </div>
                
                {/* Highlight Item */}
                {showcaseItem && (
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 border border-white/10 flex items-center gap-4 relative overflow-hidden group shadow-lg">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/5 to-transparent pointer-events-none"/>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${showcaseItem.colorClass || 'from-indigo-500 to-purple-600'} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500 border border-white/10`}>
                            <div className="text-white scale-150">
                                {(() => {
                                    const I = ICONS[showcaseItem.icon as keyof typeof ICONS] || ICONS.Trophy;
                                    return <I />;
                                })()}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] font-bold text-[var(--accent-yellow)] tracking-wide mb-0.5">Showcase</div>
                            <div className="text-base font-black text-white leading-tight">{showcaseItem.name}</div>
                            <div className="text-[10px] text-white/50 mt-0.5">{showcaseItem.desc}</div>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="bg-black/20 backdrop-blur-md rounded-3xl p-4 border border-white/5">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {userBadges.map((badge, i) => (
                            <TrophyItem key={`badge-${i}`} {...badge} />
                        ))}
                        {unlockedMilestones.map((m) => (
                            <TrophyItem 
                                key={m.id} 
                                name={m.name} 
                                desc={m.desc} 
                                icon={m.icon as any} 
                                colorClass={`from-${m.color.replace('bg-', '')} to-${m.colorDark.replace('bg-', '')}`}
                                date={m.date}
                            />
                        ))}
                        {lockedMilestones.slice(0, 10).map((m) => (
                            <TrophyItem 
                                key={m.id}
                                name={m.name}
                                desc={m.desc}
                                icon={m.icon as any}
                                colorClass="bg-white/5"
                                locked
                                threshold={m.threshold}
                                progress={(() => {
                                    if (m.type === 'score') return totalScore;
                                    if (m.type === 'levels') return completedLevels;
                                    if (m.type === 'gems') return totalGems;
                                    if (m.type === 'perfect') return perfectLevels;
                                    if (m.type === 'streak') return (user as any)?.currentStreak || 0;
                                    return 0;
                                })()}
                            />
                        ))}
                    </div>
                    
                    {(unlockedMilestones.length === 0 && userBadges.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-32 text-white/20 gap-2">
                            <ICONS.Trophy />
                            <span className="text-[10px] font-bold tracking-wide">No Awards Yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <button 
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 tracking-wide transition-colors"
                >
                    <ICONS.Exit /> Sign Out
                </button>
                {onDeleteAccount && (
                    <button 
                        onClick={() => { if(confirm("Permanently delete account?")) onDeleteAccount(); }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 tracking-wide transition-colors"
                    >
                        <ICONS.Remove /> Delete Account
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileTab;
