
// ... existing imports
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { CellType, GameStatus, Position, Move, FailureType, CollectedPackage, ParticleEffect, Theme, LevelResult, BotVisualState, HatId, MilaState, ThoughtBubble, CharacterAppearance } from '../types';
import Cell from './Cell';
import { THEME_PALETTES, Henry3D, FloorSystem } from './Models3D';
import { AmbientEffects } from './AmbientEffects';
import { SkySystem3D } from './SkySystem3D';

const EMPTY_ARRAY: any[] = [];

// ... interface GridProps (unchanged)
interface GridProps {
  gridData: CellType[][];
  botPosition: Position;
  ghostPosition?: { row: number, col: number, direction: Move } | null;
  gameStatus: GameStatus;
  botDirection: Move;
  botCelebrationState: 'level' | 'world' | null;
  botVisualState: BotVisualState;
  collectedPackages: CollectedPackage[];
  particleEffects: ParticleEffect[];
  failureType: FailureType;
  gridScale: number;
  transitionState: 'intro' | 'outro' | 'none';
  isEndGoalActive: boolean;
  isBotSleeping: boolean;
  isTutorialActive: boolean;
  highlightedTutorialArrow: Move | null;
  incorrectTutorialArrow: Move | null;
  highlightedPosition: Position | null;
  wallHitPosition: Position | null;
  theme: Theme;
  levelResult: LevelResult | null;
  hatId: HatId;
  missedGems: Position[];
  isCurrentMovePhased: boolean;
  plannedPathPositions: Position[];
  circuitLinks?: { [keyPos: string]: string[] };
  executionPath?: (Position & { isTeleport?: boolean; isCollision?: boolean })[]; 
  crumbledFloors?: Position[];
  botMessage: { text: string; isExiting: boolean } | null;
  isGhostAtEnd?: boolean;
  
  onCellDrop?: (e: React.DragEvent, row: number, col: number) => void;
  onCellDragOver?: (e: React.DragEvent, row: number, col: number) => void;
  onCellDragLeave?: (e: React.DragEvent) => void;
  onCellDragStart?: (e: React.DragEvent, type: CellType, from: Position) => void;
  onCellDragEnd?: (e: React.DragEvent) => void;
  onCellClick?: (row: number, col: number) => void;
  onCellContextMenu?: (e: React.MouseEvent, row: number, col: number) => void;
  disguisedSet?: Set<string>;   // W3: posKeys ("r,c") shown as gold deals until inspected
  inspectedSet?: Set<string>;   // W3: posKeys the player has inspected this attempt
  dragOverCell?: Position | null;
  hoveredHole?: Position | null;
  onHoleHover?: (pos: Position | null) => void;
  viewAngle?: { azimuth: number; elevation: number };
  userZoom?: number;
  onSceneMouseDown?: (e: any) => void;
  stepDuration?: number;
  showBot?: boolean;
  mila?: MilaState | null;
  onVisualStep?: (stepIndex: number) => void;
  onSequenceFinish?: () => void; 
  henryBubble?: ThoughtBubble | null;
  appearance?: CharacterAppearance;
  sceneKey?: number; 
  onAddMove?: (move: Move) => void;
  onRun?: () => void;
  activeHint?: { pos: Position, text: string, type: CellType } | null; 
    performanceMode?: 'normal' | 'low';
}

const ContextDisposer = () => {
  const { gl } = useThree();
  useEffect(() => {
    return () => {
        gl.dispose();
    };
  }, [gl]);
  return null;
}

