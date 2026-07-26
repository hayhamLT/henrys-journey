
import React from 'react';
import { Theme } from '../types';
import { THEME_PALETTES } from './models/Shared';

export const ScreenFog: React.FC<{ theme: Theme }> = ({ theme }) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    const fogColor = palette.sky[1]; 

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-end z-[5]">
            {/* Soft horizon gradient to ground the scene - Shifted down to clear top elements */}
            <div 
                className="w-full h-1/2 transition-colors duration-2000 ease-in-out opacity-30"
                style={{ 
                    background: `linear-gradient(to bottom, transparent 30%, ${fogColor} 100%)`,
                }}
            />
            
            {/* 
                Refined Micro-Grain Overlay 
                - baseFrequency 1.85: Reduced dot size by ~20% compared to previous version.
                - mix-blend-overlay: Seamlessly blends with world lighting.
                - opacity 0.05: Minimal intensity for a clean, cinematic feel.
            */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" 
                 style={{ 
                     backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
                 }} 
            />
        </div>
    );
};
