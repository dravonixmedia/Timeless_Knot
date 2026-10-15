"use client";

import { useState } from "react";
import type { CategoryGallery, GalleryCategory } from "@/content/media";
import { Picture } from "@/components/media/Picture";
import { reveal } from "@/components/ui/Typography";

/**
 * Category portfolio (weddings, pre-wedding, couples). A column-based masonry
 * keeps every photograph at its original aspect ratio — portrait, landscape or
 * square — so nothing is cropped or forced into a uniform tile.
 */
export function PortfolioGallery({ galleries }: { galleries: CategoryGallery[] }) {
  const [active, setActive] = useState<GalleryCategory | "all">("all");
  const showFilters = galleries.length > 1;
  const images =
    active === "all"
      ? galleries.flatMap((g) => g.images)
      : (galleries.find((g) => g.key === active)?.images ?? []);

  return (
    <div>
      {showFilters && (
        <div className="flex flex-col gap-6 border-y border-charcoal/12 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter photographs by category" className="-mx-2 flex flex-wrap gap-x-2 gap-y-1">
            {([{ key: "all", title: "All" }, ...galleries] as const).map((option) => {
              const selected = active === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(option.key)}
                  className={`meta min-h-11 px-2 text-[0.64rem] tracking-[0.2em] transition-colors duration-500 ${
                    selected ? "text-charcoal" : "text-muted hover:text-charcoal"
                  }`}
                >
                  <span className={selected ? "border-b border-current pb-1" : "link-draw"}>{option.title}</span>
                </button>
              );
            })}
          </div>
          <p className="meta text-[0.62rem] text-muted" aria-live="polite">
            {images.length} {images.length === 1 ? "photograph" : "photographs"}
          </p>
        </div>
      )}

      <div key={active} className="mt-12 columns-1 gap-5 sm:columns-2 sm:gap-6 lg:mt-16 lg:columns-3 lg:gap-8">
        {images.map((image, i) => (
          <figure key={image.src} className="mb-5 break-inside-avoid sm:mb-6 lg:mb-8" {...reveal("mask", (i % 3) * 0.08)}>
            <Picture media={image} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw" />
          </figure>
        ))}
      </div>
    </div>
  );
}
