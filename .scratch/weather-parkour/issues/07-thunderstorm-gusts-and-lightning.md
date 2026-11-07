# 07: Thunderstorm: random forces and Lightning Strikes

Status: resolved
Blocked by: 01, 02, 03, 05

## What to build

The Thunderstorm Effect: constant random forces on the player, plus Lightning Strikes. This is deliberately the hardest Condition.

## Acceptance criteria

- [ ] Constant random forces push the player forward, backward, up or down, with strength set in the physics config.
- [ ] A shadow circle appears on a platform near the player, and about 0.8 seconds later the strike lands.
- [ ] Standing in the circle when it lands causes a Respawn (issue 02).
- [ ] A strike comes roughly every 2 to 4 seconds, with placement drawn from the seeded generator (issue 03).
- [ ] Strike timings and gust strength are values in config, not hard-coded.

## Notes

Timings are tuned by playing. The telegraph (the warning circle) is required for fairness.

## Comments

- Built in `dfd531d`. Tested in Node. User played it: gusts and lightning feel OK. Strength 600 and strike timings are still tunable in config.
