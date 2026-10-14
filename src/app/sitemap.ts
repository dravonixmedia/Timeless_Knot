import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getStories } from "@/content/stories";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/our-story", "/stories", "/experience", "/contact"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  // Demonstration stories are never submitted for indexing.
  const stories = getStories()
    .filter((story) => !story.isDemo)
    .map((story) => ({
      url: absoluteUrl(`/stories/${story.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

  return [...pages, ...stories];
}
