import type { Film, Media } from "./types";
import { fillSlots } from "./media";

/**
 * Site-wide photography slots.
 *
 * Each slot starts as an art-directed placeholder plate describing the
 * intended image. Photographs uploaded to the matching folder in
 * public/media/ replace them automatically at build time (see `imagery`
 * below and docs/IMAGE-UPLOADS.md) — no code changes needed.
 */
const placeholders = {
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

const p = placeholders;

/**
 * Slots grouped by upload folder. Within a folder, photographs are assigned in
 * filename order, matching portrait / landscape to each slot's art direction.
 */
export const imagery = {
  // public/media/home/hero/ — the first photograph is the home page hero
  ...fillSlots("home/hero", { homeHero: p.homeHero }),
  // public/media/home/featured/ — home page editorial photographs (also the closing invitation)
  ...fillSlots("home/featured", {
    artOfRemembering: p.artOfRemembering,
    editorialMoment: p.editorialMoment,
    invitationLeft: p.invitationLeft,
    invitationRight: p.invitationRight,
  }),
  // public/media/about/ — Our Story page
  ...fillSlots("about", { storyHero: p.storyHero, storyVision: p.storyVision, storyPairA: p.storyPairA, storyPairB: p.storyPairB }),
  // public/media/experience/ — The Experience page
  ...fillSlots("experience", { experienceHero: p.experienceHero, experienceDetail: p.experienceDetail }),
  // public/media/contact/ — Contact page portrait
  ...fillSlots("contact", { contact: p.contact }),
  // Film poster placeholder (real posters come from a story's film metadata)
  filmPoster: p.filmPoster,
};

/**
 * Optional studio showreel for the home page. Leave undefined until a real
 * film is supplied — the film section then shows an honest placeholder.
 */
export const showreel: Film | undefined = undefined;
