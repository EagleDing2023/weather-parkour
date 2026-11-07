import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, label } from '../src/presets.js';
import { CONDITIONS } from '../src/weather.js';
import { EFFECTS } from '../src/effects.js';

test('one Preset per Condition, each as day and night', () => {
  assert.equal(PRESETS.length, CONDITIONS.length * 2);
  for (const c of CONDITIONS) {
    assert.equal(PRESETS.filter((p) => p.condition === c && p.isDay).length, 1, c + ' day');
    assert.equal(PRESETS.filter((p) => p.condition === c && !p.isDay).length, 1, c + ' night');
  }
});

test('every Preset names a real Effect, and labels are capitalised', () => {
  for (const p of PRESETS) assert.ok(Object.hasOwn(EFFECTS, p.condition));
  assert.equal(label('thunderstorm'), 'Thunderstorm');
});
