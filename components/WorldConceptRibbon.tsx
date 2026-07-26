import React, { useEffect, useState } from 'react';
import { World } from '../types';

interface WorldConceptRibbonProps {
  world: World;
  worldIndex: number;
  total: number;
  onDone: () => void;
}

// A slim, non-blocking banner that slides down the first time a player enters a
// campaign world. It introduces that world's MONEY CONCEPT (earning, needs vs
// wants, comparing, traps, not wasting, saving, goals, budgeting, risk, mastery)
// and ties it to the new puzzle mechanic the world unlocks. Auto-dismisses; the
// level is fully playable underneath. Tap to dismiss early. Mirrors the Money
// Mountain MissionRibbon so the campaign reads as the same money curriculum.
const WorldConceptRibbon: React.FC<WorldConceptRibbonProps> = ({ world, worldIndex, total, onDone }) => {
  const [leaving, setLeaving] = useState(false);
  const concept = world.moneyConcept;

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 6000);
    const done = setTimeout(onDone, 6500);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  if (!concept) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] lg:top-24 z-[55] flex justify-center px-3">
      <button
        type="button"
        onClick={() => { setLeaving(true); setTimeout(onDone, 250); }}
        className={`pointer-events-auto w-full max-w-md rounded-2xl border border-amber-400/30 bg-slate-900/90 backdrop-blur-md px-4 py-3 shadow-2xl text-left transition-all duration-300 ${leaving ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0 animate-in slide-in-from-top-3 fade-in'}`}
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(251,191,36,0.12)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0" role="img" aria-hidden="true">{concept.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/70">Money Skill</p>
              <span className="text-[9px] font-bold text-white/35">World {worldIndex + 1}/{total} • {concept.title}</span>
            </div>
            <p className="text-sm font-bold text-amber-100 leading-snug">{concept.lesson}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-white/55 leading-snug">{concept.mission}</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default WorldConceptRibbon;
