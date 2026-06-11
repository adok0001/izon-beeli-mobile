#!/bin/bash
# EAS post-install hook (iOS)
#
# Problem: BeeliWidget's provisioning profile in EAS has IsXcodeManaged=True.
#   Manual signing (what EAS sets) rejects Xcode-managed profiles.
#   Automatic signing bypasses the check, but Xcode's signing service picks
#   the HH5MWDW65M development cert (the account registered in Xcode.app),
#   causing a cert mismatch with Beeli (which uses FWL2W5X58S distribution cert).
#
# Solution:
#   1. Python fix script (called from Gymfile) switches BeeliWidget to Automatic
#      to bypass the IsXcodeManaged check.
#   2. CODESIGN wrapper (beeli-widget-codesign.sh, created below) intercepts the
#      codesign call for BeeliWidget.appex and substitutes the distribution cert.
#   3. Gymfile passes the wrapper via CODESIGN xcarg for the archive phase, and
#      discovers the App Store profile for the export phase.
#
# Permanent fix: run `eas credentials -p ios`, select BeeliWidget, and regenerate
# the provisioning profile. A portal-generated profile has IsXcodeManaged=False,
# which works with Manual signing and makes this entire hook unnecessary.

set -eo pipefail

# Create the codesign wrapper for BeeliWidget. xcodebuild's CODESIGN build setting
# overrides the codesign binary path. The wrapper identifies BeeliWidget.appex
# signing by path, swaps the dev cert for the distribution cert, and adds the
# EAS keychain so codesign can find it. All other targets pass through unchanged.
cat > ios/beeli-widget-codesign.sh << 'WRAPPER_EOF'
#!/bin/bash
REAL_CODESIGN=/usr/bin/codesign
DIST_CERT_SHA1="080A7C7351F86814EE8B0F7B91BC591D268EC8A7"

# Only intercept when signing BeeliWidget.appex
if [[ "$*" == *"BeeliWidget.appex"* ]]; then
  EAS_KEYCHAIN=$(security list-keychains -d user 2>/dev/null \
    | grep -o '[^"]*eas-build[^"]*\.keychain[^"]*' | head -1)

  # Rebuild args: replace whatever --sign value xcodebuild chose with dist cert
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
  if [ -n "$EAS_KEYCHAIN" ]; then
    ARGS+=("--keychain" "$EAS_KEYCHAIN")
  fi
  echo "[beeli-widget-codesign] signing BeeliWidget.appex with dist cert $DIST_CERT_SHA1"
  exec "$REAL_CODESIGN" "${ARGS[@]}"
fi

exec "$REAL_CODESIGN" "$@"
WRAPPER_EOF
chmod +x ios/beeli-widget-codesign.sh
echo "eas-build-pre-build: created codesign wrapper"

# Create ios/Gymfile before EAS does. EAS's ensureGymfileExists skips creation
# when a Gymfile already exists, so our version is used.
#
# Single-quoted heredoc so Ruby's #{} interpolation and backticks are preserved
# as-is (not interpreted by bash). Ruby handles them at Gymfile load time.
#
# The Gymfile runs after CONFIGURE_XCODE_PROJECT, so the Python script runs
# before xcodebuild reads the pbxproj.
cat > ios/Gymfile << 'GYMFILE_EOF'
# Fix BeeliWidget signing. See scripts/eas-build-pre-build.sh for context.
# 1. Switch BeeliWidget to Automatic to bypass the IsXcodeManaged check.
# 2. CODESIGN xcarg redirects codesign for BeeliWidget to our wrapper.
system("python3 '../scripts/fix-beeli-widget-signing.py'") or true

suppress_xcode_output(true)
clean(false)
scheme("Beeli")
configuration("Release")
export_method("app-store")

# Point xcodebuild at our codesign wrapper for the archive phase.
# Computed at Gymfile load time; CWD is ios/ where the wrapper lives.
_wrapper = File.expand_path("beeli-widget-codesign.sh")
xcargs "CODESIGN=\"#{_wrapper}\""

# EAS keychain for the export phase.
_kc = `security list-keychains -d user 2>/dev/null`.split.map { |l| l.tr('"', '') }.find { |l| l.include?("eas-build") } || "login.keychain"
export_xcargs "OTHER_CODE_SIGN_FLAGS=\"--keychain #{_kc}\""

# Discover the BeeliWidget App Store profile from installed profiles
# so the export step re-signs with the correct profile.
_widget_profile = nil
Dir.glob(File.expand_path("~/Library/MobileDevice/Provisioning Profiles/*.mobileprovision")).each do |f|
  decoded = `security cms -D -i "#{f}" 2>/dev/null`
  if decoded.include?("com.izonbeeli.app.BeeliWidget") && decoded.include?("FWL2W5X58S")
    m = decoded.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/)
    _widget_profile = m[1] if m
    break
  end
end
puts "[gymfile] BeeliWidget export profile: #{_widget_profile || '(not found — xcodebuild will auto-select)'}"

_profiles = { "com.izonbeeli.app" => "45bb5856-b58a-434d-999f-f7ab26ba93fd" }
_profiles["com.izonbeeli.app.BeeliWidget"] = _widget_profile if _widget_profile

export_options({
  method: "app-store",
  provisioningProfiles: _profiles
})

derived_data_path("./build")
result_bundle(true)
output_directory("./build")
disable_xcpretty(true)
GYMFILE_EOF
echo "eas-build-pre-build: ios/Gymfile created"
