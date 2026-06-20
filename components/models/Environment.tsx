
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, RoundedBox, Cylinder, Icosahedron, Sphere, Cone, Torus, Dodecahedron, Octahedron, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Theme } from '../../types';
import { THEME_PALETTES, coordRandom, tintColor, Palette, VoxelMaterial } from './Shared';
import { getWallTexture, getTileTexture, getCrystalTexture, getCapTexture, getDirtTexture, getMetalTexture, getGemTexture, getMatteTexture, getTagTexture } from '../../utils/textureGenerator';

// Per-tile-style cap surface roughness (snow soft, basalt rough, crystal sharp).
const CAP_ROUGHNESS: Record<string, number> = { grass: 0.9, sand: 0.95, snow: 0.7, basalt: 1.0, crystal: 0.5 };

// --- MONEY OBSTACLE: a bank VAULT/SAFE -------------------------------------
// Replaces the old crystal cluster. A solid, locked safe is an unambiguous
// blocker (route around it — "money you can't get to") and stays on-theme with
// the financial-literacy world. Tinted per-world via palette.wall; the existing
// WallBlock random rotation/scale keeps the field varied. (Keeps the
// {color, accent, rand} signature so WallBlock is unchanged.)
const StylizedCrystal: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
    const metalTex = useMemo(() => getWallTexture(color), [color]);
    const doorColor = useMemo(() => tintColor(color, '#000000', 0.18), [color]);
    const dialRot = rand(4) * Math.PI;

    return (
        <group position={[0, 0, 0]}>
            {/* Safe body */}
            <RoundedBox args={[0.66, 0.62, 0.52]} radius={0.06} smoothness={2} position={[0, 0.34, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={metalTex} color={color} metalness={0.45} roughness={0.5} />
            </RoundedBox>
            {/* Recessed door panel */}
            <RoundedBox args={[0.52, 0.5, 0.08]} radius={0.04} smoothness={2} position={[0, 0.34, 0.24]} castShadow>
                <meshStandardMaterial color={doorColor} metalness={0.4} roughness={0.55} />
            </RoundedBox>
            {/* Combination dial */}
            <mesh position={[-0.08, 0.34, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.11, 0.11, 0.05, 18]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-0.08, 0.34, 0.33]} rotation={[Math.PI / 2, dialRot, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.04, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Lever handle */}
            <mesh position={[0.16, 0.34, 0.31]} castShadow>
                <boxGeometry args={[0.05, 0.2, 0.05]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
            </mesh>
            {/* A gold coin perched on top — it's full of money. */}
            <mesh position={[0.1, 0.69, 0.04]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
                <cylinderGeometry args={[0.12, 0.12, 0.045, 16]} />
                <meshStandardMaterial color="#FFC83D" metalness={0.4} roughness={0.35} emissive="#FFB020" emissiveIntensity={0.18} />
            </mesh>
        </group>
    );
};

// --- MONEY OBSTACLE: a ceramic PIGGY BANK (grassy worlds) -------------------
// The friendliest savings symbol there is — a chunky, glossy ceramic pig with a
// coin slot and a gold coin dropping in. Reads instantly as "savings" and is far
// cuter than a generic block, so the early grass worlds feel crafted.
const PiggyBank: React.FC<{ color: string, rand: (o: number) => number }> = ({ color, rand }) => {
    const pink = useMemo(() => tintColor('#f4a6c0', color, 0.22), [color]);
    const pinkDark = useMemo(() => tintColor(pink, '#000000', 0.16), [pink]);
    const bodyTex = useMemo(() => getWallTexture(pink), [pink]);
    const eyeX = 0.16;
    return (
        <group position={[0, 0, 0]} scale={[1.04, 1, 1]}>
            {/* Fat rounded body */}
            <RoundedBox args={[0.72, 0.54, 0.6]} radius={0.26} smoothness={4} position={[0, 0.38, 0]} castShadow receiveShadow>
                <meshStandardMaterial map={bodyTex} color={pink} roughness={0.32} metalness={0.04} />
            </RoundedBox>
            {/* Snout */}
            <mesh position={[0, 0.34, 0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.135, 0.135, 0.13, 18]} />
                <meshStandardMaterial color={pinkDark} roughness={0.36} />
            </mesh>
            {/* Nostrils */}
            <mesh position={[-0.05, 0.34, 0.39]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.022, 0.022, 0.04, 8]} /><meshStandardMaterial color="#8a3f5e" /></mesh>
            <mesh position={[0.05, 0.34, 0.39]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.022, 0.022, 0.04, 8]} /><meshStandardMaterial color="#8a3f5e" /></mesh>
            {/* Ears */}
            <mesh position={[-0.2, 0.62, 0.16]} rotation={[0.3, 0, 0.2]} castShadow><coneGeometry args={[0.09, 0.14, 4]} /><meshStandardMaterial color={pinkDark} roughness={0.4} /></mesh>
            <mesh position={[0.2, 0.62, 0.16]} rotation={[0.3, 0, -0.2]} castShadow><coneGeometry args={[0.09, 0.14, 4]} /><meshStandardMaterial color={pinkDark} roughness={0.4} /></mesh>
            {/* Eyes */}
            <mesh position={[-eyeX, 0.44, 0.295]}><sphereGeometry args={[0.026, 10, 10]} /><meshStandardMaterial color="#2a1622" roughness={0.5} /></mesh>
            <mesh position={[eyeX, 0.44, 0.295]}><sphereGeometry args={[0.026, 10, 10]} /><meshStandardMaterial color="#2a1622" roughness={0.5} /></mesh>
            {/* Legs */}
            {[[-0.2, 0.18], [0.2, 0.18], [-0.2, -0.18], [0.2, -0.18]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, 0.06, lz]} castShadow><cylinderGeometry args={[0.075, 0.075, 0.16, 12]} /><meshStandardMaterial color={pinkDark} roughness={0.4} /></mesh>
            ))}
            {/* Coin slot */}
            <mesh position={[0, 0.655, 0]} rotation={[0, rand(7) > 0.5 ? 0.4 : -0.4, 0]}><boxGeometry args={[0.22, 0.022, 0.05]} /><meshStandardMaterial color="#5b2540" roughness={0.6} /></mesh>
            {/* Gold coin dropping into the slot */}
            <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0.25]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.035, 18]} />
                <meshStandardMaterial color="#FFC83D" metalness={0.5} roughness={0.3} emissive="#FFB020" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
};

