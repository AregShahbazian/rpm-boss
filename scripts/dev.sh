#!/bin/sh
# The dev server, serving the app as it ships.
#
#   ./scripts/dev.sh              the release app            (http://localhost:5173)
#   ./scripts/dev.sh --samples    the release, plus the bundled recordings
#   ./scripts/dev.sh --demo       samples + simulated engine (what areg.nl serves)
#   ./scripts/dev.sh --build      build first, serve dist/   (http://localhost:4173)
#   ./scripts/dev.sh --demo --build   both
#
# The build flags are apk.sh's and mean the same there.
#
# Default is the release: no bundled recordings, no Mock button. A change is
# judged in the app that ships, not in a variant of it. --demo sets exactly the
# two flags .github/workflows/deploy.yml sets, and --build serves the built
# files rather than the source, which is the last thing to check before a merge
# deploys it.
#
# The phone half: if a phone is attached over USB with debugging on, this
# forwards the phone's localhost to this machine so Chrome on the phone treats
# the page as a secure origin (required for the microphone).
#
#   phone (USB):   http://localhost:<port>
#   phone (Wi-Fi): http://<laptop-ip>:<port>   (upload works, mic does not)
#
# With more than one phone attached it takes the first; ANDROID_SERIAL picks
# another.
set -e
HERE=$(dirname "$0")
. "$HERE/device.sh"
cd "$HERE/.."

BUILD=
WHAT="Release: no samples, no simulated engine."
for arg in "$@"; do
  case "$arg" in
    --samples)
      VITE_SAMPLES=1
      export VITE_SAMPLES
      WHAT="Samples: bundled."
      ;;
    --demo)
      VITE_SAMPLES=1
      VITE_MOCK=1
      export VITE_SAMPLES VITE_MOCK
      WHAT="Demo: samples bundled, simulated engine on."
      ;;
    --build) BUILD=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done
echo "$WHAT"

# The preview server has a port of its own, so the two can run side by side and
# the forward below follows whichever this is.
PORT=${PORT:-$([ -n "$BUILD" ] && echo 4173 || echo 5173)}

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

if [ -n "$BUILD" ]; then
  npm run build
  echo
  exec npx vite preview --host --port "$PORT" --strictPort
fi

exec npx vite --host --port "$PORT" --strictPort
