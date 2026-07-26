import React from 'react';
import { EyeState } from '../types';
import EyeDefault from './EyeDefault';
import EyeHappy from './EyeHappy';
import EyeAngry from './EyeAngry';
import EyeFalling from './EyeFalling';
import EyeDestroyed from './EyeDestroyed';
import EyeSad from './EyeSad';
import EyeLove from './EyeLove';

interface EyePartProps {
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const EyeSleeping: React.FC<EyePartProps> = ({ cx, cy, dir }) => {
  const pathD = `M ${cx - 3} ${cy} C ${cx - 1.5} ${cy + 2}, ${cx + 1.5} ${cy + 2}, ${cx + 3} ${cy}`;
  
  return (
    <g className="bot-eye-group">
      <path 
        d={pathD} 
        stroke="#333" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
      />
    </g>
  );
};

interface EyeProps {
  state: EyeState;
  cx: number;
  cy: number;
  dir: 'left' | 'right';
}

const Eye: React.FC<EyeProps> = ({ state, cx, cy, dir }) => {
  const props = { cx, cy, dir };
  switch (state) {
    case 'win':
      return <EyeHappy {...props} />;
    case 'angry':
      return <EyeAngry {...props} />;
    case 'scared':
      return <EyeFalling {...props} />;
    case 'destroyed':
      return <EyeDestroyed {...props} />;
    case 'confused':
      return <EyeSad {...props} />;
    case 'sleeping':
      return <EyeSleeping {...props} />;
    case 'love':
      return <EyeLove {...props} />;
    case 'default':
    default:
      return <EyeDefault {...props} />;
  }
};

export default Eye;