// --- MONEY OBSTACLE: a STACK OF GOLD BARS (desert/sunset worlds) ------------
// A pyramid of milled gold ingots — pure "treasure / wealth." With the new IBL
// the metal catches reflections and reads as expensive bullion.
const GoldBarStack: React.FC<{ rand: (o: number) => number }> = ({ rand }) => {
    const goldTex = useMemo(() => getMetalTexture('#FFD24D'), []);
    const Bar = ({ pos, rot }: { pos: [number, number, number], rot: number }) => (
        <RoundedBox args={[0.34, 0.15, 0.2]} radius={0.03} smoothness={2} position={pos} rotation={[0, rot, 0]} castShadow receiveShadow>
            <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.6} roughness={0.28} emissive="#FFA000" emissiveIntensity={0.1} />
        </RoundedBox>
    );
    const j = (o: number) => (rand(o) - 0.5) * 0.12; // small per-bar jitter
    return (
        <group position={[0, 0.02, 0]}>
            {/* bottom row of 3 */}
            <Bar pos={[-0.2 + j(1), 0.14, 0.04]} rot={0.05 + j(2)} />
            <Bar pos={[0.18 + j(3), 0.14, -0.06]} rot={-0.08 + j(4)} />
            <Bar pos={[-0.01 + j(5), 0.14, 0.18]} rot={0.12 + j(6)} />
            {/* middle row of 2 */}
            <Bar pos={[-0.12 + j(7), 0.31, 0.02]} rot={-0.1 + j(8)} />
            <Bar pos={[0.13 + j(9), 0.31, 0.06]} rot={0.06 + j(10)} />
            {/* top */}
            <Bar pos={[0.0 + j(11), 0.47, 0.03]} rot={0.2 + j(12)} />
        </group>
    );
};

