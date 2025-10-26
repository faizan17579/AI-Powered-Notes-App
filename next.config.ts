import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
