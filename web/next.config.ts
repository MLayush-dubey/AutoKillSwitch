import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-slider", "@radix-ui/react-switch", "@radix-ui/react-tabs", "@radix-ui/react-dialog", "@radix-ui/react-accordion"],
  },
};

export default nextConfig;
