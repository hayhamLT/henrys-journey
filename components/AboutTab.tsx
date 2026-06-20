
import React, { useState } from 'react';
import { ICONS } from './icons';
import { CoinIcon } from './CoinIcon';
import { APP_VERSION } from '../constants/game';

const FeaturePill: React.FC<{ icon: React.ReactNode, label: string, color?: string }> = ({ icon, label, color = "text-white" }) => (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/5">
        <div className={`${color} scale-90`}>{icon}</div>
        <span className="text-[10px] font-bold text-slate-300">{label}</span>
    </div>
);

const AboutTab: React.FC = () => {
  const [shareText, setShareText] = useState("Share Game");

  const handleDonate = () => {
      window.open('https://www.paypal.com/donate/?business=hayhamlt@gmail.com&no_recurring=0&currency_code=USD&amount=5', '_blank');
  };

  const handleShare = async () => {
      const url = "https://henrysjourney.app";
      const text = "Help Henry earn, save & spend smart! 🪙✨ A money-skills puzzle adventure for kids — play instantly in your browser.";
      const shareData = {
          title: "Henry's Journey",
          text: text,
          url: url
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
          } catch (e) {
              // Share dismissed
          }
      } else {
          try {
              // Copy full pitch + URL for better context when pasting
              await navigator.clipboard.writeText(`${text} ${url}`);
              setShareText("Copied to Clipboard!");
              setTimeout(() => setShareText("Share Game"), 2000);
          } catch (e) {
              setShareText("henrysjourney.app");
          }
      }
  };

  return (
    <div className="flex flex-col items-center w-full pb-12">
        
        {/* --- HERO SECTION --- */}
        <div className="w-full max-w-lg text-center space-y-6 mt-4 mb-10">
            <div className="relative inline-block group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                <div className="w-32 h-32 bg-[#0f172a] rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-center relative z-10 overflow-hidden ring-1 ring-white/10">
                    <div className="scale-[4]"><ICONS.Bot /></div>
                </div>
            </div>

            <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white font-display mb-2 drop-shadow-xl">
                    Henry's<br/>Journey
                </h1>
                <div className="flex justify-center gap-2 mt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse"></div>
                        <span className="text-[9px] font-bold text-white/50">Live &bull; {APP_VERSION}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            <FeaturePill icon={<CoinIcon className="text-base" />} label="Money Skills" color="text-amber-300" />
            <FeaturePill icon={<ICONS.Builder />} label="Level Editor" color="text-[var(--accent-blue)]" />
            <FeaturePill icon={<ICONS.Trophy />} label="Earning Arena" color="text-[var(--accent-yellow)]" />
            <FeaturePill icon={<ICONS.Star filled />} label="Daily Allowance" color="text-[var(--accent-orange)]" />
        </div>

        {/* --- MANIFESTO --- */}
        <div className="w-full max-w-2xl space-y-4 mb-8">
            <div className="liquid-glass p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] transform rotate-12 scale-[3] pointer-events-none transition-transform group-hover:rotate-0">
                    <ICONS.CPU />
                </div>

                <h3 className="text-xs font-black text-teal-400 mb-4 flex items-center gap-2">
                    <ICONS.Info /> The Story
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    A puzzle adventure that quietly teaches real money skills. Henry earns coins by delivering packages, learns to save toward goals, and discovers how to budget, spend smart, and grow his money — one clever route at a time. Fun first, money-smart for life.
                </p>
            </div>
        </div>

        {/* --- ACTIONS --- */}
        <div className="w-full max-w-2xl mb-8 flex flex-col sm:flex-row gap-3">
            <button 
                onClick={handleShare}
                className="flex-1 modern-button py-4 bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/30 hover:bg-[var(--accent-green)]/20 active:scale-95 transition-all"
            >
                <div className="flex items-center gap-2">
                    {shareText.includes("Copied") ? <ICONS.Check /> : <ICONS.Share />}
                    <span>{shareText}</span>
                </div>
            </button>
            <button 
                onClick={handleDonate}
                className="flex-1 modern-button py-4 bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] border-[var(--accent-yellow)]/30 hover:bg-[var(--accent-yellow)]/20"
            >
                <div className="flex items-center gap-2">
                    <span>☕</span>
                    <span>Fuel The Dev</span>
                </div>
            </button>
        </div>

        {/* --- FOOTER --- */}
        <div className="w-full max-w-2xl border-t border-white/5 pt-8 text-center">
            <p className="text-[10px] text-slate-600 font-bold mb-2">Made with love by</p>
            <div className="inline-block px-4 py-1.5 rounded-lg bg-black/30 border border-white/5 text-[10px] font-black text-slate-400">
                hamLT Studios
            </div>
            <div className="mt-6 text-[9px] text-slate-700 font-mono">
                &copy; {new Date().getFullYear()} Henry's Journey. Have fun!
            </div>
        </div>

    </div>
  );
};

export default AboutTab;
