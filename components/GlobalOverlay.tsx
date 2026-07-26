
import React, { useState, lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import LevelSelector from './LevelSelector';
import HelpTab from './HelpTab';
import { ICONS } from './icons';
import { LevelResult, World, HatState, HatId, UserProfile, GameInvite, CustomLevelEntry, CharacterAppearance, GameSettings } from '../types';
import AboutTab from './AboutTab';
import SocialHub from './SocialHub';
import LoginRequiredPanel from './LoginRequiredPanel';
import SettingsTab from './SettingsTab';

const ShopTab = lazy(() => import('./ShopTab'));

interface GlobalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  resultsByLevel: { [level: number]: LevelResult };
  currentLevelIndex: number;
  onSelectLevel: (levelIndex: number) => void;
  onResetProgress: () => void;
  onDeleteAccount: () => void;
  allWorlds: World[];
  onDeleteLevel: (levelIndex: number) => void;
  onPublishLevel?: (levelIndex: number) => void; 
  initialTab: Tab;
  initialSocialTab?: 'crew' | 'inbox' | 'find'; 
  totalScore: number;
  hatState: HatState;
  onBuyHat: (hatId: HatId, price: number) => void;
  onEquipHat: (hatId: HatId) => void;
  onEnterBuilder: () => void;
  onReturnToMainMenu?: () => void;
  currentUserUid?: string;
  onPlayCommunityLevel?: (levelData: any) => void;
  onOpenUserSearch?: () => void;
  isGuest?: boolean;
  onLogin?: () => Promise<void>;
  user?: UserProfile | null;
  onUpdateName?: (name: string) => void;
  onUpdatePhoto?: (photo: string) => void;
  onLogout?: () => void;
  invites?: GameInvite[];
  challengeData?: any;
  likedLevels?: string[];
  onToggleLike?: (levelId: string, isLiking: boolean) => void;
  onJoinTournament?: () => void;
  onStartCoop?: (gameId: string) => void;
  onJoinCoop?: (gameId: string) => void;
  activeCoopGameId?: string | null;
  customLevels?: CustomLevelEntry[]; 
  onChallengeWithLevel?: (level: CustomLevelEntry) => void; 
  appearance?: CharacterAppearance;
  onUpdateAppearance?: (newAppearance: CharacterAppearance) => void;
    onShareLevel?: (level: CustomLevelEntry) => void;
  autoSolvers?: number;
  onBuyConsumable?: (id: string, price: number) => void;
  settings?: GameSettings;
  onSettingsChange?: (newSettings: Partial<GameSettings>) => void;
    onUnlockAll?: () => void;
    cloudStatus?: 'synced' | 'saving' | 'error' | 'offline';
    setCloudStatus?: (status: 'synced' | 'saving' | 'error' | 'offline') => void;
}

export type Tab = 'levels' | 'online' | 'shop' | 'help' | 'settings' | 'about' | 'connect' | 'community' | 'profile' | 'social' | 'leaderboard' | 'friends' | 'inbox';

