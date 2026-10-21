import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

/*
 * Production rules: everything public is crawlable — pages, photographs
 * (/media, /media-cache, /_next/image), scripts and styles (/_next/static) —
 * except the enquiry API, which only accepts form posts. Preview, staging and
 * workers.dev hosts are kept out of search engines by the Worker's
 * `X-Robots-Tag: noindex, nofollow` header (custom-worker.ts) rather than by
 * robots.txt, so crawlers can actually see that directive.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
