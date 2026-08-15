
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Edges } from '@react-three/drei';
import * as THREE from 'three'; 
import * as THREE_LIB from 'three'; // Use a safer import for internal refs
import { damp } from 'maath/easing';
import { Move, CellType, Theme } from '../../types';
import { VoxelMaterial, LOCK_KEY_COLORS, coordRandom } from './Shared';
import { getBombTexture, getMatteTexture } from '../../utils/textureGenerator';

export const CrystalGem3D: React.FC<{ position: [number, number, number], color: string, isMissed?: boolean }> = ({ position, color, isMissed }) => {
    const groupRef = useRef<THREE_LIB.Group>(null);

    // Boxy GOLD COIN — money to earn. Standard packages are gold; named lock-colors
    // stay tinted so colored key-coins still read as special.
    const isGold = !LOCK_KEY_COLORS[color] || color === 'green';
    const c = isMissed ? '#f43f5e' : (isGold ? '#FFD24A' : LOCK_KEY_COLORS[color]);
    const rim = isMissed ? '#b91c1c' : (isGold ? '#E0A82E' : c);
    const pip = isMissed ? '#7f1d1d' : (isGold ? '#9A6B08' : c);

    const offsets = useMemo(() => ({
        phase: Math.random() * Math.PI * 2,
        floatFreq: 2.0 + Math.random() * 0.5,
        spinSpeed: 1.8 + Math.random() * 0.5
    }), []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            const t = state.clock.elapsedTime + offsets.phase;
            groupRef.current.position.y = position[1] + 0.45 + Math.sin(t * offsets.floatFreq) * 0.1;
            groupRef.current.rotation.y += delta * offsets.spinSpeed * (isMissed ? 2.5 : 1.0);
        }
    });

    const mat = (col: string, emis: number) => (
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={isMissed ? emis : 0} toneMapped={!isMissed} roughness={0.5} metalness={0.1} />
    );

    return (
        <group position={position}>
            <group ref={groupRef} scale={0.34}>
                {/* faceted voxel coin — octagonal prism, not a smooth disc */}
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.55, 0.55, 0.16, 8]} />
                    {mat(c, 1.8)}
                </mesh>
                {/* raised rim band — low-poly faceted ring */}
                <mesh>
                    <torusGeometry args={[0.55, 0.06, 6, 8]} />
                    {mat(rim, 1.2)}
                </mesh>
                {/* embossed center pip on each face */}
                {[0.085, -0.085].map((z, i) => (
                    <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.22, 0.22, 0.04, 8]} />
                        {mat(pip, 1.0)}
                    </mesh>
                ))}
            </group>
        </group>
    );
};

export const Key3D: React.FC<{ position: [number, number, number], color: string, isMissed?: boolean }> = ({ position, color, isMissed }) => {
    const ref = useRef<THREE_LIB.Group>(null);
    const c = isMissed ? '#f43f5e' : (LOCK_KEY_COLORS[color] || color);
    const pulseSpeed = isMissed ? 8 : 3;
    const spinSpeed = isMissed ? 5 : 2;
    

    useFrame((state, delta) => { 
        if (ref.current) { 
            ref.current.rotation.y += delta * spinSpeed; 
            ref.current.position.y = 0.75 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.05; 
        } 
    });
    
    return (
        <group position={position} scale={0.4}>
            <group ref={ref} rotation={[0, 0, Math.PI/4]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.15, 0.65, 0.15]} />
                    <meshStandardMaterial color={c} metalness={0.15} roughness={0.55} />
                </mesh>
                <Box args={[0.3, 0.3, 0.12]} position={[0, 0.35, 0]} castShadow>
                    <meshStandardMaterial color="#7c8694" metalness={0.2} roughness={0.55} />
                </Box>
                <Box args={[0.15, 0.15, 0.14]} position={[0, 0.35, 0]}>
                    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} toneMapped={false} />
                </Box>
                <Box args={[0.2, 0.1, 0.1]} position={[0.1, -0.15, 0]} castShadow>
                    <meshStandardMaterial color={c} roughness={0.6} />
                </Box>
                <Box args={[0.2, 0.1, 0.1]} position={[0.1, -0.3, 0]} castShadow>
                    <meshStandardMaterial color={c} roughness={0.6} />
                </Box>
            </group>
        </group>
    );
};

