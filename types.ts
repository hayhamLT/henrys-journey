
import React from 'react';
import * as THREE from 'three';

// Augment the global JSX namespace for Three.js elements to resolve R3F errors.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      instancedMesh: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      boxGeometry: any;
      icosahedronGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      cylinderGeometry: any;
      dodecahedronGeometry: any;
      octahedronGeometry: any;
      torusGeometry: any;
      planeGeometry: any;
      circleGeometry: any;
      primitive: any;
      [elemName: string]: any;
    }
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        group: any;
        mesh: any;
        instancedMesh: any;
        ambientLight: any;
        directionalLight: any;
        pointLight: any;
        spotLight: any;
        hemisphereLight: any;
        boxGeometry: any;
        icosahedronGeometry: any;
        meshStandardMaterial: any;
        meshBasicMaterial: any;
        cylinderGeometry: any;
        dodecahedronGeometry: any;
        octahedronGeometry: any;
        torusGeometry: any;
        planeGeometry: any;
        circleGeometry: any;
        primitive: any;
        [elemName: string]: any;
      }
    }
  }
}

export enum CellType {
  Empty = 0,
  Wall = 1,
  Start = 2,
  End = 3,
  Package = 4, // Green
  Bomb = 5,
  Hole = 6,
  Wall_H_Left = 7, // Horizontal building, left part
  Wall_H_Right = 8, // Horizontal building, right part
  Wall_V_Top = 9,   // Vertical building, top part
  Wall_V_Bottom = 10, // Vertical building, bottom part
  OutOfBounds = 11,
  Package_Blue = 12,
  Package_Purple = 13,
  Teleporter_A = 14,
  Teleporter_B = 15,
  Teleporter_C = 16,
  Teleporter_D = 17,
  Teleporter_E = 18,
  Teleporter_F = 19,
  ForceField = 20, // This will be treated as the "Yellow" force field
  Package_Circuit = 21,
  CrumblingFloor = 22,
  ForceField_Blue = 23,
  ForceField_Purple = 24,
  
  // New Keys & Locks
  Package_Red = 29,
  ForceField_Red = 30,
  Package_Orange = 31,
  ForceField_Orange = 32,
  Package_Cyan = 33,
  ForceField_Cyan = 34,
  PhaseShifter = 35,
  Package_AutoSolver = 36,
  Trap = 37, // Hazard: triggers failure if stepped on
  Boost = 38, // Power-up: grants extra move or score
  WantTile = 39, // Impulse-buy "want": non-lethal, walkable; stepping it DRAINS the run wallet (W1 "needs before wants")
  Package_Savings = 40, // W5 "savings gem": a required collectible worth MORE the later you grab it (let it grow)
  Inflating_Coin = 41,  // W6 "fresh coin": a required collectible worth a high FRESH value before turn T, then a low STALE value (beat inflation)
  Toll_Gate = 42,       // W7 "toll": a priced gate — crossing deducts its price from the run wallet (allocate a budget)
  Shock = 43,           // W8 "surprise bill": drains the reserve when crossed; lethal only if the reserve can't cover it
  Liquid_Cash = 44,     // W8 "liquid cash": a required collectible that refills the reserve (your emergency fund)
}