export const GlobalOverlay: React.FC<GlobalOverlayProps> = (props) => {
    const { isOpen, onClose, initialTab, isGuest, onLogin, user, invites = [], cloudStatus = 'synced', setCloudStatus } = props;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab === 'profile' || initialTab === 'social' || initialTab === 'leaderboard' || initialTab === 'community' ? 'online' : initialTab as Tab);

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
      if (isOpen) {
          setIsRendered(true);
          requestAnimationFrame(() => {
              requestAnimationFrame(() => setIsVisible(true));
          });
          document.body.style.setProperty('--scroll-y', '0px');
      } else {
          setIsVisible(false);
          const t = setTimeout(() => setIsRendered(false), 300);
          return () => clearTimeout(t);
      }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      requestAnimationFrame(() => {
          document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
      });
  };

  const currentTabs = useMemo(() => {
      const showRestricted = user && !isGuest;
      const mainTabs = [
        { id: 'levels', label: 'Levels', icon: ICONS.Map },
        { id: 'online', label: 'Online', icon: ICONS.Community },
        { id: 'shop', label: 'Customize', icon: ICONS.Shop },
        { id: 'settings', label: 'Settings', icon: ICONS.Settings },
        { id: 'help', label: 'Guide', icon: ICONS.Help },
        { id: 'about', label: 'About', icon: ICONS.Info },
      ] as const;

      if (!showRestricted) {
          return mainTabs.map(t => t.id === 'online' ? { id: 'connect', label: 'Connect', icon: ICONS.User } : t);
      }
      return mainTabs;
  }, [user, isGuest]);

  useEffect(() => {
      if (isOpen) {
          if (['profile', 'social', 'leaderboard', 'community'].includes(initialTab as string)) {
              if (isGuest || !user) {
                  setActiveTab('connect');
              } else {
                  setActiveTab('online');
              }
          } else if (initialTab === 'settings' as any) {
              setActiveTab('settings');
          } else {
              setActiveTab(initialTab as Tab);
          }
      }
  }, [isOpen, initialTab, isGuest, user]);

  // Cloud sync banner and indicator
  const [showCloudBanner, setShowCloudBanner] = useState(false);
  useEffect(() => {
      if (cloudStatus === 'error' || cloudStatus === 'offline') {
          setShowCloudBanner(true);
          setTimeout(() => setShowCloudBanner(false), 6000);
      }
  }, [cloudStatus]);

  if (!isRendered) return null;

    const handleRetrySync = async () => {
        if (user?.uid && setCloudStatus) {
            setCloudStatus('saving');
            try {
                // @ts-ignore
                await import('../firebase').then(mod => mod.saveUserData(user.uid, { lastLogin: Date.now() }));
                setCloudStatus('synced');
            } catch (e) {
                setCloudStatus('error');
            }
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] sm:p-4 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Main Menu Overlay"
            tabIndex={-1}
        >
            <div 
                className={`w-full h-full sm:max-w-5xl sm:h-[85vh] sm:max-h-[800px] liquid-glass sm:rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
                onClick={e => e.stopPropagation()}
                role="document"
            >
                {/* Cloud Sync Banner */}
                {showCloudBanner && (
                    <div className="fixed top-0 left-0 w-full z-[1001] flex justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                        <div className={`px-4 py-2 rounded-lg font-bold text-white shadow-lg ${cloudStatus === 'error' ? 'bg-red-600' : 'bg-yellow-500'} text-center`}>
                            {cloudStatus === 'error' ? 'Cloud Sync Failed. Progress is saved locally.' : 'Offline Mode: Progress will sync when online.'}
                            <button
                                className="ml-4 px-3 py-1 rounded bg-white/20 hover:bg-white/40 text-white font-bold"
                                onClick={e => { e.stopPropagation(); handleRetrySync(); }}
                                disabled={cloudStatus === 'saving'}
                            >Retry Sync</button>
                        </div>
                    </div>
                )}
                {/* Cloud Status Indicator (Settings/Profile area) */}
                <div className="absolute top-4 right-4 z-[1002] flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${cloudStatus === 'synced' ? 'bg-green-500' : cloudStatus === 'saving' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="text-xs font-bold text-white/80">{cloudStatus === 'synced' ? 'Cloud Synced' : cloudStatus === 'saving' ? 'Syncing...' : cloudStatus === 'error' ? 'Sync Error' : 'Offline'}</span>
                </div>
                <div className="flex flex-row h-full">
                    {/* Sidebar Navigation - Glass */}
                    <nav className="w-16 sm:w-56 border-r border-white/5 flex flex-col shrink-0 relative z-10 transition-all bg-white/5 h-full">
                        <div className="p-4 border-b border-white/5 flex items-center justify-center sm:justify-end h-16 lg:h-20 shrink-0">
                            <button onClick={onClose} className="hidden sm:block text-white/40 hover:text-white transition-colors p-2">
                                <ICONS.Remove />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
                            {currentTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`w-full p-3 rounded-xl flex items-center justify-center sm:justify-start gap-3 transition-all duration-200 relative group
                                        ${activeTab === tab.id 
                                            ? 'bg-white/10 text-white font-black shadow-sm backdrop-blur-md border border-white/10' 
                                            : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <div className={`w-6 h-6 flex items-center justify-center transition-colors ${activeTab === tab.id ? 'text-[var(--accent-cyan)] scale-110' : 'group-hover:scale-105'}`}>
                                        <tab.icon />
                                    </div>
                                    <span className="hidden sm:block text-xs">{tab.label}</span>
                                    {(tab.id === 'online' || (tab.id === 'connect' && invites.length > 0)) && invites.length > 0 && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                                    )}
                                    {activeTab === 'online' && tab.id === 'online' && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full shadow-sm hidden sm:block animate-pulse"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
                    {props.onEnterBuilder && (
                        <button onClick={props.onEnterBuilder} className="w-full p-2.5 rounded-lg flex items-center justify-center sm:justify-start gap-3 text-white/40 border border-white/5 hover:bg-white/5 hover:border-white/10 hover:text-white transition-all shadow-sm group">
                            <div className="text-white/30 group-hover:text-[var(--accent-orange)] transition-colors"><ICONS.Builder /></div>
                            <span className="hidden sm:block text-xs font-bold">Builder</span>
                        </button>
                    )}
                    {props.onReturnToMainMenu && (
                        <button onClick={props.onReturnToMainMenu} className="w-full p-2.5 rounded-lg flex items-center justify-center sm:justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                            <div className="scale-90"><ICONS.Exit /></div>
                            <span className="hidden sm:block text-xs font-bold">Exit Home</span>
                        </button>
                    )}
                </div>
            </nav>
            
            {/* Main Content Area */}
            <div className="flex-grow flex flex-col min-w-0 bg-transparent h-full w-[calc(100%-4rem)] sm:w-auto">
                <div className="sm:hidden p-3 border-b border-white/5 flex justify-between items-center h-16 shrink-0 sticky top-0 z-20 shadow-sm bg-black/20 backdrop-blur-xl">
                    <span className="font-black text-white text-sm pl-2">{activeTab === 'shop' ? 'Customize' : activeTab}</span>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <ICONS.Remove />
                    </button>
                </div>

                <div 
                    className="flex-grow overflow-y-auto no-scrollbar" 
                    style={{ scrollBehavior: 'smooth' }}
                    onScroll={handleScroll}
                >
                    <div className={`${activeTab === 'shop' || activeTab === 'online' ? 'p-0 h-full' : 'p-3 sm:p-6'}`}>
                        {activeTab === 'levels' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <LevelSelector 
                                    {...props} 
                                    onPublishLevel={props.onPublishLevel} 
                                    onChallenge={props.onChallengeWithLevel} 
                                />
                            </div>
                        )}

                        {activeTab === 'online' && (
                            <SocialHub 
                                userUid={user?.uid || ''}
                                userName={user?.name || ''}
                                userPhoto={user?.picture}
                                isGuest={isGuest}
                                onLogin={onLogin}
                                invites={invites}
                                initialTab={props.initialSocialTab as any}
                                challengeData={props.challengeData}
                                onStartCoop={props.onStartCoop}
                                onJoinCoop={props.onJoinCoop}
                                activeCoopGameId={props.activeCoopGameId}
                                totalScore={props.totalScore}
                                completedLevels={Object.keys(props.resultsByLevel).filter(k => props.resultsByLevel[Number(k)]?.time > 0).length}
                                onUpdateName={props.onUpdateName}
                                onUpdatePhoto={props.onUpdatePhoto}
                                onLogout={props.onLogout}
                                onDeleteAccount={props.onDeleteAccount}
                                onJoinTournament={props.onJoinTournament}
                                onPlayCommunityLevel={props.onPlayCommunityLevel}
                                likedLevels={props.likedLevels}
                                onToggleLike={props.onToggleLike}
                                customLevels={props.customLevels}
                                onShareLevel={props.onShareLevel}
                                onDeleteLevel={props.onDeleteLevel}
                                onEnterBuilder={props.onEnterBuilder}
                            />
                        )}

                        {activeTab === 'connect' && (
                            <LoginRequiredPanel 
                                featureName="Online Services"
                                description="Connect to access cloud saving, leaderboards, and social features."
                                onLogin={onLogin || (() => Promise.resolve())}
                                variant="dark"
                            />
                        )}

                        {activeTab === 'shop' && (
                            <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-white/40">Loading Customization...</div>}>
                                    <ShopTab 
                                        totalScore={props.totalScore}
                                        hatState={props.hatState}
                                        onBuyHat={props.onBuyHat}
                                        onEquipHat={props.onEquipHat}
                                        appearance={props.appearance}
                                        onUpdateAppearance={props.onUpdateAppearance}
                                        autoSolvers={props.autoSolvers}
                                        onBuyConsumable={props.onBuyConsumable}
                                    />
                                </Suspense>
                            </div>
                        )}

                        {activeTab === 'settings' && props.settings && props.onSettingsChange && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <SettingsTab 
                                    settings={props.settings}
                                    onSettingsChange={props.onSettingsChange}
                                    onResetProgress={props.onResetProgress}
                                    onUnlockAll={props.onUnlockAll || (() => {})}
                                />
                            </div>
                        )}

                        {activeTab === 'help' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <HelpTab />
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <AboutTab />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
