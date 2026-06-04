import path from "path";
import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack(config) {
    config.resolve.alias["@mobile"] = path.join(__dirname, "../mobile");
    return config;
  },
};

export default nextConfig;
