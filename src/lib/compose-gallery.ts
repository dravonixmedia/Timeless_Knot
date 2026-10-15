import type { GalleryBlock, Media } from "../content/types";

/**
 * Pure helpers that turn manifest photographs into the site's media model and
 * editorial gallery sequences. No imports beyond types, so they are unit-tested
 * directly with Node's test runner (scripts/media/*.test.mjs).
 */

export type ManifestImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  focal?: string;
};

export const toMedia = (img: ManifestImage): Media => ({
  src: img.src,
  alt: img.alt,
  width: img.width,
  height: img.height,
  ...(img.focal ? { focal: img.focal } : {}),
});

export type Orientation = "portrait" | "landscape" | "square";
export const orientationOf = (m: { width: number; height: number }): Orientation => {
  const r = m.width / m.height;
  return r > 1.1 ? "landscape" : r < 0.9 ? "portrait" : "square";
};
export const fits = (want: Orientation, got: Orientation) => want === got || got === "square" || want === "square";

/** Assigns photographs to slots, matching orientation first, in order. Pure. */
export function assignSlots<K extends string>(images: ManifestImage[], slots: Record<K, Media>): Record<K, Media> {
  const pool = [...images];
  const out = { ...slots };
  const keys = Object.keys(slots) as K[];

  // Pass 1: orientation matches.
  const assigned = new Set<K>();
  for (const key of keys) {
    const want = orientationOf(slots[key]);
    const index = pool.findIndex((img) => fits(want, orientationOf(img)));
    if (index !== -1) {
      out[key] = toMedia(pool.splice(index, 1)[0]);
      assigned.add(key);
    }
  }
  // Pass 2: anything left, in order.
  for (const key of keys) {
    if (!assigned.has(key) && pool.length) out[key] = toMedia(pool.shift()!);
  }
  return out;
}

/**
 * Composes an editorial sequence from an ordered list of photographs.
 * Consecutive portraits are grouped into pairs and trios; landscapes alternate
 * between full-bleed frames and offset singles. Optional pull quotes from the
 * story metadata are woven in after every third block. Deterministic.
 */
export function composeGallery(images: ManifestImage[], statements: string[] = []): GalleryBlock[] {
  const blocks: GalleryBlock[] = [];
  let portraits: Media[] = [];
  let landscapeTurn = 0;
  let singleTurn = 0;
  let pairTurn = 0;

  const flushPortraits = () => {
    while (portraits.length) {
      if (portraits.length >= 3 && portraits.length !== 4) {
        blocks.push({ kind: "trio", images: [portraits[0], portraits[1], portraits[2]] });
        portraits = portraits.slice(3);
      } else if (portraits.length >= 2) {
        blocks.push({ kind: "pair", images: [portraits[0], portraits[1]], stagger: pairTurn++ % 2 === 0 });
        portraits = portraits.slice(2);
      } else {
        blocks.push({ kind: "single", image: portraits[0], align: (["center", "right", "left"] as const)[singleTurn++ % 3] });
        portraits = [];
      }
    }
  };

  for (const img of images) {
    const media = toMedia(img);
    if (orientationOf(img) === "portrait") {
      portraits.push(media);
      continue;
    }
    flushPortraits();
    const wide = img.width / img.height >= 1.6;
    if (wide || landscapeTurn % 2 === 0) blocks.push({ kind: "full", image: media });
    else blocks.push({ kind: "single", image: media, align: singleTurn++ % 2 === 0 ? "left" : "right" });
    landscapeTurn += 1;
  }
  flushPortraits();

  if (!statements.length) return blocks;
  const woven: GalleryBlock[] = [];
  let s = 0;
  blocks.forEach((block, i) => {
    woven.push(block);
    if ((i + 1) % 3 === 0 && s < statements.length && i < blocks.length - 1) woven.push({ kind: "statement", text: statements[s++] });
  });
  return woven;
}

