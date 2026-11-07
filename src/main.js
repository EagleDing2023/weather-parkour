import { STEP } from './config.js';
import { createPlayer, stepPlayer } from './player.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';

const canvas = document.getElementById('game');
const render = createRenderer(canvas);
const readInput = createInput();

// Flat test platform plus a few floating ones to try jumps and edges.
const platforms = [
  { x: 0, y: 500, w: 900, h: 40 },
  { x: 300, y: 400, w: 140, h: 16 },
  { x: 520, y: 320, w: 140, h: 16 },
];
const player = createPlayer(60, 400);

// Fixed timestep: physics always advances in 1/60 s slices, so behaviour
// doesn't depend on the monitor's frame rate.
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min((now - last) / 1000, 0.1); // clamp after tab switches
  last = now;
  while (acc >= STEP) {
    stepPlayer(player, readInput(), platforms, STEP);
    acc -= STEP;
  }
  render({ platforms, player });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
