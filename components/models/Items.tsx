
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Edges, RoundedBox, Torus, Octahedron } from '@react-three/drei';
import * as THREE from 'three'; 
import * as THREE_LIB from 'three'; // Use a safer import for internal refs
import { damp } from 'maath/easing';
import { Move, CellType } from '../../types';
import { VoxelMaterial, LOCK_KEY_COLORS, coordRandom, GHOST_EDGE_COLOR } from './Shared';
import { getGemTexture, getBombTexture, getMatteTexture, getMetalTexture } from '../../utils/textureGenerator';

// The core collectible is now a spinning GOLD COIN (with an embossed $) instead
// of an abstract gem — the literal "you earned money" reward in a money game.
// Colored variants stay tinted so colored key-coins still read as special.
export const CrystalGem3D: React.FC<{ position: [number, number, number], color: string, isMissed?: boolean }> = ({ position, color, isMissed }) => {
    const groupRef = useRef<THREE_LIB.Group>(null);

    const isGold = !LOCK_KEY_COLORS[color] || color === 'green';
    const c = isMissed ? '#f43f5e' : (isGold ? '#FFD24A' : (LOCK_KEY_COLORS[color] || color));
    const rim = isMissed ? '#b91c1c' : (isGold ? '#E0A82E' : c);
    const texture = useMemo(() => getMetalTexture(c), [c]);

    const offsets = useMemo(() => ({
        phase: Math.random() * Math.PI * 2,
        floatFreq: 2.0 + Math.random() * 0.5,
        spinSpeed: 1.8 + Math.random() * 0.5
    }), []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            const t = state.clock.elapsedTime + offsets.phase;
            groupRef.current.position.y = position[1] + 0.45 + Math.sin(t * offsets.floatFreq) * 0.1;
            // Spin around Y like a classic collectible coin.
            groupRef.current.rotation.y += delta * offsets.spinSpeed * (isMissed ? 2.5 : 1.0);
        }
    });

    const coinMat = (
        <meshStandardMaterial map={texture} color={c} metalness={0.06} roughness={0.52}
            emissive={c} emissiveIntensity={isMissed ? 1.6 : 0} toneMapped={!isMissed} />
    );
    const engrave = '#9a6b08';

    return (
        <group position={position}>
            <group ref={groupRef} scale={0.34}>
                {/* Coin disc — faces ±Z, spins about Y. */}
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.55, 0.55, 0.14, 28]} />
                    {coinMat}
                </mesh>
                {/* Raised milled rim around the edge. */}
                <mesh>
                    <torusGeometry args={[0.55, 0.07, 10, 28]} />
                    <meshStandardMaterial color={rim} metalness={0.08} roughness={0.5} emissive={rim} emissiveIntensity={isMissed ? 1.2 : 0} toneMapped={!isMissed} />
                </mesh>
                {/* Embossed "$" on both faces. */}
                {[0.075, -0.075].map((z, i) => (
                    <group key={i} position={[0, 0, z]}>
                        <mesh><boxGeometry args={[0.07, 0.46, 0.04]} /><meshStandardMaterial color={engrave} metalness={0.05} roughness={0.55} /></mesh>
                        <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.3, 0.075, 0.04]} /><meshStandardMaterial color={engrave} metalness={0.05} roughness={0.55} /></mesh>
                        <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.07, 0.04]} /><meshStandardMaterial color={engrave} metalness={0.05} roughness={0.55} /></mesh>
                        <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.3, 0.075, 0.04]} /><meshStandardMaterial color={engrave} metalness={0.05} roughness={0.55} /></mesh>
                    </group>
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
    
    const texture = useMemo(() => getMetalTexture(c), [c]);

    useFrame((state, delta) => { 
        if (ref.current) { 
            ref.current.rotation.y += delta * spinSpeed; 
            ref.current.position.y = 0.75 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.05; 
        } 
    });
    
    return (
        <group position={position} scale={0.4}>
            {/* Simple matte-gold key: shaft + one ring bow + one tooth (cute/premium/simple). */}
            <group ref={ref} rotation={[0, 0, Math.PI/4]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.13, 0.62, 0.13]} />
                    <meshStandardMaterial map={texture} color={c} metalness={0.06} roughness={0.55} />
                </mesh>
                <mesh position={[0, 0.4, 0]} castShadow>
                    <torusGeometry args={[0.14, 0.055, 8, 18]} />
                    <meshStandardMaterial map={texture} color={c} metalness={0.06} roughness={0.55} />
                </mesh>
                <Box args={[0.18, 0.1, 0.11]} position={[0.11, -0.22, 0]} castShadow>
                    <meshStandardMaterial map={texture} color={c} metalness={0.06} roughness={0.55} />
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
    const bodyTexture = useMemo(() => getMetalTexture(c), [c]);
    const shackleTexture = useMemo(() => getMetalTexture(shackleColorHex), []);

    const bodyGeo = useMemo(() => {
        const shape = new THREE_LIB.Shape();
        const w = 0.22; const h = 0.18;
        shape.moveTo(-w, -h); shape.lineTo(w, -h); shape.lineTo(w, h); shape.lineTo(-w, h); shape.lineTo(-w, -h);
        const geom = new THREE_LIB.ExtrudeGeometry(shape, {
            steps: 1, depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1      
        });
        geom.center(); return geom;
    }, []);

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
                <mesh ref={bodyRef} geometry={bodyGeo} position={[0, 0.5, 0]} castShadow receiveShadow>
                    <meshStandardMaterial map={bodyTexture} color={c} metalness={0.05} roughness={0.72} />
                </mesh>
                
                {/* Shackle Group */}
                <group ref={shackleRef} position={[0, 0.71, 0]}>
                    <mesh rotation={[0, 0, 0]}>
                            <torusGeometry args={[0.15, 0.05, 6, 5, Math.PI]} />
                            <meshStandardMaterial map={shackleTexture} color={shackleColorHex} metalness={0.08} roughness={0.55} flatShading />
                    </mesh>
                    <mesh position={[-0.15, -0.12, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.25, 6]} />
                        <meshStandardMaterial map={shackleTexture} color={shackleColorHex} metalness={0.08} roughness={0.55} flatShading />
                    </mesh>
                    <mesh position={[0.15, -0.12, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.25, 6]} />
                        <meshStandardMaterial map={shackleTexture} color={shackleColorHex} metalness={0.08} roughness={0.55} flatShading />
                    </mesh>
                </group>

                {/* Keyhole Detail */}
                <group position={[0, 0.47, 0.13]}>
                    <mesh rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
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

