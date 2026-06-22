
import * as THREE from 'three';

const textureCache: Record<string, THREE.CanvasTexture> = {};
const CACHE_VERSION = 'v31-cracks';

type TileVariant = 'base' | 'cracked-1' | 'cracked-2' | 'cracked-3' | 'cracked-4' | 'cracked-5' | 'worn' | 'tech' | 'platform' | 'fragile-1' | 'fragile-2' | 'fragile-3';
type WallVariant = 'base' | 'cracked-1' | 'cracked-2' | 'cracked-3' | 'cracked-4' | 'cracked-5';

// OPTIMIZATION: Reduced from 512. 
// 256px is sufficient for noise-based voxel textures and reduces memory usage by 4x.
const CANVAS_SIZE = 256; 

function seededRandom(seed: number) {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getContext(): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
}

function applyNoise(ctx: CanvasRenderingContext2D, intensity: number = 30) {
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * intensity;
        data[i] = Math.min(255, Math.max(0, data[i] + grain));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + grain));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + grain));
    }
    ctx.putImageData(imageData, 0, 0);
}

function drawBevel(ctx: CanvasRenderingContext2D, inset: number = 20) {
    // Scale inset based on new canvas size (approx ratio adjustment)
    const scaledInset = inset * (CANVAS_SIZE / 512);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; 
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE);
    ctx.lineTo(0, 0);
    ctx.lineTo(CANVAS_SIZE, 0);
    ctx.lineTo(CANVAS_SIZE - scaledInset, scaledInset);
    ctx.lineTo(scaledInset, scaledInset);
    ctx.lineTo(scaledInset, CANVAS_SIZE - scaledInset);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineTo(CANVAS_SIZE, 0);
    ctx.lineTo(CANVAS_SIZE - scaledInset, scaledInset);
    ctx.lineTo(CANVAS_SIZE - scaledInset, CANVAS_SIZE - scaledInset);
    ctx.lineTo(scaledInset, CANVAS_SIZE - scaledInset);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(scaledInset, scaledInset, CANVAS_SIZE - scaledInset*2, CANVAS_SIZE - scaledInset*2);
}

