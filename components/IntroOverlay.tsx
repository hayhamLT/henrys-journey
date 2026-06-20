
import React, { useEffect, useState } from 'react';
import { ICONS } from './icons';

interface IntroOverlayProps {
    onDismiss: () => void;
    onOpenHelp: () => void;
    isTouchDevice: boolean;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onDismiss, onOpenHelp, isTouchDevice }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation slightly faster
        const enterTimer = setTimeout(() => setIsVisible(true), 10);

        return () => {
            clearTimeout(enterTimer);
        };
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Wait for fast exit animation
        setTimeout(onDismiss, 200); 
    };

    return (
        <div 
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm transition-all duration-300 ease-out transform origin-top ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Game Introduction"
            tabIndex={-1}
        >
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-black/5" role="document">
                <div className="p-3 flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <h2 className="text-xs font-black text-[var(--accent-blue)] mb-1 flex items-center gap-1">
                            <ICONS.Info /> Quick tip!
                        </h2>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                            1. Snatch <span className="text-[var(--accent-green)]">ALL GEMS</span>.<br/>
                            2. Get back to the <span className="text-[var(--accent-blue)]">START PORTAL</span> to escape!
                        </p>
                    </div>
                    <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-700 p-1 shrink-0 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                        <div className="scale-75"><ICONS.Remove /></div>
                    </button>
                </div>

                <div className="px-3 pb-3 flex gap-2">
                    <div className="flex-1 bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[var(--accent-blue)] flex items-center justify-center font-black text-[10px]">1</div>
                        <span className="text-[9px] font-black text-slate-500">
                            {isTouchDevice ? 'Plan Path' : 'Arrows'}
                        </span>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-[var(--accent-green)] flex items-center justify-center font-black text-[10px]">2</div>
                        <span className="text-[9px] font-black text-slate-500">Go!</span>
                    </div>
                </div>
                
                <button 
                    onClick={onOpenHelp}
                    className="w-full bg-slate-50/50 hover:bg-slate-100 py-1.5 text-[9px] font-bold text-slate-400 hover:text-[var(--accent-blue)] border-t border-slate-100 transition-colors flex items-center justify-center gap-1"
                >
                    Need Help?
                </button>
            </div>
        </div>
    );
};

export default IntroOverlay;
