import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, rainVelocity, WIND_SLANT } from '../src/renderer.js';
import { EFFECTS } from '../src/effects.js';

test('every Condition has day and night themes with a sky and cloud colour', () => {
  for (const c of Object.keys(EFFECTS)) {
    const t = THEMES[c];
    assert.ok(t, c);
    for (const m of [t.day, t.night]) {
      assert.equal(m.sky.length, 2);
      assert.ok(m.cloud);
    }
  }
});

test('rain falls straight with no wind; slants toward the wind; stronger wind slants more', () => {
  assert.equal(rainVelocity(800, { x: 0, y: 0 }).vx, 0);
  const a = rainVelocity(800, { x: 300, y: 0 }), b = rainVelocity(800, { x: 600, y: 0 });
  assert.ok(a.vx > 0 && b.vx > a.vx);
  assert.equal(rainVelocity(800, { x: -300, y: 0 }).vx, -300 * WIND_SLANT);
});

test('downward gusts speed rain up, upward gusts slow it, never below a floor', () => {
  assert.ok(rainVelocity(800, { x: 0, y: 500 }).vy > 800);
  assert.ok(rainVelocity(800, { x: 0, y: -500 }).vy < 800);
  assert.ok(rainVelocity(800, { x: 0, y: -99999 }).vy >= 150);
});

test('Thunderstorm is darker than Clear, and night darker than day', () => {
  const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  assert.ok(lum(THEMES.thunderstorm.day.sky[0]) < lum(THEMES.clear.day.sky[0]));
  for (const c of Object.keys(THEMES)) assert.ok(lum(THEMES[c].night.sky[0]) < lum(THEMES[c].day.sky[0]), c);
});

test('wrap keeps values inside the range, in both directions', async () => {
  const { wrap } = await import('../src/renderer.js');
  assert.equal(wrap(5, 0, 10), 5);
  assert.equal(wrap(12, 0, 10), 2);
  assert.equal(wrap(-3, 0, 10), 7);
  assert.equal(wrap(-1234, -300, 1200), wrap(-1234 + 1500 * 3, -300, 1200));
  for (const v of [-99999, -1, 0, 9.5, 10, 123456]) {
    const w = wrap(v, -30, 560);
    assert.ok(w >= -30 && w < 560, `${v} -> ${w}`);
  }
});

test('every Condition has platform colours for day and night', () => {
  for (const c of Object.keys(THEMES)) {
    for (const m of ['day', 'night']) {
      const p = THEMES[c].platform[m];
      assert.match(p.top, /^#[0-9a-f]{6}$/i, `${c} ${m} top`);
      assert.match(p.body, /^#[0-9a-f]{6}$/i, `${c} ${m} body`);
    }
  }
});

test('Snow platforms are white-ish and capped; Rain and Thunderstorm are wet; Clear is neither', () => {
  const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  assert.ok(lum(THEMES.snow.platform.day.top) > 700);
  assert.ok(THEMES.snow.platform.snowCap);
  assert.ok(THEMES.rain.platform.wet && THEMES.thunderstorm.platform.wet);
  assert.ok(!THEMES.clear.platform.wet && !THEMES.clear.platform.snowCap);
});

test('wetSpots is deterministic per platform and stays on the platform', async () => {
  const { wetSpots } = await import('../src/renderer.js');
  const pl = { x: 321, y: 480, w: 170, h: 24 };
  assert.deepEqual(wetSpots(pl), wetSpots({ ...pl }));
  assert.notDeepEqual(wetSpots(pl), wetSpots({ ...pl, x: 900 }));
  const s = wetSpots(pl);
  for (const d of [...s.drops, ...s.puddles, ...s.ripples]) assert.ok(d.x >= 0 && d.x <= pl.w);
  assert.ok(s.drops.length >= 2);
});

test('every Condition has hill colours (far, near) for day and night, and darker nights', () => {
  const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  for (const c of Object.keys(THEMES)) {
    for (const m of ['day', 'night']) {
      assert.equal(THEMES[c].hills[m].length, 2);
      for (const col of THEMES[c].hills[m]) assert.match(col, /^#[0-9a-f]{6}$/i);
    }
    assert.ok(lum(THEMES[c].hills.night[0]) < lum(THEMES[c].hills.day[0]), c);
    assert.match(THEMES[c].puff, /^\d+,\d+,\d+$/);
  }
});

test('sun/moon shows in Clear, dimmer in Snow, hidden behind Rain and Thunderstorm clouds', () => {
  assert.equal(THEMES.clear.celestial, 1);
  assert.ok(THEMES.snow.celestial > 0 && THEMES.snow.celestial < 1);
  assert.equal(THEMES.rain.celestial, 0);
  assert.equal(THEMES.thunderstorm.celestial, 0);
});

test('decorSpots is deterministic per platform and stays on the platform', async () => {
  const { decorSpots } = await import('../src/renderer.js');
  const pl = { x: 640, y: 420, w: 180, h: 24 };
  assert.deepEqual(decorSpots(pl), decorSpots({ ...pl }));
  assert.notDeepEqual(decorSpots(pl), decorSpots({ ...pl, y: 300 }));
  const d = decorSpots(pl);
  assert.ok(d.blades.length >= 3 && d.icicles.length >= 2);
  for (const b of [...d.blades, ...d.icicles]) assert.ok(b.x >= 0 && b.x <= pl.w && b.h > 0);
});

test('only Clear has grass; only Snow has icicles/cap', () => {
  assert.ok(THEMES.clear.platform.grass);
  for (const c of ['rain', 'snow', 'thunderstorm']) assert.ok(!THEMES[c].platform.grass, c);
  assert.ok(THEMES.snow.platform.snowCap);
});
