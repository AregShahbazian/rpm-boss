#!/bin/sh
# Remove the app from the phone over USB.
#
#   ./scripts/uninstall.sh          remove it, data and all
#   ./scripts/uninstall.sh --keep   remove it but leave its data behind
#
# Uninstalling drops the granted microphone permission, so the next install
# will ask for it again. That is the point when testing a fresh install; use
# --keep when you only want the app gone. With more than one phone attached it
# takes the first; ANDROID_SERIAL picks another.
set -e
HERE=$(dirname "$0")
. "$HERE/device.sh"
cd "$HERE/.."

PACKAGE=com.mby4m.rpmboss

require_adb
use_device

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
