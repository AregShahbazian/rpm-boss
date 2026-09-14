#!/bin/sh
# Build a signed release APK.
#
#   ./scripts/apk.sh              a release APK
#   ./scripts/apk.sh --samples    the same, carrying the demo recordings
#
# Builds the web app, copies it into the native project, and runs Gradle. The
# APK is signed with the key named in android/key.properties; without that file
# Gradle falls back to debug signing and the APK still builds.
set -e
HERE=$(dirname "$0")
. "$HERE/jdk.sh"
cd "$HERE/.."

# The bundled engine recordings, off unless asked for. See README.
if [ "$1" = "--samples" ]; then
  VITE_SAMPLES=1
  export VITE_SAMPLES
  echo "Samples: bundled."
fi

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
