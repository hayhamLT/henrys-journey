
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../types';
import { THEME_PALETTES, coordRandom, tintColor } from './Shared';
import { getTileTexture, getCrystalTexture } from '../../utils/textureGenerator';

// --- UNIFIED DIRTY CRYSTAL OBSTACLE ---

const StylizedCrystal: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
    const texture = useMemo(() => getCrystalTexture(color), [color]);
    
    const cluster = useMemo(() => {
        // Create a variation in cluster size and placement based on the seed
        // Adjusted all dimensions by 0.9 (10% smaller)
        const shards = [];
        const count = 1 + Math.floor(rand(10) * 3);
        
        for(let i = 0; i < count; i++) {
            const isPrimary = i === 0;
            shards.push({
                pos: [
                    isPrimary ? 0 : (rand(i * 12 + 1) - 0.5) * 0.4,
                    isPrimary ? 0.32 : 0.15 + rand(i * 12 + 2) * 0.2,
                    isPrimary ? 0 : (rand(i * 12 + 3) - 0.5) * 0.4
                ],
                rot: [
                    rand(i * 12 + 4) * Math.PI,
                    rand(i * 12 + 5) * Math.PI,
                    rand(i * 12 + 6) * Math.PI
                ],
                // Dodecahedrons for blunter, faceted look
                scale: [
                    isPrimary ? 0.35 : 0.15 + rand(i * 12 + 7) * 0.2,
                    isPrimary ? 0.75 : 0.25 + rand(i * 12 + 8) * 0.5,
                    isPrimary ? 0.35 : 0.15 + rand(i * 12 + 9) * 0.2
                ].map(v => v * 0.9) as [number, number, number],
                color: isPrimary ? color : accent
            });
        }
        return shards;
    }, [color, accent, rand]);

    return (
        <group position={[0, 0, 0]}>
            {/* Rock Base - Opaque and dirty */}
            <mesh position={[0, 0.04, 0]} rotation={[0, rand(4) * Math.PI, 0]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial 
                    map={useMemo(() => getCrystalTexture('#333333'), [])} 
                    color="#444" 
                    roughness={1} 
                />
            </mesh>
            
            {cluster.map((s, i) => (
                <mesh key={i} position={s.pos as any} rotation={s.rot as any} scale={s.scale as any} castShadow>
                    {/* Dodecahedron provides faceted "not so sharp" ends */}
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial 
                        map={texture}
                        color={s.color} 
                        emissive="#000000" // No illumination
                        emissiveIntensity={0} // No illumination
                        transparent={false} // No transparency
                        opacity={1.0} // No transparency
                        metalness={0.2}
                        roughness={0.8} // Matte look for dirty edges
                    />
                </mesh>
            ))}
        </group>
    );
};

// --- MAIN WALL BLOCK COMPONENT ---

export const WallBlock: React.FC<{ position: [number, number, number], coords?: [number, number], isShaking?: boolean, theme: Theme, seed?: number }> = ({ position, coords, isShaking, theme, seed }) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    const groupRef = useRef<THREE.Group>(null);
    
    const finalSeed = useMemo(() => {
        if (seed !== undefined) return seed;
        const x = coords ? coords[0] : position[0];
        const z = coords ? coords[1] : position[2];
        return Math.floor(coordRandom(x, z) * 100000);
    }, [position, seed, coords]);
    
    const rand = useCallback((offset: number) => {
        let t = finalSeed + offset * 1234;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }, [finalSeed]);

    // Apply randomization to scale: 0.6 to 1.0 range
    // This makes them smaller on average but biggest ones are original size (1.0)
    const scale = useMemo(() => 0.6 + rand(88) * 0.4, [rand]);

    // All worlds now only use crystals
    return (
        <group position={[position[0], 0, position[2]]} rotation={[0, (Math.floor(rand(5) * 4) * Math.PI) / 2, 0]} scale={[scale, scale, scale]} ref={groupRef}>
             <StylizedCrystal color={palette.wall} accent={palette.wallAccent} rand={rand} />
        </group>
    );
}

export const FloorSystem: React.FC<{ theme: Theme, children: React.ReactNode }> = ({ children }) => {
    return <group>{children}</group>;
};

