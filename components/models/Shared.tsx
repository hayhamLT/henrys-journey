
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { Theme } from '../../types';
import { getMatteTexture, getHairTexture, getClothTexture, getSkinTexture, TileStyle } from '../../utils/textureGenerator';

export interface Palette {
    sky: [string, string];
    wall: string; 
    wallAccent: string; 
    floor: string;
    floorSide: string;
    highlight: string;
    treeTrunk: string;
    treeLeaf: string;
    tileStyle?: TileStyle; // per-world surface for the tile cap (grass/sand/snow/basalt/crystal)
}

const DAY_FLOOR = '#9EB8D6';
const DAY_SIDE = '#657FA0';
const WARM_FLOOR = '#F5C18A';
const WARM_SIDE = '#D88B65';

export const THEME_PALETTES: Record<string, Palette> = {
    // Day (Standard) - Cool slate palette matched to blue sky
    'day': { sky: ['#334155', '#020617'], wall: '#9FB7D2', wallAccent: '#E5F0FB', floor: DAY_FLOOR, floorSide: DAY_SIDE, highlight: '#22d3ee', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Sunset (Shop) - Warm modern coral sand
    'sunset': { sky: ['#be123c', '#4c0519'], wall: '#FB7185', wallAccent: '#FECDD3', floor: WARM_FLOOR, floorSide: WARM_SIDE, highlight: '#FF8A65', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' }, 
    
    // Night (Abyss) - Readable moonlit blues
    'night': { sky: ['#1e1b4b', '#020617'], wall: '#60A5FA', wallAccent: '#BFDBFE', floor: '#7DB6FF', floorSide: '#4F7FD9', highlight: '#00f2ff', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Sunrise - Mint and sea-glass tones
    'sunrise': { sky: ['#115e59', '#042f2e'], wall: '#2DD4BF', wallAccent: '#CCFBF1', floor: '#9AD7C3', floorSide: '#5EA48A', highlight: '#FF8A65', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Alpine - Clean frost slate
    'alpine': { sky: ['#64748b', '#0f172a'], wall: '#94A3B8', wallAccent: '#E2E8F0', floor: '#D7E6F3', floorSide: '#A6BED3', highlight: '#67e8f9', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Desert (Quest) - Warm modern sand
    'desert': { 
        sky: ['#9a3412', '#2a1205'], 
        wall: '#E2B472', 
        wallAccent: '#FEF3C7', 
        floor: '#F7D8A2', 
        floorSide: '#D9A567', 
        highlight: '#06b6d4', 
        treeTrunk: '#5D4037', 
        treeLeaf: '#2E7D32' 
    },
    
    // Dusk (Factory) - Soft neon violet
    'dusk': { sky: ['#4338ca', '#1e1b4b'], wall: '#818CF8', wallAccent: '#E07FFF', floor: '#B8A8F0', floorSide: '#7D6BC4', highlight: '#e879f9', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Crystal (Caves) - Bright cyan mineral tones
    'crystal': { sky: ['#155e75', '#083344'], wall: '#22D3EE', wallAccent: '#CFFAFE', floor: '#7DE3F3', floorSide: '#2AA5C0', highlight: '#facc15', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Cyber (Coop) - Modern jade circuitry
    'cyber': { sky: ['#059669', '#022c22'], wall: '#34D399', wallAccent: '#D1FAE5', floor: '#47D6A5', floorSide: '#1E8E70', highlight: '#10b981', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' }, 
    
    // Volcanic - BRIGHTENED MAGMA PALETTE
    'volcanic': { 
        sky: ['#f97316', '#7c2d12'], // Much brighter oranges
        wall: '#ef4444', 
        wallAccent: '#fde047', 
        floor: '#FFAA5C', 
        floorSide: '#E46B2E', 
        highlight: '#facc15', 
        treeTrunk: '#422006', 
        treeLeaf: '#ea580c' 
    }, 
    
    // Galaxy (Sky Kingdom) - Balanced amethyst
    'galaxy': { sky: ['#4c1d95', '#2e1065'], wall: '#A78BFA', wallAccent: '#EDE9FE', floor: '#C8B5FF', floorSide: '#8E6BE8', highlight: '#E040FB', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' }, 
    
    // My World - Soft custom blue platform
    'my-world': { sky: ['#1e3a8a', '#172554'], wall: '#60A5FA', wallAccent: '#DBEAFE', floor: '#9DCBFF', floorSide: '#5A95D8', highlight: '#F1C40F', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },
    
    // Builder - Lighter Blueprint Blue
    'builder': { sky: ['#3b82f6', '#1d4ed8'], wall: '#60a5fa', wallAccent: '#BFDBFE', floor: '#8AC2FF', floorSide: '#4F8FE0', highlight: '#ffffff', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' },

    // Arena - Competitive Dark Purple/Neon
    'arena': { sky: ['#2e1065', '#0f172a'], wall: '#C084FC', wallAccent: '#F3E8FF', floor: '#9387F5', floorSide: '#5A4BC9', highlight: '#fbbf24', treeTrunk: '#5D4037', treeLeaf: '#2E7D32' }
};

// Each world's tile cap surface. Themes left out default to lush "grass"
// (day / sunrise / cyber / my-world / builder). Maps each campaign world to its
// identity: dunes→sand, peak→snow, volcanic→basalt, caves/abyss/sky→crystal.
const THEME_TILE_STYLE: Record<string, TileStyle> = {
    desert: 'sand',
    sunset: 'sand',
    alpine: 'snow',
    volcanic: 'basalt',
    crystal: 'crystal',
    night: 'crystal',
    dusk: 'crystal',
    galaxy: 'crystal',
    arena: 'crystal',
};
Object.entries(THEME_TILE_STYLE).forEach(([theme, style]) => {
    if (THEME_PALETTES[theme]) THEME_PALETTES[theme].tileStyle = style;
});

export const getGreetingPalette = (theme: Theme) => {
    const p = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    
    const base = [
        { c: '#FFFFFF', s: '#94A3B8' }, 
        { c: p.highlight, s: 'rgba(0,0,0,0.3)' } 
    ];
    
    switch (theme) {
        case 'day': return [
            { c: '#fbbf24', s: '#d97706' }, { c: '#FFFFFF', s: '#475569' }, { c: '#22d3ee', s: '#0891b2' }, { c: '#f43f5e', s: '#be123c' }
        ];
        case 'sunset': return [
            { c: '#FFE082', s: '#D97706' }, { c: '#FFFFFF', s: '#BE185D' }, { c: '#F472B6', s: '#DB2777' }, { c: '#C084FC', s: '#7E22CE' }
        ];
        case 'night': return [
            { c: '#38BDF8', s: '#0284C7' }, { c: '#FFFFFF', s: '#1E293B' }, { c: '#818CF8', s: '#4F46E5' }, { c: '#22D3EE', s: '#0891B2' }
        ];
        case 'sunrise': return [
            { c: '#FF8A65', s: '#D84315' }, { c: '#FFFFFF', s: '#059669' }, { c: '#4ADE80', s: '#16A34A' }, { c: '#2DD4BF', s: '#0F766E' }
        ];
        case 'alpine': return [
            { c: '#81D4FA', s: '#0284C7' }, { c: '#FFFFFF', s: '#475569' }, { c: '#94A3B8', s: '#334155' }, { c: '#38BDF8', s: '#0369A1' }
        ];
        case 'desert': return [
            { c: '#29B6F6', s: '#0284C7' }, { c: '#FFFFFF', s: '#7C2D12' }, { c: '#FB923C', s: '#EA580C' }, { c: '#FACC15', s: '#CA8A04' }
        ];
        case 'dusk': return [
            { c: '#FF4081', s: '#C2185B' }, { c: '#FFFFFF', s: '#4C1D95' }, { c: '#F472B6', s: '#DB2777' }, { c: '#818CF8', s: '#4F46E5' }
        ];
        case 'crystal': return [
            { c: '#FFEA00', s: '#F57F17' }, { c: '#FFFFFF', s: '#1E3A8A' }, { c: '#22D3EE', s: '#0891B2' }, { c: '#A78BFA', s: '#7C3AED' }
        ];
        case 'cyber': return [
            { c: '#10b981', s: '#064e3b' }, { c: '#FFFFFF', s: '#020617' }, { c: '#34D399', s: '#059669' }, { c: '#fbbf24', s: '#b45309' }
        ];
        case 'volcanic': return [
            { c: '#facc15', s: '#b45309' }, { c: '#FFFFFF', s: '#7F1D1D' }, { c: '#ef4444', s: '#991b1b' }, { c: '#f59e0b', s: '#d97706' }
        ];
        case 'galaxy': return [
            { c: '#E040FB', s: '#AA00FF' }, { c: '#FFFFFF', s: '#312E81' }, { c: '#E879F9', s: '#C026D3' }, { c: '#8B5CF6', s: '#6D28D9' }
        ];
        case 'builder': return [
            { c: '#3b82f6', s: '#1e3a8a' }, { c: '#FFFFFF', s: '#1e40af' }, { c: '#60a5fa', s: '#2563eb' }, { c: '#93c5fd', s: '#3b82f6' }
        ];
        case 'arena': return [
            { c: '#fbbf24', s: '#b45309' }, { c: '#FFFFFF', s: '#4c1d95' }, { c: '#d946ef', s: '#7c3aed' }, { c: '#f43f5e', s: '#be123c' }
        ];
        default: return [
            { c: '#FACC15', s: '#CA8A04' }, { c: '#FFFFFF', s: '#94A3B8' }, { c: '#4ADE80', s: '#16A34A' }, { c: '#60A5FA', s: '#2563EB' }
        ];
    }
}

export const LOCK_KEY_COLORS: Record<string, string> = {
    yellow: '#FACC15',
    blue: '#06b6d4',
    red: '#f43f5e',
    purple: '#d946ef',
    orange: '#fb923c',
    cyan: '#67e8f9',
    circuit: '#FACC15',
    vision: '#10B981',
    phase: '#d946ef',
    green: '#10B981',
};

export const coordRandom = (x: number, z: number) => {
    return Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
};

export const tintColor = (base: string, tint: string, amount: number) => {
    const c1 = new THREE.Color(base);
    const c2 = new THREE.Color(tint);
    c1.lerp(c2, amount);
    return '#' + c1.getHexString();
};

export const GHOST_BLUE_LIGHT = '#22d3ee'; 
export const GHOST_EDGE_COLOR = '#06b6d4'; 

export const GhostEdges = ({ opacity = 0.4 }: { opacity?: number }) => null; 

export const VoxelMaterial: React.FC<{ 
    color: string, 
    transparent?: boolean, 
    opacity?: number, 
    emissive?: string, 
    emissiveIntensity?: number, 
    metalness?: number, 
    roughness?: number, 
    clippingPlanes?: THREE.Plane[], 
    depthWrite?: boolean, 
    isGhost?: boolean, 
    type?: 'matte' | 'hair' | 'cloth' | 'skin',
    disableTexture?: boolean 
}> = (props) => {
    const { isGhost, type = 'matte', disableTexture, ...otherProps } = props;
    
    const safeColor = useMemo(() => {
        let c = isGhost ? GHOST_BLUE_LIGHT : props.color || '#ffffff';
        if (typeof c === 'string' && !c.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(c)) {
            c = '#' + c;
        }
        return c;
    }, [props.color, isGhost]);

    const texture = useMemo(() => {
        if (isGhost || disableTexture) return null;
        if (type === 'hair') return getHairTexture(safeColor);
        if (type === 'cloth') return getClothTexture(safeColor);
        if (type === 'skin') return getSkinTexture(safeColor);
        return getMatteTexture(safeColor);
    }, [safeColor, isGhost, type, disableTexture]);
    
    let finalRoughness = props.roughness;
    let finalMetalness = props.metalness;

    // Matte but ALIVE: a touch under fully-rough so light grazes the surface and
    // saturated dyes read as cloth/skin, not chalk. Still never glossy.
    if (finalRoughness === undefined) {
        finalRoughness = 0.85;
    }
    
    if (finalMetalness === undefined) {
        finalMetalness = 0.0;
    }
    
    if (isGhost) {
        const op = props.opacity !== undefined ? props.opacity : 0.6;
        return (
            <meshStandardMaterial 
                color={GHOST_BLUE_LIGHT} 
                emissive={GHOST_BLUE_LIGHT}
                emissiveIntensity={2.0}
                transparent={true}
                opacity={op}
                depthWrite={false}
                clippingPlanes={props.clippingPlanes}
                toneMapped={false}
                roughness={0.1}
                metalness={0.1}
            />
        );
    }

    return <meshStandardMaterial 
        map={texture} 
        {...otherProps} 
        color={texture ? '#ffffff' : safeColor} 
        depthWrite={props.depthWrite !== undefined ? props.depthWrite : true} 
        roughness={finalRoughness}
        metalness={finalMetalness}
    />;
};
