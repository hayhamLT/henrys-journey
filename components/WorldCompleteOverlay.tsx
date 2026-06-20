
import React from 'react';
import { World } from '../types';
import { ICONS } from './icons';
import AnimatedNumber from './AnimatedNumber';
import { THEME_PALETTES } from './Models3D';

interface WorldCompleteOverlayProps {
    world: World;
    stats: {
        score: number;
        moves: number;
        time: number;
    };
    onContinue: () => void;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};

const WorldCompleteOverlay: React.FC<WorldCompleteOverlayProps> = ({ world, stats, onContinue }) => {
    const palette = THEME_PALETTES[world.theme] || THEME_PALETTES['day'];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-700">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at center, ${palette.sky[0]}, ${palette.sky[1]})` }} />
            
            <div className="relative z-10 w-full max-w-lg p-6 flex flex-col items-center text-center">
                
                <div className="mb-6 animate-in zoom-in duration-500 delay-100">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.4)] border-4 border-white/20">
                        <div className="scale-[2.5] text-white drop-shadow-md">
                            <ICONS.Trophy />
                        </div>
                    </div>
                </div>

                <h2 className="text-4xl font-black text-white font-display mb-2 drop-shadow-lg animate-in slide-in-from-bottom-4 duration-500 delay-200">
                    World Complete!
                </h2>
                <p className="text-lg font-bold text-white/60 mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    {world.name}
                </p>

                <div className="w-full grid grid-cols-3 gap-4 mb-10 animate-in slide-in-from-bottom-8 duration-500 delay-500">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                        <div className="text-[var(--accent-yellow)] mb-2 flex justify-center"><ICONS.Score /></div>
                        <div className="text-2xl font-black text-white font-display"><AnimatedNumber value={stats.score} /></div>
                        <div className="text-[10px] font-bold text-white/40">Coins</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                        <div className="text-teal-400 mb-2 flex justify-center"><ICONS.Moves /></div>
                        <div className="text-2xl font-black text-white font-display"><AnimatedNumber value={stats.moves} /></div>
                        <div className="text-[10px] font-bold text-white/40">Moves</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                        <div className="text-[var(--accent-green)] mb-2 flex justify-center"><ICONS.Time /></div>
                        <div className="text-lg font-black text-white leading-loose font-display">{formatTime(stats.time)}</div>
                        <div className="text-[10px] font-bold text-white/40">Total Time</div>
                    </div>
                </div>

                <button 
                    onClick={onContinue}
                    className="modern-button w-full py-5 text-lg bg-white text-black hover:bg-white/90 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-in slide-in-from-bottom-8 duration-500 delay-700"
                >
                    Continue Journey
                </button>
            </div>
        </div>
    );
};

export default WorldCompleteOverlay;
