
import { Level, CellType, Move } from '../types';

export { CellType };
const {
  Start,
  Empty,
  Package,
  Wall,
  Hole,
  CrumblingFloor,
  ForceField,
  Package_Circuit,
  Package_Blue,
  ForceField_Blue,
  Bomb,
  Teleporter_A,
  Teleporter_B,
  Boost,
  Trap,
} = CellType;

// A curated 5-level tutorial to guide the player from basics to logic.
// Updated for SINGLE PORTAL logic (Round Trip)

export const TUTORIAL_LEVELS: Level[] = [
  // 1. Intro to Movement (Round Trip) - Gem is 2 cells away
  {
    grid: [
      [Start, Empty, Package]
    ],
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    theme: 'day',
    solution: [Move.Right, Move.Right, Move.Left, Move.Left],
    tutorial: [
      { text: "Tap RIGHT", trigger: 'start', highlightedMove: Move.Right },
      { text: "Get GEM", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Go BACK", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Finish", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Run!", trigger: 'run_sequence', highlightedButton: 'run' },
    ],
  },
  // 2. Turning
  {
    grid: [
      [Start, Empty, Wall],
      [Wall, Empty, Package],
      [Wall, Wall, Wall]
    ],
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    theme: 'day',
    solution: [Move.Right, Move.Down, Move.Right, Move.Left, Move.Up, Move.Left],
    tutorial: [
      { text: "Tap RIGHT", trigger: 'start', highlightedMove: Move.Right },
      { text: "Tap DOWN", trigger: 'add_move', highlightedMove: Move.Down },
      { text: "Get GEM", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Go BACK", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Tap UP", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Home", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Run!", trigger: 'run_sequence', highlightedButton: 'run' },
    ],
  },
  // 3. Collection (Multi Gem)
  {
    grid: [
      [Start, Package, Empty],
      [Empty, Empty, Package],
      [Wall, Wall, Wall],
    ],
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    theme: 'day',
    solution: [Move.Right, Move.Right, Move.Down, Move.Left, Move.Left, Move.Up],
    tutorial: [
      { text: "Get ALL GEMS", trigger: 'start', highlightedMove: Move.Right },
      { text: "Tap RIGHT", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Go DOWN", trigger: 'add_move', highlightedMove: Move.Down },
      { text: "Loop BACK", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Tap LEFT", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Finish", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Run!", trigger: 'run_sequence', highlightedButton: 'run' },
    ],
  },
  // 4. Hazards (Holes) - Return Path Fix
  {
    grid: [
      [Start, Hole, Package],
      [Empty, Empty, Empty],
      [Wall, Wall, Wall]
    ],
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    theme: 'day',
    solution: [Move.Down, Move.Right, Move.Right, Move.Up, Move.Down, Move.Left, Move.Left, Move.Up],
    tutorial: [
      { text: "Avoid HOLES", trigger: 'start', highlightedMove: Move.Down },
      { text: "Go AROUND", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Tap RIGHT", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Up to GEM", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Return", trigger: 'add_move', highlightedMove: Move.Down }, 
      { text: "Go BACK", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Tap LEFT", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Home", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Run!", trigger: 'run_sequence', highlightedButton: 'run' },
    ]
  },
  // 5. Logic (Keys & Locks) - Modified to avoid crossing start
  {
    grid: [
      [Start, ForceField, Package],
      [Empty, Empty, Wall],
      [Empty, Package_Circuit, Empty],
    ],
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    theme: 'day',
    circuitLinks: { "2,1": ["0,1"] },
    solution: [Move.Down, Move.Down, Move.Right, Move.Up, Move.Up, Move.Right, Move.Left, Move.Left],
    tutorial: [
      { text: "Get KEY", trigger: 'start', highlightedMove: Move.Down },
      { text: "Tap DOWN", trigger: 'add_move', highlightedMove: Move.Down },
      { text: "Grab KEY", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Go UP", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Open LOCK", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "Get GEM", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "Go BACK", trigger: 'add_move', highlightedMove: Move.Left }, 
      { text: "Finish", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "Run!", trigger: 'run_sequence', highlightedButton: 'run' },
    ],
  },
  // 6. Bomb Intro - Configured to place Bomb in front of Start to avoid bubble occlusion
  {
    grid: [
      [Empty, Start, Empty],
      [Empty, Bomb, Empty],
      [Empty, Package, Empty]
    ],
    start: { row: 0, col: 1 },
    end: { row: 0, col: 1 },
    theme: 'day',
    solution: [Move.Left, Move.Down, Move.Down, Move.Right, Move.Left, Move.Up, Move.Up, Move.Right],
    tutorial: [
      { text: "DANGER AHEAD", trigger: 'start', highlightedMove: Move.Left },
      { text: "GO AROUND", trigger: 'add_move', highlightedMove: Move.Down },
      { text: "AVOID MINE", trigger: 'add_move', highlightedMove: Move.Down },
      { text: "GET GEM", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "RETURN", trigger: 'add_move', highlightedMove: Move.Left },
      { text: "SAFE PATH", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "ALMOST THERE", trigger: 'add_move', highlightedMove: Move.Up },
      { text: "HOME", trigger: 'add_move', highlightedMove: Move.Right },
      { text: "PRESS PLAY", trigger: 'run_sequence', highlightedButton: 'run' },
    ]
  }
];

const findStart = (grid: CellType[][]) => {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === Start) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
};

const createShowcaseLevel = ({
  name,
  grid,
  theme,
  solution,
  circuitLinks,
  objective,
  par,
  timeLimit,
}: {
  name: string;
  grid: CellType[][];
  theme: Level['theme'];
  solution: Move[];
  circuitLinks?: Level['circuitLinks'];
  objective?: Level['objective'];
  par?: number;
  timeLimit?: number;
}): Level => {
  const start = findStart(grid);
  const resolvedPar = par ?? Math.max(1, solution.length);

  return {
    name,
    grid,
    start,
    end: start,
    theme,
    solution,
    circuitLinks,
    objective,
    par: resolvedPar,
    timeLimit: timeLimit ?? Math.ceil(resolvedPar * 1.5) + 15,
  };
};

export const WORLD_SHOWCASE_LEVELS: Record<number, Level> = {
  6: createShowcaseLevel({
    name: 'Bonus Loop',
    theme: 'day',
    grid: [
      [Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, Empty, Boost, Wall],
      [Wall, Empty, Wall, Package, Wall],
      [Wall, Empty, Empty, Empty, Wall],
      [Wall, Wall, Wall, Wall, Wall],
    ],
    solution: [Move.Down, Move.Down, Move.Right, Move.Right, Move.Up, Move.Up, Move.Left, Move.Left],
  }),
  20: createShowcaseLevel({
    name: 'Factory Reset',
    theme: 'dusk',
    grid: [
      [Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, ForceField, Package, Wall],
      [Wall, Empty, Wall, Wall, Wall],
      [Wall, Package_Circuit, Wall, Wall, Wall],
      [Wall, Wall, Wall, Wall, Wall],
    ],
    circuitLinks: { '3,1': ['1,2'] },
    solution: [Move.Down, Move.Down, Move.Up, Move.Up, Move.Right, Move.Right, Move.Left, Move.Left],
  }),
  40: createShowcaseLevel({
    name: 'Dark Relay',
    theme: 'night',
    grid: [
      [Hole, Hole, Wall, Wall, Hole, Hole],
      [Hole, Start, Empty, Teleporter_A, Wall, Hole],
      [Wall, Wall, Hole, Wall, Wall, Wall],
      [Hole, Package, Empty, Teleporter_B, Empty, Hole],
      [Hole, Hole, Wall, Wall, Hole, Hole],
    ],
    solution: [Move.Right, Move.Right, Move.Left, Move.Left, Move.Right, Move.Right, Move.Left, Move.Left],
  }),
  60: createShowcaseLevel({
    name: 'False Shortcut',
    theme: 'desert',
    grid: [
      [Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, Empty, Trap, Wall],
      [Wall, Empty, Wall, Package, Wall],
      [Wall, Empty, Empty, Empty, Wall],
      [Wall, Wall, Wall, Wall, Wall],
    ],
    solution: [Move.Down, Move.Down, Move.Right, Move.Right, Move.Up, Move.Down, Move.Left, Move.Left, Move.Up, Move.Up],
  }),
  80: createShowcaseLevel({
    name: 'Thin Ice',
    theme: 'alpine',
    grid: [
      [Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, CrumblingFloor, Package, Wall],
      [Wall, Empty, Wall, Empty, Wall],
      [Wall, CrumblingFloor, Empty, Empty, Wall],
      [Wall, Wall, Wall, Wall, Wall],
    ],
    solution: [Move.Right, Move.Right, Move.Down, Move.Down, Move.Left, Move.Left, Move.Up, Move.Up],
  }),
  100: createShowcaseLevel({
    name: 'Double Prism',
    theme: 'crystal',
    grid: [
      [Hole, Wall, Wall, Wall, Wall, Hole],
      [Wall, Start, ForceField, ForceField_Blue, Package, Wall],
      [Hole, Empty, Hole, Wall, Empty, Hole],
      [Wall, Package_Circuit, Empty, Package_Blue, Empty, Wall],
      [Hole, Wall, Wall, Wall, Wall, Hole],
    ],
    circuitLinks: {
      '3,1': ['1,2'],
      '3,3': ['1,3'],
    },
    solution: [Move.Down, Move.Down, Move.Right, Move.Right, Move.Right, Move.Up, Move.Up, Move.Left, Move.Left, Move.Left],
  }),
  120: createShowcaseLevel({
    name: 'Golden Route',
    theme: 'sunset',
    grid: [
      [Wall, Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, Empty, Boost, Package, Wall],
      [Wall, Empty, Wall, Wall, Empty, Wall],
      [Wall, Boost, Empty, Package, Empty, Wall],
      [Wall, Wall, Wall, Wall, Wall, Wall],
    ],
    solution: [Move.Down, Move.Down, Move.Right, Move.Right, Move.Right, Move.Up, Move.Up, Move.Left, Move.Left, Move.Left],
    par: 8,
    timeLimit: 5,
    objective: { type: 'min_score', minScore: 110 },
  }),
  140: createShowcaseLevel({
    name: 'Stacked Odds',
    theme: 'cyber',
    grid: [
      [Wall, Wall, Wall, Wall, Wall, Wall],
      [Wall, Start, ForceField, Package, Empty, Wall],
      [Wall, Empty, Wall, Wall, Empty, Wall],
      [Wall, Package_Circuit, Boost, Package, Empty, Wall],
      [Wall, Wall, Wall, Wall, Wall, Wall],
    ],
    circuitLinks: { '3,1': ['1,2'] },
    solution: [Move.Down, Move.Down, Move.Right, Move.Right, Move.Right, Move.Up, Move.Up, Move.Left, Move.Left, Move.Left],
    par: 10,
    timeLimit: 5,
    objective: {
      type: 'combo',
      objectives: [
        { type: 'collect_ratio', ratio: 1 },
        { type: 'max_moves', maxMoves: 10 },
        { type: 'min_score', minScore: 120 },
      ],
    },
  }),
  160: createShowcaseLevel({
    name: 'Ash Run',
    theme: 'volcanic',
    grid: [
      [Hole, Wall, Wall, Wall, Wall, Wall, Hole],
      [Wall, Start, Empty, Bomb, Package, Empty, Wall],
      [Wall, Empty, Hole, Bomb, Hole, Empty, Wall],
      [Wall, Empty, Empty, Empty, Empty, Empty, Wall],
      [Hole, Wall, Wall, Wall, Wall, Wall, Hole],
    ],
    solution: [
      Move.Down,
      Move.Down,
      Move.Right,
      Move.Right,
      Move.Right,
      Move.Right,
      Move.Up,
      Move.Up,
      Move.Left,
      Move.Right,
      Move.Down,
      Move.Down,
      Move.Left,
      Move.Left,
      Move.Left,
      Move.Left,
      Move.Up,
      Move.Up,
    ],
  }),
  180: createShowcaseLevel({
    name: 'Crown Circuit',
    theme: 'galaxy',
    grid: [
      [Hole, Hole, Wall, Wall, Hole, Hole],
      [Wall, Start, ForceField, Package, Teleporter_A, Wall],
      [Wall, Empty, Hole, Wall, Hole, Hole],
      [Wall, Package_Circuit, Boost, CrumblingFloor, Teleporter_B, Wall],
      [Wall, Package, Hole, Trap, Hole, Hole],
      [Hole, Wall, Wall, Wall, Wall, Hole],
    ],
    circuitLinks: { '3,1': ['1,2'] },
    solution: [Move.Down, Move.Down, Move.Down, Move.Up, Move.Right, Move.Right, Move.Right, Move.Left, Move.Left, Move.Left],
    par: 10,
    timeLimit: 5,
    objective: {
      type: 'combo',
      objectives: [
        { type: 'collect_ratio', ratio: 1 },
        { type: 'max_moves', maxMoves: 10 },
        { type: 'min_score', minScore: 120 },
      ],
    },
  }),
};

export const getShowcaseLevelName = (levelIndex: number): string | undefined => {
  return WORLD_SHOWCASE_LEVELS[levelIndex]?.name;
};


export const LEVELS: Level[] = [];
