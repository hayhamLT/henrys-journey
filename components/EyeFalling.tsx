import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeFalling: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  return (
    <g className="bot-eye-group" style={{ animation: 'eye-sad-tremble-anim 0.2s infinite' }}>
      <circle cx={cx} cy={cy} r="4.5" className="bot-eye-sclera" />
      <circle cx={cx} cy={cy} r="1.5" className="bot-eye-pupil" fill="#333" />
    </g>
  );
};

export default EyeFalling;