
import React, { useState, useEffect } from 'react';
import { ICONS } from './icons';
import { GameInvite, UserProfile, CustomLevelEntry, LevelResult } from '../types';
import LoginRequiredPanel from './LoginRequiredPanel';
import FriendsTab from './FriendsTab';
import ProfileTab from './ProfileTab';
import LeaderboardTab from './LeaderboardTab';
import CommunityTab from './CommunityTab';
import WorkshopTab from './WorkshopTab';

interface SocialHubProps {
    userUid: string;
    userName: string;
    userPhoto?: string;
    isGuest?: boolean;
    onLogin?: () => Promise<void>;
    invites: GameInvite[];
    initialTab?: 'profile' | 'crew' | 'inbox' | 'rank' | 'galaxy';
    challengeData?: any; 
    onStartCoop?: (gameId: string) => void;
    onJoinCoop?: (gameId: string) => void;
    activeCoopGameId?: string | null;
    
    // Props for sub-tabs
    totalScore?: number;
    completedLevels?: number;
    onUpdateName?: (name: string) => void;
    onUpdatePhoto?: (photo: string) => void;
    onLogout?: () => void;
    onDeleteAccount?: () => void;
    onJoinTournament?: () => void;
    onPlayCommunityLevel?: (levelData: any) => void;
    likedLevels?: string[];
    onToggleLike?: (levelId: string, isLiking: boolean) => void;
    customLevels?: CustomLevelEntry[];
    resultsByLevel?: { [level: number]: LevelResult }; // Add optional resultsByLevel
    
    // New props for Level Management
    onShareLevel?: (level: CustomLevelEntry) => void;
    onDeleteLevel?: (index: number) => void;
    
    // Added for WorkshopTab
    onEnterBuilder?: () => void;
}

type OnlineTab = 'profile' | 'crew' | 'workshop' | 'rank' | 'galaxy';

