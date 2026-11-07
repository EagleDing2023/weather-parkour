// Pure Course generator: seed in, layout out. No drawing, no browser APIs.
import { PHYSICS, PLAYER_SIZE, WORST_CASE } from './config.js';
import { createRng, randRange } from './rng.js';

export const PLATFORM_COUNT = 40;
const THICKNESS = 24;
const MIN_W = 120, MAX_W = 220;
const MIN_GAP = 60;
const SAFETY = 0.7;       // use only 70% of the theoretical reach
const DROP_FACTOR = 1.5;  // dropping down is easier than climbing up

// Worst-case jump the Course must allow, read from the physics config.
function limits() {
  const v = PHYSICS.jumpSpeed * WORST_CASE.jumpScale;
  const g = PHYSICS.gravity;
  const vx = PHYSICS.maxSpeed * WORST_CASE.speedScale;
  const maxRise = (v * v) / (2 * g) * SAFETY;
  return { v, g, vx, maxRise, maxDrop: maxRise * DROP_FACTOR };
}

// Largest horizontal gap crossable when the next platform is `rise` px higher
// (negative = lower). Air time = time until the jump arc descends to that height.
export function maxGapFor(rise) {
  const { v, g, vx } = limits();
  const t = (v + Math.sqrt(Math.max(0, v * v - 2 * g * rise))) / g;
  return vx * t * SAFETY;
}

export function generateCourse(seed) {
  const rng = createRng(seed);
  const { maxRise, maxDrop } = limits();
  const dir = rng() < 0.5 ? 1 : -1; // 1 = rises overall, -1 = descends
  const platforms = [];
  let x = 0, y = 500;

  for (let i = 0; i < PLATFORM_COUNT; i++) {
    const w = i === PLATFORM_COUNT - 1 ? MAX_W : randRange(rng, MIN_W, MAX_W);
    platforms.push({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: THICKNESS });
    if (i === PLATFORM_COUNT - 1) break;

    // Mostly step in the overall direction, occasionally the other way.
    const with_ = rng() < 0.85;
    const sign = with_ ? dir : -dir;
    const mag = with_ ? randRange(rng, 0.2, 1) : randRange(rng, 0, 0.5);
    const rise = sign > 0 ? mag * maxRise : -mag * maxDrop;
    const gap = randRange(rng, MIN_GAP, Math.max(MIN_GAP, maxGapFor(rise)));
    x += w + gap;
    y -= rise;
  }

  const first = platforms[0], last = platforms[platforms.length - 1];
  return {
    seed,
    direction: dir,
    platforms,
    start: { x: first.x + 20, y: first.y - PLAYER_SIZE.h },
    treasure: { x: last.x + last.w / 2, y: last.y }, // sits on top of the last platform
  };
}
