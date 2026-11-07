# 01: Game loop, player movement and Crouch

Status: resolved
Blocked by: none

## What to build

A page with a Canvas, a per-frame game loop, and a player who moves on a flat test platform. This is the foundation for everything else, so keep physics values in one config object (later issues change them per Condition).

## Acceptance criteria

- [ ] Left/Right via `A`/`D` and arrow keys, with acceleration and friction.
- [ ] Jump via `W` and up arrow, with gravity.
- [ ] Coyote time: jump works for a few frames after leaving a ledge.
- [ ] Jump buffering: a jump pressed just before landing still triggers.
- [ ] Crouch via `S` and down arrow: adds friction so the player stops quickly, and the player cannot slide off a platform edge while crouching.
- [ ] Physics values (gravity, acceleration, friction, jump strength) live in one config object, not scattered through the code.
- [ ] Movement logic does not draw; drawing goes through a separate renderer module (see spec, Architecture rules).

## Notes

No Effects yet; this is the Clear baseline. Feel is tuned by a human playing it.

## Comments

- Built in `e3e1687`. Tested in Node. Physics numbers are placeholders; feel still needs human tuning.
