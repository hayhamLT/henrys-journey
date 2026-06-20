import { World } from '../types';

export const APP_VERSION = 'v1.0.108'; // Matches SW Cache Version

// Single source of truth for campaign pacing. Change this and the worlds,
// generator difficulty curve, and all UI counts follow automatically.
export const LEVELS_PER_WORLD = 10;

// Definitions for each world. Level index ranges are derived from
// LEVELS_PER_WORLD so we never hand-maintain offsets again.
const WORLD_DEFS: Omit<World, 'levels'>[] = [
  {
    name: 'The Meadow',
    theme: 'day',
    mapPosition: { x: 8, y: 50 },
    size: 48,
    gimmickTitle: 'Boost Pads',
    gimmickDescription: 'Deliver packages to earn coins, and grab boost pads for bonus pay.',
    introBanner: 'New gimmick: grab boosts on side paths for free score.',
    moneyConcept: {
      emoji: '💼',
      title: 'Earning Money',
      lesson: "Money starts with work. Every package you deliver earns you coins.",
      mission: 'Deliver every package to earn your coins — grab boost pads for extra pay!',
    },
  },
  {
    name: 'The Factory',
    theme: 'dusk',
    mapPosition: { x: 22, y: 22 },
    size: 48,
    gimmickTitle: 'Forcefield Gates',
    gimmickDescription: 'Grab the key you NEED to open the gate before reaching the rewards.',
    introBanner: 'New gimmick: keys unlock forcefield gates blocking the route.',
    moneyConcept: {
      emoji: '🔑',
      title: 'Needs Before Wants',
      lesson: 'The things you must have come first. Get the key you NEED, then reach the extras.',
      mission: 'Grab the key you need first — it unlocks the gate to your reward.',
    },
  },
  {
    name: 'The Abyss',
    theme: 'night',
    mapPosition: { x: 30, y: 68 },
    size: 48,
    gimmickTitle: 'Teleport Relays',
    gimmickDescription: 'Two routes, one is shorter — compare them and pick the better deal.',
    introBanner: 'New gimmick: teleport relays can skip distance or strand sloppy routes.',
    moneyConcept: {
      emoji: '🔀',
      title: 'Compare Your Choices',
      lesson: "There's usually more than one way. Smart shoppers compare and pick the best deal.",
      mission: 'Teleporters are shortcuts. Compare your routes and pick the one that saves steps.',
    },
  },
  {
    name: 'Sandstorm Dunes',
    theme: 'desert',
    mapPosition: { x: 44, y: 32 },
    size: 48,
    gimmickTitle: 'Trap Tiles',
    gimmickDescription: 'Some shiny tiles are traps — look before you leap or lose it all.',
    introBanner: 'New gimmick: trap tiles look inviting, but one step ends the run.',
    moneyConcept: {
      emoji: '⚠️',
      title: 'Spot the Money Trap',
      lesson: 'If a deal looks too good to be true, it might be a trap. Slow down and check first.',
      mission: 'Watch out — some tiles are traps! Look before you move; one wrong step ends it.',
    },
  },
  {
    name: 'Snowy Peak',
    theme: 'alpine',
    mapPosition: { x: 50, y: 75 },
    size: 48,
    gimmickTitle: 'Crumbling Routes',
    gimmickDescription: 'The floor falls away behind you — make every step count, waste nothing.',
    introBanner: 'New gimmick: crumbling floors punish wasteful loops and bad sequencing.',
    moneyConcept: {
      emoji: '❄️',
      title: "Don't Waste It",
      lesson: 'Money you spend is gone — like a path that crumbles behind you. Make each step count.',
      mission: 'The floor falls away behind you. Plan a tight route — no wasted moves!',
    },
  },
  {
    name: 'Crystal Caves',
    theme: 'crystal',
    mapPosition: { x: 63, y: 30 },
    size: 56,
    gimmickTitle: 'Layered Locks',
    gimmickDescription: 'Big prizes need several keys — gather each one to reach the goal.',
    introBanner: 'New gimmick: layered locks chain several key colors into one puzzle.',
    moneyConcept: {
      emoji: '🏆',
      title: 'Saving for Big Goals',
      lesson: 'Big goals take more than one step. Collect each key in turn to unlock something bigger.',
      mission: 'Several locks guard the prize. Gather every key to reach the big goal.',
    },
  },
  {
    name: 'Sunset Shores',
    theme: 'sunset',
    mapPosition: { x: 70, y: 70 },
    size: 56,
    gimmickTitle: 'Score Targets',
    gimmickDescription: 'Aim for a savings goal — earn enough coins, not just finish.',
    introBanner: 'New gimmick: score targets turn side pickups into part of the solution.',
    moneyConcept: {
      emoji: '🎯',
      title: 'Reach Your Goal',
      lesson: "A savings goal is a number you aim for. Earn enough — don't stop a coin short!",
      mission: 'Hit the score goal! Grab bonus pickups to reach your savings target.',
    },
  },
  {
    name: 'Lost Temple',
    theme: 'cyber',
    mapPosition: { x: 82, y: 35 },
    size: 56,
    gimmickTitle: 'Combo Missions',
    gimmickDescription: 'Earn enough, stay efficient, and leave nothing behind — all at once.',
    introBanner: 'New gimmick: combo missions demand clean execution on every objective.',
    moneyConcept: {
      emoji: '⚖️',
      title: 'Balancing Your Money',
      lesson: 'Real skill is doing it all at once: earn enough, stay efficient, and miss nothing.',
      mission: 'Juggle every goal at once — collect all, hit the score, stay under your move budget.',
    },
  },
  {
    name: 'Volcanic Isles',
    theme: 'volcanic',
    mapPosition: { x: 88, y: 72 },
    size: 56,
    gimmickTitle: 'Bomb Gauntlets',
    gimmickDescription: 'Danger everywhere — keep a safe route instead of risking it all.',
    introBanner: 'New gimmick: bomb gauntlets shrink the safe route to a knife edge.',
    moneyConcept: {
      emoji: '🛡️',
      title: 'Managing Risk',
      lesson: 'Risky paths can cost you everything. Keep a safe route — like saving for emergencies.',
      mission: "Danger everywhere! Pick the safe path and don't risk it all on one lane.",
    },
  },
  {
    name: 'Sky Kingdom',
    theme: 'galaxy',
    mapPosition: { x: 95, y: 28 },
    size: 64,
    gimmickTitle: 'Mastery Mix',
    gimmickDescription: 'Every money skill at once — plan ahead and make the final climb.',
    introBanner: 'Final gimmick: every system is live, so route mastery matters more than ever.',
    moneyConcept: {
      emoji: '👑',
      title: 'Money Mastery',
      lesson: "You've learned to earn, save, compare, budget, and manage risk. Put it all together!",
      mission: 'Every skill at once — plan ahead and make the final climb like a money master!',
    },
  }
];

