import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Until a production URL is configured, keep previews out of search engines.
  if (!site.hasProductionUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
