# 06: Effects: Rain and Snow

Status: resolved
Blocked by: 01, 05

## What to build

Apply the Effect for the active Condition to the physics config. Clear is the baseline, so this issue adds Rain and Snow.

## Acceptance criteria

- [ ] Clear leaves the physics config unchanged.
- [ ] Rain: reduced speed and lower jumps ("heavy and wet").
- [ ] Snow: very slippery, meaning low friction.
- [ ] Effects are data (a table of overrides per Condition), not scattered `if` checks.
- [ ] Rain's jump value is exposed so the Course generator (issue 03) uses it as its limit.
- [ ] Crouch still adds friction under Snow (it still helps the player stop), but does not remove the slipperiness entirely.

## Notes

Exact numbers are not fixed in the spec. Pick starting values, then ask the user to playtest and adjust.

## Notes from issue 03

The Course generator (`src/course.js`) already limits gaps and rises using `WORST_CASE` in `src/config.js` (`jumpScale: 0.8`, `speedScale: 0.8`, as multipliers on the Clear `jumpSpeed` and `maxSpeed`). These are placeholders, because Rain did not exist yet.

- Rain's `jumpSpeed` must be at least `PHYSICS.jumpSpeed * WORST_CASE.jumpScale`, and its `maxSpeed` at least `PHYSICS.maxSpeed * WORST_CASE.speedScale`. Otherwise some Courses become unfinishable under Rain.
- Preferred fix: define Rain's overrides from `WORST_CASE` (or the reverse: derive `WORST_CASE` from the Rain override), so there is one source of truth, and the criterion above ("Rain's jump value is exposed...") is met by that.
- Snow and Thunderstorm must not reduce jump height or max speed below Rain. Thunderstorm gusts can push the player either way, so check they cannot make a gap impossible.
- Add a test that fails if Rain falls below `WORST_CASE`.

## Comments

- Built in `9eb62eb`. Tested in Node. Also fixed an unbounded speed-gain bug in movement. Rain and Snow numbers were playtested once by the user (Snow speed fixed); further tuning welcome.
