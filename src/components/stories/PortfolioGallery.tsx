"use client";

import { Suspense, useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { CategoryGallery, GalleryCategory } from "@/content/media";
import { categoryFromParam, PORTFOLIO_CATEGORY_PARAM } from "@/lib/portfolio";
import { Picture } from "@/components/media/Picture";
import { reveal } from "@/components/ui/Typography";

/**
 * Category portfolio (weddings, pre-wedding, couples, beyond the frame). A column-based masonry
 * keeps every photograph at its original aspect ratio — portrait, landscape or
 * square — so nothing is cropped or forced into a uniform tile.
 *
 * The selected category is kept in the URL (/stories?category=weddings), so it
 * survives refresh, back/forward and shared links. The page stays statically
 * prerendered: its HTML holds every photograph once, and the selection is shown
 * by CSS keyed on <html data-portfolio="…"> (globals.css). The <head> boot
 * script sets that attribute before first paint; the filter bar keeps it in
 * step afterwards. The grid itself is never re-rendered by the filter, so
 * hydration does not replace the photographs (no second reveal, no reload).
 */
export function PortfolioGallery({ galleries }: { galleries: CategoryGallery[] }) {
  const items = allImages(galleries);
  return (
    <div>
      {galleries.length > 1 && (
        <Suspense fallback={<StaticFilterBars galleries={galleries} />}>
          <UrlFilterBar galleries={galleries} />
        </Suspense>
      )}
      <Grid items={items} />
    </div>
  );
}

function UrlFilterBar({ galleries }: { galleries: CategoryGallery[] }) {
  const params = useSearchParams();
  const requested = categoryFromParam(params.get(PORTFOLIO_CATEGORY_PARAM));
  // A category without photographs falls back to All rather than an empty grid.
  const active = requested !== "all" && galleries.some((g) => g.key === requested) ? requested : "all";
  const shown = useRef<Active | null>(null);

  // Show the selection before paint, and replay the photographs' reveal when it
  // changes (as if the grid were new) — the reveal observer re-watches them.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (active === "all") root.removeAttribute("data-portfolio");
    else root.setAttribute("data-portfolio", active);
    if (shown.current !== null && shown.current !== active) {
      document.querySelectorAll("[data-portfolio-grid] figure[data-inview]").forEach((f) => f.removeAttribute("data-inview"));
    }
    shown.current = active;
  }, [active]);
  useLayoutEffect(() => () => document.documentElement.removeAttribute("data-portfolio"), []);

  const select = (category: Active) => {
    const next = new URLSearchParams(params.toString());
    if (category === "all") next.delete(PORTFOLIO_CATEGORY_PARAM);
    else next.set(PORTFOLIO_CATEGORY_PARAM, category);
    const query = next.toString();
    // Replace (not push) so filtering doesn't stack history entries; Next.js
    // keeps useSearchParams in sync with native history updates.
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };

  return <FilterBar galleries={galleries} active={active} count={countFor(galleries, active)} onSelect={select} />;
}

type Active = GalleryCategory | "all";
const SIZES = "(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw";

/** Every photograph, tagged with its category (the grid filters by it in CSS). */
const allImages = (galleries: CategoryGallery[]) => galleries.flatMap((g) => g.images.map((image) => ({ image, category: g.key })));

const countFor = (galleries: CategoryGallery[], active: Active) =>
  galleries.reduce((n, g) => n + (active === "all" || g.key === active ? g.images.length : 0), 0);

/**
 * The prerendered filter bar (Suspense fallback). It cannot know the URL's
 * category, so it carries the bar in each state; CSS shows the one matching
 * <html data-portfolio> on first paint, and hydration swaps in the live bar,
 * which looks identical — so there is no flash and no mismatch.
 */
function StaticFilterBars({ galleries }: { galleries: CategoryGallery[] }) {
  const options: Active[] = ["all", ...galleries.map((g) => g.key)];
  return (
    <div data-portfolio-fallback="">
      {options.map((option) => (
        <div key={option} data-portfolio-variant={option}>
          <FilterBar galleries={galleries} active={option} count={countFor(galleries, option)} />
        </div>
      ))}
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
        {([{ key: "all", title: "All Stories" }, ...galleries] as const).map((option) => {
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
    <div data-portfolio-grid="" className="mt-12 columns-1 gap-5 sm:columns-2 sm:gap-6 lg:mt-16 lg:columns-3 lg:gap-8">
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
