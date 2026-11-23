import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep images independent from Vercel's paid optimization endpoint. Static
  // assets are already appropriately sized and private media is served by S3.
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
