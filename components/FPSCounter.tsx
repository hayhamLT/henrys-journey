
import React, { useRef, useEffect, useState } from 'react';

const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let requestID: number;

    const tick = (now: number) => {
      frameCount.current++;
      if (now - lastTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = now;
      }
      requestID = requestAnimationFrame(tick);
    };

    requestID = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(requestID);
  }, []);

  return (
    <div className="fixed top-1 right-1 z-[9999] pointer-events-none select-none opacity-60 mix-blend-difference">
        <div className="text-[9px] font-mono font-black text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
            {fps} FPS
        </div>
    </div>
  );
};

export default FPSCounter;