export enum Move {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

export interface MoveEffect {
  type: 'collect' | 'teleport' | 'collision' | 'unlock';
  itemType?: CellType;
}

export interface MoveWithId {
  move: Move;
  id: number;
  isPhased?: boolean;
  owner?: 'host' | 'guest'; // Track who added the move
  effect?: MoveEffect;
}

export enum GameStatus {
  Planning = 'Planning',
  Executing = 'Executing',
  Success = 'Success',
  Failure = 'Failure',
}

export interface Position {
  row: number;
  col: number;
}

export type Theme = 'day' | 'sunset' | 'night' | 'sunrise' | 'alpine' | 'desert' | 'dusk' | 'crystal' | 'cyber' | 'volcanic' | 'galaxy' | 'my-world' | 'builder' | 'arena';

export type TutorialTrigger = 'start' | 'add_move' | 'collect_package' | 'run_sequence' | 'wrong_move';

export interface TutorialStep {
  text: string;
  trigger: TutorialTrigger;
  highlightedMove?: Move;
  highlightedButton?: 'run' | 'undo';
}

export interface Level {
  name?: string;
  grid: CellType[][];
  start: Position;
  end: Position;
  theme?: Theme;
  par?: number;
  timeLimit?: number;
  objective?: {
    type: 'collect_ratio';
    ratio: number;
  } | {
    type: 'max_moves';
    maxMoves: number;
  } | {
    type: 'min_score';
    minScore: number;
  } | {
    type: 'combo';
    objectives: Array<
      { type: 'collect_ratio'; ratio: number } |
      { type: 'max_moves'; maxMoves: number } |
      { type: 'min_score'; minScore: number }
    >;
  };
  circuitLinks?: { [gemPosition: string]: string[] };
  // --- Run wallet (W1 "Spend-to-pass") ---
  // A per-level wallet, distinct from the persistent meta wallet. Stepping a
  // WantTile drains it by wantCost; to WIN you must reach home with at least
  // exitPrice left. Calibrated so taking the want bankrupts the exit.
  startWallet?: number;
  wantCost?: number;
  exitPrice?: number;
  // W4 "Don't waste it": when true the run wallet ALSO drains 1 per step (a
  // draining purse), so wandering — not just wants — empties it. Win = wallet
  // still >= exitPrice (the floor) at home.
  drainPerStep?: boolean;
  // --- Savings gem (W5 "Let it grow") ---
  // A Package_Savings tile is worth base + growPerStep * (step collected), capped.
  // Grabbing it at/after ripeStep counts as fully "ripe" (the Gold-medal target).
  // Present-and-derived: grow levels suppress the speed bonus and use the ripe
  // check for Gold instead of underPar/timeBonus (see medals.ts).
  growPerStep?: number;
  ripeStep?: number;
  // W6 "Beat inflation": an Inflating_Coin is worth its high FRESH value if grabbed
  // on/before step inflateAt, else a low STALE value. The savings-goal (a min_score
  // objective) is set just below what a fresh-grab run scores, so letting coins go
  // stale drops you under the goal.
  inflateAt?: number;
  // W7 "Allocate a budget": Toll_Gate cells deduct a posted price from the run
  // wallet when crossed (keyed by "r,c"). The wallet can't fund every toll, so the
  // player must choose which gated bonuses to buy. Required gems stay toll-free.
  tollPrices?: { [posKey: string]: number };
  // --- Disguised deals (W3 "Spot the money trap") ---
  // posKeys ("r,c") of tiles that LOOK like gold coins until inspected. Their TRUE
  // nature is the underlying grid cell (Empty = safe sealed deal, Trap = scam,
  // Package = a real coin). inspectBudget = how many tiles the player may inspect.
  // The disguise + inspect + plan-commit guard live in the planning layer; the
  // simulation/solver use the true cell types and are untouched.
  disguised?: string[];
  inspectBudget?: number;
  solution?: Move[];
  tutorial?: TutorialStep[];
}

export interface LevelDataForShare {
  grid: CellType[][];
  theme: Theme;
  par?: number;
  timeLimit?: number;
  objective?: {
    type: 'collect_ratio';
    ratio: number;
  } | {
    type: 'max_moves';
    maxMoves: number;
  } | {
    type: 'min_score';
    minScore: number;
  } | {
    type: 'combo';
    objectives: Array<
      { type: 'collect_ratio'; ratio: number } |
      { type: 'max_moves'; maxMoves: number } |
      { type: 'min_score'; minScore: number }
    >;
  };
  circuitLinks?: { [gemPosition: string]: string[] };
  // Run-wallet config (W1) — carried through share/community/daily levels.
  startWallet?: number;
  wantCost?: number;
  exitPrice?: number;
  drainPerStep?: boolean; // W4 draining purse
  growPerStep?: number;   // W5 savings gem
  ripeStep?: number;      // W5 savings gem
  inflateAt?: number;     // W6 inflating coins
  tollPrices?: { [posKey: string]: number }; // W7 toll gates
  // Disguised-deal config (W3).
  disguised?: string[];
  inspectBudget?: number;
}

export interface World {
  name: string;
  theme: Theme;
  levels: number[];
  mapPosition: { x: number; y: number };
  size: number;
  gimmickTitle?: string;
  gimmickDescription?: string;
  introBanner?: string;
  isCustom?: boolean;
  // The financial-literacy idea this world teaches. Each world introduces ONE
  // new puzzle mechanic AND one new money concept, so the campaign reads as a
  // money curriculum: earning → needs/wants → comparing → traps → not wasting →
  // saving → goals → budgeting → risk → mastery.
  moneyConcept?: {
    emoji: string;
    title: string;   // short concept name, e.g. "Earning Money"
    lesson: string;  // 1-2 kid-friendly sentences tying the mechanic to money
    mission: string; // one-line framing shown on the first level of the world
  };
}

export type FailureType = 'hole' | 'wall' | 'bomb' | 'trap' | 'incomplete' | 'missed_gem' | 'out_of_moves' | 'low_score' | 'broke' | null;

export interface CollectedPackage {
  position: Position;
  type: CellType;
  score: number;
  collector?: 'p1' | 'p2';
  timestamp: number;
  comboIndex?: number; // 1-based combo length at pickup (shows an "xN" multiplier)
}

// Particle System Types
export interface ParticleConfig {
  count: number;
  colors: string[];
  minDistance?: number;
  maxDistance?: number;
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  maxDuration?: number;
  shape?: 'circle' | 'spark' | 'confetti';
}

export type ParticleType = 'bomb' | 'wall_hit' | 'teleport' | 'gem_collect' | 'crumble';

export interface ParticleEffect {
  id: number;
  position: Position;
  type: ParticleType;
  config: ParticleConfig;
}

export interface LevelResult {
  time: number;
  moves: number;
  gems: string;
  greeting?: string;
  scoreBreakdown: {
    gemScore: number;
    moveBonus: number;
    timeBonus: number;
    completionBonus: number;
    total: number;
  };
  // Mastery signals derived purely from the run (no effect on success/fail or
  // the difficulty solver). allGems = collected every collectible; underPar =
  // finished within par; medal = 0..3 (none/bronze/silver/gold). Optional so
  // legacy saved results without them still render.
  allGems?: boolean;
  allBoosts?: boolean;
  underPar?: boolean;
  medal?: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  attractModeEnabled: boolean;
}

export interface GameState {
  levelIndex: number;
  totalScore: number;
  totalTime: number;

