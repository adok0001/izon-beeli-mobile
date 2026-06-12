#!/usr/bin/env bash
# Local TestFlight drop via asc CLI — faster than waiting in the EAS queue.
# Requires: brew install asc
# Auth (one-time): asc auth login --name "Beeli" --key-id KEY_ID --issuer-id ISSUER_ID --private-key /path/to/AuthKey.p8 --network
# Usage: ./scripts/testflight-local.sh [--skip-prebuild]

set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "$0")/../mobile" && pwd)"
WORKSPACE="$MOBILE_DIR/ios/Beeli.xcworkspace"
SCHEME="Beeli"
ARCHIVE_PATH="/tmp/Beeli.xcarchive"
IPA_PATH="/tmp/Beeli.ipa"
EXPORT_OPTIONS="$MOBILE_DIR/ios/ExportOptions.plist"
APP_ID="6759113274"

SKIP_PREBUILD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-prebuild" ]] && SKIP_PREBUILD=true
done

echo "==> Beeli local TestFlight build"

# 1. Prebuild (generates native iOS project from Expo config)
if [[ "$SKIP_PREBUILD" == false ]]; then
  echo "==> Running expo prebuild..."
  cd "$MOBILE_DIR"
  npx expo prebuild --platform ios --clean
  # Restore ExportOptions.plist wiped by --clean
  cat > "$EXPORT_OPTIONS" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>destination</key>
	<string>upload</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>teamID</key>
	<string>FWL2W5X58S</string>
</dict>
</plist>
PLIST
  cd "$MOBILE_DIR/ios"
  pod install
else
  echo "==> Skipping prebuild (--skip-prebuild)"
fi

# 2. Bump build number
echo "==> Bumping build number..."
asc xcode version bump --type build --project-dir "$MOBILE_DIR/ios"

# 3. Check version and build before archiving
echo "==> Current version info:"
asc xcode version view --project-dir "$MOBILE_DIR/ios"

# 4. Archive
echo "==> Archiving..."
asc xcode archive \
  --workspace "$WORKSPACE" \
  --scheme "$SCHEME" \
  --configuration Release \
  --archive-path "$ARCHIVE_PATH"

# 5. Export IPA and upload directly to TestFlight
echo "==> Exporting and uploading to TestFlight..."
ASC_TIMEOUT=600s asc xcode export \
  --archive-path "$ARCHIVE_PATH" \
  --export-options "$EXPORT_OPTIONS" \
  --ipa-path "$IPA_PATH" \
  --wait

echo "==> Done. Build is processing in TestFlight."
echo "    App ID: $APP_ID"
echo "    IPA:    $IPA_PATH"
