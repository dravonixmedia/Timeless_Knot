/**
 * Content model for Timeless Knot.
 *
 * These types are deliberately presentation-agnostic so a headless CMS can
 * later supply the same shapes without any redesign of the components.
 */

export type Media = {
  /** Path inside /public or an allowed remote URL. Every Media is a real photograph. */
  src: string;
  /** Descriptive alt text based on verified content. */
  alt: string;
  /** Intrinsic dimensions — used to preserve the original aspect ratio. */
  width: number;
  height: number;
  /** CSS object-position for art-directed crops, e.g. "50% 30%". */
  focal?: string;
};

export type Film = {
  title: string;
  /** Self-hosted video file (MP4/WebM). */
  src?: string;
  /** Alternatively a privacy-friendly embed URL (YouTube-nocookie or Vimeo). */
  embedUrl?: string;
  poster: Media;
  /** Human readable, e.g. "4 min" — only when known. */
  duration?: string;
};

export type StoryCategory = "Wedding Photography" | "Wedding Film" | "Elopement" | "Pre-Wedding" | "Couple Story";

export type GalleryBlock =
  | { kind: "full"; image: Media; caption?: string }
  | { kind: "single"; image: Media; align: "left" | "right" | "center"; caption?: string }
  | { kind: "pair"; images: [Media, Media]; stagger?: boolean }
  | { kind: "trio"; images: [Media, Media, Media] }
  | { kind: "statement"; text: string };

export type WeddingStory = {
  slug: string;
  /** Editorial title for the feature. */
  title: string;
  /** Couple names as they wish to be credited. */
  couple?: string;
  location?: string;
  /** ISO date (YYYY-MM-DD) when confirmed. */
  date?: string;
  category: StoryCategory;
  featured: boolean;
  /** Short line for cards and meta descriptions. */
  excerpt: string;
  /** Opening paragraphs of the story page. */
  introduction: string[];
  closing?: string;
  cover: Media;
  gallery: GalleryBlock[];
  film?: Film;
  seo?: { title?: string; description?: string };
};
