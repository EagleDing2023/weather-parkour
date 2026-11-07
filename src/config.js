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

  // Thunderstorm. Off in the baseline; effects.js switches them on.
  gustStrength: 0,        // max px/s^2 of the random force (0 = no gusts)
  gustIntervalMin: 0.4,   // s before the gust changes direction and strength
  gustIntervalMax: 1.0,
  strikeEnabled: false,   // Lightning Strikes on/off
  strikeIntervalMin: 2,   // s between strikes
  strikeIntervalMax: 4,
  strikeTelegraph: 0.8,   // s the warning circle shows before the strike lands
  strikeRadius: 55,       // px, radius of the circle on the platform
  strikeRange: 350,       // px: strikes target platforms this close (horizontally) to the player
  strikeFlash: 0.15,      // s the lightning bolt stays visible
};

export const PLAYER_SIZE = { w: 28, h: 40 };
export const STEP = 1 / 60; // fixed simulation timestep (s)

// Course generation assumes the weakest movement any Condition can have, so
// every Course is finishable everywhere. Issue 06 (Rain) must stay at or above
// these multipliers. Placeholder values, tuned by playing.
export const WORST_CASE = { jumpScale: 0.8, speedScale: 0.8 };

export const RICKROLL_URL = 'https://www.youtube.com/watch?v=oHg5SJYRHA0';
export const TREASURE_SIZE = { w: 36, h: 28 };
