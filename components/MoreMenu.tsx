
import React, { useEffect } from 'react';
import { ICONS } from './icons';
import { AppState } from '../types';

interface MoreMenuProps {
    onClose: () => void;
    onNavigate: (state: AppState) => void;
    onSettings: () => void;
    onOpenDaily: () => void;
    onOpenShop: () => void;
}

const MenuItem: React.FC<{ 
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void,
    color?: string,
    delay?: number
}> = ({ icon, label, onClick, color = "text-white", delay = 0 }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 active:bg-white/10 transition-colors group animate-in slide-in-from-bottom-4 fade-in duration-300"
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
        <div className={`scale-110 ${color} transition-transform group-hover:scale-125 duration-300`}>{icon}</div>
        <span className="text-xs font-black text-white text-left flex-grow opacity-80 group-hover:opacity-100 transition-opacity">{label}</span>
        <div className="text-white/10 group-hover:text-white/40 transition-colors transform group-hover:translate-x-1 duration-300"><ICONS.Right /></div>
    </button>
);

const MoreMenu: React.FC<MoreMenuProps> = ({ onClose, onNavigate, onSettings, onOpenDaily, onOpenShop }) => {
    // Prevent scrolling on body when menu is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
                onClick={onClose}
            />
            
            {/* Menu Sheet */}
            <div className="relative w-full bg-[var(--panel-bg)] backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-safe animate-in slide-in-from-bottom-full duration-300 ease-out">
                {/* Handle */}
                <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
                </div>
                
                <div className="flex flex-col py-2">
                    <MenuItem
                        icon={<ICONS.Star filled />}
                        label="Daily Allowance"
                        onClick={() => { onClose(); onOpenDaily(); }}
                        color="text-[var(--accent-orange)]"
                        delay={0}
                    />
                    <MenuItem 
                        icon={<ICONS.Friends />} 
                        label="Co-op" 
                        onClick={() => { onClose(); onNavigate('coop_lobby'); }} 
                        color="text-[var(--accent-green)]"
                        delay={50}
                    />
                    <MenuItem 
                        icon={<ICONS.Builder />} 
                        label="Level Builder" 
                        onClick={() => { onClose(); onNavigate('build'); }} 
                        color="text-indigo-400"
                        delay={100}
                    />
                    <MenuItem
                        icon={<ICONS.Shop />}
                        label="Savings Shop"
                        onClick={() => { onClose(); onOpenShop(); }}
                        color="text-[var(--accent-magenta)]"
                        delay={150}
                    />
                    
                    <div className="h-px bg-white/5 my-2 mx-6" />
                    
                    <MenuItem 
                        icon={<ICONS.Help />} 
                        label="Guide" 
                        onClick={() => { onClose(); onNavigate('help'); }} 
                        color="text-emerald-400"
                        delay={200}
                    />
                    <MenuItem 
                        icon={<ICONS.Info />} 
                        label="About" 
                        onClick={() => { onClose(); onNavigate('about'); }} 
                        color="text-blue-400"
                        delay={250}
                    />
                    <MenuItem 
                        icon={<ICONS.Settings />} 
                        label="Settings" 
                        onClick={() => { onClose(); onSettings(); }} 
                        color="text-slate-400"
                        delay={300}
                    />
                </div>
            </div>
        </div>
    );
};

export default MoreMenu;
