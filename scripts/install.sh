#!/bin/sh
# Build a signed release APK and install it on the phone over USB.
#
#   ./scripts/install.sh          build, install, launch
#   ./scripts/install.sh --keep   install without launching
#
# Needs a phone attached with USB debugging on. Installing over an existing copy
# keeps its data and its granted permissions.
set -e
cd "$(dirname "$0")/.."

APK=android/app/build/outputs/apk/release/app-release.apk
PACKAGE=com.mby4m.rpmboss

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install the Android platform tools and try again." >&2
  exit 1
fi
if [ -z "$(adb devices | awk 'NR>1 && $2=="device"')" ]; then
  echo "No phone attached. Plug it in, allow USB debugging, and try again." >&2
  adb devices
  exit 1
fi

./scripts/apk.sh

echo
echo "Installing on $(adb shell getprop ro.product.model | tr -d '\r')…"
adb install -r "$APK"

if [ "$1" != "--keep" ]; then
  adb shell am start -n "$PACKAGE/.MainActivity" >/dev/null
  echo "Launched $PACKAGE."
  echo "Which microphone source it opened:  adb logcat -d -s RawAudio"
fi
