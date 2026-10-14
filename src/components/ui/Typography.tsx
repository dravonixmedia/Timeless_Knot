import type { CSSProperties, ElementType, ReactNode } from "react";

type LinesProps = {
  /** Each entry renders on its own deliberately balanced line. */
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  /** "scroll" reveals when in view; "intro" plays immediately on load (hero). */
  mode?: "scroll" | "intro" | "none";
  delay?: number;
  id?: string;
};

/**
 * Headline with authored line breaks and an optional masked line-by-line
 * entrance. The text stays real, selectable and readable by assistive tech.
 */
export function Lines({ lines, as: Tag = "h2", className = "", mode = "scroll", delay = 0, id }: LinesProps) {
  const reveal = mode === "scroll" ? { "data-reveal": "lines", suppressHydrationWarning: true } : {};
  const intro = mode === "intro" ? "intro-lines" : "";

  return (
    <Tag
      id={id}
      className={`${intro} ${className}`}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
      {...reveal}
    >
      {lines.map((line, i) => (
        <span key={i} className="line" style={{ "--i": i } as CSSProperties}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-4 ${className}`}>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
      {children}
    </p>
  );
}

/**
 * Reveal props for server components: spread onto any element.
 * `data-inview` is added by the shared observer, possibly before a streamed
 * boundary hydrates — that divergence is intentional, hence the suppression.
 */
export const reveal = (kind: "up" | "fade" | "mask" = "up", delay = 0) =>
  ({
    "data-reveal": kind,
    suppressHydrationWarning: true,
    style: { "--reveal-delay": `${delay}s` } as CSSProperties,
  }) as const;
