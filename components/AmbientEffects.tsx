
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../types';

interface AmbientEffectsProps {
    theme: Theme;
    quality?: 'normal' | 'low';
}

interface ParticleData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotationSpeed: THREE.Vector3; 
    scale: number;
    wobble: number;
    wobbleSpeed: number;
    spriteRotation: number; 
    spriteRotationSpeed: number;
}

interface EffectConfig {
    count: number;
    colors: string[];
    minSize: number;
    maxSize: number;
    area: [number, number, number]; 
    minSpeed: THREE.Vector3;
    maxSpeed: THREE.Vector3;
    shape: 'box' | 'sphere' | 'sprite';
    spriteSegments?: number; 
    opacity: number;
    blending: THREE.Blending;
    transparent: boolean;
    emissive?: boolean;
    emissiveColor?: string;
}

// Reduced particle counts for mobile performance optimization
const getConfig = (theme: Theme): EffectConfig | null => {
    switch (theme) {
        case 'day': 
            return null; // Clean look for World 1, only clouds
        case 'alpine': // Snow (Hexagons)
            return {
                count: 300, // Was 500
                colors: ['#ffffff', '#e0f2fe'],
                minSize: 0.005, maxSize: 0.02,
                area: [40, 30, 40],
                minSpeed: new THREE.Vector3(-0.5, -2.0, -0.5),
                maxSpeed: new THREE.Vector3(0.5, -0.8, 0.5),
                shape: 'sprite',
                spriteSegments: 6, 
                opacity: 0.5,
                blending: THREE.NormalBlending,
                transparent: true
            };
        case 'desert': // Sandstorm
            return {
                count: 800, // Was 2000 - Aggressive reduction for mobile
                colors: ['#FDE68A', '#FCD34D', '#fbbf24', '#f59e0b', '#d97706'], 
                minSize: 0.005, maxSize: 0.015,
                area: [60, 30, 60],
                minSpeed: new THREE.Vector3(6.0, -0.2, -0.5),
                maxSpeed: new THREE.Vector3(14.0, 0.2, 0.5),
                shape: 'sprite',
                spriteSegments: 4,
                opacity: 0.4,
                blending: THREE.NormalBlending,
                transparent: true
            };
        case 'volcanic': // Hot Ashes
            return {
                count: 250, // Was 500
                colors: ['#ffcc00', '#ffaa00', '#ff4400', '#ff0000', '#333333'], 
                minSize: 0.005, maxSize: 0.025,
                area: [40, 35, 40],
                minSpeed: new THREE.Vector3(-0.5, 0.5, -0.5),
                maxSpeed: new THREE.Vector3(0.5, 2.0, 0.5),
                shape: 'sprite',
                spriteSegments: 8, 
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#ff4400'
            };
        case 'cyber': // Digital Bits
            return {
                count: 150, // Was 350
                colors: ['#10b981', '#34d399', '#3b82f6'],
                minSize: 0.008, maxSize: 0.018,
                area: [40, 40, 40],
                minSpeed: new THREE.Vector3(0, 0.2, 0),
                maxSpeed: new THREE.Vector3(0, 0.8, 0),
                shape: 'box', 
                spriteSegments: 4,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#10b981'
            };
        case 'dusk': // Industrial Soot / Sparks
            return {
                count: 150, // Was 250
                colors: ['#1c1917', '#44403c', '#f59e0b'],
                minSize: 0.005, maxSize: 0.015,
                area: [40, 30, 40],
                minSpeed: new THREE.Vector3(-0.8, -0.2, -0.3),
                maxSpeed: new THREE.Vector3(0.8, 0.2, 0.3),
                shape: 'sprite',
                spriteSegments: 4,
                opacity: 0.5,
                blending: THREE.NormalBlending,
                transparent: true
            };
        case 'night': // Bioluminescent Spores
            return {
                count: 100, // Was 200
                colors: ['#38bdf8', '#818cf8', '#c084fc'],
                minSize: 0.005, maxSize: 0.025,
                area: [40, 30, 40],
                minSpeed: new THREE.Vector3(-0.1, 0.1, -0.1),
                maxSpeed: new THREE.Vector3(0.1, 0.5, 0.1),
                shape: 'sprite',
                spriteSegments: 8,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#818cf8'
            };
        case 'galaxy': // Stardust
            return {
                count: 300, // Was 600
                colors: ['#e879f9', '#22d3ee', '#ffffff'],
                minSize: 0.005, maxSize: 0.015,
                area: [60, 40, 60],
                minSpeed: new THREE.Vector3(-0.1, -0.1, -0.1),
                maxSpeed: new THREE.Vector3(0.1, 0.1, 0.1),
                shape: 'sprite',
                spriteSegments: 5,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#ffffff'
            };
        case 'crystal': // Sparkling Crystal Dust
            return {
                count: 200, // Was 400
                colors: ['#A5F3FC', '#E879F9', '#FFFFFF'],
                minSize: 0.005, maxSize: 0.02,
                area: [40, 30, 40],
                minSpeed: new THREE.Vector3(-0.05, -0.05, -0.05),
                maxSpeed: new THREE.Vector3(0.05, 0.05, 0.05),
                shape: 'sprite',
                spriteSegments: 4, 
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#A5F3FC'
            };
        case 'sunset': // Fireflies / Embers
            return {
                count: 150, // Was 300
                colors: ['#FDBA74', '#FCA5A5', '#FCD34D'],
                minSize: 0.01, maxSize: 0.03,
                area: [40, 30, 40],
                minSpeed: new THREE.Vector3(-0.3, 0.2, -0.3),
                maxSpeed: new THREE.Vector3(0.3, 0.8, 0.3),
                shape: 'sprite',
                spriteSegments: 8,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#FDBA74'
            };
        case 'sunrise': // Morning Mist
            return {
                count: 150, // Was 300
                colors: ['#CCFBF1', '#FEF3C7', '#FFFFFF'],
                minSize: 0.005, maxSize: 0.02,
                area: [40, 20, 40],
                minSpeed: new THREE.Vector3(0.5, -0.1, -0.2),
                maxSpeed: new THREE.Vector3(1.0, 0.1, 0.2),
                shape: 'sprite',
                spriteSegments: 6,
                opacity: 0.3,
                blending: THREE.NormalBlending,
                transparent: true
            };
        case 'builder': 
        case 'my-world': // Blueprint Speckles
            return {
                count: 100, // Was 200
                colors: ['#94a3b8', '#cbd5e1'],
                minSize: 0.005, maxSize: 0.01,
                area: [40, 40, 40],
                minSpeed: new THREE.Vector3(-0.1, -0.1, -0.1),
                maxSpeed: new THREE.Vector3(0.1, 0.1, 0.1),
                shape: 'box',
                spriteSegments: 4,
                opacity: 0.3,
                blending: THREE.NormalBlending,
                transparent: true
            };
        case 'arena': // Neon Confetti / Competition
            return {
                count: 200, // Was 400
                colors: ['#fbbf24', '#d946ef', '#22d3ee', '#f43f5e'],
                minSize: 0.008, maxSize: 0.02,
                area: [50, 40, 50],
                minSpeed: new THREE.Vector3(0, -0.5, 0),
                maxSpeed: new THREE.Vector3(0, -1.5, 0),
                shape: 'sprite',
                spriteSegments: 3, 
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                transparent: true,
                emissive: true,
                emissiveColor: '#d946ef'
            };
        default:
            return null;
    }
};