const SocialHub: React.FC<SocialHubProps> = (props) => {
    const { isGuest, onLogin, invites, initialTab } = props;
    const [activeTab, setActiveTab] = useState<OnlineTab>(
        (initialTab === 'inbox' ? 'crew' : (initialTab as OnlineTab)) || 'profile'
    );

    // Handle Scroll for Parallax Clouds
    useEffect(() => {
        document.body.style.setProperty('--scroll-y', '0px');
        return () => {
            document.body.style.setProperty('--scroll-y', '0px');
        };
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        requestAnimationFrame(() => {
            document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
        });
    };

    if (isGuest && onLogin) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <LoginRequiredPanel 
                    featureName="Online Services"
                    description="Sign in to access your profile, compete on leaderboards, play with friends, and explore community levels."
                    onLogin={onLogin}
                    variant="dark"
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-300">
            {/* Top Navigation Bar - Dark Glass */}
            <div className="flex border-b border-white/10 shrink-0 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20 shadow-sm h-16 lg:h-20 justify-center">
                <div className="flex w-full max-w-2xl overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 min-w-[70px] py-2 sm:py-4 text-[10px] sm:text-xs font-bold relative transition-colors flex flex-col items-center justify-center gap-1
                            ${activeTab === 'profile' ? 'text-[var(--accent-blue)] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="scale-110"><ICONS.User /></div>
                        <span className="hidden sm:block">Profile</span>
                        {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-blue)]" />}
                    </button>

                    <button 
                        onClick={() => setActiveTab('crew')}
                        className={`flex-1 min-w-[70px] py-2 sm:py-4 text-[10px] sm:text-xs font-bold relative transition-colors flex flex-col items-center justify-center gap-1
                            ${activeTab === 'crew' ? 'text-[var(--accent-green)] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="relative">
                            <div className="scale-110"><ICONS.Friends /></div>
                            {invites.length > 0 && <div className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm" />}
                        </div>
                        <span className="hidden sm:block">Crew</span>
                        {activeTab === 'crew' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-green)]" />}
                    </button>

                    <button 
                        onClick={() => setActiveTab('workshop')}
                        className={`flex-1 min-w-[70px] py-2 sm:py-4 text-[10px] sm:text-xs font-bold relative transition-colors flex flex-col items-center justify-center gap-1
                            ${activeTab === 'workshop' ? 'text-[var(--accent-orange)] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="scale-110"><ICONS.Builder /></div>
                        <span className="hidden sm:block">Workshop</span>
                        {activeTab === 'workshop' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-orange)]" />}
                    </button>

                    <button 
                        onClick={() => setActiveTab('rank')}
                        className={`flex-1 min-w-[70px] py-2 sm:py-4 text-[10px] sm:text-xs font-bold relative transition-colors flex flex-col items-center justify-center gap-1
                            ${activeTab === 'rank' ? 'text-[var(--accent-yellow)] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="scale-110"><ICONS.Trophy /></div>
                        <span className="hidden sm:block">Rank</span>
                        {activeTab === 'rank' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-yellow)]" />}
                    </button>

                    <button 
                        onClick={() => setActiveTab('galaxy')}
                        className={`flex-1 min-w-[70px] py-2 sm:py-4 text-[10px] sm:text-xs font-bold relative transition-colors flex flex-col items-center justify-center gap-1
                            ${activeTab === 'galaxy' ? 'text-[var(--accent-magenta)] bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="scale-110"><ICONS.Community /></div>
                        <span className="hidden sm:block">Community</span>
                        {activeTab === 'galaxy' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-magenta)]" />}
                    </button>
                </div>
            </div>

            {/* Content Area - Constrained Width */}
            <div className="flex-grow overflow-hidden relative">
                
                {/* RANK TAB: Separate container to allow full height internal scrolling */}
                {activeTab === 'rank' ? (
                    <div className="absolute inset-0 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <LeaderboardTab 
                            isGuest={props.isGuest}
                            onJoinTournament={props.onJoinTournament}
                            onLogin={props.onLogin ? () => { props.onLogin!(); } : undefined}
                        />
                    </div>
                ) : (
                    /* OTHER TABS: Standard Scroll View */
                    <div 
                        className="absolute inset-0 overflow-y-auto no-scrollbar"
                        onScroll={handleScroll}
                    >
                        <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 pb-24">
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <ProfileTab 
                                        user={{ uid: props.userUid, name: props.userName, email: '', picture: props.userPhoto || '' }} 
                                        isGuest={props.isGuest}
                                        totalScore={props.totalScore || 0}
                                        completedLevels={props.completedLevels || 0}
                                        onUpdateName={props.onUpdateName}
                                        onUpdatePhoto={props.onUpdatePhoto}
                                        onLogout={props.onLogout}
                                        onDeleteAccount={props.onDeleteAccount}
                                        onLogin={props.onLogin}
                                        resultsByLevel={props.resultsByLevel}
                                    />
                                </div>
                            )}

                            {activeTab === 'crew' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <FriendsTab 
                                        currentUid={props.userUid}
                                        currentName={props.userName}
                                        isGuest={props.isGuest}
                                        invites={props.invites}
                                        challengeData={props.challengeData}
                                        onStartCoop={props.onStartCoop}
                                        onJoinCoop={props.onJoinCoop}
                                        activeCoopGameId={props.activeCoopGameId}
                                        customLevels={props.customLevels}
                                    />
                                </div>
                            )}

                            {activeTab === 'workshop' && props.customLevels && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <WorkshopTab 
                                        customLevels={props.customLevels}
                                        onPlayLevel={(level) => props.onPlayCommunityLevel && props.onPlayCommunityLevel(level.data)}
                                        onShareLevel={props.onShareLevel}
                                        onDeleteLevel={props.onDeleteLevel}
                                        onEnterBuilder={props.onEnterBuilder}
                                    />
                                </div>
                            )}

                            {activeTab === 'galaxy' && props.onPlayCommunityLevel && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <CommunityTab 
                                        onPlayLevel={props.onPlayCommunityLevel}
                                        isGuest={props.isGuest}
                                        likedLevels={props.likedLevels}
                                        onToggleLike={props.onToggleLike}
                                        onLogin={props.onLogin}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialHub;
