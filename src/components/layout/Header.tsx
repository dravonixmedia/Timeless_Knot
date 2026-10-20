"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "./MobileMenu";

/** Routes that open with a full-bleed dark photograph beneath the header. */
const hasDarkHero = (pathname: string | null) =>
  pathname === "/" || (pathname !== null && /^\/stories\/[^/]+\/?$/.test(pathname));

export const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

/**
 * Site header. `pathname` is null while the route is not yet known (the
 * Suspense fallback during prerendering), in which case it renders neutrally.
 */
export function Header({ pathname }: { pathname: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overHero = hasDarkHero(pathname) && !scrolled && !menuOpen;

  // Transparent → solid, and step aside while reading downwards.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > window.innerHeight * 0.6) setHidden(true);
      else if (goingUp || y < 120) setHidden(false);
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // The menu is transient: close it whenever the route changes (including back/forward).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  const ink = overHero ? "text-ivory" : "text-charcoal";
  const surface = scrolled && !menuOpen ? "bg-porcelain border-charcoal/10" : "bg-transparent border-transparent";

  return (
    <>
      <a
        href="#main"
        className="meta fixed left-4 top-4 z-[70] -translate-y-24 bg-forest px-5 py-3 text-ivory transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        style={{ viewTransitionName: "site-header" }}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[transform,background-color,border-color,color] duration-700 ease-[var(--ease-editorial)] ${surface} ${ink} ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="frame flex h-[var(--header-h)] items-center justify-between gap-8">
          <Link
            href="/"
            aria-label={`${site.name} — home`}
            className="relative z-[60] -my-2 py-2"
            onNavigate={() => setMenuOpen(false)}
          >
            <Logo className={menuOpen ? "text-ivory" : ""} />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-10 xl:gap-12">
              {site.nav.slice(0, 3).map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="group meta relative inline-flex min-h-11 items-center text-[0.68rem] tracking-[0.22em]"
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 bottom-2 h-px origin-left bg-current transition-transform duration-700 ease-[var(--ease-editorial)] ${
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/contact"
                  aria-current={isActive(pathname, "/contact") ? "page" : undefined}
                  className={`meta inline-flex min-h-11 items-center border px-6 text-[0.68rem] tracking-[0.22em] transition-colors duration-700 ${
                    overHero
                      ? "border-ivory/50 hover:bg-ivory hover:text-forest"
                      : "border-charcoal/40 hover:border-forest hover:bg-forest hover:text-ivory"
                  }`}
                >
                  Let&rsquo;s Connect
                </Link>
              </li>
            </ul>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className={`meta relative z-[60] -mr-3 inline-flex min-h-11 items-center gap-3 px-3 text-[0.68rem] tracking-[0.24em] lg:hidden ${
              menuOpen ? "text-ivory" : ""
            }`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "Close" : "Menu"}</span>
            <span aria-hidden="true" className="relative block h-3 w-7">
              <span
                className={`absolute left-0 top-0.5 h-px w-full bg-current transition-transform duration-500 ease-[var(--ease-editorial)] ${
                  menuOpen ? "translate-y-[4px] rotate-[18deg]" : ""
                }`}
              />
              <span
                className={`absolute bottom-0.5 left-0 h-px w-full bg-current transition-transform duration-500 ease-[var(--ease-editorial)] ${
                  menuOpen ? "-translate-y-[4px] -rotate-[18deg]" : "scale-x-[0.6] origin-right"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} pathname={pathname} onClose={closeMenu} onNavigate={() => setMenuOpen(false)} />
    </>
  );
}
