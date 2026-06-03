const {
  withEntitlementsPlist,
  withXcodeProject,
  withAndroidManifest,
  withDangerousMod,
  IOSConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP = "group.com.izonbeeli.shared";

const withIosAppGroup = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;
    const key = "com.apple.security.application-groups";
    const groups = entitlements[key] ?? [];
    if (!groups.includes(APP_GROUP)) groups.push(APP_GROUP);
    entitlements[key] = groups;
    return mod;
  });

const withIosWidgetExtension = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const targets = project.pbxNativeTargetSection();
    const alreadyAdded = Object.values(targets).some(
      (t) => typeof t === "object" && t.name === "BeeliWidget"
    );
    if (alreadyAdded) return mod;

    try {
      IOSConfig.XcodeUtils.addFramework(project, {
        target: project.getFirstTarget().uuid,
        framework: "WidgetKit.framework",
        weak: false,
      });
    } catch (_) {
      // WidgetKit may already be linked
    }

    return mod;
  });

const withIosWidgetSources = (config) =>
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

const withAndroidWidgets = (config) =>
  withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;

    const receivers = app.receiver ?? [];

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
      const exists = receivers.some((r) => r.$?.["android:name"] === w.name);
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

const withAndroidWidgetResources = (config) =>
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

const withBeeliWidget = (config) => {
  config = withIosAppGroup(config);
  config = withIosWidgetExtension(config);
  config = withIosWidgetSources(config);
  config = withAndroidWidgets(config);
  config = withAndroidWidgetResources(config);
  return config;
};

module.exports = withBeeliWidget;
