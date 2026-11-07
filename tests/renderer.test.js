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
