"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { refreshLenis, refreshScrollTriggers } from "@/lib/scroll";
import { Header } from "./Header";

/**
 * Reads the current route (must sit inside <Suspense> with Cache Components)
 * and keeps route-dependent chrome in sync: the header state and scroll
 * measurements after navigation.
 */
export function RouteChrome() {
  const pathname = usePathname();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refreshLenis();
      refreshScrollTriggers();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <Header pathname={pathname} />;
}
