# Which phone these scripts talk to.
#
# Sourced, not run. It sets ANDROID_SERIAL, which every adb call afterwards
# follows on its own, so nothing below has to pass -s and nothing is tied to
# one handset. A serial already in the environment wins:
#
#   ANDROID_SERIAL=ABC123 ./scripts/install.sh
#
# That is the way to reach the second phone when both are plugged in.

require_adb() {
  if ! command -v adb >/dev/null 2>&1; then
    echo "adb not found. Install the Android platform tools and try again." >&2
    exit 1
  fi
}

# The first attached handset that is ready to be talked to. "device" rules out
# a phone that is offline, unauthorised or still booting; the emulator-* skip
# keeps a running emulator from taking the place of the phone in your hand.
pick_device() {
  adb devices | awk 'NR>1 && $2 == "device" && $1 !~ /^emulator-/ { print $1; exit }'
}

# The same, but it insists. Prints what it picked, because with two phones on
# the desk the useful thing to know is which one just got written to.
use_device() {
  [ -n "$ANDROID_SERIAL" ] || ANDROID_SERIAL=$(pick_device)
  if [ -z "$ANDROID_SERIAL" ]; then
    echo "No phone attached. Plug it in, allow USB debugging, and try again." >&2
    adb devices
    exit 1
  fi
  export ANDROID_SERIAL
  DEVICE=$(adb shell getprop ro.product.model | tr -d '\r')
  export DEVICE
}
