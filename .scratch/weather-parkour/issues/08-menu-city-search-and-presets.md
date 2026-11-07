# 08: Menu with city search and Presets

Status: ready-for-agent
Blocked by: 05

## What to build

A start menu where the player either searches a city for live Weather, or picks a Preset, so any Condition can be tried without knowing a city.

## Acceptance criteria

- [ ] Search box that uses the issue 05 lookup; shows the resulting Condition before starting.
- [ ] One Preset per Condition (Clear, Rain, Snow, Thunderstorm), each available as day or night.
- [ ] Picking a Preset starts a run instantly with no network request.
- [ ] A failed or unknown city shows a clear error and leaves the menu usable.
- [ ] Starting a run starts a Course with a fresh random seed.

## Notes

Use the term "Preset" (see `GLOSSARY.md`).
