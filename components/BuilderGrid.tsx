
// ... existing imports
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { CellType, Theme, Position, Move } from '../types';
import { FloorSystem, WallBlock, CrystalGem3D, Key3D, ForceField3D, Bomb, Teleporter, CosmicPortal, THEME_PALETTES, FloorTile } from './Models3D';
import { ICONS } from './icons';
import { ToolPreview3D } from './ToolPreview3D';

interface BuilderGridProps {
    grid: CellType[][];
    theme: Theme;
    onCellClick: (row: number, col: number) => void;
    onCellRightClick: (e: React.MouseEvent, row: number, col: number) => void;
    onCellDrop: (e: React.DragEvent, row: number, col: number) => void; // From Toolbar
    onGridMove: (source: {r: number, c: number}, target: {r: number, c: number}) => void; // Internal Move
}

// Consistent Lighting Rig - Increased Intensity for Brighter Builder
const BuilderLightingRig: React.FC<{ theme: Theme, gridSize: { rows: number, cols: number } }> = ({ theme, gridSize }) => {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    
    // Dynamic Shadow Camera Bounds
    const limit = Math.max(gridSize.rows, gridSize.cols, 10) / 1.5 + 8;

    return (
        <>
            <ambientLight intensity={1.3} />
            <directionalLight 
                position={[30, 60, 20]} 
                intensity={0.5} 
                color="#ffffff"
            />
            <directionalLight 
                position={[-20, 50, 30]} 
                intensity={1.8} 
                color="#fff8e7"
                castShadow
                shadow-bias={-0.0001}
                shadow-normalBias={0.04}
                shadow-mapSize={[2048, 2048]} 
                shadow-radius={5}
                shadow-camera-left={-limit}
                shadow-camera-right={limit}
                shadow-camera-top={limit}
                shadow-camera-bottom={-limit}
            />
            <hemisphereLight 
                intensity={0.9} 
                color={palette.sky[0]} 
                groundColor={palette.floorSide} 
            />
        </>
    );
};

// Drag Offset Hook/Component to control camera (Adapted from Grid.tsx)
const CameraRig = ({ viewAngle, gridSize, dragOffset }: { viewAngle: { azimuth: number, elevation: number }, gridSize: { rows: number, cols: number }, dragOffset: React.MutableRefObject<{x: number, y: number}> }) => {
    const { camera, size } = useThree();
    const vec = useMemo(() => new THREE.Vector3(), []);
    const currentFocus = useRef(new THREE.Vector3(0, 0, 0));
    
    useFrame((state, delta) => {
        // Subtle breathing wiggle matching main game
        const time = state.clock.elapsedTime;
        const wiggleAzimuth = Math.sin(time * 0.1) * 0.25; 
        
        // Add Drag Offset (scaled down for sensitivity)
        const dragAzimuth = dragOffset.current.x * 0.5;
        const dragElevation = dragOffset.current.y * 0.3;

        const targetAzimuth = viewAngle.azimuth + wiggleAzimuth - dragAzimuth;
        const targetElevation = Math.max(10, Math.min(85, viewAngle.elevation + dragElevation));

        const azimuthRad = (targetAzimuth * Math.PI) / 180;
        const elevationRad = ((90 - targetElevation) * Math.PI) / 180;

        const dist = 60; // Matched to Grid.tsx
        
        // Builder always focuses on center
        const targetFocusPoint = new THREE.Vector3(0, 0, 0);
        currentFocus.current.lerp(targetFocusPoint, 0.1);

        const x = dist * Math.sin(elevationRad) * Math.sin(azimuthRad) + currentFocus.current.x;
        const y = dist * Math.cos(elevationRad) + currentFocus.current.y;
        const z = dist * Math.sin(elevationRad) * Math.cos(azimuthRad) + currentFocus.current.z;

        vec.set(x, y, z);
        camera.position.lerp(vec, 0.1); 
        camera.lookAt(currentFocus.current);
        
        const maxDim = Math.max(6, gridSize.rows, gridSize.cols);
        
        // Match Zoom Logic from Grid.tsx
        const paddingFactor = 1.4; 
        const visibleUnits = maxDim * paddingFactor; 
        
        const viewportMin = Math.min(size.width, size.height);
        
        // Planning Zoom multiplier from Grid.tsx
        const targetMultiplier = 1.2;
        const targetZoom = (viewportMin / visibleUnits) * targetMultiplier;

        if (camera.type === 'OrthographicCamera') {
            // Use damp for smooth zoom like Grid.tsx
            // Reduced smoothing (0.5) for snapper entry, making it less floaty/distracting on load
            damp(camera, 'zoom', targetZoom, 0.5, delta);
            camera.updateProjectionMatrix();
        }
    });
    return null;
};

