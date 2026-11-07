# 06: Effects: Rain and Snow

Status: ready-for-agent
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
