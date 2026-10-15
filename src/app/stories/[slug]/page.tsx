import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getNextStory, getStories, getStory } from "@/content/stories";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { Parallax } from "@/components/motion/Parallax";
import { FilmPlayer } from "@/components/film/FilmPlayer";
import { Gallery } from "@/components/stories/Gallery";
import { Invitation } from "@/components/sections/Invitation";
import { Arrow } from "@/components/ui/Links";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { breadcrumbSchema, JsonLd, pageMetadata, storySchema } from "@/lib/seo";

// Only published stories exist; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) return {};
  return pageMetadata({
    title: story.seo?.title ?? (story.couple ? `${story.couple} — ${story.title}` : story.title),
    description: story.seo?.description ?? story.excerpt,
    path: `/stories/${story.slug}`,
  });
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();

  const next = getNextStory(story.slug);
  const film = story.film?.src || story.film?.embedUrl ? story.film : undefined;
  const details = [
    story.couple && { term: "Couple", value: story.couple },
    story.location && { term: "Location", value: story.location },
    story.date && { term: "Date", value: formatDate(story.date) },
    { term: "Story", value: story.category },
    film && { term: "Film", value: "Included" },
  ].filter(Boolean) as { term: string; value: string }[];

  return (
    <Page>
      <JsonLd data={storySchema(story)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Stories", path: "/stories" },
          { name: story.title, path: `/stories/${story.slug}` },
        ])}
      />

      {/* 1–2. Immersive hero with title */}
      <section aria-labelledby="story-title" className="relative isolate h-[100svh] min-h-[36rem] overflow-hidden bg-forest text-ivory">
        <Parallax amount={12} className="absolute inset-0 -z-10">
          <ViewTransition name={`story-${story.slug}`} share="morph" default="none">
            <div className="intro-media absolute inset-0">
              <Picture media={story.cover} layout="fill" sizes="100vw" priority />
            </div>
          </ViewTransition>
        </Parallax>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(41_45_41/0.66),rgb(41_45_41/0.1)_55%,rgb(41_45_41/0.3))]"
        />

        <div className="frame flex h-full flex-col justify-end pb-[clamp(2.5rem,8vh,6rem)]">
          <nav aria-label="Breadcrumb" className="intro-fade mb-10" style={{ ["--delay" as string]: "0.2s" }}>
            <ol className="meta flex flex-wrap items-center gap-3 text-[0.6rem] text-ivory/80">
              <li>
                <Link href="/stories" className="link-draw">
                  Wedding Stories
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{story.title}</li>
            </ol>
          </nav>
          <p className="eyebrow intro-fade mb-6 text-pale-sage" style={{ ["--delay" as string]: "0.3s" }}>
            {story.category}
          </p>
          <Lines as="h1" id="story-title" mode="intro" className="display-hero max-w-[14ch]" lines={[story.title]} />
          {story.couple && (
            <p className="lede intro-fade mt-6 italic text-ivory/90" style={{ ["--delay" as string]: "0.8s" }}>
              {story.couple}
            </p>
          )}
        </div>
      </section>

      {/* 3–4. Details and emotional introduction */}
      <section aria-label="About this wedding" className="bg-porcelain section-y">
        <div className="frame editorial-grid gap-y-14">
          <dl className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-8 self-start border-t border-charcoal/12 pt-8 lg:col-span-3" {...reveal("up")}>
            {details.map((item) => (
              <div key={item.term} className="lg:col-span-2">
                <dt className="meta text-[0.6rem] text-muted">{item.term}</dt>
                <dd className="mt-2 font-serif text-xl">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="col-span-12 lg:col-span-7 lg:col-start-5">
            {story.introduction.map((paragraph, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "lede first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[4.6em] first-letter:font-light first-letter:leading-[0.8] first-letter:text-forest"
                    : "body-lg mt-8 max-w-[54ch] text-muted"
                }
                {...reveal("up", i * 0.1)}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 5–7. Curated photography sequence */}
      <section aria-label="Photographs" className="bg-porcelain pb-[var(--section)]">
        <Gallery blocks={story.gallery} />
      </section>

      {/* 8. Optional wedding film — only when it is playable */}
      {film && (
        <section aria-labelledby="film-title" className="bg-forest text-ivory section-y">
          <div className="frame">
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div {...reveal("fade")}>
                  <Eyebrow className="text-sage">The Wedding Film</Eyebrow>
                </div>
                <Lines id="film-title" className="display-lg mt-8" lines={["Feel It", <em key="a">Again.</em>]} />
              </div>
            </div>
            <div {...reveal("mask")}>
              <FilmPlayer film={film} />
            </div>
          </div>
        </section>
      )}

      {/* 9. Closing editorial statement */}
      {story.closing && (
        <section aria-label="Closing" className="bg-pale-sage section-y">
          <div className="frame text-center">
            <Lines as="p" className="display-lg mx-auto max-w-[20ch] italic" lines={[story.closing]} />
          </div>
        </section>
      )}

      {/* 10. Next story */}
      {next && (
        <section aria-label="Next story" className="bg-porcelain">
          <Link href={`/stories/${next.slug}`} prefetch={true} className="group block">
            <div className="frame editorial-grid items-center gap-y-10 py-[var(--section-tight)]">
              <div className="col-span-12 lg:col-span-5">
                <p className="meta text-[0.62rem] text-muted">Next story</p>
                <p className="display-lg mt-6">
                  <span className="link-draw">{next.title}</span>
                </p>
                <span className="meta mt-8 inline-flex items-center gap-3 text-[0.68rem]">
                  Continue <Arrow />
                </span>
              </div>
              <div className="col-span-12 lg:col-span-6 lg:col-start-7" {...reveal("mask")}>
                <ViewTransition name={`story-${next.slug}`} share="morph" default="none">
                  <Picture media={next.cover} sizes="(min-width: 1024px) 50vw, 100vw" imageClassName="zoom-media" />
                </ViewTransition>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 11. Invitation */}
      <Invitation />
    </Page>
  );
}