// --- MONEY OBSTACLE: FROZEN ASSETS (alpine/snow worlds) --------------------
// A gold coin frozen inside a translucent ice block under a snow cap = "frozen
// assets": savings you have but can't spend yet. (Designed + reviewed via the
// per-world-money-obstacles workflow; reviewer re-anchored the icicles so their
// tips stay above the tile top.)
const FrozenAssets: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
  // Pale alpine ice tint derived from the world wall color, pushed toward icy blue.
  const iceHex = useMemo(() => tintColor(color, '#BFE6FF', 0.7), [color]);
  const iceTex = useMemo(() => getCrystalTexture(iceHex), [iceHex]);
  const goldTex = useMemo(() => getMetalTexture('#FFD24D'), []);
  const snowHex = useMemo(() => tintColor(color, '#FFFFFF', 0.85), [color]);

  const j = (o: number) => (rand(o) - 0.5) * 0.06;

  // A short icicle = a small downward cone clinging to the ice block's front lower edge.
  // Anchored so the cone tip stays at/above y~=0 (never dips below the tile top).
  const Icicle = ({ x, len, o }: { x: number, len: number, o: number }) => (
    <Cone args={[0.045, len, 8]} position={[x, 0.18 - len / 2, 0.24 + j(o)]} rotation={[Math.PI, 0, 0]} castShadow>
      <meshStandardMaterial color={iceHex} metalness={0.1} roughness={0.12} transparent opacity={0.62} emissive="#CFEFFF" emissiveIntensity={0.12} />
    </Cone>
  );

  return (
    <group position={[0, 0, 0]}>
      {/* Frosty snow base the block sits in */}
      <RoundedBox args={[0.6, 0.08, 0.56]} radius={0.04} smoothness={2} position={[0, 0.04, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={snowHex} metalness={0.05} roughness={0.9} emissive="#E8F4FF" emissiveIntensity={0.08} />
      </RoundedBox>

      {/* The opaque GOLD COIN frozen INSIDE the ice — placed first so the ice renders over it */}
      <group position={[0.03, 0.44, 0]} rotation={[0.12, 0.5, -0.08]}>
        <Cylinder args={[0.17, 0.17, 0.07, 24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.5} roughness={0.3} emissive="#FFB020" emissiveIntensity={0.2} />
        </Cylinder>
        {/* raised rim + center pip so it clearly reads as a coin through the ice */}
        <Torus args={[0.135, 0.022, 10, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.038]}>
          <meshStandardMaterial color="#FFE38A" metalness={0.55} roughness={0.28} emissive="#FFC030" emissiveIntensity={0.25} />
        </Torus>
        <Sphere args={[0.05, 16, 16]} position={[0, 0, 0.045]} scale={[1, 1, 0.4]}>
          <meshStandardMaterial color="#FFE38A" metalness={0.55} roughness={0.26} emissive="#FFCC3D" emissiveIntensity={0.3} />
        </Sphere>
      </group>

      {/* A small internal sparkle facet to give the gold a glint through the ice */}
      <Octahedron args={[0.07]} position={[-0.14 + j(20), 0.62, 0.1]} rotation={[0.4, 0.3, 0]}>
        <meshStandardMaterial color="#EAF7FF" metalness={0.2} roughness={0.1} emissive="#FFFFFF" emissiveIntensity={0.18} />
      </Octahedron>

      {/* The chunky translucent ICE BLOCK encasing everything */}
      <RoundedBox args={[0.5, 0.66, 0.46]} radius={0.06} smoothness={3} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial map={iceTex} color={iceHex} metalness={0.12} roughness={0.1} transparent opacity={0.55} emissive="#BFE6FF" emissiveIntensity={0.14} side={THREE.DoubleSide} />
      </RoundedBox>

      {/* Frosty white SNOW CAP heaped on top of the block */}
      <RoundedBox args={[0.52, 0.12, 0.48]} radius={0.06} smoothness={3} position={[0, 0.82, 0]} castShadow>
        <meshStandardMaterial color={snowHex} metalness={0.04} roughness={0.95} emissive="#EAF6FF" emissiveIntensity={0.1} />
      </RoundedBox>
      <Sphere args={[0.12, 16, 16]} position={[-0.1 + j(30), 0.88, 0.06]} scale={[1, 0.7, 1]}>
        <meshStandardMaterial color={snowHex} metalness={0.04} roughness={0.95} emissive="#EAF6FF" emissiveIntensity={0.1} />
      </Sphere>
      <Sphere args={[0.1, 16, 16]} position={[0.12 + j(31), 0.9, -0.05]} scale={[1, 0.7, 1]}>
        <meshStandardMaterial color={snowHex} metalness={0.04} roughness={0.95} emissive="#EAF6FF" emissiveIntensity={0.1} />
      </Sphere>

      {/* Two short ICICLES hanging off the ice block's front lower edge */}
      <Icicle x={-0.16} len={0.18} o={40} />
      <Icicle x={0.13} len={0.13} o={41} />
    </group>
  );
};

// --- MONEY OBSTACLE: MOLTEN GOLD (volcanic/basalt worlds) ------------------
// A basalt crucible of glowing molten gold = a gold furnace / "money can melt
// away". (Reviewer moved a misplaced rotation off the torus geometry onto its mesh.)
const MoltenGold: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
  const basalt = useMemo(() => getWallTexture('#2A2622'), []);
  const goldTex = useMemo(() => getMetalTexture('#FFD24D'), []);
  const stoneDark = useMemo(() => tintColor('#2A2622', '#000000', 0.35), []);
  const stoneRim = useMemo(() => tintColor('#3A332C', '#FF7A00', 0.12), []);

  const j = (o: number) => (rand(o) - 0.5) * 0.06;

  const Ember = ({ pos, s, o }: { pos: [number, number, number], s: number, o: number }) => (
    <mesh position={[pos[0] + j(o), pos[1], pos[2] + j(o + 1)]} rotation={[rand(o + 2) * 2, rand(o + 3) * 2, 0]}>
      <octahedronGeometry args={[s, 0]} />
      <meshStandardMaterial color="#FFE08A" emissive="#FF7A00" emissiveIntensity={0.55} roughness={0.5} />
    </mesh>
  );

  const Drip = ({ pos, rot, len }: { pos: [number, number, number], rot: number, len: number }) => (
    <group position={pos} rotation={[0, 0, rot]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.05, len, 8]} />
        <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.5} roughness={0.3} emissive="#FF7A00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, -len / 2, 0]} castShadow>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.5} roughness={0.3} emissive="#FF7A00" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );

  return (
    <group position={[0, 0, 0]}>
      {/* basalt foot / base ring */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.1, 12]} />
        <meshStandardMaterial map={basalt} color={stoneDark} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* crucible bowl body */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.33, 0.22, 0.44, 14]} />
        <meshStandardMaterial map={basalt} color={color || '#2E2823'} roughness={0.92} metalness={0.06} emissive="#FF5500" emissiveIntensity={0.06} />
      </mesh>

      {/* hot-glowing thick rim of the crucible */}
      <mesh position={[0, 0.54, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.31, 0.045, 10, 22]} />
        <meshStandardMaterial color={stoneRim} roughness={0.85} metalness={0.1} emissive="#FF6600" emissiveIntensity={0.3} />
      </mesh>

      {/* molten gold pool surface (glows hot) */}
      <mesh position={[0, 0.535, 0]} castShadow>
        <cylinderGeometry args={[0.295, 0.295, 0.06, 22]} />
        <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.5} roughness={0.28} emissive="#FF7A00" emissiveIntensity={0.5} />
      </mesh>

      {/* a couple of golden blobs welling up in the pool */}
      <mesh position={[-0.08 + j(20), 0.575, 0.05 + j(21)]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial map={goldTex} color="#FFE08A" metalness={0.5} roughness={0.3} emissive="#FF8C1A" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0.1 + j(22), 0.57, -0.04 + j(23)]} castShadow>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial map={goldTex} color="#FFE08A" metalness={0.5} roughness={0.3} emissive="#FF8C1A" emissiveIntensity={0.55} />
      </mesh>

      {/* gold drips running down the basalt side */}
      <Drip pos={[0.3, 0.42, 0.02]} rot={-0.12} len={0.22} />
      <Drip pos={[-0.27, 0.36, 0.1]} rot={0.16} len={0.16} />

      {/* tiny floating embers above the molten pool */}
      <Ember pos={[-0.06, 0.72, 0.04]} s={0.03} o={30} />
      <Ember pos={[0.09, 0.8, -0.02]} s={0.025} o={34} />
      <Ember pos={[0.0, 0.9, 0.08]} s={0.022} o={38} />
    </group>
  );
};

