import Image from "next/image";
import { site } from "@/config/site";

type Tone = "light" | "dark";

/**
 * Brand logo. Renders the official logo file once `site.logo` is configured;
 * until then a provisional typographic wordmark stands in. The official
 * artwork must be used unmodified when supplied.
 */
export function Logo({ tone = "dark", className = "" }: { tone?: Tone; className?: string }) {
  if (site.logo) {
    return (
      <Image
        src={tone === "light" ? site.logo.light : site.logo.dark}
        alt={site.name}
        width={site.logo.width}
        height={site.logo.height}
        className={className}
        priority
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Monogram className="h-9 w-9 shrink-0" />
      <span className="font-serif text-[1.02rem] leading-none tracking-[0.34em] whitespace-nowrap">
        TIMELESS KNOT
      </span>
      <span className="sr-only">{site.name}</span>
    </span>
  );
}

/** Provisional TK monogram — replace with the official mark when supplied. */
export function Monogram({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      <circle cx="24" cy="24" r="23.25" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-serif)", fontSize: "18px", letterSpacing: "-0.04em", fontWeight: 400 }}
      >
        T<tspan fontStyle="italic" dx="-1.5">K</tspan>
      </text>
    </svg>
  );
}
