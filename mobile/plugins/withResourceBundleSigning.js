const { withDangerousMod } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");
const path = require("path");
const fs = require("fs");

module.exports = function withResourceBundleSigning(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      const snippet = `
    installer.pods_project.targets.each do |target|
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end`;

      podfile = mergeContents({
        tag: "withResourceBundleSigning",
        src: podfile,
        newSrc: snippet,
        anchor: /react_native_post_install\(/,
        offset: 5,
        comment: "#",
      }).contents;

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
