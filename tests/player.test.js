import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, stepPlayer } from '../src/player.js';
import { STEP } from '../src/config.js';

const none = { left: false, right: false, jump: false, crouch: false };
const floor = [{ x: 0, y: 500, w: 400, h: 40 }];
const run = (p, input, n, plats = floor) => { for (let i = 0; i < n; i++) stepPlayer(p, input, plats, STEP); };
const grounded = (x = 100) => { const p = createPlayer(x, 460); run(p, none, 5); return p; };

test('lands on floor', () => assert.ok(grounded().onGround));

test('right accelerates, no input stops via friction', () => {
  const p = grounded();
  run(p, { ...none, right: true }, 20);
  assert.ok(p.vx > 0);
  run(p, none, 60);
  assert.equal(p.vx, 0);
});

test('jump leaves ground', () => {
  const p = grounded();
  run(p, { ...none, jump: true }, 2);
  assert.ok(p.vy < 0 && !p.onGround);
});

test('coyote: jump works just after walking off a ledge', () => {
  const plats = [{ x: 0, y: 500, w: 200, h: 40 }];
  const p = createPlayer(150, 460);
  run(p, none, 5, plats);
  while (p.onGround || p.y < 470) { run(p, { ...none, right: true }, 1, plats); if (!p.onGround && p.x > 200) break; }
  assert.ok(!p.onGround);
  run(p, { ...none, right: true, jump: true }, 1, plats); // a few frames after leaving
  assert.ok(p.vy < 0, 'jumped');
});

test('no coyote after it expires', () => {
  const p = createPlayer(100, 100); // starts airborne, never grounded
  run(p, { ...none, jump: true }, 1, []);
  assert.ok(p.vy >= 0);
});

test('jump buffer: press slightly before landing still jumps', () => {
  const p = createPlayer(100, 440); // falling toward floor, lands within a few frames
  p.vy = 400;
  let jumped = false;
  for (let i = 0; i < 10; i++) {
    stepPlayer(p, { ...none, jump: i === 0 }, floor, STEP);
    if (p.vy < 0) jumped = true;
  }
  assert.ok(jumped);
});

test('holding jump does not re-trigger', () => {
  const p = grounded();
  run(p, { ...none, jump: true }, 1);
  const vy = p.vy;
  run(p, { ...none, jump: true }, 1);
  assert.ok(p.vy > vy); // only gravity acts
});

test('crouch stops faster than normal friction', () => {
  const a = grounded(), b = grounded();
  a.vx = b.vx = 300;
  run(a, none, 5);
  run(b, { ...none, crouch: true }, 5);
  assert.ok(b.vx < a.vx);
});

test('crouching cannot walk off an edge; standing can', () => {
  const plats = [{ x: 0, y: 500, w: 200, h: 40 }];
  const c = createPlayer(150, 460);
  run(c, none, 5, plats);
  run(c, { ...none, right: true, crouch: true }, 240, plats);
  assert.ok(c.onGround && c.x < 200, 'crouching stays on');
  const s = createPlayer(150, 460);
  run(s, none, 5, plats);
  run(s, { ...none, right: true }, 120, plats);
  assert.ok(s.y > 470 || !s.onGround, 'standing falls off');
});
