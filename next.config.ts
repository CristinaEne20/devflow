import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DevFlow renders every request dynamically (cookies + live DB data), so the
  // Cache Components / Partial Prefetching model is intentionally not used.
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
