"use client";

import { useEffect } from "react";
import { smoothScrollTo } from "@/lib/scroll";

/**
 * Same-page links (#section) inside the legal pages. With Lenis running, the
 * browser's instant jump (and the router's own scroll when the address
 * changes) would fight Lenis's glide and leave the page short of the section.
 * Here the jump is cancelled, the glide alone runs, and only on arrival do the
 * address and keyboard focus follow, as with a native anchor. Without Lenis
 * (touch, reduced motion) nothing changes.
 */
export function InPageLinks({ within }: { within: string }) {
  useEffect(() => {
    const root = document.getElementById(within);
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const target = link && document.getElementById(decodeURIComponent(link.hash.slice(1)));
      const hash = link?.hash;
      const arrive = () => {
        target?.focus({ preventScroll: true });
        if (location.hash !== hash) history.pushState(null, "", hash);
      };
      if (!target || !smoothScrollTo(target, arrive)) return;
      event.preventDefault();
      // Lenis's own anchor handler (on window) would restart the glide without `arrive`.
      event.stopPropagation();
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [within]);
  return null;
}
