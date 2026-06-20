
import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { CellType, GameStatus, Move, FailureType, ParticleEffect, CollectedPackage, ThoughtBubble, EyeState, Position, Theme, LevelResult, BotVisualState, HatId } from '../types';
import { ICONS } from './icons';
import { Html } from '@react-three/drei';
import { WallBlock, CrystalGem3D, Key3D, ForceField3D, Bomb, Teleporter, CosmicPortal, FloorTile, Mila3D } from './Models3D';
import { CoinIcon } from './CoinIcon';

interface CellProps {
  position: [number, number, number];
  type: CellType;
  isBotHere: boolean;
  gameStatus: GameStatus;
  botDirection?: Move;
  botCelebrationState: 'level' | 'world' | null;
  botVisualState: BotVisualState;
  botSpecialEyeState: EyeState | null;
  isPackageCollected: boolean;
  collectedPackage?: CollectedPackage;
  failureType: FailureType;
  rowIndex: number;
  colIndex: number;
  cellEffects: ParticleEffect[];
  isEndGoalActive: boolean;
  henryBubble?: ThoughtBubble | null;
  isBotSleeping: boolean;
  isMilaHere: boolean;
  mila: { message: string; duration: number; direction: Move; animationState?: 'in' | 'out' | 'idle' } | null;
  isHighlighted: boolean;
  isInPlannedPath: boolean;
  isWallHit: boolean;
  isLocked?: boolean;
  theme: Theme;
  levelResult: LevelResult | null;
  hatId: HatId;
  executionPath?: Position[];
  // Level Builder Props
  isDragOver?: boolean;
  isPreviewingFloor?: boolean;
  isCrumbled?: boolean; // New Prop for visual state
  hasCrumbled?: boolean; // New Prop for animation trigger
  isDisguised?: boolean; // W3: a "deal" shown as a gold coin until inspected
  isInspected?: boolean; // W3: the player has inspected this disguised deal
  
  // Updated event handlers to match Grid passing style
  onCellDrop?: (e: React.DragEvent, row: number, col: number) => void;
  onCellDragOver?: (e: React.DragEvent, row: number, col: number) => void;
  onCellDragLeave?: (e: React.DragEvent) => void;
  onCellDragStart?: (e: React.DragEvent, type: CellType, from: Position) => void;
  onCellDragEnd?: (e: React.DragEvent, type: CellType, from: Position) => void; // Fix type signature to match usage
  onCellClick?: (row: number, col: number) => void;
  onCellContextMenu?: (e: React.MouseEvent, row: number, col: number) => void;
  onHoleHover?: (pos: Position | null) => void;

  henryPosition?: THREE.Vector3 | null;
  showConfetti?: boolean;
  gridSize?: { rows: number; cols: number };
  heroModel?: 'henry' | 'mila';
  // Removed hintText as it is now handled via Henry's thought bubble
}

