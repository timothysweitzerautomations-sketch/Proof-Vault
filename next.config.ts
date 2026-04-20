import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
      // Capacitor WebViews may send unusual Origin headers; mobile OAuth should not rely on Server Actions.
      allowedOrigins: [
        "proof-vault-delta.vercel.app",
        "*.vercel.app",
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost:3001",
        "127.0.0.1:3001",
      ],
    },
  },
};

export default nextConfig;
