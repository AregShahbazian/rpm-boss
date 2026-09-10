# rpm-boss

Engine RPM from sound. Record a running engine with your phone, or load a
recording, and get the RPM as one number.

Targets simple engines first: single cylinder, not running too smoothly, such
as a motorcycle or generator at idle. Runs entirely on the device: no backend,
no account.

**Status:** proof of concept, in progress. Android app (via Capacitor) and the
same app in a mobile browser.

## How it works

The audio is band-passed (60-2000 Hz), rectified and low-passed into an
envelope that follows the combustion pulses. The pulse rate comes from the
autocorrelation of that envelope over one-second windows, cross-checked by
counting peaks. RPM = pulses per second x 60 x revolutions per pulse (2 for a
4-stroke single, 1 for a 2-stroke).

Seven real idle recordings with independently verified pulse counts live in
`audio/` and, decoded to 16 kHz mono, in `test/fixtures/`. The test suite judges
every change to the analysis against them.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173, desktop browser
npm test           # vitest over the fixtures
npm run lint
npm run build
```

Phone testing, with the dev server on the laptop:

```bash
./scripts/dev.sh   # or: npm run dev:phone
```

Serves on the LAN and, when a phone is attached over USB with debugging on,
runs `adb reverse` so `http://localhost:5173` on the phone reaches the laptop.
The localhost origin is what lets Chrome use the microphone; the LAN address
works for file upload only.

Fixtures are regenerated from the originals with:

```bash
for f in audio/*.aac; do b=$(basename "$f" .aac | tr ' ' '-' | tr 'A-Z' 'a-z'); \
  ffmpeg -y -i "$f" -ac 1 -ar 16000 "test/fixtures/$b.wav"; done
```

## Stack

TypeScript, React, Vite, vitest. Hand-written DSP over `Float32Array`, no
audio libraries. Web Audio for decoding, MediaRecorder for recording, canvas
for the waveform. Capacitor for the Android build.

## Workflow

Built feature by feature with a written PRD, design, task list and review per
feature. The workflow docs are published separately.

## License

MIT

## Deploy

Every push to `main` runs lint, tests and build on GitHub Actions and uploads
`dist/` over FTPS to https://areg.nl/rpm-boss/. Credentials and the remote
path live in the repository secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`,
`FTP_REMOTE_DIR`. The Vite `base` is relative so the build works under any
subpath.
