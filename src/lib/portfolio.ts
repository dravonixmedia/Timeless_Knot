import type { GalleryCategory } from "@/content/media";

/**
 * The portfolio's category filter lives in the URL (/stories?category=…), so a
 * selection survives refresh, back/forward and shared links.
 */
export const PORTFOLIO_CATEGORY_PARAM = "category";

export const PORTFOLIO_CATEGORIES: readonly GalleryCategory[] = ["weddings", "pre-wedding", "couples", "beyond-the-frame"];

/** Link to the portfolio with a category selected. */
export const portfolioCategoryHref = (category: GalleryCategory) => `/stories?${PORTFOLIO_CATEGORY_PARAM}=${category}`;

/** The category a URL asks for, or "all" when absent or not a known category. */
export const categoryFromParam = (value: string | null | undefined): GalleryCategory | "all" =>
  PORTFOLIO_CATEGORIES.includes(value as GalleryCategory) ? (value as GalleryCategory) : "all";

/**
 * Inline <head> script (runs before first paint): on /stories, records a valid
 * ?category= on <html data-portfolio="…"> so the prerendered gallery can show
 * that category immediately (see StaticGallery and globals.css). `available`
 * lists the categories that have photographs; anything else shows All.
 */
export const portfolioBootScript = (available: readonly GalleryCategory[]) =>
  `(function(d){try{if(location.pathname!=="/stories")return;var c=new URLSearchParams(location.search).get(${JSON.stringify(PORTFOLIO_CATEGORY_PARAM)});if(${JSON.stringify(available)}.indexOf(c)>-1)d.setAttribute("data-portfolio",c)}catch(e){}})(document.documentElement)`;
