import { preload } from "react-dom";
import { site } from "@/config/site";

/**
 * Brand logo: the official TK monogram beside the typeset studio name. Colour
 * follows the surrounding text (ivory over the hero, the menu and the footer;
 * charcoal on light pages). Links and accessible names come from the caller.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Monogram className="h-9 w-9 shrink-0" />
      <span aria-hidden="true" className="font-serif text-[1.02rem] leading-none tracking-[0.34em] whitespace-nowrap">
        TIMELESS KNOT
      </span>
      <span className="sr-only">{site.name}</span>
    </span>
  );
}

/**
 * The official TK monogram (public/brand/tk-monogram-white.png), unmodified.
 * The supplied artwork is pure white with its shape in the alpha channel, so it
 * is used as a CSS mask filled with `currentColor`: the exact shape, in the
 * colour of the surrounding text. Scales inside the box without distortion.
 */
export function Monogram({ className = "", title }: { className?: string; title?: string }) {
  const { monogram } = site.logo;
  // Fetch the artwork with the document rather than when CSS first applies the mask.
  preload(monogram, { as: "image", fetchPriority: "high" });
  const mask = `url("${monogram}") center / contain no-repeat`;
  return (
    <span
      className={`inline-block bg-current ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ WebkitMask: mask, mask }}
    />
  );
}
