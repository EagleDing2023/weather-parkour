// Effects as data: per-Condition overrides applied on top of the base PHYSICS.
// No Condition-specific `if` checks elsewhere; the game just uses getPhysics().
import { PHYSICS, WORST_CASE } from './config.js';

export const EFFECTS = {
  clear: {}, // baseline: leaves PHYSICS unchanged

  // Heavy and wet. Defined from WORST_CASE so the Course generator and Rain
  // share one source of truth: Courses are built to be passable with exactly this.
  rain: {
    jumpSpeed: PHYSICS.jumpSpeed * WORST_CASE.jumpScale,
    maxSpeed: PHYSICS.maxSpeed * WORST_CASE.speedScale,
  },

  // Very slippery. Crouch still brakes much harder than normal Snow friction,
  // but far less than on Clear (1500 vs 7000), so it stays slippery.
  snow: {
    friction: 250,
    crouchFriction: 1500,
  },

  thunderstorm: {}, // gusts and Lightning Strikes arrive in issue 07
};

// Returns a new physics config for the Condition; PHYSICS itself is never mutated.
export function getPhysics(condition) {
  const overrides = EFFECTS[condition];
  if (!overrides) throw new Error(`Unknown Condition: ${condition}`);
  return { ...PHYSICS, ...overrides };
}
