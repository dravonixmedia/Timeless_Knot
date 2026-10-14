import type { Film, Media } from "./types";

/**
 * Site-wide photography slots.
 *
 * No photographs have been supplied yet, so each slot renders an art-directed
 * placeholder plate describing the intended image. To go live, add the file to
 * /public/media and set `src` (plus accurate `alt`, `width` and `height`).
 */
export const imagery = {
  homeHero: {
    alt: "Placeholder for the home page hero photograph",
    width: 2400,
    height: 1600,
    tone: "forest",
    brief: "Hero — an intimate, wide wedding frame with space for the headline",
  },
  artOfRemembering: {
    alt: "Placeholder for a vertical wedding portrait",
    width: 1200,
    height: 1600,
    tone: "sage",
    brief: "A vertical portrait — one quiet, honest moment",
  },
  editorialMoment: {
    alt: "Placeholder for a full-width cinematic wedding photograph",
    width: 2400,
    height: 1350,
    tone: "charcoal",
    brief: "Full-bleed interlude — a cinematic, emotional frame",
  },
  filmPoster: {
    alt: "Placeholder for a wedding film poster frame",
    width: 2400,
    height: 1004,
    tone: "charcoal",
    brief: "Film still — the opening frame of a wedding film",
  },
  invitationLeft: {
    alt: "Placeholder for a small detail photograph",
    width: 900,
    height: 1200,
    tone: "pale",
    brief: "A detail — rings, florals or hands",
  },
  invitationRight: {
    alt: "Placeholder for a small landscape photograph",
    width: 1200,
    height: 900,
    tone: "sage",
    brief: "A candid moment between guests",
  },
  storyHero: {
    alt: "Placeholder for the Our Story page photograph",
    width: 1200,
    height: 1500,
    tone: "forest",
    brief: "Behind the camera — the studio at work",
  },
  storyVision: {
    alt: "Placeholder for an adventurous elopement landscape",
    width: 2400,
    height: 1100,
    tone: "charcoal",
    brief: "An elopement in an open, wild landscape",
  },
  storyPairA: {
    alt: "Placeholder for a documentary wedding photograph",
    width: 1000,
    height: 1300,
    tone: "pale",
    brief: "A tradition, observed closely",
  },
  storyPairB: {
    alt: "Placeholder for a candid portrait",
    width: 1000,
    height: 1300,
    tone: "sage",
    brief: "An unposed portrait, full of character",
  },
  experienceHero: {
    alt: "Placeholder for a wedding-day photograph",
    width: 2400,
    height: 1200,
    tone: "forest",
    brief: "The day itself — movement, light and people",
  },
  experienceDetail: {
    alt: "Placeholder for a photograph of delivered prints",
    width: 1200,
    height: 1500,
    tone: "porcelain",
    brief: "Memories delivered — prints, album or a screen glowing in a dark room",
  },
  contact: {
    alt: "Placeholder for a soft, romantic portrait",
    width: 1000,
    height: 1300,
    tone: "pale",
    brief: "A soft, quiet portrait",
  },
} satisfies Record<string, Media>;

/**
 * Optional studio showreel for the home page. Leave undefined until a real
 * film is supplied — the film section then shows an honest placeholder.
 */
export const showreel: Film | undefined = undefined;
