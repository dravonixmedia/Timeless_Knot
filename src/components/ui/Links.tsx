import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "dark" | "light";

const buttonStyles: Record<Variant, string> = {
  dark: "border-charcoal/70 text-charcoal hover:bg-forest hover:border-forest hover:text-ivory",
  light: "border-ivory/60 text-ivory hover:bg-ivory hover:border-ivory hover:text-forest",
};

/** Primary call to action — a fine hairline frame that fills softly on hover. */
export function ButtonLink({
  href,
  children,
  variant = "dark",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group meta inline-flex min-h-12 items-center justify-center gap-4 border px-7 py-4 text-[0.7rem] tracking-[0.24em] transition-colors duration-700 ease-[var(--ease-editorial)] ${buttonStyles[variant]} ${className}`}
    >
      <span>{children}</span>
      <Arrow />
    </Link>
  );
}

/** Secondary text link with drawn underline and a gently travelling arrow. */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`group meta inline-flex min-h-11 items-center gap-3 text-[0.7rem] tracking-[0.24em] ${className}`}>
      <span className="link-draw">{children}</span>
      <Arrow />
    </Link>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 10"
      className={`h-[0.6rem] w-7 shrink-0 transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:translate-x-1.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M0 5h27M22.5 0.5 27 5l-4.5 4.5" />
    </svg>
  );
}
