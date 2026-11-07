// Sound, made entirely in code with the browser's Web Audio API: noise and tones
// shaped by filters and volume envelopes. No audio files (see spec).
// Game logic only reports events ('jump', 'land', 'thunder'); this module decides
// what they sound like.
//
// Browsers only start audio after a user gesture, so call unlock() from a click
// or key press (the menu's Start/Preset buttons count).

export const SOUND_MASTER = 0.6;
const RAIN_GAIN = 0.12;
const WIND_GAIN = 0.22;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Pure: how loud each ambient layer is (0-1) for a Condition and day/night.
//   Clear: birds by day, crickets by night.  Rain: steady rain.
//   Thunderstorm: wind (follows the gusts) over light rain.  Snow: hushed, silent.
export function sceneFor(condition, isDay) {
  const s = { rain: 0, wind: 0, birds: 0, crickets: 0 };
  if (condition === 'clear') { if (isDay) s.birds = 1; else s.crickets = 1; }
  else if (condition === 'rain') s.rain = 0.8;
  else if (condition === 'thunderstorm') { s.rain = 0.35; s.wind = 0.3; }
  return s;
}

// Pure: 0-1 strength of the current gust, relative to the Condition's maximum.
export function gustLevel(force, maxStrength) {
  if (!(maxStrength > 0)) return 0;
  return clamp(Math.hypot(force.x, force.y) / maxStrength, 0, 1);
}

// Pure: wind volume. `base` is the scene's wind level; stronger gusts are louder.
export function windTarget(base, gust) {
  return base > 0 ? WIND_GAIN * (base + (1 - base) * gust) : 0;
}

export function createAudio(Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext) {
  let ctx = null, master = null, noiseBuf = null, rainGain = null, windGain = null;
  let scene = sceneFor(null);
  let muted = false;
  const timers = { birds: null, crickets: null };

  // ---- building blocks ----

  function tone(type, f0, f1, peak, dur, delay = 0) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  function noiseBurst(filterType, freq, peak, dur, delay = 0, attack = 0.005) {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = filterType; f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  // A looping noise bed through filters into its own volume control.
  function noiseBed(filters) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    let node = src;
    for (const [type, freq, q] of filters) {
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq;
      if (q) f.Q.value = q;
      node.connect(f); node = f;
    }
    const g = ctx.createGain();
    g.gain.value = 0;
    node.connect(g); g.connect(master);
    src.start();
    return { gain: g, filter: node };
  }

  function init() {
    if (ctx || !Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : SOUND_MASTER;
    master.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    rainGain = noiseBed([['highpass', 1100], ['lowpass', 9000]]).gain;
    const wind = noiseBed([['bandpass', 520, 0.7]]);
    windGain = wind.gain;
    const lfo = ctx.createOscillator(), lfoDepth = ctx.createGain(); // slow swell in the wind's pitch
    lfo.frequency.value = 0.18; lfoDepth.gain.value = 220;
    lfo.connect(lfoDepth); lfoDepth.connect(wind.filter.frequency);
    lfo.start();
    applyScene();
  }

  // ---- ambience ----

  function chirpPhrase() {
    const n = 2 + Math.floor(Math.random() * 3), f0 = 2200 + Math.random() * 1000;
    for (let i = 0; i < n; i++) tone('sine', f0 * (1 + i * 0.05), f0 * (1.35 + i * 0.04), 0.05 * scene.birds, 0.08, i * 0.11);
  }
  function cricketBurst(freq) {
    for (let i = 0; i < 3; i++) tone('sine', freq, freq, 0.02 * scene.crickets, 0.03, i * 0.055);
  }
  function loopLater(name, minMs, spanMs, active, fn) {
    clearTimeout(timers[name]);
    timers[name] = null;
    if (!ctx || !active()) return;
    fn();
    timers[name] = setTimeout(() => loopLater(name, minMs, spanMs, active, fn), minMs + Math.random() * spanMs);
  }

  function applyScene() {
    if (!ctx) return;
    const now = ctx.currentTime;
    rainGain.gain.setTargetAtTime(scene.rain * RAIN_GAIN, now, 0.4);
    windGain.gain.setTargetAtTime(windTarget(scene.wind, 0), now, 0.4);
    loopLater('birds', 700, 2600, () => scene.birds > 0, chirpPhrase);
    loopLater('crickets', 450, 500, () => scene.crickets > 0, () => cricketBurst(4300 + Math.random() * 300));
  }

  // Audio must never break the game: every public call is guarded.
  const safe = (fn) => (...args) => { try { return fn(...args); } catch { return undefined; } };

  return {
    // Call from a click or key press. Starts (or resumes) the audio engine.
    unlock: safe(() => {
      init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }),

    // { condition, isDay } for a run, or null (menu) to silence the ambience.
    setScene: safe((next) => {
      scene = sceneFor(next?.condition, next?.isDay);
      applyScene();
    }),

    // Each frame: wind loudness follows the current gust (force in px/s^2).
    update: safe((force, maxStrength) => {
      if (!ctx) return;
      windGain.gain.setTargetAtTime(windTarget(scene.wind, gustLevel(force, maxStrength)), ctx.currentTime, 0.25);
    }),

    play: safe((event) => {
      if (!ctx) return;
      if (event.type === 'jump') {
        tone('triangle', 280, 560, 0.14, 0.11);
      } else if (event.type === 'land') {
        const k = clamp(event.speed / 900, 0.15, 1); // harder landing, louder thud
        noiseBurst('lowpass', 650, 0.4 * k, 0.12);
        tone('sine', 120, 45, 0.35 * k, 0.15);
      } else if (event.type === 'thunder') {
        noiseBurst('highpass', 2200, 0.3, 0.12);                 // the crack
        noiseBurst('lowpass', 190, 0.7, 1.9, 0.12, 0.25);        // the rumble
      }
    }),

    toggleMute: safe(() => {
      muted = !muted;
      if (ctx) master.gain.setTargetAtTime(muted ? 0 : SOUND_MASTER, ctx.currentTime, 0.02);
      return muted;
    }),
    isMuted: () => muted,
  };
}
