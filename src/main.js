import { STEP } from './config.js';
import { createRun } from './run.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';

const canvas = document.getElementById('game');
const render = createRenderer(canvas);
const readInput = createInput();

// Flat test platform plus a few floating ones to try jumps and edges.
const run = createRun({
  platforms: [
    { x: 0, y: 500, w: 900, h: 40 },
    { x: 300, y: 400, w: 140, h: 16 },
    { x: 520, y: 320, w: 140, h: 16 },
  ],
  start: { x: 60, y: 400 },
});
// Test course ends at x=900, so walking off the right edge triggers a Respawn.

// Fixed timestep: physics always advances in 1/60 s slices, so behaviour
// doesn't depend on the monitor's frame rate.
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min((now - last) / 1000, 0.1); // clamp after tab switches
  last = now;
  while (acc >= STEP) {
    run.update(readInput(), STEP);
    acc -= STEP;
  }
  render(run);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
