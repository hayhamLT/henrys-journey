import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeDestroyed: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const size = 3;
  return (
    <g 
      className="bot-eye-group" 
      stroke="#333" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    >
      <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size} />
      <line x1={cx - size} y1={cy + size} x2={cx + size} y2={cy - size} />
    </g>
  );
};

export default EyeDestroyed;