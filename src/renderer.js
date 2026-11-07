// All drawing lives here. Game logic only describes what exists.
// Rain, snow, clouds, stars and dust are visual-only state kept in this module;
// they use Math.random because they never affect gameplay.
import { createRng } from './rng.js';

// Colours and looks per Condition, for day and night.
//   hills: [far, near] ridge colours. celestial: how visible the sun/moon is (0-1).
//   puff: "r,g,b" of the dust or splash kicked up when landing.
export const THEMES = {
  clear: {
    day: { sky: ['#5fb4ee', '#bfe5f9'], cloud: '#ffffff' },
    night: { sky: ['#070d22', '#1b2a58'], cloud: '#3a4672' },
    platform: {
      day: { top: '#5a9a45', body: '#3b5b3a', blade: '#74b653' },
      night: { top: '#3c6a32', body: '#2a4029', blade: '#4a8a3a' },
      grass: true,
    },
    hills: { day: ['#86b9d6', '#6fae83'], night: ['#162450', '#0f1a3a'] },
    celestial: 1, puff: '176,152,110',
    clouds: 5, cloudAlpha: 0.9, stars: 1, particles: null,
  },
  rain: {
    day: { sky: ['#5d6a75', '#9aa7b1'], cloud: '#7d8892' },
    night: { sky: ['#0e141b', '#232d38'], cloud: '#262e37' },
    platform: { day: { top: '#4e7b72', body: '#2f4a43' }, night: { top: '#33524c', body: '#1f322e' }, wet: true },
    hills: { day: ['#7f8c96', '#667a73'], night: ['#1a232c', '#121a20'] },
    celestial: 0, puff: '205,228,245',
    clouds: 11, cloudAlpha: 0.95, stars: 0.3, particles: 'rain',
  },
  snow: {
    day: { sky: ['#c9d6df', '#f3f7fa'], cloud: '#e6ecf0' },
    night: { sky: ['#1a2436', '#3b4a63'], cloud: '#566379' },
    platform: { day: { top: '#ffffff', body: '#d5e0e8' }, night: { top: '#c4d0e0', body: '#8d9db3' }, snowCap: true },
    hills: { day: ['#c4d3df', '#e3ecf2'], night: ['#34435b', '#27344a'] },
    celestial: 0.55, puff: '255,255,255',
    clouds: 7, cloudAlpha: 0.9, stars: 0.5, particles: 'snow',
  },
  thunderstorm: {
    day: { sky: ['#2b2f38', '#555b67'], cloud: '#3f434d' },
    night: { sky: ['#06070b', '#14171f'], cloud: '#15181f' },
    platform: { day: { top: '#3f5566', body: '#242d36' }, night: { top: '#2a3a48', body: '#161c22' }, wet: true },
    hills: { day: ['#3a404b', '#2c323b'], night: ['#0e1117', '#0a0c10'] },
    celestial: 0, puff: '205,228,245',
    clouds: 13, cloudAlpha: 1, stars: 0.15, particles: 'rain',
  },
};

// How strongly a gust bends the falling rain. Wind is the gust force in px/s^2:
// x slants the rain sideways; y (down positive) speeds it up or slows it.
export const WIND_SLANT = 0.5;  // px/s of sideways rain drift per px/s^2 of gust
export const WIND_FALL = 0.4;   // px/s of fall-speed change per px/s^2 of gust

// Pure: velocity of a raindrop with base fall speed `fall`, in a wind (force).
export function rainVelocity(fall, wind) {
  return { vx: wind.x * WIND_SLANT, vy: Math.max(150, fall + wind.y * WIND_FALL) };
}

// A seeded stream per platform, so decorations stay put from frame to frame
// (no flicker) and are the same every time the Course is drawn.
const platformRng = (pl, salt) =>
  createRng((Math.imul(pl.x | 0, 73856093) ^ Math.imul(pl.y | 0, 19349663) ^ salt) >>> 0);

