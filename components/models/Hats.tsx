
import React, { useMemo } from 'react';
import { Box, RoundedBox } from '@react-three/drei';
import { HatId } from '../../types';
import { VoxelMaterial, GhostEdges } from './Shared';
import * as THREE from 'three';

// Rounded-box drop-in for hat parts: soft beveled edges (radius scales with the
// smallest dimension so it's always valid) make every hat read as a cute,
// premium prop instead of a blocky cube.
const RB: React.FC<any> = ({ args, children, ...rest }) => (
    <RoundedBox args={args} radius={Math.min(...(args as number[])) * 0.32} smoothness={2} castShadow {...rest}>
        {children}
    </RoundedBox>
);

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
            gold: <><VoxelMaterial color="#fbbf24" metalness={0} roughness={0.85} {...matProps} />{ghostEdge}</>,
            orange: <><VoxelMaterial color="#fb923c" {...matProps} />{ghostEdge}</>,
            darkBlue: <><VoxelMaterial color="#1e3a8a" {...matProps} />{ghostEdge}</>,
            // Accent dyes — MATTE per the cute/premium/simple spec: gems read as soft
            // toy-plastic, NOT glowing jewelry (glow is reserved for gameplay). Metalness
            // only on genuinely-metal hats (steel helmet, gold band/buckle, chrome pin).
            ruby: <><VoxelMaterial color="#e11d48" roughness={0.55} {...matProps} />{ghostEdge}</>,
            sapphire: <><VoxelMaterial color="#2563eb" roughness={0.55} {...matProps} />{ghostEdge}</>,
            emerald: <><VoxelMaterial color="#10b981" roughness={0.55} {...matProps} />{ghostEdge}</>,
            satinBlack: <><VoxelMaterial color="#222834" roughness={0.6} {...matProps} />{ghostEdge}</>,
            steel: <><VoxelMaterial color="#cbd5e1" metalness={0.05} roughness={0.7} {...matProps} />{ghostEdge}</>,
            ivory: <><VoxelMaterial color="#f5f0e1" roughness={0.7} {...matProps} />{ghostEdge}</>,
            navy: <><VoxelMaterial color="#172554" roughness={0.6} {...matProps} />{ghostEdge}</>,
            feltIndigo: <><VoxelMaterial color="#4338ca" roughness={0.92} {...matProps} />{ghostEdge}</>,
            feltBlue: <><VoxelMaterial color="#2563eb" roughness={0.92} {...matProps} />{ghostEdge}</>,
            leather: <><VoxelMaterial color="#3E2723" roughness={0.9} {...matProps} />{ghostEdge}</>,
            slate: <><VoxelMaterial color="#475569" roughness={0.88} {...matProps} />{ghostEdge}</>,
            starGold: <><VoxelMaterial color="#f5c84b" roughness={0.5} {...matProps} />{ghostEdge}</>,
            chrome: <><VoxelMaterial color="#cbd5e1" metalness={0.05} roughness={0.65} {...matProps} />{ghostEdge}</>,
            glossBlue: <><VoxelMaterial color="#0e8aa8" roughness={0.6} {...matProps} />{ghostEdge}</>,
            cyanGlow: <><VoxelMaterial color="#22d3ee" roughness={0.5} {...matProps} />{ghostEdge}</>,
            rubyGem: <><VoxelMaterial color="#fb7185" roughness={0.5} {...matProps} />{ghostEdge}</>,
        };
    }, [opacity, clippingPlanes, depthWrite, isGhost, hatType, disableTexture]);

    if (id === 'none') return null;

    const getHatContent = () => {
        switch (id) {
            case 'cone': return <group position={[0, 0.04, 0]}><RB args={[0.2, 0.08, 0.2]}>{m.yellow}</RB><RB args={[0.14, 0.08, 0.14]} position={[0, 0.08, 0]}>{m.yellow}</RB><RB args={[0.08, 0.08, 0.08]} position={[0, 0.16, 0]}>{m.yellow}</RB><RB args={[0.04, 0.04, 0.04]} position={[0, 0.22, 0]}>{m.yellow}</RB><mesh position={[0, 0.27, 0]} castShadow><sphereGeometry args={[0.045, 12, 12]} />{m.white}</mesh><RB args={[0.205, 0.025, 0.205]} position={[0, 0.015, 0]}>{m.red}</RB></group>;
            case 'tophat': return <group position={[0, 0.02, 0]}><RB args={[0.4, 0.04, 0.4]}>{m.satinBlack}</RB><RB args={[0.24, 0.3, 0.24]} position={[0, 0.17, 0]}>{m.satinBlack}</RB><RB args={[0.26, 0.06, 0.26]} position={[0, 0.05, 0]}>{m.red}</RB><RB args={[0.05, 0.045, 0.03]} position={[0, 0.05, 0.135]}>{m.gold}</RB></group>;
            case 'crown': return <group position={[0, 0.05, 0]}><RB args={[0.34, 0.1, 0.34]}>{m.gold}</RB><RB args={[0.36, 0.04, 0.36]} position={[0, -0.04, 0]}>{m.gold}</RB><RB args={[0.08, 0.12, 0.08]} position={[0.13, 0.1, 0.13]}>{m.gold}</RB><RB args={[0.08, 0.12, 0.08]} position={[-0.13, 0.1, 0.13]}>{m.gold}</RB><RB args={[0.08, 0.12, 0.08]} position={[0.13, 0.1, -0.13]}>{m.gold}</RB><RB args={[0.08, 0.12, 0.08]} position={[-0.13, 0.1, -0.13]}>{m.gold}</RB><mesh position={[0, 0.02, 0.18]} rotation={[0, 0, Math.PI / 4]} castShadow><octahedronGeometry args={[0.05, 0]} />{m.ruby}</mesh></group>;
            case 'propeller': return <group position={[0, 0.075, 0]}><RB args={[0.3, 0.15, 0.3]}>{m.glossBlue}</RB><RB args={[0.04, 0.1, 0.04]} position={[0, 0.1, 0]}>{m.chrome}</RB><group name="propellerBlade" position={[0, 0.16, 0]}><RB args={[0.4, 0.04, 0.08]}>{m.red}</RB><RB args={[0.08, 0.04, 0.4]}>{m.red}</RB></group></group>;
            case 'chef': return <group position={[0, 0.05, 0]}><RB args={[0.26, 0.1, 0.26]}>{m.white}</RB><RB args={[0.28, 0.04, 0.28]} position={[0, 0.04, 0]}>{m.slate}</RB><RB args={[0.34, 0.25, 0.34]} position={[0, 0.15, 0]}>{m.white}</RB><RB args={[0.1, 0.1, 0.1]} position={[0.13, 0.27, 0]}>{m.white}</RB><RB args={[0.1, 0.1, 0.1]} position={[-0.13, 0.27, 0]}>{m.white}</RB><RB args={[0.1, 0.1, 0.1]} position={[0, 0.27, 0.13]}>{m.white}</RB><RB args={[0.1, 0.1, 0.1]} position={[0, 0.27, -0.13]}>{m.white}</RB><RB args={[0.12, 0.1, 0.12]} position={[0, 0.3, 0]}>{m.white}</RB></group>;
            case 'banana': return <group position={[0, 0.05, 0]} rotation={[0, 0, -0.2]}><RB args={[0.1, 0.1, 0.3]}>{m.yellow}</RB><RB args={[0.1, 0.1, 0.1]} position={[0, 0.08, 0.12]} rotation={[0.2, 0, 0]}>{m.yellow}</RB><RB args={[0.1, 0.1, 0.1]} position={[0, 0.08, -0.12]} rotation={[-0.2, 0, 0]}>{m.yellow}</RB><RB args={[0.035, 0.035, 0.05]} position={[0, 0.12, -0.16]} rotation={[-0.3, 0, 0]}>{m.brown}</RB><mesh position={[0.025, 0.11, 0.17]} castShadow><sphereGeometry args={[0.022, 10, 10]} />{m.white}</mesh></group>;
            case 'cowboy': return <group position={[0, 0.02, 0]}><RB args={[0.5, 0.04, 0.4]}>{m.brown}</RB><RB args={[0.26, 0.2, 0.26]} position={[0, 0.12, 0]}>{m.brown}</RB><RB args={[0.28, 0.05, 0.28]} position={[0, 0.06, 0]}>{m.leather}</RB><mesh position={[0, 0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow><coneGeometry args={[0.045, 0.02, 5]} />{m.starGold}</mesh></group>;
            case 'wizard': return <group position={[0, 0.02, 0]}><RB args={[0.45, 0.04, 0.45]}>{m.feltIndigo}</RB><RB args={[0.25, 0.15, 0.25]} position={[0, 0.1, 0]}>{m.feltIndigo}</RB><RB args={[0.27, 0.04, 0.27]} position={[0, 0.04, 0]}>{m.gold}</RB><RB args={[0.15, 0.15, 0.15]} position={[0, 0.25, 0]}>{m.feltIndigo}</RB><RB args={[0.08, 0.15, 0.08]} position={[0, 0.4, 0]}>{m.feltIndigo}</RB><mesh position={[0, 0.1, 0.13]} rotation={[Math.PI / 2, 0, 0]} castShadow><coneGeometry args={[0.04, 0.02, 5]} />{m.starGold}</mesh></group>;
            case 'headphones': return <group position={[0, -0.05, 0]}><RB args={[0.36, 0.06, 0.1]} position={[0, 0.2, 0]}>{m.satinBlack}</RB><RB args={[0.06, 0.2, 0.1]} position={[0.18, 0.1, 0]}>{m.satinBlack}</RB><RB args={[0.06, 0.2, 0.1]} position={[-0.18, 0.1, 0]}>{m.satinBlack}</RB><RB args={[0.12, 0.18, 0.18]} position={[0.22, 0.0, 0]}>{m.satinBlack}</RB><RB args={[0.12, 0.18, 0.18]} position={[-0.22, 0.0, 0]}>{m.satinBlack}</RB><mesh position={[0.285, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />{m.cyanGlow}</mesh><mesh position={[-0.285, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />{m.cyanGlow}</mesh></group>;
            case 'viking': return <group position={[0, 0.075, 0]}><RB args={[0.34, 0.15, 0.34]}>{m.steel}</RB><RB args={[0.36, 0.045, 0.36]} position={[0, -0.06, 0]}>{m.gold}</RB><RB args={[0.08, 0.2, 0.08]} position={[0.18, 0.1, 0]}>{m.ivory}</RB><RB args={[0.08, 0.2, 0.08]} position={[-0.18, 0.1, 0]}>{m.ivory}</RB></group>;
            case 'cap': return <group position={[0, 0.06, 0]}><RB args={[0.32, 0.12, 0.32]}>{m.red}</RB><RB args={[0.32, 0.04, 0.15]} position={[0, -0.04, 0.2]}>{m.red}</RB><RB args={[0.3, 0.015, 0.13]} position={[0, -0.062, 0.2]}>{m.slate}</RB><mesh position={[0, 0.075, 0]} castShadow><sphereGeometry args={[0.035, 12, 12]} />{m.slate}</mesh></group>;
            case 'hardhat': return <group position={[0, 0.07, 0]}><RB args={[0.34, 0.15, 0.34]}>{m.yellow}</RB><RB args={[0.36, 0.04, 0.36]} position={[0, -0.05, 0]}>{m.yellow}</RB><RB args={[0.1, 0.05, 0.36]} position={[0, 0.1, 0]}>{m.yellow}</RB><RB args={[0.345, 0.03, 0.345]} position={[0, -0.025, 0]}>{m.navy}</RB><RB args={[0.1, 0.07, 0.02]} position={[0, 0.0, 0.175]}>{m.navy}</RB><mesh position={[0, 0.0, 0.19]} castShadow><sphereGeometry args={[0.022, 10, 10]} />{m.ruby}</mesh></group>;
            case 'glasses': return <group position={[0, -0.14, 0.17]}><RB args={[0.32, 0.08, 0.04]}>{m.black}</RB><RB args={[0.04, 0.04, 0.2]} position={[0.16, 0, -0.1]}>{m.black}</RB><RB args={[0.04, 0.04, 0.2]} position={[-0.16, 0, -0.1]}>{m.black}</RB></group>;
            case 'beanie': return <group position={[0, 0.06, 0]}><RB args={[0.34, 0.06, 0.34]} position={[0, -0.04, 0]}>{m.feltBlue}</RB><RB args={[0.32, 0.12, 0.32]}>{m.darkBlue}</RB><RB args={[0.28, 0.08, 0.28]} position={[0, 0.1, 0]}>{m.darkBlue}</RB><mesh position={[0, 0.18, 0]} castShadow><sphereGeometry args={[0.06, 14, 14]} />{m.white}</mesh></group>;
            case 'sombrero': return <group position={[0, 0.1, 0]}><RB args={[0.6, 0.04, 0.6]} position={[0, -0.08, 0]}>{m.orange}</RB><RB args={[0.3, 0.25, 0.3]} position={[0, 0.05, 0]}>{m.orange}</RB><RB args={[0.32, 0.05, 0.32]} position={[0, -0.04, 0]}>{m.red}</RB><RB args={[0.2, 0.1, 0.2]} position={[0, 0.2, 0]}>{m.orange}</RB></group>;
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
    const techProps = { color: '#22d3ee', clippingPlanes, transparent: isGhost, opacity: opacity, depthWrite: !isGhost };
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
            {!isGhost && <RB args={[0.06, 0.06, 0.02]} position={[0, 0.05, -0.06]} castShadow={!isGhost}>
                <meshStandardMaterial {...techProps} />
            </RB>}
        </group>
    );
};
