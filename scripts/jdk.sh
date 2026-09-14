# The JDK the Android build needs.
#
# Sourced, not run. Capacitor's own module is compiled at source level 21, so a
# Gradle daemon on an older JDK fails with "invalid source release: 21" before
# any of our code is touched, and the laptop's default JAVA_HOME is a 17. Find
# a 21 rather than making the caller export one.

use_jdk21() {
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
}
