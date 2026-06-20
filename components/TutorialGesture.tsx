
import React, { useEffect, useState } from 'react';
import { Move } from '../types';

interface TutorialGestureProps {
  gesture: Move | 'tap' | null;
}

const TutorialGesture: React.FC<TutorialGestureProps> = ({ gesture }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (gesture) {
      // Delay start to allow user to orient themselves
      const timer = setTimeout(() => {
        setVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gesture]);

  if (!gesture || !visible) return null;

  const isTap = gesture === 'tap';
  
  // Rotation Logic to align the Y-axis animation with the swipe direction
  // Base Animation: Moves from +Y (Bottom) to -Y (Top) => "Up" direction
  let rotation = 0;
  if (gesture === Move.Up) rotation = 0;
  else if (gesture === Move.Down) rotation = 180;
  else if (gesture === Move.Left) rotation = -90;
  else if (gesture === Move.Right) rotation = 90;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
        {isTap ? (
            <div className="tap-gesture-container">
                <div className="tap-gesture-dot"></div>
                <div className="tap-gesture-ring"></div>
            </div>
        ) : (
            <div 
                key={gesture}
                className="tutorial-swipe-container" 
                style={{ transform: `rotate(${rotation}deg)` }}
            >
               <div className="tutorial-swipe-circle" />
            </div>
        )}
    </div>
  );
};

export default TutorialGesture;
