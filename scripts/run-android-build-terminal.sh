#!/usr/bin/env bash
# Run this from Terminal.app (⌘Space → "Terminal"): fix Java 21 Gradle + optional adb install.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

if ! java -version 2>&1 | grep -q 'version "21'; then
  echo "Need JDK 21. Install: brew install openjdk@21"
  exit 1
fi

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export GRADLE_USER_HOME="$ROOT/android/.gradle-home"
mkdir -p "$GRADLE_USER_HOME"
echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"

export PATH="$PATH:$ANDROID_HOME/platform-tools"

echo "==> cap sync"
npx cap sync android

echo "==> assembleDebug (may take a few minutes on first run)"
cd "$ROOT/android"
chmod +x gradlew
./gradlew assembleDebug

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "==> APK: $APK"
ls -la "$APK"

echo ""
echo "==> adb devices"
adb devices -l || true

if adb devices 2>/dev/null | grep -E '[[:space:]]device$' >/dev/null; then
  echo "==> Installing…"
  adb install -r "$APK"
  echo "Done. Open “Proof Vault” on your phone."
else
  echo "No phone in “device” state. When it is, run:"
  echo "  adb install -r \"$APK\""
fi