const LightingRig: React.FC<{ theme: Theme, gameStatus: GameStatus, gridSize: { rows: number, cols: number }, performanceMode: 'normal' | 'low' }> = ({ theme, gameStatus, gridSize, performanceMode }) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    const limit = Math.max(gridSize.rows, gridSize.cols, 20) / 1.5 + 5;
    const lowPerf = performanceMode === 'low';
    return (
        <>
            {/* Soft PCSS contact shadows for a premium, expensive finish (skipped on
                low-end devices to protect framerate). */}
            {!lowPerf && <SoftShadows size={26} samples={9} focus={0.85} />}

            {/* Ambient kept bright for a cheerful kids' game, trimmed slightly so
                forms read with gentle gradients instead of looking flat. */}
            <ambientLight intensity={lowPerf ? 1.05 : 1.12} />

            {/* Warm key light. */}
            <directionalLight
                position={[-20, 50, 30]}
                intensity={lowPerf ? 1.5 : 1.66}
                color="#fff4d6"
                castShadow={!lowPerf}
                shadow-bias={-0.0001}
                shadow-normalBias={0.04}
                shadow-mapSize={lowPerf ? [1024, 1024] : [2048, 2048]}
                shadow-radius={6} // softens the shadow edges
                shadow-camera-left={-limit}
                shadow-camera-right={limit}
                shadow-camera-top={limit}
                shadow-camera-bottom={-limit}
            />

            {/* Cool rim / back light tinted by the world — crisp silhouette
                separation against the sky. This is the main "expensive" pop. */}
            <directionalLight
                position={[26, 24, -30]}
                intensity={lowPerf ? 0.5 : 0.8}
                color={palette.highlight}
            />

            {/* Hemisphere fill grounded in the theme palette. */}
            <hemisphereLight intensity={0.85} color={palette.sky[0]} groundColor={palette.floorSide} />

            {/* Subtle theme-tinted distance fog so far tiles melt softly into the
                sky instead of reading as hard flat edges (premium depth grading). */}
            <fog attach="fog" args={[palette.sky[1], 38, 95 + limit]} />
        </>
    );
};

const CameraRig = ({ viewAngle, userZoom, gridSize, transitionState, dragOffset, gameStatus, focusRef }: any) => {
    const { camera, size } = useThree();
    const vec = React.useMemo(() => new THREE.Vector3(), []);
    const currentFocus = React.useRef(new THREE.Vector3(0, 0, 0));
    const autoRotateRef = useRef(0);
    const prevStatusRef = useRef(gameStatus);
    
    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.1);
        if (gameStatus === GameStatus.Planning && prevStatusRef.current !== GameStatus.Planning) {
            currentFocus.current.set(0, 0, 0);
            autoRotateRef.current = 0;
        }
        prevStatusRef.current = gameStatus;
        const isFollowMode = gameStatus === GameStatus.Executing || gameStatus === GameStatus.Success || gameStatus === GameStatus.Failure;
        
        // Stop rotation on Failure to allow review
        if (gameStatus === GameStatus.Executing || gameStatus === GameStatus.Success) {
            autoRotateRef.current += dt * 12; 
        } else if (gameStatus === GameStatus.Planning) {
            autoRotateRef.current = 0;
        }

        const time = state.clock.elapsedTime;
        const wiggleAzimuth = Math.sin(time * 0.1) * 0.25; 
        const baseElevation = 50; 
        const baseAzimuth = 45;
        const dragAzimuth = dragOffset.current.x * 0.5;
        const dragElevation = dragOffset.current.y * 0.3;
        const targetAzimuth = (viewAngle?.azimuth !== undefined ? viewAngle.azimuth : baseAzimuth) + wiggleAzimuth - dragAzimuth + autoRotateRef.current;
        const targetElevation = Math.max(10, Math.min(85, (viewAngle?.elevation !== undefined ? viewAngle.elevation : baseElevation) + dragElevation));
        const azimuthRad = (targetAzimuth * Math.PI) / 180;
        const elevationRad = ((90 - targetElevation) * Math.PI) / 180;
        const dist = 60; 
        const targetFocusPoint = isFollowMode ? focusRef.current : new THREE.Vector3(0, 0, 0);
        currentFocus.current.lerp(targetFocusPoint, 0.1);
        const x = dist * Math.sin(elevationRad) * Math.sin(azimuthRad) + currentFocus.current.x;
        const y = dist * Math.cos(elevationRad) + currentFocus.current.y;
        const z = dist * Math.sin(elevationRad) * Math.cos(azimuthRad) + currentFocus.current.z;
        vec.set(x, y, z);
        camera.position.lerp(vec, 0.1); 
        camera.lookAt(currentFocus.current);
        
        // Updated logic: treat small worlds as at least 9x9 to reduce zoom (prevent being too close)
        const maxDim = Math.max(9, gridSize.rows, gridSize.cols);
        
        // Dynamic Padding Calculation for Zoom
        // 1.15 for small levels -> decreases for large levels to keep tiles visible
        let dynamicPadding = 1.15;
        if (maxDim > 8) {
            // Decrease padding as size increases to zoom in more
            dynamicPadding = Math.max(0.9, 1.15 - (maxDim - 8) * 0.025);
        }

        const visibleUnits = maxDim * dynamicPadding; 
        const viewportMin = Math.min(size.width, size.height);
        
        // Target Multiplier logic
        const targetMultiplier = isFollowMode ? 1.6 : 1.4;
        const targetZoom = (viewportMin / visibleUnits) * userZoom * targetMultiplier;
        if (camera.type === 'OrthographicCamera') {
            damp(camera, 'zoom', targetZoom, isFollowMode ? 6.0 : 0.2, dt);
            camera.updateProjectionMatrix();
        }
    });
    return null;
};

