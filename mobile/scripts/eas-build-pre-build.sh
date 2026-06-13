#!/bin/bash
# EAS post-install hook (iOS)
#
# Problem: BeeliWidget's provisioning profile in EAS has IsXcodeManaged=True.
#   xcodebuild rejects this during both archive (Manual signing) and export
#   (-exportArchive validates the embedded profile).
#
# Solution:
#   Archive:
#     - Python fix script: switches BeeliWidget to Automatic (bypasses IsXcodeManaged
#       during archive). Automatic picks HH5MWDW65M dev cert + embeds dev profile.
#     - beeli-widget-codesign.sh (CODESIGN wrapper): intercepts the BeeliWidget codesign
#       call, replaces the dev profile with the EAS App Store profile, and substitutes
#       the distribution cert. ValidateEmbeddedBinary passes.
#     - xcarchive now has BeeliWidget correctly signed: dist cert + App Store profile.
#
#   Export:
#     - ios/bin/xcodebuild is prepended to PATH in the Gymfile so that
#       xcbuild-safe.sh's PATH-based `xcodebuild "$@"` call hits our wrapper.
#     - The wrapper intercepts -exportArchive, copies Beeli.app from the
#       already-correctly-signed xcarchive directly into Payload/ and zips it
#       as Beeli.ipa — no xcodebuild re-signing, no IsXcodeManaged validation.
#     - Gym finds the IPA and copies it to output_directory. Build passes.
#
# Permanent fix: run `eas credentials -p ios`, select BeeliWidget, generate a new
# provisioning profile. Portal-generated profiles have IsXcodeManaged=False and work
# with Manual signing, eliminating this entire hook.

set -eo pipefail

# This hook is iOS-only (BeeliWidget signing workaround). Skip on other platforms;
# Android builds have no ios/ directory, so the writes below would fail the build.
if [ "${EAS_BUILD_PLATFORM:-ios}" != "ios" ]; then
  echo "eas-build-pre-build: skipping iOS signing hook (platform=${EAS_BUILD_PLATFORM})"
  exit 0
fi

# --- beeli-widget-codesign.sh (CODESIGN wrapper, archive phase) -------------------
cat > ios/beeli-widget-codesign.sh << 'CODESIGN_EOF'
#!/bin/bash
# Intercepts BeeliWidget.appex signing during archive:
#   1. Embeds the App Store profile (replacing the dev profile Automatic signing placed).
#   2. Substitutes the distribution cert for the dev cert xcodebuild chose.
REAL_CODESIGN=/usr/bin/codesign
DIST_CERT_SHA1="080A7C7351F86814EE8B0F7B91BC591D268EC8A7"

if [[ "$*" != *"BeeliWidget.appex"* ]]; then
  exec "$REAL_CODESIGN" "$@"
fi

# Find the .appex bundle path in the argument list
APPEX_DIR=""
for arg in "$@"; do
  if [[ "$arg" == *"BeeliWidget.appex" ]] && [ -d "$arg" ]; then
    APPEX_DIR="$arg"
    break
  fi
done

# Embed the EAS App Store distribution profile
if [ -n "$APPEX_DIR" ]; then
  for profile in ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision; do
    [ -f "$profile" ] || continue
    decoded=$(security cms -D -i "$profile" 2>/dev/null) || continue
    if echo "$decoded" | grep -q "com.izonbeeli.app.BeeliWidget" && \
       echo "$decoded" | grep -q "FWL2W5X58S" && \
       (echo "$decoded" | grep -q "iOS Team Store\|app-store\|AppStore"); then
      cp "$profile" "$APPEX_DIR/embedded.mobileprovision"
      echo "[beeli-widget-codesign] embedded App Store profile into BeeliWidget.appex"
      break
    fi
  done
fi

# Substitute distribution cert and add EAS keychain
EAS_KEYCHAIN=$(security list-keychains -d user 2>/dev/null \
  | grep -o '[^"]*eas-build[^"]*\.keychain[^"]*' | head -1)
ARGS=()
SKIP_NEXT=false
for arg in "$@"; do
  if $SKIP_NEXT; then
    ARGS+=("$DIST_CERT_SHA1")
    SKIP_NEXT=false
  elif [ "$arg" = "--sign" ] || [ "$arg" = "-s" ]; then
    ARGS+=("$arg")
    SKIP_NEXT=true
  else
    ARGS+=("$arg")
  fi
done
[ -n "$EAS_KEYCHAIN" ] && ARGS+=("--keychain" "$EAS_KEYCHAIN")
echo "[beeli-widget-codesign] signing with dist cert $DIST_CERT_SHA1"
exec "$REAL_CODESIGN" "${ARGS[@]}"
CODESIGN_EOF
chmod +x ios/beeli-widget-codesign.sh
echo "eas-build-pre-build: created beeli-widget-codesign.sh"

