import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySmizeLimit: "12mb",
    },
  },
  sassOptions: {
    includePaths: [path.join(process.cwd())],
  },
};

export default nextConfig;
