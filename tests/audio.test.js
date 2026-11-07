import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneFor, gustLevel, windTarget, createAudio } from '../src/audio.js';
import { createRun } from '../src/run.js';
import { createPlayer, stepPlayer } from '../src/player.js';
import { getPhysics } from '../src/effects.js';
import { STEP, PHYSICS } from '../src/config.js';

const none = { left: false, right: false, jump: false, crouch: false };
const floor = [{ x: -500, y: 500, w: 3000, h: 40 }];

test('scenes: birds by day and crickets at night on Clear; rain; wind over light rain; Snow silent', () => {
  assert.deepEqual(sceneFor('clear', true), { rain: 0, wind: 0, birds: 1, crickets: 0 });
  assert.deepEqual(sceneFor('clear', false), { rain: 0, wind: 0, birds: 0, crickets: 1 });
  for (const day of [true, false]) {
    assert.ok(sceneFor('rain', day).rain > 0.5);
    assert.equal(sceneFor('rain', day).wind, 0);
    assert.ok(sceneFor('thunderstorm', day).wind > 0);
    assert.ok(sceneFor('thunderstorm', day).rain > 0 && sceneFor('thunderstorm', day).rain < sceneFor('rain', day).rain);
    assert.deepEqual(sceneFor('snow', day), { rain: 0, wind: 0, birds: 0, crickets: 0 });
  }
  assert.deepEqual(sceneFor(null), { rain: 0, wind: 0, birds: 0, crickets: 0 }); // menu
});

test('wind gets louder with the gust, stays quiet without a wind layer', () => {
  assert.equal(gustLevel({ x: 0, y: 0 }, 600), 0);
  assert.equal(gustLevel({ x: 300, y: 0 }, 600), 0.5);
  assert.equal(gustLevel({ x: 3000, y: 4000 }, 600), 1);
  assert.equal(gustLevel({ x: 100, y: 0 }, 0), 0);
  assert.ok(windTarget(0.3, 1) > windTarget(0.3, 0.5) && windTarget(0.3, 0.5) > windTarget(0.3, 0));
  assert.equal(windTarget(0, 1), 0);
});

test('player reports a jump on exactly one step, and a landing with its speed', () => {
  const p = createPlayer(100, 460);
  for (let i = 0; i < 5; i++) stepPlayer(p, none, floor, STEP);
  assert.equal(p.justJumped, false);
  assert.equal(p.landSpeed, 0, 'standing still is not a landing');
  stepPlayer(p, { ...none, jump: true }, floor, STEP);
  assert.equal(p.justJumped, true);
  stepPlayer(p, { ...none, jump: true }, floor, STEP);
  assert.equal(p.justJumped, false, 'held jump does not report again');
  let landed = 0, landSpeed = 0;
  for (let i = 0; i < 200; i++) {
    stepPlayer(p, none, floor, STEP);
    if (p.landSpeed > 0) { landed++; landSpeed = p.landSpeed; }
  }
  assert.equal(landed, 1);
  assert.ok(landSpeed > 400, 'fell back down at speed, got ' + landSpeed);
});

test('run emits jump and land events; none while standing or walking', () => {
  const r = createRun({ platforms: floor, start: { x: 100, y: 460 }, treasure: { x: 800, y: 500 }, seed: 1 });
  for (let i = 0; i < 30; i++) r.update({ ...none, right: true }, STEP);
  assert.equal(r.events.length, 0, 'walking makes no jump/land events');
  r.update({ ...none, jump: true }, STEP);
  assert.deepEqual(r.events.map((e) => e.type), ['jump']);
  r.events.length = 0;
  for (let i = 0; i < 200; i++) r.update(none, STEP);
  const lands = r.events.filter((e) => e.type === 'land');
  assert.equal(lands.length, 1);
  assert.ok(lands[0].speed > 150);
});

test('run emits thunder once per strike that lands (Thunderstorm only)', () => {
  const plats = [{ x: 0, y: 500, w: 600, h: 24 }];
  const mk = (cond) => createRun({ platforms: plats, start: { x: 50, y: 460 }, treasure: { x: 500, y: 500 }, seed: 2, physics: getPhysics(cond), condition: cond });
  const crouch = { ...none, crouch: true };
  const count = (r) => { let n = 0; for (let i = 0; i < 60 * 30; i++) { r.update(crouch, STEP); n += r.events.filter((e) => e.type === 'thunder').length; r.events.length = 0; } return n; };
  const n = count(mk('thunderstorm'));
  assert.ok(n >= 6 && n <= 16, 'about one every 2-4 s over 30 s, got ' + n);
  assert.equal(count(mk('clear')), 0);
});

// A minimal fake of the Web Audio API that records what was built and played.
function fakeAudioContext() {
  const log = { oscillators: 0, sources: 0, filters: 0, gains: 0, resumed: 0, started: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(v) { this.target = v; } });
  const node = (extra = {}) => ({ connect(n) { return n; }, ...extra });
  class Ctx {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'suspended'; this.destination = node(); }
    resume() { log.resumed++; this.state = 'running'; }
    createGain() { log.gains++; return node({ gain: param() }); }
    createOscillator() { log.oscillators++; return node({ frequency: param(), start() { log.started++; }, stop() {} }); }
    createBiquadFilter() { log.filters++; return node({ frequency: param(), Q: param() }); }
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d }; }
    createBufferSource() { log.sources++; return node({ start() { log.started++; }, stop() {} }); }
  }
  return { Ctx, log };
}

test('audio engine: builds, plays every event, switches scenes and mutes without throwing', () => {
  const { Ctx, log } = fakeAudioContext();
  const a = createAudio(Ctx);
  a.setScene({ condition: 'thunderstorm', isDay: true }); // before unlock: remembered
  a.unlock();
  assert.equal(log.resumed, 1);
  assert.ok(log.sources >= 2, 'rain and wind beds exist');
  const before = log.oscillators + log.sources;
  for (const ev of [{ type: 'jump' }, { type: 'land', speed: 800 }, { type: 'thunder' }, { type: 'nonsense' }]) a.play(ev);
  assert.ok(log.oscillators + log.sources > before, 'events make sound');
  a.update({ x: 300, y: 0 }, PHYSICS.gustStrength || 600);
  a.setScene({ condition: 'clear', isDay: false });
  a.setScene(null);
  assert.equal(a.isMuted(), false);
  assert.equal(a.toggleMute(), true);
  assert.equal(a.toggleMute(), false);
});

test('audio engine: no AudioContext available (or it throws) is silently harmless', () => {
  for (const Bad of [undefined, class { constructor() { throw new Error('blocked'); } }]) {
    const a = createAudio(Bad);
    a.unlock(); a.setScene({ condition: 'rain', isDay: true }); a.play({ type: 'jump' }); a.update({ x: 1, y: 1 }, 600);
    assert.equal(a.toggleMute(), true);
  }
});
