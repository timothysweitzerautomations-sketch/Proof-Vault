#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Proof Vault — build debug APK (Capacitor)"
echo ""

# Capacitor 7 Android requires JDK 21+ (see @capacitor/android compileOptions).
# Prefer Homebrew openjdk@21, then fall back.
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  elif [[ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  elif [[ -d "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
  fi
fi
export PATH="${JAVA_HOME:-}/bin:$PATH"

if ! command -v java >/dev/null 2>&1; then
  echo "Java not on PATH. Install JDK 21:  brew install openjdk@21"
  exit 1
fi

JAVA_MAJOR="$(java -version 2>&1 | sed -En 's/.* version "([0-9]+)[^"]*".*/\1/p')"
if [[ "${JAVA_MAJOR:-0}" -lt 21 ]]; then
  echo "This project needs JDK 21+ for the Android build (Capacitor 7)."
  echo "You are on Java ${JAVA_MAJOR:-unknown}."
  echo "Install:  brew install openjdk@21"
  echo "Then:  export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  exit 1
fi
java -version

if [[ -z "${ANDROID_HOME:-}" ]] && [[ -d "$HOME/Library/Android/sdk" ]]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
if [[ -z "${ANDROID_HOME:-}" ]] && [[ -d "/opt/homebrew/share/android-commandlinetools" ]]; then
  export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "ANDROID_HOME not set. Options:"
  echo "  - Homebrew SDK: export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools"
  echo "  - Android Studio: export ANDROID_HOME=\"\$HOME/Library/Android/sdk\""
  exit 1
fi

# Keeps Gradle cache inside the project (avoids some permission issues)
export GRADLE_USER_HOME="$ROOT/android/.gradle-home"
mkdir -p "$GRADLE_USER_HOME"

# Tell Gradle where the SDK is (standard for CLI builds)
mkdir -p "$ROOT/android"
if [[ ! -f "$ROOT/android/local.properties" ]] || ! grep -q '^sdk.dir=' "$ROOT/android/local.properties" 2>/dev/null; then
  echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"
fi

export PATH="$PATH:$ANDROID_HOME/platform-tools"

URL="${PROOF_VAULT_SERVER_URL:-http://localhost:3000}"
echo "Using server URL: $URL (override with PROOF_VAULT_SERVER_URL=...; should match AUTH_URL / APP_URL in .env)"
export PROOF_VAULT_SERVER_URL="$URL"

npm run cap:sync
cd android
chmod +x gradlew
./gradlew assembleDebug

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "==> APK: $APK"
ls -la "$APK"

if command -v adb >/dev/null 2>&1 && adb devices | grep -E '[[:space:]]device$' >/dev/null 2>&1; then
  echo ""
  echo "==> Installing on connected device…"
  adb install -r "$APK"
  echo "Done. Launch “Proof Vault” on the phone."
else
  echo ""
  echo "No authorized device in \`adb devices\`. When the phone shows as \"device\", run:"
  echo "  adb install -r \"$APK\""
fi
