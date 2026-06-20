
const ADJECTIVES = [
    "Cosmic", "Lunar", "Solar", "Neon", "Cyber", "Ancient", "Lost", "Hidden", 
    "Forbidden", "Crystal", "Iron", "Golden", "Dark", "Silent", "Echoing", 
    "Floating", "Broken", "Eternal", "Frozen", "Burning", "Secret", "Mystic",
    "Hollow", "Jagged", "Prismatic", "Spectral", "Infinite", "Omega", "Alpha"
];

const NOUNS = [
    "Ruins", "Station", "Outpost", "Void", "Temple", "Sanctuary", "Path", 
    "Gate", "Nexus", "Core", "Spire", "Citadel", "Bunker", "Lab", "Maze", 
    "Sector", "Zone", "Field", "Expanse", "Horizon", "Depth", "Peak",
    "Construct", "Fragment", "Echo", "Dream", "Nightmare", "Signal", "Spark"
];

export const generateLevelName = (): string => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 99) + 1;
    
    // 30% chance to have a number suffix for sci-fi feel
    if (Math.random() > 0.7) {
        return `${adj} ${noun} ${num}`;
    }
    return `${adj} ${noun}`;
};
