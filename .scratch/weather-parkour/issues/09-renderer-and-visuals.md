# 09: Renderer with Condition and day or night visuals

Status: ready-for-agent
Blocked by: 01, 03

## What to build

The single renderer module that draws everything with flat shapes on the Canvas, with no image files. Visuals reflect the Condition and day or night.

## Acceptance criteria

- [ ] All drawing lives in one renderer module; game logic never draws.
- [ ] Draws the player, platforms, the Treasure, the timer, and a camera that follows the player.
- [ ] Sky and particles per Condition: Clear is blue, Rain is grey with streaks, Snow is pale with drifting dots, Thunderstorm is dark with white flashes.
- [ ] Night is a darker version with stars. Day and night are visual only and do not change any Effect.
- [ ] Draws the Lightning Strike warning circle and the strike when issue 07 provides them.
- [ ] No sprites, textures or audio files.

## Notes

Keeping the renderer separate is what lets a later pixel-art restyle replace only this module.
