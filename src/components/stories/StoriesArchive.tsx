"use client";

import { useMemo, useState } from "react";
import type { StoryCategory, WeddingStory } from "@/content/types";
import { StoryCard } from "./StoryCard";
import { ArrowLink } from "@/components/ui/Links";

/** Rhythm of art-directed placements, repeated through the archive. */
const placements = [
  { className: "col-span-12 lg:col-span-7", aspect: "3 / 2", size: "lg", sizes: "(min-width: 1024px) 58vw, 100vw" },
  {
    className: "col-span-10 col-start-3 sm:col-span-6 sm:col-start-7 lg:col-span-4 lg:col-start-9 lg:mt-40",
    aspect: "4 / 5",
    size: "md",
    sizes: "(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 84vw",
  },
  {
    className: "col-span-11 sm:col-span-7 lg:col-span-5 lg:col-start-2",
    aspect: "4 / 5",
    size: "md",
    sizes: "(min-width: 1024px) 40vw, (min-width: 640px) 58vw, 92vw",
  },
  {
    className: "col-span-12 sm:col-span-10 sm:col-start-3 lg:col-span-5 lg:col-start-8 lg:mt-56",
    aspect: "5 / 4",
    size: "md",
    sizes: "(min-width: 1024px) 40vw, (min-width: 640px) 84vw, 100vw",
  },
] as const;

export function StoriesArchive({ stories, categories }: { stories: WeddingStory[]; categories: StoryCategory[] }) {
  const [active, setActive] = useState<StoryCategory | "All">("All");
  const visible = useMemo(
    () => (active === "All" ? stories : stories.filter((story) => story.category === active)),
    [active, stories],
  );
  const showFilters = categories.length > 1;

  if (stories.length === 0) return <EmptyArchive />;

  return (
    <div>
      {showFilters && (
        <div className="flex flex-col gap-6 border-y border-charcoal/12 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter stories by category" className="-mx-2 flex flex-wrap gap-x-2 gap-y-1">
            {(["All", ...categories] as const).map((category) => {
              const selected = active === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(category)}
                  className={`meta min-h-11 px-2 text-[0.64rem] tracking-[0.2em] transition-colors duration-500 ${
                    selected ? "text-charcoal" : "text-muted hover:text-charcoal"
                  }`}
                >
                  <span className={selected ? "border-b border-current pb-1" : "link-draw"}>{category}</span>
                </button>
              );
            })}
          </div>
          <p className="meta text-[0.62rem] text-muted" aria-live="polite">
            {visible.length} {visible.length === 1 ? "story" : "stories"}
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyArchive filtered />
      ) : (
        <div key={active} className="editorial-grid mt-16 gap-y-24 lg:mt-24 lg:gap-y-32">
          {visible.map((story, i) => {
            const place = placements[i % placements.length];
            return (
              <StoryCard
                key={story.slug}
                story={story}
                index={i}
                className={place.className}
                aspect={place.aspect}
                size={place.size}
                sizes={place.sizes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyArchive({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <p className="display-sm italic">{filtered ? "No stories in this collection yet." : "New stories are being curated."}</p>
      <p className="mt-6 text-muted">
        {filtered
          ? "Please choose another collection, or come back soon."
          : "Our wedding stories will be shared here very soon. In the meantime, we would love to hear yours."}
      </p>
      <ArrowLink href="/contact" className="mt-10">
        Tell us your story
      </ArrowLink>
    </div>
  );
}
