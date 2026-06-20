import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VoxelCharacter } from './models/Character';

// TEMPORARY dev harness — reachable at /?charpreview=1 — renders a big, slowly
// rotating Henry on an ANIMATING canvas (so screenshots capture it) so the model
// can be iterated by sight. Not part of the shipped app surface; safe to delete.
const Spin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.5; });
  return <group ref={ref}>{children}</group>;
};

export const CharacterPreview: React.FC = () => {
  const isGirl = new URLSearchParams(location.search).get('girl') === '1';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 40%, #334155, #0f172a)' }}>
      <Canvas shadows camera={{ position: [0, 0.5, 2.3], fov: 34 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 4]} intensity={1.7} castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#88aaff" />
        <group position={[0, -0.5, 0]}>
          <Spin>
            <VoxelCharacter
              skinColor="#F2C48D" shirtColor="#ef4444" pantsColor="#3b82f6" hairColor="#5D4037"
              hatId="none" eyeState="default" isMoving={false} isCelebrating={false} isIdle
              isGirl={isGirl}
            />
          </Spin>
          {/* simple ground disc for shadow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[1.2, 32]} />
            <meshStandardMaterial color="#1e293b" roughness={1} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};

export default CharacterPreview;
