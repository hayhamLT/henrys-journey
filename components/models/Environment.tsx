
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../types';
import { THEME_PALETTES, coordRandom, tintColor } from './Shared';
import { getTileTexture, getCapTexture, getMatteTexture } from '../../utils/textureGenerator';

// --- MAIN WALL BLOCK COMPONENT ---
// A wall is now a chunky VOXEL TERRAIN BLOCK — a raised version of the world's
// own floor tile (grass block / sand block / snow block / crystal block) with the
// per-world surface cap on top and matte sides. This puts walls, floors and the
// boxy collectibles into ONE design language instead of the old faceted "dirty
// crystal" dodecahedrons, which read as a different game.

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

    // Slight per-block height + a quarter-turn so a wall run doesn't look extruded.
    const height = useMemo(() => 0.9 + rand(88) * 0.35, [rand]);
    const rotY = useMemo(() => (Math.floor(rand(5) * 4) * Math.PI) / 2, [rand]);

    const tileStyle = palette.tileStyle || 'grass';
    const capTex = useMemo(() => getCapTexture(tileStyle, palette.wall), [tileStyle, palette.wall]);
    const sideColor = useMemo(() => tintColor(palette.wall, '#000000', 0.28), [palette.wall]);
    const sideTex = useMemo(() => getMatteTexture(sideColor), [sideColor]);

    // Small recoil when the walker bumps the wall (isWallHit feedback).
    useFrame((state) => {
        if (!groupRef.current) return;
        const s = isShaking ? Math.sin(state.clock.elapsedTime * 40) * 0.04 : 0;
        groupRef.current.position.x = position[0] + s;
    });

    const capY = height - 0.4 - 0.06; // cap sits flush on top of the body
    return (
        <group position={[position[0], 0, position[2]]} rotation={[0, rotY, 0]} ref={groupRef}>
            {/* body — matte sides, slightly inset so the cap reads as an overhang */}
            <mesh position={[0, (height / 2) - 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.88, height, 0.88]} />
                <meshStandardMaterial map={sideTex} color={palette.wall} roughness={0.9} metalness={0} />
            </mesh>
            {/* surface cap — the world's own terrain on top */}
            <mesh position={[0, capY, 0]} castShadow>
                <boxGeometry args={[0.94, 0.16, 0.94]} />
                <meshStandardMaterial map={capTex} color={palette.wall} roughness={0.82} metalness={0} />
            </mesh>
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

    // Normal tiles wear the world's own clean voxel surface (grass / sand / snow /
    // basalt / crystal). Only CRUMBLING tiles keep a cracked, fragile face — there
    // the cracks are a deliberate "this will break" danger signal, not decoration.
    const tileStyle = palette.tileStyle || 'grass';
    const texture = useMemo(() => {
        if (isCrumbling) {
            const v = Math.floor(seed * 100) % 3;
            const variant = v === 0 ? 'fragile-1' : v === 1 ? 'fragile-2' : 'fragile-3';
            return getTileTexture(variant as any, color);
        }
        return getCapTexture(tileStyle, color);
    }, [tileStyle, color, seed, isCrumbling]);

    // Vertical sides get a plain matte body of the darker side colour — grass/sand
    // caps belong on TOP only, so a tile reads as a solid terrain block.
    const sideTexture = useMemo(() => getMatteTexture(sideColor), [sideColor]);

    return { texture, sideTexture, color, sideColor, depth, bottomMeshY, isHighlighted: isHighlighted || isInPlannedPath || isDragOver, rotationY: (Math.floor(seed * 1000) % 4) * (Math.PI / 2) };
};

const StaticFloor: React.FC<{ position: [number, number, number], visuals: any, opacity?: number }> = React.memo(({ position, visuals, opacity = 1 }) => {
    return (
        <group position={[position[0], 0, position[2]]}>
            <mesh position={[0, -0.2, 0]} rotation={[0, visuals.rotationY, 0]} castShadow={opacity === 1} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.95, 0.4, 0.95]} />
                <meshStandardMaterial map={visuals.texture} color={visuals.color} roughness={0.85} metalness={0} transparent={opacity < 1} opacity={opacity} />
            </mesh>
            {visuals.isHighlighted && (
                <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.88, 0.88]} />
                    <meshBasicMaterial color="#34d399" transparent opacity={0.35} depthWrite={false} />
                </mesh>
            )}
            <mesh position={[0, visuals.bottomMeshY, 0]} rotation={[0, visuals.rotationY, 0]} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.92, visuals.depth, 0.92]} />
                <meshStandardMaterial color={visuals.sideColor} map={visuals.sideTexture} roughness={0.92} metalness={0} transparent={opacity < 1} opacity={opacity} />
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
                <meshStandardMaterial map={visuals.texture} color={visuals.color} roughness={0.85} metalness={0} transparent={opacity < 1} opacity={opacity} />
            </mesh>
            <mesh position={[0, visuals.bottomMeshY, 0]} rotation={[0, visuals.rotationY, 0]} receiveShadow={opacity === 1}>
                <boxGeometry args={[0.92, visuals.depth, 0.92]} />
                <meshStandardMaterial color={visuals.sideColor} map={visuals.sideTexture} roughness={0.92} metalness={0} transparent={opacity < 1} opacity={opacity} />
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
