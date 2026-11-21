import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets people on the same Wi-Fi use the dev server by its network address.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
