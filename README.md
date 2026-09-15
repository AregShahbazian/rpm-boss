# rpm-boss

Engine RPM from sound. Point a phone at a running engine and read the rev
counter, or open a recording and get one number with every combustion it
counted marked on the waveform.

Targets simple engines first: single cylinder, not running too smoothly, such
as a motorcycle or generator at idle. Runs entirely on the device: no backend,
no account, no network.

- **Try it:** https://areg.nl/rpm-boss/ — the demo build, with recordings and a
  simulated engine, so it works without an engine nearby.
- **How it was built:** https://areg.nl/rpm-boss/workflow/ — a PRD, design, task
  list and review per feature.

## Run it

Node 20 or newer. Nothing else for the web app.

```bash
git clone https://github.com/AregShahbazian/rpm-boss.git
cd rpm-boss
npm install
npm run dev     # http://localhost:5173
```

That is the app as it ships, which needs a real engine and a microphone. For
the version the website serves — bundled recordings, plus a synthesised engine
to watch the needle follow:

```bash
npm run demo    # or: ./scripts/dev.sh --demo
```

Then `npm test` (the analysis, judged against seven verified recordings),
`npm run lint`, `npm run build`.

## Build the Android app

JDK 21, and a phone attached with USB debugging on for `install.sh`.

```bash
./scripts/apk.sh           # signed release APK
./scripts/apk.sh --demo    # the same, with the recordings and the simulated engine
./scripts/install.sh        # build the APK, install it, launch it
./scripts/aab.sh           # the bundle Play takes
```

`aab.sh` refuses `--demo`: that artifact goes to the Play Store, and the demo
flavour is not the app people install.

## Read further

| | |
|---|---|
| [docs/dsp.md](docs/dsp.md) | how the number is found, and the fixtures that keep it honest |
| [docs/interface.md](docs/interface.md) | one grid, two layouts, themes, seventeen languages, and the stack |
| [docs/android.md](docs/android.md) | the Capacitor build, signing, native recording, phone testing |
| [docs/demo.md](docs/demo.md) | what `--demo` turns on, and how the website is deployed |

## License

MIT
