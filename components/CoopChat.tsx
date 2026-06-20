
import React, { useState } from 'react';
import { sendCoopMessage } from '../firebase';
import { ICONS } from './icons';

interface CoopChatProps {
    gameId: string;
    userUid: string;
    userName: string;
}

// Curated list of communicative emojis
const EMOJIS = ["👍", "👎", "🔥", "🤔", "🛑", "🚀", "😂", "👀", "💎", "⚡"];

const CoopChat: React.FC<CoopChatProps> = ({ gameId, userUid, userName }) => {
    const [lastSent, setLastSent] = useState<string | null>(null);

    const handleEmoji = async (emoji: string) => {
        setLastSent(emoji);
        // Visual feedback reset
        setTimeout(() => setLastSent(null), 1000);
        
        await sendCoopMessage(gameId, userUid, userName, emoji, true);
    };

    return (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-full max-w-md px-4 flex justify-center">
            <div className="bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-2 flex items-center gap-1 sm:gap-2 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="px-2 border-r border-slate-200 hidden sm:block">
                    <span className="text-[10px] font-black text-slate-400">Comms</span>
                </div>
                
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-1 px-1">
                    {EMOJIS.map(e => (
                        <button 
                            key={e} 
                            onClick={() => handleEmoji(e)} 
                            className={`
                                w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xl rounded-xl transition-all duration-200
                                ${lastSent === e 
                                    ? 'bg-[var(--accent-blue)] scale-110 -translate-y-2 shadow-lg' 
                                    : 'hover:bg-slate-100 hover:scale-125 active:scale-95'
                                }
                            `}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoopChat;