// --- MONEY OBSTACLE: COIN CONSTELLATION (galaxy worlds) --------------------
// A glowing gold "sun" coin with smaller coins riding tilted orbital rings =
// "compound growth: money orbits and multiplies". (Reviewer shrank the footprint
// to fit one tile and tightened the cluster.)
const CoinConstellation: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
  const goldTex = useMemo(() => getMetalTexture('#FFD24D'), []);
  const ringTex = useMemo(() => getCrystalTexture(color), [color]);
  const ringTint = useMemo(() => tintColor(color, '#FFFFFF', 0.25), [color]);
  const baseTint = useMemo(() => tintColor(color, '#000000', 0.25), [color]);
  const sunGlow = useMemo(() => tintColor('#FFC83D', accent, 0.2), [accent]);

  // A coin disc (cylinder on its side) — the "money" unit
  const Coin = ({ pos, scale, tilt, lit }: { pos: [number, number, number], scale: number, tilt: [number, number, number], lit?: boolean }) => (
    <group position={pos} rotation={tilt}>
      <Cylinder args={[scale, scale, scale * 0.22, 22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial map={goldTex} color="#FFD24D" metalness={0.5} roughness={0.3} emissive={lit ? sunGlow : '#FFB020'} emissiveIntensity={lit ? 0.45 : 0.18} />
      </Cylinder>
      {/* embossed center pip so it reads as a coin */}
      <Sphere args={[scale * 0.34, 14, 14]} position={[0, 0, scale * 0.12]} scale={[1, 1, 0.35]} castShadow>
        <meshStandardMaterial color="#FFE08A" metalness={0.5} roughness={0.28} emissive={lit ? sunGlow : '#FFB020'} emissiveIntensity={lit ? 0.4 : 0.15} />
      </Sphere>
    </group>
  );

  // tiny star sparkle
  const Star = ({ pos, s }: { pos: [number, number, number], s: number }) => (
    <Octahedron args={[s, 0]} position={pos}>
      <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.55} roughness={0.4} />
    </Octahedron>
  );

  const j = (o: number) => (rand(o) - 0.5) * 0.05;
  const cx = 0, cy = 0.46, cz = 0; // constellation centered above tile

  return (
    <group position={[0, 0, 0]}>
      {/* faint cosmic base disc */}
      <Cylinder args={[0.26, 0.3, 0.05, 24]} position={[0, 0.025, 0]} receiveShadow>
        <meshStandardMaterial map={ringTex} color={baseTint} metalness={0.3} roughness={0.6} emissive={color} emissiveIntensity={0.12} />
      </Cylinder>

      {/* central GOLD SUN coin */}
      <Coin pos={[cx, cy, cz]} scale={0.18} tilt={[0.18, 0.4, 0]} lit />

      {/* Saturn-like tilted ring around the sun, tinted with world color */}
      <Torus args={[0.24, 0.016, 12, 40]} position={[cx, cy, cz]} rotation={[1.15, 0.35, 0.2]} castShadow>
        <meshStandardMaterial map={ringTex} color={ringTint} metalness={0.4} roughness={0.35} emissive={color} emissiveIntensity={0.3} transparent opacity={0.62} />
      </Torus>

      {/* orbital ring 1 (tilted) — two smaller coins riding it */}
      <Torus args={[0.26, 0.006, 8, 44]} position={[cx, cy, cz]} rotation={[1.3, 0, 0.5]}>
        <meshStandardMaterial color={ringTint} emissive={color} emissiveIntensity={0.35} roughness={0.5} transparent opacity={0.5} />
      </Torus>
      <Coin pos={[cx + 0.25 + j(1), cy + 0.04, cz - 0.04]} scale={0.075} tilt={[0.5, 0.8 + j(2), 0.3]} />
      <Coin pos={[cx - 0.23 + j(3), cy - 0.06, cz + 0.05]} scale={0.065} tilt={[0.4, -0.6 + j(4), 0.2]} />

      {/* orbital ring 2 (different tilt) — two smaller coins riding it */}
      <Torus args={[0.21, 0.006, 8, 44]} position={[cx, cy, cz]} rotation={[0.9, 0.6, -0.4]}>
        <meshStandardMaterial color={ringTint} emissive={color} emissiveIntensity={0.35} roughness={0.5} transparent opacity={0.5} />
      </Torus>
      <Coin pos={[cx + 0.04 + j(5), cy + 0.19, cz + 0.09]} scale={0.058} tilt={[0.7, 0.3 + j(6), -0.4]} />
      <Coin pos={[cx - 0.05 + j(7), cy - 0.18, cz - 0.1]} scale={0.052} tilt={[0.6, -0.4 + j(8), 0.5]} />

      {/* star sparkles scattered in the cosmos */}
      <Star pos={[cx + 0.22, cy + 0.23, cz - 0.16]} s={0.032} />
      <Star pos={[cx - 0.26, cy + 0.16, cz + 0.14]} s={0.026} />
      <Star pos={[cx + 0.16, cy - 0.24, cz + 0.19]} s={0.028} />
      <Star pos={[cx - 0.12, cy + 0.3, cz - 0.09]} s={0.022} />
    </group>
  );
};