const BuilderCell: React.FC<{
    row: number;
    col: number;
    type: CellType;
    theme: Theme;
    onRightClick: (e: React.MouseEvent, row: number, col: number) => void;
    onDrop: (e: React.DragEvent, row: number, col: number) => void; // HTML5 Drop (Toolbar)
    onPointerDown: (e: React.PointerEvent, row: number, col: number, type: CellType) => void;
    isDragSource: boolean;
    isDragTarget: boolean;
    gridSize: { rows: number; cols: number };
    isHovered: boolean;
    onHover: (r: number, c: number) => void;
}> = React.memo(({ row, col, type, theme, onRightClick, onDrop, onPointerDown, isDragSource, isDragTarget, gridSize, isHovered, onHover }) => {
    const [isHTML5DragOver, setIsHTML5DragOver] = useState(false);
    
    // Position calculation (centered)
    const position: [number, number, number] = [col, 0, row];

    const isHole = type === CellType.Hole;
    const isCrumbling = type === CellType.CrumblingFloor;
    const isWall = [CellType.Wall, CellType.Wall_H_Left, CellType.Wall_H_Right, CellType.Wall_V_Top, CellType.Wall_V_Bottom].includes(type);
    const isPackage = [CellType.Package, CellType.Package_Blue, CellType.Package_Purple, CellType.Package_Circuit, CellType.Package_Red, CellType.Package_Orange, CellType.Package_Cyan, CellType.PhaseShifter, CellType.Package_AutoSolver].includes(type);
    const isBomb = type === CellType.Bomb;
    const isTrap = type === CellType.Trap;
    const isBoost = type === CellType.Boost;
    const isTeleporter = [CellType.Teleporter_A, CellType.Teleporter_B, CellType.Teleporter_C, CellType.Teleporter_D, CellType.Teleporter_E, CellType.Teleporter_F].includes(type);
    const isForceField = [CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Purple, CellType.ForceField_Red, CellType.ForceField_Orange, CellType.ForceField_Cyan].includes(type);
    const isStart = type === CellType.Start;
    
    const palette = THEME_PALETTES[theme] || THEME_PALETTES['day'];
    
    // Visual Feedback for Dragging
    let floorColor = palette.floor;
    if (isHTML5DragOver || isDragTarget) floorColor = '#4ECDC4'; // Target Highlight
    if (isDragSource) floorColor = '#3b82f6'; // Source Highlight
    
    const gemColor = useMemo(() => {
        switch (type) {
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
    }, [type]);

    const teleporterColor = useMemo(() => {
        switch (type) {
            case CellType.Teleporter_A: case CellType.Teleporter_B: return '#4ECDC4';
            case CellType.Teleporter_C: case CellType.Teleporter_D: return '#9D4EDD';
            case CellType.Teleporter_E: case CellType.Teleporter_F: return '#FFE66D';
            default: return '#4ECDC4';
        }
    }, [type]);

    const forceFieldColor = useMemo(() => {
        switch (type) {
          case CellType.ForceField_Blue: return 'blue';
          case CellType.ForceField_Purple: return 'purple';
          case CellType.ForceField_Red: return 'red';
          case CellType.ForceField_Orange: return 'orange';
          case CellType.ForceField_Cyan: return 'cyan';
          default: return 'yellow';
        }
    }, [type]);

    // HTML5 DnD Handlers (For Toolbar)
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsHTML5DragOver(true); };
    const handleDragLeave = () => setIsHTML5DragOver(false);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsHTML5DragOver(false); onDrop(e, row, col); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }

    // Seed based on position
    const cellSeed = row * 13 + col * 7;

    const showFloor = !isHole || isHovered || isDragTarget || isHTML5DragOver;

    return (
        <group position={position}>
            {/* Visuals */}
            {showFloor && <FloorTile 
                position={[0,0,0]} 
                coords={[col, row]} 
                theme={theme} 
                isDragOver={isHTML5DragOver || isDragTarget} 
                isHighlighted={isHovered} 
                gridSize={gridSize} 
                isCrumbling={isCrumbling} 
                opacity={isHole ? 0.5 : 1}
            />}
            
            {/* Show item ONLY if it's NOT the source of a drag (ghost follows pointer instead) */}
            {!isDragSource && (
                <>
                    {isWall && <WallBlock position={[0,0,0]} theme={theme} coords={[col, row]} />}
                    
                    {/* START PORTAL: Unique Sky Blue - No Glow */}
                    {isStart && <CosmicPortal position={[0,0,0]} color="#38BDF8" isOpen={false} rotationSpeed={2} shape="circle" />}
                    
                    {isPackage && (
                    (gemColor === 'circuit' || gemColor === 'blue' || gemColor === 'red' || gemColor === 'purple' || gemColor === 'orange' || gemColor === 'cyan') ? 
                    <Key3D position={[0,0,0]} color={gemColor} /> : 
                    <CrystalGem3D position={[0,0,0]} color={gemColor} />
                    )}
                    
                    {isBomb && <Bomb position={[0,0,0]} seed={cellSeed} />}
                    {isTrap && (
                        <group>
                            <mesh position={[0, 0.03, 0]}>
                                <cylinderGeometry args={[0.44, 0.44, 0.06, 18]} />
                                <meshStandardMaterial color="#7f1d1d" roughness={0.55} metalness={0.15} />
                            </mesh>
                            {[-0.18, 0, 0.18].map((x) =>
                                [-0.18, 0, 0.18].map((z) => (
                                    <mesh key={`trap-spike-${x}-${z}`} position={[x, 0.16, z]}>
                                        <coneGeometry args={[0.07, 0.24, 10]} />
                                        <meshStandardMaterial color="#ef4444" emissive="#991b1b" emissiveIntensity={0.35} roughness={0.3} metalness={0.25} />
                                    </mesh>
                                ))
                            )}
                        </group>
                    )}
                    {isBoost && (
                        <mesh position={[0, 0.36, 0]}>
                            <sphereGeometry args={[0.25, 18, 18]} />
                            <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.45} roughness={0.2} metalness={0.3} />
                        </mesh>
                    )}
                    {isTeleporter && <Teleporter position={[0,0,0]} color={teleporterColor} />}
                    {isForceField && <ForceField3D position={[0,0,0]} color={forceFieldColor} />}
                </>
            )}
            
            {/* Interaction Layer - Projects a DOM element to the 3D floor for reliable picking/dropping */}
            <Html position={[0, 0.1, 0]} transform center style={{ width: '60px', height: '60px', pointerEvents: 'none' }}>
                <div 
                    data-row={row} // Markers for elementFromPoint
                    data-col={col}
                    className="builder-cell-target"
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        pointerEvents: 'auto',
                        cursor: (type !== CellType.Empty && type !== CellType.Hole) ? 'grab' : 'pointer',
                        touchAction: 'none' // Prevent browser scrolling while interacting
                    }}
                    // Pointer Events for custom Mobile/Desktop Move
                    onPointerDown={(e) => {
                        onPointerDown(e, row, col, type);
                        // iOS long-press → delete: right-click doesn't exist
                        // on iPhone, so give touch users a 550ms hold gesture
                        // that fires the same erase action as desktop right-click.
                        if (e.pointerType === 'touch') {
                            let handled = false;
                            const t = window.setTimeout(() => {
                                handled = true;
                                onRightClick(e as any, row, col);
                                try { (navigator as any).vibrate?.(20); } catch {}
                            }, 550);
                            const cancel = () => {
                                if (!handled) window.clearTimeout(t);
                                window.removeEventListener('pointerup', cancel);
                                window.removeEventListener('pointercancel', cancel);
                                window.removeEventListener('pointermove', onMove);
                            };
                            const onMove = (ev: PointerEvent) => {
                                // Any real drag cancels the long-press.
                                if (Math.abs(ev.movementX) + Math.abs(ev.movementY) > 4) cancel();
                            };
                            window.addEventListener('pointerup', cancel, { once: true });
                            window.addEventListener('pointercancel', cancel, { once: true });
                            window.addEventListener('pointermove', onMove);
                        }
                    }}
                    onPointerEnter={() => onHover(row, col)}
                    onPointerMove={() => onHover(row, col)}

                    // HTML5 Events for Toolbar Drop
                    onContextMenu={(e) => onRightClick(e, row, col)}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                />
            </Html>
        </group>
    );
});

