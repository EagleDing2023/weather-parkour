# 09: Renderer with Condition and day or night visuals

Status: resolved
Blocked by: 01, 03

## What to build

The single renderer module that draws everything with flat shapes on the Canvas, with no image files. Visuals reflect the Condition and day or night.

## Acceptance criteria

- [ ] All drawing lives in one renderer module; game logic never draws.
- [ ] Draws the player, platforms, the Treasure, the timer, and a camera that follows the player.
- [ ] Sky and particles per Condition: Clear is blue, Rain is grey with streaks, Snow is pale with drifting dots, Thunderstorm is dark with white flashes.
- [ ] Night is a darker version with stars. Day and night are visual only and do not change any Effect.
- [ ] Draws the Lightning Strike warning circle and the strike when issue 07 provides them.
- [ ] Clouds in the sky: sparse and light for Clear, heavy and dark for Rain and Thunderstorm.
- [ ] Wind is visible: in Thunderstorm, falling rain slants in the direction of the current gust (`run.storm.force`) and slants more for a stronger gust. Visual only.
- [ ] No sprites, textures or audio files.

## Notes

Keeping the renderer separate is what lets a later pixel-art restyle replace only this module.

## Added after playtesting issue 07

- Request from the user: rain and darkness with clouds, and the falling direction of the rain shows where the wind pushes and how strong it is.
- Day and night is not chosen anywhere until issue 08 (menu). Until then, a temporary `?night=1` URL switch (like `?condition=`) lets the renderer be tested at night. Remove it when the menu lands.

## Comments

- Built in `0a51c86`. Renderer smoke-tested for all 8 Condition/day-night combinations with a fake canvas; it has not been seen in a real browser. Added clouds and wind-slanted rain (user request).
