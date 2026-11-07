// Movement and collision. No drawing here (see renderer.js).
import { PHYSICS, PLAYER_SIZE } from './config.js';

const NO_FORCE = { x: 0, y: 0 };

export function createPlayer(x, y) {
  return {
    x, y, vx: 0, vy: 0,
    w: PLAYER_SIZE.w, h: PLAYER_SIZE.h,
    onGround: false,
    coyote: 0,        // time left in which a jump is still allowed
    buffer: 0,        // time left in which a pressed jump is remembered
    jumpHeld: false,  // for edge detection: one press = one jump
    crouching: false,
    justJumped: false, // true for the step in which a jump started (for sound)
    landSpeed: 0,      // downward speed on the step the player landed, else 0
  };
}

const overlaps = (a, p) =>
  a.x < p.x + p.w && a.x + a.w > p.x && a.y < p.y + p.h && a.y + a.h > p.y;

// input: { left, right, jump, crouch } booleans. platforms: [{x,y,w,h}].
// force: extra acceleration in px/s^2 (Thunderstorm gusts), added after gravity.
export function stepPlayer(p, input, platforms, dt, cfg = PHYSICS, force = NO_FORCE) {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.justJumped = false;
  p.landSpeed = 0;
  p.crouching = input.crouch && p.onGround;
  const air = p.onGround ? 1 : cfg.airControl;

  // Horizontal: accelerate toward the held direction, else apply friction.
  const cap = p.crouching ? cfg.crouchMaxSpeed : cfg.maxSpeed;
  if (dir !== 0) {
    const f = (p.crouching ? cfg.crouchFriction : cfg.friction) * dt;
    const along = p.vx * dir; // speed in the held direction (negative = moving against it)
    if (along < cap) {
      // Accelerate, but never past the cap.
      p.vx = Math.min(along + cfg.accel * air * dt, cap) * dir;
    } else {
      // Already over the cap (e.g. just started crouching): bleed off, don't add more.
      p.vx = Math.max(cap, along - f) * dir;
    }
  } else {
    const f = (p.crouching ? cfg.crouchFriction : cfg.friction) * air * dt;
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
  }

  // Jump timers. A press starts the buffer; coyote refills while grounded.
  const pressed = input.jump && !p.jumpHeld;
  p.jumpHeld = input.jump;
  if (pressed) p.buffer = cfg.jumpBuffer; else p.buffer = Math.max(0, p.buffer - dt);
  if (p.onGround) p.coyote = cfg.coyoteTime; else p.coyote = Math.max(0, p.coyote - dt);

  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -cfg.jumpSpeed;
    p.justJumped = true;
    p.buffer = 0;
    p.coyote = 0;
    p.onGround = false;
  }

  p.vy = Math.min(p.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  p.vx += force.x * dt;
  p.vy += force.y * dt;

  // Move X, then resolve; then Y. Separate axes make collisions simple.
  const wasGrounded = p.onGround;
  const oldX = p.x;
  p.x += p.vx * dt;
  for (const pl of platforms) {
    if (!overlaps(p, pl)) continue;
    if (p.vx > 0) p.x = pl.x - p.w; else if (p.vx < 0) p.x = pl.x + pl.w;
    p.vx = 0;
  }

  // Crouch edge guard: if crouching on the ground, refuse a move that
  // leaves no platform under the player.
  if (p.crouching && wasGrounded && !hasSupport(p, platforms)) {
    p.x = oldX;
    p.vx = 0;
  }

  p.onGround = false;
  p.y += p.vy * dt;
  for (const pl of platforms) {
    if (!overlaps(p, pl)) continue;
    if (p.vy > 0) {
      p.y = pl.y - p.h; p.onGround = true;
      if (!wasGrounded) p.landSpeed = Math.max(p.landSpeed, p.vy);
    }
    else if (p.vy < 0) p.y = pl.y + pl.h;
    p.vy = 0;
  }
}

// True if some platform top sits directly under the player's feet.
function hasSupport(p, platforms) {
  const feet = { x: p.x, y: p.y + p.h, w: p.w, h: 2 };
  return platforms.some((pl) => overlaps(feet, pl));
}
