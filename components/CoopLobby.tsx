
import React, { useEffect, useState, useRef } from 'react';
import { ICONS } from './icons';
import { UserProfile, GameInvite } from '../types';
import FriendsTab from './FriendsTab';
import LoginRequiredPanel from './LoginRequiredPanel';

interface CoopLobbyProps {
    gameId: string | null;
    isHost: boolean;
    onHost: () => void;
    onJoin: (code: string) => void;
    onExit: () => void;
    onInvite?: () => void;
    status: string;
    guestName?: string | null;
    user?: UserProfile | null;
    onLogin?: () => Promise<void>;
    invites?: GameInvite[];
    onStartCoopFromSocial?: (gameId: string) => void;
    onJoinCoopFromSocial?: (gameId: string) => void;
}

const CoopLobby: React.FC<CoopLobbyProps> = ({ gameId, isHost, onHost, onJoin, onExit, status, guestName, user, onLogin, onStartCoopFromSocial, onJoinCoopFromSocial }) => {
    const [isCopied, setIsCopied] = useState(false);
    const hasInitialized = useRef(false);
    const isGuest = !user || !user.uid || user.email?.includes('guest');

    // Auto-initialize host session if no gameId provided — but ONLY for signed-in
    // users. Co-op sessions require auth, so guests would otherwise hang forever
    // on "Connecting..." with no way out.
    useEffect(() => {
        if (!isGuest && !gameId && !hasInitialized.current) {
            hasInitialized.current = true;
            onHost(); // This triggers createCoopSession in parent
        }
    }, [gameId, onHost, isGuest]);

    const handleCopy = () => {
        if (gameId) {
            navigator.clipboard.writeText(gameId);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const isConnected = status === 'active';

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--accent-green)] scale-125"><ICONS.Friends /></div>
                    <div>
                        <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide">Co-Op Adventure</h2>
                        <p className="text-xs text-white/50 font-medium">Synchronized Multiplayer</p>
                    </div>
                </div>
            </div>
            
            {/* Guest gate — co-op needs an account to sync sessions */}
            {isGuest ? (
                <div className="flex-grow flex items-center justify-center p-6">
                    <LoginRequiredPanel
                        variant="dark"
                        featureName="Play with Friends"
                        description="Sign in to host a co-op room, invite friends, and solve puzzles together in real time."
                        onLogin={onLogin || (async () => {})}
                    />
                </div>
            ) : (
            /* Main Content */
            <div className="flex-grow flex flex-col relative overflow-hidden h-full">

                {/* Status Bar / Connection Panel */}
                <div className={`p-4 sm:p-6 text-center border-b border-white/10 transition-colors duration-500 shrink-0 bg-black/20`}>
                    {isConnected ? (
                        <div className="animate-in zoom-in slide-in-from-bottom-2 duration-300 max-w-md mx-auto">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-green-400">
                                <div className="scale-125"><ICONS.Check /></div>
                            </div>
                            <p className="font-display text-xl font-black text-white">{guestName || "Partner"} Connected!</p>
                            <p className="text-xs text-green-400 font-bold mt-1 animate-pulse">Get ready!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-w-md mx-auto">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-pulse shadow-[0_0_10px_var(--accent-blue)]"></div>
                                <p className="text-xs sm:text-sm text-blue-400 font-bold">Waiting for a friend...</p>
                            </div>
                            {gameId ? (
                                <div className="flex flex-col items-center gap-2 mt-1">
                                    <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wide bg-black/40 px-6 py-3 rounded-xl border border-white/10 select-all shadow-lg">{gameId}</span>
                                    <button
                                        onClick={handleCopy}
                                        className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isCopied ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`}
                                    >
                                        {isCopied ? 'Copied to clipboard!' : 'Tap to copy code'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-white/30 animate-pulse font-mono">Connecting...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Friend List for Inviting - Only show if waiting */}
                {!isConnected && (
                    <div className="flex-grow overflow-y-auto no-scrollbar p-4 lg:p-6">
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-xs font-black text-white/30 mb-4 px-1">Invite a Friend</h3>
                            <FriendsTab 
                                currentUid={user?.uid || ''}
                                currentName={user?.name || 'Player'}
                                isGuest={!user}
                                invites={[]} 
                                activeCoopGameId={gameId}
                            />
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default CoopLobby;
