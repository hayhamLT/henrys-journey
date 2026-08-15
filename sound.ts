
import { Theme } from './types';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

// Effects Bus
let reverbNode: ConvolverNode | null = null;
let delayNode: DelayNode | null = null;
let delayFeedback: GainNode | null = null;

let isPlaying = false;
let currentTheme: Theme | null = null;

// Scheduling refs
let melodyTimeout: number | null = null;
let padTimeout: number | null = null;

// Settings
let musicVolume = 0;
let sfxVolume = 0.45;

// --- MUSICAL SCALES (Frequencies in Hz) ---
// We use simple harmonic ratios for a pure, math-based sound
const BASE_C4 = 261.63;

// Helper to get frequency from semitone offset
const note = (semitones: number, octave: number = 0) => BASE_C4 * Math.pow(2, (semitones / 12) + octave);

const SCALES = {
    // Monument Valley / Zen (Major Pentatonic + Lydian hints)
    // C, D, E, G, A, B
    day: [note(0), note(2), note(4), note(7), note(9), note(11), note(12), note(14)],
    
    // Mysterious / Night (Minor Pentatonic + 9th)
    // C, Eb, F, G, Bb, D
    night: [note(0), note(3), note(5), note(7), note(10), note(12), note(15)],
    
    // Warm / Sunset (Mixolydian feel)
    // C, E, F, G, A, Bb
    sunset: [note(0), note(4), note(5), note(7), note(9), note(10), note(12)],
    
    // Cold / Alpine (Dorian: Minor with sharp 6)
    // C, Eb, F, G, A, Bb
    alpine: [note(0), note(3), note(5), note(7), note(9), note(10), note(12)],
    
    // Exotic / Desert (Phrygian Dominant-ish)
    // C, Db, E, G, Ab
    desert: [note(0), note(1), note(4), note(7), note(8), note(12)],
    
    // Digital / Cyber (Whole Toneish / Chromatic bits)
    cyber: [note(0), note(2), note(4), note(6), note(8), note(10), note(12)]
};

const THEME_MAPPING: Record<string, number[]> = {
    day: SCALES.day, sunrise: SCALES.day, builder: SCALES.day, 'my-world': SCALES.day,
    night: SCALES.night, galaxy: SCALES.night, dusk: SCALES.night,
    sunset: SCALES.sunset, volcanic: SCALES.sunset,
    alpine: SCALES.alpine, crystal: SCALES.alpine,
    desert: SCALES.desert, arena: SCALES.desert,
    cyber: SCALES.cyber
};

// --- AUDIO INIT ---

// Create a simple impulse response for Reverb (Simulates a large hall)
const createReverbBuffer = (ctx: AudioContext, duration: number = 3.0, decay: number = 4.0) => {
    const rate = ctx.sampleRate;
    const len = rate * duration;
    const buffer = ctx.createBuffer(2, len, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    for (let i = 0; i < len; i++) {
        // Multiplier decays over time
        const mul = Math.pow(1 - i / len, decay);
        // White noise
        left[i] = (Math.random() * 2 - 1) * mul;
        right[i] = (Math.random() * 2 - 1) * mul;
    }
    return buffer;
};

export const initAudio = () => {
    if (audioContext) return;
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        
        masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
        
        // Music Bus
        musicGain = audioContext.createGain();
        musicGain.gain.value = musicVolume;
        musicGain.connect(masterGain);
        
        // SFX Bus
        sfxGain = audioContext.createGain();
        sfxGain.gain.value = sfxVolume;
        sfxGain.connect(masterGain);

        // --- EFFECTS BUS (The "Atmosphere") ---
        
        // 1. Reverb (Space)
        reverbNode = audioContext.createConvolver();
        reverbNode.buffer = createReverbBuffer(audioContext, 4.0, 3.0); // 4 second tail
        
        // Reverb Dry/Wet Mix (Simulated via connection graph)
        const reverbGain = audioContext.createGain();
        reverbGain.gain.value = 0.5; // 50% wet (Increased for distance)
        reverbNode.connect(reverbGain);
        reverbGain.connect(musicGain);

        // 2. Delay (Echo)
        delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 0.5; // 500ms delay
        
        delayFeedback = audioContext.createGain();
        delayFeedback.gain.value = 0.2; // 20% feedback (Subtle)
        
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        
        const delayOutput = audioContext.createGain();
        delayOutput.gain.value = 0.2;
        delayNode.connect(delayOutput);
        delayOutput.connect(musicGain); // Send delay to music bus
        delayOutput.connect(reverbNode); // Send delay to reverb for washing out

    } catch (e) {
        console.warn("Audio init failed", e);
    }
};