// Where the water drops, puddles and ripples sit on a wet platform.
// Offsets are relative to the platform's left edge.
export function wetSpots(pl) {
  const rng = platformRng(pl, 0);
  const along = () => 6 + rng() * Math.max(0, pl.w - 12);
  const n = Math.max(2, Math.floor(pl.w / 26));
  return {
    drops: Array.from({ length: n }, () => ({ x: along() })),
    puddles: Array.from({ length: Math.max(1, Math.floor(pl.w / 90)) }, () => ({ x: along(), rx: 14 + rng() * 10 })),
    ripples: Array.from({ length: 2 }, () => ({ x: along(), phase: rng() })),
  };
}

// Grass blades on top of a platform and icicles hanging under it (offsets from its left edge).
export function decorSpots(pl) {
  const rng = platformRng(pl, 0x5bd1e995);
  const along = () => 3 + rng() * Math.max(0, pl.w - 6);
  return {
    blades: Array.from({ length: Math.max(3, Math.floor(pl.w / 9)) }, () => ({ x: along(), h: 3 + rng() * 5 })),
    icicles: Array.from({ length: Math.max(2, Math.floor(pl.w / 30)) }, () => ({ x: along(), h: 6 + rng() * 10 })),
  };
}

// Camera lead: the view eases ahead of the player in their running direction.
export const CAMERA_LEAD = 25;        // px the view aims ahead at top speed (kept small)
export const CAMERA_LEAD_RATE = 2.5;  // how quickly it eases (per second)

// Camera follow: the camera trails the player and catches up smoothly, so the
// player leads and the camera chases. Steady-state lag while running is about
// speed / FOLLOW rate (360 / 6 = 60 px). Max lag keeps the player on screen
// during fast falls.
export const CAMERA_FOLLOW_X = 6;      // per second
export const CAMERA_FOLLOW_Y = 5;
export const CAMERA_MAX_LAG_X = 100;   // px the camera may fall behind, at most
export const CAMERA_MAX_LAG_Y = 110;

// Pure: move the camera centre `cam` toward `target`. Eases with a speed
// proportional to the distance (no overshoot), then caps the distance.
export function followCamera(cam, target, dt) {
  const step = (c, t, rate, maxLag) => {
    const next = c + (t - c) * Math.min(1, dt * rate);
    return clamp(next, t - maxLag, t + maxLag);
  };
  return {
    x: step(cam.x, target.x, CAMERA_FOLLOW_X, CAMERA_MAX_LAG_X),
    y: step(cam.y, target.y, CAMERA_FOLLOW_Y, CAMERA_MAX_LAG_Y),
  };
}

// Pure: next lead offset. Target is proportional to speed (so a slide on Snow
// keeps leading), capped at CAMERA_LEAD; eases toward it without overshooting.
export function cameraLead(current, vx, maxSpeed, dt) {
  const target = clamp(vx / maxSpeed, -1, 1) * CAMERA_LEAD;
  return current + (target - current) * Math.min(1, dt * CAMERA_LEAD_RATE);
}

// Wrap v into [lo, hi), like a clock face. Used so particles that leave one
// side of the screen re-enter on the other.
export function wrap(v, lo, hi) {
  const size = hi - lo;
  return ((((v - lo) % size) + size) % size) + lo;
}

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hash01 = (n) => { const v = Math.sin(n) * 43758.5453; return v - Math.floor(v); };

