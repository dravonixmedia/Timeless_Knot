"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { CategoryGallery, GalleryCategory } from "@/content/media";
import { categoryFromParam, PORTFOLIO_CATEGORY_PARAM } from "@/lib/portfolio";
import { Picture } from "@/components/media/Picture";
import { reveal } from "@/components/ui/Typography";

/**
 * Category portfolio (weddings, pre-wedding, couples). A column-based masonry
 * keeps every photograph at its original aspect ratio — portrait, landscape or
 * square — so nothing is cropped or forced into a uniform tile.
 *
 * The selected category is kept in the URL (/stories?category=weddings), so it
 * survives refresh, back/forward and shared links. The page stays statically
 * prerendered: its HTML shows every photograph (the Suspense fallback) and the
 * URL's category is applied in the browser.
 */
export function PortfolioGallery({ galleries }: { galleries: CategoryGallery[] }) {
  return (
    <Suspense fallback={<StaticGallery galleries={galleries} />}>
      <UrlPortfolioGallery galleries={galleries} />
    </Suspense>
  );
}

function UrlPortfolioGallery({ galleries }: { galleries: CategoryGallery[] }) {
  const params = useSearchParams();
  // The live gallery owns the selection from here on; drop the pre-paint marker.
  useEffect(() => document.documentElement.removeAttribute("data-portfolio"), []);
  const requested = categoryFromParam(params.get(PORTFOLIO_CATEGORY_PARAM));
  // A category without photographs falls back to All rather than an empty grid.
  const active = requested !== "all" && galleries.some((g) => g.key === requested) ? requested : "all";

  const select = (category: GalleryCategory | "all") => {
    const next = new URLSearchParams(params.toString());
    if (category === "all") next.delete(PORTFOLIO_CATEGORY_PARAM);
    else next.set(PORTFOLIO_CATEGORY_PARAM, category);
    const query = next.toString();
    // Replace (not push) so filtering doesn't stack history entries; Next.js
    // keeps useSearchParams in sync with native history updates.
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };

  return <GalleryView galleries={galleries} active={active} onSelect={select} />;
}

type Active = GalleryCategory | "all";
const SIZES = "(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw";

/** Every photograph, tagged with its category (used to filter the static HTML before hydration). */
const allImages = (galleries: CategoryGallery[]) => galleries.flatMap((g) => g.images.map((image) => ({ image, category: g.key })));

function GalleryView({
  galleries,
  active,
  onSelect,
}: {
  galleries: CategoryGallery[];
  active: Active;
  onSelect?: (category: Active) => void;
}) {
  const images = allImages(galleries).filter((item) => active === "all" || item.category === active);
  return (
    <div>
      {galleries.length > 1 && <FilterBar galleries={galleries} active={active} count={images.length} onSelect={onSelect} />}
      <Grid key={active} items={images} />
    </div>
  );
}

/**
 * The prerendered HTML (Suspense fallback). It cannot know the URL's category,
 * so it carries the filter bar in each state plus every photograph, and the
 * <head> boot script (portfolioBootScript) marks <html data-portfolio="…"> before
 * first paint; CSS in globals.css then shows the matching bar and photographs.
 * Nothing here is mutated by script, and hydration replaces it with GalleryView,
 * which renders the same result — so there is no flash and no mismatch.
 */
function StaticGallery({ galleries }: { galleries: CategoryGallery[] }) {
  const items = allImages(galleries);
  const options: Active[] = ["all", ...galleries.map((g) => g.key)];
  return (
    <div data-portfolio-fallback="">
      {galleries.length > 1 &&
        options.map((option) => (
          <div key={option} data-portfolio-variant={option}>
            <FilterBar
              galleries={galleries}
              active={option}
              count={option === "all" ? items.length : items.filter((item) => item.category === option).length}
            />
          </div>
        ))}
      <Grid items={items} />
    </div>
  );
}

function FilterBar({
  galleries,
  active,
  count,
  onSelect,
}: {
  galleries: CategoryGallery[];
  active: Active;
  count: number;
  onSelect?: (category: Active) => void;
}) {
  return (
    <div className="flex flex-col gap-6 border-y border-charcoal/12 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Filter photographs by category" className="-mx-2 flex flex-wrap gap-x-2 gap-y-1">
        {([{ key: "all", title: "All" }, ...galleries] as const).map((option) => {
          const selected = active === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect?.(option.key)}
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
        {count} {count === 1 ? "photograph" : "photographs"}
      </p>
    </div>
  );
}

function Grid({ items }: { items: { image: CategoryGallery["images"][number]; category: GalleryCategory }[] }) {
  return (
    <div className="mt-12 columns-1 gap-5 sm:columns-2 sm:gap-6 lg:mt-16 lg:columns-3 lg:gap-8">
      {items.map(({ image, category }, i) => (
        <figure
          key={image.src}
          data-category={category}
          className="mb-5 break-inside-avoid sm:mb-6 lg:mb-8"
          {...reveal("mask", (i % 3) * 0.08)}
        >
          <Picture media={image} sizes={SIZES} />
        </figure>
      ))}
    </div>
  );
}
