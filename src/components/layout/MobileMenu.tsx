"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { site } from "@/config/site";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { EucalyptusSprig } from "@/components/brand/Botanical";
import { isActive } from "./Header";

type Props = {
  open: boolean;
  pathname: string | null;
  onClose: () => void;
  onNavigate: () => void;
};

/**
 * Full-screen editorial menu for small screens. Behaves as a modal dialog:
 * focus moves inside, Tab is contained, Escape closes, and the page behind
 * is inert and does not scroll.
 */
export function MobileMenu({ open, pathname, onClose, onNavigate }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const main = document.getElementById("main");
    const footer = document.querySelector<HTMLElement>("footer");
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");

    const first = panel.current?.querySelector<HTMLElement>("a");
    const focusTimer = window.setTimeout(() => first?.focus({ preventScroll: true }), 80);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      // Contain focus within the menu and its toggle (which lives in the header).
      const toggle = document.querySelector<HTMLElement>('[aria-controls="mobile-menu"]');
      const items = [
        ...Array.from(panel.current.querySelectorAll<HTMLElement>("a[href]")),
        ...(toggle ? [toggle] : []),
      ];
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[items.length - 1]?.focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0]?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      unlockScroll();
    };
  }, [open, onClose]);

  const links = [{ label: "Home", href: "/" }, ...site.nav];

  return (
    <div
      id="mobile-menu"
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={!open}
      data-open={open || undefined}
      className={`fixed inset-0 z-40 flex flex-col overflow-y-auto bg-forest text-ivory transition-[clip-path,visibility] duration-[900ms] ease-[var(--ease-cinema)] lg:hidden ${
        open ? "visible [clip-path:inset(0_0_0_0)]" : "invisible [clip-path:inset(0_0_100%_0)]"
      }`}
    >
      <EucalyptusSprig className="pointer-events-none absolute -right-24 bottom-10 h-[56vh] w-auto text-sage opacity-[0.14]" />

      <nav aria-label="Mobile" className="frame relative flex flex-1 flex-col justify-center pb-10 pt-[calc(var(--header-h)+2rem)]">
        <ul className="space-y-1">
          {links.map((item, i) => {
            const active = item.href === "/" ? pathname === "/" : isActive(pathname, item.href);
            return (
              <li
                key={item.href}
                className={`transition-[opacity,transform] duration-700 ease-[var(--ease-editorial)] motion-reduce:transition-none ${
                  open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
                style={{ transitionDelay: open ? `${0.25 + i * 0.07}s` : "0s" } as CSSProperties}
              >
                <Link
                  href={item.href}
                  onNavigate={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-baseline gap-5 py-2 font-serif text-[clamp(2.4rem,11vw,3.6rem)] font-light leading-[1.1]"
                >
                  <span className="meta w-6 text-[0.6rem] text-sage" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={active ? "italic" : ""}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={`frame relative border-t border-ivory/15 py-8 transition-opacity duration-700 ${open ? "opacity-100 delay-500" : "opacity-0"}`}
      >
        <p className="font-serif text-lg italic text-pale-sage">{site.tagline}</p>
      </div>
    </div>
  );
}
