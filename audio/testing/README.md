# Test aids

Not ground truth — the verified fixtures are the seven recordings one level up,
with their pulse counts in `../combustion-counts.md`.

- `all-samples.m4a` — the seven recordings joined end to end (~68 s), for
  exercising the long-clip path: the overview strip, the detail view and
  placing a window far from the start. The RPM changes between sections, so a
  reading is only meaningful within one of them.
- `too-short-0.5s.m4a` — half a second, for the "clip is too short" gate.

Regenerate with the ffmpeg commands in the repo README.
