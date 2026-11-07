# 10: Best times in localStorage

Status: ready-for-agent
Blocked by: 04, 05

## What to build

Save the player's best completion time per Condition in the browser's `localStorage` and show it on the menu and the results screen.

## Acceptance criteria

- [ ] On finishing a Course, compare the time to the stored best for that Condition and save it if better.
- [ ] Best times show on the menu and the results screen.
- [ ] If `localStorage` is blocked or empty, the game still works and just shows no best time.
- [ ] Presets and city runs both count toward the Condition they produce.

## Notes

Best times are a rough comparison only, because each Course has a different seed (spec, Respawn and timer).
