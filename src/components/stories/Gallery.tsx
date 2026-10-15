import type { GalleryBlock } from "@/content/types";
import { Picture } from "@/components/media/Picture";
import { reveal } from "@/components/ui/Typography";

/**
 * Renders a story's curated sequence. Each block type has its own composition,
 * so a gallery reads like an edited feature rather than a uniform grid.
 * Photographs always keep their original aspect ratio.
 */
export function Gallery({ blocks }: { blocks: GalleryBlock[] }) {
  return (
    <div className="space-y-[clamp(4.5rem,10vw,10rem)]">
      {blocks.map((block, i) => (
        <GalleryItem key={i} block={block} />
      ))}
    </div>
  );
}

function Caption({ children, className = "" }: { children?: string; className?: string }) {
  if (!children) return null;
  return (
    <figcaption className={`mt-5 flex items-center gap-4 font-serif text-lg italic text-muted ${className}`} {...reveal("fade", 0.3)}>
      <span aria-hidden="true" className="h-px w-8 bg-olive/60" />
      {children}
    </figcaption>
  );
}

function GalleryItem({ block }: { block: GalleryBlock }) {
  switch (block.kind) {
    case "full":
      return (
        <figure>
          <div {...reveal("mask")}>
            <Picture media={block.image} sizes="100vw" />
          </div>
          <div className="frame">
            <Caption>{block.caption}</Caption>
          </div>
        </figure>
      );

    case "single": {
      const placement = {
        left: "col-span-12 sm:col-span-10 lg:col-span-7",
        right: "col-span-12 sm:col-span-10 sm:col-start-3 lg:col-span-6 lg:col-start-7",
        center: "col-span-12 sm:col-span-8 sm:col-start-3 lg:col-span-6 lg:col-start-4",
      }[block.align];
      return (
        <div className="frame editorial-grid">
          <figure className={placement}>
            <div {...reveal("mask")}>
              <Picture media={block.image} sizes="(min-width: 1024px) 58vw, (min-width: 640px) 84vw, 100vw" />
            </div>
            <Caption>{block.caption}</Caption>
          </figure>
        </div>
      );
    }

    case "pair":
      return (
        <div className="frame editorial-grid gap-y-10">
          <figure className="col-span-12 sm:col-span-6 lg:col-span-5 lg:col-start-2" {...reveal("mask")}>
            <Picture media={block.images[0]} sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" />
          </figure>
          <figure
            className={`col-span-10 col-start-3 sm:col-span-6 sm:col-start-7 lg:col-span-5 lg:col-start-8 ${block.stagger ? "sm:mt-32 lg:mt-48" : ""}`}
            {...reveal("mask", 0.15)}
          >
            <Picture media={block.images[1]} sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 84vw" />
          </figure>
        </div>
      );

    case "trio":
      return (
        <div className="frame grid grid-cols-2 items-start gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {block.images.map((image, i) => (
            <figure
              key={i}
              className={i === 0 ? "col-span-2 lg:col-span-1" : i === 1 ? "lg:mt-20" : ""}
              {...reveal("mask", i * 0.12)}
            >
              <Picture media={image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
            </figure>
          ))}
        </div>
      );

    case "statement":
      return (
        <blockquote className="frame">
          <p className="display-md mx-auto max-w-[24ch] text-center font-light italic" {...reveal("up")}>
            {block.text}
          </p>
        </blockquote>
      );
  }
}
