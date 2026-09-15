#!/bin/sh
# Build a signed release APK and install it on the phone over USB.
#
#   ./scripts/install.sh            build, install, launch
#   ./scripts/install.sh --keep     install without launching
#   ./scripts/install.sh --samples  build with the demo recordings, then launch
#   ./scripts/install.sh --demo     the recordings and the simulated engine too
#
# The build flags are apk.sh's and mean there what they mean here; --keep is
# this script's own, and they combine.
#
# Needs a phone attached with USB debugging on. Installing over an existing copy
# keeps its data and its granted permissions. With more than one phone attached
# it takes the first; ANDROID_SERIAL picks another.
set -e
HERE=$(dirname "$0")
. "$HERE/device.sh"
cd "$HERE/.."

APK=android/app/build/outputs/apk/release/app-release.apk
PACKAGE=com.mby4m.rpmboss

require_adb
use_device

KEEP=
BUILD_ARGS=
for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=1 ;;
    --samples|--demo) BUILD_ARGS="$BUILD_ARGS $arg" ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

# Unquoted on purpose: it is a list of flags, or nothing at all.
# shellcheck disable=SC2086
./scripts/apk.sh $BUILD_ARGS

echo
echo "Installing on $DEVICE ($ANDROID_SERIAL)…"
adb install -r "$APK"

if [ -z "$KEEP" ]; then
  adb shell am start -n "$PACKAGE/.MainActivity" >/dev/null
  echo "Launched $PACKAGE."
  echo "Which microphone source it opened:  adb logcat -d -s RawAudio"
fi