// The instant-fail hazard is now a "DEBT TRAP": a dark-red money sack with a lit
// fuse — a bad money decision about to blow up your savings. Clearly money AND
// clearly dangerous, and visually distinct from the gold-coin collectible
// (red & grounded with a sparking fuse vs gold & floating & spinning).
export const Bomb: React.FC<{ position: [number, number, number], seed?: number }> = ({ position, seed = 0 }) => {
    const ref = useRef<THREE_LIB.Group>(null);
    const sparkRef = useRef<THREE_LIB.Mesh>(null);
    const texture = useMemo(() => getMatteTexture('#6b1f1f'), []);

    const rotationY = useMemo(() => {
        let rand = seed === 0 ? coordRandom(position[0], position[2]) : Math.abs(Math.sin(seed * 9999)) % 1;
        return rand * Math.PI * 2;
    }, [position, seed]);

    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.elapsedTime;
            ref.current.scale.setScalar(1.0 + Math.sin(t * 8) * 0.04);
            ref.current.rotation.y = Math.sin(t * 0.9) * 0.22; // gentle look-around — keeps the cute face forward
            ref.current.rotation.z = Math.sin(t * 6) * 0.05;
        }
        if (sparkRef.current) {
            const t = state.clock.elapsedTime;
            sparkRef.current.scale.setScalar(0.8 + Math.abs(Math.sin(t * 14)) * 0.6);
        }
    });

    return (
        <group position={[position[0], 0.32, position[2]]} ref={ref}>
            {/* Cute round bomb — a soft matte-dark ball; the lit spark is the one danger glow. */}
            <mesh castShadow receiveShadow scale={[1, 1.02, 1]}>
                <sphereGeometry args={[0.27, 22, 18]} />
                <meshStandardMaterial map={texture} color="#2b2b36" roughness={0.62} metalness={0.08} />
            </mesh>
            {/* simple geometric eyes — the SAME single matte dot as the character, but
                light so they read on the dark bomb (a watchful little hazard). No glossy
                shine, no sclera / pupils / sparkle — matches the unified low-poly look. */}
            <group position={[0, 0.02, 0.247]}>
                <RoundedBox args={[0.056, 0.074, 0.02]} radius={0.025} smoothness={4} position={[0.07, 0, 0]}><meshStandardMaterial color="#eaeaf0" roughness={0.6} metalness={0} /></RoundedBox>
                <RoundedBox args={[0.056, 0.074, 0.02]} radius={0.025} smoothness={4} position={[-0.07, 0, 0]}><meshStandardMaterial color="#eaeaf0" roughness={0.6} metalness={0} /></RoundedBox>
            </group>
            {/* fuse cap + fuse */}
            <mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.055, 0.075, 0.06, 12]} /><meshStandardMaterial color="#3a3a46" roughness={0.7} /></mesh>
            <mesh position={[0.05, 0.35, 0]} rotation={[0, 0, -0.5]} castShadow><cylinderGeometry args={[0.014, 0.014, 0.14, 6]} /><meshStandardMaterial color="#8a6a44" roughness={1} /></mesh>
            {/* BIG cute spark + soft glow halo */}
            <mesh ref={sparkRef} position={[0.11, 0.44, 0]}><sphereGeometry args={[0.075, 12, 12]} /><meshStandardMaterial color="#fff4b0" emissive="#ff8a00" emissiveIntensity={3.5} toneMapped={false} /></mesh>
            <mesh position={[0.11, 0.44, 0]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color="#ffb733" emissive="#ff7a00" emissiveIntensity={1.3} toneMapped={false} transparent opacity={0.28} depthWrite={false} /></mesh>
        </group>
    );
};

