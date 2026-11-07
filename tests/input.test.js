import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS } from '../src/input.js';

test('movement keys', () => {
  assert.deepEqual(KEYS.left, ['KeyA', 'ArrowLeft']);
  assert.deepEqual(KEYS.right, ['KeyD', 'ArrowRight']);
});

test('jump: W, up arrow and Space', () => {
  for (const c of ['KeyW', 'ArrowUp', 'Space']) assert.ok(KEYS.jump.includes(c), c);
});

test('crouch: S, down arrow and either Shift', () => {
  for (const c of ['KeyS', 'ArrowDown', 'ShiftLeft', 'ShiftRight']) assert.ok(KEYS.crouch.includes(c), c);
});

test('no key is bound to two actions', () => {
  const all = Object.values(KEYS).flat();
  assert.equal(new Set(all).size, all.length);
});
