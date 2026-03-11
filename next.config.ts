import type { NextConfig } from "next";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    const appUrl = process.env.APP_URL ? trimTrailingSlash(process.env.APP_URL) : null;

    if (!appUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${appUrl}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${appUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
