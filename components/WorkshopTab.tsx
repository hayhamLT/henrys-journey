
import React from 'react';
import { CustomLevelEntry } from '../types';
import { ICONS } from './icons';

interface WorkshopTabProps {
    customLevels: CustomLevelEntry[];
    onPlayLevel?: (level: CustomLevelEntry) => void;
    onShareLevel?: (level: CustomLevelEntry) => void;
    onDeleteLevel?: (index: number) => void;
    onEnterBuilder?: () => void;
}

const WorkshopTab: React.FC<WorkshopTabProps> = ({ customLevels, onPlayLevel, onShareLevel, onDeleteLevel, onEnterBuilder }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1 border-b border-white/10 pb-2">
                <h3 className="text-xs font-black text-white/40">My Levels</h3>
                <span className="text-[9px] font-bold text-white/30">{customLevels.length} saved</span>
            </div>
            
            {customLevels.length === 0 ? (
                <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center text-white/20 gap-3 min-h-[200px]">
                    <div className="scale-150 opacity-50"><ICONS.Builder /></div>
                    <div>
                        <p className="text-xs font-bold mb-1">No Custom Levels</p>
                        <p className="text-[10px] mb-4">Use the Builder to create your own.</p>
                        {onEnterBuilder && (
                            <button 
                                onClick={onEnterBuilder}
                                className="px-4 py-2 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] rounded-xl text-[10px] font-bold hover:bg-[var(--accent-blue)]/20 transition-colors"
                            >
                                Open Builder
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {customLevels.map((level, idx) => (
                        <div key={level.id} className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center justify-between group hover:bg-black/60 transition-colors">
                            <div className="min-w-0 pr-2">
                                <div className="text-sm font-bold text-white truncate">{level.name}</div>
                                <div className="text-[9px] text-white/30 font-mono">{new Date(level.timestamp).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {onPlayLevel && (
                                    <button 
                                        onClick={() => onPlayLevel(level)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--accent-green)]/10 text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-black transition-all"
                                        title="Play"
                                    >
                                        <ICONS.Play />
                                    </button>
                                )}
                                {onShareLevel && (
                                    <button 
                                        onClick={() => onShareLevel(level)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                        title="Share"
                                    >
                                        <ICONS.Share />
                                    </button>
                                )}
                                {onDeleteLevel && (
                                    <button 
                                        onClick={() => onDeleteLevel(10000 + idx)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                        title="Delete"
                                    >
                                        <ICONS.Trash />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkshopTab;