// --- MONEY OBSTACLE: CRYSTAL TREASURE (crystal cave worlds) ----------------
// Faceted gem crystals growing out of a gold-coin pile on a cave rock = "a nest
// egg / valuable assets" — distinct from the plain metal vault. (Passed review
// with no fixes needed.)
const CrystalTreasure: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color, accent, rand }) => {
  const gemTex = useMemo(() => getGemTexture(color), [color]);
  const crystalTex = useMemo(() => getCrystalTexture(color), [color]);
  const goldTex = useMemo(() => getMetalTexture('#FFD24D'), []);
  const rockTex = useMemo(() => getMatteTexture(tintColor(color, '#0A1A20', 0.55)), [color]);

  // small deterministic jitter
  const j = (o: number) => (rand(o) - 0.5) * 0.06;

  // A faceted gem crystal that grows up out of the pile.
  const Gem = ({
    pos, h, w, rot, tex, faceted,
  }: {
    pos: [number, number, number], h: number, w: number, rot: number,
    tex: THREE.CanvasTexture, faceted: boolean,
  }) => (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* tapered crystal shaft */}
      <Cylinder args={[w * 0.78, w, h, 6]} position={[0, h / 2, 0]} castShadow>
        <meshStandardMaterial
          map={tex}
          color={color}
          metalness={0.25}
          roughness={0.18}
          emissive={color}
          emissiveIntensity={0.28}
          transparent
          opacity={0.62}
        />
      </Cylinder>
      {/* faceted crystal tip */}
      {faceted ? (
        <Octahedron args={[w * 1.05, 0]} position={[0, h + w * 0.55, 0]} rotation={[0.2, rot, 0]} castShadow>
          <meshStandardMaterial
            map={tex}
            color={color}
            metalness={0.25}
            roughness={0.15}
            emissive={color}
            emissiveIntensity={0.34}
            transparent
            opacity={0.6}
          />
        </Octahedron>
      ) : (
        <Cone args={[w, w * 1.7, 6]} position={[0, h + w * 0.85, 0]} rotation={[0, rot, 0]} castShadow>
          <meshStandardMaterial
            map={tex}
            color={color}
            metalness={0.25}
            roughness={0.15}
            emissive={color}
            emissiveIntensity={0.34}
            transparent
            opacity={0.6}
          />
        </Cone>
      )}
    </group>
  );

  // A milled gold coin.
  const Coin = ({ pos, rot, r = 0.13 }: { pos: [number, number, number], rot: [number, number, number], r?: number }) => (
    <Cylinder args={[r, r, 0.045, 20]} position={pos} rotation={rot} castShadow>
      <meshStandardMaterial map={goldTex} color="#FFC83D" metalness={0.5} roughness={0.3} emissive="#FFB020" emissiveIntensity={0.15} />
    </Cylinder>
  );

  return (
    <group position={[0, 0, 0]}>
      {/* rocky cave base the treasure sits on */}
      <Dodecahedron args={[0.34, 0]} position={[0, 0.04, 0]} rotation={[0.3, 0.4, 0]} receiveShadow castShadow>
        <meshStandardMaterial map={rockTex} color={tintColor(color, '#0A1A20', 0.55)} metalness={0.1} roughness={0.95} />
      </Dodecahedron>

      {/* small pile of gold coins nestled at the base */}
      <Coin pos={[-0.14 + j(1), 0.16, 0.1]} rot={[Math.PI / 2, 0.2, 0.18]} />
      <Coin pos={[0.16 + j(2), 0.15, 0.06]} rot={[Math.PI / 2, -0.15, -0.12]} />
      <Coin pos={[0.02 + j(3), 0.2, -0.13]} rot={[Math.PI / 2 - 0.25, 0.1, 0.05]} />
      {/* one hero coin standing upright among the crystals */}
      <Coin pos={[0.18 + j(4), 0.3, -0.02]} rot={[0.1, 0.3, 0.35]} r={0.11} />

      {/* cluster of 4 faceted gem crystals growing UP, varied heights */}
      <Gem pos={[-0.12 + j(5), 0.17, 0.04]} h={0.46} w={0.1} rot={0.3} tex={gemTex} faceted />
      <Gem pos={[0.1 + j(6), 0.17, 0.1]} h={0.3} w={0.085} rot={-0.5} tex={crystalTex} faceted={false} />
      <Gem pos={[0.0 + j(7), 0.18, -0.1]} h={0.56} w={0.11} rot={0.9} tex={gemTex} faceted />
      <Gem pos={[-0.16 + j(8), 0.16, -0.12]} h={0.24} w={0.075} rot={-1.1} tex={crystalTex} faceted />

      {/* tiny accent shard for sparkle variety */}
      <Octahedron args={[0.06, 0]} position={[0.2 + j(9), 0.26, 0.16]} rotation={[0.4, 0.6, 0.2]} castShadow>
        <meshStandardMaterial map={gemTex} color={accent} metalness={0.3} roughness={0.16} emissive={accent} emissiveIntensity={0.3} transparent opacity={0.65} />
      </Octahedron>
    </group>
  );
};

