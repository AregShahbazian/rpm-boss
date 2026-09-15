#!/bin/sh
# Build the signed release bundle Play wants.
#
#   ./scripts/aab.sh              a release .aab
#   ./scripts/aab.sh --samples    the same, carrying the demo recordings
#
# There is no --demo, and that is not an omission: this is the artifact that
# goes to Play, and no release on the store carries a simulated engine. The
# flag is cleared below rather than merely left alone, because an exported
# VITE_MOCK in the shell that just built a demo APK would otherwise ride along
# into the upload — and a rule that depends on remembering is not a rule.
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

for arg in "$@"; do
  case "$arg" in
    # The bundled engine recordings, off unless asked for. See README.
    --samples)
      VITE_SAMPLES=1
      export VITE_SAMPLES
      echo "Samples: bundled."
      ;;
    --demo)
      echo "No --demo here: this is the bundle Play takes. Use apk.sh --demo." >&2
      exit 2
      ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

# Whatever the shell was carrying, this build does not.
unset VITE_MOCK

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
