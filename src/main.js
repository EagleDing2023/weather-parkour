import { STEP, RICKROLL_URL } from './config.js';
import { generateCourse } from './course.js';
import { getPhysics, EFFECTS } from './effects.js';
import { createRun } from './run.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';

const canvas = document.getElementById('game');
const results = document.getElementById('results');
const resultTime = document.getElementById('result-time');
const render = createRenderer(canvas);
const readInput = createInput();

// Temporary playtest switch until the menu exists (issue 08): ?condition=rain
const asked = new URLSearchParams(location.search).get('condition');
const condition = Object.hasOwn(EFFECTS, asked) ? asked : 'clear';

let run;
function newCourse() {
  const seed = Math.floor(Math.random() * 2 ** 32); // fresh seed per Course
  run = createRun({ ...generateCourse(seed), physics: getPhysics(condition) });
  results.hidden = true;
}
newCourse();

// Must run inside the key/click handler itself: browsers only allow
// window.open from a direct user action.
function tryOpenTreasure() {
  if (!run.openTreasure()) return;
  window.open(RICKROLL_URL, '_blank', 'noopener');
  resultTime.textContent = run.elapsed.toFixed(2) + 's';
  results.hidden = false;
}
addEventListener('keydown', (e) => {
  if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) tryOpenTreasure();
});
canvas.addEventListener('click', tryOpenTreasure);

document.getElementById('new-course').addEventListener('click', newCourse);
// Placeholder until the menu exists (issue 08): reload returns to a fresh start.
document.getElementById('menu').addEventListener('click', () => location.reload());

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
