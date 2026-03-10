import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // pino-pretty and encoding are optional deps pulled in by @walletconnect/logger
    // via pino — they don't exist in the browser bundle, so tell webpack to ignore them
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        "pino-pretty": false,
        encoding: false,
      },
      alias: {
        ...config.resolve?.alias,
        // @metamask/sdk pulls in React Native deps — stub them out for browser builds
        "@react-native-async-storage/async-storage": false,
        "react-native": false,
      },
    };
    return config;
  },
  // ParaSpell only runs server-side in API routes — no client bundling needed
  serverExternalPackages: [
    "@paraspell/sdk",
    "@paraspell/sdk-core",
    "@noble/curves",
    "@noble/hashes",
    "@polkadot-labs/hdkd",
    "@polkadot-labs/hdkd-helpers",
  ],
};

export default nextConfig;
