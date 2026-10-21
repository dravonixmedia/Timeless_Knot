import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

/*
 * Production rules. Preview and workers.dev hosts are kept out of search
 * engines by the Worker's `X-Robots-Tag: noindex` header (custom-worker.ts),
 * which lets crawlers see that directive instead of being blocked from it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