const Cell: React.FC<CellProps> = (props) => {
  const { type, isBotHere, gameStatus, botDirection, botCelebrationState, botVisualState, botSpecialEyeState, isPackageCollected, 
          collectedPackage, failureType, rowIndex, colIndex, cellEffects, isEndGoalActive, henryBubble, isBotSleeping, 
          isMilaHere, mila, isHighlighted, isInPlannedPath, isWallHit, isLocked, theme, levelResult, hatId, executionPath, isDragOver, isPreviewingFloor, 
          isCrumbled, hasCrumbled, isDisguised, isInspected, // Extract new props
          onCellDrop, onCellDragOver, onCellDragLeave, onCellDragStart, onCellDragEnd, onCellClick, onCellContextMenu, onHoleHover, 
          henryPosition, showConfetti, gridSize, heroModel } = props;

  const isTrap = type === CellType.Trap;
  const isBoost = type === CellType.Boost;
  const isWant = type === CellType.WantTile;
  const isSavings = type === CellType.Package_Savings; // W5 grow gem
  const isInflating = type === CellType.Inflating_Coin; // W6 fresh coin
  const isToll = type === CellType.Toll_Gate; // W7 priced gate
  const isShock = type === CellType.Shock; // W8 surprise bill
  const isLiquid = type === CellType.Liquid_Cash; // W8 emergency fund refill
  // W3: a disguised "deal" shows as a gold coin until the player inspects it.
  const showAsDisguise = !!isDisguised && !isInspected;

  const isHole = type === CellType.Hole;
  const isCrumbling = type === CellType.CrumblingFloor;
  const isStart = type === CellType.Start;
  const isEnd = type === CellType.End;
  const isWall = [CellType.Wall, CellType.Wall_H_Left, CellType.Wall_H_Right, CellType.Wall_V_Top, CellType.Wall_V_Bottom].includes(type);
  const isPackage = [CellType.Package, CellType.Package_Blue, CellType.Package_Purple, CellType.Package_Circuit, CellType.Package_Red, CellType.Package_Orange, CellType.Package_Cyan, CellType.PhaseShifter, CellType.Package_AutoSolver].includes(type);
  const isBomb = type === CellType.Bomb;
  const isTeleporter = [CellType.Teleporter_A, CellType.Teleporter_B, CellType.Teleporter_C, CellType.Teleporter_D, CellType.Teleporter_E, CellType.Teleporter_F].includes(type);
  const isForceField = [CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Purple, CellType.ForceField_Red, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(type);
  
  const gemTypeForRender = isPackageCollected ? collectedPackage?.type : type;
  const scoreValue = collectedPackage?.score ?? 0;
  
  // Calculate if this gem was missed
  const isRequiredGem = [
      CellType.Package, 
      CellType.Package_Blue, 
      CellType.Package_Purple, 
      CellType.Package_Circuit, 
      CellType.Package_Red, 
      CellType.Package_Orange, 
      CellType.Package_Cyan
  ].includes(type);

  const isMissed = gameStatus === GameStatus.Failure && failureType === 'incomplete' && isRequiredGem && !isPackageCollected;

  // Force floor rendering if the cell contains an item that requires ground, even if logic mistakenly thinks it's a hole.
  // This acts as a visual safety net for level generation glitches or masking issues.
  const requiresFloor = isPackage || isBomb || isTeleporter || isForceField || isStart || isEnd || isWall || isWant || isDisguised || isSavings || isInflating || isToll || isShock || isLiquid;
  const shouldRenderFloor = !isHole || requiresFloor || isPreviewingFloor;

  const teleporterColor = useMemo(() => {
    if (!isTeleporter) return '';
    switch (type) {
        case CellType.Teleporter_A: case CellType.Teleporter_B: return '#4ECDC4';
        case CellType.Teleporter_C: case CellType.Teleporter_D: return '#9D4EDD';
        case CellType.Teleporter_E: case CellType.Teleporter_F: return '#FFE66D';
        default: return '#4ECDC4';
    }
  }, [type, isTeleporter]);
  
  const forceFieldColor = useMemo(() => {
    if (!isForceField) return undefined;
    switch (type) {
      case CellType.ForceField_Blue: return 'blue';
      case CellType.ForceField_Purple: return 'purple';
      case CellType.ForceField_Red: return 'red';
      case CellType.ForceField_Orange: return 'orange';
      case CellType.ForceField_Cyan: return 'cyan';
      default: return 'yellow';
    }
  }, [type, isForceField]);

  const gemColor = useMemo(() => {
      switch (gemTypeForRender) {
        case CellType.Package_Blue: return 'blue';
        case CellType.Package_Purple: return 'purple';
        case CellType.Package_Circuit: return 'circuit';
        case CellType.Package_Red: return 'red';
        case CellType.Package_Orange: return 'orange';
        case CellType.Package_Cyan: return 'cyan';
        case CellType.PhaseShifter: return 'phase';
        case CellType.Package_AutoSolver: return 'vision';
        default: return 'green';
      }
  }, [gemTypeForRender]);

  const handleDragStart = (e: React.DragEvent) => {
      if (onCellDragStart) onCellDragStart(e, type, {row: rowIndex, col: colIndex});
  };
  
  const isPortal = isStart || isEnd;
  const portalColor = useMemo(() => {
      if (isPortal) {
          // Active goal = cool GREEN ("good destination / you made it"), not gold —
          // gold is reserved for collectible coins. Inactive = calm cyan.
          return isEndGoalActive ? '#34D399' : '#38BDF8';
      }
      return '#FFFFFF';
  }, [isPortal, isEndGoalActive]);

  const cellSeed = rowIndex * 13 + colIndex * 7;

  // Transient score popup logic
  const showScorePopup = isPackageCollected && collectedPackage && (Date.now() - collectedPackage.timestamp < 800);

  return (
    <React.Fragment>
      <group position={props.position}>
        {/* Visual Layer: 3D Models */}
        {/* Explicitly passing opacity=1 to ensure visibility in non-builder modes */}
        {/* Tile markers (trap / boost / want / disguise) live INSIDE this
            positioned group so they render at the cell, not at the grid origin. */}
        {isTrap && !isDisguised && (
          /* "Too good to be true": a tempting fake coin on a glowing red warning
             tile — the money-trap / scam lesson. Stepping on it ends the run.
             (Disguised scams are handled by the disguise block below.) */
          <group position={[0,0,0]}>
            <mesh position={[0,0,0]}>
              <boxGeometry args={[0.82, 0.08, 0.82]} />
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.45} opacity={0.85} transparent />
            </mesh>
            <mesh position={[0,0.11,0]} rotation={[Math.PI/2 - 0.45, 0, 0.3]}>
              <cylinderGeometry args={[0.27, 0.27, 0.06, 18]} />
              <meshStandardMaterial color="#FFD24A" metalness={0.06} roughness={0.5} emissive="#7a2a00" emissiveIntensity={0} />
            </mesh>
          </group>
        )}
        {isBoost && (
          /* Bonus / interest token: a green "+" coin — extra money for a detour. */
          <group position={[0,0.34,0]}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.08, 18]} />
              <meshStandardMaterial color="#34d399" metalness={0.05} roughness={0.55} emissive="#10b981" emissiveIntensity={0.4} toneMapped={false} />
            </mesh>
            <mesh position={[0,0,0.05]}>
              <boxGeometry args={[0.07, 0.24, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissiveIntensity={0} toneMapped={false} />
            </mesh>
            <mesh position={[0,0,0.05]}>
              <boxGeometry args={[0.24, 0.07, 0.03]} />
              <meshStandardMaterial color="#ffffff" emissiveIntensity={0} toneMapped={false} />
            </mesh>
          </group>
        )}
        {isWant && (
          /* Impulse-buy "WANT": a glossy pink shopping bag on a WALKABLE tile.
             Stepping it drains the run wallet (W1). PINK = a want that costs you. */
          <group position={[0, 0.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.34, 0.34, 0.22]} />
              <meshStandardMaterial color="#f4609f" roughness={0.5} metalness={0} emissiveIntensity={0} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.38, 0.06, 0.26]} />
              <meshStandardMaterial color="#d6457f" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
              <torusGeometry args={[0.09, 0.018, 8, 18]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffd1e6" emissiveIntensity={0.4} toneMapped={false} />
            </mesh>
          </group>
        )}
        {isDisguised && (
          showAsDisguise ? (
            /* A "deal" disguised as a gold coin. A cyan ring marks it as an
               UNVERIFIED deal — tap to inspect before committing a route over it. */
            <group position={[0, 0.34, 0]}>
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.27, 0.27, 0.07, 20]} />
                <meshStandardMaterial color="#FFD24A" metalness={0.06} roughness={0.5} emissive="#7a2a00" emissiveIntensity={0} />
              </mesh>
              <mesh position={[0, -0.18, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.22, 0.022, 8, 24]} />
                <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.7} toneMapped={false} />
              </mesh>
            </group>
          ) : isTrap ? (
            /* Inspected and revealed as a SCAM: red warning + spark. */
            <group position={[0, 0.3, 0]}>
              <mesh>
                <octahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} toneMapped={false} />
              </mesh>
            </group>
          ) : (
            /* Inspected and revealed SAFE (a real sealed deal): a calm green check ring. */
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.16, 0.02, 8, 24]} />
              <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.5} toneMapped={false} />
            </mesh>
          )
        )}
        {shouldRenderFloor && (
          <FloorTile 
              position={[0,0,0]} 
              coords={[colIndex, rowIndex]} 
              isHighlighted={isHighlighted || isInPlannedPath} 
              isDragOver={isDragOver} 
              isCrumbling={isCrumbling} 
              hasCrumbled={hasCrumbled} 
              theme={theme} 
              gridSize={gridSize} 
              opacity={1}
          />
      )}
      
      {isWall && <WallBlock position={[0,0,0]} coords={[colIndex, rowIndex]} isShaking={isWallHit} theme={theme} />}
      
      {isForceField && <ForceField3D position={[0,0,0]} color={forceFieldColor!} isLocked={isLocked} />}
      
      {isTeleporter && <Teleporter position={[0,0,0]} color={teleporterColor} />}

      {isSavings && (
          /* W5 savings gem: a GREEN jewel ringed in GOLD — worth MORE the longer
             you wait before cashing out (let it grow). Hides once collected. */
          <group position={[0, 0.34, 0]} visible={!isPackageCollected}>
            <mesh>
              <octahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.45} metalness={0.04} roughness={0.5} toneMapped={false} />
            </mesh>
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.26, 0.03, 10, 28]} />
              <meshStandardMaterial color="#FFD24A" emissive="#7a5a00" emissiveIntensity={0} metalness={0.06} roughness={0.5} toneMapped={false} />
            </mesh>
          </group>
      )}

      {isInflating && (
          /* W6 fresh coin: a GOLD coin ringed in CYAN (time-sensitive) — worth a lot
             grabbed FRESH (early), little once it goes stale. Hides when collected. */
          <group position={[0, 0.34, 0]} visible={!isPackageCollected}>
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.07, 20]} />
              <meshStandardMaterial color="#FFD24A" metalness={0.06} roughness={0.5} emissive="#7a5a00" emissiveIntensity={0.12} />
            </mesh>
            <mesh position={[0, -0.16, 0]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.2, 0.022, 8, 24]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
          </group>
      )}

      {isShock && (
          /* W8 shock: an AMBER lightning hazard (a surprise bill). Your reserve
             absorbs it if it can — otherwise it wipes you out. AMBER, not red, so
             it reads distinctly from lethal traps/bombs. */
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.82, 0.08, 0.82]} />
              <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.5} opacity={0.85} transparent />
            </mesh>
            <mesh position={[0, 0.26, 0]} rotation={[0, 0, 0.2]}>
              <octahedronGeometry args={[0.17, 0]} />
              <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.8} toneMapped={false} />
            </mesh>
          </group>
      )}

      {isLiquid && (
          /* W8 liquid cash: a green-and-gold cash coin — collecting it refills your
             reserve (emergency fund). Hides once collected. */
          <group position={[0, 0.34, 0]} visible={!isPackageCollected}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.07, 20]} />
              <meshStandardMaterial color="#34d399" metalness={0.05} roughness={0.5} emissive="#10b981" emissiveIntensity={0.32} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#FFE9A8" emissive="#FFD24A" emissiveIntensity={0} toneMapped={false} />
            </mesh>
          </group>
      )}

      {isToll && (
          /* W7 toll gate: a translucent GOLD barrier with a coin — crossing it
             spends from your budget. Required gems are reachable toll-free. */
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.8, 0.56, 0.14]} />
              <meshStandardMaterial color="#FFD24A" metalness={0.05} roughness={0.55} emissive="#7a5a00" emissiveIntensity={0} opacity={0.62} transparent />
            </mesh>
            <mesh position={[0, 0.56, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.04, 18]} />
              <meshStandardMaterial color="#FFE9A8" metalness={0.06} roughness={0.5} emissiveIntensity={0} toneMapped={false} />
            </mesh>
          </group>
      )}

      {isPortal && (
          <CosmicPortal
              position={[0,0,0]} 
              color={portalColor} 
              isOpen={true} 
              isActive={isEndGoalActive} 
              shape="circle" 
          />
      )}
      
      {isMilaHere && mila && (
          <Mila3D position={[0,0,0]} direction={mila.direction} animationState={mila.animationState} message={mila.message} duration={mila.duration} heroModel={heroModel} henryPosition={henryPosition} />
      )}

      {(isPackage || (isPackageCollected && gemTypeForRender !== CellType.Empty)) && (
          <group visible={!isPackageCollected}>
             {(gemTypeForRender === CellType.Package_Circuit || gemTypeForRender === CellType.Package_Blue || gemTypeForRender === CellType.Package_Red || gemTypeForRender === CellType.Package_Purple || gemTypeForRender === CellType.Package_Orange || gemTypeForRender === CellType.Package_Cyan) ? (
                 <Key3D position={[0,0,0]} color={gemColor} isMissed={isMissed} />
             ) : (
                 <CrystalGem3D position={[0,0,0]} color={gemColor} isMissed={isMissed} />
             )}
          </group>
      )}
      
      {isBomb && !isWallHit && <Bomb position={[0,0,0]} seed={cellSeed} />}

      {/* Interaction Layer */}
      <Html position={[0, 0.1, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
        <div
          style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translate3d(0,0,0)' }}
          draggable={!!onCellDragStart && !isHole}
          onDragStart={handleDragStart}
          onDragOver={(e) => onCellDragOver && onCellDragOver(e, rowIndex, colIndex)}
          onDragLeave={onCellDragLeave}
          onDrop={(e) => onCellDrop && onCellDrop(e, rowIndex, colIndex)}
          onDragEnd={(e) => onCellDragEnd && onCellDragEnd(e, type, {row: rowIndex, col: colIndex})}
          onClick={() => onCellClick && onCellClick(rowIndex, colIndex)}
          onContextMenu={(e) => onCellContextMenu && onCellContextMenu(e, rowIndex, colIndex)}
          onMouseEnter={() => onHoleHover && onHoleHover({row: rowIndex, col: colIndex})}
        >
           {showScorePopup && (
                <div key={`popup-${rowIndex}-${colIndex}`} className="score-popup" style={{ position: 'absolute', transform: 'translateY(-40px)' }}>
                    +{scoreValue} <CoinIcon />
                    {collectedPackage?.comboIndex && collectedPackage.comboIndex >= 2 ? (
                        <span style={{ marginLeft: 4, fontWeight: 900, color: 'var(--accent-yellow)' }}>x{collectedPackage.comboIndex}</span>
                    ) : null}
                </div>
           )}
        </div>
      </Html>
    </group>
    </React.Fragment>
  );
};

export default React.memo(Cell);
