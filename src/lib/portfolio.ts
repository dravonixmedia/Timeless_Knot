import type { GalleryCategory } from "@/content/media";

/**
 * The portfolio's category filter lives in the URL (/stories?category=…), so a
 * selection survives refresh, back/forward and shared links.
 */
export const PORTFOLIO_CATEGORY_PARAM = "category";

export const PORTFOLIO_CATEGORIES: readonly GalleryCategory[] = ["weddings", "pre-wedding", "couples"];

/** Link to the portfolio with a category selected. */
export const portfolioCategoryHref = (category: GalleryCategory) => `/stories?${PORTFOLIO_CATEGORY_PARAM}=${category}`;

/** The category a URL asks for, or "all" when absent or not a known category. */
export const categoryFromParam = (value: string | null | undefined): GalleryCategory | "all" =>
  PORTFOLIO_CATEGORIES.includes(value as GalleryCategory) ? (value as GalleryCategory) : "all";
