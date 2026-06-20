import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeLove: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const heartPathD = `M ${cx} ${cy+1.5} L ${cx-2.5} ${cy-1} A 1.5 1.5 0 0 1 ${cx} ${cy-1} A 1.5 1.5 0 0 1 ${cx+2.5} ${cy-1} Z`;

  return (
    <g className="bot-eye-group">
      <circle cx={cx} cy={cy} r="4" className="bot-eye-sclera"/>
      <path d={heartPathD} fill="#FF6B6B" />
    </g>
  );
};

export default EyeLove;