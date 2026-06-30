import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosted natively on Vercel: no static `output: "export"`, so we get
  // server rendering, image optimisation and Next.js routing for free.
  reactCompiler: true,
};

export default nextConfig;
