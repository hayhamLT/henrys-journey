
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../types';

interface CloudLayerProps {
    opacity: number;
    count: number;
    scaleRange: [number, number];
    radius: number;
    depth: number;
    speedFactor: number;
}

// Define config arrays outside component to ensure stable references
const LAYER_1_SCALE: [number, number] = [0.1, 0.25];
const LAYER_2_SCALE: [number, number] = [0.2, 0.4];
const LAYER_3_SCALE: [number, number] = [0.4, 0.8];

const CloudLayer: React.FC<CloudLayerProps> = React.memo(({ opacity, count, scaleRange, radius, depth, speedFactor }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Generate initial state for clouds using Spherical Coordinates
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            // Random Size - Significantly smaller
            const scaleBase = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
            
            // Spherical coordinates
            // Theta: Azimuthal angle (around Y axis) 0 -> 2PI
            const theta = Math.random() * Math.PI * 2;
            
            // Phi: Polar angle (from Y axis down) 0 -> PI
            // Use acos distribution for uniform sphere surface coverage
            const v = Math.random(); 
            const phi = Math.acos(2 * v - 1); 

            // Radius with some depth variance
            const r = radius + (Math.random() - 0.5) * depth;

            temp.push({
                theta: theta,
                phi: phi,
                radius: r,
                // Very slow drift speed
                speed: (0.002 + Math.random() * 0.004) * speedFactor,
                // Puffier scale
                scale: new THREE.Vector3(scaleBase * 1.5, scaleBase * 1.2, scaleBase * 1.5),
                // Random initial rotation
                rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
                // Very gentle tumble
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.005,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.005
                }
            });
        }
        return temp;
    }, [count, scaleRange, radius, depth, speedFactor]);

    // PRE-RENDER INITIALIZATION (Fixes 0,0,0 flash)
    useLayoutEffect(() => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        
        particles.forEach((p, i) => {
            const sinPhi = Math.sin(p.phi);
            const x = p.radius * sinPhi * Math.cos(p.theta);
            const y = p.radius * Math.cos(p.phi);
            const z = p.radius * sinPhi * Math.sin(p.theta);
            
            dummy.position.set(x, y, z);
            dummy.rotation.copy(p.rotation);
            dummy.scale.copy(p.scale);
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [particles]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Cap delta to prevent huge jumps on tab switch
        const dt = Math.min(delta, 0.1);
        
        const dummy = new THREE.Object3D();
        
        particles.forEach((p, i) => {
            // Orbit logic: Rotate around Y axis (Theta)
            p.theta += p.speed * dt;
            
            // Convert Spherical to Cartesian
            const sinPhi = Math.sin(p.phi);
            const x = p.radius * sinPhi * Math.cos(p.theta);
            const y = p.radius * Math.cos(p.phi);
            const z = p.radius * sinPhi * Math.sin(p.theta);
            
            dummy.position.set(x, y, z);
            
            // Gentle tumbling
            p.rotation.x += p.rotSpeed.x * dt;
            p.rotation.y += p.rotSpeed.y * dt;
            p.rotation.z += p.rotSpeed.z * dt;

            dummy.rotation.copy(p.rotation);
            dummy.scale.copy(p.scale);
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
            {/* Icosahedron for softer, puffier cloud shape */}
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
                color="#ffffff" 
                transparent 
                opacity={opacity} 
                flatShading 
                roughness={1.0}
                metalness={0.0}
                depthWrite={false} 
            />
        </instancedMesh>
    );
});

interface SkySystem3DProps {
    theme: Theme;
    quality?: 'normal' | 'low';
}

export const SkySystem3D: React.FC<SkySystem3DProps> = React.memo(({ theme, quality = 'normal' }) => {
    // Only render 3D clouds for World 1 (Day theme)
    if (theme !== 'day') return null;

    const low = quality === 'low';

    return (
        <>
            {/* Inner Layer - Smallest details, closest */}
            <CloudLayer 
                opacity={0.12} 
                count={low ? 140 : 400} 
                scaleRange={LAYER_1_SCALE} 
                radius={35}
                depth={8}
                speedFactor={1.0} 
            />
            {/* Middle Layer */}
            <CloudLayer 
                opacity={0.20} 
                count={low ? 110 : 300} 
                scaleRange={LAYER_2_SCALE} 
                radius={50}
                depth={12}
                speedFactor={0.7} 
            />
            {/* Outer Layer - Larger, background */}
            <CloudLayer 
                opacity={0.30} 
                count={low ? 80 : 200} 
                scaleRange={LAYER_3_SCALE} 
                radius={70}
                depth={15}
                speedFactor={0.4} 
            />
        </>
    );
});
