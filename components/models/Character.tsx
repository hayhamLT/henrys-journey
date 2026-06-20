
import React, { useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { Move, HatId, EyeState, GameStatus, CharacterAppearance, Theme } from '../../types';
import { VoxelMaterial, GhostEdges, getGreetingPalette } from './Shared';
import { VoxelHat, BackpackDetail } from './Hats';
import { LEVEL_COMPLETE_GREETINGS } from '../../constants/messages';

interface CharacterProps { skinColor: string; shirtColor: string; pantsColor: string; hairColor: string; eyeColor?: string; hatId: HatId; opacity?: number; eyeState: EyeState; isMoving: boolean; isCelebrating: boolean; isGirl?: boolean; grounded?: boolean; isTurning?: boolean; headLookY?: number; celebrationType?: 'level' | 'world' | null; isWalking?: boolean; physicsImpulse?: number; isIdle?: boolean; clippingPlanes?: THREE.Plane[]; hideHat?: boolean; isFalling?: boolean; isCharred?: boolean; isGhost?: boolean; isWaiting?: boolean; }

const GreetingText: React.FC<{ text: string, theme: Theme }> = ({ text, theme }) => {
    // Use state with lazy initialization to generate configuration exactly once on mount.
    const [charConfigs] = useState(() => {
        const palette = getGreetingPalette(theme);
        return text.split('').map((char, i) => {
            const rot = (Math.random() - 0.5) * 20; 
            const colorObj = palette[i % palette.length];
            return {
                char,
                key: i,
                style: {
                    '--char-color': colorObj.c,
                    '--char-rot': `${rot}deg`,
                    '--char-x-start': `${(Math.random() - 0.5) * 5}px`,
                    '--char-x-end': `${(Math.random() - 0.5) * 60}px`,
                    animationDelay: `${i * 0.06}s`,
                    animationDuration: '2.5s',
                    textShadow: `3px 3px 0px ${colorObj.s}, 5px 5px 10px rgba(0,0,0,0.3)`
                } as React.CSSProperties
            };
        });
    });
    
    return (
        <div className="greeting-container">
            {charConfigs.map((config) => (
                <span key={config.key} className="greeting-char" style={config.style}>
                    {config.char}
                </span>
            ))}
        </div>
    );
};

const HintContent: React.FC<{ text: string }> = ({ text }) => {
    const splitIndex = text.indexOf(':');
    if (splitIndex !== -1) {
        const title = text.substring(0, splitIndex);
        const desc = text.substring(splitIndex + 1);
        return (
            <>
                <div className="element-hint-title">{title}</div>
                <div>{desc}</div>
            </>
        );
    }
    return <>{text}</>;
};

export const VoxelCharacter: React.FC<CharacterProps> = ({ skinColor, shirtColor, pantsColor, hairColor, eyeColor = "#333", hatId, opacity = 1, eyeState, isMoving, isCelebrating, isGirl = false, grounded = false, isTurning = false, headLookY = 0, celebrationType, isWalking = false, physicsImpulse = 0, isIdle = false, clippingPlanes, hideHat = false, isFalling = false, isCharred = false, isGhost = false, isWaiting = false }) => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const hatRef = useRef<THREE.Group>(null);
    const leftLegGroup = useRef<THREE.Group>(null);
    const rightLegGroup = useRef<THREE.Group>(null);
    const leftArmGroup = useRef<THREE.Group>(null);
    const rightArmGroup = useRef<THREE.Group>(null);
    const leftPigtailRef = useRef<THREE.Group>(null);
    const rightPigtailRef = useRef<THREE.Group>(null);

    const [blinking, setBlinking] = useState(false);
    const physicsRotation = useRef(0);
    
    const randomOffset = useRef(Math.random() * 100);

    const finalOpacity = opacity;

    useEffect(() => {
        let timeoutId: number;
        const blinkLoop = () => { 
            timeoutId = window.setTimeout(() => { 
                setBlinking(true); 
                timeoutId = window.setTimeout(() => { 
                    setBlinking(false); 
                    blinkLoop(); 
                }, 150); 
            }, Math.random() * 3000 + 2000); 
        };
        blinkLoop();
        return () => clearTimeout(timeoutId);
    }, []);
    
    const BODY_BASE_Y = 0.35;
    
    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.1); // Cap delta for physics
        const t = state.clock.elapsedTime + randomOffset.current;
        damp(physicsRotation, 'current', -physicsImpulse * 2.5, 0.15, dt);

        if (isGhost && groupRef.current) {
            groupRef.current.position.y = 0.22 + Math.sin(t * 3.5) * 0.08; 
            const armAngle = 1.3; 
            const armFloat = Math.sin(t * 5.0) * 0.12; 
            if (leftArmGroup.current) { leftArmGroup.current.rotation.z = -armAngle + armFloat; leftArmGroup.current.rotation.x = Math.sin(t * 7.0) * 0.35; }
            if (rightArmGroup.current) { rightArmGroup.current.rotation.z = armAngle - armFloat; rightArmGroup.current.rotation.x = Math.sin(t * 7.0) * 0.35; }
            const legBaseAngle = 0.2; const legWalkAmp = 0.25; const legSpeed = 10.0; 
            if (leftLegGroup.current) leftLegGroup.current.rotation.x = legBaseAngle + Math.sin(t * legSpeed) * legWalkAmp;
            if (rightLegGroup.current) rightLegGroup.current.rotation.x = legBaseAngle + Math.sin(t * legSpeed + Math.PI) * legWalkAmp; 
            if (bodyRef.current) { bodyRef.current.rotation.y = Math.sin(t * 2.0) * 0.07; bodyRef.current.rotation.z = Math.sin(t * 1.5) * 0.03; bodyRef.current.position.y = 0.35; }
            return; 
        }

        if (hatId === 'propeller' && hatRef.current) { const propGroup = hatRef.current.getObjectByName('propellerBlade'); if (propGroup) propGroup.rotation.y += 0.05; }
        if (headRef.current) { let targetY = headLookY || 0; damp(headRef.current.rotation, 'y', targetY, 0.2, dt); }
        if (isGirl && leftPigtailRef.current && rightPigtailRef.current) {
             const bounce = (isMoving || isWalking) ? Math.sin(t * 20) * 0.2 : Math.sin(t * 3) * 0.05;
             const sway = isTurning ? Math.sin(t * 15) * 0.1 : 0;
             damp(leftPigtailRef.current.rotation, 'z', 0.5 + bounce - sway + physicsRotation.current, 0.1, dt);
             damp(rightPigtailRef.current.rotation, 'z', -0.5 - bounce - sway - physicsRotation.current, 0.1, dt);
        }

        let leftArmBaseZ = 0; let rightArmBaseZ = 0;
        
        // PRIORITY: Falling > Celebrating > Waiting > Moving > Turning > Idle
        
        if (isFalling) {
            if (leftArmGroup.current) { leftArmGroup.current.rotation.z = Math.PI - 0.8 + Math.sin(t * 20) * 0.3; leftArmGroup.current.rotation.x = Math.cos(t * 15) * 0.5; }
            if (rightArmGroup.current) { rightArmGroup.current.rotation.z = -(Math.PI - 0.8 + Math.cos(t * 20) * 0.3); rightArmGroup.current.rotation.x = -Math.sin(t * 15) * 0.5; }
            if (leftLegGroup.current) leftLegGroup.current.rotation.x = Math.sin(t * 20) * 0.5;
            if (rightLegGroup.current) rightLegGroup.current.rotation.x = -Math.sin(t * 20) * 0.5;
        } else if (isCelebrating) {
            if (celebrationType === 'level') {
                if (bodyRef.current) { bodyRef.current.position.y = BODY_BASE_Y; }
                // Diving Pose - Arms Up
                leftArmBaseZ = 2.8; 
                rightArmBaseZ = -2.8;
                if (leftArmGroup.current) { leftArmGroup.current.rotation.x = 0; leftArmGroup.current.rotation.z = leftArmBaseZ; }
                if (rightArmGroup.current) { rightArmGroup.current.rotation.x = 0; rightArmGroup.current.rotation.z = rightArmBaseZ; }
                // Legs straight
                if (leftLegGroup.current) leftLegGroup.current.rotation.x = 0;
                if (rightLegGroup.current) rightLegGroup.current.rotation.x = 0;
            } else {
                if (groupRef.current && !isGhost) groupRef.current.position.y = 0;
                if (bodyRef.current) { bodyRef.current.position.y = BODY_BASE_Y; bodyRef.current.rotation.y = 0; }
                leftArmBaseZ = Math.PI - 0.5 + Math.sin(t * 10) * 0.15; rightArmBaseZ = -(Math.PI - 0.5 + Math.sin(t * 10) * 0.15);
                if (leftArmGroup.current) { leftArmGroup.current.rotation.x = 0; leftArmGroup.current.rotation.z = leftArmBaseZ; }
                if (rightArmGroup.current) { rightArmGroup.current.rotation.x = 0; rightArmGroup.current.rotation.z = rightArmBaseZ; }
                if (leftLegGroup.current) leftLegGroup.current.rotation.x = 0;
                if (rightLegGroup.current) rightLegGroup.current.rotation.x = 0;
            }
        } else if (isWaiting) {
            // Fast damp to static pose to prevent jitter - Absolute priority over movement/turning
            const dampTime = 0.05; 
            if (groupRef.current && !isGhost) groupRef.current.position.y = 0;
            if (bodyRef.current) { damp(bodyRef.current.position, 'y', BODY_BASE_Y, dampTime, dt); damp(bodyRef.current.rotation, 'z', 0, dampTime, dt); damp(bodyRef.current.rotation, 'y', 0, dampTime, dt); }
            if (leftLegGroup.current) { damp(leftLegGroup.current.rotation, 'x', 0, dampTime, dt); damp(leftLegGroup.current.rotation, 'z', 0, dampTime, dt); }
            if (rightLegGroup.current) { damp(rightLegGroup.current.rotation, 'x', 0, dampTime, dt); damp(rightLegGroup.current.rotation, 'z', 0, dampTime, dt); }
            if (leftArmGroup.current) { damp(leftArmGroup.current.rotation, 'x', 0, dampTime, dt); damp(leftArmGroup.current.rotation, 'z', 0.1, dampTime, dt); }
            if (rightArmGroup.current) { damp(rightArmGroup.current.rotation, 'x', 0, dampTime, dt); damp(rightArmGroup.current.rotation, 'z', -0.1, dampTime, dt); }
        } else if (isMoving || isWalking) {
            const speed = isMoving ? 20 : 15; const swingAmp = isMoving ? 0.8 : 0.7;
            if (bodyRef.current) { const bounce = Math.abs(Math.sin(t * speed)) * 0.03; bodyRef.current.position.y = BODY_BASE_Y + bounce; bodyRef.current.rotation.y = Math.sin(t * (speed/2)) * 0.05; }
            if (leftLegGroup.current) { leftLegGroup.current.rotation.x = Math.sin(t * speed) * 0.7; leftLegGroup.current.rotation.z = 0; }
            if (rightLegGroup.current) { rightLegGroup.current.rotation.x = Math.sin(t * speed + Math.PI) * 0.7; rightLegGroup.current.rotation.z = 0; }
            const armSwing = Math.sin(t * speed + Math.PI) * swingAmp; const casualArc = Math.cos(t * speed) * 0.15; 
            if (leftArmGroup.current) { leftArmGroup.current.rotation.x = armSwing; leftArmGroup.current.rotation.z = 0.15 + casualArc; }
            if (rightArmGroup.current) { rightArmGroup.current.rotation.x = -armSwing; rightArmGroup.current.rotation.z = -0.15 - casualArc; }
            if (groupRef.current && !isGhost) groupRef.current.position.y = 0;
            if (bodyRef.current) { bodyRef.current.rotation.z = 0; }
        } else if (isTurning) {
            if (bodyRef.current) { bodyRef.current.position.y = BODY_BASE_Y - 0.02 + Math.abs(Math.sin(t * 25)) * 0.01; }
            if (leftLegGroup.current) leftLegGroup.current.rotation.x = Math.sin(t * 30) * 0.4;
            if (rightLegGroup.current) rightLegGroup.current.rotation.x = -Math.sin(t * 30) * 0.4;
            if (leftArmGroup.current) { damp(leftArmGroup.current.rotation, 'z', 0.2, 0.1, dt); damp(leftArmGroup.current.rotation, 'x', 0, 0.1, dt); }
            if (rightArmGroup.current) { damp(rightArmGroup.current.rotation, 'z', -0.2, 0.1, dt); damp(rightArmGroup.current.rotation, 'x', 0, 0.1, dt); }
        } else {
            // Idle
            if (groupRef.current && !isGhost) groupRef.current.position.y = 0;
            const breatheY = Math.sin(t * 2.2) * 0.003;
            const shift = Math.sin(t * 0.7); const leanAmt = 0.04;
            if (bodyRef.current) { damp(bodyRef.current.position, 'y', BODY_BASE_Y + breatheY, 0.2, dt); damp(bodyRef.current.rotation, 'z', -shift * leanAmt, 0.3, dt); damp(bodyRef.current.rotation, 'y', Math.sin(t * 0.3) * 0.03, 0.5, dt); }
            if (leftLegGroup.current) { const isRelaxed = shift > 0.2; damp(leftLegGroup.current.rotation, 'x', isRelaxed ? 0.1 : 0, 0.2, dt); damp(leftLegGroup.current.rotation, 'z', isRelaxed ? 0.03 : 0, 0.2, dt); }
            if (rightLegGroup.current) { const isRelaxed = shift < -0.2; damp(rightLegGroup.current.rotation, 'x', isRelaxed ? 0.1 : 0, 0.2, dt); damp(rightLegGroup.current.rotation, 'z', isRelaxed ? -0.03 : 0, 0.2, dt); }
            const armNoise = Math.sin(t * 1.5) * 0.015 + Math.sin(t * 2.8) * 0.01;
            if (leftArmGroup.current) { damp(leftArmGroup.current.rotation, 'x', armNoise, 0.2, dt); damp(leftArmGroup.current.rotation, 'z', 0.12 + armNoise * 0.5 - (shift * 0.02), 0.2, dt); }
            if (rightArmGroup.current) { damp(rightArmGroup.current.rotation, 'x', -armNoise, 0.2, dt); damp(rightArmGroup.current.rotation, 'z', -0.12 - armNoise * 0.5 - (shift * 0.02), 0.2, dt); }
        }
    });
    
    const eyeScaleY = (blinking || eyeState === 'sleeping') ? 0.1 : 1;
    // Textures ON in-game (cloth weave / skin / hair) — they're cached 256px
    // canvas textures that already render in the shop preview; this is the single
    // biggest flat→premium jump for the character.
    const matProps = { transparent: finalOpacity < 1, opacity: finalOpacity, clippingPlanes, depthWrite: true, isGhost, disableTexture: false };
    const hairProps = { ...matProps, type: 'hair' as const };
    const clothProps = { ...matProps, type: 'cloth' as const };
    const skinProps = { ...matProps, type: 'skin' as const };
    const ghostEdges = isGhost ? <GhostEdges opacity={finalOpacity} /> : null;
    const chamferRadius = 0.085; const limbChamferRadius = 0.05; const chamferSmoothness = 2;
    const headWidth = 0.33; const headHeight = 0.305; const headDepth = 0.31; const headRadius = 0.135;

    return (
        <group ref={groupRef}>
            <group ref={bodyRef} position={[0, 0.35, 0]}>
                {/* one soft rounded chibi tummy — no collar, the big head does the work */}
                <RoundedBox args={[0.3, 0.26, 0.22]} radius={chamferRadius} smoothness={chamferSmoothness} position={[0, 0.12, 0]} castShadow={!isGhost} receiveShadow={!isGhost}><VoxelMaterial color={shirtColor} {...clothProps} />{ghostEdges}</RoundedBox>
                {/* cute/premium/simple: clothing is flat matte color-blocks — no
                    belt, collar, badge, buttons or straps. The face does the work. */}
                {isGirl ? (
                    <group position={[0, 0, 0]}>
                        <mesh position={[0, -0.09, 0]} castShadow={!isGhost} receiveShadow={!isGhost} scale={[0.26, 1, 0.16]}><cylinderGeometry args={[0.7071, 0.7425, 0.18, 4, 1, false, Math.PI / 4]} /><VoxelMaterial color={pantsColor} {...clothProps} />{ghostEdges}</mesh>
                    </group>
                ) : (
                    <RoundedBox args={[0.3, 0.13, 0.21]} radius={chamferRadius} smoothness={chamferSmoothness} position={[0, -0.05, 0]} castShadow={!isGhost} receiveShadow={!isGhost}><VoxelMaterial color={pantsColor} {...clothProps} />{ghostEdges}</RoundedBox>
                )}
                {!isGirl && !isFalling && !isGhost && <BackpackDetail color={pantsColor} clippingPlanes={clippingPlanes} isGhost={isGhost} opacity={finalOpacity} disableTexture={false} />}
                <group position={[0, 0.37, 0]} ref={headRef}>
                    <group scale={[1.45, 1.45, 1.45]}>
                        <RoundedBox args={[headWidth, headHeight, headDepth]} position={[0, 0.01, 0]} radius={headRadius} smoothness={chamferSmoothness} castShadow={!isGhost} receiveShadow={!isGhost}><VoxelMaterial color={skinColor} {...skinProps} />{ghostEdges}</RoundedBox>
                        {!isGhost && (
                            <group scale={[1, eyeScaleY, 1]} position={[0, 0.0, 0]}>
                                {[0.094, -0.094].map((ex, i) => (
                                  <group key={i} position={[ex, 0.0, 0.158]}>
                                    {/* big glossy chibi eye: white base + dark round iris + two sparkles */}
                                    <RoundedBox args={[0.108, 0.142, 0.012]} radius={0.052} smoothness={4} position={[0, 0, -0.001]}><meshStandardMaterial color="#FFFFFF" roughness={0.5} metalness={0} clippingPlanes={clippingPlanes} /></RoundedBox>
                                    <RoundedBox args={[0.085, 0.114, 0.024]} radius={0.042} smoothness={4} position={[0, -0.004, 0.007]}><meshStandardMaterial color={eyeColor} roughness={0.4} metalness={0} clippingPlanes={clippingPlanes} /></RoundedBox>
                                    <mesh position={[0.02, 0.032, 0.021]}><circleGeometry args={[0.024, 14]} /><meshStandardMaterial color="#FFFFFF" roughness={0.35} metalness={0} clippingPlanes={clippingPlanes} /></mesh>
                                    <mesh position={[-0.017, -0.028, 0.021]}><circleGeometry args={[0.0115, 12]} /><meshStandardMaterial color="#FFFFFF" roughness={0.35} metalness={0} clippingPlanes={clippingPlanes} /></mesh>
                                  </group>
                                ))}
                            </group>
                        )}
                        {!isGhost && (
                            <group position={[0, 0, 0]}>
                                {/* tiny soft smile (pushed forward to sit on the rounder, deeper head) */}
                                <mesh position={[0, -0.085, 0.163]} rotation={[0, 0, Math.PI]}>
                                    <torusGeometry args={[0.042, 0.013, 8, 18, Math.PI]} />
                                    <meshStandardMaterial color="#c4685a" roughness={0.9} metalness={0} clippingPlanes={clippingPlanes} />
                                </mesh>
                                {/* Rosy blush cheeks. */}
                                {[0.138, -0.138].map((bx, i) => (
                                  <mesh key={i} position={[bx, -0.05, 0.158]}>
                                    <circleGeometry args={[0.042, 16]} />
                                    <meshStandardMaterial color="#ff8f99" roughness={1} metalness={0} transparent opacity={0.7} clippingPlanes={clippingPlanes} />
                                  </mesh>
                                ))}
                            </group>
                        )}
                        <group position={[0, 0.15, 0]}>
                            {!hideHat && <group ref={hatRef} position={[0, 0.0, 0]}><VoxelHat id={hatId} clippingPlanes={clippingPlanes} isGhost={isGhost} opacity={finalOpacity} depthWrite={matProps.depthWrite} disableTexture={false} /></group>}
                            {/* simple rounded hair: soft crown cap + back + little fringe */}
                            <RoundedBox args={[headWidth + 0.025, 0.12, headDepth + 0.025]} radius={0.055} smoothness={chamferSmoothness} position={[0, -0.015, 0]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                            <RoundedBox args={[headWidth + 0.01, 0.16, 0.09]} radius={0.045} smoothness={chamferSmoothness} position={[0, -0.09, -0.13]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                            <RoundedBox args={[headWidth - 0.02, 0.055, 0.05]} radius={0.025} smoothness={chamferSmoothness} position={[0, -0.05, 0.15]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                            {isGirl && (
                                 <>
                                    <RoundedBox args={[headWidth + 0.02, 0.15, 0.08]} radius={0.02} smoothness={chamferSmoothness} position={[0, -0.15, -0.12]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                                    <RoundedBox args={[0.08, 0.22, 0.15]} radius={0.02} smoothness={chamferSmoothness} position={[0.16, -0.1, -0.02]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                                    <RoundedBox args={[0.08, 0.22, 0.15]} radius={0.02} smoothness={chamferSmoothness} position={[-0.16, -0.1, -0.02]} castShadow={!isGhost}><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</RoundedBox>
                                    <group ref={leftPigtailRef} position={[0.22, -0.05, 0]}><mesh position={[0, -0.08, 0]} castShadow={!isGhost} rotation={[0, Math.PI/4, 0]}><cylinderGeometry args={[0.04, 0.09, 0.25, 4]} /><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</mesh></group>
                                    <group ref={rightPigtailRef} position={[-0.22, -0.05, 0]}><mesh position={[0, -0.08, 0]} castShadow={!isGhost} rotation={[0, Math.PI/4, 0]}><cylinderGeometry args={[0.04, 0.09, 0.25, 4]} /><VoxelMaterial color={hairColor} {...hairProps} />{ghostEdges}</mesh></group>
                                 </>
                            )}
                            {/* Mila-only: a candy-pink hair bow that pops against the orange pigtails. */}
                            {!isGhost && isGirl && (
                                <group position={[0, 0.075, 0.05]}>
                                    <mesh position={[0.048, 0, 0]} rotation={[0, 0, -0.55]} castShadow={!isGhost}><coneGeometry args={[0.042, 0.085, 4]} /><VoxelMaterial color="#ff5fa2" {...clothProps} /></mesh>
                                    <mesh position={[-0.048, 0, 0]} rotation={[0, 0, 0.55 + Math.PI]} castShadow={!isGhost}><coneGeometry args={[0.042, 0.085, 4]} /><VoxelMaterial color="#ff5fa2" {...clothProps} /></mesh>
                                    <mesh position={[0, 0, 0.012]} castShadow={!isGhost}><sphereGeometry args={[0.026, 12, 12]} /><VoxelMaterial color="#ff5fa2" {...clothProps} /></mesh>
                                </group>
                            )}
                        </group>
                    </group>
                </group>
                {/* stub arm: one chunky sleeve + a round mitt hand */}
                <group ref={leftArmGroup} position={[-0.18, 0.2, 0]}><RoundedBox args={[0.1, 0.15, 0.1]} radius={0.048} smoothness={chamferSmoothness} position={[0, -0.06, 0]} castShadow={!isGhost}><VoxelMaterial color={shirtColor} {...clothProps} />{ghostEdges}</RoundedBox><RoundedBox args={[0.1, 0.085, 0.1]} radius={0.042} smoothness={chamferSmoothness} position={[0, -0.16, 0]} castShadow={!isGhost}><VoxelMaterial color={skinColor} {...skinProps} />{ghostEdges}</RoundedBox></group>
                <group ref={rightArmGroup} position={[0.18, 0.2, 0]}><RoundedBox args={[0.1, 0.15, 0.1]} radius={0.048} smoothness={chamferSmoothness} position={[0, -0.06, 0]} castShadow={!isGhost}><VoxelMaterial color={shirtColor} {...clothProps} />{ghostEdges}</RoundedBox><RoundedBox args={[0.1, 0.085, 0.1]} radius={0.042} smoothness={chamferSmoothness} position={[0, -0.16, 0]} castShadow={!isGhost}><VoxelMaterial color={skinColor} {...skinProps} />{ghostEdges}</RoundedBox></group>
            </group>
            {/* stub leg: one rounded leg + a round shoe */}
            <group ref={leftLegGroup} position={[-0.075, 0.2, 0]}>
                <RoundedBox args={[0.115, 0.17, 0.115]} radius={0.052} smoothness={chamferSmoothness} position={[0, -0.085, 0]} castShadow={!isGhost}><VoxelMaterial color={isGirl ? skinColor : pantsColor} {...(isGirl ? skinProps : clothProps)} />{ghostEdges}</RoundedBox>
                <RoundedBox args={[0.13, 0.075, 0.18]} radius={0.035} smoothness={chamferSmoothness} position={[0, -0.185, 0.028]} castShadow={!isGhost}><VoxelMaterial color={isGhost ? pantsColor : "#7a4a2b"} {...matProps} />{ghostEdges}</RoundedBox>
            </group>
            <group ref={rightLegGroup} position={[0.075, 0.2, 0]}>
                <RoundedBox args={[0.115, 0.17, 0.115]} radius={0.052} smoothness={chamferSmoothness} position={[0, -0.085, 0]} castShadow={!isGhost}><VoxelMaterial color={isGirl ? skinColor : pantsColor} {...(isGirl ? skinProps : clothProps)} />{ghostEdges}</RoundedBox>
                <RoundedBox args={[0.13, 0.075, 0.18]} radius={0.035} smoothness={chamferSmoothness} position={[0, -0.185, 0.028]} castShadow={!isGhost}><VoxelMaterial color={isGhost ? pantsColor : "#7a4a2b"} {...matProps} />{ghostEdges}</RoundedBox>
            </group>
        </group>
    );
}

export const Henry3D: React.FC<any> = (props) => {
    const { position, gameStatus, visualState, hatId, direction, onVisualStep, executionPath, gridSize, stepDuration, henryBubble, botCelebrationState, milaPosition, message, reportPosition, theme, failureType, isGhost, spawnPosition, appearance, eyeState, onFinish, activeHint } = props;
    const outerRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);
    const lastStepRef = useRef(-1);
    const [isTurning, setIsTurning] = useState(false);
    const [headLookY, setHeadLookY] = useState(0);
    const [greetingData, setGreetingData] = useState<{text: string, id: number} | null>(null);
    const celebrationStartRef = useRef(0);
    const celebrationActiveRef = useRef(false); // Track active state to prevent reset
    
    // NEW: Track prev status to trigger reset exactly once on entry to success
    const prevGameStatusRef = useRef(gameStatus);
    
    const lastLookChangeRef = useRef(0);
    const idleLookTargetRef = useRef(0);
    const startTimeRef = useRef(-1);
    const [visualPathFinished, setVisualPathFinished] = useState(false);
    
    // Falling physics state
    const fallVelocity = useRef(0);
    const fallY = useRef(0);
    const fallStartTime = useRef(0);
    
    // Determine charred state (hit a bomb)
    const isCharred = gameStatus === GameStatus.Failure && failureType === 'bomb';

    // Animation Refs for overriding
    const [isWalkingOverride, setIsWalkingOverride] = useState(false);

    // Initial positioning
    useLayoutEffect(() => {
        if (outerRef.current && position) {
            outerRef.current.position.set(position[0], position[1], position[2]);
        }
    }, [position]);

    useLayoutEffect(() => {
        if (visualState === 'spawn' && outerRef.current && position) {
            outerRef.current.position.set(position[0], position[1], position[2]);
            if(innerRef.current) {
                innerRef.current.position.y = -2.0; // Start deep underground for emergence
            }
        }
    }, [visualState, position]);

    useEffect(() => {
        if (visualState === 'spawn' && innerRef.current && !isGhost) {
            innerRef.current.scale.set(0, 0, 0);
        }
    }, [visualState, isGhost]);

    // Recalculate points from executionPath to ensure valid snap targets even after success state
    const points = useMemo(() => {
        if (executionPath && executionPath.length > 0 && gridSize) {
            const offsetX = (gridSize.cols - 1) / 2;
            const offsetZ = (gridSize.rows - 1) / 2;
            return executionPath.map((p: any) => ({ 
                vec: new THREE.Vector3(p.col - offsetX, 0, p.row - offsetZ), 
                isTeleport: p.isTeleport,
                isCollision: p.isCollision // Capture collision flag
            }));
        }
        return [];
    }, [executionPath, gridSize]);

    // Track status change to reset animation safely
    useEffect(() => {
        if (prevGameStatusRef.current !== gameStatus) {
            if (gameStatus === GameStatus.Executing) {
                 // FORCE RESET HERE ensures sequence plays from start with correct events
                 lastStepRef.current = -1;
                 startTimeRef.current = -1;
                 setVisualPathFinished(false);
            }
            
            if (gameStatus === GameStatus.Success && !celebrationActiveRef.current) {
                // RESET ANIMATION STATE ONCE
                celebrationActiveRef.current = true;
                const rand = LEVEL_COMPLETE_GREETINGS[Math.floor(Math.random() * LEVEL_COMPLETE_GREETINGS.length)];
                setGreetingData({ text: rand, id: Date.now() });
                
                // Force snap to final grid position to ensure diving into correct portal
                // This prevents visual glitches if the character ends on a neighboring tile
                if (outerRef.current) {
                     if (points.length > 0) {
                         const last = points[points.length - 1];
                         outerRef.current.position.copy(last.vec);
                     } else if (position) {
                         // Fallback to prop only if points not available
                         outerRef.current.position.set(position[0], position[1], position[2]);
                     }
                }
            } else if (gameStatus === GameStatus.Planning) {
                // Reset falling / other states
                fallVelocity.current = 0;
                fallY.current = 0;
                fallStartTime.current = 0;
                celebrationActiveRef.current = false;
                celebrationStartRef.current = 0; // RESET HERE INSTEAD
                setIsWalkingOverride(false);
                setVisualPathFinished(false);
                setGreetingData(null);
                startTimeRef.current = -1;
                lastStepRef.current = -1;
                if (innerRef.current) {
                    innerRef.current.rotation.x = 0;
                    innerRef.current.rotation.z = 0;
                }
            } else if (gameStatus === GameStatus.Failure) {
                setGreetingData(null);
                celebrationActiveRef.current = false;
            }
            prevGameStatusRef.current = gameStatus;
        }
    }, [gameStatus, position, points]);
    
    const floorClipPlane = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)], []);

    useFrame((state, delta) => {
        if (!outerRef.current || !innerRef.current) return;
        
        // --- STABILITY FIX: Clamp Delta for Physics ---
        const dt = Math.min(delta, 0.1);

        // --- SCALE LOGIC ---
        let targetScale = 1;
        if (!isGhost) {
             if (visualState === 'spawn') targetScale = 0;
             else if (visualState === 'teleport-out') targetScale = 0;
        }
        
        // --- FALLING LOGIC ---
        const isFalling = gameStatus === GameStatus.Failure && (failureType === 'hole');
        
        if (isFalling) {
             if (fallStartTime.current === 0) fallStartTime.current = state.clock.elapsedTime;
             const timeInFall = state.clock.elapsedTime - fallStartTime.current;
             
             damp(outerRef.current.position, 'x', position[0], 0.3, dt);
             damp(outerRef.current.position, 'z', position[2], 0.3, dt);
             
             if (timeInFall < 0.5) {
                 damp(innerRef.current.position, 'y', 0, 0.1, dt);
                 if (!isWalkingOverride) setIsWalkingOverride(true); 
             } else {
                 if (isWalkingOverride) setIsWalkingOverride(false);
             }

             if (timeInFall > 0.5) {
                 // Physics gravity
                 fallVelocity.current += dt * 60; 
                 fallY.current -= fallVelocity.current * dt;
                 
                 // Cap falling distance to avoid infinite drop or float errors
                 if (fallY.current < -10) fallY.current = -10;

                 innerRef.current.position.y = fallY.current;
                 innerRef.current.rotation.x = 0;
                 innerRef.current.rotation.z = 0;
             } 
             
             return; 
        } else {
             fallStartTime.current = 0;
             if(isWalkingOverride) setIsWalkingOverride(false);
        }

        let manualControl = false;

        if (gameStatus === GameStatus.Success && botCelebrationState === 'level') {
             manualControl = true;
             
             // Initialize animation start time ONCE when it's 0.
             if (celebrationStartRef.current === 0) {
                 celebrationStartRef.current = state.clock.elapsedTime;
                 // Force ensure position is snapped again just in case frame loop ran before effect
                 if (points.length > 0) {
                     const last = points[points.length - 1];
                     outerRef.current.position.copy(last.vec);
                 } else {
                     outerRef.current.position.set(position[0], position[1], position[2]);
                 }
             }
             
             const t = state.clock.elapsedTime - celebrationStartRef.current;
             
             // Jump and Dive into Portal
             const diveDuration = 0.8;
             
             if (t < diveDuration) {
                 const p = t / diveDuration;
                 let y = 0;
                 if (p < 0.4) {
                     const subP = p / 0.4;
                     y = Math.sin(subP * Math.PI / 2) * 1.5; 
                 } else {
                     const subP = (p - 0.4) / 0.6;
                     y = 1.5 - (subP * subP * 3.5);
                 }
                 
                 innerRef.current.position.y = y;
                 innerRef.current.rotation.y += dt * 8; 
                 innerRef.current.rotation.x = 0;
                 
                 let s = 1;
                 if (y < 0) {
                     s = Math.max(0, 1 + (y * 0.5));
                 }
                 innerRef.current.scale.setScalar(s);
                 innerRef.current.visible = true;
             } else {
                 innerRef.current.visible = false;
                 innerRef.current.position.y = -10; 
             }
        }

        let turning = false;
        let targetHeadY = 0;
        
        // Is Emerging check: Character is below ground and rising
        const isEmerging = !isGhost && innerRef.current.position.y < -0.05 && gameStatus !== GameStatus.Success && !isFalling;

        if (!manualControl) {
            if (!isGhost) {
                damp(innerRef.current.scale, 'x', targetScale, 0.2, dt);
                damp(innerRef.current.scale, 'y', targetScale, 0.2, dt);
                damp(innerRef.current.scale, 'z', targetScale, 0.2, dt);
                // Ensure character snaps to ground if not celebrating/falling/emerging
                damp(innerRef.current.position, 'y', 0, 0.25, dt); 
            } else {
                // Ghost Logic - Fixed scale, visibility based on distance
                const ghostScale = 0.9;
                damp(innerRef.current.scale, 'x', ghostScale, 0.15, dt);
                damp(innerRef.current.scale, 'y', ghostScale, 0.15, dt);
                damp(innerRef.current.scale, 'z', ghostScale, 0.15, dt);

                // Hide ghost if it overlaps or is extremely close to the main character
                if (spawnPosition && outerRef.current) {
                     const currentPos = outerRef.current.position;
                     const dx = currentPos.x - spawnPosition[0];
                     const dz = currentPos.z - spawnPosition[2];
                     const distSq = dx*dx + dz*dz;
                     
                     // 0.8 units threshold squared is 0.64. Using slightly smaller to prevent premature hiding.
                     // 0.7 units -> 0.49
                     if (distSq < 0.49) {
                         if (innerRef.current.visible) innerRef.current.visible = false;
                     } else {
                         if (!innerRef.current.visible) innerRef.current.visible = true;
                     }
                }
            }
            
            // Only force visibility for non-ghosts
            if (!isGhost && innerRef.current.visible === false) {
                innerRef.current.visible = true;
            }
        }

        if (gameStatus === GameStatus.Executing && points.length > 1) {
            if (startTimeRef.current < 0) {
                startTimeRef.current = state.clock.elapsedTime;
            }
            const totalSegments = points.length - 1;
            const stepSec = (stepDuration || 250) / 1000;
            const totalTime = totalSegments * stepSec;
            
            const elapsed = state.clock.elapsedTime - startTimeRef.current; 
            let progress = elapsed / totalTime;
            
            // Trigger completion slightly early (at 98%) to ensure instant transition feeling
            // and prevent any "hanging" at the last frame.
            if (progress >= 0.98 && !visualPathFinished) {
                setVisualPathFinished(true);
                // Snap to final position immediately to prevent off-center dive
                if (points.length > 0) {
                    const last = points[points.length - 1];
                    outerRef.current.position.copy(last.vec);
                }
                if (onFinish) onFinish();
            }
            progress = Math.min(progress, 1);
            
            const globalT = progress * totalSegments;
            
            // SNAPPY FIX: Firing visual step exactly at midpoint (0.5) makes collection feel immediate.
            const biasedT = Math.floor(globalT + 0.5); 
            
            if (biasedT > lastStepRef.current) { 
                // Only trigger new steps, don't re-trigger
                for (let i = lastStepRef.current + 1; i <= biasedT; i++) {
                    if (onVisualStep) onVisualStep(i);
                }
                lastStepRef.current = biasedT; 
            }
            
            // ... movement logic uses original globalT for smooth interpolation ...
            let currentIndex = Math.floor(globalT);
            if (currentIndex >= totalSegments) currentIndex = totalSegments - 1;
            
            const localT = Math.min(1, globalT - currentIndex);
            
            const pA = points[currentIndex];
            const pB = points[currentIndex + 1];
            
            if (pB.isCollision) {
                // Bounce/Recoil Animation: Move slightly towards wall then back
                const bumpFactor = Math.sin(localT * Math.PI) * 0.15; 
                outerRef.current.position.lerpVectors(pA.vec, pB.vec, bumpFactor);
                
                // Tilt back for impact feel
                innerRef.current.rotation.x = -Math.sin(localT * Math.PI) * 0.2; 
                // Only modify Y if NOT celebrating to prevent conflicts, though Execution shouldn't overlap celebration
                if (!manualControl) innerRef.current.position.y = 0;
            } else if (pB.isTeleport) {
                // FIXED: Always show pop effect for teleport even if adjacent (distance 1)
                if (localT < 0.5) {
                    outerRef.current.position.copy(pA.vec);
                    const s = 1 - (localT * 2);
                    innerRef.current.scale.setScalar(Math.max(0, s)); 
                } else {
                    outerRef.current.position.copy(pB.vec);
                    const s = (localT - 0.5) * 2;
                    innerRef.current.scale.setScalar(Math.min(1, s)); 
                }
                if (!manualControl) innerRef.current.position.y = 0;
            } else {
                outerRef.current.position.lerpVectors(pA.vec, pB.vec, localT);
                const jumpHeight = 0.5;
                if (!manualControl) innerRef.current.position.y = Math.sin(localT * Math.PI) * jumpHeight; 
                innerRef.current.rotation.x = 0; // Reset tilt
            }

            if (!pB.isTeleport) {
                const dx = pB.vec.x - pA.vec.x;
                const dz = pB.vec.z - pA.vec.z;
                if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                    const targetRot = Math.atan2(dx, dz);
                    let currentRot = innerRef.current.rotation.y;
                    if (targetRot - currentRot > Math.PI) currentRot += Math.PI * 2;
                    if (currentRot - targetRot > Math.PI) currentRot -= Math.PI * 2;
                    const diff = targetRot - currentRot;
                    if (Math.abs(diff) > 0.1) turning = true;
                    innerRef.current.rotation.y += diff * 0.2; 
                    targetHeadY = diff * 1.5; 
                }
            }

        } else if (!manualControl) {
            startTimeRef.current = -1; 
            
            // Standard Position Update
            if (visualState === 'spawn') {
                outerRef.current.position.set(position[0], position[1], position[2]);
                if (!manualControl) {
                    // Handled by damp in the block above
                }
            } else {
                // FASTER GHOST MOVEMENT - reduced damping time
                const smooth = isGhost ? 0.06 : 0.2; 
                
                // FIX: Snap if distance is large (prevent flying on level load)
                const currentPos = outerRef.current.position;
                const targetX = position[0];
                const targetZ = position[2];
                const distSq = (currentPos.x - targetX)**2 + (currentPos.z - targetZ)**2;
                
                if (distSq > 25 && !isGhost) { // > 5 units squared
                     outerRef.current.position.set(targetX, currentPos.y, targetZ);
                } else {
                     damp(outerRef.current.position, 'x', targetX, smooth, dt);
                     damp(outerRef.current.position, 'z', targetZ, smooth, dt);
                }
                
                if (!isGhost) {
                    // Ensure recoil rotation is reset
                    damp(innerRef.current.rotation, 'x', 0, 0.2, dt);
                }
            }
            
            let targetRot = 0;
            
            if (gameStatus === GameStatus.Planning && milaPosition && !isGhost) {
                const dx = milaPosition.x - outerRef.current.position.x;
                const dz = milaPosition.z - outerRef.current.position.z;
                const angleToMila = Math.atan2(dx, dz);
                let bodyDirRot = 0;
                if (direction === Move.Up) bodyDirRot = Math.PI; 
                else if (direction === Move.Down) bodyDirRot = 0; 
                else if (direction === Move.Left) bodyDirRot = -Math.PI/2;
                else if (direction === Move.Right) bodyDirRot = Math.PI/2;
                targetRot = bodyDirRot;
                let diff = angleToMila - bodyDirRot;
                if (diff > Math.PI) diff -= Math.PI * 2;
                if (diff < -Math.PI) diff += Math.PI * 2;
                targetHeadY = Math.max(-1.2, Math.min(1.2, diff));
            } else if (gameStatus === GameStatus.Planning) {
                const time = state.clock.elapsedTime;
                // Faster/more varied look changes for more life
                const lookChange = Math.floor(time / 1.5); 
                if (lookChange !== lastLookChangeRef.current) {
                    lastLookChangeRef.current = lookChange;
                    if (Math.random() > 0.5) {
                        idleLookTargetRef.current = (Math.random() - 0.5) * 1.5;
                    } else {
                        idleLookTargetRef.current = 0;
                    }
                }
                targetHeadY = idleLookTargetRef.current;
                
                if (direction === Move.Up) targetRot = Math.PI; 
                else if (direction === Move.Down) targetRot = 0; 
                else if (direction === Move.Left) targetRot = -Math.PI/2;
                else if (direction === Move.Right) targetRot = Math.PI/2;
            } else {
                if (direction === Move.Up) targetRot = Math.PI; 
                else if (direction === Move.Down) targetRot = 0; 
                else if (direction === Move.Left) targetRot = -Math.PI/2; 
                else if (direction === Move.Right) targetRot = Math.PI/2;
            }
            
            let currentRot = innerRef.current.rotation.y;
            if (targetRot - currentRot > Math.PI) currentRot += Math.PI * 2;
            if (currentRot - targetRot > Math.PI) currentRot -= Math.PI * 2;
            const diff = targetRot - currentRot;
            if (Math.abs(diff) > 0.1) turning = true;
            
            // Adjust ghost rotation speed to match position interpolation
            const rotSmooth = isGhost ? 0.06 : 0.1;
            
            damp(innerRef.current.rotation, 'y', targetRot, rotSmooth, dt);
            
            if (gameStatus === GameStatus.Planning) { lastStepRef.current = -1; }
        }
        
        // Force turning off if we are visually finished to prevent glitch
        if (visualPathFinished) turning = false;
        
        setIsTurning(turning);
        setHeadLookY(targetHeadY);

        if (reportPosition) {
            reportPosition(outerRef.current.position);
        }
    });
    
    const isCelebrating = (gameStatus === GameStatus.Success && botCelebrationState !== null);
    
    // Extract text from object OR use henryBubble (legacy)
    const textToShow = message ? message.text : (henryBubble ? henryBubble.text : null);
    const isExiting = message ? message.isExiting : false;
    
    const isFallingState = gameStatus === GameStatus.Failure && (failureType === 'hole');
    const isGirl = appearance?.model === 'mila';

    return (
        <group ref={outerRef}>
            <group ref={innerRef}>
                <VoxelCharacter 
                    skinColor={appearance?.skinColor || "#F2C48D"} 
                    shirtColor={appearance?.shirtColor || "#FF7675"} 
                    pantsColor={appearance?.pantsColor || "#74B9FF"} 
                    hairColor={appearance?.hairColor || "#634236"} 
                    eyeColor={appearance?.eyeColor || "#333333"}
                    hatId={hatId} eyeState={eyeState} 
                    isMoving={gameStatus === GameStatus.Executing && !visualPathFinished} 
                    isCelebrating={isCelebrating} isTurning={isTurning} headLookY={headLookY} 
                    celebrationType={botCelebrationState} isIdle={gameStatus === GameStatus.Planning} 
                    clippingPlanes={isFallingState || isGhost ? [] : floorClipPlane}
                    hideHat={false}
                    isFalling={isFallingState}
                    isCharred={isCharred}
                    isWalking={isWalkingOverride}
                    isGhost={isGhost}
                    opacity={isGhost ? 0.6 : 1}
                    isGirl={isGirl}
                    isWaiting={gameStatus === GameStatus.Executing && visualPathFinished}
                />
            </group>
            
            {/* Priority: Greeting > Hint > Regular Thought */}
            {isCelebrating && greetingData && <Html position={[0, 2.0, 0]} center zIndexRange={[10000, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10000 }}><GreetingText key={greetingData.id} text={greetingData.text} theme={theme} /></Html>}
            
            {!isCelebrating && !isGhost && (
                <>
                    {activeHint ? (
                        <Html position={[0, 1.5, 0]} center zIndexRange={[10000, 0]} style={{ pointerEvents: 'none', zIndex: 10000 }}>
                            <div className="element-hint-bubble">
                                <HintContent text={activeHint.text} />
                            </div>
                        </Html>
                    ) : textToShow ? (
                        <Html key={textToShow} position={[0, 1.3, 0]} center zIndexRange={[10000, 0]} style={{ pointerEvents: 'none', zIndex: 10000 }}>
                            <div className={`thought-bubble thought-bubble--henry ${isExiting ? 'exiting' : ''}`}>{textToShow}</div>
                        </Html>
                    ) : null}
                </>
            )}
        </group>
    );
};

