import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ai-marketomg/agent",
    "@ai-marketomg/approvals",
    "@ai-marketomg/core",
    "@ai-marketomg/crm-adapter",
    "@ai-marketomg/mock-crm",
  ],
  // Ensure workspace packages resolve from monorepo root
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // NodeNext packages import with .js; map to .ts sources for transpilePackages
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
