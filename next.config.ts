import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Cache Components (and Partial Prefetching, which requires it) are left off:
   * on Cloudflare Workers their render scheduler depends on Node.js timer
   * internals that workerd does not provide, and requests deadlock (see the
   * OpenNext Cloudflare adapter's experimental e2e fixture). Every route here is
   * statically generated, so standard SSG serves the same pages.
   */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // The official favicon is app/favicon.ico. Earlier builds permanently
    // redirected /favicon.ico to a provisional /icon.svg, and browsers cache
    // permanent redirects, so /icon.svg now points to the official icon
    // (temporary, so it can be dropped later without leaving a stale chain).
    return [{ source: "/icon.svg", destination: "/icon.png", permanent: false }];
  },
  images: {
    // Only photographs discovered by the image manifest are optimised: their
    // content-addressed copies in /media-cache/<hash>/ (and the originals).
    localPatterns: [
      { pathname: "/media-cache/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
  },
};

export default nextConfig;