// DragGhost Component - Use 3D Tool Preview
export const DragGhost: React.FC<{ type: CellType, x: number, y: number, theme: Theme }> = React.memo(({ type, x, y, theme }) => {
    return (
        <div 
            className="fixed pointer-events-none z-[100] flex items-center justify-center"
            style={{ 
                left: x, 
                top: y,
                transform: 'translate(-50%, -50%)',
                width: '60px',
                height: '60px'
            }}
        >
            <div className="w-16 h-16 bg-white/90 rounded-lg backdrop-blur-md shadow-xl flex items-center justify-center border border-[var(--accent-blue)]/50 animate-pulse overflow-hidden">
                 <div className="w-full h-full p-1">
                     <ToolPreview3D type={type} theme={theme} />
                </div>
            </div>
        </div>
    );
});

// Force Context Cleanup Helper
const ContextDisposer = () => {
  const { gl } = useThree();
  useEffect(() => {
    return () => {
        gl.dispose();
    };
  }, [gl]);
  return null;
}

const DragSpring = ({ dragOffset, isDragging }: { dragOffset: React.MutableRefObject<{x: number, y: number}>, isDragging: React.MutableRefObject<boolean> }) => {
    useFrame((_: any, delta: number) => {
        if (!isDragging.current) {
            const snapSpeed = 10;
            dragOffset.current.x = THREE.MathUtils.lerp(dragOffset.current.x, 0, delta * snapSpeed);
            dragOffset.current.y = THREE.MathUtils.lerp(dragOffset.current.y, 0, delta * snapSpeed);
        }
    });
    return null;
}

