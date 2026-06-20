
import React, { useEffect, useState } from 'react';
import { getCommunityLevels } from '../firebase';
import { CommunityLevel } from '../types';
import { ICONS } from './icons';
import LoginRequiredPanel from './LoginRequiredPanel';

interface CommunityTabProps {
    onPlayLevel: (levelData: any) => void;
    isGuest?: boolean;
    onLogin?: () => Promise<void>;
    likedLevels?: string[];
    onToggleLike?: (levelId: string, isLiking: boolean) => void;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ onPlayLevel, isGuest, onLogin, likedLevels = [], onToggleLike }) => {
    const [levels, setLevels] = useState<CommunityLevel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLevels = async () => {
        setLoading(true);
        const data = await getCommunityLevels();
        setLevels(data);
        setLoading(false);
    };

    useEffect(() => {
        if (!isGuest) {
            fetchLevels();
        }
    }, [isGuest]);

    const handleLikeClick = (e: React.MouseEvent, levelId: string) => {
        e.stopPropagation();
        if (onToggleLike) {
            const isLiking = !likedLevels.includes(levelId);
            onToggleLike(levelId, isLiking);
            
            // Optimistic UI update
            setLevels(prev => prev.map(lvl => {
                if (lvl.id === levelId) {
                    return { ...lvl, likes: Math.max(0, lvl.likes + (isLiking ? 1 : -1)) };
                }
                return lvl;
            }));
        }
    };

    if (isGuest && onLogin) {
        return (
            <LoginRequiredPanel 
                featureName="Community Levels"
                description="Sign in to play, create, and share custom levels with the world."
                onLogin={onLogin}
                variant="dark"
            />
        );
    }

    return (
        <div className="p-1 space-y-3 h-full flex flex-col">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--accent-magenta)] scale-125"><ICONS.Community /></div>
                    <div>
                        <h3 className="text-lg font-black font-display text-white">Community</h3>
                        <p className="text-xs text-white/50">Explore user-created challenges</p>
                    </div>
                </div>
                <button onClick={fetchLevels} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors" title="Refresh">
                    <div className="scale-75"><ICONS.FastForward /></div>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-white/30">
                        <div className="w-6 h-6 border-2 border-[var(--accent-magenta)] border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-bold">Loading levels...</span>
                    </div>
                ) : levels.length === 0 ? (
                    <div className="text-center p-8 text-white/30 text-sm flex flex-col items-center gap-2">
                        <p>No community levels found.</p>
                        <button onClick={fetchLevels} className="text-[var(--accent-blue)] text-xs font-bold hover:underline">Try Refreshing</button>
                    </div>
                ) : (
                    levels.map((level) => {
                        const isLiked = likedLevels.includes(level.id);
                        
                        return (
                            <div key={level.id} className="p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:border-[var(--accent-magenta)]/50 transition-colors group cursor-pointer relative shadow-sm" onClick={() => onPlayLevel(level.data)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-white">{level.name}</h4>
                                        <p className="text-xs text-white/50">by <span className="text-[var(--accent-blue)]">{level.authorName}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => handleLikeClick(e, level.id)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                isLiked 
                                                    ? 'text-red-400 bg-red-500/20' 
                                                    : 'text-white/30 hover:text-red-400 hover:bg-red-500/20'
                                            }`}
                                        >
                                            <div className="scale-75"><ICONS.Star filled={isLiked} /></div> 
                                            <span>{level.likes || 0}</span>
                                        </button>
                                        <div className="bg-white/10 rounded px-2 py-1 text-[10px] font-bold text-white/50 group-hover:bg-[var(--accent-magenta)] group-hover:text-white transition-colors">
                                            PLAY
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 flex gap-3 text-[10px] text-white/30 font-medium">
                                    <span>{level.plays} Plays</span>
                                    <span>&bull;</span>
                                    <span>{new Date(level.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CommunityTab;
