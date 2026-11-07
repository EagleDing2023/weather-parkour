// All drawing lives here. Game logic only describes what exists.
// Rain, snow, clouds and stars are visual-only state kept in this module;
// they use Math.random because they never affect gameplay.

// Sky and cloud colours per Condition, for day and night.
export const THEMES = {
  clear: {
    day: { sky: ['#5fb4ee', '#bfe5f9'], cloud: '#ffffff' },
    night: { sky: ['#070d22', '#1b2a58'], cloud: '#3a4672' },
    clouds: 5, cloudAlpha: 0.9, stars: 1, particles: null,
  },
  rain: {
    day: { sky: ['#5d6a75', '#9aa7b1'], cloud: '#7d8892' },
    night: { sky: ['#0e141b', '#232d38'], cloud: '#262e37' },
    clouds: 11, cloudAlpha: 0.95, stars: 0.3, particles: 'rain',
  },
  snow: {
    day: { sky: ['#c9d6df', '#f3f7fa'], cloud: '#e6ecf0' },
    night: { sky: ['#1a2436', '#3b4a63'], cloud: '#566379' },
    clouds: 7, cloudAlpha: 0.9, stars: 0.5, particles: 'snow',
  },
  thunderstorm: {
    day: { sky: ['#2b2f38', '#555b67'], cloud: '#3f434d' },
    night: { sky: ['#06070b', '#14171f'], cloud: '#15181f' },
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

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

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
  let last = performance.now();
  let clock = 0;

  return function render(world) {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    const theme = THEMES[world.condition] ?? THEMES.clear;
    const look = world.isDay ? theme.day : theme.night;
    const force = world.storm.force;
    const k = Math.min(1, dt * 4);
    wind.x += (force.x - wind.x) * k;
    wind.y += (force.y - wind.y) * k;

    const p = world.player;
    // Camera: shift the world so the player stays centred.
    const camX = p.x + p.w / 2 - W / 2;
    const camY = p.y + p.h / 2 - H / 2;

    // Sky
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

    // Clouds drift slowly with the camera (parallax: far things move less).
    ctx.fillStyle = look.cloud;
    ctx.globalAlpha = theme.cloudAlpha;
    for (let i = 0; i < theme.clouds; i++) {
      const c = clouds[i];
      const cx = (((c.x - camX * 0.15 + clock * 6) % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN - 200;
      for (const q of c.puffs) { ctx.beginPath(); ctx.arc(cx + q.dx, c.y + q.dy, q.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;

    // World
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));

    ctx.fillStyle = world.isDay ? '#3b5b3a' : '#2a4029';
    for (const pl of world.platforms) ctx.fillRect(pl.x, pl.y, pl.w, pl.h);

    const t = world.treasureBox;
    ctx.fillStyle = world.opened ? '#8a6b1e' : '#e0b030';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#5a3d0a';
    ctx.fillRect(t.x, t.y + t.h * 0.4, t.w, 4); // lid line

    // Lightning Strike warning circles: grow darker as the strike approaches.
    const storm = world.storm;
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
      ctx.fillStyle = '#fff';
      ctx.fillRect(b.x - 4, b.y - 1200, 8, 1200); // bolt from the sky
    }

    ctx.fillStyle = '#d6402b';
    // Crouching draws shorter, anchored at the feet. Visual only.
    const h = p.crouching ? p.h * 0.7 : p.h;
    ctx.fillRect(p.x, p.y + p.h - h, p.w, h);
    ctx.restore();

    if (!world.isDay) { // night: a dark tint over the world
      ctx.fillStyle = 'rgba(0, 0, 25, 0.25)';
      ctx.fillRect(0, 0, W, H);
    }

    // Precipitation in front, in screen space.
    if (theme.particles === 'rain') {
      ctx.strokeStyle = world.isDay ? 'rgba(210,225,240,0.55)' : 'rgba(170,190,225,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const d of drops) {
        const v = rainVelocity(d.fall, wind);
        d.x += v.vx * dt; d.y += v.vy * dt;
        if (d.y > H) { d.y = -30; d.x = rand(-300, W + 300); }
        if (d.x > W + 300) d.x -= W + 600; else if (d.x < -300) d.x += W + 600;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - v.vx * d.len, d.y - v.vy * d.len); // streak trails behind the fall
      }
      ctx.stroke();
    } else if (theme.particles === 'snow') {
      ctx.fillStyle = world.isDay ? 'rgba(255,255,255,0.95)' : 'rgba(235,242,255,0.9)';
      for (const f of flakes) {
        f.y += f.fall * dt;
        f.x += (Math.sin(clock * 1.2 + f.phase) * 25 + wind.x * 0.3) * dt;
        if (f.y > H + 5) { f.y = -5; f.x = rand(0, W); }
        if (f.x > W + 5) f.x = -5; else if (f.x < -5) f.x = W + 5;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // White flash when lightning strikes.
    if (storm.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * Math.min(1, storm.flash / storm.flashDuration)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD (screen space)
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
  };
}
