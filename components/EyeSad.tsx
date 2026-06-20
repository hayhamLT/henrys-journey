
import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeSad: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  // Rotate outwards to create drooping eyelid effect
  const rotation = dir === 'left' ? -20 : 20;

  return (
    <g 
      className="bot-eye-group" 
      style={{ 
        animation: 'eye-sad-tremble-anim 0.5s infinite',
        transformOrigin: `${cx}px ${cy}px`,
        transform: `rotate(${rotation}deg)` 
      }}
    >
        {/* Sclera with flattened top (eyelid) */}
        <path
            d={`
                M ${cx - 3.8} ${cy} 
                A 3.8 3.8 0 0 0 ${cx + 3.8} ${cy}
                Q ${cx} ${cy - 3} ${cx - 3.8} ${cy}
            `}
            className="bot-eye-sclera"
            fill="white"
        />
        
        {/* Pupil looking down */}
        <circle cx={cx} cy={cy + 1.2} r="1.5" className="bot-eye-pupil" fill="#333" />
        
        {/* Eyelid definition line */}
        <path 
            d={`M ${cx - 3.8} ${cy} Q ${cx} ${cy - 3} ${cx + 3.8} ${cy}`} 
            stroke="#333" 
            strokeWidth="0.5" 
            fill="none" 
        />
    </g>
  );
};

export default EyeSad;
