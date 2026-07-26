
import React, { useState, useMemo } from 'react';
import { ICONS } from './icons';
import AnimatedNumber from './AnimatedNumber';

// 1. SETUP SCREEN
export const ChallengeSetup: React.FC<{ onStart: (length: number) => void, onExit: () => void }> = ({ onStart, onExit }) => {
    const [length, setLength] = useState(5);
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 sm:p-4">
            <div className="game-overlay-panel modern-panel w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl rounded-none p-6 text-center animate-in fade-in zoom-in-95 flex flex-col justify-center">
                <h2 className="font-display text-2xl font-black title-shadow text-[var(--accent-blue)] mb-4">Cosmic Cup</h2>
                <p className="text-sm text-[var(--text-dark)] mb-6">
                    Compete in a series of randomly generated levels. At the end, get a link to challenge your friends to the exact same course!
                </p>
                
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[3, 5, 10].map(l => (
                        <button 
                            key={l} 
                            onClick={() => setLength(l)}
                            className={`modern-button py-4 text-lg font-bold ${length === l ? 'bg-[var(--accent-blue)] border-white shadow-lg' : 'opacity-60'}`}
                        >
                            {l} Levels
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={onExit} className="modern-button flex-1 py-3">Back</button>
                    <button onClick={() => onStart(length)} className="modern-button run-button flex-1 py-3 text-lg">Start Cup</button>
                </div>
            </div>
        </div>
    );
};

// 2. LOBBY SCREEN (Accepting a challenge)
export const ChallengeLobby: React.FC<{ challengerName: string, score: number, length: number, onAccept: () => void, onDecline: () => void }> = ({ challengerName, score, length, onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 sm:p-4">
            <div className="game-overlay-panel modern-panel w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl rounded-none p-8 text-center animate-in fade-in slide-in-from-bottom-10 flex flex-col justify-center">
                <div className="w-20 h-20 mx-auto bg-[var(--accent-magenta)]/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <div className="text-[var(--accent-magenta)] scale-150"><ICONS.Trophy /></div>
                </div>
                
                <h2 className="font-display text-3xl font-black title-shadow mb-2">Challenge Received!</h2>
                <div className="my-6 sharp-indicator p-6 bg-gradient-to-b from-[var(--panel-bg)] to-black/40 border-[var(--accent-magenta)]/30">
                    <p className="text-xs font-bold text-[var(--text-dark)] mb-1">Challenger</p>
                    <p className="text-2xl font-black text-white mb-4">{challengerName}</p>
                    
                    <div className="w-full h-px bg-white/10 mb-4" />
                    
                    <div className="flex justify-between items-end">
                        <div className="text-left">
                            <p className="text-xs font-bold text-[var(--text-dark)]">Course</p>
                            <p className="text-lg font-bold text-white">{length} Levels</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-[var(--text-dark)]">To Beat</p>
                            <p className="text-2xl font-black text-[var(--accent-yellow)]">{score.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <button onClick={onAccept} className="modern-button run-button w-full py-4 text-xl mb-3">Accept Challenge</button>
                <button onClick={onDecline} className="text-xs text-[var(--text-dark)] hover:text-white transition-colors">No thanks, take me to menu</button>
            </div>
        </div>
    );
};

// 3. COMPLETE SCREEN
export const ChallengeComplete: React.FC<{ 
    myScore: number, 
    challenger?: { name: string, score: number }, 
    seed: number, 
    length: number, 
    userName: string,
    onExit: () => void,
    onOpenUserSearch?: () => void 
}> = ({ myScore, challenger, seed, length, userName, onExit, onOpenUserSearch }) => {
    const [copied, setCopied] = useState(false);
    const isWin = challenger ? myScore > challenger.score : true; // Always "win" if solo
    
    // Generate Share Link
    const shareUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('challenge_seed', seed.toString());
        params.set('challenge_len', length.toString());
        params.set('challenger_name', userName);
        params.set('challenger_score', myScore.toString());
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }, [seed, length, userName, myScore]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 sm:p-4">
            <div className="game-overlay-panel modern-panel w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl rounded-none p-6 text-center animate-in zoom-in-95 duration-300 flex flex-col justify-center">
                <h2 className="font-display text-3xl font-black title-shadow mb-2">Tournament Complete!</h2>

                {challenger && (
                    <div className={`inline-block px-4 py-1 rounded-full text-xs font-black mb-4 ${isWin ? 'bg-[var(--accent-green)] text-black' : 'bg-[var(--accent-red)] text-white'}`}>
                        {isWin ? 'Victory!' : 'Defeat'}
                    </div>
                )}

                <div className="my-6 grid grid-cols-1 gap-4">
                    <div className="sharp-indicator p-4 flex flex-col items-center justify-center bg-[var(--accent-yellow)]/10 border-[var(--accent-yellow)]/30">
                        <span className="text-xs font-bold opacity-70 text-[var(--accent-yellow)]">Your Final Score</span>
                        <span className="text-4xl font-black mt-1 title-shadow text-white"><AnimatedNumber value={myScore} /></span>
                    </div>
                    
                    {challenger && (
                        <div className="flex justify-between px-4 py-2 bg-white/5 rounded-lg text-sm">
                            <span className="text-[var(--text-dark)]">Vs {challenger.name}</span>
                            <span className="font-bold">{challenger.score.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="bg-black/30 rounded-xl p-4 mb-6 text-left">
                    <p className="text-xs font-bold text-[var(--text-dark)] mb-2">Challenge Others</p>
                    
                    {/* NEW: Challenge Player Button */}
                    {onOpenUserSearch && (
                        <button 
                            onClick={onOpenUserSearch}
                            className="modern-button w-full py-2 mb-3 bg-[var(--accent-blue)]/20 border-[var(--accent-blue)] text-[var(--accent-blue)] flex items-center justify-center gap-2"
                        >
                            <ICONS.User /> Challenge a Player
                        </button>
                    )}

                    <div className="flex gap-2">
                        <input readOnly value={shareUrl} className="flex-grow bg-black/20 border border-white/10 rounded-md px-3 text-xs text-[var(--text-dark)] font-mono truncate" />
                        <button onClick={handleCopy} className="modern-button px-4 py-2 text-xs shrink-0 bg-white/10 border-white/20 hover:bg-white/20">
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>

                <button onClick={onExit} className="modern-button w-full py-3">Return to Main Menu</button>
            </div>
        </div>
    );
};