export const ForceField3D: React.FC<{ position: [number, number, number], color: string, isLocked?: boolean }> = ({ position, color, isLocked = true }) => {
    const c = LOCK_KEY_COLORS[color] || color;
    const groupRef = useRef<THREE_LIB.Group>(null);
    const shackleRef = useRef<THREE_LIB.Group>(null);
    const bodyRef = useRef<THREE_LIB.Mesh>(null);
    
    // Animation State: 0 = Locked, 1 = Unlocked/Gone
    const unlockProgress = useRef(isLocked ? 0 : 1);

    const shackleColorHex = '#E5C100';

    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.1);
        const target = isLocked ? 0 : 1;
        
        // Smooth transition for unlock progress (0.25s approx)
        damp(unlockProgress, 'current', target, 0.25, dt);
        
        const p = unlockProgress.current;

        if (groupRef.current && shackleRef.current) {
            // --- Unlock Sequence Animation ---
            // 1. Shackle Lift (0.0 -> 0.3)
            const liftPhase = Math.min(1, Math.max(0, p / 0.3));
            const liftAmt = liftPhase * 0.2; 

            // 2. Shackle Twist (0.2 -> 0.5) - Overlaps with lift slightly for realism
            const twistPhase = Math.min(1, Math.max(0, (p - 0.2) / 0.3));
            const twistAmt = twistPhase * (Math.PI * 0.5); // 90 degrees

            shackleRef.current.position.y = 0.71 + liftAmt;
            shackleRef.current.rotation.y = twistAmt;

            // 3. Sink into ground & Shrink (0.5 -> 1.0)
            if (p > 0.5) {
                const sinkPhase = (p - 0.5) / 0.5; // Normalized 0 to 1
                const sinkAmt = sinkPhase * sinkPhase * 1.5; // Quadratic easing for gravity drop feel
                
                groupRef.current.position.y = -sinkAmt;
                
                // Fade out/Scale down at very end to prevent clipping artifacts
                const scalePhase = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
                const currentScale = 0.7 * (1 - scalePhase);
                groupRef.current.scale.setScalar(currentScale);
            } else {
                groupRef.current.position.y = 0;
                groupRef.current.scale.setScalar(0.7);
            }
            
            // Hide completely when finished
            groupRef.current.visible = p < 0.99;
        }
    });

    return (
        <group position={position}>
            <group ref={groupRef} scale={0.7}>
                {/* Voxel padlock body — a plain box, no bevel/extrude */}
                <mesh ref={bodyRef} position={[0, 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.44, 0.36, 0.2]} />
                    <meshStandardMaterial color={c} metalness={0.1} roughness={0.75} />
                </mesh>

                {/* Shackle Group — a boxy "U" (top bar + two legs), not a torus loop */}
                <group ref={shackleRef} position={[0, 0.71, 0]}>
                    <mesh position={[0, 0.08, 0]}>
                        <boxGeometry args={[0.3, 0.1, 0.1]} />
                        <meshStandardMaterial color={shackleColorHex} metalness={0.15} roughness={0.6} flatShading />
                    </mesh>
                    <mesh position={[-0.1, -0.05, 0]}>
                        <boxGeometry args={[0.1, 0.24, 0.1]} />
                        <meshStandardMaterial color={shackleColorHex} metalness={0.15} roughness={0.6} flatShading />
                    </mesh>
                    <mesh position={[0.1, -0.05, 0]}>
                        <boxGeometry args={[0.1, 0.24, 0.1]} />
                        <meshStandardMaterial color={shackleColorHex} metalness={0.15} roughness={0.6} flatShading />
                    </mesh>
                </group>

                {/* Keyhole Detail — a small square notch, not a circle */}
                <group position={[0, 0.47, 0.11]}>
                    <mesh>
                        <boxGeometry args={[0.07, 0.07, 0.02]} />
                        <meshStandardMaterial color="#1a0505" roughness={1} />
                    </mesh>
                    <mesh position={[0, -0.05, 0]}>
                        <boxGeometry args={[0.04, 0.06, 0.02]} />
                        <meshStandardMaterial color="#1a0505" roughness={1} />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

export const Bomb: React.FC<{ position: [number, number, number], seed?: number }> = ({ position, seed = 0 }) => {
    const ref = useRef<THREE_LIB.Group>(null);
    const texture = useMemo(() => getBombTexture('#2c3e50'), []);
    const capTexture = useMemo(() => getMatteTexture('#ef4444'), []); 
    
    const rotationY = useMemo(() => {
        let rand = seed === 0 ? coordRandom(position[0], position[2]) : Math.abs(Math.sin(seed * 9999)) % 1;
        return rand * Math.PI * 2;
    }, [position, seed]);

    useFrame((state) => { 
        if(ref.current) { 
            const t = state.clock.elapsedTime; 
            const scale = 1.0 + Math.sin(t * 10) * 0.03;
            ref.current.scale.setScalar(scale);
            ref.current.rotation.y = rotationY + t * 0.5; 
            ref.current.rotation.z = Math.sin(t * 15) * 0.05;
        }
    });
    
    return (
        <group position={[position[0], 0.35, position[2]]} ref={ref}>
            {/* Voxel bomb body — a plain cube, not a faceted dodecahedron */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial map={texture} color="#34495e" roughness={0.7} />
                <Edges threshold={15} color="#111" />
            </mesh>
            <mesh position={[0, 0.22, 0]} castShadow>
                <boxGeometry args={[0.16, 0.08, 0.16]} />
                <meshStandardMaterial map={capTexture} color="#ef4444" roughness={0.4} />
                <Edges threshold={15} color="#300" />
            </mesh>
        </group>
    );
};

export const CosmicPortal: React.FC<{ 
    position: [number, number, number], 
    color: string, 
    isOpen: boolean, 
    isActive?: boolean, 
    rotationSpeed?: number, 
    scale?: number, 
    shape?: 'square' | 'circle',
    theme?: Theme 
}> = ({ position, color, isOpen, isActive, scale = 0.6, theme = 'day' }) => {
    const apertureRef = useRef<THREE_LIB.Group>(null);
    const ringRef = useRef<THREE_LIB.Group>(null);
    const baseTexture = useMemo(() => getMatteTexture('#1e293b'), []); 
    const scaleRef = useRef(isActive ? 1.4 : (isOpen ? 1.0 : 0.7));

    useFrame((state, delta) => { 
        const target = isActive ? 1.4 : (isOpen ? 1.0 : 0.7);
        damp(scaleRef, 'current', target, 0.15, delta);
        if (apertureRef.current) { 
            const t = state.clock.elapsedTime; 
            const breathe = isActive ? (1 + Math.sin(t * 6) * 0.08) : 1.0; 
            const s = scaleRef.current * breathe;
            apertureRef.current.scale.set(s, s, s); 
        }
        if (ringRef.current && (isOpen || isActive)) {
            ringRef.current.rotation.z += delta * 1.5;
        }
    });

    const emissiveInt = isActive ? 4.0 : (isOpen ? 2.2 : 0.4);
    const archColor = color || '#38bdf8';

    return (
        <group position={[position[0], 0, position[2]]} scale={scale}>
            {/* Ground Pedestal Base */}
            <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[0.62, 0.68, 0.06, 8]} />
                <meshStandardMaterial map={baseTexture} color="#0f172a" roughness={0.8} />
            </mesh>

            {/* Inner Swirling Energy Disc */}
            <group ref={apertureRef} position={[0, 0.065, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.42, 8]} />
                    <meshBasicMaterial color="#020617" side={THREE_LIB.DoubleSide} />
                </mesh>
                
                {/* Glowing Floor Aperture Ring */}
                <group ref={ringRef}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.38, 0.035, 6, 8]} />
                        <meshStandardMaterial 
                            color={archColor} 
                            emissive={archColor} 
                            emissiveIntensity={emissiveInt} 
                            toneMapped={false} 
                            roughness={0.3} 
                            metalness={0.2} 
                        />
                    </mesh>
                </group>
            </group>

            {/* 3D Toy Archway Pillars (Left & Right) */}
            <group position={[0, 0, 0]}>
                {/* Left Pillar */}
                <mesh position={[-0.42, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.14, 0.85, 0.14]} />
                    <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.1} />
                </mesh>
                <mesh position={[-0.42, 0.9, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.08, 0.18]} />
                    <meshStandardMaterial color={archColor} emissive={archColor} emissiveIntensity={emissiveInt * 0.5} roughness={0.4} />
                </mesh>

                {/* Right Pillar */}
                <mesh position={[0.42, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.14, 0.85, 0.14]} />
                    <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.1} />
                </mesh>
                <mesh position={[0.42, 0.9, 0]} castShadow>
                    <boxGeometry args={[0.18, 0.08, 0.18]} />
                    <meshStandardMaterial color={archColor} emissive={archColor} emissiveIntensity={emissiveInt * 0.5} roughness={0.4} />
                </mesh>

                {/* Top Lintel Arch Beam */}
                <mesh position={[0, 0.96, 0]} castShadow>
                    <boxGeometry args={[1.02, 0.14, 0.16]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.75} metalness={0.1} />
                </mesh>

                {/* Center Gateway Crest */}
                <mesh position={[0, 1.05, 0]} castShadow>
                    <boxGeometry args={[0.22, 0.12, 0.18]} />
                    <meshStandardMaterial 
                        color={archColor} 
                        emissive={archColor} 
                        emissiveIntensity={emissiveInt} 
                        roughness={0.3} 
                    />
                </mesh>
            </group>
        </group>
    );
};

