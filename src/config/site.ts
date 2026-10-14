/**
 * Confirmed business information for Timeless Knot.
 *
 * Only facts supplied by the client belong here. Anything left as `null`
 * is intentionally unconfirmed — components hide the related UI rather than
 * displaying invented details. Update these values as the client confirms them.
 */

export type NavItem = { label: string; href: string };

export type SiteConfig = {
  name: string;
  legalName: string | null;
  tagline: string;
  statement: string;
  description: string;
  /** Production origin, e.g. https://www.example.com — set NEXT_PUBLIC_SITE_URL. */
  url: string;
  /** True once a real production URL is configured. */
  hasProductionUrl: boolean;
  /**
   * Official logo files supplied by the client (SVG or transparent PNG in /public).
   * While null, a provisional typographic wordmark is rendered instead.
   */
  logo: { light: string; dark: string; width: number; height: number } | null;
  contact: {
    email: string | null;
    phone: string | null;
    /** International format digits only, e.g. "919800000000". Shown only when set. */
    whatsapp: string | null;
  };
  social: {
    instagram: string | null;
  };
  credit: { label: string; href: string };
  nav: NavItem[];
};

const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const site: SiteConfig = {
  name: "Timeless Knot",
  legalName: null,
  tagline: "Crafting Memories That Last Beyond Time.",
  statement: "Your Wedding. Our Art.",
  description:
    "Timeless Knot is a wedding photography and cinematography studio documenting genuine emotion, meaningful traditions and personal celebrations through thoughtful imagery and cinematic storytelling.",
  url: envUrl || "http://localhost:3000",
  hasProductionUrl: Boolean(envUrl),
  logo: null,
  contact: {
    email: null,
    phone: null,
    whatsapp: null,
  },
  social: {
    instagram: null,
  },
  credit: {
    label: "Website crafted by Dravonix Media",
    href: "https://dravonixmedia.com/",
  },
  nav: [
    { label: "Our Story", href: "/our-story" },
    { label: "Wedding Stories", href: "/stories" },
    { label: "The Experience", href: "/experience" },
    { label: "Contact", href: "/contact" },
  ],
};

export const absoluteUrl = (path = "/") => `${site.url}${path === "/" ? "" : path}`;
