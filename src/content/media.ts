import type { Media, StoryCategory, WeddingStory } from "./types";
import { assignSlots, composeGallery, toMedia, type ManifestImage, type Orientation, type SlotFill } from "@/lib/compose-gallery";
import manifestJson from "./generated/media-manifest.json";

/**
 * Typed access to the build-time image manifest.
 *
 * `generated/media-manifest.json` is written by
 * scripts/media/generate-image-manifest.mjs before every build (and on
 * install). It is bundled into the site, so nothing here reads the
 * filesystem at runtime — safe for Cloudflare Workers.
 */

export type { ManifestImage };

export type SiteCollection = "home/hero" | "home/featured" | "about" | "experience" | "contact";

export type ManifestStory = {
  slug: string;
  collection: "weddings" | "pre-wedding" | "couples";
  title: string;
  couple?: string;
  location?: string;
  date?: string;
  category: StoryCategory;
  featured: boolean;
  position?: number;
  excerpt?: string;
  introduction: string[];
  closing?: string;
  statements: string[];
  cover: ManifestImage;
  gallery: ManifestImage[];
  film?: { title: string; embedUrl: string; poster: ManifestImage; duration?: string };
  seo?: { title?: string; description?: string };
};

export type GalleryCategory = "weddings" | "pre-wedding" | "couples";

/** The homepage film uploaded to public/media/home/video/ (H.264 MP4). */
export type HomeVideo = {
  src: string;
  type: "video/mp4";
  /** Display dimensions (rotation applied) — used to size the frame without layout shift. */
  width: number;
  height: number;
  /** Seconds. */
  duration: number;
  hasAudio: boolean;
  bytes: number;
  /** Content fingerprint of the MP4: the stream URL carries it, so it can be cached as immutable. */
  hash?: string;
  poster?: ManifestImage;
};

export type MediaManifest = {
  version: 1;
  collections: Record<SiteCollection, ManifestImage[]>;
  /** Category galleries: photographs placed directly in weddings/, pre-wedding/, couples/. */
  galleries: Record<GalleryCategory, ManifestImage[]>;
  stories: ManifestStory[];
  /** Null while no valid video is uploaded — the homepage film section is then not rendered. */
  video: HomeVideo | null;
};

export const manifest = manifestJson as MediaManifest;

/** The uploaded homepage film, or undefined when none is published. */
export function getHomeVideo(): HomeVideo | undefined {
  return manifest.video ?? undefined;
}

/**
 * Fills a page's photograph slots from a collection.
 *
 * Images are taken in folder order; each slot prefers the next image matching
 * its orientation, and only then accepts any remaining image. A slot without a
 * photograph is simply absent, so the page leaves that image block out — no
 * placeholder is ever shown. Photographs beyond the slots come back as `extra`.
 */
export function fillSlots<K extends string>(collection: SiteCollection, slots: Record<K, Orientation>): SlotFill<K> {
  return assignSlots(manifest.collections[collection] ?? [], slots);
}

const galleryTitles: Record<GalleryCategory, string> = {
  weddings: "Weddings",
  "pre-wedding": "Pre-Wedding",
  couples: "Couples",
};

export type CategoryGallery = { key: GalleryCategory; title: string; images: Media[] };

/**
 * Category galleries that contain at least one photograph, in a fixed order.
 * Images keep their real dimensions so they are shown uncropped.
 */
export function getCategoryGalleries(): CategoryGallery[] {
  return (Object.keys(galleryTitles) as GalleryCategory[])
    .map((key) => ({ key, title: galleryTitles[key], images: (manifest.galleries?.[key] ?? []).map(toMedia) }))
    .filter((gallery) => gallery.images.length > 0);
}

/** Converts published manifest stories into the site's WeddingStory model. */
export function storiesFromManifest(): WeddingStory[] {
  return manifest.stories.map((s) => {
    const where = s.location ? ` in ${s.location}` : "";
    const excerpt = s.excerpt ?? `${s.category}${where} by Timeless Knot.`;
    return {
      slug: s.slug,
      title: s.title,
      ...(s.couple ? { couple: s.couple } : {}),
      ...(s.location ? { location: s.location } : {}),
      ...(s.date ? { date: s.date } : {}),
      category: s.category,
      featured: s.featured,
      excerpt,
      introduction: s.introduction,
      ...(s.closing ? { closing: s.closing } : {}),
      cover: toMedia(s.cover),
      gallery: composeGallery(s.gallery, s.statements),
      ...(s.film ? { film: { title: s.film.title, embedUrl: s.film.embedUrl, poster: toMedia(s.film.poster), ...(s.film.duration ? { duration: s.film.duration } : {}) } } : {}),
      ...(s.seo ? { seo: s.seo } : {}),
    };
  });
}
