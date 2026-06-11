#!/bin/bash
# EAS pre-build hook (iOS)
# Removes the BeeliWidget distribution certificate from the EAS keychain before
# xcodebuild runs, so only the Beeli cert remains and there is no ambiguous identity.
#
# Why this exists:
#   EAS stores a separate distribution cert for the BeeliWidget target (created when
#   BeeliWidget credentials were first set up). With two certs sharing the same subject
#   name ("iPhone Distribution: TAMARALAYEFA ADOKEME") in the keychain, xcodebuild
#   may select the BeeliWidget cert for the Beeli target, which causes:
#     "Provisioning profile ... doesn't include signing certificate ..."
#
# Permanent fix: run `eas credentials -p ios`, select BeeliWidget, and reassign it to
# use the same distribution certificate as the Beeli target. Once both targets share one
# cert, this hook becomes a no-op and can be removed.
#
# If this script prints "cert not found", the BeeliWidget cert fingerprint has changed
# (EAS regenerated it). Update WIDGET_CERT_SHA1 below or apply the permanent fix.

set -eo pipefail

WIDGET_CERT_SHA1="381920BF3AD6F190E62F52AE92931FF51D37E3FB"

# The EAS PREPARE_CREDENTIALS phase creates a temp keychain named eas-build-<uuid>.keychain
EAS_KEYCHAIN=$(security list-keychains -d user 2>/dev/null \
  | grep -o '[^"]*eas-build[^"]*\.keychain[^"]*' \
  | head -1)

if [ -z "$EAS_KEYCHAIN" ]; then
  echo "eas-build-pre-build: EAS keychain not found — skipping cert deduplication"
else
  echo "eas-build-pre-build: EAS keychain = $EAS_KEYCHAIN"
  if security delete-certificate -Z "$WIDGET_CERT_SHA1" "$EAS_KEYCHAIN" 2>/dev/null; then
    echo "eas-build-pre-build: removed BeeliWidget cert ($WIDGET_CERT_SHA1) — identity is now unambiguous"
  else
    echo "eas-build-pre-build: BeeliWidget cert not found in keychain (already absent or fingerprint changed)"
  fi
fi

# Create ios/Gymfile before EAS does. EAS's ensureGymfileExists skips creation
# when a Gymfile already exists, so our version is used. The Gymfile is a Ruby
# file executed at fastlane-gym load time — AFTER CONFIGURE_XCODE_PROJECT has
# set CODE_SIGN_STYLE=Manual — so the system() call at the top of the Gymfile
# runs our fix script before xcodebuild validates signing settings.
#
# Why not Fastfile/before_gym: `fastlane gym` runs the gym action standalone
# and never loads the Fastfile, so before_gym callbacks never fire.
cat > ios/Gymfile << 'GYMFILE'
# Remove CODE_SIGN_STYLE=Manual and PROVISIONING_PROFILE_SPECIFIER from BeeliWidget.
# EAS sets both, but the "IsXcodeManaged" rejection fires when EITHER is present
# (specifier implies manual mode). Without them, xcodebuild searches for a profile
# by bundle ID + DEVELOPMENT_TEAM + CODE_SIGN_IDENTITY — accepting Xcode-managed
# profiles — and picks the installed EAS distribution profile.
system("python3 '../scripts/fix-beeli-widget-signing.py'") or true

suppress_xcode_output(true)
clean(false)
scheme("Beeli")
configuration("Release")
export_method("app-store")

# Locate the EAS temp keychain created during PREPARE_CREDENTIALS.
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
GYMFILE
echo "eas-build-pre-build: ios/Gymfile created (BeeliWidget fix + gym config)"
