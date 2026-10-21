import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getStories } from "@/content/stories";

/**
 * The five public pages (src/app/{page,our-story,stories,experience,contact})
 * plus every published story, as absolute canonical URLs.
 *
 * No lastModified: pages are rebuilt on every deployment, so a build time would
 * claim changes that did not happen. No changeFrequency or priority either:
 * search engines ignore them and they would carry no real information.
 * Filtered portfolio URLs (/stories?category=…) are views of /stories, not
 * separate pages, and are not listed.
 */
const PUBLIC_PAGES = ["/", "/our-story", "/stories", "/experience", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const stories = getStories().map((story) => `/stories/${story.slug}`);
  return [...PUBLIC_PAGES, ...stories].map((path) => ({ url: absoluteUrl(path) }));
}
