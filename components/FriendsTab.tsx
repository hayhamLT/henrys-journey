
import React, { useEffect, useState, useCallback } from 'react';
import ChatPanel from './ChatPanel';
import { getFriends, removeFriend, searchUsers, addFriend, sendInvite, createCoopSession, joinCoopGame, respondToInvite } from '../firebase';
import { Friend, GameInvite, CustomLevelEntry } from '../types';
import { ICONS } from './icons';

interface FriendsTabProps {
    currentUid: string;
    currentName: string;
    isGuest?: boolean;
    invites: GameInvite[];
    challengeData?: any;
    onStartCoop?: (gameId: string) => void;
    onJoinCoop?: (gameId: string) => void;
    activeCoopGameId?: string | null;
    customLevels?: CustomLevelEntry[];
}

const FriendsTab: React.FC<FriendsTabProps> = (props) => {
    const { currentUid, currentName, isGuest, invites } = props;
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{uid: string, displayName: string, photoURL: string, lastLogin?: number}[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addedIds, setAddedIds] = useState<string[]>([]); 
    const [invitedIds, setInvitedIds] = useState<string[]>([]);
    const [chatFriend, setChatFriend] = useState<{ uid: string; name: string } | null>(null);

    // Level Picker State
    const [pickingLevelFor, setPickingLevelFor] = useState<string | null>(null);

    const fetchFriendsData = useCallback(async (showLoading: boolean) => {
        if (!currentUid || isGuest) return;
        if (showLoading) setLoadingFriends(true);
        try {
            const list = await getFriends(currentUid);
            setFriends(list);
        } catch (e) {
            console.error("Failed to fetch friends", e);
        }
        if (showLoading) setLoadingFriends(false);
    }, [currentUid, isGuest]);

    useEffect(() => {
        if (!isGuest) {
            fetchFriendsData(true);
            const interval = setInterval(() => fetchFriendsData(false), 20000);
            return () => clearInterval(interval);
        }
    }, [isGuest, fetchFriendsData]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await searchUsers(searchTerm);
                    setSearchResults(results.filter(u => u.uid !== currentUid));
                } catch(e) { setSearchResults([]); }
                setIsSearching(false);
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentUid]);

    const handleAdd = async (targetUid: string) => {
        setAddedIds(prev => [...prev, targetUid]);
        await addFriend(currentUid, targetUid);
        if (!friends.some(f => f.uid === targetUid)) {
             const userFromSearch = searchResults.find(u => u.uid === targetUid);
             if (userFromSearch) setFriends(prev => [...prev, userFromSearch]);
             else fetchFriendsData(false);
        }
    };

    const handleRemove = async (uid: string) => {
        if (!confirm("Remove this friend?")) return;
        await removeFriend(currentUid, uid);
        setFriends(prev => prev.filter(f => f.uid !== uid));
    };

    const handleCoopInvite = async (targetUid: string) => {
        if (invitedIds.includes(targetUid)) return;
        setInvitedIds(prev => [...prev, targetUid]);
        
        let coopCode = props.activeCoopGameId;
        if (!coopCode) {
            const session = await createCoopSession(currentUid, currentName);
            coopCode = session.id;
            if (props.onStartCoop) props.onStartCoop(coopCode);
        }
        
        await sendInvite(currentUid, currentName, targetUid, undefined, undefined, undefined, coopCode, undefined, 'coop');
    };

    const handleSendLevel = async (level: CustomLevelEntry) => {
        if (!pickingLevelFor) return;
        await sendInvite(currentUid, currentName, pickingLevelFor, undefined, undefined, undefined, level.id, level.name, 'level');
        setPickingLevelFor(null);
        alert(`Sent "${level.name}"!`);
    };

    const handleInboxAction = async (invite: GameInvite, accept: boolean) => {
        await respondToInvite(invite.id, accept);
        if (accept && invite.type === 'coop' && invite.customLevelId && props.onJoinCoop) {
            await joinCoopGame(invite.customLevelId, currentUid, currentName);
            props.onJoinCoop(invite.customLevelId);
        }
    };

    const isSearchActive = searchTerm.trim().length >= 2;
    const displayList = isSearchActive ? searchResults : friends;

    const isOnline = (lastLogin?: number) => {
        if (!lastLogin) return false;
        return (Date.now() - lastLogin) < 15 * 60 * 1000;
    };

    return (
        <div className="space-y-4">
            {/* CHAT PANEL */}
            {chatFriend && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border-2 border-[var(--accent-blue)] rounded-2xl p-4 w-full max-w-md shadow-lg relative flex flex-col items-center">
                        <button className="absolute top-2 right-2 text-white/40 hover:text-white" onClick={() => setChatFriend(null)}><ICONS.Remove /></button>
                        <ChatPanel currentUid={currentUid} currentName={currentName} friendUid={chatFriend.uid} friendName={chatFriend.name} />
                    </div>
                </div>
            )}
            
            {/* INBOX SECTION */}
            {invites.length > 0 && !props.activeCoopGameId && (
                <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-bold text-white/40 mb-2 px-1">Inbox ({invites.length})</h3>
                    <div className="space-y-2">
                        {invites.map(invite => (
                            <div key={invite.id} className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-[10px] font-bold text-[var(--accent-blue)] flex items-center gap-2">
                                            {invite.type === 'coop' ? <><ICONS.Friends/> Co-op Invite</> : invite.customLevelId ? <><ICONS.Builder/> Challenge</> : <><ICONS.Trophy/> Challenge</>}
                                        </div>
                                        <div className="text-white font-bold">{invite.fromName}</div>
                                        {invite.levelName && <div className="text-xs text-white/50 italic">"{invite.levelName}"</div>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleInboxAction(invite, true)} className="flex-1 py-2 bg-[var(--accent-green)] text-black font-bold text-xs rounded-xl shadow-sm hover:scale-105 transition-transform">
                                        {invite.type === 'coop' ? 'Join' : 'Play'}
                                    </button>
                                    <button onClick={() => handleInboxAction(invite, false)} className="flex-1 py-2 bg-white/10 text-white/50 font-bold text-xs rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SEARCH BAR (Hide when in Co-op Lobby mode) */}
            {!props.activeCoopGameId && (
                <div className="sticky top-0 z-10">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                            {isSearchActive ? <ICONS.Search /> : <ICONS.Friends />}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search players..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[var(--accent-blue)] focus:outline-none shadow-sm transition-all placeholder:text-white/20"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                                <div className="scale-75"><ICONS.Remove /></div>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* CONTENT */}
            <div>
                {loadingFriends && !isSearchActive ? (
                    <div className="text-center py-8 text-white/30 text-xs font-bold animate-pulse">Loading crew...</div>
                ) : displayList.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                        {isSearchActive ? "No players found." : "Your crew list is empty."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayList.map((user) => {
                            const isFriend = friends.some(f => f.uid === user.uid);
                            const isJustAdded = addedIds.includes(user.uid);
                            const userIsOnline = isOnline(user.lastLogin);
                            const isInvited = invitedIds.includes(user.uid);
                            const isCoopContext = !!props.activeCoopGameId;

                            return (
                                <div key={user.uid} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isCoopContext ? 'bg-black/20 border-white/5' : 'bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60'}`}>
                                    <div className="relative">
                                        <img 
                                            src={user.photoURL || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} 
                                            alt={user.displayName}
                                            className={`w-10 h-10 rounded-full object-cover border border-white/10 bg-black`}
                                        />
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${userIsOnline ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`}></div>
                                    </div>
                                    
                                    <div className="flex-grow min-w-0">
                                        <div className={`font-bold text-sm truncate text-white`}>{user.displayName}</div>
                                        <div className={`text-[9px] font-bold ${userIsOnline ? 'text-green-400' : 'text-white/30'}`}>
                                            {userIsOnline ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                    
                                    {isSearchActive ? (
                                        isFriend || isJustAdded ? (
                                            <div className="text-[var(--accent-green)]"><ICONS.Check /></div>
                                        ) : (
                                            <button
                                                onClick={() => handleAdd(user.uid)}
                                                className="bg-teal-500/20 text-teal-400 border border-teal-500/40 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-teal-500/30 transition-colors"
                                            >
                                                Add
                                            </button>
                                        )
                                    ) : (
                                        <div className="flex gap-2">
                                            {isCoopContext ? (
                                                <button
                                                    onClick={() => handleCoopInvite(user.uid)}
                                                    disabled={isInvited}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors border ${
                                                        isInvited
                                                            ? 'bg-transparent text-white/30 border-white/10 cursor-default'
                                                            : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-500 shadow-lg'
                                                    }`}
                                                >
                                                    {isInvited ? 'Sent' : 'Invite'}
                                                </button>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => setPickingLevelFor(pickingLevelFor === user.uid ? null : user.uid)} 
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
                                                            pickingLevelFor === user.uid 
                                                                ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white shadow-lg scale-105' 
                                                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-[var(--accent-blue)] hover:border-white/20'
                                                        }`} 
                                                        title="Send Level"
                                                    >
                                                        <ICONS.Builder />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCoopInvite(user.uid)} 
                                                        disabled={isInvited} 
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
                                                            isInvited 
                                                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-[var(--accent-green)] hover:border-white/20'
                                                        }`} 
                                                        title="Invite to Co-op"
                                                    >
                                                        <ICONS.Friends />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemove(user.uid)} 
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all" 
                                                        title="Remove"
                                                    >
                                                        <ICONS.Remove />
                                                    </button>
                                                    <button 
                                                        onClick={() => setChatFriend({ uid: user.uid, name: user.displayName })}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-[var(--accent-blue)] hover:border-white/20 transition-all" 
                                                        title="Chat"
                                                    >
                                                        <ICONS.Chat />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsTab;
