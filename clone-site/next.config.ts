import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
