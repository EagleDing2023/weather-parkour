import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/run.js';
import { STEP } from '../src/config.js';

const none = { left: false, right: false, jump: false, crouch: false };
const make = () => createRun({
  platforms: [{ x: 0, y: 500, w: 200, h: 40 }],
  start: { x: 50, y: 460 },
  treasure: { x: 150, y: 500 },
});
const tick = (r, input, n) => { for (let i = 0; i < n; i++) r.update(input, STEP); };

test('timer waits for first input', () => {
  const r = make();
  tick(r, none, 30);
  assert.equal(r.elapsed, 0);
  tick(r, { ...none, right: true }, 30);
  assert.ok(r.elapsed > 0.4);
});

test('falling off causes Respawn at start, timer not reset', () => {
  const r = make();
  let respawned = false, before = 0;
  for (let i = 0; i < 600 && !respawned; i++) {
    const x = r.player.x;
    before = r.elapsed;
    r.update({ ...none, right: true }, STEP);
    respawned = r.player.x < x - 50; // x jumped back to the start
  }
  assert.ok(respawned, 'player was sent back to the start');
  assert.ok(r.elapsed > before && r.elapsed > 0.5, 'timer kept running');
});

test('respawn() is callable and keeps the timer', () => {
  const r = make();
  tick(r, { ...none, right: true }, 20);
  const t = r.elapsed;
  r.respawn();
  assert.equal(r.player.x, 50);
  assert.equal(r.elapsed, t);
});

test('stopTimer freezes the timer', () => {
  const r = make();
  tick(r, { ...none, right: true }, 10);
  r.stopTimer();
  const t = r.elapsed;
  tick(r, { ...none, right: true }, 10);
  assert.equal(r.elapsed, t);
});

test('player collides with underside of a platform', () => {
  const r = createRun({
    platforms: [{ x: 0, y: 500, w: 300, h: 40 }, { x: 0, y: 380, w: 300, h: 20 }],
    start: { x: 50, y: 460 },
    treasure: { x: 150, y: 500 },
  });
  let minY = Infinity;
  for (let i = 0; i < 60; i++) { r.update({ ...none, jump: i === 0 }, STEP); minY = Math.min(minY, r.player.y); }
  assert.ok(minY === 400, 'head stops at underside, y=' + minY);
});

test('Treasure cannot be opened from afar; opens once when touching and stops the timer', () => {
  const r = make();
  tick(r, { ...none, right: true }, 10);
  assert.equal(r.openTreasure(), false);
  assert.equal(r.opened, false);
  r.player.x = r.treasureBox.x; r.player.y = r.treasureBox.y; // stand in the chest
  assert.ok(r.touchingTreasure());
  assert.equal(r.openTreasure(), true);
  assert.ok(r.stopped);
  const t = r.elapsed;
  tick(r, { ...none, right: true }, 10);
  assert.equal(r.elapsed, t);
  assert.equal(r.openTreasure(), false); // only once
});
