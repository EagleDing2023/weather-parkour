// Thunderstorm logic: random gust forces and Lightning Strikes.
// Uses the seeded RNG so a seed reproduces a run. No drawing here.
import { createRng, randRange } from './rng.js';

export function createStorm(seed, cfg, platforms) {
  // Separate stream from the Course layout so the layout is unaffected.
  const rng = createRng((seed ^ 0x9e3779b9) >>> 0);
  const nextStrikeIn = () => randRange(rng, cfg.strikeIntervalMin, cfg.strikeIntervalMax);

  const storm = {
    force: { x: 0, y: 0 }, // current gust, px/s^2
    strikes: [],           // pending: { x, y, radius, timeLeft, telegraph }
    justLanded: false,     // a strike landed this step (for the thunder sound)
    flash: 0,              // seconds the bolt stays visible after a strike lands
    flashDuration: cfg.strikeFlash, // so the renderer can fade the flash
    lastStrike: null,      // { x, y } of the most recent strike (for drawing the bolt)
    gustTimer: 0,
    strikeTimer: nextStrikeIn(),

    // Advance by dt. Returns true if a strike landed on the player this step.
    update(dt, player) {
      storm.flash = Math.max(0, storm.flash - dt);
      storm.justLanded = false;

      if (cfg.gustStrength > 0) {
        storm.gustTimer -= dt;
        if (storm.gustTimer <= 0) {
          const angle = rng() * Math.PI * 2; // any direction: forward, back, up, down
          const mag = randRange(rng, 0.3, 1) * cfg.gustStrength;
          storm.force = { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag };
          storm.gustTimer = randRange(rng, cfg.gustIntervalMin, cfg.gustIntervalMax);
        }
      }
      if (!cfg.strikeEnabled) return false;

      storm.strikeTimer -= dt;
      if (storm.strikeTimer <= 0) {
        storm.strikeTimer = nextStrikeIn();
        spawnStrike(player);
      }

      let hit = false;
      for (const s of storm.strikes) s.timeLeft -= dt;
      for (const s of storm.strikes) {
        if (s.timeLeft > 0) continue;
        storm.flash = cfg.strikeFlash;
        storm.justLanded = true;
        storm.lastStrike = { x: s.x, y: s.y };
        if (inCircle(s, player)) hit = true;
      }
      storm.strikes = storm.strikes.filter((s) => s.timeLeft > 0);
      return hit;
    },
  };

  // The circle appears on a platform near the player, at a random spot on it.
  function spawnStrike(player) {
    const px = player.x + player.w / 2;
    const near = platforms.filter((pl) => px >= pl.x - cfg.strikeRange && px <= pl.x + pl.w + cfg.strikeRange);
    if (near.length === 0) return;
    const pl = near[Math.floor(rng() * near.length)];
    const r = cfg.strikeRadius;
    const lo = pl.x + Math.min(r, pl.w / 2), hi = pl.x + pl.w - Math.min(r, pl.w / 2);
    storm.strikes.push({
      x: randRange(rng, lo, hi), y: pl.y, radius: r,
      timeLeft: cfg.strikeTelegraph, telegraph: cfg.strikeTelegraph,
    });
  }

  return storm;
}

// "Standing in the circle": feet near the platform top and horizontally inside.
// A player who jumped clear above the circle is not hit.
function inCircle(s, p) {
  const feet = p.y + p.h;
  const cx = p.x + p.w / 2;
  return Math.abs(cx - s.x) <= s.radius && feet >= s.y - 6 && feet <= s.y + 2;
}
