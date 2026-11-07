# Weather Parkour: Spec

Status: draft, agreed in a grilling session. Terms follow `GLOSSARY.md` (Weather, Condition, Effect, Preset, Crouch, Course, Treasure, Respawn, Lightning Strike).

## Summary

A short desktop browser parkour game. The player runs and jumps along a randomly generated Course to a Treasure. The Weather of a chosen city, or a Preset, sets the Condition, and the Condition's Effect changes how movement feels. A Course takes 30 to 60 seconds.

This is also a first project for testing an agent workflow, so scope stays small: one game, one weather API, four Conditions.

## Platform and stack

- Desktop browser, single player, no accounts, no backend.
- Plain JavaScript and the HTML Canvas API. No framework, no game engine, no TypeScript, no build step.
- Persistence: `localStorage` only (best times).

## Architecture rules

- **Renderer separation.** All drawing lives in one renderer module. Game logic (movement, physics, Course generation, Effects) never draws; it only describes what exists and where. This keeps a later pixel-art restyle a renderer-only change.
- **Course generation is a pure function**: given a seed, return the platform layout. It must be testable without a browser.
- **One seeded random number generator** drives Course layout and Lightning Strike placement so a seed reproduces a run.

## Controls

- Left / Right: `A` / `D` or arrow keys, with acceleration.
- Jump: `W`, up arrow (and Space is not required).
- Crouch: `S` or down arrow. Adds friction so the player stops quickly, and prevents sliding off a platform edge (like Minecraft's sneak).
- Coyote time: jump still works for a few frames after leaving a ledge.
- Jump buffering: a jump pressed just before landing still counts.
- Not included: slide, dash, wall-jump.

## Course

- Randomly generated from a seed, with a fixed platform count so Courses have similar length.
- Has a start and an end, and gradually rises or descends. Completable in 30 to 60 seconds.
- Layout depends only on the seed, not on the Condition. It is built to be passable with Rain's lowest jump, plus a safety margin, so every Condition can finish every Course.
- A new Course gets a fresh random seed. A Respawn restarts the same Course with the same seed.
- Ends at the Treasure. Opening the Treasure (click or key press, so the browser allows it) opens the Rickroll link in a new tab, and the game stays on the finished Course. The exact URL is confirmed with the user at build time.

## Respawn and timer

- Falling off the Course, or being hit by a Lightning Strike, causes a Respawn at the start of the Course.
- The timer starts at the first move, ends when the Treasure is opened, and does not reset on Respawn.
- Best time is saved per Condition in `localStorage`. It is a rough comparison only, since seeds differ.

## Weather source and Conditions

- Provider: Open-Meteo (no API key).
- City search: `https://geocoding-api.open-meteo.com/v1/search?name=<query>` returns `latitude` and `longitude` (checked in the docs).
- Current weather: the forecast endpoint with `weather_code`, a WMO weather code (checked in the docs).
- Day or night: Open-Meteo documents an `is_day` variable. It is documented as an hourly variable; **not yet confirmed for the `current=` parameter, so verify at build time.**
- Weather is read once when a run starts and stays fixed for that run.

Weather code to Condition mapping:

| Condition | WMO codes |
|---|---|
| Clear | 0, 1, 2, 3, 45, 48 |
| Rain | 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 |
| Snow | 71, 73, 75, 77, 85, 86 |
| Thunderstorm | 95, 96, 97, 99 |

Failure handling: if the city is not found or the request fails, show a clear error and keep the menu open so the player can pick a Preset. Never silently fall back to Clear.

## Menu

- Search a city for live Weather, or pick a Preset: one per Condition, each available as day or night, so every Condition can be tried without knowing any cities.

## Effects

| Condition | Effect |
|---|---|
| Clear | Normal movement. The baseline. |
| Rain | Heavy and wet: reduced speed and lower jumps. |
| Snow | Very slippery: low friction. |
| Thunderstorm | Constant random forces pushing the player forward, backward, up or down, plus Lightning Strikes. |

Exact values (friction, speed, jump height, gust strength) are tuned by playing, not fixed in this spec.

## Lightning Strikes (Thunderstorm only)

- A shadow circle appears on a platform near the player; about 0.8 seconds later the strike lands.
- Standing in the circle when it lands causes a Respawn.
- A strike comes roughly every 2 to 4 seconds, placed with the seeded random generator.
- Deliberately the hardest Condition. Timings are tuned by playing.

## Visual style (version one)

- Flat, minimal shapes drawn by code. No image, texture or sound files.
- Sky colour and particles reflect Condition and day or night: clear is blue, rain is grey with streaks, snow is pale with drifting dots, Thunderstorm is dark with white flashes. Night is a darker version with stars. Day and night are visual only and do not change an Effect.

## Out of scope for version one

- Pixel-art sprites (possible later, via the renderer module).
- Sound and music, such as birds by day, crickets by night, or rain. Possible later; browsers require a user click before audio plays, which the menu already provides.
- Slide, dash, wall-jump, fog or wind Effects, accounts, leaderboards, mid-run weather changes.

## Open items for build time

- Confirm `is_day` works with `current=` in Open-Meteo.
- Confirm the Rickroll URL with the user.
- Tune Effect numbers and Lightning Strike timings by playing.
