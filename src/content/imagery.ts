import type { Film } from "./types";
import { fillSlots } from "./media";

/**
 * Site-wide photography slots, filled at build time from the matching folder
 * in public/media/ (see docs/IMAGE-UPLOADS.md) — no code changes needed.
 *
 * Each slot names the orientation its layout is designed for; photographs are
 * assigned in filename order, matching portrait / landscape where possible.
 * A slot with no photograph is undefined and its image block is not rendered.
 */

// public/media/home/hero/ — the first photograph is the home page hero
const homeHero = fillSlots("home/hero", { homeHero: "landscape" });
// public/media/home/featured/ — home page editorial photographs (also the closing invitation)
const homeFeatured = fillSlots("home/featured", {
  artOfRemembering: "portrait",
  editorialMoment: "landscape",
  invitationLeft: "portrait",
  invitationRight: "landscape",
});
// public/media/about/ — Our Story page
const about = fillSlots("about", { storyHero: "portrait", storyVision: "landscape", storyPairA: "portrait", storyPairB: "portrait" });
// public/media/experience/ — The Experience page
const experience = fillSlots("experience", { experienceHero: "landscape", experienceDetail: "portrait" });
// public/media/contact/ — Contact page portrait
const contact = fillSlots("contact", { contact: "portrait" });

export const imagery = {
  ...homeHero.slots,
  ...homeFeatured.slots,
  ...about.slots,
  ...experience.slots,
  ...contact.slots,
};

/**
 * Photographs uploaded beyond a page's slots. Pages with room for more show
 * them in an uncropped editorial set (Our Story, The Experience).
 */
export const extraImagery = {
  about: about.extra,
  experience: experience.extra,
};

/**
 * Optional studio showreel for the home page. Leave undefined until a real
 * film is supplied — the home page film section is hidden until then (or until
 * a published story includes a film).
 */
export const showreel: Film | undefined = undefined;
