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
works for file upload only. The mapping is lost when the phone reconnects; the
script re-applies it every few seconds, or do it by hand:

```bash
adb reverse tcp:5173 tcp:5173
```

`audio/testing/` holds two aids that are not ground truth: `all-samples.m4a`,
the seven recordings joined end to end (~68 s) for the long-clip path, and
`too-short-0.5s.m4a` for the minimum-length gate. Regenerate them with:

```bash
for f in audio/*.aac; do ffmpeg -y -i "$f" -ac 1 -ar 48000 "/tmp/$(basename "$f" .aac).wav"; done
printf "file '%s'\n" /tmp/*.wav > /tmp/cat.txt
ffmpeg -y -f concat -safe 0 -i /tmp/cat.txt -c:a aac -b:a 96k audio/testing/all-samples.m4a
ffmpeg -y -i "audio/after cold.aac" -t 0.5 -c:a aac -b:a 96k audio/testing/too-short-0.5s.m4a
```

Fixtures are regenerated from the originals with:

```bash
for f in audio/*.aac; do b=$(basename "$f" .aac | tr ' ' '-' | tr 'A-Z' 'a-z'); \
  ffmpeg -y -i "$f" -ac 1 -ar 16000 "test/fixtures/$b.wav"; done
```

## Android

The same web build, wrapped in Capacitor. The app is `RPM Boss`,
`com.mby4m.rpmboss`.

```bash
npm run android:sync     # build the web app and copy it into android/
npm run android:build    # the above, then a release APK
```

**JDK 21 is required.** Capacitor 8 compiles its own module at source level 21,
so a Gradle daemon on 17 fails with `invalid source release: 21`. Point
`JAVA_HOME` at a 21 before building, or set `org.gradle.java.home` in your own
`~/.gradle/gradle.properties`. The path is machine-specific, so it is not
committed.

Release signing reads `android/key.properties`, which is gitignored; copy
`android/key.properties.example` and fill it in. Without it, release builds fall
back to debug signing.

Recording is native on Android: a small plugin opens `AudioRecord` on
`MediaRecorder.AudioSource.UNPROCESSED`, because the browser path cannot get
unprocessed audio and the processed kind has the engine note gated out of it.
The plugin logs which source it actually opened.

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
`dist/` over FTP to https://areg.nl/rpm-boss/. Credentials and the remote
path live in the repository secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`,
`FTP_REMOTE_DIR`. The Vite `base` is relative so the build works under any
subpath.
