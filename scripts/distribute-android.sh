#!/usr/bin/env bash
set -euo pipefail

FIREBASE_APP_ID="1:821459680793:android:07362240c67c9134d17488"
APK="mobile/android/app/build/outputs/apk/release/app-release.apk"
TESTERS_FILE="scripts/android-testers.txt"
RELEASE_NOTES="${1:-"Latest build"}"

cd "$(dirname "$0")/.."

if [[ ! -f "$APK" ]]; then
  echo "APK not found at $APK — run the release build first:"
  echo "  cd mobile/android && ./gradlew assembleRelease"
  exit 1
fi

echo "Distributing $(basename "$APK") to Firebase App Distribution..."
firebase appdistribution:distribute "$APK" \
  --app "$FIREBASE_APP_ID" \
  --testers-file "$TESTERS_FILE" \
  --release-notes "$RELEASE_NOTES"
