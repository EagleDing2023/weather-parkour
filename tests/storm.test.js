import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorm } from '../src/storm.js';
import { createRun } from '../src/run.js';
import { createPlayer, stepPlayer } from '../src/player.js';
import { generateCourse, maxGapFor } from '../src/course.js';
import { getPhysics } from '../src/effects.js';
import { STEP, PHYSICS } from '../src/config.js';

const none = { left: false, right: false, jump: false, crouch: false };
const storm = getPhysics('thunderstorm');
const plats = [{ x: 0, y: 500, w: 400, h: 24 }, { x: 500, y: 480, w: 300, h: 24 }];
const standing = (x = 200) => ({ ...createPlayer(x, 460), onGround: true });

// Advance until the next strike spawns; returns [timeSpawned, strike].
function nextSpawn(s, player, t0 = 0) {
  let t = t0;
  while (s.strikes.length === 0) { s.update(STEP, player); t += STEP; if (t > 20) throw new Error('no strike'); }
  return [t, { ...s.strikes[0] }];
}

test('Clear/Rain/Snow: no gusts and no strikes', () => {
  for (const c of ['clear', 'rain', 'snow']) {
    const s = createStorm(1, getPhysics(c), plats);
    let hit = false;
    for (let i = 0; i < 60 * 30; i++) hit ||= s.update(STEP, standing());
    assert.deepEqual(s.force, { x: 0, y: 0 });
    assert.equal(s.strikes.length, 0);
    assert.equal(hit, false);
  }
});

test('strikes come every 2 to 4 seconds and are telegraphed 0.8 s', () => {
  const s = createStorm(7, storm, plats);
  const p = standing();
  const spawns = [];
  let prev = 0;
  for (let i = 0; i < 60 * 60; i++) {
    s.update(STEP, p);
    if (s.strikes.length > prev) spawns.push(i * STEP);
    prev = s.strikes.length;
  }
  assert.ok(spawns.length >= 12, 'roughly 60/3 strikes in a minute, got ' + spawns.length);
  for (let i = 1; i < spawns.length; i++) {
    const d = spawns[i] - spawns[i - 1];
    assert.ok(d > 1.9 && d < 4.1, `interval ${d}`);
  }
});

test('circle sits on a nearby platform top; lands after the telegraph', () => {
  const s = createStorm(3, storm, plats);
  const p = standing();
  const [t0, k] = nextSpawn(s, p);
  assert.ok(plats.some((pl) => pl.y === k.y && k.x >= pl.x && k.x <= pl.x + pl.w));
  assert.equal(k.radius, storm.strikeRadius);
  let landed = null;
  for (let i = 0; i < 100; i++) {
    s.update(STEP, { ...p, x: -9999 }); // player far away: never hit
    if (s.strikes.length === 0) { landed = (i + 1) * STEP; break; }
  }
  assert.ok(Math.abs(landed - 0.8) < 0.05, 'landed after ' + landed);
});

test('standing in the circle when it lands is a hit; elsewhere or airborne is not', () => {
  const trial = (place) => {
    const s = createStorm(11, storm, plats);
    const p = standing();
    nextSpawn(s, p);
    const k = s.strikes[0];
    place(p, k);
    let hit = false;
    for (let i = 0; i < 60 && !hit; i++) hit = s.update(STEP, p);
    return hit;
  };
  assert.equal(trial((p, k) => { p.x = k.x - p.w / 2; p.y = k.y - p.h; }), true, 'inside');
  assert.equal(trial((p, k) => { p.x = k.x + 200; p.y = k.y - p.h; }), false, 'outside');
  assert.equal(trial((p, k) => { p.x = k.x - p.w / 2; p.y = k.y - p.h - 80; }), false, 'jumped clear');
});

