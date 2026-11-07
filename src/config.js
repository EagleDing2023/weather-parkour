// All tunable physics values live here. Later issues override these per Condition.
// Units: pixels and seconds. y grows downward, so gravity is positive.
export const PHYSICS = {
  gravity: 2200,          // px/s^2 pulling down
  maxFallSpeed: 1400,     // terminal velocity
  accel: 2600,            // px/s^2 when a direction key is held
  friction: 1800,         // px/s^2 slowing down on the ground with no input
  airControl: 0.6,        // multiplier on accel/friction while airborne
  maxSpeed: 360,          // px/s horizontal cap
  jumpSpeed: 760,         // initial upward px/s on jump
  crouchFriction: 7000,   // much stronger friction while crouching
  crouchMaxSpeed: 120,    // sneaking is slow, like Minecraft
  coyoteTime: 0.1,        // s a jump still works after leaving a ledge
  jumpBuffer: 0.1,        // s a jump press is remembered before landing
};

export const PLAYER_SIZE = { w: 28, h: 40 };
export const STEP = 1 / 60; // fixed simulation timestep (s)

// Course generation assumes the weakest movement any Condition can have, so
// every Course is finishable everywhere. Issue 06 (Rain) must stay at or above
// these multipliers. Placeholder values, tuned by playing.
export const WORST_CASE = { jumpScale: 0.8, speedScale: 0.8 };

export const RICKROLL_URL = 'https://www.youtube.com/watch?v=oHg5SJYRHA0';
export const TREASURE_SIZE = { w: 36, h: 28 };
