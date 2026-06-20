
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { CellType, Theme, LevelDataForShare, Position, UserProfile, Level } from '../types';
import { ICONS } from './icons';
import BuilderGrid, { DragGhost } from './BuilderGrid';
import { generateCustomLevel } from '../utils/levelGenerator';
import { playSound } from '../sound';
import { publishLevel, sendInvite } from '../firebase';
import UserSearchModal from './UserSearchModal';
import LoginModal from './LoginModal';
import { RECOMMENDED_FIRESTORE_RULES } from '../constants/game';
import { solve } from '../utils/solver';

const MIN_SIZE = 3;
const MAX_SIZE = 8;

// Linked Pairs Definition
const PAIRS: Record<number, number> = {
    [CellType.Teleporter_A]: CellType.Teleporter_B,
    [CellType.Teleporter_B]: CellType.Teleporter_A,
    [CellType.Teleporter_C]: CellType.Teleporter_D,
    [CellType.Teleporter_D]: CellType.Teleporter_C,
    [CellType.Teleporter_E]: CellType.Teleporter_F,
    [CellType.Teleporter_F]: CellType.Teleporter_E,
    [CellType.Package_Circuit]: CellType.ForceField,
    [CellType.ForceField]: CellType.Package_Circuit,
    [CellType.Package_Blue]: CellType.ForceField_Blue,
    [CellType.ForceField_Blue]: CellType.Package_Blue,
    [CellType.Package_Red]: CellType.ForceField_Red,
    [CellType.ForceField_Red]: CellType.Package_Red,
};

const getPortalColor = (type: CellType) => {
    switch (type) {
        case CellType.Teleporter_A: case CellType.Teleporter_B: return '#4ECDC4';
        case CellType.Teleporter_C: case CellType.Teleporter_D: return '#9D4EDD';
        case CellType.Teleporter_E: case CellType.Teleporter_F: return '#FFE66D';
        default: return '#4ECDC4';
    }
};

const getKeyLockColor = (type: CellType) => {
    switch (type) {
        case CellType.Package_Circuit: case CellType.ForceField: return '#FACC15';
        case CellType.Package_Blue: case CellType.ForceField_Blue: return '#06b6d4';
        case CellType.Package_Red: case CellType.ForceField_Red: return '#f43f5e';
        case CellType.Package_Purple: case CellType.ForceField_Purple: return '#d946ef';
        case CellType.Package_Orange: case CellType.ForceField_Orange: return '#fb923c';
        case CellType.Package_Cyan: case CellType.ForceField_Cyan: return '#67e8f9';
        default: return '#FACC15';
    }
};

interface LevelBuilderProps {
    onExit: () => void;
    onSave: (data: LevelDataForShare) => Promise<void>;
    user: UserProfile | null;
    isGuest: boolean;
    onLogin: () => Promise<void>;
    onOpenLevels: () => void;
}

const DRAFT_KEY = 'hj_builder_draft';
type BuilderSnapshot = { grid: CellType[][]; gridSize: { rows: number; cols: number } };

const loadDraft = (): BuilderSnapshot | null => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.grid) && parsed.gridSize) return parsed;
    } catch (e) { /* ignore */ }
    return null;
};

const makeDefaultGrid = (rows: number, cols: number): CellType[][] => {
    const g = Array.from({ length: rows }, () => Array(cols).fill(CellType.Empty));
    g[0][0] = CellType.Start;
    return g;
};