export const setMusicVolume = (vol: number) => {
    musicVolume = Math.max(0, Math.min(1, vol));
    if (musicGain && audioContext) {
        musicGain.gain.setTargetAtTime(musicVolume, audioContext.currentTime, 0.5);
    }
};

export const setSfxVolume = (vol: number) => {
    sfxVolume = Math.max(0, Math.min(1, vol));
    if (sfxGain && audioContext) {
        sfxGain.gain.setTargetAtTime(sfxVolume, audioContext.currentTime, 0.1);
    }
};

// --- INSTRUMENTS ---

// 1. The "Bell" (Melody) - Glassy sine wave with percussive attack
const playBell = (freq: number, pan: number) => {
    if (!audioContext || !musicGain || !delayNode || !reverbNode) return;
    const t = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    osc.type = 'sine'; // Pure tone
    osc.frequency.setValueAtTime(freq, t);

    // FM Synthesis for "Glass" timbre (Modulator)
    const mod = audioContext.createOscillator();
    const modGain = audioContext.createGain();
    mod.type = 'sine';
    // Reduced frequency ratio and gain for a softer, less metallic sound
    mod.frequency.value = freq * 2.0; 
    modGain.gain.setValueAtTime(freq * 0.1, t); // Subtle modulation
    modGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2); // Quick timbre decay
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    mod.start(t);
    mod.stop(t + 2);

    // Envelope - Softer attack and much lower peak volume
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05); // Slower attack (50ms), lower volume (0.12)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Very long smooth release

    panner.pan.value = pan;

    // Connections
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(musicGain); // Dry
    panner.connect(delayNode); // Wet (Delay)
    panner.connect(reverbNode); // Wet (Reverb)

    osc.start(t);
    osc.stop(t + 4.5);

    // Cleanup
    setTimeout(() => {
        osc.disconnect(); gain.disconnect(); panner.disconnect();
        mod.disconnect(); modGain.disconnect();
    }, 5000);
};

// 2. The "Pad" (Background) - Warm, slow triangle wave
const playPad = (freq: number, duration: number) => {
    if (!audioContext || !musicGain || !reverbNode) return;
    const t = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    // Subtle detune drift
    osc.detune.setValueAtTime(0, t);
    osc.detune.linearRampToValueAtTime(5, t + duration);

    // Lowpass filter to make it very warm/muffled (Background texture)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t); // Lower cutoff for darker tone
    filter.Q.value = 0.5;

    // Slow Swell Envelope - Very low volume
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + duration * 0.4); // Very quiet peak (0.06)
    gain.gain.linearRampToValueAtTime(0, t + duration); // Slow decay

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(reverbNode); // Pads go 100% to reverb for distance
    gain.connect(musicGain);  // And a bit to dry

    osc.start(t);
    osc.stop(t + duration + 1);

    setTimeout(() => {
        osc.disconnect(); filter.disconnect(); gain.disconnect();
    }, (duration + 1) * 1000);
};

// --- GENERATIVE LOGIC ---