export const AmbientEffects: React.FC<AmbientEffectsProps> = ({ theme, quality = 'normal' }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const config = useMemo(() => {
        const base = getConfig(theme);
        if (!base) return null;
        if (quality !== 'low') return base;
        return {
            ...base,
            count: Math.max(40, Math.floor(base.count * 0.45)),
            opacity: Math.max(0.2, base.opacity * 0.85),
        };
    }, [theme, quality]);
    
    const particles = useMemo<ParticleData[]>(() => {
        if (!config) return [];
        const parts: ParticleData[] = [];
        for (let i = 0; i < config.count; i++) {
            parts.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * config.area[0],
                    (Math.random() - 0.5) * config.area[1],
                    (Math.random() - 0.5) * config.area[2]
                ),
                velocity: new THREE.Vector3(
                    config.minSpeed.x + Math.random() * (config.maxSpeed.x - config.minSpeed.x),
                    config.minSpeed.y + Math.random() * (config.maxSpeed.y - config.minSpeed.y),
                    config.minSpeed.z + Math.random() * (config.maxSpeed.z - config.minSpeed.z)
                ),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                scale: config.minSize + Math.random() * (config.maxSize - config.minSize),
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: (Math.random() - 0.5) * 1.0,
                spriteRotation: Math.random() * Math.PI * 2,
                spriteRotationSpeed: (Math.random() - 0.5) * 0.5
            });
        }
        return parts;
    }, [config]);

    useEffect(() => {
        if (!meshRef.current || !config) return;
        const tempColor = new THREE.Color();
        const dummy = new THREE.Object3D();

        for (let i = 0; i < config.count; i++) {
            const p = particles[i];
            dummy.position.copy(p.position);
            dummy.scale.set(p.scale, p.scale, p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            const colorHex = config.colors[Math.floor(Math.random() * config.colors.length)];
            tempColor.set(colorHex);
            meshRef.current.setColorAt(i, tempColor);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [particles, config]);

    useFrame((state, delta) => {
        if (!meshRef.current || !config || particles.length === 0) return;
        
        const dummy = new THREE.Object3D();
        const boundsHalfX = config.area[0] / 2;
        const boundsHalfY = config.area[1] / 2;
        const boundsHalfZ = config.area[2] / 2;

        for (let i = 0; i < config.count; i++) {
            const p = particles[i];
            
            p.position.addScaledVector(p.velocity, delta);
            
            p.wobble += p.wobbleSpeed * delta;
            p.position.x += Math.sin(p.wobble) * 0.01;
            
            dummy.position.copy(p.position);
            dummy.scale.setScalar(p.scale);

            if (config.shape === 'sprite') {
                dummy.quaternion.copy(state.camera.quaternion);
                p.spriteRotation += p.spriteRotationSpeed * delta;
                dummy.rotateZ(p.spriteRotation);
            } else {
                dummy.rotation.x += p.rotationSpeed.x * delta;
                dummy.rotation.y += p.rotationSpeed.y * delta;
                dummy.rotation.z += p.rotationSpeed.z * delta;
            }

            // Wrap around logic
            if (p.position.y < -boundsHalfY) p.position.y = boundsHalfY;
            if (p.position.y > boundsHalfY) p.position.y = -boundsHalfY;
            if (p.position.x < -boundsHalfX) p.position.x = boundsHalfX;
            if (p.position.x > boundsHalfX) p.position.x = -boundsHalfX;
            if (p.position.z < -boundsHalfZ) p.position.z = boundsHalfZ;
            if (p.position.z > boundsHalfZ) p.position.z = -boundsHalfZ;

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!config) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, config.count]} frustumCulled={false}>
            {config.shape === 'sphere' && <icosahedronGeometry args={[1, 0]} />}
            {config.shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {config.shape === 'sprite' && <circleGeometry args={[1, config.spriteSegments || 8]} />}
            
            <meshStandardMaterial 
                color="#ffffff"
                transparent={config.transparent}
                opacity={config.opacity}
                blending={config.blending}
                depthWrite={false} 
                emissive={config.emissive ? (config.emissiveColor || "#ffffff") : "#000000"}
                emissiveIntensity={config.emissive ? 0.8 : 0}
                toneMapped={false}
                side={THREE.DoubleSide} 
            />
        </instancedMesh>
    );
};
