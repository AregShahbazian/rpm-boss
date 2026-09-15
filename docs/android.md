# The Android app

The same web build, wrapped in Capacitor. The app is `RPM Boss`,
`com.mby4m.rpmboss`.

```bash
./scripts/apk.sh         # signed release APK
./scripts/apk.sh --demo  # the same, carrying the recordings and the simulated engine
./scripts/aab.sh         # signed release bundle, the one Play takes
./scripts/install.sh     # the APK, then install and launch it over USB
./scripts/uninstall.sh   # remove it from the phone
```

They all build the web app, copy it into the native project and run Gradle, so
there is no separate sync step to remember. `aab.sh` reads the version back out
of the finished bundle, because Play refuses an upload whose versionCode is not
higher than the last one, and it has no `--demo` at all: that bundle is what
goes to Play. `npm run android:sync` and `npm run android:build` do the same
without the checks, if you prefer them.

**JDK 21 is required.** Capacitor 8 compiles its own module at source level 21,
so a Gradle daemon on 17 fails with `invalid source release: 21`. The scripts
look for a 21 and use it; `JAVA_HOME` wins if you have already set one. The
path is machine-specific, so it is not committed.

After installing, `adb logcat -d -s RawAudio` says which microphone source the
app actually opened.

Anything that talks to a phone takes the first one attached, so no handset is
named anywhere in the scripts. With two plugged in, name the other one:

```bash
adb devices                                  # the serials
ANDROID_SERIAL=<serial> ./scripts/install.sh # that one instead of the first
```

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

## Testing on a phone against the dev server

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
