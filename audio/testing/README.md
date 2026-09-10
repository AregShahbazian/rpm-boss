# Test aids

Not ground truth — the verified fixtures are the seven recordings one level up,
with their pulse counts in `../combustion-counts.md`.

- `all-samples.m4a` — the seven recordings joined end to end (~68 s), for
  exercising the long-clip path: the overview strip, the detail view and
  placing a window far from the start. The RPM changes between sections, so a
  reading is only meaningful within one of them.
- `too-short-0.5s.m4a` — half a second, for the "clip is too short" gate.

## Non-engine clips

Five seconds each, for the "couldn't hear a steady engine" path. The number is
the confidence the analysis gives them after the AAC round trip, against a
threshold of 0.45; see the phase 4 design for where that threshold comes from.

| clip | what it is | confidence | expected |
|---|---|---|---|
| `noise-white.m4a` | broadband hiss, the phone pointed at nothing | 0.22 | refused |
| `noise-room.m4a` | a quiet room, almost nothing to hear | 0.21 | refused |
| `noise-rumble.m4a` | low rumble, wind or a hand over the mic | 0.21 | refused |
| `noise-speech.m4a` | a voiced tone swinging in loudness a few times a second | 0.00 | refused |
| `noise-tone.m4a` | a steady 1 kHz tone | 1.77 | **accepted**, wrongly |

The last one is deliberate. A flat envelope correlates with itself at every
lag, so a pure tone scores higher than any engine. It is the known limitation
recorded in the phase 4 review, kept here so the behaviour is demonstrable
rather than theoretical. Nothing that comes out of a microphone in a garage
looks like it.

Regenerate with the ffmpeg commands in the repo README.