export const Mila3D: React.FC<any> = ({ direction, animationState, message, heroModel, henryPosition }) => {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null);

    // FIX: Add clipping plane to prevent character from being seen below floor
    const floorClipPlane = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)], []);

    useFrame((state, delta) => {
        if (!groupRef.current || !innerRef.current) return;
        
        const dt = Math.min(delta, 0.1);

        // --- POSITION Y (Pop up/down) ---
        let targetY = 0;
        if (animationState === 'out') {
             targetY = -2.5; // Go back down
        } else if (animationState === 'in') {
             targetY = 0; // Come up
        } else if (animationState === 'idle') {
             targetY = 0;
        }
        
        // Fast movement (0.1 damping time)
        damp(innerRef.current.position, 'y', targetY, 0.1, dt);

        // HIDE if deep underground to prevent clipping view
        if (innerRef.current.position.y < -2.0 && animationState === 'out') {
            innerRef.current.visible = false;
        } else {
            innerRef.current.visible = true;
        }

        // --- SCALE (Fixed) ---
        innerRef.current.scale.setScalar(1);

        // --- FACING LOGIC (No Spin) ---
        let targetRot = innerRef.current.rotation.y; 

        if (henryPosition) {
            const worldPos = new THREE.Vector3();
            groupRef.current.getWorldPosition(worldPos);
            const dx = henryPosition.x - worldPos.x;
            const dz = henryPosition.z - worldPos.z;
            targetRot = Math.atan2(dx, dz);
        } else {
             if (direction === Move.Up) targetRot = Math.PI;
             else if (direction === Move.Down) targetRot = 0;
             else if (direction === Move.Left) targetRot = -Math.PI/2;
             else if (direction === Move.Right) targetRot = Math.PI/2;
        }

        // Normalize rotation to prevent 360 spins when crossing PI/-PI boundaries
        let currentRot = innerRef.current.rotation.y;
        if (targetRot - currentRot > Math.PI) currentRot += Math.PI * 2;
        if (currentRot - targetRot > Math.PI) currentRot -= Math.PI * 2;
        innerRef.current.rotation.y = currentRot;

        damp(innerRef.current.rotation, 'y', targetRot, 0.2, dt);
    });
    
    useLayoutEffect(() => {
        if (animationState === 'in' && innerRef.current) {
            // Start underground instantly when 'in' starts
            innerRef.current.position.y = -2.5;
            innerRef.current.visible = true;
        }
    }, [animationState]);

    // Determine appearance based on who the hero is
    // If hero is Mila, distracter is Henry. If hero is Henry (or null/default), distracter is Mila.
    const isHeroMila = heroModel === 'mila';
    
    const colors = isHeroMila ? {
        // Henry Colors
        skin: '#F2C48D',
        shirt: '#FF7675',
        pants: '#74B9FF',
        hair: '#634236',
        isGirl: false
    } : {
        // Mila Colors
        skin: '#F2C48D',
        shirt: '#d946ef',
        pants: '#4c1d95',
        hair: '#F59E0B',
        isGirl: true
    };

    return (
        <group ref={groupRef}>
            <group ref={innerRef}>
                <VoxelCharacter
                    skinColor={colors.skin}
                    shirtColor={colors.shirt}
                    pantsColor={colors.pants}
                    hairColor={colors.hair}
                    eyeColor="#333"
                    hatId="none"
                    eyeState="default"
                    isMoving={false}
                    isCelebrating={false}
                    isGirl={colors.isGirl} 
                    isIdle={true}
                    clippingPlanes={floorClipPlane} 
                />
            </group>
            {message && (
                <Html position={[0, 1.45, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none', zIndex: 10000 }}>
                    <div className="thought-bubble thought-bubble--mila">{message}</div>
                </Html>
            )}
        </group>
    );
};

export const HatPreview: React.FC<{ hatId: HatId, appearance?: CharacterAppearance }> = ({ hatId, appearance }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    // Removed the swaying rotation useFrame to let them walk straight forward
    // The ShopTab camera rotates around them instead

    const defaults: CharacterAppearance = {
        model: 'henry',
        skinColor: '#F2C48D',
        shirtColor: '#FF7675',
        pantsColor: '#74B9FF',
        hairColor: '#634236',
        eyeColor: '#333333'
    };

    const app = { ...defaults, ...appearance };

    return (
        <group ref={groupRef} position={[0, -0.7, 0]} scale={1.3}>
            <VoxelCharacter 
                skinColor={app.skinColor}
                shirtColor={app.shirtColor}
                pantsColor={app.pantsColor}
                hairColor={app.hairColor}
                eyeColor={app.eyeColor}
                hatId={hatId}
                eyeState="default"
                isMoving={false} // False so they don't move along a grid path
                isCelebrating={false}
                isGirl={app.model === 'mila'}
                isIdle={false} // Disable idle sway
                isWalking={true} // Enable treadmill walking animation
            />
        </group>
    );
};
