
import React from 'react';
import { ICONS } from './icons';

const StepCard: React.FC<{ number: string; title: string; desc: string; icon: React.ReactNode; color: string }> = ({ number, title, desc, icon, color }) => (
    <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 group hover:bg-white/10 transition-colors backdrop-blur-md">
        <div className={`absolute -right-4 -bottom-4 p-3 opacity-10 scale-[3] transition-transform group-hover:scale-[3.5] ${color}`}>
            {icon}
        </div>
        <div className="relative z-10 flex gap-4">
            <div className={`text-4xl font-black ${color} opacity-30 font-display`}>{number}</div>
            <div>
                <h3 className="text-sm font-black text-white mb-1">{title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
    </div>
);

const LegendItem: React.FC<{ icon: React.ReactNode; title: string; desc: string; color?: string }> = ({ icon, title, desc, color = "text-white" }) => (
    <div className="flex items-center gap-3 p-3 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${color}`}>
            <div className="scale-100">{icon}</div>
        </div>
        <div className="min-w-0">
            <div className={`text-[10px] font-black truncate text-white`}>{title}</div>
            <div className="text-[9px] text-slate-400 font-medium truncate leading-tight">{desc}</div>
        </div>
    </div>
);

const ModeItem: React.FC<{ title: string; desc: string; icon: React.ReactNode; color: string }> = ({ title, desc, icon, color }) => (
    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-4 flex gap-4 items-start hover:bg-white/5 transition-colors">
        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 ${color}`}>
            <div className="scale-125">{icon}</div>
        </div>
        <div>
            <h4 className={`text-xs font-black mb-1 ${color}`}>{title}</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

const HelpTab: React.FC = () => {
  return (
    <div className="w-full space-y-8 pb-12">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-black text-white font-display">How to Play</h2>
            <div className="h-1 w-12 bg-[var(--accent-blue)] mx-auto rounded-full"></div>
            <p className="text-xs text-slate-400 font-bold tracking-wide">Learn the basics</p>
        </div>

        {/* Core Loop */}
        <div className="space-y-3">
            <StepCard
                number="01"
                title="Plan"
                desc="Spot every coin to collect, then plan a safe path home. Planning is free!"
                icon={<ICONS.Map />}
                color="text-blue-400"
            />
            <StepCard
                number="02"
                title="Tap Arrows"
                desc="Tap arrows to set moves. Fewer moves means a cheaper, smarter route."
                icon={<ICONS.Moves />}
                color="text-yellow-400"
            />
            <StepCard
                number="03"
                title="Earn"
                desc="Hit Play. Collect every coin and reach the exit to bank your earnings!"
                icon={<ICONS.Play />}
                color="text-green-400"
            />
        </div>

        {/* Money Skills */}
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-amber-300/60 border-b border-amber-400/15 pb-2 px-1">Money Skills You'll Learn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <LegendItem icon={<span className="text-base">💼</span>} title="Earning" desc="Coins come from doing the work." color="text-amber-300" />
                <LegendItem icon={<span className="text-base">🐷</span>} title="Saving" desc="Keep coins to reach bigger goals." color="text-emerald-300" />
                <LegendItem icon={<span className="text-base">🍎</span>} title="Needs vs Wants" desc="Pay for needs first, wants later." color="text-rose-300" />
                <LegendItem icon={<span className="text-base">🗺️</span>} title="Budgeting" desc="A move budget is a money plan." color="text-blue-300" />
                <LegendItem icon={<span className="text-base">🌱</span>} title="Growing It" desc="Patience and interest grow money." color="text-green-300" />
                <LegendItem icon={<span className="text-base">🎁</span>} title="Sharing" desc="Money can help other people too." color="text-purple-300" />
            </div>
            <p className="text-[10px] text-white/40 text-center font-medium px-4">
                Master all ten lessons on <span className="text-amber-300 font-bold">Money Mountain</span> on the home screen!
            </p>
        </div>

        {/* Legend */}
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 border-b border-white/5 pb-2 px-1">What you'll find</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <LegendItem icon={<ICONS.PortalTool color="#4ECDC4"/>} title="Portal" desc="Where you start and finish." color="text-[var(--accent-cyan)]" />
                <LegendItem icon={<ICONS.GemTool />} title="Coin" desc="Your paycheck — collect them all." color="text-emerald-400" />
                <LegendItem icon={<ICONS.KeyTool2D color="#F59E0B" />} title="Key" desc="Unlocks matching Gates." color="text-amber-400" />
                <LegendItem icon={<ICONS.LockTool2D color="#F43F5E" />} title="Gate" desc="Blocked until Key is collected." color="text-rose-400" />
                <LegendItem icon={<ICONS.HoleTool2D />} title="Hole" desc="Don't fall in!" color="text-slate-400" />
                <LegendItem icon={<ICONS.BombTool />} title="Bomb" desc="Boom! Avoid it." color="text-red-500" />
                <LegendItem icon={<ICONS.CrumblingFloorTool2D />} title="Fragile Tile" desc="Collapses after use." color="text-stone-400" />
                <LegendItem icon={<ICONS.PortalTool color="#A855F7" />} title="Teleporter" desc="Warps to matching pad." color="text-purple-400" />
            </div>
        </div>

        {/* Game Modes (Replaces Tips) */}
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 border-b border-white/5 pb-2 px-1">Special Modes</h3>
            <div className="grid grid-cols-1 gap-3">
                <ModeItem
                    title="Daily Allowance"
                    desc="Earn coins with a fresh 20-level run every day. Keep your streak going to build a saving habit. You have 3 lives — survive and rank up."
                    icon={<ICONS.Star filled />}
                    color="text-[var(--accent-orange)]"
                />
                <ModeItem
                    title="Co-op"
                    desc="Team up with a friend to control separate bots in puzzles that depend on each other. Earning is better together!"
                    icon={<ICONS.Friends />}
                    color="text-[var(--accent-green)]"
                />
                <ModeItem
                    title="Earnings Arena"
                    desc="Live competitive events. Compete to earn the most coins within the time limit. Speed and efficiency pay off."
                    icon={<ICONS.Trophy />}
                    color="text-[var(--accent-yellow)]"
                />
                <ModeItem 
                    title="Level Builder" 
                    desc="Creative mode. Design your own complex challenges using all game objects. Save them or publish to the Community Galaxy."
                    icon={<ICONS.Builder />}
                    color="text-[var(--accent-blue)]"
                />
            </div>
        </div>
    </div>
  );
};

export default HelpTab;