const DragSpring = ({ dragOffset, isDragging }: { dragOffset: React.MutableRefObject<{x: number, y: number}>, isDragging: React.MutableRefObject<boolean> }) => {
    useFrame((_: any, delta: number) => {
        const dt = Math.min(delta, 0.1);
        if (!isDragging.current) {
            const snapSpeed = 10;
            dragOffset.current.x = THREE.MathUtils.lerp(dragOffset.current.x, 0, dt * snapSpeed);
            dragOffset.current.y = THREE.MathUtils.lerp(dragOffset.current.y, 0, dt * snapSpeed);
        }
    });
    return null;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>((props, ref) => {
  const { 
      gridData, botPosition, ghostPosition, gameStatus, botDirection, botCelebrationState, botVisualState, 
      collectedPackages, particleEffects, failureType, gridScale, transitionState,
      isEndGoalActive, isBotSleeping, 
      highlightedPosition, 
      wallHitPosition, theme, levelResult, hatId, missedGems,
      plannedPathPositions, circuitLinks, executionPath, crumbledFloors, botMessage,
      onCellDrop, onCellDragOver, onCellDragLeave, onCellDragStart, onCellDragEnd, 
      onCellClick, onCellContextMenu, disguisedSet, inspectedSet, dragOverCell, hoveredHole, onHoleHover,
      viewAngle = { azimuth: 30, elevation: 50 }, userZoom = 1, onSceneMouseDown,
      stepDuration = 250,
      showBot = true, mila, onVisualStep, onSequenceFinish, henryBubble,
      appearance, sceneKey, onAddMove, onRun, activeHint, performanceMode = 'normal'
  } = props;

  const numRows = gridData.length;
  const numCols = gridData[0].length;
  const offsetX = (numCols - 1) / 2;
  const offsetZ = (numRows - 1) / 2;
  const henryX = (botPosition.col - offsetX);
  const henryZ = botPosition.row - offsetZ;
  const botPosRef = useRef(new THREE.Vector3(henryX, 0, henryZ));
  
  const eyeState = React.useMemo(() => {
      if (isBotSleeping) return 'sleeping';
      if (gameStatus === GameStatus.Failure) {
          if (failureType === 'hole') return 'scared';
          if (failureType === 'wall') return 'confused';
          if (failureType === 'bomb') return 'destroyed';
          if (failureType === 'incomplete' || failureType === 'missed_gem') return 'angry';
          return 'confused';
      }
      if (gameStatus === GameStatus.Success) return 'win';
      return 'default';
  }, [isBotSleeping, gameStatus, failureType]);

  const dragOffset = React.useRef({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const startPos = React.useRef({ x: 0, y: 0 });
  
  // Separate refs to handle delayed camera movement vs immediate swipe tracking
  const cameraStartPos = React.useRef({ x: 0, y: 0 });
  const isCameraActive = React.useRef(false);
  
  const startTime = React.useRef(0);
  
  const handlePointerDown = (e: React.PointerEvent) => {
      if (onSceneMouseDown) onSceneMouseDown(e); 
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) return;
      if (target.draggable || target.closest('[draggable="true"]')) { return; }
      
      isDragging.current = true;
      isCameraActive.current = false; // Reset camera active state
      startPos.current = { x: e.clientX, y: e.clientY }; // Original pos for swipe calculations
      cameraStartPos.current = { x: e.clientX, y: e.clientY }; // Tracking pos for camera
      
      startTime.current = Date.now();
      target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isDragging.current) {
          // If camera isn't active yet, check if we should activate it
          if (!isCameraActive.current) {
              const timeElapsed = Date.now() - startTime.current;
              // Delay camera movement by 150ms to allow for quick swipes without camera jitter
              if (timeElapsed > 150) { 
                  isCameraActive.current = true;
                  // Reset camera start pos to current to prevent jump when activating
                  cameraStartPos.current = { x: e.clientX, y: e.clientY };
              }
          }

          // Only update camera drag offset if camera is active
          if (isCameraActive.current) {
              const deltaX = e.clientX - cameraStartPos.current.x;
              const deltaY = e.clientY - cameraStartPos.current.y;
              dragOffset.current = { x: deltaX * 0.5, y: deltaY * 0.5 };
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (isDragging.current) {
          const duration = Date.now() - startTime.current;
          
          // Calculate swipe based on ORIGINAL touch down position, ignoring camera logic
          const dx = e.clientX - startPos.current.x;
          const dy = e.clientY - startPos.current.y;
          
          const isQuickFlick = duration < 250;
          const minSwipeDist = 40;

          if (isQuickFlick && (Math.abs(dx) > minSwipeDist || Math.abs(dy) > minSwipeDist)) {
              if (onAddMove) {
                  if (Math.abs(dx) > Math.abs(dy)) {
                      if (dx > 0) onAddMove(Move.Right); else onAddMove(Move.Left);
                  } else {
                      if (dy > 0) onAddMove(Move.Down); else onAddMove(Move.Up);
                  }
              }
          } else if (isQuickFlick && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
              if (gameStatus === GameStatus.Planning && onRun) {
                  onRun();
              }
          }

          isDragging.current = false;
          const target = e.target as HTMLElement;
          if (target.hasPointerCapture(e.pointerId)) {
              target.releasePointerCapture(e.pointerId);
          }
      }
  };

  const opacity = transitionState === 'outro' ? 0 : 1;

  return (
    <div 
        ref={ref} 
        className="w-full h-full relative touch-none select-none" 
        style={{ transition: 'opacity 0.6s ease-in-out', opacity: opacity, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      <Canvas 
                shadows={performanceMode !== 'low'}
        orthographic 
                dpr={performanceMode === 'low' ? [1, 1.2] : [1, 1.5]} 
                gl={{ antialias: performanceMode !== 'low', alpha: true, localClippingEnabled: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.06, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ zoom: 40, position: [0, 50, 50], near: 0.1, far: 1000 }}
        style={{ background: 'transparent', pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 10 }} 
      >
        <ContextDisposer />
        <DragSpring dragOffset={dragOffset} isDragging={isDragging} />
        <CameraRig viewAngle={viewAngle} userZoom={userZoom} gridSize={{ rows: numRows, cols: numCols }} transitionState={transitionState} dragOffset={dragOffset} gameStatus={gameStatus} focusRef={botPosRef} />
                <LightingRig theme={theme} gameStatus={gameStatus} gridSize={{ rows: numRows, cols: numCols }} performanceMode={performanceMode} />
                <AmbientEffects theme={theme} quality={performanceMode} />
                <SkySystem3D theme={theme} quality={performanceMode} />
        <group scale={[gridScale, gridScale, gridScale]}>
            {showBot && (
                <Henry3D key={sceneKey} position={[henryX, 0, henryZ]} direction={botDirection || Move.Down} hatId={hatId} visualState={botVisualState} eyeState={eyeState} gameStatus={gameStatus} executionPath={executionPath} failureType={failureType} botCelebrationState={botCelebrationState} gridSize={{ rows: numRows, cols: numCols }} stepDuration={stepDuration} message={botMessage} henryBubble={henryBubble} activeHint={activeHint} onVisualStep={onVisualStep} onFinish={onSequenceFinish} milaPosition={null} reportPosition={(pos: THREE.Vector3) => botPosRef.current.copy(pos)} theme={theme} appearance={appearance} />
            )}
            {ghostPosition && (
                <Henry3D position={[ghostPosition.col - offsetX, 0, ghostPosition.row - offsetZ]} spawnPosition={[henryX, 0, henryZ]} direction={ghostPosition.direction} hatId={hatId} visualState={'default'} eyeState="default" gameStatus={GameStatus.Planning} gridSize={{ rows: numRows, cols: numCols }} theme={theme} isGhost={true} appearance={appearance} />
            )}
            <group position={[-offsetX, 0, -offsetZ]}>
                <FloorSystem theme={theme}>
                    {gridData.map((row, rowIndex) => row.map((cellType, colIndex) => {
                            const isCrumbled = !!crumbledFloors?.find(p => p.row === rowIndex && p.col === colIndex);
                            const collectedPackage = collectedPackages.find(p => p.position.row === rowIndex && p.position.col === colIndex);
                            
                            // Dynamic Locked State Logic
                            let isLocked = false;
                            const isFF = [CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Purple, CellType.ForceField_Red, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(cellType);
                            if (isFF) {
                                isLocked = true;
                                if (circuitLinks) {
                                    const posStr = `${rowIndex},${colIndex}`;
                                    for (const [keyPos, targets] of Object.entries(circuitLinks)) {
                                        if ((targets as string[]).includes(posStr)) {
                                            const keyCollected = collectedPackages.some(p => `${p.position.row},${p.position.col}` === keyPos);
                                            if (keyCollected) {
                                                isLocked = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Distracter Logic (Mila/Henry)
                            const isMilaHere = !!(mila && mila.visible && mila.position.row === rowIndex && mila.position.col === colIndex);

                            return (
                                <Cell key={`${rowIndex}-${colIndex}`} position={[colIndex, 0, rowIndex]} type={cellType} rowIndex={rowIndex} colIndex={colIndex} isBotHere={false} gameStatus={gameStatus} isPackageCollected={!!collectedPackage} collectedPackage={collectedPackage} cellEffects={EMPTY_ARRAY} botCelebrationState={null} failureType={failureType} botVisualState={'default'} isEndGoalActive={isEndGoalActive} isBotSleeping={false} botSpecialEyeState={null} isMilaHere={isMilaHere} mila={isMilaHere ? mila : null} isHighlighted={false} isInPlannedPath={false} isWallHit={false} theme={theme} levelResult={null} hatId={hatId} isCrumbled={isCrumbled} hasCrumbled={isCrumbled} gridSize={{ rows: numRows, cols: numCols }} heroModel={appearance?.model || 'henry'} isLocked={isLocked} onCellClick={onCellClick} isDisguised={disguisedSet?.has(`${rowIndex},${colIndex}`)} isInspected={inspectedSet?.has(`${rowIndex},${colIndex}`)} />
                            );
                        })
                    )}
                </FloorSystem>
            </group>
        </group>
      </Canvas>
    </div>
  );
});

export default React.memo(Grid);