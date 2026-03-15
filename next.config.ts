import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function normalizePath(value: string): string {
  try {
    return fs.realpathSync.native(value);
  } catch {
    return path.resolve(value);
  }
}

function hasLocalNextPackage(root: string): boolean {
  return fs.existsSync(path.join(root, "node_modules", "next", "package.json"));
}

function resolveTurbopackRoot(): string {
  const candidates = [projectRoot, process.cwd()].map(normalizePath);
  const stableRoot = candidates.find(hasLocalNextPackage);
  return stableRoot ?? candidates[0];
}

const turbopackRoot = resolveTurbopackRoot();

const nextConfig: NextConfig = {
  // Fix Turbopack root detection on some Windows setups (prevents "Next.js package not found").
  turbopack: {
    root: turbopackRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    const staticRewrites = [
      {
        source: "/marketing",
        destination: "/",
      },
    ];

    const appUrl = process.env.APP_URL ? trimTrailingSlash(process.env.APP_URL) : null;

    if (!appUrl) {
      return staticRewrites;
    }

    return [
      ...staticRewrites,
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
