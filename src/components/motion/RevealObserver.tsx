"use client";

import { useEffect } from "react";

/**
 * One IntersectionObserver for the whole site. Any element with `data-reveal`
 * (rendered by server or client components) receives `data-inview` the first
 * time it enters the viewport. CSS performs the animation, so reveals cost no
 * per-frame JavaScript and remain fully visible without JS or with reduced motion.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-inview", ""));
      root.classList.add("reveal-ready");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-inview", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const observe = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not([data-inview])").forEach((el) => io.observe(el));
    };

    observe(document);

    // Pages rendered after client-side navigation
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("[data-reveal]:not([data-inview])")) io.observe(node);
            observe(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    root.classList.add("reveal-ready");

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