function drawAO(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createRadialGradient(
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.6,
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 1.05
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.02)');
    grad.addColorStop(1, 'rgba(0,0,0,0.2)'); 
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawSurfaceDetail(ctx: CanvasRenderingContext2D, seed: number, intensity: number = 0.15, color: string = 'rgba(40, 20, 10, 0.15)') {
    const numScratches = 30 + Math.floor(seededRandom(seed) * 20);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < numScratches; i++) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.0 + seededRandom(seed + i) * 1.5;
        
        let x = seededRandom(seed + i * 17) * CANVAS_SIZE;
        let y = seededRandom(seed + i * 23) * CANVAS_SIZE;
        const length = 15 + seededRandom(seed + i * 29) * 50;
        let angle = seededRandom(seed + i * 31) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        const segments = 2 + Math.floor(seededRandom(seed + i) * 3);
        const segLen = length / segments;
        for(let j=0; j<segments; j++) {
            x += Math.cos(angle) * segLen;
            y += Math.sin(angle) * segLen;
            angle += (seededRandom(seed + i * 100 + j) - 0.5) * 0.5; 
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

function drawHairPattern(ctx: CanvasRenderingContext2D, seed: number) {
    const numStrands = 15; 
    ctx.lineCap = 'round';
    
    for (let i = 0; i < numStrands; i++) {
        const isHighlight = seededRandom(seed + i * 11) > 0.5;
        ctx.strokeStyle = isHighlight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 6 + seededRandom(seed + i * 22) * 6; // Scaled down for 256px
        const x = seededRandom(seed + i * 33) * CANVAS_SIZE;
        const yStart = seededRandom(seed + i * 44) * CANVAS_SIZE;
        const length = 25 + seededRandom(seed + i * 55) * 50; // Scaled down
        ctx.beginPath();
        ctx.moveTo(x, yStart);
        const cpX = x + (seededRandom(seed + i * 66) - 0.5) * 20;
        const endX = x + (seededRandom(seed + i * 77) - 0.5) * 40;
        ctx.quadraticCurveTo(cpX, yStart + length / 2, endX, yStart + length);
        ctx.stroke();
    }
}

function drawClothPattern(ctx: CanvasRenderingContext2D) {
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.95) {
            const grain = (Math.random() - 0.5) * 8;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + grain));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + grain));
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function drawGrunge(ctx: CanvasRenderingContext2D, seed: number) {
    for (let i = 0; i < 5; i++) {
        const x = seededRandom(seed + i) * CANVAS_SIZE;
        const y = seededRandom(seed + i * 2) * CANVAS_SIZE;
        const r = 10 + seededRandom(seed + i * 3) * 30; // Scaled down
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Build a jagged "vein" of points wandering from a start point/angle.
function buildVein(seed: number, sx: number, sy: number, angle0: number, segs: number, segLen: number): { x: number, y: number }[] {
    let x = sx, y = sy, angle = angle0;
    const pts = [{ x, y }];
    for (let i = 0; i < segs; i++) {
        const len = segLen * (0.7 + seededRandom(seed + i * 7) * 0.7);
        angle += (seededRandom(seed + i * 13) - 0.5) * 1.35;
        x = Math.max(8, Math.min(CANVAS_SIZE - 8, x + Math.cos(angle) * len));
        y = Math.max(8, Math.min(CANVAS_SIZE - 8, y + Math.sin(angle) * len));
        pts.push({ x, y });
    }
    return pts;
}

// Render a vein as a CARVED crack: a soft light lip catching the key light on the
// upper-left edge, a dark body, and a crisp dark core for definition. Tapers to
// hairline ends so it reads as a natural fracture, not a drawn line.
function renderVein(ctx: CanvasRenderingContext2D, pts: { x: number, y: number }[], widthScale: number, coreAlpha: number) {
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        const taper = Math.sin((i / (n - 1)) * Math.PI);
        const w = (1.0 + taper * 2.4) * widthScale;
        // light lip offset DOWN-RIGHT — matches the chips + drawBevel (key light is
        // upper-left), so the crack reads as a carved groove, not a raised ridge.
        ctx.beginPath(); ctx.moveTo(p1.x + 0.6, p1.y + 0.6); ctx.lineTo(p2.x + 0.6, p2.y + 0.6);
        ctx.strokeStyle = `rgba(255,255,255,${0.16 * taper})`; ctx.lineWidth = w + 2.2; ctx.stroke();
        // soft dark body
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(26,16,11,${(0.30 + taper * 0.32) * coreAlpha})`; ctx.lineWidth = w + 0.8; ctx.stroke();
        // crisp dark core
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(9,6,4,${(0.40 + taper * 0.30) * coreAlpha})`; ctx.lineWidth = Math.max(0.55, w * 0.42); ctx.stroke();
    }
}

function drawCracks(ctx: CanvasRenderingContext2D, seed: number) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const numCracks = 2 + Math.floor(seededRandom(seed) * 2); // 2-3 main fractures
    for (let k = 0; k < numCracks; k++) {
        const sx = 30 + seededRandom(seed + k * 999) * (CANVAS_SIZE - 60);
        const sy = 30 + seededRandom(seed + k * 888) * (CANVAS_SIZE - 60);
        const angle0 = seededRandom(seed + k * 777) * Math.PI * 2;
        const segs = 7 + Math.floor(seededRandom(seed + k * 41) * 5);
        const main = buildVein(seed + k * 100, sx, sy, angle0, segs, 16);
        renderVein(ctx, main, 1, 1);
        // a finer branch forking off a midpoint of the main crack
        if (seededRandom(seed + k * 53) > 0.4 && main.length > 5) {
            const bi = 2 + Math.floor(seededRandom(seed + k * 61) * (main.length - 4));
            const bp = main[bi];
            const branch = buildVein(seed + k * 311, bp.x, bp.y, seededRandom(seed + k * 71) * Math.PI * 2, 3 + Math.floor(seededRandom(seed + k * 67) * 3), 12);
            renderVein(ctx, branch, 0.6, 0.85);
        }
    }

    // a scatter of tiny chips/pits so the stone reads as weathered, not just lined
    const chips = 5 + Math.floor(seededRandom(seed + 7) * 5);
    for (let i = 0; i < chips; i++) {
        const cx = seededRandom(seed + i * 41 + 3) * CANVAS_SIZE;
        const cy = seededRandom(seed + i * 47 + 9) * CANVAS_SIZE;
        const r = 1.4 + seededRandom(seed + i * 51) * 2.4;
        ctx.beginPath(); ctx.arc(cx + 0.6, cy + 0.6, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18,11,8,0.20)'; ctx.fill();
    }
}

