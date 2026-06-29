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

# App Store Connect API key — forwarded to xcodebuild at export so the upload and
# automatic distribution signing authenticate without an Apple ID signed into Xcode.
# Override via env vars if the key/account changes.
ASC_KEY_ID="${ASC_KEY_ID:-3UCMS5TJ6T}"
ASC_ISSUER_ID="${ASC_ISSUER_ID:-5788ad38-186e-49cb-8813-62a8cb2f3fa3}"
ASC_KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/AuthKey_${ASC_KEY_ID}.p8}"
# Poll timeout for --wait (build discovery in App Store Connect after upload).
export ASC_TIMEOUT="${ASC_TIMEOUT:-90s}"

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
  --archive-path "$ARCHIVE_PATH" \
  --overwrite

# 5. Export IPA and upload directly to TestFlight
# The auth-key flags let xcodebuild authenticate the upload and mint a distribution
# cert + App Store profile on the fly — no Apple ID needs to be signed into Xcode.
echo "==> Exporting and uploading to TestFlight..."
if [[ ! -f "$ASC_KEY_PATH" ]]; then
  echo "Error: App Store Connect API key not found at $ASC_KEY_PATH" >&2
  echo "Set ASC_KEY_PATH (and ASC_KEY_ID/ASC_ISSUER_ID) or place the .p8 there." >&2
  exit 1
fi
asc xcode export \
  --archive-path "$ARCHIVE_PATH" \
  --export-options "$EXPORT_OPTIONS" \
  --ipa-path "$IPA_PATH" \
  --overwrite \
  --wait \
  --xcodebuild-flag=-allowProvisioningUpdates \
  --xcodebuild-flag=-authenticationKeyPath --xcodebuild-flag="$ASC_KEY_PATH" \
  --xcodebuild-flag=-authenticationKeyID --xcodebuild-flag="$ASC_KEY_ID" \
  --xcodebuild-flag=-authenticationKeyIssuerID --xcodebuild-flag="$ASC_ISSUER_ID"

echo "==> Done. Build is processing in TestFlight."
echo "    App ID: $APP_ID"
echo "    IPA:    $IPA_PATH"
