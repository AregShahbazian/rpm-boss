# The screen, and what it is made of

One screen, one CSS grid, two layouts, and the same DOM order in both — which
is also the reading order for a screen reader.

Below 600 px, or on any screen taller than it is wide, everything stacks in one
column. At 600 px and wider in landscape it splits into a control column beside
a signal column. The switch is width *and* shape: a waveform gains almost
nothing from height and everything from width, so a portrait tablet keeps the
stacked column rather than collapsing the app into a band across the middle.

There is one waveform, not two. When a result arrives, the crop canvas zooms to
the analysed window and draws a mark on every combustion it found, so the
number and the evidence for it are the same picture. Touching the waveform
widens the view again.

Dark by default rather than the device's choice, with light available in
settings. `prefers-color-scheme: no-preference` was removed from the spec, so a
browser answers `light` both when the user chose light and when they chose
nothing; the two cannot be told apart, and following the device would put most
phones on the light theme.

Seventeen languages. Urdu mirrors the whole layout from one `dir` attribute,
because grid columns follow the inline direction; interpolated values are
wrapped in bidi isolates so a Latin file name keeps its own direction inside an
Urdu sentence.

## Stack

TypeScript, React, Vite, vitest. Hand-written DSP over `Float32Array`, no
audio libraries. Web Audio for decoding, MediaRecorder for recording, canvas
for the waveform. Capacitor for the Android build.

Styling is Tailwind utilities in `className` for anything Tailwind already
names, and an Emotion `css` prop holding real CSS for what it does not — a
nested selector, a two-condition media query, `::backdrop`. The two never mix,
which is what keeps a `css` block readable as CSS. `src/palette.css` is the
only place a shared colour is written down; a one-off colour lives where it is
used. Tailwind's preflight is deliberately not imported, because the app
already has its own small reset.
