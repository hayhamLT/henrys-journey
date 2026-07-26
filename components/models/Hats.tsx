
import React, { useMemo } from 'react';
import { Box, RoundedBox } from '@react-three/drei';
import { HatId } from '../../types';
import { VoxelMaterial, GhostEdges } from './Shared';
import * as THREE from 'three';

export const VoxelHat: React.FC<{ id: HatId, clippingPlanes?: THREE.Plane[], isGhost?: boolean, opacity?: number, depthWrite?: boolean, disableTexture?: boolean }> = React.memo(({ id, clippingPlanes, isGhost, opacity = 1, depthWrite = true, disableTexture }) => {
    
    // Helper to select material type based on hat style
    const getType = () => {
        switch(id) {
            case 'beanie':
            case 'cap':
            case 'wizard':
            case 'chef':
            case 'sombrero':
            case 'cowboy':
            case 'tophat':
            case 'graduation':
                return 'cloth';
            default: return 'matte';
        }
    };
    
    const hatType = getType();

    const m = useMemo(() => {
        const matProps = { transparent: opacity < 1, opacity: opacity, clippingPlanes, depthWrite, isGhost, type: hatType as any, disableTexture };
        const ghostEdge = isGhost ? <GhostEdges opacity={opacity} /> : null;
        return {
            yellow: <><VoxelMaterial color="#FACC15" {...matProps} />{ghostEdge}</>,
            black: <><VoxelMaterial color="#1e293b" {...matProps} />{ghostEdge}</>,
            red: <><VoxelMaterial color="#f43f5e" {...matProps} />{ghostEdge}</>,
            blue: <><VoxelMaterial color="#06b6d4" {...matProps} />{ghostEdge}</>,
            white: <><VoxelMaterial color="#FFFFFF" {...matProps} />{ghostEdge}</>,
            brown: <><VoxelMaterial color="#5D4037" {...matProps} />{ghostEdge}</>,
            purple: <><VoxelMaterial color="#d946ef" {...matProps} />{ghostEdge}</>,
            pink: <><VoxelMaterial color="#d946ef" {...matProps} />{ghostEdge}</>,
            grey: <><VoxelMaterial color="#94A3B8" {...matProps} />{ghostEdge}</>,
            gold: <><VoxelMaterial color="#fbbf24" metalness={0.12} roughness={0.55} {...matProps} />{ghostEdge}</>,
            orange: <><VoxelMaterial color="#fb923c" {...matProps} />{ghostEdge}</>,
            darkBlue: <><VoxelMaterial color="#1e3a8a" {...matProps} />{ghostEdge}</>,
        };
    }, [opacity, clippingPlanes, depthWrite, isGhost, hatType, disableTexture]);

    if (id === 'none') return null;

    const getHatContent = () => {
        switch (id) {
            case 'cone': return <group position={[0, 0.04, 0]}><Box args={[0.2, 0.08, 0.2]}>{m.yellow}</Box><Box args={[0.14, 0.08, 0.14]} position={[0, 0.08, 0]}>{m.yellow}</Box><Box args={[0.08, 0.08, 0.08]} position={[0, 0.16, 0]}>{m.yellow}</Box><Box args={[0.04, 0.04, 0.04]} position={[0, 0.22, 0]}>{m.yellow}</Box></group>;
            case 'tophat': return <group position={[0, 0.02, 0]}><Box args={[0.4, 0.04, 0.4]}>{m.black}</Box><Box args={[0.24, 0.3, 0.24]} position={[0, 0.17, 0]}>{m.black}</Box><Box args={[0.26, 0.06, 0.26]} position={[0, 0.05, 0]}>{m.red}</Box></group>;
            case 'crown': return <group position={[0, 0.05, 0]}><Box args={[0.34, 0.1, 0.34]}>{m.gold}</Box><Box args={[0.08, 0.12, 0.08]} position={[0.13, 0.1, 0.13]}>{m.gold}</Box><Box args={[0.08, 0.12, 0.08]} position={[-0.13, 0.1, 0.13]}>{m.gold}</Box><Box args={[0.08, 0.12, 0.08]} position={[0.13, 0.1, -0.13]}>{m.gold}</Box><Box args={[0.08, 0.12, 0.08]} position={[-0.13, 0.1, -0.13]}>{m.gold}</Box></group>;
            case 'propeller': return <group position={[0, 0.075, 0]}><Box args={[0.3, 0.15, 0.3]}>{m.blue}</Box><Box args={[0.04, 0.1, 0.04]} position={[0, 0.1, 0]}>{m.grey}</Box><group name="propellerBlade" position={[0, 0.16, 0]}><Box args={[0.4, 0.04, 0.08]}>{m.red}</Box><Box args={[0.08, 0.04, 0.4]}>{m.red}</Box></group></group>;
            case 'chef': return <group position={[0, 0.05, 0]}><Box args={[0.26, 0.1, 0.26]}>{m.white}</Box><Box args={[0.34, 0.25, 0.34]} position={[0, 0.15, 0]}>{m.white}</Box></group>;
            case 'banana': return <group position={[0, 0.05, 0]} rotation={[0, 0, -0.2]}><Box args={[0.1, 0.1, 0.3]}>{m.yellow}</Box><Box args={[0.1, 0.1, 0.1]} position={[0, 0.08, 0.12]} rotation={[0.2, 0, 0]}>{m.yellow}</Box><Box args={[0.1, 0.1, 0.1]} position={[0, 0.08, -0.12]} rotation={[-0.2, 0, 0]}>{m.yellow}</Box></group>;
            case 'cowboy': return <group position={[0, 0.02, 0]}><Box args={[0.5, 0.04, 0.4]}>{m.brown}</Box><Box args={[0.26, 0.2, 0.26]} position={[0, 0.12, 0]}>{m.brown}</Box></group>;
            case 'wizard': return <group position={[0, 0.02, 0]}><Box args={[0.45, 0.04, 0.45]}>{m.purple}</Box><Box args={[0.25, 0.15, 0.25]} position={[0, 0.1, 0]}>{m.purple}</Box><Box args={[0.15, 0.15, 0.15]} position={[0, 0.25, 0]}>{m.purple}</Box><Box args={[0.08, 0.15, 0.08]} position={[0, 0.4, 0]}>{m.purple}</Box></group>;
            case 'headphones': return <group position={[0, -0.05, 0]}><Box args={[0.36, 0.06, 0.1]} position={[0, 0.2, 0]}>{m.black}</Box><Box args={[0.06, 0.2, 0.1]} position={[0.18, 0.1, 0]}>{m.black}</Box><Box args={[0.06, 0.2, 0.1]} position={[-0.18, 0.1, 0]}>{m.black}</Box><Box args={[0.12, 0.18, 0.18]} position={[0.22, 0.0, 0]}>{m.pink}</Box><Box args={[0.12, 0.18, 0.18]} position={[-0.22, 0.0, 0]}>{m.pink}</Box></group>;
            case 'viking': return <group position={[0, 0.075, 0]}><Box args={[0.34, 0.15, 0.34]}>{m.grey}</Box><Box args={[0.08, 0.2, 0.08]} position={[0.18, 0.1, 0]}>{m.white}</Box><Box args={[0.08, 0.2, 0.08]} position={[-0.18, 0.1, 0]}>{m.white}</Box></group>;
            case 'cap': return <group position={[0, 0.06, 0]}><Box args={[0.32, 0.12, 0.32]}>{m.red}</Box><Box args={[0.32, 0.04, 0.15]} position={[0, -0.04, 0.2]}>{m.red}</Box></group>;
            case 'hardhat': return <group position={[0, 0.07, 0]}><Box args={[0.34, 0.15, 0.34]}>{m.yellow}</Box><Box args={[0.36, 0.04, 0.36]} position={[0, -0.05, 0]}>{m.yellow}</Box><Box args={[0.1, 0.05, 0.36]} position={[0, 0.1, 0]}>{m.yellow}</Box></group>;
            case 'glasses': return <group position={[0, -0.14, 0.17]}><Box args={[0.32, 0.08, 0.04]}>{m.black}</Box><Box args={[0.04, 0.04, 0.2]} position={[0.16, 0, -0.1]}>{m.black}</Box><Box args={[0.04, 0.04, 0.2]} position={[-0.16, 0, -0.1]}>{m.black}</Box></group>;
            case 'beanie': return <group position={[0, 0.06, 0]}><Box args={[0.32, 0.12, 0.32]}>{m.darkBlue}</Box><Box args={[0.28, 0.08, 0.28]} position={[0, 0.1, 0]}>{m.darkBlue}</Box><Box args={[0.08, 0.08, 0.08]} position={[0, 0.16, 0]}>{m.white}</Box></group>;
            case 'sombrero': return <group position={[0, 0.1, 0]}><Box args={[0.6, 0.04, 0.6]} position={[0, -0.08, 0]}>{m.orange}</Box><Box args={[0.3, 0.25, 0.3]} position={[0, 0.05, 0]}>{m.orange}</Box><Box args={[0.2, 0.1, 0.2]} position={[0, 0.2, 0]}>{m.orange}</Box></group>;
            // Graduation cap — mortarboard + gold button + dangling tassel. A
            // financial-LITERACY nod: this world is about learning to be smart with money.
            case 'graduation': return <group position={[0, 0.06, 0]}>
                <Box args={[0.24, 0.1, 0.24]}>{m.black}</Box>
                <Box args={[0.44, 0.03, 0.44]} position={[0, 0.065, 0]}>{m.black}</Box>
                <Box args={[0.05, 0.05, 0.05]} position={[0, 0.09, 0]}>{m.gold}</Box>
                <Box args={[0.02, 0.16, 0.02]} position={[0.19, 0.0, 0.19]}>{m.gold}</Box>
                <Box args={[0.05, 0.04, 0.05]} position={[0.19, -0.09, 0.19]}>{m.gold}</Box>
            </group>;
            default: return null;
        }
    }

    return (
        <group scale={1.1}>
            {getHatContent()}
        </group>
    );
});

