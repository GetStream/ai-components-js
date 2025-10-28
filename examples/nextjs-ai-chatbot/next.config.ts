import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["us-east.stream-io-cdn.com"],
  },
};

export default nextConfig;
