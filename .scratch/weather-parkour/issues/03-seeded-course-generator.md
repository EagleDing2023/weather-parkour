# 03: Seeded Course generator

Status: resolved
Blocked by: none

## What to build

A pure function: given a seed, return the Course layout (a list of platforms plus the Treasure position). No drawing, no browser APIs, so it can be tested on its own. Includes a small seeded random number generator that other features can reuse.

## Acceptance criteria

- [ ] Same seed gives an identical layout; different seeds give different layouts.
- [ ] Fixed platform count, so Courses have similar length.
- [ ] The Course gradually rises or descends overall.
- [ ] Every gap and height change is jumpable with Rain's lowest jump plus a safety margin, so every Condition can finish every Course.
- [ ] Tests cover determinism and that all gaps respect the jump limit across many seeds.
- [ ] The seeded generator is exported for reuse (Lightning Strike placement, issue 07).

## Notes

Layout depends only on the seed, never on the Condition (spec, Course section). The Rain jump limit comes from the physics config in issue 01, so read it from there rather than copying numbers.

## Comments

- Built in `02dc17b`. Tested in Node (500 seeds) and with a real-physics check. Rain limit now comes from `WORST_CASE` in config.
