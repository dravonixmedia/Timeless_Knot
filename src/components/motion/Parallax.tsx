"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ParallaxProps = {
  children: ReactNode;
  /** Total vertical travel as a percentage of the element height. Keep small. */
  amount?: number;
  /** Optional gentle scale-down while scrolling through (e.g. 1.06 → 1). */
  scaleFrom?: number;
  className?: string;
};

/**
 * Restrained scroll-linked drift for large photographs. The inner layer is
 * oversized by `amount` so movement never reveals an edge or distorts the
 * image. Disabled entirely for reduced motion.
 */
export function Parallax({ children, amount = 10, scaleFrom, className = "" }: ParallaxProps) {
  // Callers may position the frame themselves (e.g. `absolute inset-0` behind a
  // hero). Adding `relative` as well would override that and collapse it to 0px.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!outer.current || !inner.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Travel exactly the oversized margin so no edge is ever exposed.
      const overhang = () => ((outer.current?.offsetHeight ?? 0) * amount) / 200;
      gsap.fromTo(
        inner.current,
        { y: () => -overhang(), scale: scaleFrom ?? 1 },
        {
          y: () => overhang(),
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: outer.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    return () => mm.revert();
  }, [amount, scaleFrom]);

  return (
    <div ref={outer} className={`${positioned ? "" : "relative "}overflow-hidden ${className}`}>
      <div
        ref={inner}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `-${amount / 2}%`, bottom: `-${amount / 2}%` }}
      >
        {children}
      </div>
    </div>
  );
}
