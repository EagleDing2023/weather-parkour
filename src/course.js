// Pure Course generator: seed in, layout out. No drawing, no browser APIs.
import { PHYSICS, PLAYER_SIZE, WORST_CASE } from './config.js';
import { createRng, randRange } from './rng.js';

export const PLATFORM_COUNT = 10; // halved twice (40 -> 20 -> 10) after playtesting: still felt too long
const THICKNESS = 24;
const MIN_W = 120, MAX_W = 220;
const MIN_GAP = 60;
const SAFETY = 0.7;       // use only 70% of the theoretical reach
const DROP_FACTOR = 1.5;  // dropping down is easier than climbing up
const MIN_NET = 60;       // px the Course must rise or fall overall (about one big step)

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

  // Draw everything random up front: widths, then one step (height change + gap) per join.
  const widths = [];
  const steps = [];
  for (let i = 0; i < PLATFORM_COUNT; i++) {
    widths.push(i === PLATFORM_COUNT - 1 ? MAX_W : randRange(rng, MIN_W, MAX_W));
    if (i === PLATFORM_COUNT - 1) break;
    // Mostly step in the overall direction, occasionally the other way.
    const along = rng() < 0.85;
    steps.push({
      along,
      mag: along ? randRange(rng, 0.2, 1) : randRange(rng, 0, 0.5),
      gapFrac: rng(),
    });
  }
  const riseOf = (st) => {
    const sign = st.along ? dir : -dir;
    return sign > 0 ? st.mag * maxRise : -st.mag * maxDrop;
  };

  // With few platforms, against-the-trend steps could cancel the real ones. If the
  // Course would not clearly rise or descend, turn those steps to follow the trend.
  const netToward = () => steps.reduce((sum, st) => sum + riseOf(st), 0) * dir;
  for (const st of steps) {
    if (netToward() >= MIN_NET) break;
    if (!st.along) { st.along = true; st.mag = Math.max(st.mag, 0.2); }
  }

  const platforms = [];
  let x = 0, y = 500;
  for (let i = 0; i < PLATFORM_COUNT; i++) {
    const w = widths[i];
    platforms.push({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: THICKNESS });
    if (i === PLATFORM_COUNT - 1) break;
    const rise = riseOf(steps[i]);
    const maxGap = Math.max(MIN_GAP, maxGapFor(rise));
    x += w + MIN_GAP + steps[i].gapFrac * (maxGap - MIN_GAP);
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