const loopMelody = () => {
    if (!isPlaying || !audioContext) return;
    
    // 1. Pick next note
    const scale = currentTheme && THEME_MAPPING[currentTheme] ? THEME_MAPPING[currentTheme] : SCALES.day;
    // Weighted random: Prefer lower/mid notes for calm
    const idx = Math.floor(Math.pow(Math.random(), 1.5) * scale.length);
    let freq = scale[idx];
    
    // Rare octave shift
    if (Math.random() > 0.85) freq *= 2; 
    
    // 2. Play
    const pan = (Math.random() * 1.6) - 0.8; // Random stereo pan
    playBell(freq, pan);

    // 3. Schedule next - Sparser timing for "Subtle" feel
    // 4s to 9s gap between notes
    const nextTime = (4000 + Math.random() * 5000); 
    
    melodyTimeout = window.setTimeout(loopMelody, nextTime);
};

const loopPad = () => {
    if (!isPlaying || !audioContext) return;

    // 1. Pick root note (lower octave)
    const scale = currentTheme && THEME_MAPPING[currentTheme] ? THEME_MAPPING[currentTheme] : SCALES.day;
    const root = scale[0] / 2; // Octave down
    
    // 2. Play Chord (Root + 5th usually safe)
    playPad(root, 10);
    if (Math.random() > 0.6) playPad(root * 1.5, 10); // Add 5th

    // 3. Schedule next (Long gaps)
    const nextTime = (12000 + Math.random() * 6000);
    padTimeout = window.setTimeout(loopPad, nextTime);
};

export const startAmbientMusic = (theme: Theme) => {
    // Music is intentionally disabled per product direction.
    // Keep this function for compatibility with existing call sites.
    stopAmbientMusic();
    currentTheme = theme;
};

const stopAmbientMusic = () => {
    isPlaying = false;
    if (melodyTimeout) clearTimeout(melodyTimeout);
    if (padTimeout) clearTimeout(padTimeout);
    melodyTimeout = null;
    padTimeout = null;
};

// --- SFX (Clean, simple beeps) ---

const playSimpleTone = (freq: number, type: OscillatorType, dur: number, vol: number) => {
    if (!audioContext || !sfxGain) return;
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    const toneFilter = audioContext.createBiquadFilter();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = Math.min(2600, Math.max(700, freq * 2.4));
    toneFilter.Q.value = 0.6;
    
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    
    osc.connect(toneFilter);
    toneFilter.connect(g);
    g.connect(sfxGain);
    
    osc.start(t);
    osc.stop(t + dur + 0.1);
    setTimeout(() => { osc.disconnect(); toneFilter.disconnect(); g.disconnect(); }, (dur + 0.2) * 1000);
};

