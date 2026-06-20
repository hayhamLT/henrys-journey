
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CellType, Theme } from '../types';
import { WallBlock, CrystalGem3D, Key3D, Bomb, FloorTile, Teleporter, ForceField3D, CosmicPortal } from './Models3D';
import { ICONS } from './icons';

interface ToolPreviewProps {
    type: CellType;
    theme?: Theme;
}

const PreviewScene: React.FC<ToolPreviewProps> = ({ type, theme = 'builder' }) => {
    // Isometric-ish rotation for the icon view
    const rotation: [number, number, number] = [0.5, Math.PI / 4, 0];
    
    // Scale Logic: Increase size for smaller items (Gem, Bomb, Portal, Key)
    let scale = 0.85;
    if ([
        CellType.Package, 
        CellType.Bomb,
        CellType.Start, CellType.End,
        CellType.Teleporter_A, CellType.Teleporter_B,
        CellType.Teleporter_C, CellType.Teleporter_D,
        CellType.Teleporter_E, CellType.Teleporter_F,
        CellType.Package_Circuit, CellType.Package_Blue, CellType.Package_Red,
        CellType.Package_Purple, CellType.Package_Orange, CellType.Package_Cyan,
        CellType.PhaseShifter, CellType.Package_AutoSolver,
        CellType.ForceField, CellType.ForceField_Blue, CellType.ForceField_Red,
        CellType.ForceField_Purple, CellType.ForceField_Orange, CellType.ForceField_Cyan
    ].includes(type)) {
        scale = 2.0; // Increased to 2.0 (~50% larger than previous 1.35)
    }
    
    return (
        <>
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 10, 5]} intensity={1.8} />
            <directionalLight position={[-5, 5, 5]} intensity={0.8} color="#ffffff" />
            
            <group rotation={rotation} scale={scale}>
                {type === CellType.Wall && (
                    <WallBlock position={[0, -0.2, 0]} theme={theme} />
                )}
                {type === CellType.Package && (
                    <CrystalGem3D position={[0, -0.4, 0]} color="green" />
                )}
                {type === CellType.Bomb && (
                    <Bomb position={[0, -0.2, 0]} />
                )}
                {type === CellType.Trap && (
                    <group position={[0, -0.2, 0]}>
                        <mesh position={[0, 0.03, 0]}>
                            <cylinderGeometry args={[0.44, 0.44, 0.06, 18]} />
                            <meshStandardMaterial color="#7f1d1d" roughness={0.55} metalness={0.15} />
                        </mesh>
                        {[-0.18, 0, 0.18].map((x) =>
                            [-0.18, 0, 0.18].map((z) => (
                                <mesh key={`preview-trap-spike-${x}-${z}`} position={[x, 0.16, z]}>
                                    <coneGeometry args={[0.07, 0.24, 10]} />
                                    <meshStandardMaterial color="#ef4444" emissive="#991b1b" emissiveIntensity={0.35} roughness={0.3} metalness={0.25} />
                                </mesh>
                            ))
                        )}
                    </group>
                )}
                {type === CellType.Boost && (
                    <mesh position={[0, 0.05, 0]}>
                        <sphereGeometry args={[0.28, 18, 18]} />
                        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.5} roughness={0.2} metalness={0.3} />
                    </mesh>
                )}
                {type === CellType.CrumblingFloor && (
                    <FloorTile position={[0, 0, 0]} theme={theme} isCrumbling={true} />
                )}
                
                {/* Start/End Portal */}
                {(type === CellType.Start || type === CellType.End) && (
                    <CosmicPortal position={[0, -0.1, 0]} color="#38BDF8" isOpen={false} rotationSpeed={0} scale={0.5} shape="circle" />
                )}
                
                {/* Portals */}
                {(type === CellType.Teleporter_A || type === CellType.Teleporter_B) && <Teleporter position={[0, -0.1, 0]} color="#4ECDC4" />}
                {(type === CellType.Teleporter_C || type === CellType.Teleporter_D) && <Teleporter position={[0, -0.1, 0]} color="#9D4EDD" />}
                {(type === CellType.Teleporter_E || type === CellType.Teleporter_F) && <Teleporter position={[0, -0.1, 0]} color="#FFE66D" />}

                {/* Keys */}
                {type === CellType.Package_Circuit && <Key3D position={[0, -0.4, 0]} color="yellow" />}
                {type === CellType.Package_Blue && <Key3D position={[0, -0.4, 0]} color="blue" />}
                {type === CellType.Package_Red && <Key3D position={[0, -0.4, 0]} color="red" />}
                {type === CellType.Package_Purple && <Key3D position={[0, -0.4, 0]} color="purple" />}
                {type === CellType.Package_Orange && <Key3D position={[0, -0.4, 0]} color="orange" />}
                {type === CellType.Package_Cyan && <Key3D position={[0, -0.4, 0]} color="cyan" />}
                
                {/* Locks */}
                {type === CellType.ForceField && <ForceField3D position={[0, -0.2, 0]} color="yellow" />}
                {type === CellType.ForceField_Blue && <ForceField3D position={[0, -0.2, 0]} color="blue" />}
                {type === CellType.ForceField_Red && <ForceField3D position={[0, -0.2, 0]} color="red" />}
                {type === CellType.ForceField_Purple && <ForceField3D position={[0, -0.2, 0]} color="purple" />}
                {type === CellType.ForceField_Orange && <ForceField3D position={[0, -0.2, 0]} color="orange" />}
                {type === CellType.ForceField_Cyan && <ForceField3D position={[0, -0.2, 0]} color="cyan" />}
            </group>
        </>
    );
};

export const ToolPreview3D: React.FC<ToolPreviewProps> = (props) => {
    // Void remains 2D SVG as "Empty Space" is hard to visualize in 3D without context
    if (props.type === CellType.Hole) {
        return (
            <div className="w-full h-full flex items-center justify-center text-white/50">
                <div className="scale-125"><ICONS.HoleTool2D /></div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                frameloop="demand"
                orthographic
                camera={{ zoom: 28, position: [0, 5, 5] }}
                gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
                style={{ pointerEvents: 'none' }} // Pass clicks through to the button
            >
                <Suspense fallback={null}>
                    <PreviewScene {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
};
