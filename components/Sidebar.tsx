
import React, { useState, useEffect } from 'react';
import { ICONS } from './icons';
import { UserProfile, AppState } from '../types';

interface SidebarProps {
    activeState: AppState;
    onNavigate: (state: AppState, subTab?: string) => void;
    user: UserProfile | null;
    onLogin: () => void;
    inboxCount: number;
}

interface TooltipData {
    label: string;
    description: string;
    top: number;
}

const NavButton: React.FC<{ 
    icon: keyof typeof ICONS, 
    label: string,
    description: string, 
    isActive?: boolean, 
    onClick?: () => void, 
    badgeCount?: number,
    onHover: (label: string, desc: string, top: number) => void,
    onLeave: () => void
}> = ({ icon, label, description, isActive, onClick, badgeCount, onHover, onLeave }) => {
    const Icon = ICONS[icon];
    return (
        <button
            onClick={onClick}
            aria-label={label}
            title={label}
            onMouseEnter={(e) => onHover(label, description, e.currentTarget.getBoundingClientRect().top)}
            onMouseLeave={onLeave}
            className={`flex items-center justify-center w-full gap-4 p-3 rounded-2xl transition-all duration-300 font-bold text-[10px] sm:text-xs group relative overflow-hidden
                ${isActive
                    ? 'bg-emerald-400/15 text-white shadow-lg border border-emerald-300/40 backdrop-blur-md'
                    : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'}
            `}
        >
            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[var(--accent-green)]' : 'scale-100 group-hover:scale-110'}`}>
                <Icon />
            </div>
            
            {badgeCount ? (
                <div className={`absolute bg-[var(--accent-red)] rounded-full flex items-center justify-center text-[9px] text-white font-black animate-pulse shadow-sm z-10 top-2 right-2 w-3 h-3 border border-white/20`}>
                </div>
            ) : null}
            
            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activeState, onNavigate, user, onLogin, inboxCount }) => {
    const isGuest = !user || user.email.includes('guest');
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    const handleHover = (label: string, description: string, top: number) => {
        setTooltip({ label, description, top });
    };

    const handleLeave = () => {
        setTooltip(null);
    };

    return (
        <div 
            className={`hidden md:flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-2xl shrink-0 h-full z-50 shadow-2xl w-24 transition-all duration-300 ease-in-out relative pt-6`}
        >
             <div className="flex-grow space-y-2 px-4 overflow-y-auto no-scrollbar overflow-x-hidden">
                 <NavButton 
                    icon="Home" 
                    label="PLAY" 
                    description="Resume your journey"
                    isActive={activeState === 'main_menu' || activeState === 'play'} 
                    onClick={() => onNavigate('main_menu')}
                    onHover={handleHover}
                    onLeave={handleLeave}
                 />
                 <NavButton
                    icon="Star"
                    label="DAILY"
                    description="Earn your daily allowance"
                    isActive={activeState === 'daily_hub'}
                    onClick={() => onNavigate('daily_hub')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton 
                    icon="Friends" 
                    label="CO-OP" 
                    description="Play with friends"
                    isActive={activeState === 'coop_lobby' || activeState === 'coop_play'}
                    onClick={() => onNavigate('coop_lobby')} 
                    badgeCount={inboxCount}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton
                    icon="Trophy"
                    label="ARENA"
                    description="Compete to earn the most"
                    isActive={activeState === 'challenge_setup' || activeState === 'tournament_play'}
                    onClick={() => onNavigate('challenge_setup')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton 
                    icon="Builder" 
                    label="CREATE" 
                    description="Build custom levels"
                    isActive={activeState === 'build'} 
                    onClick={() => onNavigate('build')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton
                    icon="Shop"
                    label="SHOP"
                    description="Spend & save your coins"
                    isActive={activeState === 'shop'}
                    onClick={() => onNavigate('shop')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 
                 <div className="h-px bg-white/5 mx-2 my-2"></div>
                 
                 <NavButton 
                    icon="Help" 
                    label="GUIDE" 
                    description="Learn game mechanics"
                    isActive={activeState === 'help'} 
                    onClick={() => onNavigate('help')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton 
                    icon="Info" 
                    label="ABOUT" 
                    description="Credits & Game Info"
                    isActive={activeState === 'about'} 
                    onClick={() => onNavigate('about')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
                 <NavButton 
                    icon="Settings" 
                    label="SETTINGS" 
                    description="Preferences & Options"
                    isActive={activeState === 'settings'} 
                    onClick={() => onNavigate('settings')}
                    onHover={handleHover}
                    onLeave={handleLeave} 
                 />
             </div>

             <div className="p-4 mt-auto">
                {installPrompt && (
                    <button 
                        onClick={handleInstall}
                        onMouseEnter={(e) => handleHover("INSTALL", "Install App for offline play", e.currentTarget.getBoundingClientRect().top)}
                        onMouseLeave={handleLeave}
                        className={`w-full py-3 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white font-bold rounded-xl text-[10px] tracking-wide transition-all backdrop-blur-md mb-2 flex items-center justify-center gap-2 animate-pulse overflow-hidden px-0 shadow-lg`}
                    >
                        <ICONS.Upload /> 
                    </button>
                )}

                {user && !isGuest ? (
                    <div 
                        className={`border-t border-white/5 pt-4 flex items-center cursor-pointer hover:bg-white/5 rounded-xl transition-colors group justify-center p-2`} 
                        onClick={() => onNavigate('social', 'profile')}
                        onMouseEnter={(e) => handleHover("PROFILE", "View your stats", e.currentTarget.getBoundingClientRect().top)}
                        onMouseLeave={handleLeave}
                    >
                        <img src={user.picture || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} className="w-10 h-10 rounded-full bg-black/40 object-cover border border-white/20 group-hover:border-white/50 transition-colors shadow-lg" />
                    </div>
                ) : (
                    <button 
                        onClick={onLogin} 
                        onMouseEnter={(e) => handleHover("LOGIN", "Sign in to save progress", e.currentTarget.getBoundingClientRect().top)}
                        onMouseLeave={handleLeave}
                        className={`w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-[10px] tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 px-0 shadow-lg`}
                    >
                        <div className="scale-110"><ICONS.User /></div>
                    </button>
                )}
             </div>

             {/* Floating Tooltip */}
             {tooltip && (
                 <div 
                    className="fixed left-28 z-[60] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 shadow-2xl pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
                    style={{ top: tooltip.top + 8 }} 
                 >
                     <div className="text-[11px] font-extrabold text-[var(--accent-green)] tracking-wide mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>{tooltip.label}</div>
                     <div className="text-[10px] text-white/70 font-medium whitespace-nowrap">{tooltip.description}</div>
                     
                     {/* Arrow pointing left */}
                     <div className="absolute top-3 -left-1.5 w-3 h-3 bg-slate-900/90 border-l border-b border-white/10 transform rotate-45 backdrop-blur-md"></div>
                 </div>
             )}
        </div>
    );
};

export default Sidebar;