const BuilderGrid: React.FC<BuilderGridProps> = ({ grid, theme, onCellClick, onCellRightClick, onCellDrop, onGridMove }) => {
    const numRows = grid.length;
    const numCols = grid[0].length;
    const offsetX = (numCols - 1) / 2;
    const offsetZ = (numRows - 1) / 2;

    const viewAngle = { azimuth: 30, elevation: 35 };
    const dragOffset = useRef({ x: 0, y: 0 });
    const isCameraDragging = useRef(false);
    const cameraDragStart = useRef({ x: 0, y: 0 });

    // Custom Drag State
    const [activeDrag, setActiveDrag] = useState<{ start: {r: number, c: number}, type: CellType, current: {x: number, y: number} } | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{r: number, c: number} | null>(null);

    // --- Custom Drag Logic ---

    // 1. Start Interaction
    const handleCellPointerDown = useCallback((e: React.PointerEvent, r: number, c: number, type: CellType) => {
        // Prevent camera drag propagation if we are clicking a cell
        e.stopPropagation();
        
        // Start Interaction point
        const startX = e.clientX;
        const startY = e.clientY;
        let isDragging = false;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Let users reposition placed items even when a paint tool is selected.
            if (!isDragging && dist > 5 && type !== CellType.Empty && type !== CellType.Hole) {
                isDragging = true;
            }

            if (isDragging) {
                // Update Drag State
                setActiveDrag(prev => ({
                    start: { r, c },
                    type: type,
                    current: { x: moveEvent.clientX, y: moveEvent.clientY }
                }));

                // Identify target cell under finger
                const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
                const target = elements.find(el => el.classList.contains('builder-cell-target')) as HTMLElement;
                if (target && target.dataset.row && target.dataset.col) {
                    setHoveredCell({ r: parseInt(target.dataset.row!), c: parseInt(target.dataset.col!) });
                } else {
                    setHoveredCell(null);
                }
            }
        };

        const handlePointerUp = (upEvent: PointerEvent) => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            
            if (isDragging) {
                // End Drag
                const elements = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
                const target = elements.find(el => el.classList.contains('builder-cell-target')) as HTMLElement;
                
                if (target && target.dataset.row && target.dataset.col) {
                    const targetR = parseInt(target.dataset.row!);
                    const targetC = parseInt(target.dataset.col!);
                    if (targetR !== r || targetC !== c) {
                        onGridMove({r, c}, {r: targetR, c: targetC});
                    }
                }
                setActiveDrag(null);
                setHoveredCell(null);
            } else {
                // Just a Click (Tap) - Fire onClick to handle logic (Paint/Toggle)
                onCellClick(r, c);
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [onCellClick, onGridMove]);

    const handleCellHover = useCallback((r: number, c: number) => {
        // Optimization: Avoid state updates if nothing changed
        setHoveredCell(prev => {
            if (prev && prev.r === r && prev.c === c) return prev;
            return { r, c };
        });
    }, []);

    // --- Camera Logic ---
    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        // This only fires if handleCellPointerDown didn't stop propagation
        isCameraDragging.current = true;
        cameraDragStart.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
        if (isCameraDragging.current) {
            const deltaX = e.clientX - cameraDragStart.current.x;
            const deltaY = e.clientY - cameraDragStart.current.y;
            dragOffset.current = { x: deltaX * 0.5, y: deltaY * 0.5 };
        }
    };

    const handleCanvasPointerUp = (e: React.PointerEvent) => {
        isCameraDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const palette = THEME_PALETTES[theme] || THEME_PALETTES['builder'];

    return (
        <div 
            className="w-full h-full bg-transparent touch-none relative"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={(e) => {
                handleCanvasPointerUp(e);
                if (!activeDrag) setHoveredCell(null);
            }}
        >
            <Canvas 
                orthographic
                camera={{ zoom: 100, position: [0, 50, 50], near: 0.1, far: 1000 }} // Initial zoom closer to target (100) to prevent fly-in
                shadows
                dpr={[1, 1.5]}
                gl={{ alpha: true, powerPreference: "default", antialias: true }} 
                style={{ pointerEvents: 'none', background: 'transparent' }}
            >
                <ContextDisposer />
                <DragSpring dragOffset={dragOffset} isDragging={isCameraDragging} />
                <CameraRig viewAngle={viewAngle} gridSize={{ rows: numRows, cols: numCols }} dragOffset={dragOffset} />
                
                <BuilderLightingRig theme={theme} gridSize={{ rows: numRows, cols: numCols }} />
                
                {/* Positioned at 0 to match game grid exactly */}
                <group position={[-offsetX, 0, -offsetZ]}>
                    <FloorSystem theme={theme}>
                        {grid.map((row, r) => 
                            row.map((cell, c) => (
                                <BuilderCell 
                                    key={`${r}-${c}`}
                                    row={r}
                                    col={c}
                                    type={cell}
                                    theme={theme}
                                    onRightClick={onCellRightClick}
                                    onDrop={onCellDrop}
                                    onPointerDown={handleCellPointerDown}
                                    isDragSource={activeDrag?.start.r === r && activeDrag?.start.c === c}
                                    isDragTarget={activeDrag ? (hoveredCell?.r === r && hoveredCell?.c === c) : false}
                                    isHovered={!activeDrag && hoveredCell?.r === r && hoveredCell?.c === c}
                                    onHover={handleCellHover}
                                    gridSize={{ rows: numRows, cols: numCols }}
                                />
                            ))
                        )}
                    </FloorSystem>
                </group>
            </Canvas>

            {/* Drag Ghost Overlay (2D container for 3D content) */}
            {activeDrag && (
                <DragGhost type={activeDrag.type} x={activeDrag.current.x} y={activeDrag.current.y} theme={theme} />
            )}
        </div>
    );
};

export default BuilderGrid;