
import React from 'react';
import { ICONS } from './icons';
import { GameInvite } from '../types';
import { respondToInvite, addFriend } from '../firebase';
import { getAuth } from 'firebase/auth';

interface InboxModalProps {
  onClose: () => void;
  invites: GameInvite[];
  onAccept: (invite: GameInvite) => void;
}

const InboxModal: React.FC<InboxModalProps> = ({ onClose, invites, onAccept }) => {
  
  const handleAction = async (invite: GameInvite, accept: boolean) => {
      console.log(`[Inbox] Processing invite ${invite.id} from ${invite.fromName}. Accepted: ${accept}`);
      try {
          await respondToInvite(invite.id, accept);
          if (accept) {
              // Special handling for friend requests to ensure mutual addition
              if (invite.type === 'friend_request') {
                  const auth = getAuth();
                  const currentUser = auth.currentUser;
                  if (currentUser) {
                      // 1. Add sender to my friends list
                      await addFriend(currentUser.uid, invite.fromUid);
                      // 2. Add me to sender's friends list (Firestore rules permit write if auth.uid == friendId in destination)
                      //    Destination: users/{invite.fromUid}/friends/{currentUser.uid}
                      await addFriend(invite.fromUid, currentUser.uid);
                  }
              }
              onAccept(invite);
              // Don't close immediately if we want to show success, but for now simple close is fine
              // onClose(); // Let parent handle close or refresh
          }
      } catch (e) {
          console.error("[Inbox] Failed to respond to invite:", e);
      }
  };

  const getInviteTypeLabel = (invite: GameInvite) => {
      if (invite.type === 'friend_request') return 'Friend Request';
      if (invite.type === 'coop') return 'Co-op Invite';
      if (invite.customLevelId) return 'Custom Level';
      return 'Challenge';
  };

  const getActionButtonLabel = (invite: GameInvite) => {
      if (invite.type === 'friend_request') return 'Add Friend';
      if (invite.type === 'coop') return 'Join Crew';
      if (invite.customLevelId) return 'Play Level';
      return 'Accept';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] sm:p-4" onClick={onClose}>
      <div className="game-overlay-panel modern-panel p-6 w-full h-full sm:max-w-md sm:h-[500px] sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black font-display title-shadow text-[var(--accent-yellow)] flex items-center gap-2">
              <ICONS.Mail /> Inbox
          </h2>
          <button onClick={onClose} className="modern-button p-2"><ICONS.Remove /></button>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar sharp-indicator p-2 space-y-2 bg-black/20">
            {invites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                    <div className="scale-150 opacity-50"><ICONS.Mail /></div>
                    <p className="text-sm">No pending invites.</p>
                </div>
            ) : (
                invites.map(invite => (
                    <div key={invite.id} className="p-4 bg-[var(--panel-bg-dark)] rounded-lg border border-[var(--accent-blue)]/30 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--accent-blue)] mb-0.5 flex items-center gap-2">
                                        {getInviteTypeLabel(invite)} from
                                        {invite.date && <span className="text-white/30 font-normal normal-case">{invite.date}</span>}
                                    </p>
                                    <p className="text-lg font-black text-white">{invite.fromName}</p>
                                </div>
                                {invite.scoreToBeat && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[var(--accent-yellow)] mb-0.5">To beat</p>
                                        <p className="text-lg font-black text-white">{invite.scoreToBeat.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-black/40 rounded px-2 py-1 text-xs text-white/60 mb-4 inline-block">
                                {invite.type === 'friend_request' ? (
                                    <span className="text-[var(--accent-green)] font-bold flex items-center gap-1">
                                        <ICONS.AddUser /> Wants to join your crew
                                    </span>
                                ) : invite.type === 'coop' ? (
                                    <span className="text-[var(--accent-magenta)] font-bold flex items-center gap-1">
                                        <ICONS.Friends /> Co-op Session
                                    </span>
                                ) : invite.customLevelId ? (
                                    <span className="text-[var(--accent-green)] font-bold">{invite.levelName || 'Untilted Level'}</span>
                                ) : (
                                    <span>{invite.length} Levels &bull; Seed: {invite.seed}</span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(invite, true)}
                                    className="flex-1 modern-button bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30 py-2 text-xs font-bold"
                                >
                                    {getActionButtonLabel(invite)}
                                </button>
                                <button
                                    onClick={() => handleAction(invite, false)}
                                    className="flex-1 modern-button bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 py-2 text-xs font-bold"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                        {/* Background Pattern */}
                        <div className={`absolute -right-4 -bottom-4 opacity-5 rotate-12 scale-[3] pointer-events-none ${invite.customLevelId ? 'text-[var(--accent-green)]' : 'text-[var(--accent-blue)]'}`}>
                            {invite.type === 'friend_request' ? <ICONS.User /> : invite.type === 'coop' ? <ICONS.Friends /> : invite.customLevelId ? <ICONS.Builder /> : <ICONS.Trophy />}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;
