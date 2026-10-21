/**
 * Confirmed business information for Timeless Knot.
 *
 * Only facts supplied by the client belong here. Anything left as `null`
 * is intentionally unconfirmed — components hide the related UI rather than
 * displaying invented details. Update these values as the client confirms them.
 */

import { resolveWhatsappUrl } from "@/lib/whatsapp";
import { PRODUCTION_ORIGIN } from "@/lib/indexing";

/**
 * WHATSAPP — paste the studio's direct WhatsApp link here, e.g.
 *
 *   const WHATSAPP_URL: string | null = "https://wa.me/919876543210";
 *
 * Accepted: https://wa.me/<country code + number> (digits only) or a WhatsApp
 * Business short link https://wa.me/message/<code>. This one link drives the
 * floating button, the footer link and the contact page link. While it is
 * null (and NEXT_PUBLIC_WHATSAPP_URL is not set at build time), all WhatsApp
 * UI stays hidden. No number is assumed.
 */
const WHATSAPP_URL: string | null = "https://wa.me/917034671830";

const whatsappSource = WHATSAPP_URL ?? process.env.NEXT_PUBLIC_WHATSAPP_URL ?? null;
const whatsappUrl = resolveWhatsappUrl(whatsappSource);
if (!whatsappSource) {
  console.warn(
    "[whatsapp] No WhatsApp link configured (WHATSAPP_URL in src/config/site.ts or NEXT_PUBLIC_WHATSAPP_URL) — the floating button and WhatsApp links are not rendered.",
  );
} else if (!whatsappUrl) {
  console.warn(
    `[whatsapp] Ignoring invalid WhatsApp link "${whatsappSource}" — expected https://wa.me/<number> or https://wa.me/message/<code>. The WhatsApp button is hidden.`,
  );
}

export type NavItem = { label: string; href: string };

/** A state or territory, as named in structured data and copy. */
export type Region = { name: string; type: "State" };

export type SiteConfig = {
  name: string;
  legalName: string | null;
  tagline: string;
  statement: string;
  description: string;
  /** Production origin (src/lib/indexing.ts); NEXT_PUBLIC_SITE_URL may override it. */
  url: string;
  /**
   * Confirmed base: city, state and country only. No street address, postcode
   * or coordinates are published until the studio confirms them.
   */
  location: { locality: string; region: string; country: string; countryCode: string };
  /** One-line geographic positioning, approved by the studio. */
  positioning: string;
  /**
   * Where the studio works. `primary` is its home market; `extended` are the
   * South Indian states it welcomes enquiries from. No branch or office is
   * claimed outside Kollam, and no past assignment is implied.
   */
  serviceArea: { primary: Region; extended: Region[] };
  services: { name: string; description: string }[];
  /**
   * Official TK monogram supplied by the client: a single-colour (white)
   * transparent PNG in /public. It is drawn through a CSS mask in the
   * surrounding text colour, so the artwork is unchanged and stays legible on
   * light and dark backgrounds. Dimensions are the file's own.
   */
  logo: { monogram: string; width: number; height: number };
  contact: {
    email: string | null;
    phone: string | null;
    /**
     * Validated direct https://wa.me/ link (see WHATSAPP_URL above). Null — and
     * every WhatsApp link hidden — until a valid link is configured.
     */
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
    "Timeless Knot is a Kollam-based wedding photography and cinematography studio capturing weddings, pre-weddings and love stories across Kerala and South India.",
  url: envUrl || PRODUCTION_ORIGIN,
  location: { locality: "Kollam", region: "Kerala", country: "India", countryCode: "IN" },
  positioning: "Based in Kollam, Kerala. Capturing meaningful stories across South India.",
  serviceArea: {
    primary: { name: "Kerala", type: "State" },
    extended: [
      { name: "Tamil Nadu", type: "State" },
      { name: "Karnataka", type: "State" },
      { name: "Andhra Pradesh", type: "State" },
      { name: "Telangana", type: "State" },
    ],
  },
  services: [
    {
      name: "Wedding Photography",
      description: "Candid and editorial photographs of the ceremony, its rituals and the people who make it yours.",
    },
    {
      name: "Wedding Cinematography",
      description: "Cinematic wedding films that hold the movement, the sound and the feeling of the day.",
    },
    {
      name: "Pre-Wedding Photography",
      description: "An unhurried session before the wedding, shaped around the two of you and the places you love.",
    },
    {
      name: "Couple Photography",
      description: "Portraits for couples at any chapter of their story — together, simply as you are.",
    },
  ],
  logo: { monogram: "/brand/tk-monogram-white.png", width: 514, height: 542 },
  contact: {
    email: null,
    phone: null,
    whatsapp: whatsappUrl,
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
    { label: "Timeless Stories", href: "/stories" },
    { label: "The Experience", href: "/experience" },
    { label: "Contact", href: "/contact" },
  ],
};

export const absoluteUrl = (path = "/") => `${site.url}${path === "/" ? "" : path}`;
