import type { WeddingStory } from "./types";
import { storiesFromManifest } from "./media";

/**
 * Wedding stories.
 *
 * Stories come only from folders in public/media/{weddings,pre-wedding,couples}/
 * with a valid story.json and `"published": true` (see docs/IMAGE-UPLOADS.md),
 * discovered at build time. Drafts and invalid stories are never public. While
 * none is published the list is empty and story sections are not rendered.
 */
export const stories: WeddingStory[] = storiesFromManifest();

export function getStories() {
  return stories;
}

/** Featured stories first, topped up with the latest others so the section is never half empty. */
export function getFeaturedStories(limit = 3) {
  const featured = stories.filter((story) => story.featured);
  const others = stories.filter((story) => !story.featured);
  return [...featured, ...others].slice(0, limit);
}

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export function getNextStory(slug: string) {
  const index = stories.findIndex((story) => story.slug === slug);
  if (index === -1 || stories.length < 2) return undefined;
  return stories[(index + 1) % stories.length];
}

/** Categories that actually contain at least one story — avoids empty filters. */
export function getStoryCategories() {
  return Array.from(new Set(stories.map((story) => story.category)));
}

/** First story with a playable film, used by the home page film section. */
export function getShowcaseFilm() {
  return stories.find((story) => story.film?.src || story.film?.embedUrl)?.film;
}
