// Presets: a menu choice that supplies a Condition and day or night directly,
// with no network request. One per Condition, each as day and night.
import { CONDITIONS } from './weather.js';

export const PRESETS = CONDITIONS.flatMap((condition) => [
  { condition, isDay: true },
  { condition, isDay: false },
]);

export const label = (condition) => condition[0].toUpperCase() + condition.slice(1);
