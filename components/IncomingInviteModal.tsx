
import React from 'react';
import { ICONS } from './icons';
import { GameInvite } from '../types';

interface IncomingInviteModalProps {
  invite: GameInvite;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingInviteModal: React.FC<IncomingInviteModalProps> = ({ invite, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-[var(--accent-blue)] rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(59,130,246,0.3)] relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Background Pulse */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-blue)] animate-loader-bar"></div>
        
        <div className="w-20 h-20 bg-[var(--accent-blue)]/20 rounded-full flex items-center justify-center mb-4 animate-bounce border border-[var(--accent-blue)]/50">
            <div className="text-[var(--accent-blue)] scale-[2]"><ICONS.Friends /></div>
        </div>

        <h2 className="text-xl font-black font-display text-white mb-1">You've got an invite!</h2>
        <p className="text-xs text-[var(--accent-blue)] font-bold mb-6">Co-op Request</p>

        <div className="bg-slate-800 rounded-xl p-4 w-full mb-6 border border-slate-700">
            <p className="text-[10px] text-slate-400 font-bold mb-1">From</p>
            <p className="text-2xl font-black text-white">{invite.fromName}</p>
            <p className="text-xs text-slate-500 mt-2">Wants to play together!</p>
        </div>

        <div className="flex gap-3 w-full">
            <button
                onClick={onDecline}
                className="flex-1 py-4 rounded-xl font-bold text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
            >
                Decline
            </button>
            <button
                onClick={onAccept}
                className="flex-1 py-4 rounded-xl font-black text-xs bg-[var(--accent-green)] text-slate-900 hover:bg-white hover:scale-105 transition-all shadow-lg"
            >
                Accept & Play
            </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingInviteModal;