// --- THE OBSTACLE: an IMPULSE-BUY "WANT" ------------------------------------
// A solid block you must route AROUND — so it must read as a BAD/costly thing,
// not a good one. (A piggy bank as a wall taught the OPPOSITE of saving.) It's a
// glossy shopping bag with a "$$$" price tag + tempting sparkles = an impulse-buy
// "want" that gets between you and your goal (wants vs needs). Tinted per-world,
// but the price tag + sparkles stay constant so the lesson reads the same
// everywhere. (The old money-symbol obstacles above are retained for reuse as
// GOOD elements later — savings collectibles, the goal vault, etc.)
const ImpulseBuy: React.FC<{ color: string, accent: string, rand: (o: number) => number }> = ({ color }) => {
    // Cute/premium/simple: just the MATTE pink bag + the billboarded "no-buy $" tag.
    // Pink = the want-role color (pops off any floor, never the coins' gold). The
    // sparkles + shiny "item" were cut — they flirted with "reward"; matte, no sheen.
    const bagColor = useMemo(() => tintColor('#f4609f', color, 0.18), [color]);
    const trim = useMemo(() => tintColor('#bf3a73', color, 0.18), [color]);
    const tagTex = useMemo(() => getTagTexture(), []);

    return (
        <group position={[0, 0, 0]}>
            {/* matte shopping-bag body (bright pink = tempting, pops off the floor) */}
            <RoundedBox args={[0.44, 0.5, 0.32]} radius={0.04} smoothness={3} position={[0, 0.28, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={bagColor} roughness={0.55} metalness={0} />
            </RoundedBox>
            {/* folded top rim */}
            <RoundedBox args={[0.46, 0.07, 0.34]} radius={0.02} smoothness={2} position={[0, 0.55, 0]} castShadow>
                <meshStandardMaterial color={trim} roughness={0.6} metalness={0} />
            </RoundedBox>
            {/* two handle arches (front + back) */}
            <mesh position={[0, 0.56, 0.12]} castShadow><torusGeometry args={[0.085, 0.018, 8, 18, Math.PI]} /><meshStandardMaterial color={trim} roughness={0.6} /></mesh>
            <mesh position={[0, 0.56, -0.12]} castShadow><torusGeometry args={[0.085, 0.018, 8, 18, Math.PI]} /><meshStandardMaterial color={trim} roughness={0.6} /></mesh>
            {/* "don't-buy $" PRICE TAG — flat + billboarded so the lesson cue always
                faces the camera regardless of the obstacle's yaw. */}
            <Billboard position={[0.2, 0.34, 0.16]}>
                <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.006, 0.006, 0.1, 6]} /><meshStandardMaterial color="#b9a17a" roughness={0.9} /></mesh>
                <mesh castShadow><planeGeometry args={[0.2, 0.16]} /><meshStandardMaterial map={tagTex} side={THREE.DoubleSide} roughness={0.7} metalness={0} /></mesh>
            </Billboard>
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

    // Per-world obstacle identity, all money-themed: grassy worlds get a cute
    // ceramic piggy bank, deserts get a stack of gold bars, and crystal/metal/
    // snow/volcanic worlds keep the bank vault. Piggy banks keep their facing
    // (no random 90° spin) so the snout reads; the others rotate for variety.
    // The obstacle is ALWAYS the impulse-buy "want" — a bad/costly thing that
    // blocks your path to the goal (wants vs needs). One consistent meaning so
    // players learn the symbol; tinted per-world for cohesion. A gentle yaw keeps
    // the "$$$" price tag readable rather than spinning it out of view.
    const obstacle = <ImpulseBuy color={palette.wall} accent={palette.wallAccent} rand={rand} />;
    const spin = (rand(5) - 0.5) * 0.7;

    return (
        <group position={[position[0], 0, position[2]]} rotation={[0, spin, 0]} scale={[scale, scale, scale]} ref={groupRef}>
             {obstacle}
        </group>
    );
}

export const FloorSystem: React.FC<{ theme: Theme, children: React.ReactNode }> = ({ children }) => {
    return <group>{children}</group>;
};

// Internal hook for shared floor visuals
const useFloorVisuals = (theme: Theme, coords: [number, number] | undefined, position: [number, number, number], isHighlighted: boolean | undefined, isDragOver: boolean | undefined, isInPlannedPath: boolean | undefined, isCrumbling: boolean | undefined, gridSize: {rows: number, cols: number} | undefined) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    // Less sky-wash so worlds read as vivid, saturated "candy" blocks like the
    // logo. The top cap (grass) stays bright; the deep sides (dirt) sit darker.
    const baseColor = useMemo(() => tintColor(palette.floor, palette.sky[0], 0.26), [palette]);
    const sideColor = useMemo(() => tintColor(palette.floorSide, palette.sky[0], 0.5), [palette]);
    
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

    // Floor cap = the cracked-stone surface (the look users preferred), tinted
    // per-world by `color`. `variant` is fragile-* for crumbling tiles (heavy
    // cracks) and cracked-1..5 otherwise, so fragility still reads.
    const capTexture = useMemo(() => getTileTexture(variant, color), [variant, color]);
    const dirtTexture = useMemo(() => getDirtTexture(sideColor), [sideColor]);
    const capRoughness = 0.9; // uniform matte stone

    return { capTexture, dirtTexture, capRoughness, color, sideColor, depth, bottomMeshY, rotationY: (Math.floor(seed * 1000) % 4) * (Math.PI / 2) };
};