// Internal hook for shared floor visuals
const useFloorVisuals = (theme: Theme, coords: [number, number] | undefined, position: [number, number, number], isHighlighted: boolean | undefined, isDragOver: boolean | undefined, isInPlannedPath: boolean | undefined, isCrumbling: boolean | undefined, gridSize: {rows: number, cols: number} | undefined) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    const baseColor = useMemo(() => tintColor(palette.floor, palette.sky[0], 0.42), [palette]);
    const sideColor = useMemo(() => tintColor(palette.floorSide, palette.sky[0], 0.56), [palette]);
    
    let color: string = baseColor;
    if (isDragOver || isHighlighted || isInPlannedPath) {
        color = palette.highlight;
    } 
    
    const seed = useMemo(() => {
        const x = coords ? coords[0] : position[0];
        const z = coords ? coords[1] : position[2];
        return coordRandom(x, z);
    }, [position, coords]);

    const rows = gridSize?.rows || 1;
    const cols = gridSize?.cols || 1;
    const r = coords ? coords[1] : position[2];
    const c = coords ? coords[0] : position[0];

    const cx = (cols - 1) / 2;
    const cz = (rows - 1) / 2;
    const dx = c - cx;
    const dz = r - cz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxDist = Math.sqrt(cx * cx + cz * cz) || 1;
    const factor = Math.max(0, 1 - (dist / (maxDist + 0.5))); 
    const curve = Math.pow(factor, 1.5); 

    const minDepth = 0.2;
    const maxDepth = 4.0; 
    const depth = gridSize ? (minDepth + (maxDepth - minDepth) * curve) : 0.4;
    const bottomMeshY = -0.4 - (depth / 2);

    const variant = useMemo(() => {
        if (isCrumbling) {
            const val = Math.floor(seed * 100);
            const v = val % 3;
            if (v === 0) return 'fragile-1';
            if (v === 1) return 'fragile-2';
            return 'fragile-3';
        }
        const val = Math.floor(seed * 100);
        const v = val % 5;
        if (v === 0) return 'cracked-1';
        if (v === 1) return 'cracked-2';
        if (v === 2) return 'cracked-3';
        if (v === 3) return 'cracked-4';
        return 'cracked-5';
    }, [seed, isCrumbling]);

    const texture = useMemo(() => getTileTexture(variant, color), [variant, color]);

    return { texture, color, sideColor, depth, bottomMeshY, rotationY: (Math.floor(seed * 1000) % 4) * (Math.PI / 2) };
};

const StaticFloor: React.FC<{ position: [number, number, number], visuals: any, opacity?: number }> = React.memo(({ position, visuals, opacity = 1 }) => {
    return (
        <group position={[position[0], 0, position[2]]}>
            <mesh position={[0, -0.2, 0]} rotation={[0, visuals.rotationY, 0]} castShadow={opacity === 1} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.95, 0.4, 0.95]} /> 
                <meshStandardMaterial map={visuals.texture} color={visuals.color} transparent={opacity < 1} opacity={opacity} />
            </mesh>
            <mesh position={[0, visuals.bottomMeshY, 0]} rotation={[0, visuals.rotationY, 0]} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.92, visuals.depth, 0.92]} />
                <meshStandardMaterial color={visuals.sideColor} map={visuals.texture} transparent={opacity < 1} opacity={opacity} /> 
            </mesh>
        </group>
    );
});

const ActiveFloor: React.FC<{ position: [number, number, number], visuals: any, opacity?: number }> = React.memo(({ position, visuals, opacity = 1 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [isFalling, setIsFalling] = useState(true);

    useFrame((state, delta) => {
        if (isFalling && groupRef.current) {
            groupRef.current.position.y -= delta * 8; 
            groupRef.current.rotation.x += delta * 2; 
            groupRef.current.rotation.z -= delta;
            groupRef.current.scale.multiplyScalar(Math.max(0, 1 - delta * 3)); 
        }
    });

    return (
        <group position={[position[0], 0, position[2]]} ref={groupRef}>
            <mesh position={[0, -0.2, 0]} rotation={[0, visuals.rotationY, 0]} castShadow={opacity === 1} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.95, 0.4, 0.95]} /> 
                <meshStandardMaterial map={visuals.texture} color={visuals.color} transparent={opacity < 1} opacity={opacity} />
            </mesh>
            <mesh position={[0, visuals.bottomMeshY, 0]} rotation={[0, visuals.rotationY, 0]} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.92, visuals.depth, 0.92]} />
                <meshStandardMaterial color={visuals.sideColor} map={visuals.texture} transparent={opacity < 1} opacity={opacity} /> 
            </mesh>
        </group>
    );
});

export const FloorTile: React.FC<{ position: [number, number, number], coords?: [number, number], isHole?: boolean, isHighlighted?: boolean, isDragOver?: boolean, isCrumbling?: boolean, hasCrumbled?: boolean, theme: Theme, isInPlannedPath?: boolean, gridSize?: {rows: number, cols: number}, opacity?: number }> = React.memo(({ position, coords, isHole, isHighlighted, isDragOver, isCrumbling, hasCrumbled, theme, isInPlannedPath, gridSize, opacity = 1 }) => {
    if (isHole && opacity === 1) return null;
    const visuals = useFloorVisuals(theme, coords, position, isHighlighted, isDragOver, isInPlannedPath, isCrumbling, gridSize);
    if (hasCrumbled) {
        return <ActiveFloor position={position} visuals={visuals} opacity={opacity} />;
    }
    return <StaticFloor position={position} visuals={visuals} opacity={opacity} />;
});
