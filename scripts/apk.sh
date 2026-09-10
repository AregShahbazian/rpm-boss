#!/bin/sh
# Build a signed release APK.
#
#   ./scripts/apk.sh
#
# Builds the web app, copies it into the native project, and runs Gradle. The
# APK is signed with the key named in android/key.properties; without that file
# Gradle falls back to debug signing and the APK still builds.
set -e
cd "$(dirname "$0")/.."

APK=android/app/build/outputs/apk/release/app-release.apk

# Capacitor's own module is compiled at source level 21, so a Gradle daemon on
# an older JDK fails with "invalid source release: 21" before any of our code
# is touched. Find a 21 rather than making the caller export JAVA_HOME.
if [ -z "$JAVA_HOME" ] || ! "$JAVA_HOME/bin/javac" -version 2>&1 | grep -q '^javac 2[1-9]'; then
  for candidate in /usr/lib/jvm/java-21-openjdk-amd64 /usr/lib/jvm/java-21-openjdk /opt/android-studio/jbr; do
    if [ -x "$candidate/bin/javac" ]; then
      JAVA_HOME=$candidate
      break
    fi
  done
fi
if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/javac" ]; then
  echo "No JDK 21 found. Install one, or export JAVA_HOME at a 21 and run again." >&2
  exit 1
fi
export JAVA_HOME
echo "JDK: $("$JAVA_HOME/bin/javac" -version 2>&1)"

if [ ! -f android/key.properties ]; then
  echo "No android/key.properties: this build will be debug-signed." >&2
fi

npm run build
npx cap sync android
( cd android && ./gradlew assembleRelease )

echo
echo "APK: $APK"
ls -lh "$APK" | awk '{print "     " $5}'
if command -v apksigner >/dev/null 2>&1; then
  apksigner verify --print-certs "$APK" | grep -i 'SHA-256 digest' || true
else
  SIGNER=$(ls -d "$HOME"/Android/Sdk/build-tools/*/apksigner 2>/dev/null | sort | tail -1)
  [ -n "$SIGNER" ] && "$SIGNER" verify --print-certs "$APK" | grep -i 'SHA-256 digest' || true
fi
