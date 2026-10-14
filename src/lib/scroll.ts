import type Lenis from "lenis";

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
