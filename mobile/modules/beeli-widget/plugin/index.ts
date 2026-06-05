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

const APP_GROUP = "group.com.izonbeeli.shared";

const withIosAppGroup: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;
    const key = "com.apple.security.application-groups";
    const groups: string[] = (entitlements[key] as string[]) ?? [];
    if (!groups.includes(APP_GROUP)) groups.push(APP_GROUP);
    entitlements[key] = groups;
    return mod;
  });

const withIosWidgetExtension: ConfigPlugin = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const extName = "BeeliWidget";
    const mainBundleId = config.ios?.bundleIdentifier ?? "com.izonbeeli.app";
    const widgetBundleId = `${mainBundleId}.BeeliWidget`;
    const deploymentTarget = "16.0";

    const nativeTargets = project.pbxNativeTargetSection();
    const alreadyAdded = Object.values(nativeTargets).some(
      (t: any) =>
        typeof t === "object" &&
        (t.name === extName || t.name === `"${extName}"`)
    );
    if (alreadyAdded) return mod;

    const objs = project.hash.project.objects;
    const g = () => project.generateUuid();

    const TARGET_UUID = g();
    const DEBUG_CONFIG = g();
    const RELEASE_CONFIG = g();
    const CONFIG_LIST = g();
    const SOURCES_PHASE = g();
    const RESOURCES_PHASE = g();
    const FRAMEWORKS_PHASE = g();
    const INFO_PLIST_REF = g();
    const ENTITLEMENTS_REF = g();
    const BUNDLE_SWIFT_REF = g();
    const WIDGET_SWIFT_REF = g();
    const PRODUCT_REF = g();
    const GROUP_UUID = g();
    const BUNDLE_SWIFT_BF = g();
    const WIDGET_SWIFT_BF = g();
    const WIDGETKIT_REF = g();
    const WIDGETKIT_BF = g();
    const SWIFTUI_REF = g();
    const SWIFTUI_BF = g();
    const EMBED_BF = g();
    const EMBED_PHASE = g();
    const DEPENDENCY = g();
    const CONTAINER_PROXY = g();

    // File references
    objs["PBXFileReference"][INFO_PLIST_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "text.plist.xml",
      path: '"Info.plist"',
      sourceTree: '"<group>"',
    };
    objs["PBXFileReference"][`${INFO_PLIST_REF}_comment`] = "Info.plist";

    objs["PBXFileReference"][ENTITLEMENTS_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "text.plist.entitlements",
      path: '"BeeliWidget.entitlements"',
      sourceTree: '"<group>"',
    };
    objs["PBXFileReference"][`${ENTITLEMENTS_REF}_comment`] = "BeeliWidget.entitlements";

    objs["PBXFileReference"][BUNDLE_SWIFT_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.swift",
      path: '"BeeliWidgetBundle.swift"',
      sourceTree: '"<group>"',
    };
    objs["PBXFileReference"][`${BUNDLE_SWIFT_REF}_comment`] = "BeeliWidgetBundle.swift";

    objs["PBXFileReference"][WIDGET_SWIFT_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "sourcecode.swift",
      path: '"BeeliWidget.swift"',
      sourceTree: '"<group>"',
    };
    objs["PBXFileReference"][`${WIDGET_SWIFT_REF}_comment`] = "BeeliWidget.swift";

    objs["PBXFileReference"][PRODUCT_REF] = {
      isa: "PBXFileReference",
      explicitFileType: '"archive.appextension"',
      includeInIndex: 0,
      path: '"BeeliWidget.appex"',
      sourceTree: "BUILT_PRODUCTS_DIR",
    };
    objs["PBXFileReference"][`${PRODUCT_REF}_comment`] = "BeeliWidget.appex";

    objs["PBXFileReference"][WIDGETKIT_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "wrapper.framework",
      name: '"WidgetKit.framework"',
      path: '"System/Library/Frameworks/WidgetKit.framework"',
      sourceTree: "SDKROOT",
    };
    objs["PBXFileReference"][`${WIDGETKIT_REF}_comment`] = "WidgetKit.framework";

    objs["PBXFileReference"][SWIFTUI_REF] = {
      isa: "PBXFileReference",
      lastKnownFileType: "wrapper.framework",
      name: '"SwiftUI.framework"',
      path: '"System/Library/Frameworks/SwiftUI.framework"',
      sourceTree: "SDKROOT",
    };
    objs["PBXFileReference"][`${SWIFTUI_REF}_comment`] = "SwiftUI.framework";

    // Build files
    objs["PBXBuildFile"][BUNDLE_SWIFT_BF] = {
      isa: "PBXBuildFile",
      fileRef: BUNDLE_SWIFT_REF,
      fileRef_comment: "BeeliWidgetBundle.swift",
    };
    objs["PBXBuildFile"][`${BUNDLE_SWIFT_BF}_comment`] = "BeeliWidgetBundle.swift in Sources";

    objs["PBXBuildFile"][WIDGET_SWIFT_BF] = {
      isa: "PBXBuildFile",
      fileRef: WIDGET_SWIFT_REF,
      fileRef_comment: "BeeliWidget.swift",
    };
    objs["PBXBuildFile"][`${WIDGET_SWIFT_BF}_comment`] = "BeeliWidget.swift in Sources";

    objs["PBXBuildFile"][WIDGETKIT_BF] = {
      isa: "PBXBuildFile",
      fileRef: WIDGETKIT_REF,
      fileRef_comment: "WidgetKit.framework",
    };
    objs["PBXBuildFile"][`${WIDGETKIT_BF}_comment`] = "WidgetKit.framework in Frameworks";

    objs["PBXBuildFile"][SWIFTUI_BF] = {
      isa: "PBXBuildFile",
      fileRef: SWIFTUI_REF,
      fileRef_comment: "SwiftUI.framework",
    };
    objs["PBXBuildFile"][`${SWIFTUI_BF}_comment`] = "SwiftUI.framework in Frameworks";

    objs["PBXBuildFile"][EMBED_BF] = {
      isa: "PBXBuildFile",
      fileRef: PRODUCT_REF,
      fileRef_comment: "BeeliWidget.appex",
      settings: { ATTRIBUTES: ["RemoveHeadersOnCopy"] },
    };
    objs["PBXBuildFile"][`${EMBED_BF}_comment`] = "BeeliWidget.appex in Embed Foundation Extensions";

    // Build phases for the extension target
    objs["PBXSourcesBuildPhase"][SOURCES_PHASE] = {
      isa: "PBXSourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [
        { value: BUNDLE_SWIFT_BF, comment: "BeeliWidgetBundle.swift in Sources" },
        { value: WIDGET_SWIFT_BF, comment: "BeeliWidget.swift in Sources" },
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };
    objs["PBXSourcesBuildPhase"][`${SOURCES_PHASE}_comment`] = "Sources";

    objs["PBXResourcesBuildPhase"][RESOURCES_PHASE] = {
      isa: "PBXResourcesBuildPhase",
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    objs["PBXResourcesBuildPhase"][`${RESOURCES_PHASE}_comment`] = "Resources";

    objs["PBXFrameworksBuildPhase"][FRAMEWORKS_PHASE] = {
      isa: "PBXFrameworksBuildPhase",
      buildActionMask: 2147483647,
      files: [
        { value: WIDGETKIT_BF, comment: "WidgetKit.framework in Frameworks" },
        { value: SWIFTUI_BF, comment: "SwiftUI.framework in Frameworks" },
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };
    objs["PBXFrameworksBuildPhase"][`${FRAMEWORKS_PHASE}_comment`] = "Frameworks";

    // Group for BeeliWidget folder
    objs["PBXGroup"][GROUP_UUID] = {
      isa: "PBXGroup",
      children: [
        { value: BUNDLE_SWIFT_REF, comment: "BeeliWidgetBundle.swift" },
        { value: WIDGET_SWIFT_REF, comment: "BeeliWidget.swift" },
        { value: INFO_PLIST_REF, comment: "Info.plist" },
        { value: ENTITLEMENTS_REF, comment: "BeeliWidget.entitlements" },
      ],
      path: '"BeeliWidget"',
      sourceTree: '"<group>"',
    };
    objs["PBXGroup"][`${GROUP_UUID}_comment`] = extName;

    // Add to main group
    const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
    const mainGroupObj = objs["PBXGroup"][mainGroupKey];
    if (mainGroupObj) {
      mainGroupObj.children.push({ value: GROUP_UUID, comment: extName });
    }

    // Add product ref to Products group
    const productsGroupKey = Object.keys(objs["PBXGroup"]).find((k) => {
      const o = objs["PBXGroup"][k];
      return typeof o === "object" && o.name === '"Products"';
    });
    if (productsGroupKey) {
      objs["PBXGroup"][productsGroupKey].children.push({
        value: PRODUCT_REF,
        comment: "BeeliWidget.appex",
      });
    }

    // Build configurations
    const sharedSettings: Record<string, any> = {
      CODE_SIGN_ENTITLEMENTS: '"BeeliWidget/BeeliWidget.entitlements"',
      CODE_SIGN_STYLE: "Manual",
      DEVELOPMENT_TEAM: "FWL2W5X58S",
      PROVISIONING_PROFILE: "6fa74258-249d-4bb2-98ea-09c5d2b47a56",
      CURRENT_PROJECT_VERSION: "1",
      GENERATE_INFOPLIST_FILE: "NO",
      INFOPLIST_FILE: '"BeeliWidget/Info.plist"',
      IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
      LD_RUNPATH_SEARCH_PATHS: [
        '"$(inherited)"',
        '"@executable_path/Frameworks"',
        '"@executable_path/../../Frameworks"',
      ],
      MARKETING_VERSION: "1.0",
      PRODUCT_BUNDLE_IDENTIFIER: `"${widgetBundleId}"`,
      PRODUCT_NAME: '"$(TARGET_NAME)"',
      SKIP_INSTALL: "YES",
      SWIFT_EMIT_LOC_STRINGS: "YES",
      SWIFT_VERSION: '"5.0"',
      TARGETED_DEVICE_FAMILY: '"1,2"',
    };

    objs["XCBuildConfiguration"][DEBUG_CONFIG] = {
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...sharedSettings,
        MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
        SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
        SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
      },
      name: "Debug",
    };
    objs["XCBuildConfiguration"][`${DEBUG_CONFIG}_comment`] = "Debug";

    objs["XCBuildConfiguration"][RELEASE_CONFIG] = {
      isa: "XCBuildConfiguration",
      buildSettings: {
        ...sharedSettings,
        COPY_PHASE_STRIP: "NO",
        DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"',
        MTL_ENABLE_DEBUG_INFO: "NO",
        SWIFT_OPTIMIZATION_LEVEL: '"-Owholemodule"',
        VALIDATE_PRODUCT: "YES",
      },
      name: "Release",
    };
    objs["XCBuildConfiguration"][`${RELEASE_CONFIG}_comment`] = "Release";

    objs["XCConfigurationList"][CONFIG_LIST] = {
      isa: "XCConfigurationList",
      buildConfigurations: [
        { value: DEBUG_CONFIG, comment: "Debug" },
        { value: RELEASE_CONFIG, comment: "Release" },
      ],
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: "Release",
    };
    objs["XCConfigurationList"][`${CONFIG_LIST}_comment`] =
      `Build configuration list for PBXNativeTarget "${extName}"`;

    // Native target
    objs["PBXNativeTarget"][TARGET_UUID] = {
      isa: "PBXNativeTarget",
      buildConfigurationList: CONFIG_LIST,
      buildConfigurationList_comment: `Build configuration list for PBXNativeTarget "${extName}"`,
      buildPhases: [
        { value: SOURCES_PHASE, comment: "Sources" },
        { value: FRAMEWORKS_PHASE, comment: "Frameworks" },
        { value: RESOURCES_PHASE, comment: "Resources" },
      ],
      buildRules: [],
      dependencies: [],
      name: `"${extName}"`,
      productName: `"${extName}"`,
      productReference: PRODUCT_REF,
      productReference_comment: "BeeliWidget.appex",
      productType: '"com.apple.product-type.app-extension"',
    };
    objs["PBXNativeTarget"][`${TARGET_UUID}_comment`] = extName;

    // Add target to project targets list
    project.getFirstProject().firstProject.targets.push({
      value: TARGET_UUID,
      comment: extName,
    });

    // Target dependency wiring
    objs["PBXContainerItemProxy"] = objs["PBXContainerItemProxy"] ?? {};
    objs["PBXContainerItemProxy"][CONTAINER_PROXY] = {
      isa: "PBXContainerItemProxy",
      containerPortal: project.getFirstProject().uuid,
      containerPortal_comment: "Project object",
      proxyType: 1,
      remoteGlobalIDString: TARGET_UUID,
      remoteInfo: `"${extName}"`,
    };
    objs["PBXContainerItemProxy"][`${CONTAINER_PROXY}_comment`] = "PBXContainerItemProxy";

    objs["PBXTargetDependency"] = objs["PBXTargetDependency"] ?? {};
    objs["PBXTargetDependency"][DEPENDENCY] = {
      isa: "PBXTargetDependency",
      target: TARGET_UUID,
      target_comment: extName,
      targetProxy: CONTAINER_PROXY,
      targetProxy_comment: "PBXContainerItemProxy",
    };
    objs["PBXTargetDependency"][`${DEPENDENCY}_comment`] = "PBXTargetDependency";

    const mainTargetUuid = project.getFirstTarget().uuid;
    const mainTargetObj = objs["PBXNativeTarget"][mainTargetUuid];
    if (mainTargetObj) {
      mainTargetObj.dependencies = mainTargetObj.dependencies ?? [];
      mainTargetObj.dependencies.push({
        value: DEPENDENCY,
        comment: "PBXTargetDependency",
      });

      // Embed extensions phase on the main app target
      objs["PBXCopyFilesBuildPhase"] = objs["PBXCopyFilesBuildPhase"] ?? {};
      objs["PBXCopyFilesBuildPhase"][EMBED_PHASE] = {
        isa: "PBXCopyFilesBuildPhase",
        buildActionMask: 2147483647,
        dstPath: '""',
        dstSubfolderSpec: 13,
        files: [
          {
            value: EMBED_BF,
            comment: "BeeliWidget.appex in Embed Foundation Extensions",
          },
        ],
        name: '"Embed Foundation Extensions"',
        runOnlyForDeploymentPostprocessing: 0,
      };
      objs["PBXCopyFilesBuildPhase"][`${EMBED_PHASE}_comment`] =
        "Embed Foundation Extensions";

      mainTargetObj.buildPhases.push({
        value: EMBED_PHASE,
        comment: "Embed Foundation Extensions",
      });
    }

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
