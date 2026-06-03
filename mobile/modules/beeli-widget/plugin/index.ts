import {
  type ConfigPlugin,
  withEntitlementsPlist,
  withXcodeProject,
  withAndroidManifest,
  withDangerousMod,
  IOSConfig,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const APP_GROUP = "group.com.izonbeeli.app";

const withIosAppGroup: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;
    const key = "com.apple.security.application-groups";
    const groups: string[] = entitlements[key] ?? [];
    if (!groups.includes(APP_GROUP)) groups.push(APP_GROUP);
    entitlements[key] = groups;
    return mod;
  });

const withIosWidgetExtension: ConfigPlugin = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const extName = "BeeliWidget";
    const bundleId = `${mod.ios?.bundleIdentifier ?? "com.izonbeeli.app"}.widget`;

    // Guard: only add the target once
    const targets = project.pbxNativeTargetSection();
    const alreadyAdded = Object.values(targets).some(
      (t: any) => typeof t === "object" && t.name === extName
    );
    if (alreadyAdded) return mod;

    IOSConfig.XcodeUtils.addFramework(project, {
      target: project.getFirstTarget().uuid,
      framework: "WidgetKit.framework",
      weak: false,
    });

    return mod;
  });

// Copy Swift widget sources into ios/ during prebuild
const withIosWidgetSources: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "ios",
    (mod) => {
      const src = path.join(__dirname, "../ios/BeeliWidget");
      const dest = path.join(mod.modRequest.platformProjectRoot, "BeeliWidget");
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        for (const file of fs.readdirSync(src)) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file));
        }
      }
      return mod;
    },
  ]);

const withAndroidWidgets: ConfigPlugin = (config) =>
  withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;

    const receivers: any[] = app.receiver ?? [];

    const widgets = [
      {
        name: "com.izonbeeli.app.widget.BeeliWotdWidget",
        label: "Beeli Word of the Day",
        resource: "@xml/widget_info_wotd",
      },
      {
        name: "com.izonbeeli.app.widget.BeeliPotmWidget",
        label: "Beeli Proverb of the Month",
        resource: "@xml/widget_info_potm",
      },
      {
        name: "com.izonbeeli.app.widget.BeeliSotwWidget",
        label: "Beeli Song of the Week",
        resource: "@xml/widget_info_sotw",
      },
    ];

    for (const w of widgets) {
      const exists = receivers.some((r: any) => r.$?.["android:name"] === w.name);
      if (!exists) {
        receivers.push({
          $: {
            "android:name": w.name,
            "android:label": w.label,
            "android:exported": "true",
          },
          "intent-filter": [
            {
              action: [
                { $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } },
              ],
            },
          ],
          "meta-data": [
            {
              $: {
                "android:name": "android.appwidget.provider",
                "android:resource": w.resource,
              },
            },
          ],
        });
      }
    }

    app.receiver = receivers;
    return mod;
  });

// Copy Android res files into android/app/src/main/res during prebuild
const withAndroidWidgetResources: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    "android",
    (mod) => {
      const srcBase = path.join(__dirname, "../android/src/main/res");
      const destBase = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/res"
      );

      for (const subdir of ["layout", "xml"]) {
        const srcDir = path.join(srcBase, subdir);
        const destDir = path.join(destBase, subdir);
        fs.mkdirSync(destDir, { recursive: true });
        for (const file of fs.readdirSync(srcDir)) {
          if (file.startsWith("widget_")) {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          }
        }
      }

      // Copy Kotlin sources
      const srcKt = path.join(
        __dirname,
        "../android/src/main/java/com/izonbeeli/app/widget"
      );
      const destKt = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/java/com/izonbeeli/app/widget"
      );
      fs.mkdirSync(destKt, { recursive: true });
      for (const file of fs.readdirSync(srcKt)) {
        fs.copyFileSync(path.join(srcKt, file), path.join(destKt, file));
      }

      return mod;
    },
  ]);

const withBeeliWidget: ConfigPlugin = (config) => {
  config = withIosAppGroup(config);
  config = withIosWidgetExtension(config);
  config = withIosWidgetSources(config);
  config = withAndroidWidgets(config);
  config = withAndroidWidgetResources(config);
  return config;
};

export default withBeeliWidget;
