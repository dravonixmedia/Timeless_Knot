import Link from "next/link";
import { ViewTransition } from "react";
import type { WeddingStory } from "@/content/types";
import { Picture } from "@/components/media/Picture";
import { reveal } from "@/components/ui/Typography";

type Props = {
  story: WeddingStory;
  index: number;
  sizes: string;
  /** Art-directed crop for this placement, e.g. "3 / 2" or "4 / 5". */
  aspect?: string;
  size?: "lg" | "md" | "sm";
  className?: string;
};

const titleSize = {
  lg: "text-[clamp(1.9rem,1.3rem+1.8vw,3rem)]",
  md: "text-[clamp(1.7rem,1.3rem+1.2vw,2.4rem)]",
  sm: "text-[clamp(1.5rem,1.25rem+0.8vw,2rem)]",
};

export function StoryCard({ story, index, sizes, aspect, size = "md", className = "" }: Props) {
  const meta = [story.category, story.location].filter(Boolean).join(" · ");

  return (
    <article className={className}>
      <Link href={`/stories/${story.slug}`} prefetch={true} className="group block">
        <div {...reveal("mask")}>
          <ViewTransition name={`story-${story.slug}`} share="morph" default="none">
            <Picture media={story.cover} sizes={sizes} aspect={aspect} imageClassName="zoom-media" caption="tag" />
          </ViewTransition>
        </div>

        <div className="mt-6 flex items-start gap-5" {...reveal("up", 0.1)}>
          <span className="meta pt-2 text-[0.62rem] text-muted" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className={`font-serif font-light leading-[1.08] ${titleSize[size]}`}>
              <span className="link-draw">{story.title}</span>
            </h3>
            {story.couple && <p className="mt-2 font-serif text-lg italic text-muted">{story.couple}</p>}
            <p className="meta mt-3 text-[0.62rem] text-muted">{meta}</p>
            {story.isDemo && <DemoBadge className="mt-4" />}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function DemoBadge({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <p
      className={`meta inline-flex items-center gap-2 border px-2.5 py-1 text-[0.56rem] tracking-[0.2em] ${
        tone === "light" ? "border-ivory/40 text-ivory/90" : "border-charcoal/25 text-muted"
      } ${className}`}
    >
      Demonstration story
    </p>
  );
}