function drawHeavyCracks(ctx: CanvasRenderingContext2D, seed: number) {
    const numCracks = 3 + Math.floor(seededRandom(seed) * 3); 
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let k = 0; k < numCracks; k++) {
        let x = 50 + seededRandom(seed + k * 999) * (CANVAS_SIZE - 100);
        let y = 50 + seededRandom(seed + k * 888) * (CANVAS_SIZE - 100);
        const points: {x: number, y: number}[] = [{x, y}];
        const segments = 4 + Math.floor(seededRandom(seed + k) * 3);
        let angle = seededRandom(seed + k * 777) * Math.PI * 2;
        for (let i = 0; i < segments; i++) {
            let rLen = seededRandom(seed + k * 100 + i);
            let rAng = seededRandom(seed + k * 200 + i);
            const len = 35 + rLen * 50; // Scaled down
            angle += (rAng - 0.5) * 1.2; 
            x += Math.cos(angle) * len;
            y += Math.sin(angle) * len;
            x = Math.max(5, Math.min(CANVAS_SIZE - 5, x));
            y = Math.max(5, Math.min(CANVAS_SIZE - 5, y));
            points.push({x, y});
        }
        const totalPoints = points.length;
        for (let i = 0; i < totalPoints - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const progress = i / (totalPoints - 1);
            const taper = Math.sin(progress * Math.PI); 
            const baseWidth = 3 + taper * 6; // Scaled down
            ctx.beginPath();
            ctx.moveTo(p1.x + 1, p1.y + 1);
            ctx.lineTo(p2.x + 1, p2.y + 1);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * taper})`; 
            ctx.lineWidth = baseWidth + 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(30, 10, 5, ${0.7 + taper * 0.3})`; 
            ctx.lineWidth = baseWidth;
            ctx.stroke();
        }
    }
}

function drawTechPattern(ctx: CanvasRenderingContext2D, color: string) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4; // Scaled
    ctx.lineCap = 'square';
    ctx.beginPath();
    const margin = 30; // Scaled
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, CANVAS_SIZE - margin);
    ctx.lineTo(CANVAS_SIZE - margin, CANVAS_SIZE - margin);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE - margin, margin);
    ctx.lineTo(CANVAS_SIZE - margin * 2, margin);
    ctx.lineTo(CANVAS_SIZE - margin * 2, margin * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(margin, margin, 8, 0, Math.PI * 2); // Scaled
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE - margin, CANVAS_SIZE - margin, 8, 0, Math.PI * 2); // Scaled
    ctx.fill();
}

function drawGemFacets(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Internal "frost" grain
    applyNoise(ctx, 120);

    const grad = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Frosted Glass Scratches
    drawSurfaceDetail(ctx, 111, 0.5, 'rgba(255, 255, 255, 0.6)'); 
    drawSurfaceDetail(ctx, 222, 0.3, 'rgba(0, 0, 0, 0.2)'); 

    // Structure definition (facets)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 7; // Scaled
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE * 0.5, 0);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.5);
    ctx.lineTo(CANVAS_SIZE * 0.5, CANVAS_SIZE);
    ctx.lineTo(0, CANVAS_SIZE * 0.5);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE, 0); ctx.lineTo(0, CANVAS_SIZE);
    ctx.stroke();

    // Additional frosty edge detail
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4; // Scaled
    ctx.strokeRect(15, 15, CANVAS_SIZE - 30, CANVAS_SIZE - 30);
}

function drawPortalPad(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 40);
    drawBevel(ctx, 20); // Bevel adjusts automatically
    drawSurfaceDetail(ctx, 999); 
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const ringGrad = ctx.createRadialGradient(cx, cy, CANVAS_SIZE * 0.25, cx, cy, CANVAS_SIZE * 0.48);
    ringGrad.addColorStop(0, 'rgba(0,0,0,0)');
    ringGrad.addColorStop(0.85, color); 
    ringGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, CANVAS_SIZE * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, CANVAS_SIZE * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}


function drawDirtyEdges(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Add "dirt" noise
    applyNoise(ctx, 60);
    
    // Darken edges significantly
    const grad = ctx.createRadialGradient(
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.3,
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.55
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)'); // Grime in the corners/edges
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Add some random "dust" splotches
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * CANVAS_SIZE;
        const y = Math.random() * CANVAS_SIZE;
        const r = 5 + Math.random() * 20; // Scaled
        const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
        radial.addColorStop(0, 'rgba(40, 25, 10, 0.2)');
        radial.addColorStop(1, 'rgba(40, 25, 10, 0)');
        ctx.fillStyle = radial;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
}

