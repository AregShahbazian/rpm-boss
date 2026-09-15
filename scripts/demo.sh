#!/bin/sh
# The demo, as the website serves it: bundled samples and the simulated engine.
#
#   ./scripts/demo.sh            dev server, both switched on   (http://localhost:5173)
#   ./scripts/demo.sh --build    build it and serve the built files instead
#
# The dev server has both on by default, so the first form is mostly a way of
# saying so out loud — and a way of being right if that default ever changes.
# The second is the one that matters: it builds with exactly the flags
# .github/workflows/deploy.yml uses, so what is served is what areg.nl/rpm-boss
# gets, dead code eliminated and all.
#
# The phone half is dev.sh's: it forwards localhost over adb so the page is a
# secure origin and the *real* microphone button works next to the simulated
# one. The simulated engine needs none of that; it asks for no permission.
set -e
HERE=$(dirname "$0")
cd "$HERE/.."

VITE_SAMPLES=1
VITE_MOCK=1
export VITE_SAMPLES VITE_MOCK
echo "Demo: samples bundled, simulated engine on."

if [ "$1" = "--build" ]; then
  npm run build
  echo
  exec npx vite preview --host --port "${PORT:-4173}" --strictPort
fi

exec sh scripts/dev.sh
