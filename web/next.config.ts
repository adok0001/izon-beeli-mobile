import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  webpack(config) {
    config.resolve.alias["@mobile"] = path.join(__dirname, "../mobile");
    return config;
  },
};

export default nextConfig;
