// One attempt at a Course: player, platforms, Respawn and the run timer.
// No drawing here (see renderer.js).
import { createPlayer, stepPlayer } from './player.js';

const FALL_MARGIN = 300; // px below the lowest platform before we call it a fall

export function createRun({ platforms, start }) {
  const lowest = Math.max(...platforms.map((p) => p.y + p.h));
  const run = {
    platforms,
    start,
    player: createPlayer(start.x, start.y),
    killY: lowest + FALL_MARGIN,
    elapsed: 0,     // seconds; keeps counting across Respawns
    started: false, // becomes true at the first player input
    stopped: false, // set by stopTimer() (the Treasure, issue 04)

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
      stepPlayer(run.player, input, platforms, dt);
      if (run.player.y > run.killY) run.respawn();
    },
  };
  return run;
}