const playNoise = (dur: number, vol: number) => {
    if (!audioContext || !sfxGain) return;
    const buf = audioContext.createBuffer(1, audioContext.sampleRate * dur, audioContext.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
    
    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const g = audioContext.createGain();
    const f = audioContext.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 420;
    f.Q.value = 0.7;
    
    g.gain.setValueAtTime(vol * 0.8, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur);
    
    src.connect(f);
    f.connect(g);
    g.connect(sfxGain);
    src.start();
    setTimeout(() => { src.disconnect(); f.disconnect(); g.disconnect(); }, dur * 1000 + 100);
};

export const playSound = (type: string, combo: number = 0) => {
    if (!audioContext) initAudio();
    // CRITICAL: Force resume on user interaction to unlock audio engine if stalled
    if (audioContext?.state === 'suspended') {
        audioContext.resume().catch(e => console.warn("Failed to resume audio", e));
    }

    switch (type) {
        case 'move': playSimpleTone(280, 'sine', 0.08, 0.045); break;
        case 'addMove': playSimpleTone(420, 'triangle', 0.09, 0.05); break;
        case 'removeMove': playSimpleTone(220, 'triangle', 0.09, 0.045); break;
        case 'collect': {
            // Ascending pentatonic/major arpeggio per pickup in the chain (C5, E5, G5, C6, E6, G6, C7)
            const NOTES = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
            const baseFreq = NOTES[Math.min(Math.max(combo, 0), NOTES.length - 1)];
            playSimpleTone(baseFreq, 'sine', 0.18, 0.07);
            setTimeout(() => playSimpleTone(baseFreq * 1.25, 'triangle', 0.14, 0.04), 45);
            setTimeout(() => playSimpleTone(baseFreq * 1.5, 'sine', 0.22, 0.035), 90);
            break;
        }
        case 'unlock': 
            playSimpleTone(520, 'triangle', 0.18, 0.055); 
            setTimeout(() => playSimpleTone(780, 'sine', 0.22, 0.05), 90);
            break;
        case 'teleport':
            if (!audioContext) break; // Guard against null in timeout context
            const t = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const g = audioContext.createGain();
            const lp = audioContext.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 1700;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(190, t);
            osc.frequency.exponentialRampToValueAtTime(520, t + 0.28);
            g.gain.setValueAtTime(0.07, t);
            g.gain.linearRampToValueAtTime(0, t+0.3);
            osc.connect(lp); lp.connect(g); if(sfxGain) g.connect(sfxGain);
            osc.start(); osc.stop(t+0.35);
            setTimeout(() => { osc.disconnect(); lp.disconnect(); g.disconnect(); }, 500);
            break;
        case 'fail_wall':
            playNoise(0.1, 0.08);
            playSimpleTone(130, 'triangle', 0.18, 0.05);
            break;
        case 'fail_trap':
            // A sharp two-note "sting" so the (deceptive) trap death feels
            // distinct from a wall/hole — builds a mental model of the danger.
            playSimpleTone(330, 'square', 0.07, 0.05);
            setTimeout(() => playSimpleTone(160, 'square', 0.18, 0.06), 70);
            break;
        case 'coin_tick':
            // Short rising blip per breakdown line during the win count-up
            // (combo arg climbs the pitch) — the satisfying "cha-ching" tally.
            playSimpleTone(660 * Math.pow(2, (Math.min(Math.max(combo, 0), 6) * 2) / 12), 'sine', 0.07, 0.045);
            break;
        case 'fail_bomb': 
            playNoise(0.16, 0.1);
            playSimpleTone(110, 'triangle', 0.22, 0.055);
            break;
        case 'fail_hole': 
            if (!audioContext) break;
            const t2 = audioContext.currentTime;
            const osc2 = audioContext.createOscillator();
            const g2 = audioContext.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(250, t2);
            osc2.frequency.exponentialRampToValueAtTime(85, t2 + 0.45);
            g2.gain.setValueAtTime(0.075, t2);
            g2.gain.linearRampToValueAtTime(0, t2+0.5);
            osc2.connect(g2); if(sfxGain) g2.connect(sfxGain);
            osc2.start(); osc2.stop(t2+0.6);
            setTimeout(() => { osc2.disconnect(); g2.disconnect(); }, 700);
            break;
        case 'fail_incomplete':
            playSimpleTone(180, 'triangle', 0.14, 0.05);
            setTimeout(() => playSimpleTone(140, 'sine', 0.2, 0.05), 90);
            break;
        case 'success':
            playSimpleTone(523.25, 'sine', 0.15, 0.06);
            setTimeout(() => playSimpleTone(659.25, 'triangle', 0.15, 0.055), 90);
            setTimeout(() => playSimpleTone(783.99, 'sine', 0.24, 0.055), 170);
            break;
        case 'world_complete':
            [1, 1.25, 1.5, 2].forEach((r, i) => {
                setTimeout(() => playSimpleTone(261.63 * r, 'triangle', 0.34, 0.055), i * 130);
            });
            break;
        case 'perfect':
            // Rarer, louder fanfare for a flawless (Gold + no life lost) run:
            // a quick ascending arpeggio capped by a sparkling high octave.
            [1, 1.25, 1.5, 2, 2.5].forEach((r, i) => {
                setTimeout(() => playSimpleTone(523.25 * r, i < 4 ? 'triangle' : 'sine', 0.3, 0.06), i * 110);
            });
            setTimeout(() => playSimpleTone(2093, 'sine', 0.4, 0.05), 560);
            break;
        case 'crumble':
            playNoise(0.18, 0.08);
            playSimpleTone(150, 'triangle', 0.1, 0.04);
            break;
        default: playSimpleTone(360, 'sine', 0.08, 0.04);
    }
};
