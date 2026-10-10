import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@resilix/ui-components",
    "@resilix/ui-chat",
    "@resilix/ui-canvas",
  ],
};
export default nextConfig;
