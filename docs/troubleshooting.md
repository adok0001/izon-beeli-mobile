# Troubleshooting

## EAS iOS build: "No profiles for 'com.izonbeeli.app.BeeliWidget' were found"

**Error string (greppable):**
```
No profiles for 'com.izonbeeli.app.BeeliWidget' were found: Automatic signing is disabled and unable to generate a profile. (in target 'BeeliWidget')
```

**Symptom:** EAS iOS build fails at the archive step (fastlane gym exits 65). The EAS build log line "Detected provisioning profile mapping" lists only `com.izonbeeli.app` — the widget extension bundle ID is absent.

**Root cause:** The `BeeliWidget` app extension target (bundle ID `com.izonbeeli.app.BeeliWidget`, added via `modules/beeli-widget/plugin`) was not declared to EAS, so EAS never generated or mapped a provisioning profile for it. EAS disables automatic signing, so the archive fails when no profile exists for the widget target.

**Fix:**

1. `mobile/app.json` — declare the extension in `extra.eas.build.experimental.ios.appExtensions` (already done; see below).
2. Run `eas credentials -p ios` from `mobile/` (interactive) and set up a provisioning profile for the `BeeliWidget` target. EAS will register `com.izonbeeli.app.BeeliWidget` on the Apple Developer account if it doesn't exist yet. Alternatively, triggering `eas build --platform ios --profile production` after the config change will prompt for credentials automatically.

The relevant config in `app.json`:

```json
"extra": {
  "eas": {
    "build": {
      "experimental": {
        "ios": {
          "appExtensions": [
            {
              "targetName": "BeeliWidget",
              "bundleIdentifier": "com.izonbeeli.app.BeeliWidget",
              "entitlements": {
                "com.apple.security.application-groups": ["group.com.izonbeeli.shared"]
              }
            }
          ]
        }
      }
    }
  }
}
```

**Local builds (`scripts/testflight-local.sh`):** unaffected in principle — local builds use automatic signing (`CODE_SIGN_STYLE: Automatic` + `DEVELOPMENT_TEAM: FWL2W5X58S` set by the plugin). If the same error appears locally, open `mobile/ios/Beeli.xcworkspace` in Xcode with the Apple Developer account signed in to let Xcode's automatic signing create the widget profile.

**Sync warning:** `targetName`, `bundleIdentifier`, and the app group in `appExtensions` are duplicated from `modules/beeli-widget/plugin/index.ts` (constants `APP_GROUP` and the derived bundle ID). If either value changes in the plugin, update `app.json` to match.

---

## EAS iOS local build: "xcodebuild -showBuildSettings timed out"

**Error string (greppable):**
```
xcodebuild -showBuildSettings timed out after 4 retries with a base timeout of 3
```

**Symptom:** Local EAS build (`eas build --local`) fails during the "Run fastlane" phase. Fastlane calls `xcodebuild -showBuildSettings` to resolve the scheme, but the command exceeds the default 3-second timeout.

**Root cause:** Xcode 26 (beta) resolves Swift packages and regenerates derived data on the first invocation, which can take 30–120 seconds. Fastlane's default 3-second timeout (4 retries, each doubling: 3 → 6 → 12 → 24 s) is far too short.

**Fix:** `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT=120` and `FASTLANE_XCODEBUILD_SETTINGS_RETRIES=6` are set in the `base` env block of `eas.json`, so all build profiles inherit them. No further action needed.

For ad-hoc local runs outside EAS, export these in your shell before invoking fastlane:
```bash
export FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT=120
export FASTLANE_XCODEBUILD_SETTINGS_RETRIES=6
```

---

## EAS iOS local build: BeeliWidget `IsXcodeManaged` profile rejection

**Error strings (greppable):**
```
Provisioning profile "..." has Xcode-managed entitlements, but CODE_SIGN_STYLE is set to Manual. (in target 'BeeliWidget')
```
```
Provisioning profile "..." is Xcode managed, but the signing settings require a manually managed profile. (in target 'BeeliWidget')
```

**Symptom:** Local EAS build (`eas build --platform ios --profile production --local`) fails during either the archive or export step with a BeeliWidget-related signing error.

**Root cause:** The BeeliWidget provisioning profile stored in EAS has `IsXcodeManaged = True` (it was originally created by Xcode's automatic signing service). xcodebuild rejects this flag in two places:

1. **Archive phase** — EAS's `CONFIGURE_XCODE_PROJECT` step sets `CODE_SIGN_STYLE = Manual` for BeeliWidget. Manual mode + `IsXcodeManaged = True` profile = immediate rejection.
2. **Export phase** — even after a successful archive, `xcodebuild -exportArchive` re-validates the embedded profile; any profile with `IsXcodeManaged = True` is rejected regardless of signing style.

**Active workaround** (`mobile/scripts/eas-build-pre-build.sh`, wired as `eas-build-post-install` in `mobile/package.json`):

Three files are generated at hook time and consumed by fastlane gym:

| File | Phase | What it does |
|------|-------|--------------|
| `ios/Gymfile` | Config | Loads the two items below; prepends `ios/bin` to PATH |
| `ios/beeli-widget-codesign.sh` | Archive | CODESIGN wrapper: for `BeeliWidget.appex` only, embeds the EAS App Store profile and substitutes the distribution cert (`080A7C7...`) for the dev cert Automatic signing chose |
| `ios/bin/xcodebuild` | Export | PATH-shadowed xcodebuild: intercepts `-exportArchive`, builds the IPA directly from the xcarchive (zip `Payload/`), never calls the real xcodebuild — so `IsXcodeManaged` is never checked |

`mobile/scripts/fix-beeli-widget-signing.py` runs at Gymfile load time (after EAS's `CONFIGURE_XCODE_PROJECT`, before xcodebuild) and patches `project.pbxproj` to switch BeeliWidget's `CODE_SIGN_STYLE` from `Manual` → `Automatic`, removing `PROVISIONING_PROFILE_SPECIFIER` and `CODE_SIGN_IDENTITY`. Automatic mode skips the `IsXcodeManaged` check during archive.

**Permanent fix (eliminates all of the above):** Run `eas credentials -p ios` from `mobile/`, select the **BeeliWidget** target, and regenerate the provisioning profile. Profiles created directly through the Apple Developer Portal (not via Xcode's signing service) have `IsXcodeManaged = False` and work with Manual signing. Once replaced, the pre-build hook and both scripts become unnecessary.

**If the workaround stops working:**
- Archive fails with cert mismatch: the distribution cert fingerprint in `beeli-widget-codesign.sh` (`DIST_CERT_SHA1`) may be stale. Check the current cert via `eas credentials -p ios` and update the SHA1.
- Export fails with a new error: the xcarchive structure may have changed (e.g., app name rename). Check `APP_SRC` path in `ios/bin/xcodebuild` inside the hook.
