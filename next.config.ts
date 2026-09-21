import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "prev-responsible-products-regional.trycloudflare.com",
  ],

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
