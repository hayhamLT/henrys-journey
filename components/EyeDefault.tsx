import React from 'react';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeDefault: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const pupilCx = dir === 'left' ? cx : cx + 1;
  const pupilCy = dir === 'left' ? cy + 1 : cy;
  
  return (
    <g className="bot-eye-group">
      <circle cx={cx} cy={cy} r="4" className="bot-eye-sclera"/>
      <circle 
        cx={pupilCx} 
        cy={pupilCy} 
        r="2" 
        className="bot-eye-pupil"
        style={{ transformOrigin: `${pupilCx}px ${pupilCy}px` }}
      />
    </g>
  );
};

export default EyeDefault;