export const WORLDS: World[] = WORLD_DEFS.map((def, worldIdx) => ({
  ...def,
  levels: Array.from({ length: LEVELS_PER_WORLD }, (_, i) => worldIdx * LEVELS_PER_WORLD + i),
}));

// Total campaign length, derived. Used to scale grid size etc.
export const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD;

// Which world a given (campaign) level index belongs to.
export const getWorldIndexByLevel = (levelIndex: number): number =>
  Math.floor(levelIndex / LEVELS_PER_WORLD);

export const getWorldByLevelIndex = (levelIndex: number): World | null => {
  if (levelIndex < 0) return null;
  return WORLDS.find(world => world.levels.includes(levelIndex)) || null;
};

export const POINTS = {
  gem_value: 20,
  level_clear_base: 50,
  par_met_bonus: 20,
  per_move_saved_bonus: 10,
  per_second_saved_bonus: 2,
};

// Kid-friendly campaign tuning.
// After this many fails on the SAME level (one visit), stop charging lives so a
// stuck child isn't sent back to the world start and ragequits.
export const MERCY_FAILS = 4;
// Coins per consecutive first-try clean clear (escalating, capped) — rewards
// careful planning, mirroring the daily-interest streak's compounding feel.
export const CLEAN_STREAK_BONUS = 5;
export const CLEAN_STREAK_CAP = 5;

export const MY_WORLD_SAVE_KEY = 'henrys_journey_my_world_v1';

export const RECOMMENDED_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // --- Users Collection (Profiles, Badges, Stats) ---
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);

      match /friends/{friendId} {
         allow read, write: if isAuthenticated() && (request.auth.uid == userId || request.auth.uid == friendId);
      }

      match /levels/{levelId} {
         allow read, write: if isOwner(userId);
      }
    }

    // --- Invites (Challenges & Friend Requests) ---
    match /invites/{inviteId} {
      allow create: if isAuthenticated();
      allow read, update, delete: if isAuthenticated() && (resource.data.toUid == request.auth.uid || resource.data.fromUid == request.auth.uid);
    }

    // --- Community Levels (Shared) ---
    match /levels/{levelId} {
      allow read: if true; 
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && resource.data.authorUid == request.auth.uid; 
    }

    // --- Online Co-op Sessions ---
    match /active_games/{gameId} {
      allow read, write: if isAuthenticated();
      
      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }

    // --- Random Matchmaking ---
    match /matchmaking/{userId} {
      allow read, write: if isAuthenticated();
    }
    
    match /match_found/{userId} {
      allow read, write: if isAuthenticated();
    }

    // --- Tournaments (Leaderboards) ---
    match /tournaments/{tournamentId} {
      allow read: if true; 
      
      match /scores/{userId} {
        allow read: if true;
        allow write: if isOwner(userId);
      }
    }
  }
}`;