  resultsByLevel: { [level: number]: LevelResult };
  autoSolvers: number;
  phaseCharges: number;
}

export interface ThoughtBubble {
  id: number;
  text: string;
  duration: number;
  isExiting?: boolean;
  type?: 'neutral' | 'happy' | 'alert';
}

export type EyeState = 'default' | 'win' | 'angry' | 'scared' | 'destroyed' | 'confused' | 'sleeping' | 'love';

export type HatId = 'none' | 'cone' | 'tophat' | 'crown' | 'banana' | 'propeller' | 'viking' | 'chef' | 'cowboy' | 'wizard' | 'headphones' | 'cap' | 'hardhat' | 'glasses' | 'beanie' | 'sombrero';

export interface Hat {
  id: HatId;
  name: string;
  price: number;
  model: React.FC<any>;
}

export interface HatState {
  unlocked: HatId[];
  equipped: HatId;
}

export interface CharacterAppearance {
  model: 'henry' | 'mila';
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  eyeColor: string;
}

export interface MilaState {
  visible: boolean;
  position: Position;
  message: string;
  messageId: number;
  duration: number;
  direction: Move;
  animationState?: 'in' | 'out' | 'idle';
}

export interface TournamentPlayer {
  id?: string; // Optional for backward compat, but needed for identifying real players
  name: string;
  score: number;
  photoURL?: string;
  rank?: number;
  timestamp?: number;
}

export interface OnlineChallengeData {
  len: number; // tournamentLength
  res: TournamentPlayer[]; // results
}

export interface TournamentState {
  players: TournamentPlayer[];
  currentPlayerIndex: number;
  tournamentLength: number;
  challenge?: {
    name: string;
    score: number;
  };
}

export interface DailyProgress {
    date: string;
    lives: number;
    currentLevel: number;
    isCompleted: boolean;
    streak?: number;            // consecutive days completed
    lastCompletedDate?: string; // date string of the most recent completed daily
}

// Challenge Mode Types
export interface ChallengeState {
    active: boolean;
    mode: 'standard' | 'daily'; // Added to distinguish daily challenges
    seed: number;
    currentLevelIndex: number; // 0 to length-1
    totalLevels: number;
    totalScore: number;
    challenger?: {
        name: string;
        score: number;
    };
}

export interface LiveTournament {
    id: string;
    name: string;
    type: 'Bullet' | 'Blitz' | 'Rapid' | 'Marathon' | 'Daily' | 'Hourly';
    startTime: number; // timestamp
    endTime?: number; 
    length: number; // levels (or -1 for infinite/time based)
    seed: number;
    targetScore?: number;
    playerCount: number; // Simulated count
    difficulty: 'easy' | 'mixed' | 'hard';
}

export interface ActiveTournamentSession {
    id: string;
    name: string;
    endTime: number;
    seed: number;
    currentLevel: number;
    currentScore: number;
    difficulty: 'easy' | 'mixed' | 'hard';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: 'star' | 'trophy' | 'speed' | 'check' | 'flame' | 'crown';
  timestamp: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  uid?: string; // Added optional UID for local state convenience
  badges?: Badge[];
}

export interface GameInvite {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
  date?: string; // Human readable date string
  // Tournament Fields
  seed?: number;
  length?: number;
  scoreToBeat?: number; 
  // Custom Level Fields
  customLevelId?: string;
  levelName?: string;
  // Coop Fields
  type?: 'challenge' | 'level' | 'coop' | 'friend_request'; 
}

export interface CommunityLevel {
    id: string;
    name: string;
    authorName: string;
    authorUid: string;
    data: LevelDataForShare;
    plays: number;
    likes: number;
    timestamp: number;
}

export interface Friend {
    uid: string;
    displayName: string;
    photoURL: string;
    lastLogin?: number;
}

export interface CustomLevelEntry {
  id: string;
  name: string;
  data: LevelDataForShare;
  timestamp: number;
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
    photoURL?: string;
    rank: number;
}

// --- ONLINE CO-OP TYPES ---
export interface CoopGameState {
    id: string;
    hostUid: string;
    hostName: string;
    guestUid: string | null;
    guestName: string | null;
    levelIndex: number;
    seed: number;
    status: 'waiting' | 'active' | 'aborted';
    
    // Independent Sequences
    hostSequence: MoveWithId[];
    guestSequence: MoveWithId[];
    
    // Independent Statuses
    hostStatus: 'planning' | 'executing' | 'finished';
    guestStatus: 'planning' | 'executing' | 'finished';

    timestamp: number;
    completedPlayers: string[]; // Track who has finished the current level
}

export interface CoopMessage {
    id: string;
    senderUid: string;
    senderName: string;
    text: string;
    isEmoji: boolean;
    timestamp: number;
}

export type BotCelebrationState = 'level' | 'world' | null;
export type BotVisualState = 'default' | 'teleport-out' | 'teleport-in' | 'spawn';
export interface TransientStatus { text: string; color: 'blue' | 'yellow' | 'red'; action?: () => void; }
export type GameMode = 'single' | 'coop_local' | 'coop_online';
export type AppState = 'main_menu' | 'play' | 'build' | 'tutorial' | 'challenge_setup' | 'challenge_lobby' | 'challenge_play' | 'challenge_complete' | 'coop_lobby' | 'coop_play' | 'tournament_play' | 'tournament_summary' | 'daily_hub' | 'shop' | 'settings' | 'social' | 'help' | 'about' | 'admin';
