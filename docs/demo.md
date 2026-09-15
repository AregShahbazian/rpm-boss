# The demo flavour

Two things exist for a visitor who has no engine to point a phone at. Both are
off in the app that ships, and off means the asset is not copied into the build
at all.

**The bundled samples.** The seven recordings in `audio/` double as demo audio:
`Try a sample` loads one without a microphone or a file. `VITE_SAMPLES=1`.

**The simulated engine.** `VITE_MOCK=1` adds a second button beside Start which
runs live mode from an engine the app synthesises for itself — audible,
adjustable with a slider from 600 to 12,000 rpm, and labelled on screen as
simulated for as long as it runs. The signal never leaves the app: the
microphone is not involved, no permission is asked for, and muting the device
changes what you hear and nothing about the reading. The synthesis is one
`AudioWorklet`, copied from
[revbench](https://github.com/AregShahbazian/revbench), which is where it was
measured against this app's own analysis.

```bash
./scripts/dev.sh --samples       # the dev server, carrying the recordings
./scripts/dev.sh --demo          # recordings and simulated engine, as the website has them
./scripts/dev.sh --demo --build  # the same, built and served from dist/
./scripts/apk.sh --demo          # an APK carrying both
./scripts/install.sh --demo      # and on the phone
VITE_SAMPLES=1 npm run build     # a web build carrying the recordings
```

**Everything defaults to the release.** `npm run dev`, `./scripts/dev.sh`,
`npm run build`, `apk.sh` and `aab.sh` all give the app as it ships — no
synthesiser, no slider, no button, and no worklet asset for one. Two places say
otherwise: `--demo` on the scripts above, and the deploy workflow, which is the
website.

## Deploy

Every push to `main` runs lint, tests and build on GitHub Actions and uploads
`dist/` over FTP to https://areg.nl/rpm-boss/. That build, and only that build,
sets `VITE_SAMPLES=1` and `VITE_MOCK=1`: the website is a demo, so it carries
both. Credentials and the remote path live in the repository secrets `FTP_HOST`,
`FTP_USER`, `FTP_PASSWORD`, `FTP_REMOTE_DIR`. The Vite `base` is relative so the
build works under any subpath.
