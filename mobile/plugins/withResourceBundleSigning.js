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
    end
`;

module.exports = function withResourceBundleSigning(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (!podfile.includes("CODE_SIGNING_ALLOWED")) {
        podfile = podfile.replace(
          /(\s*react_native_post_install\([\s\S]*?\))\s*\n(\s*end\s*\nend)/,
          `$1\n${PATCH}\n  $2`
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};