// A chunky, beveled grass-and-dirt block like the logo: a rounded top "grass"
// cap that slightly overhangs a rounded "dirt" column.
const TileBlock: React.FC<{ visuals: any, opacity?: number }> = ({ visuals, opacity = 1 }) => (
    <>
        {/* Per-world surface cap — SHARP-edged box (clean per-face UVs so the
            texture maps correctly), with a small overhang lip over the dirt. */}
        <mesh position={[0, -0.19, 0]} rotation={[0, visuals.rotationY, 0]} castShadow={opacity === 1} receiveShadow={opacity === 1}>
            <boxGeometry args={[0.96, 0.4, 0.96]} />
            <meshStandardMaterial map={visuals.capTexture} color={visuals.color} transparent={opacity < 1} opacity={opacity} roughness={visuals.capRoughness ?? 0.92} metalness={0} />
        </mesh>
        {/* Dirt column — narrower so the cap overhangs. */}
        <mesh position={[0, visuals.bottomMeshY, 0]} rotation={[0, visuals.rotationY, 0]} receiveShadow={opacity === 1}>
            <boxGeometry args={[0.9, visuals.depth, 0.9]} />
            <meshStandardMaterial color={visuals.sideColor} map={visuals.dirtTexture} transparent={opacity < 1} opacity={opacity} roughness={1} metalness={0} />
        </mesh>
    </>
);

const StaticFloor: React.FC<{ position: [number, number, number], visuals: any, opacity?: number }> = React.memo(({ position, visuals, opacity = 1 }) => {
    return (
        <group position={[position[0], 0, position[2]]}>
            <TileBlock visuals={visuals} opacity={opacity} />
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
            <TileBlock visuals={visuals} opacity={opacity} />
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
