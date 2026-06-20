
import React, { useState, useEffect } from 'react';
import { ICONS } from './icons';
import { searchUsers, sendInvite, getActiveUsers, cancelInvite, getFriends } from '../firebase';
import { Friend } from '../types';
import { RECOMMENDED_FIRESTORE_RULES } from '../constants/game';

interface UserSearchModalProps {
  onClose: () => void;
  currentUid: string;
  currentName: string;
  challengeData?: {
      seed?: number;
      length?: number;
      score?: number;
      customLevelId?: string;
      levelName?: string;
      type?: 'challenge' | 'level';
  };
  customSendHandler?: (targetUid: string, targetName: string) => Promise<void>;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  rowActionLabel?: string; 
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ onClose, currentUid, currentName, challengeData, customSendHandler, onSecondaryAction, secondaryActionLabel, rowActionLabel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{uid: string, displayName: string, photoURL: string, lastLogin?: number}[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Track Invite IDs to allow cancellation
  const [sentInvites, setSentInvites] = useState<Record<string, string>>({}); 
  
  const [error, setError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  
  // Loading & Error states per user
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({});

  // Friends & Active Users
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeUsers, setActiveUsers] = useState<Friend[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);

  useEffect(() => {
      const loadData = async () => {
          setLoadingActive(true);
          try {
              // Load Friends first
              if (currentUid) {
                  const myFriends = await getFriends(currentUid);
                  setFriends(myFriends);
              }
              // Load Active Users
              const users = await getActiveUsers();
              setActiveUsers(users.filter(u => u.uid !== currentUid));
          } catch(e) {
              console.error("Failed to load initial users", e);
          }
          setLoadingActive(false);
      };
      loadData();
  }, [currentUid]);

  useEffect(() => {
      const delayDebounceFn = setTimeout(async () => {
          if (searchTerm.length >= 2) {
              setLoading(true);
              setError(null);
              setIsPermissionError(false);
              try {
                  const users = await searchUsers(searchTerm);
                  setResults(users.filter(u => u.uid !== currentUid));
              } catch (e: any) {
                  console.error("Search failed in UI:", e);
                  let msg = "Unable to search right now.";
                  
                  if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
                      msg = "Setup Needed: Firestore Security Rules blocked this search.";
                      setIsPermissionError(true);
                  }
                  else if (e.code === 'failed-precondition') {
                      msg = "Database Index Building... Try again in a few minutes.";
                  }
                  else if (e.message) {
                      msg = `Error: ${e.message}`;
                  }
                  
                  setError(msg);
              }
              setLoading(false);
          } else {
              setResults([]);
              setError(null);
              setIsPermissionError(false);
          }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUid]);

  const handleSend = async (targetUid: string, targetName: string, isFriend: boolean) => {
      if (sentInvites[targetUid] || loadingMap[targetUid]) return;
      
      setLoadingMap(prev => ({...prev, [targetUid]: true}));
      setErrorMap(prev => ({...prev, [targetUid]: false}));

      try {
          let inviteId = '';
          
          if (!isFriend) {
              // Priority: If not a friend, ALWAYS send friend request first
              inviteId = await sendInvite(
                  currentUid,
                  currentName,
                  targetUid,
                  undefined, undefined, undefined, undefined, undefined,
                  'friend_request'
              );
          } else {
              // If Friend, perform the intended action
              if (customSendHandler) {
                  await customSendHandler(targetUid, targetName);
                  inviteId = 'custom'; 
              } else if (challengeData) {
                  // Standard Challenge logic for friends
                  if (challengeData.customLevelId) {
                      inviteId = await sendInvite(
                          currentUid, 
                          currentName, 
                          targetUid, 
                          undefined, 
                          undefined, 
                          undefined, 
                          challengeData.customLevelId, 
                          challengeData.levelName, 
                          'level'
                      );
                  } else {
                      inviteId = await sendInvite(
                          currentUid, 
                          currentName, 
                          targetUid, 
                          challengeData.seed, 
                          challengeData.length, 
                          challengeData.score, 
                          undefined, 
                          undefined, 
                          'challenge'
                      );
                  }
              } else {
                  // Generic invite if no data provided (fallback)
                  inviteId = await sendInvite(currentUid, currentName, targetUid, Math.floor(Math.random() * 1000), 5, 0);
              }
          }
          
          if (inviteId) {
              setSentInvites(prev => ({...prev, [targetUid]: inviteId}));
          }
      } catch (e) {
          console.error("Failed to send invite", e);
          setErrorMap(prev => ({...prev, [targetUid]: true}));
          if (!error) setError("Failed to send invite. Check logs.");
      } finally {
          setLoadingMap(prev => ({...prev, [targetUid]: false}));
      }
  };

  const handleCancel = async (targetUid: string) => {
      const inviteId = sentInvites[targetUid];
      if (!inviteId || inviteId === 'custom') return;

      setLoadingMap(prev => ({...prev, [targetUid]: true}));
      
      try {
          await cancelInvite(inviteId);
          // Remove from sent list on success
          setSentInvites(prev => {
              const next = {...prev};
              delete next[targetUid];
              return next;
          });
      } catch(e) {
          console.error("Failed to cancel invite", e);
      } finally {
          setLoadingMap(prev => ({...prev, [targetUid]: false}));
      }
  };

  const handleCopyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}?add_friend=${currentUid}`;
      navigator.clipboard.writeText(url).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
      });
  };

  const handleCopyRules = () => {
      navigator.clipboard.writeText(RECOMMENDED_FIRESTORE_RULES).then(() => {
          setRulesCopied(true);
          setTimeout(() => setRulesCopied(false), 2000);
      });
  };

  const isOnline = (lastLogin?: number) => {
      if (!lastLogin) return false;
      return (Date.now() - lastLogin) < 15 * 60 * 1000;
  };

  const renderUserRow = (user: {uid: string, displayName: string, photoURL: string, lastLogin?: number}, isFriend: boolean) => {
      const isSent = !!sentInvites[user.uid];
      const isLoadingInvite = loadingMap[user.uid];
      const isErrorInvite = errorMap[user.uid];
      const online = isOnline(user.lastLogin);

      // Logic: If not friend, Action is "ADD FRIEND". If friend, Action is context-dependent.
      let actionText = "Add Friend";
      let btnColor = "bg-[var(--accent-green)] text-black shadow-[var(--accent-green)]/20";

      if (isFriend) {
          actionText = rowActionLabel || (challengeData?.customLevelId ? 'Send Level' : (customSendHandler || challengeData) ? 'Challenge' : 'Invite');
          btnColor = "bg-[var(--accent-blue)] text-black shadow-[var(--accent-blue)]/20";
      }

      return (
          <div key={user.uid} className="bg-[var(--panel-bg-dark)] p-3 rounded-lg flex items-center justify-between border border-white/5 group hover:border-[var(--accent-blue)]/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                      <img src={user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} className="w-10 h-10 rounded-full bg-black shrink-0" />
                      {online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />}
                  </div>
                  <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate max-w-[120px]">{user.displayName}</div>
                      {user.uid === currentUid ? (
                          <div className="text-[9px] text-[var(--accent-green)] font-bold">You</div>
                      ) : isFriend && (
                          <div className="text-[9px] text-[var(--accent-blue)] font-bold">Crew</div>
                      )}
                  </div>
              </div>
              <div className="flex gap-2 shrink-0">
                  <button 
                      onClick={() => isSent ? handleCancel(user.uid) : handleSend(user.uid, user.displayName, isFriend)}
                      disabled={user.uid === currentUid || isLoadingInvite}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 ${
                          isErrorInvite ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                          isSent ? 'bg-white/10 text-white/50 border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 group/btn' : 
                          btnColor
                      }`}
                  >
                      {isLoadingInvite ? (
                          <><div className="w-2 h-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div> {isSent ? 'Cancelling' : 'Sending'}</>
                      ) : isErrorInvite ? (
                          <>Failed</>
                      ) : isSent ? (
                          <>
                              <span className="group-hover/btn:hidden flex items-center gap-2"><ICONS.Check /> Sent</span>
                              <span className="hidden group-hover/btn:flex items-center gap-2"><ICONS.Remove /> Cancel</span>
                          </>
                      ) : (
                          actionText
                      )}
                  </button>
              </div>
          </div>
      );
  };

  const showDefaultList = searchTerm.length < 2;
  const isLoading = showDefaultList ? loadingActive : loading;
  const modalTitle = "Find Players";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] sm:p-4" onClick={onClose}>
      <div className="game-overlay-panel modern-panel p-6 w-full h-full sm:max-w-md sm:h-[580px] sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black font-display title-shadow text-[var(--accent-blue)]">{modalTitle}</h2>
          <button onClick={onClose} className="modern-button p-2"><ICONS.Remove /></button>
        </div>

        <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><ICONS.Search /></div>
            <input 
                type="text" 
                placeholder="Search by full name or exact ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-[var(--accent-blue)] focus:outline-none"
                autoFocus
            />
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-3 shrink-0">
                <p className="text-red-400 text-xs font-bold flex items-center gap-2">
                    <span>⚠️</span> {error}
                </p>
                {isPermissionError && (
                    <div className="mt-2">
                        <p className="text-[10px] text-white/60 mb-2">
                            To fix this, update your Firestore Rules in the Firebase Console:
                        </p>
                        <button 
                            onClick={handleCopyRules}
                            className="modern-button w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] border-red-500/30"
                        >
                            {rulesCopied ? "Copied to clipboard!" : "Copy fix to clipboard"}
                        </button>
                    </div>
                )}
            </div>
        )}

        <div className="flex-grow overflow-y-auto no-scrollbar space-y-4 relative min-h-0 bg-black/20 rounded-xl border border-white/5 p-2">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                    <div className="w-5 h-5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs">Scanning...</p>
                </div>
            ) : showDefaultList ? (
                /* Default View: Friends + Active Users */
                <>
                    {friends.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-white/30 mb-2 px-1">Your Crew</div>
                            <div className="space-y-2">
                                {friends.map(user => renderUserRow(user, true))}
                            </div>
                        </div>
                    )}
                    
                    {activeUsers.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-white/30 mb-2 px-1">Active Players</div>
                            <div className="space-y-2">
                                {activeUsers.filter(u => !friends.some(f => f.uid === u.uid)).map(user => renderUserRow(user, false))}
                            </div>
                        </div>
                    )}

                    {friends.length === 0 && activeUsers.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4">
                            <div className="scale-150 opacity-50"><ICONS.User /></div>
                            <p className="text-sm">No recent players found.</p>
                            <div className="w-full max-w-[240px]">
                                <button 
                                    onClick={handleCopyLink} 
                                    className={`modern-button w-full py-3 flex items-center justify-center gap-2 ${linkCopied ? 'bg-[var(--accent-green)]/20 border-[var(--accent-green)] text-[var(--accent-green)]' : 'bg-[var(--accent-blue)]/20 border-[var(--accent-blue)] text-[var(--accent-blue)]'}`}
                                >
                                    {linkCopied ? <><ICONS.Check /> Link Copied!</> : <><ICONS.Friends /> Copy Friend Link</>}
                                </button>
                                <p className="text-[10px] text-center mt-2 opacity-50">Share this link to instantly add friends</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Search Results View */
                <>
                    {results.length > 0 ? (
                        <div>
                            <div className="text-[10px] font-bold text-white/30 mb-2 px-1">Search Results</div>
                            <div className="space-y-2">
                                {results.map(user => renderUserRow(user, friends.some(f => f.uid === user.uid)))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                            <div className="scale-150 opacity-50"><ICONS.Search /></div>
                            <p className="text-sm">No players found matching that name.</p>
                        </div>
                    )}
                </>
            )}
        </div>
        
        {/* Helper Footer or Secondary Action */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-white/40">
            {onSecondaryAction ? (
                <button onClick={onSecondaryAction} className="text-[var(--accent-green)] hover:text-white font-bold transition-colors">
                    Or {secondaryActionLabel || "Copy Link"}
                </button>
            ) : (
                <>
                    <span className="font-bold text-[var(--accent-blue)]">Pro tip:</span> Add a player to your crew to unlock Challenges & Co-op!
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
