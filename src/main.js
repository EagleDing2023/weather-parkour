import { STEP, RICKROLL_URL } from './config.js';
import { generateCourse } from './course.js';
import { getPhysics } from './effects.js';
import { createRun } from './run.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';
import { createMenu } from './menu.js';
import { createBestTimes } from './besttimes.js';
import { label } from './presets.js';

const canvas = document.getElementById('game');
const results = document.getElementById('results');
const resultTime = document.getElementById('result-time');
const resultBest = document.getElementById('result-best');
const menuBtn = document.getElementById('menu-btn');
const bestTimes = createBestTimes();
const render = createRenderer(canvas);
const readInput = createInput();

let playing = false;                         // false while the menu is open
let setting = { condition: 'clear', isDay: true }; // the Condition for the current run

function newCourse() {
  const seed = Math.floor(Math.random() * 2 ** 32); // fresh seed per Course
  run = createRun({
    ...generateCourse(seed),
    physics: getPhysics(setting.condition),
    condition: setting.condition,
    isDay: setting.isDay,
  });
  results.hidden = true;
}

const menu = createMenu({
  getBest: (c) => bestTimes.get(c),
  onStart(chosen) {
    setting = chosen;
    newCourse();
    menu.hide();
    menuBtn.hidden = false;
    playing = true;
  },
});

let run;
newCourse(); // a Clear backdrop behind the menu
menu.show();

// Must run inside the key/click handler itself: browsers only allow
// window.open from a direct user action.
function tryOpenTreasure() {
  if (!playing || !run.openTreasure()) return;
  window.open(RICKROLL_URL, '_blank', 'noopener');
  resultTime.textContent = run.elapsed.toFixed(2) + 's';
  // Best times are per Condition; Presets and city runs both count.
  const r = bestTimes.record(run.condition, run.elapsed);
  const name = label(run.condition);
  resultBest.textContent = r.isBest ? `New best for ${name}!`
    : r.best !== null ? `Best for ${name}: ${r.best.toFixed(2)}s` : '';
  results.hidden = false;
}
addEventListener('keydown', (e) => {
  if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) tryOpenTreasure();
});
canvas.addEventListener('click', tryOpenTreasure);

document.getElementById('new-course').addEventListener('click', newCourse); // same Condition
// Leave the current run and return to the menu (the run's timer is discarded).
function goToMenu() {
  playing = false;
  results.hidden = true;
  menuBtn.hidden = true;
  menu.show();
}
document.getElementById('menu').addEventListener('click', goToMenu);
menuBtn.addEventListener('click', goToMenu);
// Don't let the button take keyboard focus, or pressing Space (jump) would click it.
menuBtn.addEventListener('mousedown', (e) => e.preventDefault());
addEventListener('keydown', (e) => { if (e.code === 'Escape' && playing) goToMenu(); });

// Fixed timestep: physics always advances in 1/60 s slices, so behaviour
// doesn't depend on the monitor's frame rate.
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min((now - last) / 1000, 0.1); // clamp after tab switches
  last = now;
  while (acc >= STEP) {
    if (playing) run.update(readInput(), STEP);
    acc -= STEP;
  }
  render(run);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