// --- Per-theme TILE-STYLE cap textures + dirt column ------------------------
// Each world's top "cap" gets a distinct, tactile surface (grass blades, sand
// ripples, snow sparkle, basalt lava-cracks, crystal facets) over a shared
// pebbly dirt column, so worlds read as genuinely different places. Cached by
// color+style (NOT per tile), so this only adds a handful of canvases.
export type TileStyle = 'grass' | 'sand' | 'snow' | 'basalt' | 'crystal';

const buildCap = (key: string, build: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    build(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
};

export const getGrassTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`grass-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 16);
    for (let i = 0; i < 46; i++) {
        const x = seededRandom(i * 7 + 1) * CANVAS_SIZE;
        const y = CANVAS_SIZE - seededRandom(i * 7 + 2) * CANVAS_SIZE * 0.55;
        const h = 10 + seededRandom(i * 7 + 3) * 22;
        const lean = (seededRandom(i * 7 + 4) - 0.5) * 10;
        ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.5, y - h * 0.6, x + lean, y - h); ctx.stroke();
    }
    drawAO(ctx); drawBevel(ctx, 14);
});

export const getDirtTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`dirt-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 30);
    for (let b = 0; b < 4; b++) { ctx.fillStyle = b % 2 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(0, (b + 0.5) * CANVAS_SIZE / 4, CANVAS_SIZE, 6); }
    for (let i = 0; i < 16; i++) {
        const x = seededRandom(i * 5 + 1) * CANVAS_SIZE, y = seededRandom(i * 5 + 2) * CANVAS_SIZE, r = 3 + seededRandom(i * 5 + 3) * 5;
        ctx.fillStyle = seededRandom(i * 5 + 4) > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    drawAO(ctx);
});

export const getSandTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`sand-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 12);
    for (let i = 0; i < 10; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'; ctx.lineWidth = 3;
        const y = i * CANVAS_SIZE / 10 + seededRandom(i) * 6;
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= CANVAS_SIZE; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
        ctx.stroke();
    }
    drawAO(ctx);
});

export const getSnowTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`snow-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 8);
    for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(seededRandom(i * 3 + 1) * CANVAS_SIZE, seededRandom(i * 3 + 2) * CANVAS_SIZE, 2, 2); }
    drawAO(ctx); drawBevel(ctx, 12);
});

export const getBasaltTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`basalt-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = 'rgba(255,150,40,0.85)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
        let x = seededRandom(i * 9 + 1) * CANVAS_SIZE, y = seededRandom(i * 9 + 2) * CANVAS_SIZE;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) { x += (seededRandom(i * 9 + s + 3) - 0.5) * 60; y += (seededRandom(i * 9 + s + 14) - 0.5) * 60; ctx.lineTo(x, y); }
        ctx.stroke();
    }
    drawAO(ctx);
});

export const getFacetTexture = (colorHex: string): THREE.CanvasTexture => buildCap(`facet-${colorHex}-${CACHE_VERSION}`, (ctx) => {
    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 14);
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        const x = i * CANVAS_SIZE / 8;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + CANVAS_SIZE / 8, 0); ctx.lineTo(x, CANVAS_SIZE); ctx.closePath(); ctx.fill();
    }
    drawAO(ctx); drawBevel(ctx, 10);
});

export const getCapTexture = (style: TileStyle, colorHex: string): THREE.CanvasTexture => {
    switch (style) {
        case 'sand': return getSandTexture(colorHex);
        case 'snow': return getSnowTexture(colorHex);
        case 'basalt': return getBasaltTexture(colorHex);
        case 'crystal': return getFacetTexture(colorHex);
        default: return getGrassTexture(colorHex);
    }
};

// A "don't-buy" price-tag face: a red "$" inside a red no/ban ring on a cream
// card. Maps onto the impulse-buy obstacle so it reads as "skip this purchase",
// NOT as something to collect ("$$$" alone reads like the gold coin reward to a kid).
export const getTagTexture = (): THREE.CanvasTexture => {
    const key = `pricetag-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    const C = CANVAS_SIZE, cx = C / 2, cy = C / 2;
    ctx.fillStyle = '#f4ecd6';
    ctx.fillRect(0, 0, C, C);
    // cream card border
    ctx.strokeStyle = '#cbb489';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, C - 24, C - 24);
    // red "$" in the centre
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 132px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 6);
    // red no/ban ring + slash over it ("don't spend on this")
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 84, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 59, cy - 59); ctx.lineTo(cx + 59, cy + 59); ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
};

