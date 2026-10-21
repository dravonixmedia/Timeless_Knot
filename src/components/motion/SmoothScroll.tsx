"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { loadMotion, setLenis } from "@/lib/scroll";

/**
 * Lenis smooth scrolling, enabled only where it genuinely helps: precise
 * pointers (mouse / trackpad) with motion allowed. Touch devices keep native
 * scrolling. Lenis and ScrollTrigger share GSAP's ticker so they never drift.
 * Lenis and GSAP are fetched only when smooth scrolling actually starts, so
 * touch devices never download them for it.
 */
export function SmoothScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lenis: Lenis | null = null;
    /** Detaches Lenis from GSAP's ticker; set once both have loaded. */
    let detach: (() => void) | null = null;
    /** Bumped on every start/stop so a load that resolves late is discarded. */
    let generation = 0;

    const start = () => {
      if (lenis || !finePointer.matches || reducedMotion.matches) return;
      const current = ++generation;
      Promise.all([import("lenis"), loadMotion()]).then(([{ default: LenisClass }, { gsap, ScrollTrigger }]) => {
        if (current !== generation || lenis) return;
        lenis = new LenisClass({
          lerp: 0.115,
          wheelMultiplier: 1,
          smoothWheel: true,
          syncTouch: false,
          anchors: { offset: 0 },
          autoRaf: false,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        detach = () => gsap.ticker.remove(tick);
        setLenis(lenis);
      }, () => {});
    };

    const stop = () => {
      generation++;
      detach?.();
      detach = null;
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };

    const sync = () => (finePointer.matches && !reducedMotion.matches ? start() : stop());

    sync();
    finePointer.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      finePointer.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
