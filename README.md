# Weather Parkour

**Play it in your browser: <https://eagleding2023.github.io/weather-parkour/>** (desktop only, no download needed)

> **This is a testing project.** It was built to try out an AI-assisted
> development workflow, not to be a polished or maintained game. Expect rough
> edges, and expect numbers that were tuned by feel.

## What this project is for

The goal was to test how well an AI coding agent (Claude Code) can take a small
product from idea to working software when it is driven by written specs and
small tickets:

1. A short spec was agreed first: [`.scratch/weather-parkour/spec.md`](.scratch/weather-parkour/spec.md).
2. Shared vocabulary was written down in [`GLOSSARY.md`](GLOSSARY.md) (Weather, Condition, Effect, Preset, Crouch, Course, Treasure, Respawn, Lightning Strike).
3. The work was split into 10 tickets, kept as plain Markdown files in
   [`.scratch/weather-parkour/issues/`](.scratch/weather-parkour/issues/). Each ticket
   has acceptance criteria, and a comment recording what was built and what was only
   tested in code rather than played.
4. The agent built the tickets one at a time, with tests, while the author
   playtested and gave feedback in plain language. Most of the code was written by
   the AI agent under the author's direction.

Because of that, this repository is as much a record of the workflow as it is a game.

## The game

A short desktop-browser parkour game. You run and jump along a randomly generated
course to a treasure chest. The **real weather** of a city you search for (or a
**Preset** you pick) decides how the game feels:

| Condition | Effect |
|---|---|
| Clear | Normal movement (the baseline). |
| Rain | Heavy and wet: slower, lower jumps. |
| Snow | Very slippery: low friction. Crouch still helps you stop. |
| Thunderstorm | Constant random gusts of wind, plus Lightning Strikes that send you back to the start if you stand in the warning circle. |

Day and night change only the look and sound, never the movement.
A course takes roughly 10 to 20 seconds. Opening the treasure opens a Rickroll link
in a new tab (it is a joke link to a well-known video).

## Run it yourself

The online version above is the easiest way to try it. To run your own copy, you need Python 3 (only to serve the files) and a desktop browser.

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. A local server is needed because browsers
block ES modules (`import`/`export` between files) when you open `index.html` directly.

### Controls

| Action | Keys |
|---|---|
| Move | `A` / `D` or `←` / `→` |
| Jump | `W`, `↑` or `Space` |
| Crouch (stops you fast, stops you walking off an edge) | `S`, `↓` or `Shift` |
| Open the treasure | `E`, `Enter` or click (while touching it) |
| Back to the menu | `Esc` or the Menu button |
| Mute | `M` |

## Tests

You need Node.js 20 or newer (it was developed on Node 22). There are no dependencies to install.

```
node --test tests/*.test.js
```

The tests cover the game logic: movement, collisions, the course generator (many
seeds), Effects, Lightning Strikes, weather lookup (with a fake network), best times,
and the sound and drawing rules. They do **not** prove that the game looks or sounds
right; that was checked by the author playing it.

## How it is built

Plain JavaScript and the HTML Canvas API. No framework, no game engine, no build
step, no image files and no audio files (sound is generated in code with the Web Audio API).

```
index.html          page, menu and results overlays
src/config.js       all physics numbers in one place
src/player.js       movement and collision (no drawing)
src/run.js          one attempt at a course: Respawn, timer, Treasure, events
src/course.js       seeded course generator (a pure function)
src/rng.js          seeded random number generator
src/effects.js      per-Condition overrides, as data
src/storm.js        Thunderstorm gusts and Lightning Strikes
src/weather.js      city search, weather fetch, weather code -> Condition
src/besttimes.js    best times in localStorage
src/menu.js         start menu
src/renderer.js     ALL drawing lives here
src/audio.js        ALL sound lives here
tests/              unit tests (node --test)
```

Two rules shaped the design: game logic never draws or plays sound (it only describes
what exists and reports events), and the same seed always makes the same course.

## Known limits

- Desktop browsers only. No touch controls.
- Single player, no accounts, no leaderboard; best times are stored per browser and
  are a rough comparison only (each course has a different seed).
- Tuning numbers (gust strength, friction, jump height, volumes) are guesses refined by feel.
- Weather is read once when a run starts and does not change mid-run.
- Possible later: pixel-art sprites (a renderer-only change), music, fog and wind Conditions.

## Credits and data

- Weather and city search come from [Open-Meteo](https://open-meteo.com/), which needs
  no API key. Open-Meteo asks for attribution and has terms for free use, so check
  them before using this beyond personal testing.
- The code in this repository is released under the [MIT License](LICENSE). Open-Meteo's data has its own separate terms (see above).
