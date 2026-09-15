#!/bin/sh
# Build a signed release APK.
#
#   ./scripts/apk.sh              a release APK
#   ./scripts/apk.sh --samples    the same, carrying the demo recordings
#   ./scripts/apk.sh --demo       the recordings and the simulated engine too
#
# Default is the release, as it is everywhere: dev.sh, apk.sh and install.sh all
# ship the app unless told otherwise, and all say --demo when told.
#
# Builds the web app, copies it into the native project, and runs Gradle. The
# APK is signed with the key named in android/key.properties; without that file
# Gradle falls back to debug signing and the APK still builds.
set -e
HERE=$(dirname "$0")
. "$HERE/jdk.sh"
cd "$HERE/.."

for arg in "$@"; do
  case "$arg" in
    # The bundled engine recordings, off unless asked for. See README.
    --samples)
      VITE_SAMPLES=1
      export VITE_SAMPLES
      echo "Samples: bundled."
      ;;
    # The recordings and the simulated engine: an APK to hand someone who has no
    # motorcycle. Deliberately absent from aab.sh — the bundle is what goes to
    # Play, and no release on the store carries a simulated engine.
    --demo)
      VITE_SAMPLES=1
      VITE_MOCK=1
      export VITE_SAMPLES VITE_MOCK
      echo "Demo: samples bundled, simulated engine on. NOT a build to upload."
      ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

APK=android/app/build/outputs/apk/release/app-release.apk

use_jdk21

if [ ! -f android/key.properties ]; then
  echo "No android/key.properties: this build will be debug-signed." >&2
fi

npm run build
npx cap sync android
( cd android && ./gradlew assembleRelease )

echo
echo "APK: $APK"
ls -lh "$APK" | awk '{print "     " $5}'
if command -v apksigner >/dev/null 2>&1; then
  apksigner verify --print-certs "$APK" | grep -i 'SHA-256 digest' || true
else
  SIGNER=$(ls -d "$HOME"/Android/Sdk/build-tools/*/apksigner 2>/dev/null | sort | tail -1)
  [ -n "$SIGNER" ] && "$SIGNER" verify --print-certs "$APK" | grep -i 'SHA-256 digest' || true
fi
