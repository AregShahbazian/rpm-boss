#!/bin/sh
# Dev server for phone testing.
#
# Serves on the LAN and, if a phone is attached over USB with debugging on,
# forwards the phone's localhost:5173 to this machine so Chrome on the phone
# treats the page as a secure origin (required for the microphone).
#
#   ./scripts/dev.sh
#   phone (USB):   http://localhost:5173
#   phone (Wi-Fi): http://<laptop-ip>:5173   (file upload works, mic does not)
#
# With more than one phone attached it takes the first; ANDROID_SERIAL picks
# another.
set -e
HERE=$(dirname "$0")
. "$HERE/device.sh"
cd "$HERE/.."
PORT=${PORT:-5173}

# Picks the phone as it goes, so the forward survives an unplug and follows
# whichever handset is on the cable now.
reverse() {
  [ -n "$ANDROID_SERIAL" ] || ANDROID_SERIAL=$(pick_device)
  [ -n "$ANDROID_SERIAL" ] || return 1
  export ANDROID_SERIAL
  adb reverse "tcp:$PORT" "tcp:$PORT" >/dev/null 2>&1
}

if command -v adb >/dev/null && reverse; then
  echo "adb reverse set: phone http://localhost:$PORT -> laptop ($ANDROID_SERIAL)"
  # the mapping is lost when the phone reconnects; keep re-applying it
  ( while sleep 5; do ANDROID_SERIAL=; reverse; done ) &
  trap 'kill $! 2>/dev/null' EXIT
else
  echo "no phone attached via adb; mic will not work over the LAN address"
fi

IP=$(ip -4 addr show scope global 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1)
[ -n "$IP" ] && echo "LAN: http://$IP:$PORT"

exec npx vite --host --port "$PORT" --strictPort
