import type { NextConfig } from "next";
import CopyPlugin from "copy-webpack-plugin";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.join(
                process.cwd(),
                "node_modules/@prisma/client/runtime/*.wasm",
              ),
              to: path.join(process.cwd(), ".next/server/"),
              noErrorOnMissing: true,
            },
            {
              from: path.join(
                process.cwd(),
                "node_modules/@prisma/client/runtime/*.mjs",
              ),
              to: path.join(process.cwd(), ".next/server/"),
              noErrorOnMissing: true,
            },
          ],
        }),
      );
    }

    config.externals = [...(config.externals || []), "@prisma/client"];

    return config;
  },
};

export default nextConfig;