// Rounded rectangle path (built from arcTo, which every browser supports).
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Visual-only state.
  const stars = Array.from({ length: 90 }, () => ({ x: rand(0, W), y: rand(0, H * 0.7), r: rand(0.6, 1.6), a: rand(0.4, 1) }));
  const CLOUD_SPAN = W * 2.4;
  const clouds = Array.from({ length: 13 }, () => {
    const s = rand(0.8, 1.6);
    return {
      x: rand(0, CLOUD_SPAN), y: rand(15, 170), puffs: Array.from({ length: 4 }, (_, i) =>
        ({ dx: (i - 1.5) * 38 * s + rand(-8, 8), dy: rand(-12, 8) * s, r: rand(30, 48) * s })),
    };
  });
  const drops = Array.from({ length: 320 }, () => ({ x: rand(-300, W + 300), y: rand(0, H), fall: rand(700, 1000), len: rand(0.012, 0.022) }));
  const flakes = Array.from({ length: 160 }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1.5, 3.5), fall: rand(50, 110), phase: rand(0, 6.28) }));
  const wind = { x: 0, y: 0 }; // smoothed, so the rain bends gradually when a gust changes
  const puffs = [];            // dust or splashes kicked up when the player lands
  let last = performance.now();
  let clock = 0;
  let prevCam = null;          // camera position last frame, to keep particles fixed in the world
  let prevGround = false, prevVy = 0;
  let facing = 1;
  let lead = 0;                // current camera lead in px (+ = looking right)
  let cam = null;              // camera centre in world coordinates; trails the player

  // ---- sky and backdrop (screen space) ----

  function drawSky(theme, look, world) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, look.sky[0]);
    g.addColorStop(1, look.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (!world.isDay) {
      for (const s of stars) {
        ctx.fillStyle = `rgba(255,255,240,${s.a * theme.stars})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Sun or moon, hidden behind heavy cloud in Rain and Thunderstorm.
    const c = theme.celestial;
    if (c > 0) {
      const x = W * 0.78, y = 95;
      if (world.isDay) {
        const glow = ctx.createRadialGradient(x, y, 12, x, y, 95);
        glow.addColorStop(0, `rgba(255,240,170,${0.6 * c})`);
        glow.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 100, y - 100, 200, 200);
        ctx.fillStyle = `rgba(255,243,176,${c})`;
        ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(232,236,245,${c})`;
        ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(150,160,185,${0.5 * c})`; // craters
        for (const [dx, dy, r] of [[-8, -6, 6], [9, 4, 4.5], [-3, 12, 3.5]]) {
          ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  // Clouds drift slowly with the camera (parallax: far things move less).
  function drawClouds(theme, look, camX) {
    ctx.fillStyle = look.cloud;
    ctx.globalAlpha = theme.cloudAlpha;
    for (let i = 0; i < theme.clouds; i++) {
      const c = clouds[i];
      const cx = (((c.x - camX * 0.15 + clock * 6) % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN - 200;
      for (const q of c.puffs) { ctx.beginPath(); ctx.arc(cx + q.dx, c.y + q.dy, q.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // Two layers of rolling hills; the farther one moves less when the camera moves.
  function drawHills(theme, world, camX, camY) {
    const cols = world.isDay ? theme.hills.day : theme.hills.night;
    const layers = [
      { k: 0.08, base: H * 0.64, a1: 40, a2: 14, p1: 1, p2: 2, col: cols[0] },
      { k: 0.18, base: H * 0.76, a1: 34, a2: 12, p1: 4, p2: 0.5, col: cols[1] },
    ];
    for (const L of layers) {
      ctx.fillStyle = L.col;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W + 10; sx += 10) {
        const wx = sx + camX * L.k;
        ctx.lineTo(sx, L.base - camY * 0.05 + Math.sin(wx * 0.004 + L.p1) * L.a1 + Math.sin(wx * 0.011 + L.p2) * L.a2);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ---- world (world space, inside the camera transform) ----

  function drawPlatforms(theme, world, camX) {
    const plat = theme.platform;
    const pc = world.isDay ? plat.day : plat.night;
    for (const pl of world.platforms) {
      if (pl.x + pl.w < camX - 20 || pl.x > camX + W + 20) continue; // off screen
      ctx.fillStyle = pc.body;
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = plat.snowCap ? 'rgba(70,100,140,0.22)' : 'rgba(0,0,0,0.2)'; // shaded underside
      ctx.fillRect(pl.x, pl.y + pl.h - 6, pl.w, 6);
      ctx.fillStyle = pc.top;
      if (plat.snowCap) ctx.fillRect(pl.x - 3, pl.y - 3, pl.w + 6, 9); // snow piled on top
      else ctx.fillRect(pl.x, pl.y, pl.w, 6);

      const deco = (plat.grass || plat.snowCap) ? decorSpots(pl) : null;
      if (plat.grass) {
        ctx.fillStyle = pc.blade;
        for (const b of deco.blades) {
          ctx.beginPath();
          ctx.moveTo(pl.x + b.x - 2, pl.y + 1); ctx.lineTo(pl.x + b.x, pl.y - b.h); ctx.lineTo(pl.x + b.x + 2, pl.y + 1);
          ctx.fill();
        }
      }
      if (plat.snowCap) {
        ctx.fillStyle = world.isDay ? '#eaf3fa' : '#a8b8cf';
        for (const ic of deco.icicles) { // icicles hanging from the bottom
          ctx.beginPath();
          ctx.moveTo(pl.x + ic.x - 2.5, pl.y + pl.h); ctx.lineTo(pl.x + ic.x, pl.y + pl.h + ic.h); ctx.lineTo(pl.x + ic.x + 2.5, pl.y + pl.h);
          ctx.fill();
        }
      }
      if (plat.wet) drawWet(pl);
    }
  }

  function drawWet(pl) {
    const spots = wetSpots(pl);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; // glossy shine on the wet top
    ctx.fillRect(pl.x + 4, pl.y + 1, pl.w - 8, 1);
    ctx.fillStyle = 'rgba(150,200,235,0.35)';
    for (const q of spots.puddles) {
      ctx.beginPath(); ctx.ellipse(pl.x + q.x, pl.y + 2, q.rx, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(195,228,255,0.85)';
    for (const d of spots.drops) {
      ctx.beginPath(); ctx.ellipse(pl.x + d.x, pl.y + 4, 2.4, 1.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineWidth = 1; // ripples from raindrops landing: grow and fade
    for (const r of spots.ripples) {
      const t = (clock * 0.9 + r.phase) % 1;
      ctx.strokeStyle = `rgba(220,240,255,${0.6 * (1 - t)})`;
      ctx.beginPath(); ctx.ellipse(pl.x + r.x, pl.y + 2, 2 + 10 * t, 1 + 3 * t, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawChest(world) {
    const t = world.treasureBox;
    const cx = t.x + t.w / 2;
    if (!world.opened) { // golden glow, brighter when the player is close enough to open it
      const r = 42 + 5 * Math.sin(clock * 3);
      const glow = ctx.createRadialGradient(cx, t.y + t.h / 2, 4, cx, t.y + t.h / 2, r);
      glow.addColorStop(0, `rgba(255,214,90,${world.touchingTreasure() ? 0.65 : 0.38})`);
      glow.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r, t.y + t.h / 2 - r, r * 2, r * 2);
    }
    ctx.fillStyle = '#7a4d19'; // box
    roundRect(ctx, t.x, t.y + 11, t.w, t.h - 11, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(t.x + 2, t.y + 11 + (t.h - 11) / 2, t.w - 4, 1.5); // plank seam

    if (world.opened) { // lid swung open, gold inside
      ctx.fillStyle = '#ffd34d';
      for (const [dx, dy, r] of [[-9, 0, 5], [0, -2, 6], [9, 0, 5]]) {
        ctx.beginPath(); ctx.arc(cx + dx, t.y + 10 + dy, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      ctx.translate(t.x + t.w, t.y + 11);
      ctx.rotate(0.9);
      ctx.fillStyle = '#a86f2a';
      roundRect(ctx, 0, -12, t.w * 0.9, 12, 5); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = '#a86f2a'; // rounded lid
      roundRect(ctx, t.x - 1, t.y, t.w + 2, 15, 7); ctx.fill();
    }
    ctx.fillStyle = '#f0c040'; // gold bands
    ctx.fillRect(t.x + 6, t.y + (world.opened ? 11 : 1), 4, world.opened ? t.h - 11 : t.h - 1);
    ctx.fillRect(t.x + t.w - 10, t.y + (world.opened ? 11 : 1), 4, world.opened ? t.h - 11 : t.h - 1);
    if (!world.opened) {
      ctx.fillStyle = '#ffe27a'; // lock
      roundRect(ctx, cx - 4, t.y + 9, 8, 8, 2); ctx.fill();
      ctx.fillStyle = '#5a3d0a';
      ctx.fillRect(cx - 1, t.y + 11, 2, 4);
      for (let i = 0; i < 3; i++) { // twinkling sparkles
        const ph = (clock * 0.8 + i * 0.33) % 1;
        const s = 5 * Math.sin(Math.PI * ph);
        const sx = cx + [-20, 17, 2][i], sy = t.y + [-6, -12, -22][i];
        ctx.fillStyle = `rgba(255,245,190,${Math.sin(Math.PI * ph)})`;
        ctx.fillRect(sx - s, sy - 0.75, s * 2, 1.5);
        ctx.fillRect(sx - 0.75, sy - s, 1.5, s * 2);
      }
    }
  }

  // Strike warning circles that darken as the strike nears, then a jagged bolt.
  function drawStrikes(storm) {
    for (const s of storm.strikes) {
      const progress = 1 - s.timeLeft / s.telegraph;
      ctx.fillStyle = `rgba(20, 0, 30, ${0.25 + 0.5 * progress})`;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + 0.7 * progress})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (storm.flash > 0 && storm.lastStrike) {
      const b = storm.lastStrike;
      const fade = Math.min(1, storm.flash / storm.flashDuration);
      const top = b.y - 1200, segs = 16;
      const pts = Array.from({ length: segs + 1 }, (_, i) => ({
        x: i === segs ? b.x : b.x + (hash01(b.x + i * 7.1) - 0.5) * 60 * (i / segs + 0.3),
        y: top + ((b.y - top) * i) / segs,
      }));
      ctx.lineJoin = 'round';
      for (const [w, col] of [[14, `rgba(170,190,255,${0.3 * fade})`], [4, `rgba(255,255,255,${fade})`]]) {
        ctx.lineWidth = w; ctx.strokeStyle = col;
        ctx.beginPath();
        pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        ctx.stroke();
      }
    }
  }

  // A soft shadow on the platform below the player; fainter the higher they are.
  function drawShadow(p, platforms) {
    const feet = p.y + p.h, cx = p.x + p.w / 2;
    let ground = null;
    for (const pl of platforms) {
      if (cx < pl.x || cx > pl.x + pl.w || pl.y < feet - 4) continue;
      if (ground === null || pl.y < ground) ground = pl.y;
    }
    if (ground === null) return;
    const gap = ground - feet;
    if (gap > 360) return;
    ctx.fillStyle = `rgba(0,0,0,${0.32 * (1 - gap / 360)})`;
    ctx.beginPath();
    ctx.ellipse(cx, ground + 1, 15 * (1 - gap / 700), 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // The player is always drawn inside their hitbox: a little character with
  // eyes that look the way they move, walking feet, and squash/stretch.
  function drawPlayer(p) {
    if (Math.abs(p.vx) > 20) facing = Math.sign(p.vx);
    const air = !p.onGround;
    const stretch = air ? Math.min(0.12, Math.abs(p.vy) / 6000) : 0;
    const w = p.w * (1 - stretch * 0.8);
    const h = (p.crouching ? p.h * 0.7 : p.h) * (1 + stretch);
    const x = p.x + (p.w - w) / 2;
    const feetY = p.y + p.h;
    const top = feetY - h;
    const moving = !air && Math.abs(p.vx) > 40;
    const step = moving ? Math.sin(clock * 16) * 3 : 0;

    ctx.fillStyle = '#7a1f12'; // feet
    ctx.fillRect(x + 3 + step, feetY - 5, 9, 5);
    ctx.fillRect(x + w - 12 - step, feetY - 5, 9, 5);

    ctx.fillStyle = '#d6402b'; // body
    roundRect(ctx, x, top, w, h - 3, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; // highlight on the lit side
    roundRect(ctx, x + 3, top + 3, 6, h * 0.45, 3); ctx.fill();

    const eyeY = top + Math.min(15, h * 0.35);
    for (const dx of [-5, 5]) {
      const ex = x + w / 2 + dx + facing * 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex, eyeY, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(ex + facing * 1.6, eyeY + clamp(p.vy / 700, -1.5, 1.5), 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Dust (or splash, or powder) when landing from a fall.
  function updatePuffs(p, dt) {
    if (p.onGround && !prevGround && prevVy > 250) {
      const n = Math.min(10, 4 + Math.floor(prevVy / 200));
      for (let i = 0; i < n; i++) {
        puffs.push({ x: p.x + p.w / 2 + rand(-10, 10), y: p.y + p.h - 2, vx: rand(-90, 90), vy: rand(-130, -30), life: 0.45, max: 0.45, r: rand(2, 4.5) });
      }
    }
    prevGround = p.onGround;
    prevVy = p.vy;
    for (const q of puffs) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; q.life -= dt; }
    for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life <= 0) puffs.splice(i, 1);
  }

  function drawPuffs(theme) {
    for (const q of puffs) {
      ctx.fillStyle = `rgba(${theme.puff},${0.7 * (q.life / q.max)})`;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.3 - 0.5 * (q.life / q.max)), 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---- precipitation and HUD (screen space) ----

  function drawPrecipitation(theme, world, dt, dCamX, dCamY) {
    if (theme.particles === 'rain') {
      ctx.strokeStyle = world.isDay ? 'rgba(210,225,240,0.55)' : 'rgba(170,190,225,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const d of drops) {
        const v = rainVelocity(d.fall, wind);
        d.x = wrap(d.x + v.vx * dt - dCamX, -300, W + 300);
        d.y = wrap(d.y + v.vy * dt - dCamY, -30, H);
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - v.vx * d.len, d.y - v.vy * d.len); // streak trails behind the fall
      }
      ctx.stroke();
    } else if (theme.particles === 'snow') {
      ctx.fillStyle = world.isDay ? 'rgba(255,255,255,0.95)' : 'rgba(235,242,255,0.9)';
      for (const f of flakes) {
        f.x = wrap(f.x + (Math.sin(clock * 1.2 + f.phase) * 25 + wind.x * 0.3) * dt - dCamX, -5, W + 5);
        f.y = wrap(f.y + f.fall * dt - dCamY, -5, H + 5);
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawHud(world) {
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(world.elapsed.toFixed(2) + 's', 16, 30);
    ctx.font = '14px monospace';
    ctx.fillText(`${world.condition} · ${world.isDay ? 'day' : 'night'}`, 16, 50);
    ctx.font = '20px monospace';
    if (!world.opened && world.touchingTreasure()) {
      ctx.textAlign = 'center';
      ctx.fillText('Press E or click to open', W / 2, 60);
      ctx.textAlign = 'start';
    }
  }

  return function render(world) {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    const theme = THEMES[world.condition] ?? THEMES.clear;
    const look = world.isDay ? theme.day : theme.night;
    const storm = world.storm;
    const k = Math.min(1, dt * 4);
    wind.x += (storm.force.x - wind.x) * k;
    wind.y += (storm.force.y - wind.y) * k;

    const p = world.player;
    // Camera: trails the player with a short delay, aiming slightly ahead of where they run.
    lead = cameraLead(lead, p.vx, world.physics.maxSpeed, dt);
    const target = { x: p.x + p.w / 2 + lead, y: p.y + p.h / 2 };
    cam = cam ? followCamera(cam, target, dt) : target; // first frame: start on the player
    const camX = cam.x - W / 2;
    const camY = cam.y - H / 2;

    // Rain and snow hang in the air, so when the camera moves they must slide the
    // opposite way on screen. Without this they would seem to travel with the player.
    const dCamX = prevCam ? camX - prevCam.x : 0;
    const dCamY = prevCam ? camY - prevCam.y : 0;
    prevCam = { x: camX, y: camY };

    drawSky(theme, look, world);
    drawClouds(theme, look, camX);
    drawHills(theme, world, camX, camY);

    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));
    drawPlatforms(theme, world, camX);
    drawChest(world);
    drawStrikes(storm);
    drawShadow(p, world.platforms);
    drawPlayer(p);
    updatePuffs(p, dt);
    drawPuffs(theme);
    ctx.restore();

    if (!world.isDay) { // night: a dark tint over the world
      ctx.fillStyle = 'rgba(0, 0, 25, 0.25)';
      ctx.fillRect(0, 0, W, H);
    }

    drawPrecipitation(theme, world, dt, dCamX, dCamY);

    // White flash when lightning strikes.
    if (storm.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.min(1, storm.flash / storm.flashDuration)})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawHud(world);
  };
}
