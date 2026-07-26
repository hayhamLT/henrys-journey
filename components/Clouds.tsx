
import React from 'react';

interface VoxelCloudProps {
    style: React.CSSProperties;
    variant?: 1 | 2 | 3;
    parallaxFactor?: number;
    lowMotion?: boolean;
}

export const VoxelCloud: React.FC<VoxelCloudProps> = ({ style, variant = 1, parallaxFactor = 0.1, lowMotion = false }) => {
    let svgContent;
    // Purely rounded/circular clouds (no flat bottom rects where possible)
    if (variant === 1) {
        // Puffy Cumulus
        svgContent = (
            <svg width="100%" height="100%" viewBox="0 0 100 60" fill="white">
                <circle cx="30" cy="35" r="20" />
                <circle cx="50" cy="25" r="22" />
                <circle cx="70" cy="35" r="20" />
                <circle cx="40" cy="40" r="18" />
                <circle cx="60" cy="40" r="18" />
            </svg>
        );
    } else if (variant === 2) {
        // Wide / Stratus
        svgContent = (
            <svg width="100%" height="100%" viewBox="0 0 120 80" fill="white" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="35" r="18" />
                <circle cx="50" cy="30" r="22" />
                <circle cx="80" cy="33" r="20" />
                <circle cx="105" cy="38" r="15" />
                <circle cx="35" cy="50" r="18" />
                <circle cx="65" cy="53" r="20" />
                <circle cx="90" cy="50" r="18" />
                <rect x="25" y="30" width="80" height="25" rx="10" />
            </svg>
        );
    } else {
        // Tall / Tower
        svgContent = (
            <svg width="100%" height="100%" viewBox="0 0 80 80" fill="white">
                <circle cx="40" cy="30" r="25" />
                <circle cx="25" cy="50" r="22" />
                <circle cx="55" cy="50" r="22" />
                <circle cx="40" cy="55" r="20" />
            </svg>
        );
    }

    // Combine CSS translation for float + CSS variable calculation for scroll parallax
    // We use a wrapper div to handle the parallax transform separately from the positioning/animation
    // Parallax Logic: Move cloud UP as user scrolls DOWN (negative multiplier)
    return (
        <div 
            style={{
                ...style, 
                position: 'absolute', 
                pointerEvents: 'none',
                transform: lowMotion ? 'translateY(0px)' : `translateY(calc(var(--scroll-y, 0px) * ${-parallaxFactor}))`,
                transition: lowMotion ? 'none' : 'transform 0.4s cubic-bezier(0.1, 0.6, 0.2, 1)', // Smooth out scroll jitter with ease-out for softer stops
                willChange: 'transform'
            }} 
        >
            <div className={lowMotion ? '' : 'cloud-anim'}>
                {svgContent}
            </div>
        </div>
    );
};

export const GameClouds: React.FC<{ density?: 'normal' | 'low' }> = ({ density = 'normal' }) => (
  // Kept very subtle (0.07) so the parallax clouds read as ambient atmosphere
  // BEHIND content without bleeding through translucent glass cards.
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.07]">
      {/* 
          Parallax Factors:
          Higher factor (e.g. 0.8) = Closer to camera (moves faster)
          Lower factor (e.g. 0.1) = Farther away (moves slower)
      */}
      {/* Top / Initial View Clouds */}
            <VoxelCloud lowMotion={density === 'low'} variant={1} parallaxFactor={0.5} style={{ top: '15%', left: '5%', width: '100px', height: '60px', transform: 'scale(1.5)', animationDelay: '0s' }} />
            <VoxelCloud lowMotion={density === 'low'} variant={2} parallaxFactor={0.2} style={{ top: '25%', right: '15%', width: '140px', height: '80px', transform: 'scale(1.2)', animationDelay: '-5s' }} />
            {density !== 'low' && <VoxelCloud variant={3} parallaxFactor={0.8} style={{ top: '40%', left: '10%', width: '90px', height: '80px', transform: 'scale(2)', animationDelay: '-12s' }} />}
            <VoxelCloud lowMotion={density === 'low'} variant={1} parallaxFactor={0.1} style={{ top: '55%', right: '25%', width: '80px', height: '48px', transform: 'scale(0.8)', animationDelay: '-8s' }} />
      
      {/* Mid / Lower View Clouds - Removed Bottom Clouds that look like locks */}
            <VoxelCloud lowMotion={density === 'low'} variant={2} parallaxFactor={0.4} style={{ top: '70%', left: '20%', width: '120px', height: '70px', transform: 'scale(1.4)', animationDelay: '-3s' }} />
            {density !== 'low' && <VoxelCloud variant={3} parallaxFactor={0.15} style={{ top: '80%', right: '5%', width: '70px', height: '60px', transform: 'scale(0.9)', animationDelay: '-18s' }} />}
  </div>
);
