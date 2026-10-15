import Image from "next/image";
import type { Media } from "@/content/types";

type PictureProps = {
  media: Media;
  /** Responsive `sizes` hint for next/image. */
  sizes: string;
  /** Above-the-fold LCP image (e.g. a hero): preloaded. Everything else lazy-loads. */
  priority?: boolean;
  /**
   * "ratio" (default) shows the photograph uncropped at its intrinsic aspect ratio.
   * "fill" covers a parent that defines its own size (full-bleed banners only).
   */
  layout?: "ratio" | "fill";
  className?: string;
  imageClassName?: string;
};

/**
 * A real photograph, optimised with next/image. There is no placeholder state:
 * callers render a Picture only when a photograph exists, and leave the image
 * block out otherwise.
 */
export function Picture({
  media,
  sizes,
  priority = false,
  layout = "ratio",
  className = "",
  imageClassName = "",
}: PictureProps) {
  const style = layout === "ratio" ? { aspectRatio: `${media.width} / ${media.height}` } : undefined;
  const box = layout === "fill" ? "absolute inset-0" : "relative w-full";

  return (
    <div className={`${box} overflow-hidden bg-pale-sage ${className}`} style={style}>
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes={sizes}
        preload={priority}
        className={`object-cover ${imageClassName}`}
        style={{ objectPosition: media.focal ?? "50% 50%" }}
      />
    </div>
  );
}