export const getTileTexture = (variant: TileVariant, colorHex: string): THREE.CanvasTexture => {
    const key = `tile-${variant}-${colorHex}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 40);
    drawSurfaceDetail(ctx, parseInt(colorHex.slice(1), 16) + (variant.length * 99));
    if (variant === 'cracked-1') drawCracks(ctx, 12345);
    else if (variant === 'cracked-2') drawCracks(ctx, 67890);
    else if (variant === 'cracked-3') drawCracks(ctx, 13579);
    else if (variant === 'cracked-4') drawCracks(ctx, 24680);
    else if (variant === 'cracked-5') drawCracks(ctx, 98765);
    else if (variant === 'fragile-1') drawHeavyCracks(ctx, 54321);
    else if (variant === 'fragile-2') drawHeavyCracks(ctx, 99887);
    else if (variant === 'fragile-3') drawHeavyCracks(ctx, 11223);
    if (variant === 'worn') {
        drawSurfaceDetail(ctx, 555);
    }
    if (variant === 'tech') {
        drawTechPattern(ctx, colorHex);
    }
    drawAO(ctx); 
    drawBevel(ctx, 10); 
    const grad = ctx.createRadialGradient(CANVAS_SIZE/2, CANVAS_SIZE/2, 0, CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE * 0.7);
    grad.addColorStop(0, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
};

export const getWallTexture = (colorHex: string, variant: WallVariant = 'base'): THREE.CanvasTexture => {
    const key = `wall-${colorHex}-${variant}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 50);
    drawSurfaceDetail(ctx, parseInt(colorHex.slice(1), 16) + 777);
    if (variant === 'cracked-1') drawCracks(ctx, 11111);
    else if (variant === 'cracked-2') drawCracks(ctx, 22222);
    else if (variant === 'cracked-3') drawCracks(ctx, 33333);
    else if (variant === 'cracked-4') drawCracks(ctx, 44444);
    else if (variant === 'cracked-5') drawCracks(ctx, 55555);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, 10, CANVAS_SIZE); // Scaled
    ctx.fillRect(CANVAS_SIZE - 10, 0, 10, CANVAS_SIZE); // Scaled
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getMatteTexture = (colorHex: string): THREE.CanvasTexture => {
    const key = `matte-${colorHex}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 35); 
    drawSurfaceDetail(ctx, parseInt(colorHex.slice(1), 16) * 123);
    const grad = ctx.createLinearGradient(0,0, CANVAS_SIZE, CANVAS_SIZE);
    grad.addColorStop(0, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawAO(ctx);
    drawBevel(ctx, 6);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getCrystalTexture = (colorHex: string): THREE.CanvasTexture => {
    const key = `crystal-dirty-${colorHex}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    drawDirtyEdges(ctx, colorHex);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getHairTexture = (color: string): THREE.CanvasTexture => {
    const key = `hair-${color}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 10);
    drawHairPattern(ctx, parseInt(color.slice(1), 16));
    drawAO(ctx);
    drawBevel(ctx, 5); 
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getClothTexture = (color: string): THREE.CanvasTexture => {
    const key = `cloth-${color}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 35);
    drawClothPattern(ctx);
    drawGrunge(ctx, parseInt(color.slice(1), 16)); 
    drawAO(ctx);
    drawBevel(ctx, 4);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getSkinTexture = (color: string): THREE.CanvasTexture => {
    const key = `skin-${color}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 15); 
    drawAO(ctx);
    drawBevel(ctx, 6); 
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

export const getPortalTexture = (color: string): THREE.CanvasTexture => {
    const key = `portal-${color}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    drawPortalPad(ctx, color);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}


export const getBombTexture = (color: string): THREE.CanvasTexture => {
    const key = `bomb-${color}-${CACHE_VERSION}`;
    if (textureCache[key]) return textureCache[key];
    const { canvas, ctx } = getContext();
    const grad = ctx.createRadialGradient(CANVAS_SIZE/2, CANVAS_SIZE/2, 0, CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#111111');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    applyNoise(ctx, 80); 
    for(let i=0; i<15; i++) {
        const x = Math.random() * CANVAS_SIZE;
        const y = Math.random() * CANVAS_SIZE;
        const r = 15 + Math.random() * 40; // Scaled
        const alpha = 0.1 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
    drawSurfaceDetail(ctx, 666);
    drawBevel(ctx, 3); 
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[key] = tex;
    return tex;
}