const LevelBuilder: React.FC<LevelBuilderProps> = ({ onExit, onSave, user, isGuest, onLogin, onOpenLevels }) => {
    // --- State (restore an in-progress draft if one exists) ---
    const initialDraft = useMemo(() => loadDraft(), []);
    const [gridSize, setGridSize] = useState(initialDraft?.gridSize || { rows: 5, cols: 5 });
    const [grid, setGrid] = useState<CellType[][]>(() =>
        initialDraft?.grid ? initialDraft.grid.map(r => [...r]) : makeDefaultGrid(5, 5)
    );

    // --- Undo / Redo history + draft auto-save ---
    const [past, setPast] = useState<BuilderSnapshot[]>([]);
    const [future, setFuture] = useState<BuilderSnapshot[]>([]);
    const isTimeTravelRef = useRef(false);
    const didMountRef = useRef(false);
    const prevSnapshotRef = useRef<BuilderSnapshot>({ grid, gridSize });

    useEffect(() => {
        // Skip the very first run (initial mount) so we don't seed a no-op entry.
        if (!didMountRef.current) { didMountRef.current = true; prevSnapshotRef.current = { grid, gridSize }; return; }
        if (isTimeTravelRef.current) { isTimeTravelRef.current = false; prevSnapshotRef.current = { grid, gridSize }; return; }
        setPast(p => [...p.slice(-49), prevSnapshotRef.current]);
        setFuture([]);
        prevSnapshotRef.current = { grid, gridSize };
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ grid, gridSize })); } catch (e) { /* quota */ }
    }, [grid, gridSize]);

    const handleUndo = useCallback(() => {
        setPast(p => {
            if (p.length === 0) return p;
            const prev = p[p.length - 1];
            isTimeTravelRef.current = true;
            setFuture(f => [{ grid, gridSize }, ...f].slice(0, 50));
            setGridSize(prev.gridSize);
            setGrid(prev.grid.map(r => [...r]));
            prevSnapshotRef.current = prev;
            playSound('removeMove');
            return p.slice(0, -1);
        });
    }, [grid, gridSize]);

    const handleRedo = useCallback(() => {
        setFuture(f => {
            if (f.length === 0) return f;
            const next = f[0];
            isTimeTravelRef.current = true;
            setPast(p => [...p.slice(-49), { grid, gridSize }]);
            setGridSize(next.gridSize);
            setGrid(next.grid.map(r => [...r]));
            prevSnapshotRef.current = next;
            playSound('addMove');
            return f.slice(1);
        });
    }, [grid, gridSize]);
    // Use unique builder theme
    const theme: Theme = 'builder'; 
    const [selectedTool, setSelectedTool] = useState<CellType | null>(null); // Null = Move/Edit Mode
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRulesHelp, setShowRulesHelp] = useState(false);

    // Sharing State
    const [isSaving, setIsSaving] = useState(false);
    // Visible save-validation feedback (replaces the old silent fail-sound).
    const [saveError, setSaveError] = useState<string | null>(null);

    // Mobile Drag State
    const [activeToolbarDrag, setActiveToolbarDrag] = useState<{ type: CellType, x: number, y: number } | null>(null);

    // Auto-dismiss the save-error toast after a few seconds.
    useEffect(() => {
        if (!saveError) return;
        const t = setTimeout(() => setSaveError(null), 4500);
        return () => clearTimeout(t);
    }, [saveError]);

    // Auto-close modal when user logs in
    useEffect(() => {
        if (!isGuest && user) {
            setShowLoginModal(false);
        }
    }, [isGuest, user]);

    const updateGridSize = (rows: number, cols: number) => {
        const r = Math.max(MIN_SIZE, Math.min(MAX_SIZE, rows));
        const c = Math.max(MIN_SIZE, Math.min(MAX_SIZE, cols));
        
        // Only play sound if value actually changed
        if (r !== gridSize.rows || c !== gridSize.cols) {
            playSound('addMove');
        }

        setGridSize({ rows: r, cols: c });
        
        // Preserve existing grid cells
        setGrid(prevGrid => {
            const newGrid = Array.from({ length: r }, (_, rowIdx) => 
                Array.from({ length: c }, (_, colIdx) => {
                    if (rowIdx < prevGrid.length && colIdx < prevGrid[0].length) {
                        return prevGrid[rowIdx][colIdx];
                    }
                    return CellType.Empty;
                })
            );
            
            // Ensure Start exists within the new bounds
            let hasStart = false;
            
            // First check if they survived resize
            for(let i=0; i<r; i++) {
                for(let j=0; j<c; j++) {
                    if (newGrid[i][j] === CellType.Start) hasStart = true;
                }
            }
            
            // If lost, reset to default corner
            if (!hasStart) {
                // If 0,0 is occupied, overwrite it (Start is mandatory)
                newGrid[0][0] = CellType.Start;
            }
            
            return newGrid;
        });
    };

    const handleGenerate = async () => {
        const lvl = await generateCustomLevel(gridSize.rows, gridSize.cols);
        if (lvl) {
            setGrid(lvl.grid);
            playSound('success');
        }
    };

    // --- Grid Modification Logic (Centralized) ---

    const updateCell = useCallback((r: number, c: number, newType: CellType) => {
        if (r < 0 || r >= gridSize.rows || c < 0 || c >= gridSize.cols) return;
        
        setGrid(prevGrid => {
            const currentType = prevGrid[r][c];
            
            // Protect Start from being overwritten by other tools directly (must use move logic or be explicitly replaced if we allowed placing start)
            // Ideally Start should only be movable, not deleted/overwritten easily unless we add a specific Start tool.
            // For now, prevent overwriting Start with other items.
            if (currentType === CellType.Start && newType !== CellType.Start) {
                return prevGrid;
            }

            const nextGrid = prevGrid.map(row => [...row]);

            // Linked Removal Logic:
            if (currentType !== newType && currentType !== CellType.Empty) {
                const partnerType = PAIRS[currentType];
                if (partnerType !== undefined) {
                    for(let i = 0; i < nextGrid.length; i++) {
                        for(let j = 0; j < nextGrid[0].length; j++) {
                            if (nextGrid[i][j] === partnerType) {
                                nextGrid[i][j] = CellType.Empty; 
                            }
                        }
                    }
                }
            }

            nextGrid[r][c] = newType;

            // Linked Creation Logic: Automatically spawn partner if missing
            if (newType !== CellType.Empty) {
                const partnerType = PAIRS[newType];
                if (partnerType !== undefined) {
                     // Check if partner exists
                     let partnerExists = false;
                     for(let i = 0; i < nextGrid.length; i++) {
                        for(let j = 0; j < nextGrid[0].length; j++) {
                            if (nextGrid[i][j] === partnerType) {
                                partnerExists = true;
                                break;
                            }
                        }
                     }

                     if (!partnerExists) {
                         // Find spot for partner (Neighbors -> First Empty)
                         const neighbors = [
                             {r: r, c: c+1}, {r: r, c: c-1}, {r: r+1, c: c}, {r: r-1, c: c}
                         ];
                         
                         let placed = false;
                         for (const n of neighbors) {
                             if (n.r >= 0 && n.r < gridSize.rows && n.c >= 0 && n.c < gridSize.cols && nextGrid[n.r][n.c] === CellType.Empty) {
                                 nextGrid[n.r][n.c] = partnerType;
                                 placed = true;
                                 break;
                             }
                         }

                         if (!placed) {
                             outerLoop: for(let i = 0; i < nextGrid.length; i++) {
                                for(let j = 0; j < nextGrid[0].length; j++) {
                                    if (nextGrid[i][j] === CellType.Empty) {
                                        nextGrid[i][j] = partnerType;
                                        placed = true;
                                        break outerLoop;
                                    }
                                }
                             }
                         }
                     }
                }
            }

            return nextGrid;
        });
    }, [gridSize]);

    // --- Dynamic Tool Types (Sequential Logic) ---
    
    // Determine which portal comes next based on existing ones
    const nextPortalType = useMemo(() => {
        const flat = grid.flat();
        const hasA1 = flat.includes(CellType.Teleporter_A); const hasA2 = flat.includes(CellType.Teleporter_B);
        if (!hasA1) return CellType.Teleporter_A; if (!hasA2) return CellType.Teleporter_B;
        const hasB1 = flat.includes(CellType.Teleporter_C); const hasB2 = flat.includes(CellType.Teleporter_D);
        if (!hasB1) return CellType.Teleporter_C; if (!hasB2) return CellType.Teleporter_D;
        const hasC1 = flat.includes(CellType.Teleporter_E); const hasC2 = flat.includes(CellType.Teleporter_F);
        if (!hasC1) return CellType.Teleporter_E; if (!hasC2) return CellType.Teleporter_F;
        return null; 
    }, [grid]);

    // Determine which Key/Lock comes next based on existing ones
    const nextKeyLockType = useMemo(() => {
        const flat = grid.flat();
        const hasKey1 = flat.includes(CellType.Package_Circuit); const hasLock1 = flat.includes(CellType.ForceField);
        if (!hasKey1) return CellType.Package_Circuit; if (!hasLock1) return CellType.ForceField;
        const hasKey2 = flat.includes(CellType.Package_Blue); const hasLock2 = flat.includes(CellType.ForceField_Blue);
        if (!hasKey2) return CellType.Package_Blue; if (!hasLock2) return CellType.ForceField_Blue;
        const hasKey3 = flat.includes(CellType.Package_Red); const hasLock3 = flat.includes(CellType.ForceField_Red);
        if (!hasKey3) return CellType.Package_Red; if (!hasLock3) return CellType.ForceField_Red;
        return null;
    }, [grid]);

    const isKeyNext = useMemo(() => {
        return [CellType.Package_Circuit, CellType.Package_Blue, CellType.Package_Red].includes(nextKeyLockType as CellType);
    }, [nextKeyLockType]);

    // Use 2D Icons for Toolbar
    const toolbarItems = [
        { type: CellType.Wall, name: 'Wall', icon: <ICONS.WallTool /> },
        { type: CellType.Hole, name: 'Void', icon: <ICONS.HoleTool2D /> },
        { type: CellType.Package, name: 'Gem', icon: <ICONS.GemTool /> },
        { type: CellType.Bomb, name: 'Bomb', icon: <ICONS.BombTool /> },
        { type: CellType.CrumblingFloor, name: 'Fragile', icon: <ICONS.CrumblingFloorTool2D /> },
        { type: CellType.Trap, name: 'Trap', icon: <ICONS.TrapTool /> },
        { type: CellType.Boost, name: 'Boost', icon: <ICONS.BoostTool /> },
        // Dynamic Portal Tool
        { 
            type: nextPortalType, 
            name: 'Portal',
            disabled: !nextPortalType,
            icon: nextPortalType ? <ICONS.PortalTool color={getPortalColor(nextPortalType)} /> : <ICONS.PortalTool color="#475569" />
        },
        // Dynamic Key/Lock Tool
        { 
            type: nextKeyLockType, 
            name: isKeyNext ? 'Key' : 'Lock',
            disabled: !nextKeyLockType,
            icon: nextKeyLockType ? (
                isKeyNext ? <ICONS.KeyTool2D color={getKeyLockColor(nextKeyLockType)} /> : <ICONS.LockTool2D color={getKeyLockColor(nextKeyLockType)} />
            ) : <ICONS.LockTool2D color="#475569" />
        },
    ];

    // --- Grid Interactions ---

    const handleCellClick = useCallback((r: number, c: number) => {
        const current = grid[r][c];
        
        // Prevent editing Start with click (must move it)
        if (current === CellType.Start) {
            playSound('fail_wall');
            return;
        }

        if (selectedTool !== null) {
            // Paint Mode: Apply tool directly
            updateCell(r, c, selectedTool);
            playSound('addMove');
        } else {
            // Move/Edit Mode (Legacy Toggle Behavior)
            if (current !== CellType.Empty && current !== CellType.Hole) {
                updateCell(r, c, CellType.Empty);
                playSound('removeMove');
            } else if (current === CellType.Empty) {
                updateCell(r, c, CellType.Hole);
                playSound('removeMove');
            } else if (current === CellType.Hole) {
                updateCell(r, c, CellType.Empty);
                playSound('addMove');
            }
        }
    }, [grid, updateCell, selectedTool]);

    const handleCellRightClick = useCallback((e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        const current = grid[r][c];
        // Protect Start from right-click deletion
        if (current !== CellType.Start && current !== CellType.Empty) {
            updateCell(r, c, CellType.Empty);
            playSound('removeMove');
        }
    }, [grid, updateCell]);

    // HTML5 Drop (for desktop drag-in from toolbar if desired)
    const handleCellDrop = useCallback((e: React.DragEvent, r: number, c: number) => {
        e.preventDefault();
        const typeStr = e.dataTransfer.getData('toolType');
        if (typeStr && typeStr !== 'null') {
            const type = parseInt(typeStr) as CellType;
            updateCell(r, c, type);
            playSound('addMove');
        }
    }, [updateCell]);

    // Internal Move (Grid to Grid) - Available in all modes for quick repositioning
    const handleGridMove = useCallback((source: {r: number, c: number}, target: {r: number, c: number}) => {
        const { r, c } = target;
        const { r: srcR, c: srcC } = source;
        if (srcR === r && srcC === c) return; 

        setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            const movingType = newGrid[srcR][srcC];
            const targetType = newGrid[r][c];

            // Block overwriting Start with other items
            if (targetType === CellType.Start && movingType !== CellType.Start) {
                playSound('fail_wall');
                return prev;
            }
            if (movingType === CellType.Empty || movingType === CellType.Hole) return prev;

            // Clean up pairs at dest
            if (targetType !== CellType.Empty && targetType !== movingType) {
                    const destPartner = PAIRS[targetType];
                    if (destPartner !== undefined) {
                        for(let i=0; i<newGrid.length; i++) {
                            for(let j=0; j<newGrid[0].length; j++) {
                                if(newGrid[i][j] === destPartner) newGrid[i][j] = CellType.Empty;
                            }
                        }
                    }
            }

            newGrid[r][c] = movingType;
            newGrid[srcR][srcC] = CellType.Empty;
            return newGrid;
        });
        playSound('addMove');
    }, []);

    // --- Toolbar Drag Logic (Touch Support) ---

    const handleToolTouchStart = (e: React.TouchEvent, type: CellType | null) => {
        if (!type) return;
        const touch = e.touches[0];
        
        // Prevent scrolling while dragging
        document.body.style.overflow = 'hidden'; 
        
        setActiveToolbarDrag({
            type,
            x: touch.clientX,
            y: touch.clientY
        });
        playSound('addMove');

        const moveHandler = (moveEvent: TouchEvent) => {
            const t = moveEvent.touches[0];
            setActiveToolbarDrag(prev => prev ? { ...prev, x: t.clientX, y: t.clientY } : null);
        };

        const endHandler = (endEvent: TouchEvent) => {
            const t = endEvent.changedTouches[0];
            const elements = document.elementsFromPoint(t.clientX, t.clientY);
            const target = elements.find(el => el.classList.contains('builder-cell-target')) as HTMLElement;
            
            if (target && target.dataset.row && target.dataset.col) {
                updateCell(parseInt(target.dataset.row), parseInt(target.dataset.col), type);
                playSound('addMove');
            }

            setActiveToolbarDrag(null);
            document.body.style.overflow = '';
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', endHandler);
        };

        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', endHandler);
    };

    // --- Saving ---

    const handleSaveClick = async () => {
        if (!user?.uid) {
            setShowLoginModal(true);
            return;
        }

        const findCell = (g: CellType[][], t: CellType) => {
            for(let r=0; r<g.length; r++) {
                for(let c=0; c<g[0].length; c++) {
                    if(g[r][c] === t) return {r,c};
                }
            }
            return null;
        }

        setSaveError(null);
        const startCell = findCell(grid, CellType.Start);

        if (!startCell) {
             playSound('fail_incomplete');
             setSaveError('Add a Start tile — Henry needs a place to begin.');
             return;
        }

        // Reconstruct logic links
        const circuitLinks: LevelDataForShare['circuitLinks'] = {};
        const k1 = findCell(grid, CellType.Package_Circuit); const l1 = findCell(grid, CellType.ForceField);
        if (k1 && l1) circuitLinks[`${k1.r},${k1.c}`] = [`${l1.r},${l1.c}`];
        const k2 = findCell(grid, CellType.Package_Blue); const l2 = findCell(grid, CellType.ForceField_Blue);
        if (k2 && l2) circuitLinks[`${k2.r},${k2.c}`] = [`${l2.r},${l2.c}`];
        const k3 = findCell(grid, CellType.Package_Red); const l3 = findCell(grid, CellType.ForceField_Red);
        if (k3 && l3) circuitLinks[`${k3.r},${k3.c}`] = [`${l3.r},${l3.c}`];

        // Validation - Single Portal Logic: End = Start
        const tempLevel: Level = {
            grid,
            start: { row: startCell.r, col: startCell.c },
            end: { row: startCell.r, col: startCell.c },
            circuitLinks
        };
        
        const solution = solve(tempLevel, { requireAllGems: true });
        if (!solution.isSolvable) {
            playSound('fail_incomplete');
            setSaveError("This level can't be solved yet — make sure every gem and the exit can be reached.");
            return;
        }

        const solvedPar = Math.max(1, solution.path?.length || 1);
        const derivedTimeLimit = Math.ceil(solvedPar * 1.5) + 15;

        setIsSaving(true);
        try {
            const levelData: LevelDataForShare = { grid, theme, par: solvedPar, timeLimit: derivedTimeLimit, circuitLinks };
            await onSave(levelData);
            playSound('success');
            // Level is saved — clear the in-progress draft and history.
            try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
            setPast([]); setFuture([]);
        } catch (e: any) {
            console.log("Save info:", e);
            if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
                 setShowRulesHelp(true);
            } else {
                 playSound('fail_incomplete');
                 setSaveError("Couldn't save right now — check your connection and try again.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Shared Controls Component
    const Controls = () => (
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-nowrap">
            {/* Dimensions Group */}
            <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                <div className="flex items-center">
                    <span className="text-[9px] font-black text-white/30 px-2">W</span>
                    <button onClick={() => updateGridSize(gridSize.rows, gridSize.cols - 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors active:scale-95"><ICONS.Minus /></button>
                    <span className="w-8 text-center font-mono font-bold text-white text-sm">{gridSize.cols}</span>
                    <button onClick={() => updateGridSize(gridSize.rows, gridSize.cols + 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors active:scale-95"><ICONS.Plus /></button>
                </div>
                <div className="flex items-center border-l border-white/10 pl-2">
                    <span className="text-[9px] font-black text-white/30 px-2">H</span>
                    <button onClick={() => updateGridSize(gridSize.rows - 1, gridSize.cols)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors active:scale-95"><ICONS.Minus /></button>
                    <span className="w-8 text-center font-mono font-bold text-white text-sm">{gridSize.rows}</span>
                    <button onClick={() => updateGridSize(gridSize.rows + 1, gridSize.cols)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors active:scale-95"><ICONS.Plus /></button>
                </div>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                 <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                    <button onClick={handleUndo} disabled={past.length === 0} className="w-9 h-8 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Undo" aria-label="Undo">
                        <span className="text-lg leading-none">↶</span>
                    </button>
                    <button onClick={handleRedo} disabled={future.length === 0} className="w-9 h-8 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Redo" aria-label="Redo">
                        <span className="text-lg leading-none">↷</span>
                    </button>
                 </div>
                 <button onClick={handleGenerate} className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap" title="Randomize">
                    <ICONS.Dice />
                    <span className="hidden sm:inline text-xs font-bold">Randomize</span>
                 </button>
                 <button onClick={handleSaveClick} disabled={isSaving} className="h-10 px-3 sm:px-6 flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all active:scale-95 border border-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" title="Save">
                    {isSaving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><ICONS.Save /> <span className="hidden sm:inline">Save</span></>}
                 </button>
            </div>

        </div>
    );

    return (
        <div className="w-full h-full bg-transparent overflow-hidden relative">
            {/* Save-validation toast — visible feedback instead of a silent fail sound */}
            {saveError && (
                <div className="absolute bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300 px-4 w-full max-w-md">
                    <div className="flex items-start gap-3 bg-[#3a1212]/90 backdrop-blur-xl border border-rose-400/40 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                        <div className="text-rose-300 shrink-0 mt-0.5"><ICONS.Info /></div>
                        <p className="text-xs font-bold text-rose-100 leading-snug flex-grow">{saveError}</p>
                        <button onClick={() => setSaveError(null)} className="text-rose-200/50 hover:text-rose-100 shrink-0 -mt-0.5 -mr-1 px-2 text-base leading-none font-black" aria-label="Dismiss">
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Main Editor Area - Full Screen Background */}
            <div className="absolute inset-0 z-0 bg-transparent">
                <BuilderGrid 
                    grid={grid}
                    theme={theme}
                    onCellClick={handleCellClick}
                    onCellRightClick={handleCellRightClick}
                    onCellDrop={handleCellDrop}
                    onGridMove={handleGridMove}
                />
            </div>

            {/* Header Area - Fixed Top, Consistent Glass */}
            <div className="absolute top-0 left-0 w-full z-30 pointer-events-none">
                <header className="pointer-events-auto w-full h-16 lg:h-20 bg-black/20 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6 select-none shadow-sm relative z-30 pt-safe">
                    
                    {/* Left: Title */}
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden">
                            <ICONS.Left />
                        </button>
                        <div className="text-[var(--accent-blue)] scale-125"><ICONS.Builder /></div>
                        <div>
                            <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide">Builder</h2>
                            <p className="text-xs text-white/50 font-medium">Creative Mode</p>
                        </div>
                    </div>

                    {/* Desktop: Integrated Controls */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Controls />
                    </div>
                </header>

                {/* Mobile: Persistent Control Strip - Scrollable to prevent clipping */}
                <div className="lg:hidden absolute top-full left-0 w-full z-20 flex flex-col pointer-events-none -mt-px">
                    <div className="pointer-events-auto bg-black/20 backdrop-blur-2xl border-b border-white/5 shadow-xl w-full overflow-x-auto no-scrollbar">
                        <div className="flex items-center px-4 py-3 min-w-max mx-auto sm:mx-0 sm:justify-center">
                            <Controls />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Info Overlay - Constrained width to prevent clipping on small screens */}
            <div className="absolute top-48 lg:top-24 left-4 z-10 pointer-events-none select-none max-w-[calc(100vw-2rem)]">
                 <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/5 text-[9px] font-bold text-white/50 space-y-1.5 shadow-sm tracking-wide">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]"></div>
                        <span>L-CLICK: PLACE / TOGGLE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]"></div>
                        <span>R-CLICK: ERASE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-yellow)]"></div>
                        <span>DRAG ITEM: MOVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></div>
                        <span>DRAG BG: PAN CAMERA</span>
                    </div>
                    <div className="h-px bg-white/10 my-1"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                        <span>TRAP: STEP-ON FAIL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span>BOMB: COLLISION FAIL</span>
                    </div>
                 </div>
            </div>

            {/* Bottom Toolbar - Fixed Bottom, Safe Area Handling, Side Padding */}
            <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none">
                <div className="pointer-events-auto w-full bg-black/20 backdrop-blur-2xl border-t border-white/5 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl transition-all">
                    <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl mx-auto">
                        {toolbarItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (item.disabled) return;
                                    setSelectedTool(selectedTool === item.type ? null : item.type);
                                    playSound('addMove');
                                }}
                                disabled={item.disabled}
                                draggable={!item.disabled && item.type !== null}
                                onDragStart={(e) => {
                                    if (item.type !== null) {
                                        e.dataTransfer.setData('toolType', item.type.toString());
                                        e.dataTransfer.effectAllowed = 'copy';
                                        playSound('addMove');
                                    }
                                }}
                                onTouchStart={(e) => handleToolTouchStart(e, item.type)}
                                className={`
                                    tool-tile flex flex-col items-center gap-1 min-w-[44px] sm:min-w-[56px] transition-all duration-200 group relative p-1 rounded-xl shrink-0
                                    ${item.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                    ${item.type !== null ? 'cursor-grab active:cursor-grabbing' : ''}
                                    ${selectedTool === item.type ? 'tool-tile-selected bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}
                                `}
                            >
                                <div className="tool-glyph-3d w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden relative">
                                    {item.icon}
                                </div>
                                <span className={`text-[8px] sm:text-[9px] font-bold ${selectedTool === item.type ? 'text-[var(--accent-blue)]' : 'text-white/40'}`}>
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Drag Ghost */}
            {activeToolbarDrag && (
                <DragGhost type={activeToolbarDrag.type} x={activeToolbarDrag.x} y={activeToolbarDrag.y} theme={theme} />
            )}

            {/* Modals */}
            {showLoginModal && (
                <LoginModal 
                    onClose={() => setShowLoginModal(false)}
                    onLogin={onLogin}
                    featureName="Cloud Saving"
                    description="Sign in to save your levels to the cloud, access them from any device, and share them with friends."
                />
            )}

            {showRulesHelp && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowRulesHelp(false)}>
                    <div className="modern-panel p-6 max-w-md w-full text-center bg-[#1e293b] border border-red-500/30" onClick={e => e.stopPropagation()}>
                        <h2 className="font-display text-xl font-black text-red-500 mb-4 flex items-center justify-center gap-2">
                            <ICONS.Lock /> Permission Denied
                        </h2>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                            Database blocked your save request. Update Firestore Security Rules.
                        </p>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(RECOMMENDED_FIRESTORE_RULES);
                                playSound('success');
                                setShowRulesHelp(false);
                            }}
                            className="modern-button w-full py-3 text-[var(--accent-blue)] border-[var(--accent-blue)] bg-transparent hover:bg-[var(--accent-blue)]/10 font-bold"
                        >
                            Copy Rules
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LevelBuilder;
