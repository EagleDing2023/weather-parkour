import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCourse, maxGapFor, PLATFORM_COUNT } from '../src/course.js';
import { createRng } from '../src/rng.js';
import { PHYSICS, WORST_CASE } from '../src/config.js';

const SEEDS = Array.from({ length: 500 }, (_, i) => i * 7919 + 1);

test('rng: same seed same sequence, different seed differs, range [0,1)', () => {
  const a = createRng(5), b = createRng(5), c = createRng(6);
  const sa = [a(), a(), a()], sb = [b(), b(), b()], sc = [c(), c(), c()];
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
});

test('same seed gives identical layout; different seeds differ', () => {
  assert.deepEqual(generateCourse(42), generateCourse(42));
  assert.notDeepEqual(generateCourse(42).platforms, generateCourse(43).platforms);
});

test('fixed platform count', () => {
  for (const s of SEEDS) assert.equal(generateCourse(s).platforms.length, PLATFORM_COUNT);
});

test('every gap and height change is within the worst-case jump', () => {
  const v = PHYSICS.jumpSpeed * WORST_CASE.jumpScale;
  const fullHeight = (v * v) / (2 * PHYSICS.gravity);
  for (const s of SEEDS) {
    const { platforms: ps } = generateCourse(s);
    for (let i = 1; i < ps.length; i++) {
      const rise = ps[i - 1].y - ps[i].y;
      const gap = ps[i].x - (ps[i - 1].x + ps[i - 1].w);
      assert.ok(rise < fullHeight, `seed ${s} #${i}: rise ${rise} >= ${fullHeight}`);
      assert.ok(gap > 0, `seed ${s} #${i}: platforms overlap`);
      // +1 for rounding of integer coordinates
      assert.ok(gap <= maxGapFor(rise) + 2, `seed ${s} #${i}: gap ${gap} > ${maxGapFor(rise)}`);
    }
  }
});

test('Course rises or descends overall, in its stated direction', () => {
  for (const s of SEEDS) {
    const c = generateCourse(s);
    const net = c.platforms[0].y - c.platforms[c.platforms.length - 1].y; // + = rose
    assert.ok(net * c.direction > 0, `seed ${s}: net ${net}, dir ${c.direction}`);
  }
});

test('both directions occur, and Treasure sits on the last platform', () => {
  const dirs = new Set(SEEDS.map((s) => generateCourse(s).direction));
  assert.equal(dirs.size, 2);
  const c = generateCourse(9);
  const last = c.platforms.at(-1);
  assert.equal(c.treasure.y, last.y);
  assert.ok(c.treasure.x > last.x && c.treasure.x < last.x + last.w);
});