# --- ios/bin/xcodebuild (PATH-based interceptor for export phase) ----------------
# xcbuild-safe.sh calls `xcodebuild "$@"` via PATH lookup. Prepending ios/bin
# to PATH in the Gymfile makes gym's export call hit this wrapper instead.
mkdir -p ios/bin
cat > ios/bin/xcodebuild << 'XCODE_INTERCEPT_EOF'
#!/bin/bash
# xcodebuild wrapper: intercepts -exportArchive to create the IPA directly
# from the xcarchive, bypassing xcodebuild's IsXcodeManaged validation.
# All other xcodebuild actions pass through to the real binary.
REAL_XCODEBUILD=/usr/bin/xcodebuild

if [[ "$*" != *"-exportArchive"* ]]; then
  exec "$REAL_XCODEBUILD" "$@"
fi

echo "[xcodebuild-intercept] intercepted -exportArchive — creating IPA from xcarchive"

# Parse -archivePath and -exportPath from args
ARCHIVE_PATH=""
EXPORT_PATH=""
PREV=""
for arg in "$@"; do
  case "$PREV" in
    -archivePath)        ARCHIVE_PATH="$arg" ;;
    -exportPath)         EXPORT_PATH="$arg" ;;
  esac
  PREV="$arg"
done

echo "[xcodebuild-intercept] archive  = $ARCHIVE_PATH"
echo "[xcodebuild-intercept] export   = $EXPORT_PATH"

APP_SRC="$ARCHIVE_PATH/Products/Applications/Beeli.app"
if [ ! -d "$APP_SRC" ]; then
  echo "[xcodebuild-intercept] ERROR: Beeli.app not found in xcarchive at $APP_SRC"
  exit 1
fi

# Create Payload/ and zip as IPA.
# The app is already correctly signed in the xcarchive (dist cert on both targets,
# App Store profile embedded in BeeliWidget.appex by beeli-widget-codesign.sh).
WORK_DIR=$(mktemp -d)
mkdir "$WORK_DIR/Payload"
cp -r "$APP_SRC" "$WORK_DIR/Payload/"

mkdir -p "$EXPORT_PATH"
(cd "$WORK_DIR" && zip -qr "$EXPORT_PATH/Beeli.ipa" Payload/)
rm -rf "$WORK_DIR"
echo "[xcodebuild-intercept] created $EXPORT_PATH/Beeli.ipa"
exit 0
XCODE_INTERCEPT_EOF
chmod +x ios/bin/xcodebuild
echo "eas-build-pre-build: created ios/bin/xcodebuild interceptor"

# --- Gymfile ---------------------------------------------------------------------
# Single-quoted heredoc: Ruby #{} and backticks are preserved for Ruby evaluation.
cat > ios/Gymfile << 'GYMFILE_EOF'
# Fix BeeliWidget signing. See scripts/eas-build-pre-build.sh for full context.
system("python3 '../scripts/fix-beeli-widget-signing.py'") or true

suppress_xcode_output(true)
clean(false)
scheme("Beeli")
configuration("Release")
export_method("app-store")

# Prepend ios/bin to PATH so xcbuild-safe.sh's PATH-based `xcodebuild` call
# hits our interceptor, which creates the IPA without triggering xcodebuild's
# IsXcodeManaged validation.
_bin_dir = File.expand_path("bin")
ENV["PATH"] = "#{_bin_dir}:#{ENV['PATH']}"

# CODESIGN wrapper: embeds the App Store profile + dist cert for BeeliWidget.
_codesign = File.expand_path("beeli-widget-codesign.sh")
xcargs "CODESIGN=\"#{_codesign}\""

# EAS keychain for the export re-sign via export_xcargs (also passes CODESIGN
# so xcodebuild uses our wrapper if it ever calls codesign during export).
_kc = `security list-keychains -d user 2>/dev/null`.split.map { |l| l.tr('"', '') }.find { |l| l.include?("eas-build") } || "login.keychain"
export_xcargs "OTHER_CODE_SIGN_FLAGS=\"--keychain #{_kc}\""

export_options({
  method: "app-store",
  provisioningProfiles: {
    "com.izonbeeli.app" => "45bb5856-b58a-434d-999f-f7ab26ba93fd"
  }
})

derived_data_path("./build")
result_bundle(true)
output_directory("./build")
disable_xcpretty(true)
GYMFILE_EOF
echo "eas-build-pre-build: ios/Gymfile created"
