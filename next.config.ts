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
    // The site icon is app/icon.svg; send legacy /favicon.ico requests there
    // instead of rendering a 404 page through the Worker.
    return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: true }];
  },
  images: {
    // Only photographs in public/media/ (discovered by the image manifest) are optimised.
    localPatterns: [{ pathname: "/media/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
  },
};

export default nextConfig;
