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

## Bundled samples

The seven recordings double as demo audio: `Try a sample` loads one without a
microphone or a file. They are off by default, and off means the audio is not
copied into the build at all.

```bash
npm run dev                      # on
VITE_SAMPLES=0 npm run dev       # off
VITE_SAMPLES=1 npm run build     # a web build that carries them
./scripts/apk.sh --samples       # an APK that carries them
```

## Android

The same web build, wrapped in Capacitor. The app is `RPM Boss`,
`com.mby4m.rpmboss`.

```bash
./scripts/apk.sh         # signed release APK
./scripts/install.sh     # the above, then install and launch it over USB
./scripts/uninstall.sh   # remove it from the phone
```

Both build the web app, copy it into the native project and run Gradle, so
there is no separate sync step to remember. `npm run android:sync` and
`npm run android:build` do the same without the checks, if you prefer them.

**JDK 21 is required.** Capacitor 8 compiles its own module at source level 21,
so a Gradle daemon on 17 fails with `invalid source release: 21`. The scripts
look for a 21 and use it; `JAVA_HOME` wins if you have already set one. The
path is machine-specific, so it is not committed.

After installing, `adb logcat -d -s RawAudio` says which microphone source the
app actually opened.

Uninstalling drops the granted microphone permission, which is how to get the
permission prompt back for testing. `./scripts/uninstall.sh --keep` leaves the
app's stored data in place.

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
