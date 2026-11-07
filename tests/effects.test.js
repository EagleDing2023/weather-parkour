import test from 'node:test';
import assert from 'node:assert/strict';
import { EFFECTS, getPhysics } from '../src/effects.js';
import { PHYSICS, WORST_CASE, STEP } from '../src/config.js';
import { createPlayer, stepPlayer } from '../src/player.js';

const none = { left: false, right: false, jump: false, crouch: false };
const floor = [{ x: -5000, y: 500, w: 10000, h: 40 }];

test('Clear leaves the physics config unchanged', () => {
  assert.deepEqual(getPhysics('clear'), PHYSICS);
});

test('getPhysics does not mutate the base PHYSICS', () => {
  const before = { ...PHYSICS };
  getPhysics('snow'); getPhysics('rain');
  assert.deepEqual(PHYSICS, before);
});

test('unknown Condition throws', () => {
  assert.throws(() => getPhysics('fog'));
});

test('Rain: lower jump and reduced speed, at least the Course generator worst case', () => {
  const r = getPhysics('rain');
  assert.ok(r.jumpSpeed < PHYSICS.jumpSpeed && r.maxSpeed < PHYSICS.maxSpeed);
  assert.ok(r.jumpSpeed >= PHYSICS.jumpSpeed * WORST_CASE.jumpScale);
  assert.ok(r.maxSpeed >= PHYSICS.maxSpeed * WORST_CASE.speedScale);
});

test('no Condition jumps lower or runs slower than Rain (Courses stay finishable)', () => {
  const rain = getPhysics('rain');
  for (const c of Object.keys(EFFECTS)) {
    const p = getPhysics(c);
    assert.ok(p.jumpSpeed >= rain.jumpSpeed, `${c} jump`);
    assert.ok(p.maxSpeed >= rain.maxSpeed, `${c} speed`);
  }
});

test('Snow: low friction, so a sliding player travels much further than on Clear', () => {
  const dist = (cond) => {
    const cfg = getPhysics(cond), p = createPlayer(0, 460);
    for (let i = 0; i < 5; i++) stepPlayer(p, none, floor, STEP, cfg);
    p.vx = 300; const x0 = p.x;
    for (let i = 0; i < 300; i++) stepPlayer(p, none, floor, STEP, cfg);
    return p.x - x0;
  };
  assert.ok(dist('snow') > dist('clear') * 3);
});

test('Snow: crouch still stops faster than not crouching, but slower than crouching on Clear', () => {
  const dist = (cond, crouch) => {
    const cfg = getPhysics(cond), p = createPlayer(0, 460);
    for (let i = 0; i < 5; i++) stepPlayer(p, none, floor, STEP, cfg);
    p.vx = 300; const x0 = p.x;
    for (let i = 0; i < 300; i++) stepPlayer(p, { ...none, crouch }, floor, STEP, cfg);
    return p.x - x0;
  };
  assert.ok(dist('snow', true) < dist('snow', false));
  assert.ok(dist('snow', true) > dist('clear', true));
});

test('holding a direction never exceeds max speed, in any Condition', () => {
  for (const c of Object.keys(EFFECTS)) {
    const cfg = getPhysics(c), p = createPlayer(-4000, 460);
    for (let i = 0; i < 5; i++) stepPlayer(p, none, floor, STEP, cfg);
    let peak = 0;
    for (let i = 0; i < 600; i++) { // 10 seconds
      stepPlayer(p, { ...none, right: true }, floor, STEP, cfg);
      peak = Math.max(peak, Math.abs(p.vx));
    }
    assert.ok(peak <= cfg.maxSpeed + 1e-6, `${c}: peak ${peak} > ${cfg.maxSpeed}`);
    assert.ok(peak >= cfg.maxSpeed * 0.99, `${c}: never reached top speed`);
  }
});
