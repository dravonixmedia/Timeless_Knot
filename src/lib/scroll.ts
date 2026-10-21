import type Lenis from "lenis";
import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

type Motion = { gsap: typeof Gsap; ScrollTrigger: typeof ScrollTriggerType };

/*
 * GSAP and ScrollTrigger are loaded on demand, after hydration, rather than in
 * the initial bundle: nothing they drive (parallax, smooth scrolling) is needed
 * for the first paint, and keeping them out of it shortens start-up on phones.
 */
let motion: Motion | null = null;
let loading: Promise<Motion> | null = null;

/**
 * Loads GSAP with ScrollTrigger registered (once), for scroll-linked effects.
 * If the download fails the next call tries again; callers treat the effects
 * as optional and simply skip them.
 */
export const loadMotion = () =>
  (loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
    ([g, s]) => {
      g.gsap.registerPlugin(s.ScrollTrigger);
      motion = { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
      return motion;
    },
    (error) => {
      loading = null;
      throw error;
    },
  ));

/** Recalculate ScrollTrigger positions, if any scroll-linked effect is running. */
export const refreshScrollTriggers = () => {
  motion?.ScrollTrigger.refresh();
};

/**
 * Tiny registry for the active Lenis instance so UI such as the mobile menu
 * can pause scrolling without prop drilling. Falls back to native behaviour
 * when Lenis is not running (touch devices, reduced motion).
 */
let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const lockScroll = () => {
  instance?.stop();
  document.documentElement.style.overflow = "hidden";
};

export const unlockScroll = () => {
  document.documentElement.style.overflow = "";
  instance?.start();
};

/** Recalculate scroll dimensions after a route change or layout shift. */
export const refreshLenis = () => {
  instance?.resize();
};

/**
 * Glides to an element on the current page (honouring its scroll-margin) when
 * Lenis is running, and returns true; `onComplete` runs once it arrives.
 * Returns false otherwise, so the browser's own jump to the anchor applies.
 */
export const smoothScrollTo = (target: HTMLElement, onComplete?: () => void) => {
  if (!instance) return false;
  // Start from the real position: a native scroll just before (e.g. focusing a
  // link off-screen) may not have reached Lenis yet.
  instance.resize();
  instance.scrollTo(target, { onComplete });
  return true;
};
