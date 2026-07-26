
import React from 'react';
import { Move } from '../types';
import { ICONS } from './icons';

interface TutorialArrowsProps {
  highlightedArrow: Move | null;
  incorrectArrow: Move | null;
}

const TutorialArrows: React.FC<TutorialArrowsProps> = ({ highlightedArrow, incorrectArrow }) => {
    const getStyle = (move: Move) => {
        const style: React.CSSProperties = { 
            position: 'absolute', 
            width: '80px', 
            height: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            transition: 'opacity 0.5s ease-in-out', // Smooth fade
            opacity: 0,
            pointerEvents: 'none'
        };
        switch(move) {
            case Move.Up: return { ...style, top: '15%', left: '50%', transform: 'translateX(-50%)' };
            case Move.Down: return { ...style, bottom: '15%', left: '50%', transform: 'translateX(-50%)' };
            case Move.Left: return { ...style, left: '5%', top: '50%', transform: 'translateY(-50%)' };
            case Move.Right: return { ...style, right: '5%', top: '50%', transform: 'translateY(-50%)' };
        }
        return style;
    }

    const allMoves = [Move.Up, Move.Down, Move.Left, Move.Right];

    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            {allMoves.map(move => {
                const isActive = highlightedArrow === move;
                return (
                    <div 
                        key={move} 
                        style={{ ...getStyle(move), opacity: isActive ? 1 : 0 }} 
                        className="text-cyan-400 animate-intense-pulse"
                    >
                        <div style={{ transform: 'scale(4)' }}>
                             {move === Move.Up && <ICONS.Up />}
                             {move === Move.Down && <ICONS.Down />}
                             {move === Move.Left && <ICONS.Left />}
                             {move === Move.Right && <ICONS.Right />}
                        </div>
                    </div>
                );
            })}
            
             {incorrectArrow && (
                <div style={{...getStyle(incorrectArrow), opacity: 0.8}} className="text-[var(--accent-red)]" key="incorrect">
                     <div style={{ transform: 'scale(2)' }}>
                         <ICONS.Remove />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorialArrows;
