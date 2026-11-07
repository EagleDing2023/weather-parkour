// One attempt at a Course: player, platforms, Respawn and the run timer.
// No drawing here (see renderer.js).
import { createPlayer, stepPlayer } from './player.js';
import { TREASURE_SIZE, PHYSICS } from './config.js';

const FALL_MARGIN = 300; // px below the lowest platform before we call it a fall

// physics: the Condition's config from effects.js (defaults to the Clear baseline).
export function createRun({ platforms, start, treasure, physics = PHYSICS }) {
  const lowest = Math.max(...platforms.map((p) => p.y + p.h));
  const run = {
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
      stepPlayer(run.player, input, platforms, dt, physics);
      if (run.player.y > run.killY) run.respawn();
    },
  };
  return run;
}
