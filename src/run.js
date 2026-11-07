// One attempt at a Course: player, platforms, Respawn and the run timer.
// No drawing here (see renderer.js).
import { createPlayer, stepPlayer } from './player.js';
import { TREASURE_SIZE, PHYSICS } from './config.js';
import { createStorm } from './storm.js';

const FALL_MARGIN = 300; // px below the lowest platform before we call it a fall

// physics: the Condition's config from effects.js (defaults to the Clear baseline).
// seed: drives gust and Lightning Strike placement (the Course's own seed).
// condition, isDay: descriptive only, for the renderer. They never affect physics.
export function createRun({ platforms, start, treasure, seed = 0, physics = PHYSICS, condition = 'clear', isDay = true }) {
  const lowest = Math.max(...platforms.map((p) => p.y + p.h));
  const storm = createStorm(seed, physics, platforms);
  const run = {
    physics, // the Condition's config; the renderer reads maxSpeed for the camera
    condition,
    isDay,
    storm,
    platforms,
    start,
    player: createPlayer(start.x, start.y),
    killY: lowest + FALL_MARGIN,
    elapsed: 0,     // seconds; keeps counting across Respawns
    started: false, // becomes true at the first player input
    stopped: false, // set by stopTimer() (the Treasure, issue 04)
    opened: false,  // true once the Treasure has been opened
    // The chest sits on top of the last platform, centred on treasure.x.
    treasureBox: {
      x: treasure.x - TREASURE_SIZE.w / 2, y: treasure.y - TREASURE_SIZE.h,
      w: TREASURE_SIZE.w, h: TREASURE_SIZE.h,
    },

    touchingTreasure() {
      const p = run.player, t = run.treasureBox;
      return p.x < t.x + t.w && p.x + p.w > t.x && p.y < t.y + t.h && p.y + p.h > t.y;
    },

    // Returns true only the first time it succeeds. The caller opens the link
    // in the same input handler, so the browser's pop-up blocker allows it.
    openTreasure() {
      if (run.opened || !run.touchingTreasure()) return false;
      run.opened = true;
      run.stopTimer();
      return true;
    },

    // Put the player back at the start. Deliberately leaves the timer alone.
    respawn() {
      run.player = createPlayer(start.x, start.y);
    },

    stopTimer() {
      run.stopped = true;
    },

    update(input, dt) {
      if (!run.started && (input.left || input.right || input.jump || input.crouch)) {
        run.started = true;
      }
      if (run.started && !run.stopped) run.elapsed += dt;
      // The storm only runs while the timer runs: waiting at the start is safe.
      const active = run.started && !run.stopped;
      const struck = active && storm.update(dt, run.player);
      stepPlayer(run.player, input, platforms, dt, physics, active ? storm.force : undefined);
      if (struck || run.player.y > run.killY) run.respawn();
    },
  };
  return run;
}
