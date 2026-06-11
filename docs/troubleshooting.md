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

## EAS iOS local build: "Provisioning profile doesn't include signing certificate"

**Error string (greppable):**
```
Provisioning profile "*[expo] com.izonbeeli.app AppStore ..." doesn't include signing certificate "iPhone Distribution: TAMARALAYEFA ADOKEME (FWL2W5X58S)". (in target 'Beeli' from project 'Beeli')
```

**Symptom:** Local EAS build fails during the archive step. xcodebuild selected the wrong distribution certificate for the Beeli target.

**Root cause:** EAS created a separate distribution certificate when BeeliWidget credentials were set up (cert serial `5CE7E330...`), in addition to the existing Beeli cert (`6A90AF50...`). Both are imported into the keychain. Both share the same subject name ("iPhone Distribution: TAMARALAYEFA ADOKEME"), so xcodebuild picks one non-deterministically — if it picks the BeeliWidget cert for the Beeli target, the Beeli provisioning profile rejects it.

**Workaround (active):** `scripts/eas-build-pre-build.sh` (wired as `eas-build-post-install` in `package.json`) removes the BeeliWidget cert from the EAS keychain before xcodebuild runs, leaving only the unambiguous Beeli cert. Hardcoded fingerprint: `381920BF3AD6F190E62F52AE92931FF51D37E3FB`.

**Permanent fix:** Run `eas credentials -p ios` from `mobile/`, select the **BeeliWidget** target → **Distribution Certificate** → **Use existing certificate**, choose the Beeli cert (serial `6A90AF50D3B8CD732C65E3EEAE3921A6`), then regenerate the BeeliWidget provisioning profile. Once both targets share one cert, the pre-build hook is no longer needed and can be removed.

**If the workaround stops working** (hook prints "cert not found"), EAS regenerated the BeeliWidget cert. Update `WIDGET_CERT_SHA1` in `scripts/eas-build-pre-build.sh` with the new fingerprint (check via `eas credentials -p ios`), or apply the permanent fix above.
