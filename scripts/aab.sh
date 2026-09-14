#!/bin/sh
# Build the signed release bundle Play wants.
#
#   ./scripts/aab.sh              a release .aab
#   ./scripts/aab.sh --samples    the same, carrying the demo recordings
#
# Same path as apk.sh: web build, copy into the native project, Gradle, but
# `bundleRelease`, and it reads the version back out of the finished bundle
# rather than trusting build.gradle. Play refuses an upload whose versionCode
# is not higher than the last one, and that is the number worth being sure of
# before the Console tells you.
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

AAB=android/app/build/outputs/bundle/release/app-release.aab

use_jdk21

if [ ! -f android/key.properties ]; then
  echo "No android/key.properties: this build will be debug-signed and Play will reject it." >&2
fi

npm run build
npx cap sync android
( cd android && ./gradlew bundleRelease )

echo
echo "AAB: $AAB"
ls -lh "$AAB" | awk '{print "     " $5}'

# The manifest inside a bundle is protobuf, not text, so the version is read
# out of it rather than grepped. Skipped rather than fatal if python is absent:
# the bundle is built either way.
if command -v python3 >/dev/null 2>&1; then
  python3 - "$AAB" <<'PY'
import sys, zipfile
manifest = zipfile.ZipFile(sys.argv[1]).read('base/manifest/AndroidManifest.xml')

def after(key):
    i = manifest.find(key.encode())
    return manifest[i + len(key):i + len(key) + 24] if i >= 0 else b''

name = after('versionName')
name = name[2:2 + name[1]].decode() if len(name) > 2 else '?'
code = after('versionCode')
i = code.find(b'0')  # field 3, the int value, is the byte after this marker
code = code[i + 1] if i >= 0 else '?'
print(f'     versionCode {code}, versionName {name}')
PY
fi
