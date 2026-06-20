import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeHappy: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const pathD = `M ${cx - 3} ${cy - 1.5} L ${cx} ${cy + 1.5} L ${cx + 3} ${cy - 1.5}`;

  return (
    <g 
      className="bot-eye-group"
      style={{
        animation: 'pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        transformOrigin: `${cx}px ${cy}px`,
      }}
    >
      <circle cx={cx} cy={cy} r="4.5" className="bot-eye-sclera" />
      <path 
        d={pathD} 
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

export default EyeHappy;