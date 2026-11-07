import test from 'node:test';
import assert from 'node:assert/strict';
import { createBestTimes } from '../src/besttimes.js';

const fakeStorage = (initial) => {
  const m = new Map(initial ? [['weather-parkour:best-times', initial]] : []);
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), _m: m };
};
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('empty storage: no best time', () => {
  const b = createBestTimes(fakeStorage());
  assert.equal(b.get('clear'), null);
});

test('first finish is a best; slower or equal is not; faster is', () => {
  const b = createBestTimes(fakeStorage());
  assert.deepEqual(b.record('rain', 40.123), { isBest: true, best: 40.12, saved: true });
  assert.equal(b.get('rain'), 40.12);
  assert.equal(b.record('rain', 50).isBest, false);
  assert.equal(b.get('rain'), 40.12);
  assert.equal(b.record('rain', 40.12).isBest, false); // tie
  assert.equal(b.record('rain', 35.5).isBest, true);
  assert.equal(b.get('rain'), 35.5);
});

test('best times are kept per Condition', () => {
  const b = createBestTimes(fakeStorage());
  b.record('rain', 40); b.record('snow', 55);
  assert.equal(b.get('rain'), 40);
  assert.equal(b.get('snow'), 55);
  assert.equal(b.get('clear'), null);
});

test('persists across instances (same storage)', () => {
  const s = fakeStorage();
  createBestTimes(s).record('clear', 30);
  assert.equal(createBestTimes(s).get('clear'), 30);
});

test('blocked storage: game still works, no best time, no throw', () => {
  const b = createBestTimes(broken);
  assert.equal(b.get('clear'), null);
  const r = b.record('clear', 30);
  assert.equal(r.isBest, false);
  assert.equal(r.saved, false);
});

test('no storage at all (null) behaves the same', () => {
  const b = createBestTimes(null);
  assert.equal(b.get('clear'), null);
  assert.equal(b.record('clear', 30).saved, false);
});

test('corrupted or odd saved data is ignored', () => {
  for (const bad of ['not json', '[]', '"x"', '{"clear":"fast"}', '{"clear":-3}', '{"clear":null}', '{"fog":10}']) {
    const b = createBestTimes(fakeStorage(bad));
    assert.equal(b.get('clear'), null, bad);
    assert.equal(b.record('clear', 20).isBest, true, bad);
  }
});

test('rejects nonsense times and unknown Conditions', () => {
  const b = createBestTimes(fakeStorage());
  for (const t of [0, -1, NaN, Infinity]) assert.equal(b.record('clear', t).isBest, false);
  assert.equal(b.record('fog', 10).isBest, false);
  assert.equal(b.get('clear'), null);
});

test('write failure (e.g. storage full) does not throw and reports not saved', () => {
  const s = { getItem: () => null, setItem() { throw new Error('quota'); } };
  const r = createBestTimes(s).record('clear', 20);
  assert.equal(r.saved, false);
});