export const CosmicPortal: React.FC<{ position: [number, number, number], color: string, isOpen: boolean, isActive?: boolean, rotationSpeed?: number, scale?: number, shape?: 'square' | 'circle' }> = ({ position, color, isOpen, isActive, scale = 0.6, shape = 'square' }) => {
    const apertureRef = useRef<THREE_LIB.Group>(null);
    const baseTexture = useMemo(() => getMatteTexture('#1e293b'), []); 
    const scaleRef = useRef(isActive ? 1.5 : (isOpen ? 0.85 : 0.6));

    useFrame((state, delta) => { 
        const target = isActive ? 1.5 : (isOpen ? 0.85 : 0.6);
        damp(scaleRef, 'current', target, 0.1, delta);
        if(apertureRef.current) { 
            const t = state.clock.elapsedTime; 
            const breathe = isActive ? (1 + Math.sin(t * 5) * 0.08) : 1.0; 
            const s = scaleRef.current * breathe;
            apertureRef.current.scale.set(s, 1, s); 
        } 
    });

    const emissiveInt = isActive ? 5.0 : 2.5;

    if (shape === 'circle') {
        return (
            <group position={[position[0], 0, position[2]]} scale={scale}>
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <cylinderGeometry args={[0.45, 0.45, 0.01, 32]} />
                    <meshStandardMaterial map={baseTexture} color="#1e293b" />
                </mesh>
                <group ref={apertureRef} position={[0, 0, 0]}>
                    {(isOpen || isActive) && (
                        <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[0.35, 32]} />
                            <meshBasicMaterial color="#000000" side={THREE_LIB.DoubleSide} />
                        </mesh>
                    )}
                    <group position={[0, 0.03, 0]}>
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.35, 0.04, 16, 32]} />
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveInt} toneMapped={false} roughness={0.65} metalness={0.05} />
                        </mesh>
                    </group>
                </group>
            </group>
        );
    }

    return (
        <group position={[position[0], 0, position[2]]} scale={scale}>
            <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.7, 0.04, 0.7]} />
                <meshStandardMaterial map={baseTexture} color="#1e293b" />
            </mesh>
            <group ref={apertureRef}>
                {(isOpen || isActive) && (
                    <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.45, 0.45]} />
                        <meshBasicMaterial color="#000000" side={THREE_LIB.DoubleSide} />
                    </mesh>
                )}
                <group position={[0, 0.05, 0]}>
                    <mesh position={[0, 0, 0.25]}>
                        <boxGeometry args={[0.6, 0.05, 0.1]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveInt} toneMapped={false} roughness={0.65} metalness={0.05} />
                    </mesh>
                    <mesh position={[0, 0, -0.25]}>
                        <boxGeometry args={[0.6, 0.05, 0.1]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveInt} toneMapped={false} roughness={0.65} metalness={0.05} />
                    </mesh>
                    <mesh position={[0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <boxGeometry args={[0.6, 0.05, 0.1]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveInt} toneMapped={false} roughness={0.65} metalness={0.05} />
                    </mesh>
                    <mesh position={[-0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <boxGeometry args={[0.6, 0.05, 0.1]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveInt} toneMapped={false} roughness={0.65} metalness={0.05} />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

// A floating, glowing "$" beacon that hovers over a teleporter pad — reframing
// the warp as a MONEY TRANSFER point (wire/ATM): step in here, your money
// (and you) move instantly to the linked pad.
const TransferEmblem: React.FC<{ position: [number, number, number], color: string }> = ({ position, color }) => {
    const ref = useRef<THREE_LIB.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.02;
            ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.07;
        }
    });
    const matProps = { color, emissive: color, emissiveIntensity: 2.2, toneMapped: false, roughness: 0.65, metalness: 0.05 };
    return (
        <group position={[position[0], 0.6, position[2]]} ref={ref} scale={0.5}>
            <mesh><boxGeometry args={[0.07, 0.5, 0.07]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.32, 0.08, 0.07]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, 0, 0]}><boxGeometry args={[0.32, 0.08, 0.07]} /><meshStandardMaterial {...matProps} /></mesh>
            <mesh position={[0, -0.17, 0]}><boxGeometry args={[0.32, 0.08, 0.07]} /><meshStandardMaterial {...matProps} /></mesh>
        </group>
    );
};

export const Teleporter: React.FC<{ position: [number, number, number], color: string }> = ({ position, color }) => (
    <group>
        <CosmicPortal position={position} color={color} isOpen={true} scale={0.5} shape="square" />
        <TransferEmblem position={position} color={color} />
    </group>
);
