
// Simple Mulberry32 seeded random number generator
let seed = 123456;

export const setSeed = (s: number) => {
    seed = s;
};

export const random = (): number => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
