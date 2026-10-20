import type { Metadata } from "next";
import { getStories, getStoryCategories } from "@/content/stories";
import { Page } from "@/components/layout/Page";
import { EmptyArchive, StoriesArchive } from "@/components/stories/StoriesArchive";
import { PortfolioGallery } from "@/components/stories/PortfolioGallery";
import { getCategoryGalleries } from "@/content/media";
import { Invitation } from "@/components/sections/Invitation";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wedding Stories",
  description:
    "Wedding stories by Timeless Knot — photography and cinematic films that preserve the emotion, traditions and individuality of each celebration.",
  path: "/stories",
});

export default function StoriesPage() {
  const stories = getStories();
  const galleries = getCategoryGalleries();
  const hasPortfolio = galleries.length > 0;
  const hasStories = stories.length > 0;

  return (
    <Page>
      <section aria-labelledby="stories-title" className="bg-porcelain pb-[var(--section-tight)] pt-[calc(var(--header-h)+clamp(3rem,9vw,8rem))]">
        <div className="frame">
          <div className="editorial-grid items-end gap-y-10 pb-[var(--section-tight)]">
            <div className="col-span-12 lg:col-span-8">
              <p className="eyebrow intro-fade mb-10 flex items-center gap-4 text-muted" style={{ ["--delay" as string]: "0.1s" }}>
                <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
                Wedding Stories
              </p>
              <Lines
                as="h1"
                id="stories-title"
                mode="intro"
                className="display-xl"
                lines={["Love,", <em key="b">Beautifully Lived.</em>]}
              />
            </div>
            <div className="col-span-12 sm:col-span-8 lg:col-span-4 lg:pb-4">
              <p className="lede intro-fade text-muted" style={{ ["--delay" as string]: "0.8s" }}>
                Each story is its own world — its people, its traditions, its light. Step inside.
              </p>
            </div>
          </div>

          {hasPortfolio && (
            <section aria-labelledby="portfolio-title" className="pb-[var(--section-tight)]">
              <div {...reveal("fade")}>
                <Eyebrow className="text-muted">Portfolio</Eyebrow>
              </div>
              <h2 id="portfolio-title" className="sr-only">
                Portfolio
              </h2>
              <div className="mt-8">
                <PortfolioGallery galleries={galleries} />
              </div>
            </section>
          )}

          {/* Published stories only; without any, the archive and its filters are left out. */}
          {hasStories && (
            <section aria-labelledby="archive-title">
              <div className="mb-10" {...reveal("fade")}>
                <Eyebrow className="text-muted">Stories</Eyebrow>
              </div>
              <h2 id="archive-title" className="sr-only">
                Stories
              </h2>
              <StoriesArchive stories={stories} categories={getStoryCategories()} />
            </section>
          )}
          {!hasPortfolio && !hasStories && <EmptyArchive />}
        </div>
      </section>

      <Invitation divided />
    </Page>
  );
}
