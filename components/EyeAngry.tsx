import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeAngry: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const pathD = `M ${cx-2.5} ${cy-2} L ${cx} ${cy+1} L ${cx+2.5} ${cy-2}`;
  
  return (
    <g 
      className="bot-eye-group"
      style={{ animation: 'angry-shake-anim 0.3s infinite' }}
    >
      <circle cx={cx} cy={cy} r="4" className="bot-eye-sclera" />
      <path d={pathD} className="bot-eye-angry" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
};

export default EyeAngry;