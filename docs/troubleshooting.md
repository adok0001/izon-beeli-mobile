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
