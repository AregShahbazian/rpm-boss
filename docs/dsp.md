# How the number is found

The audio is band-passed (60-2000 Hz), rectified and low-passed into an
envelope that follows the combustion pulses. The pulse rate comes from the
autocorrelation of that envelope over one-second windows, cross-checked by
counting peaks. RPM = pulses per second x 60 x revolutions per pulse (2 for a
4-stroke single, 1 for a 2-stroke).

The method fails by a factor of two when it fails, which is why the app draws a
mark on every combustion it counted: a comb that skips every other beat is
obvious to a person and invisible in a number.

## The fixtures

Seven real idle recordings with independently verified pulse counts live in
`audio/` and, decoded to 16 kHz mono, in `test/fixtures/`. The test suite judges
every change to the analysis against them, so `npm test` is the thing that says
whether a change to the DSP was an improvement.

`audio/testing/` holds two aids that are not ground truth: `all-samples.m4a`,
the seven recordings joined end to end (~68 s) for the long-clip path, and
`too-short-0.5s.m4a` for the minimum-length gate. Regenerate them with:

```bash
for f in audio/sample-*.m4a; do ffmpeg -y -i "$f" -ac 1 -ar 48000 "/tmp/$(basename "$f" .m4a).wav"; done
printf "file '%s'\n" /tmp/sample-*.wav > /tmp/cat.txt
ffmpeg -y -f concat -safe 0 -i /tmp/cat.txt -c:a aac -b:a 96k audio/testing/all-samples.m4a
ffmpeg -y -i audio/sample-4.m4a -t 0.5 -c:a aac -b:a 96k audio/testing/too-short-0.5s.m4a
```

Fixture names predate the renumbering, so the mapping is read back out of
`expected.json` rather than derived from the file name:

```bash
jq -r '.fixtures[] | "\(.source) \(.file)"' test/fixtures/expected.json |
  while read -r src dst; do ffmpeg -y -i "audio/$src" -ac 1 -ar 16000 "test/fixtures/$dst"; done
```
