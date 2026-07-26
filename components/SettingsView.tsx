
import React, { useState, useEffect } from 'react';
import SettingsTab from './SettingsTab';
import HelpTab from './HelpTab';
import AboutTab from './AboutTab';
import { GameSettings, AppState } from '../types';
import { ICONS } from './icons';

interface SettingsViewProps {
    settings: GameSettings;
    onSettingsChange: (newSettings: Partial<GameSettings>) => void;
    onResetProgress: () => void;
    onUnlockAll: () => void;
    onNavigate?: (state: AppState) => void;
    initialTab?: 'settings' | 'help' | 'about';
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { initialTab } = props;
    const [activeTab, setActiveTab] = useState<'settings' | 'help' | 'about'>(initialTab || 'settings');

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

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

    const getTitle = () => {
        switch(activeTab) {
            case 'help': return 'Guide';
            case 'about': return 'About';
            default: return 'Settings';
        }
    };

    const getSubtitle = () => {
        switch(activeTab) {
            case 'help': return 'Learn the basics';
            case 'about': return 'About this game';
            default: return 'Preferences & Options';
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-300">
            <div className="h-16 lg:h-20 px-4 lg:px-6 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--accent-blue)] scale-125">
                        {activeTab === 'settings' ? <ICONS.Settings /> : activeTab === 'help' ? <ICONS.Help /> : <ICONS.Info />}
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white font-display">{getTitle()}</h2>
                        <p className="text-xs text-white/50 font-medium">{getSubtitle()}</p>
                    </div>
                </div>
            </div>

            <div 
                className="flex-grow overflow-y-auto no-scrollbar p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6"
                onScroll={handleScroll}
            >
                
                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <SettingsTab {...props} />
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
    );
};

export default SettingsView;
