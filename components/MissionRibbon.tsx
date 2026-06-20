import React, { useEffect, useState } from 'react';
import { MoneyLesson } from '../constants/finlit';

interface MissionRibbonProps {
  lesson: MoneyLesson;
  lessonIndex: number;
  total: number;
  onDone: () => void;
}

// A slim, non-blocking banner that slides down at the start of a Money Mountain
// level. It states the one-line "mission" (the lesson framing) and auto-dismisses
// — the level is playable immediately, no modal, no gate. Tap to dismiss early.
const MissionRibbon: React.FC<MissionRibbonProps> = ({ lesson, lessonIndex, total, onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 5200);
    const done = setTimeout(onDone, 5700);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] lg:top-24 z-[55] flex justify-center px-3">
      <button
        type="button"
        onClick={() => { setLeaving(true); setTimeout(onDone, 250); }}
        className={`pointer-events-auto w-full max-w-md rounded-2xl border border-amber-400/30 bg-slate-900/90 backdrop-blur-md px-4 py-3 shadow-2xl text-left transition-all duration-300 ${leaving ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0 animate-in slide-in-from-top-3 fade-in'}`}
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(251,191,36,0.12)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0" role="img" aria-hidden="true">{lesson.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/70">Mission</p>
              <span className="text-[9px] font-bold text-white/35">Lesson {lessonIndex + 1}/{total}</span>
            </div>
            <p className="text-sm font-bold text-amber-100 leading-snug">{lesson.mission}</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MissionRibbon;