// Detailed Backpack Geometry using RoundedBox
export const BackpackDetail: React.FC<{ color: string, clippingPlanes?: THREE.Plane[], isGhost?: boolean, opacity?: number, disableTexture?: boolean }> = ({ color, clippingPlanes, isGhost, opacity = 1, disableTexture }) => {
    const matProps = { color, clippingPlanes, transparent: isGhost, opacity: opacity, depthWrite: !isGhost, isGhost, type: 'cloth' as const, disableTexture };
    const techProps = { color: '#00ffcc', emissive: '#00ffcc', emissiveIntensity: 0.5, clippingPlanes, transparent: isGhost, opacity: opacity, depthWrite: !isGhost };
    const strapProps = { color: '#333', clippingPlanes, transparent: isGhost, opacity: opacity, depthWrite: !isGhost, isGhost, type: 'cloth' as const, disableTexture };
    const ghostEdge = isGhost ? <GhostEdges opacity={opacity} /> : null;

    // Use sharp chamfer settings: smoothness=1, larger radius
    const chamferRadius = 0.04;
    const chamferSmoothness = 1;

    return (
        <group position={[0, 0.15, -0.15]}>
            <RoundedBox args={[0.22, 0.24, 0.1]} radius={chamferRadius} smoothness={chamferSmoothness} castShadow={!isGhost}>
                <VoxelMaterial {...matProps} color={color} />
                {ghostEdge}
            </RoundedBox>
            <RoundedBox args={[0.22, 0.08, 0.11]} radius={chamferRadius} smoothness={chamferSmoothness} position={[0, 0.12, 0]} castShadow={!isGhost}>
                <VoxelMaterial {...matProps} color={color} />
                {ghostEdge}
            </RoundedBox>
            {/* Straps - keep as simple boxes or thin rounded boxes */}
            <RoundedBox args={[0.04, 0.24, 0.02]} radius={0.005} smoothness={2} position={[-0.06, 0, 0.06]}>
                <VoxelMaterial {...strapProps} />
                {ghostEdge}
            </RoundedBox>
            <RoundedBox args={[0.04, 0.24, 0.02]} radius={0.005} smoothness={2} position={[0.06, 0, 0.06]}>
                <VoxelMaterial {...strapProps} />
                {ghostEdge}
            </RoundedBox>
            {/* Small Pocket */}
            <RoundedBox args={[0.14, 0.1, 0.04]} radius={chamferRadius} smoothness={chamferSmoothness} position={[0, -0.05, -0.07]} castShadow={!isGhost}>
                <VoxelMaterial {...matProps} color={color} />
                {ghostEdge}
            </RoundedBox>
            {!isGhost && <Box args={[0.06, 0.06, 0.02]} position={[0, 0.05, -0.06]} castShadow={!isGhost}>
                <meshStandardMaterial {...techProps} />
            </Box>}
        </group>
    );
};
