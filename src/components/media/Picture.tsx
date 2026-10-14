import Image from "next/image";
import type { Media, PlateTone } from "@/content/types";

type PictureProps = {
  media: Media;
  /** Responsive `sizes` hint for next/image. */
  sizes: string;
  priority?: boolean;
  /**
   * "ratio" (default) keeps the image's intrinsic aspect ratio.
   * "fill" covers a parent that defines its own size.
   */
  layout?: "ratio" | "fill";
  /** Override the aspect ratio for an art-directed crop, e.g. "4 / 5". */
  aspect?: string;
  className?: string;
  imageClassName?: string;
  /**
   * Placeholder labelling while no photograph exists:
   * "full" shows the art-direction brief, "tag" a small corner note, "none" nothing
   * (only where the surrounding UI already says the image is to come).
   */
  caption?: "full" | "tag" | "none";
};

/**
 * Photograph slot. Uses next/image for supplied photography, otherwise an
 * honest, art-directed placeholder plate describing the intended frame.
 */
export function Picture({
  media,
  sizes,
  priority = false,
  layout = "ratio",
  aspect,
  className = "",
  imageClassName = "",
  caption = "full",
}: PictureProps) {
  const style = layout === "ratio" ? { aspectRatio: aspect ?? `${media.width} / ${media.height}` } : undefined;
  const box = layout === "fill" ? "absolute inset-0" : "relative w-full";

  return (
    <div className={`${box} overflow-hidden ${className}`} style={style}>
      {media.src ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imageClassName}`}
          style={{ objectPosition: media.focal ?? "50% 50%" }}
        />
      ) : (
        <Plate media={media} caption={caption} className={imageClassName} />
      )}
    </div>
  );
}

const tones: Record<PlateTone, { bg: string; ink: string; light: string }> = {
  forest: { bg: "var(--color-forest)", ink: "var(--color-ivory)", light: "rgba(229,235,227,0.16)" },
  sage: { bg: "var(--color-sage)", ink: "var(--color-charcoal)", light: "rgba(250,249,246,0.32)" },
  pale: { bg: "var(--color-pale-sage)", ink: "var(--color-charcoal)", light: "rgba(255,255,255,0.7)" },
  charcoal: { bg: "var(--color-charcoal)", ink: "var(--color-ivory)", light: "rgba(152,173,155,0.2)" },
  porcelain: { bg: "color-mix(in oklab, var(--color-olive) 12%, var(--color-porcelain))", ink: "var(--color-charcoal)", light: "rgba(255,255,255,0.8)" },
};

/* Static film grain — a tiny inline SVG noise texture, no runtime cost. */
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Plate({ media, caption, className }: { media: Media; caption: PictureProps["caption"]; className: string }) {
  const tone = tones[media.tone ?? "pale"];
  const ratio = media.width / media.height;
  const orientation = ratio > 1.15 ? "Landscape" : ratio < 0.87 ? "Portrait" : "Square";

  return (
    <div
      role="img"
      aria-label={media.alt}
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.ink,
        backgroundImage: `radial-gradient(120% 90% at 72% 18%, ${tone.light}, transparent 62%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />
      <div aria-hidden="true" className="absolute inset-3 border border-current opacity-[0.16] sm:inset-4" />
      {caption === "tag" && (
        <p aria-hidden="true" className="meta absolute bottom-5 right-5 text-[0.55rem] opacity-60 sm:bottom-7 sm:right-7">
          Photograph to come
        </p>
      )}
      {caption === "full" && (
        <div aria-hidden="true" className="absolute inset-x-5 bottom-5 flex flex-col gap-3 sm:inset-x-7 sm:bottom-7">
          <p className="max-w-[26ch] font-serif text-[clamp(0.95rem,0.85rem+0.4vw,1.2rem)] italic leading-snug opacity-80">
            {media.brief}
          </p>
          <p className="meta text-[0.55rem] opacity-60">{orientation} · Photograph to come</p>
        </div>
      )}
    </div>
  );
}
