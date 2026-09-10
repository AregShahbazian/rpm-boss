#!/bin/sh
# Remove the app from the phone over USB.
#
#   ./scripts/uninstall.sh          remove it, data and all
#   ./scripts/uninstall.sh --keep   remove it but leave its data behind
#
# Uninstalling drops the granted microphone permission, so the next install
# will ask for it again. That is the point when testing a fresh install; use
# --keep when you only want the app gone.
set -e
cd "$(dirname "$0")/.."

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

DEVICE=$(adb shell getprop ro.product.model | tr -d '\r')
if ! adb shell pm list packages | grep -q "^package:$PACKAGE$"; then
  echo "$PACKAGE is not installed on $DEVICE. Nothing to do."
  exit 0
fi

if [ "$1" = "--keep" ]; then
  echo "Removing $PACKAGE from $DEVICE, keeping its data…"
  adb shell pm uninstall -k "$PACKAGE"
else
  echo "Removing $PACKAGE from $DEVICE, data and all…"
  adb uninstall "$PACKAGE"
fi
