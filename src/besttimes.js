// Best completion time per Condition, kept in localStorage.
// Every storage access is guarded: if storage is blocked, full or corrupted,
// the game still works and simply has no best times.
import { CONDITIONS } from './weather.js';

const KEY = 'weather-parkour:best-times';

// Accessing `localStorage` itself can throw (blocked site data, some private modes).
export function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const round2 = (s) => Math.round(s * 100) / 100;

export function createBestTimes(storage = browserStorage()) {
  // Read the saved table, keeping only valid entries for known Conditions.
  function load() {
    try {
      const raw = JSON.parse(storage?.getItem(KEY) ?? 'null');
      if (!raw || typeof raw !== 'object') return {};
      const out = {};
      for (const c of CONDITIONS) {
        const v = raw[c];
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[c] = v;
      }
      return out;
    } catch {
      return {};
    }
  }

  return {
    // Best time in seconds for a Condition, or null if none.
    get(condition) {
      return load()[condition] ?? null;
    },

    // Save `seconds` if it beats the stored best. Returns { isBest, best, saved }.
    // saved is false when storage is unavailable (isBest is then false too).
    record(condition, seconds) {
      const t = round2(seconds);
      if (!CONDITIONS.includes(condition) || !Number.isFinite(t) || t <= 0) {
        return { isBest: false, best: this.get(condition), saved: false };
      }
      const table = load();
      const previous = table[condition] ?? null;
      if (previous !== null && t >= previous) return { isBest: false, best: previous, saved: true };
      table[condition] = t;
      try {
        storage.setItem(KEY, JSON.stringify(table));
        return { isBest: true, best: t, saved: true };
      } catch {
        return { isBest: false, best: previous, saved: false };
      }
    },
  };
}
