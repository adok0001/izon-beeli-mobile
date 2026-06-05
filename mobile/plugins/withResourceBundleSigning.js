const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const PATCH = `
    installer.pods_project.targets.each do |target|
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end`;

module.exports = function withResourceBundleSigning(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes("CODE_SIGNING_ALLOWED")) {
        return config;
      }

      // Insert patch just before the closing `end` of the post_install block
      podfile = podfile.replace(
        "react_native_post_install(\n      installer,",
        `react_native_post_install(\n      installer,`
      );

      // Find post_install block and append before its closing end
      const postInstallEnd = "  end\nend";
      const lastIndex = podfile.lastIndexOf(postInstallEnd);
      if (lastIndex !== -1) {
        podfile =
          podfile.slice(0, lastIndex) +
          PATCH +
          "\n" +
          podfile.slice(lastIndex);
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
