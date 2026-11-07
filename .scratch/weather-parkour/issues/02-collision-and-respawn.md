# 02: Collision, Respawn and the timer

Status: ready-for-agent
Blocked by: 01

## What to build

Platforms the player can stand on and collide with, a fall detector, Respawn to the start, and the run timer.

## Acceptance criteria

- [ ] The player lands on and collides with platforms (top, sides and underside).
- [ ] Falling below the lowest platform causes a Respawn at the start of the Course.
- [ ] Respawn is a callable function so Lightning Strikes (issue 07) can use it.
- [ ] The timer starts at the first player input, and does not reset on Respawn.
- [ ] The timer stops when told to (the Treasure, issue 04).

## Notes

Terms follow `GLOSSARY.md`: "Respawn", not "death" or "game over".
