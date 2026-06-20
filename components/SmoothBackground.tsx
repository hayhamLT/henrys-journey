
import React, { useEffect, useState, useRef } from 'react';
import { Theme } from '../types';
import { THEME_PALETTES } from './Models3D';

export const SmoothBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
    const [bgTheme, setBgTheme] = useState<Theme>(theme);
    const [nextTheme, setNextTheme] = useState<Theme | null>(null);
    const [opacity, setOpacity] = useState(0);
    const transitionTimeoutRef = useRef<number | null>(null);

    // Get gradient string helper
    const getGradient = (t: Theme) => {
        const p = THEME_PALETTES[t] || THEME_PALETTES['day'];
        return `radial-gradient(circle at center, ${p.sky[0]} 0%, ${p.sky[1]} 100%)`;
    };

    useEffect(() => {
        // Cleanup existing transition if a new one starts rapidly
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = null;
        }

        // If theme changes and is different from what we are showing
        if (theme !== bgTheme) {
            // If already transitioning to this theme, do nothing
            if (nextTheme === theme) return;

            // Start transition to new theme
            setNextTheme(theme);
            setOpacity(0); // Reset opacity for fade-in start
            
            // Force browser reflow before starting opacity transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setOpacity(1);
                });
            });
        } else {
            // If theme matches current bgTheme, cancel any pending transition state
            if (nextTheme) {
                setNextTheme(null);
                setOpacity(0);
            }
        }
    }, [theme, bgTheme, nextTheme]);

    const handleTransitionEnd = () => {
        if (nextTheme) {
            // Commit the new theme to the base layer
            setBgTheme(nextTheme);
            // Hide the overlay layer (reset for next time)
            setNextTheme(null);
            setOpacity(0);
        }
    };

    return (
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Bottom Layer (Current Stable Theme) */}
            <div 
                className="absolute inset-0"
                style={{ background: getGradient(bgTheme) }}
            />
            
            {/* Top Layer (Next Theme Fading In) */}
            {nextTheme && (
                <div 
                    className="absolute inset-0"
                    style={{ 
                        background: getGradient(nextTheme),
                        opacity: opacity,
                        transition: 'opacity 1.5s ease-in-out'
                    }}
                    onTransitionEnd={handleTransitionEnd}
                />
            )}
        </div>
    );
};
