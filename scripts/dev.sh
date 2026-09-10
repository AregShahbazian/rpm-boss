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
set -e
cd "$(dirname "$0")/.."
PORT=${PORT:-5173}

if command -v adb >/dev/null && adb get-state >/dev/null 2>&1; then
  adb reverse "tcp:$PORT" "tcp:$PORT" && echo "adb reverse set: phone http://localhost:$PORT -> laptop"
else
  echo "no phone attached via adb; mic will not work over the LAN address"
fi

IP=$(ip -4 addr show scope global 2>/dev/null | grep -oP 'inet \K[\d.]+' | head -1)
[ -n "$IP" ] && echo "LAN: http://$IP:$PORT"

exec npx vite --host --port "$PORT" --strictPort
