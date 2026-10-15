import type { Media, StoryCategory, WeddingStory } from "./types";
import { assignSlots, composeGallery, toMedia, type ManifestImage } from "@/lib/compose-gallery";
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

export type MediaManifest = {
  version: 1;
  collections: Record<SiteCollection, ManifestImage[]>;
  /** Category galleries: photographs placed directly in weddings/, pre-wedding/, couples/. */
  galleries: Record<GalleryCategory, ManifestImage[]>;
  stories: ManifestStory[];
};

export const manifest = manifestJson as MediaManifest;

/**
 * Fills placeholder slots with the photographs in a collection.
 *
 * Images are taken in folder order; each slot prefers the next image whose
 * orientation matches the slot's art direction (portrait / landscape), and
 * only then accepts any remaining image. Slots with no photograph keep their
 * placeholder plate, so a half-filled folder never breaks a layout.
 */
export function fillSlots<K extends string>(collection: SiteCollection, slots: Record<K, Media>): Record<K, Media> {
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