// A floating, glowing transfer emblem that hovers over a teleporter pad
const TransferEmblem: React.FC<{ position: [number, number, number], color: string }> = ({ position, color }) => {
    const ref = useRef<THREE_LIB.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.03;
            ref.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06;
        }
    });
    const matProps = { color, emissive: color, emissiveIntensity: 2.5, toneMapped: false, roughness: 0.3, metalness: 0.2 };
    return (
        <group position={[position[0], 0.55, position[2]]} ref={ref} scale={0.45}>
            {/* Boxy Transfer Beacon */}
            <mesh castShadow><boxGeometry args={[0.08, 0.44, 0.08]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[0.28, 0.08, 0.08]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.28, 0.08, 0.08]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, -0.15, 0]} castShadow><boxGeometry args={[0.28, 0.08, 0.08]} /><meshStandardMaterial {...matProps} /></mesh>
        </group>
    );
};

export const Teleporter: React.FC<{ position: [number, number, number], color: string }> = ({ position, color }) => (
    <group>
        {/* Voxel Warp Pad */}
        <mesh position={[position[0], 0.02, position[2]]} receiveShadow>
            <cylinderGeometry args={[0.48, 0.52, 0.04, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[position[0], 0.045, position[2]]}>
            <torusGeometry args={[0.36, 0.03, 6, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} roughness={0.3} toneMapped={false} />
        </mesh>
        <TransferEmblem position={position} color={color} />
    </group>
);