test('same seed gives identical gusts and strikes; different seed differs', () => {
  const trace = (seed) => {
    const s = createStorm(seed, storm, plats), p = standing(), out = [];
    for (let i = 0; i < 60 * 20; i++) {
      s.update(STEP, p);
      out.push(s.force.x, s.force.y, s.strikes[0]?.x ?? 0);
    }
    return out;
  };
  assert.deepEqual(trace(5), trace(5));
  assert.notDeepEqual(trace(5), trace(6));
});

test('gusts are bounded by gustStrength, change over time, and go every way', () => {
  const s = createStorm(9, storm, plats), p = standing();
  const signs = new Set();
  const seen = new Set();
  for (let i = 0; i < 60 * 120; i++) {
    s.update(STEP, p);
    assert.ok(Math.hypot(s.force.x, s.force.y) <= storm.gustStrength + 1e-9);
    seen.add(s.force.x.toFixed(2));
    signs.add(Math.sign(s.force.x) + ',' + Math.sign(s.force.y));
  }
  assert.ok(seen.size > 50, 'force changes');
  for (const q of ['1,1', '1,-1', '-1,1', '-1,-1']) assert.ok(signs.has(q), 'missing ' + q);
});

test('run: a strike on the player causes Respawn, timer keeps running', () => {
  const r = createRun({ platforms: plats, start: { x: 50, y: 460 }, treasure: { x: 700, y: 480 }, seed: 4, physics: storm });
  const crouch = { ...none, crouch: true }; // starts the timer without moving
  for (let i = 0; i < 30; i++) r.update(crouch, STEP);
  r.player.x = 250; r.player.y = 460;
  for (let i = 0; i < 600 && r.storm.strikes.length === 0; i++) r.update(crouch, STEP);
  const k = r.storm.strikes[0];
  assert.ok(k);
  r.player.x = k.x - r.player.w / 2; r.player.y = k.y - r.player.h;
  const t = r.elapsed;
  for (let i = 0; i < 60; i++) r.update(crouch, STEP);
  assert.ok(Math.abs(r.player.x - 50) < 5, 'respawned at start, x=' + r.player.x);
  assert.ok(r.elapsed > t);
});

test('no gusts or strikes before the timer starts or after it stops', () => {
  const r = createRun({ platforms: plats, start: { x: 50, y: 460 }, treasure: { x: 700, y: 480 }, seed: 4, physics: storm });
  for (let i = 0; i < 600; i++) r.update(none, STEP);
  assert.equal(r.storm.strikes.length, 0);
  assert.equal(r.player.x, 50);
});

// Gusts must never make a Course impossible: with a constant full-strength gust
// in each of the 4 directions, the player can still cross the widest gap the
// generator allows (while holding forward), using Thunderstorm physics.
test('worst-case gust in any direction: widest generated gaps are still crossable', () => {
  const dirs = { back: [-1, 0], fwd: [1, 0], up: [0, -1], down: [0, 1] };
  for (const [name, [dx, dy]] of Object.entries(dirs)) {
    for (const rise of [0, 40, -100]) {
      const gap = maxGapFor(rise);
      const ps = [{ x: 0, y: 500, w: 150, h: 24 }, { x: 150 + gap, y: 500 - rise, w: 150, h: 24 }];
      const p = createPlayer(10, 460);
      const f = { x: dx * storm.gustStrength, y: dy * storm.gustStrength };
      let jumped = false, landed = false;
      for (let i = 0; i < 600 && !landed; i++) {
        const near = p.x + p.w >= 150 - 8;
        // Hold forward, but ease off once over the target platform (as a player would).
        const over = p.x + p.w / 2 > ps[1].x + 40;
        stepPlayer(p, { ...none, right: !over, left: over && p.vx > 120, jump: near && !jumped }, ps, STEP, storm, f);
        if (near) jumped = true;
        landed = jumped && p.onGround && p.x > 150;
      }
      assert.ok(landed, `${name} gust, rise ${rise}, gap ${gap.toFixed(0)}`);
    }
  }
});

test('baseline PHYSICS has gusts and strikes off', () => {
  assert.equal(PHYSICS.gustStrength, 0);
  assert.equal(PHYSICS.strikeEnabled, false);
});
