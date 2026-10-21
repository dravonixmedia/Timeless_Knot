import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { imagery, showreel } from "@/content/imagery";
import { getCategoryGalleries, getHomeVideo } from "@/content/media";
import type { Media } from "@/content/types";
import { portfolioCategoryHref } from "@/lib/portfolio";
import { getFeaturedStories, getShowcaseFilm } from "@/content/stories";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { Parallax } from "@/components/motion/Parallax";
import { EucalyptusSprig } from "@/components/brand/Botanical";
import { FilmPlayer } from "@/components/film/FilmPlayer";
import { HomeFilm } from "@/components/film/HomeFilm";
import { StoryCard } from "@/components/stories/StoryCard";
import { Invitation } from "@/components/sections/Invitation";
import { ArrowLink, ButtonLink } from "@/components/ui/Links";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { SectionRule } from "@/components/ui/SectionRule";
import { JsonLd, pageMetadata, pageSchema } from "@/lib/seo";

const title = "Timeless Knot | Wedding Photography & Films in Kerala & South India";

export const metadata: Metadata = pageMetadata({ title, description: site.description, path: "/" });

export default function HomePage() {
  return (
    <Page>
      <JsonLd data={pageSchema({ path: "/", name: title, description: site.description })} />
      <Hero />
      <ArtOfRemembering />
      <FeaturedStories />
      <PortfolioHighlights />
      <Philosophy />
      <Films />
      <ExperienceIntro />
      {/* "The Moments Pass" holds still while the closing invitation scrolls up over it. */}
      <div className="relative">
        <EditorialMoment />
        <Invitation />
      </div>
    </Page>
  );
}

/* 01 — Immersive cinematic hero ------------------------------------------ */

function Hero() {
  const media = imagery.homeHero;
  return (
    <section aria-labelledby="hero-title" className="relative isolate h-[100svh] min-h-[38rem] overflow-hidden bg-forest text-ivory">
      {/* Without a photograph the hero is a plain forest field — never an empty frame. */}
      {media && (
        <Parallax amount={14} className="absolute inset-0 -z-10">
          <div className="intro-media absolute inset-0">
            <Picture media={media} layout="fill" sizes="100vw" priority />
          </div>
        </Parallax>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(41_45_41/0.62),rgb(41_45_41/0.12)_48%,rgb(41_45_41/0.28))]"
      />

      <div className="frame relative flex h-full flex-col justify-end pb-[clamp(2.5rem,7vh,5.5rem)]">
        <div className="editorial-grid items-end gap-y-10">
          <div className="col-span-12 lg:col-span-9">
            <p className="eyebrow intro-fade mb-8 flex items-center gap-4 text-pale-sage" style={{ ["--delay" as string]: "0.2s" }}>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
              Wedding Photography &amp; Cinematography
            </p>
            <Lines
              as="h1"
              id="hero-title"
              mode="intro"
              className="display-hero"
              lines={["Some Stories Deserve", <>to Last <em>Forever.</em></>]}
            />
          </div>

          <div className="col-span-12 sm:col-span-8 lg:col-span-3">
            <p className="intro-fade max-w-[34ch] text-[0.98rem] leading-relaxed text-ivory/90" style={{ ["--delay" as string]: "1s" }}>
              An intimate celebration of love, connection, and the moments that become forever.
            </p>
            <div className="intro-fade mt-8 flex flex-col items-start gap-3" style={{ ["--delay" as string]: "1.25s" }}>
              <ButtonLink href="/stories" variant="light">
                Explore Timeless Stories
              </ButtonLink>
              <ArrowLink href="/contact" className="text-ivory">
                Let&rsquo;s connect
              </ArrowLink>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="scroll-cue-wrap intro-fade absolute bottom-0 right-[var(--gutter)] hidden h-24 flex-col items-center sm:flex"
        style={{ ["--delay" as string]: "1.8s" }}
      >
        <span className="meta mb-3 text-[0.55rem] text-ivory/70">Scroll</span>
        <span className="scroll-cue block h-10 w-px bg-ivory/70" />
      </div>
    </section>
  );
}

/* 02 — The art of remembering -------------------------------------------- */

function ArtOfRemembering() {
  const media = imagery.artOfRemembering;
  return (
    <section aria-labelledby="remember-title" className="section-y bg-porcelain">
      <div className="frame editorial-grid gap-y-16">
        <div className={`col-span-12 lg:col-span-7 ${media ? "lg:pt-28" : ""}`}>
          <div {...reveal("fade")}>
            <Eyebrow className="text-muted">The Art of Remembering</Eyebrow>
          </div>
          <Lines
            id="remember-title"
            className="display-lg mt-10"
            lines={["Every Love Story", <>Is a <em>Work of Art.</em></>]}
          />
          <div className="mt-12 max-w-[46ch] sm:ml-[12%] lg:ml-[18%]" {...reveal("up", 0.15)}>
            <p className="body-lg text-muted">
              At Timeless Knot, we believe the most beautiful moments are the ones that feel entirely your own. Through
              thoughtful imagery and cinematic storytelling, we preserve the emotions, connections, and details that make
              your story unforgettable.
            </p>
            <p className="body-lg mt-6 text-muted">
              Based in Kollam, Kerala, we photograph and film weddings, pre-weddings and love stories across Kerala and
              South India.
            </p>
            <ArrowLink href="/our-story" className="mt-10">
              Our story
            </ArrowLink>
          </div>
        </div>

        {media && (
          <div className="relative col-span-10 col-start-2 sm:col-span-7 sm:col-start-5 lg:col-span-4 lg:col-start-9">
            <div {...reveal("mask")}>
              <Picture media={media} sizes="(min-width: 1024px) 32vw, (min-width: 640px) 58vw, 84vw" />
            </div>
            <p
              className="mt-6 flex items-center gap-4 font-serif text-lg italic text-muted lg:absolute lg:-left-44 lg:bottom-20 lg:mt-0 lg:w-40 lg:flex-col lg:items-end lg:text-right"
              {...reveal("fade", 0.5)}
            >
              <span aria-hidden="true" className="h-px w-10 bg-olive/60 lg:order-2" />
              a moment, kept.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* 03 — Featured stories -------------------------------------------------- */

const featuredLayout = [
  { className: "col-span-12 lg:col-span-8", size: "lg", sizes: "(min-width: 1024px) 64vw, 100vw" },
  {
    className: "col-span-10 col-start-3 sm:col-span-7 sm:col-start-6 lg:col-span-4 lg:col-start-9 lg:mt-56",
    size: "md",
    sizes: "(min-width: 1024px) 32vw, (min-width: 640px) 58vw, 84vw",
  },
  {
    className: "col-span-11 sm:col-span-7 lg:col-span-5 lg:col-start-2 lg:-mt-10",
    size: "sm",
    sizes: "(min-width: 1024px) 40vw, (min-width: 640px) 58vw, 92vw",
  },
] as const;

function FeaturedStories() {
  const stories = getFeaturedStories(3);
  if (stories.length === 0) return null;

  return (
    <section aria-labelledby="featured-title" className="bg-porcelain pb-[var(--section)]">
      <div className="frame">
        <SectionRule contained={false} />
        <div className="editorial-grid items-end gap-y-8 pt-[var(--section-tight)]">
          <Lines
            id="featured-title"
            className="display-lg col-span-12 lg:col-span-7"
            lines={["Stories Worth", <em key="r">Remembering.</em>]}
          />
          <p className="lede col-span-12 italic text-muted sm:col-span-6 lg:col-span-4 lg:col-start-9 lg:pb-3" {...reveal("up", 0.2)}>
            A collection of love, beautifully lived.
          </p>
        </div>

        <div className="editorial-grid mt-16 gap-y-20 lg:mt-24">
          {stories.map((story, i) => {
            const layout = featuredLayout[i];
            return (
              <StoryCard
                key={story.slug}
                story={story}
                index={i}
                className={layout.className}
                size={layout.size}
                sizes={layout.sizes}
              />
            );
          })}
          <div className="col-span-12 flex items-end lg:col-span-4 lg:col-start-9 lg:justify-end" {...reveal("up")}>
            <ButtonLink href="/stories">View all Timeless Stories</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 03b — Portfolio highlights ---------------------------------------------- */

/** Column layouts by number of categories with photographs (class names must be literal for Tailwind). */
const highlightGrid: Record<number, { grid: string; sizes: string }> = {
  1: { grid: "sm:grid-cols-2 lg:grid-cols-3", sizes: "(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw" },
  2: { grid: "sm:grid-cols-2", sizes: "(min-width: 640px) 47vw, 100vw" },
  3: { grid: "sm:grid-cols-3", sizes: "(min-width: 640px) 31vw, 100vw" },
  4: { grid: "sm:grid-cols-2 lg:grid-cols-4", sizes: "(min-width: 1024px) 23vw, (min-width: 640px) 47vw, 100vw" },
};

/** The card photograph: the category's first portrait (cards are 4:5), else its first photograph. */
const coverFor = (images: Media[]) => images.find((m) => m.width / m.height < 0.9) ?? images[0];

/**
 * Until real stories are published, the home page shows one photograph from
 * each portfolio category as a single row of equal cards (2 × 2 on tablet, one
 * column on phones). A category without photographs simply has no card.
 */
function PortfolioHighlights() {
  if (getFeaturedStories(1).length > 0) return null;
  const picks = getCategoryGalleries()
    .map((gallery) => ({ key: gallery.key, title: gallery.title, image: coverFor(gallery.images) }))
    .slice(0, 4);
  if (picks.length === 0) return null;
  const layout = highlightGrid[picks.length];

  return (
    <section aria-labelledby="portfolio-title" className="bg-porcelain pb-[var(--section)]">
      <div className="frame">
        <SectionRule contained={false} />
        <div className="editorial-grid items-end gap-y-8 pt-[var(--section-tight)]">
          <div className="col-span-12 lg:col-span-7">
            <div {...reveal("fade")}>
              <Eyebrow className="text-muted">Timeless Stories</Eyebrow>
            </div>
            <Lines id="portfolio-title" className="display-lg mt-10" lines={["Moments Worth", <em key="r">Remembering.</em>]} />
          </div>
          <p className="lede col-span-12 italic text-muted sm:col-span-6 lg:col-span-4 lg:col-start-9 lg:pb-3" {...reveal("up", 0.2)}>
            A collection of love, beautifully lived.
          </p>
        </div>

        <ul className={`mt-16 grid grid-cols-1 gap-x-6 gap-y-12 lg:mt-24 lg:gap-x-8 ${layout.grid}`}>
          {picks.map((pick, i) => (
            <li key={pick.key}>
              {/* The whole card opens that category in the portfolio (/stories?category=…). */}
              <Link href={portfolioCategoryHref(pick.key)} aria-label={`View the ${pick.title} portfolio`} className="group block">
                <div {...reveal("mask", i * 0.1)}>
                  {/* Equal 4:5 frames so the four read as one collection; focal points are honoured. */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Picture media={pick.image} layout="fill" sizes={layout.sizes} imageClassName="zoom-media" />
                  </div>
                </div>
                <span
                  className="meta mt-5 block text-[0.62rem] text-muted transition-colors duration-500 group-hover:text-charcoal"
                  {...reveal("fade", 0.2)}
                >
                  {pick.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex lg:mt-16 lg:justify-end" {...reveal("up")}>
          <ButtonLink href="/stories">Explore Timeless Stories</ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* 04 — Brand philosophy -------------------------------------------------- */

function Philosophy() {
  return (
    <section aria-labelledby="philosophy-title" className="relative isolate overflow-hidden bg-sage text-forest section-y">
      <div aria-hidden="true" className="absolute inset-0 -z-10" {...reveal("fade")}>
        <EucalyptusSprig className="absolute -left-20 top-6 h-[40%] w-auto -rotate-[10deg] opacity-25 sm:left-[2%] sm:top-1/2 sm:h-[78%] sm:-translate-y-1/2 sm:opacity-40" />
        <EucalyptusSprig className="absolute -right-14 bottom-[-12%] hidden h-[70%] w-auto -scale-x-100 rotate-[16deg] opacity-30 md:block" />
      </div>

      <div className="frame flex flex-col items-center py-[clamp(1rem,5vw,4rem)] text-center">
        <div {...reveal("fade")}>
          <Eyebrow>Our Philosophy</Eyebrow>
        </div>
        <Lines
          id="philosophy-title"
          className="display-hero mt-12"
          lines={["Your Wedding.", <em key="o">Our Art.</em>]}
        />
        <p className="lede mt-12 max-w-[32ch] text-charcoal" {...reveal("up", 0.3)}>
          Not simply photographs. Not merely films. But the feeling of being there, beautifully preserved.
        </p>
      </div>
    </section>
  );
}

/* 05 — Cinematic films --------------------------------------------------- */

function Films() {
  // The film uploaded to public/media/home/video/ comes first, then a configured
  // showreel or a published story's film. With none, the section is left out
  // entirely — no placeholder frame, no play button, no gap.
  const video = getHomeVideo();
  const film = video ? undefined : (showreel ?? getShowcaseFilm());
  if (!video && !film) return null;
  return (
    <section aria-labelledby="films-title" className="bg-forest text-ivory section-y">
      <div className="frame">
        <div className="editorial-grid items-end gap-y-8">
          <div className="col-span-12 lg:col-span-7">
            <div {...reveal("fade")}>
              <Eyebrow className="text-sage">Cinematic Films</Eyebrow>
            </div>
            <Lines id="films-title" className="display-xl mt-10" lines={["Love,", <em key="m">In Motion.</em>]} />
          </div>
          <p className="lede col-span-12 italic text-pale-sage sm:col-span-6 lg:col-span-4 lg:col-start-9 lg:pb-4" {...reveal("up", 0.2)}>
            Some moments deserve to be felt again.
          </p>
        </div>

        <div className="mt-16 lg:mt-24" {...reveal("mask")}>
          {video ? <HomeFilm video={video} /> : film && <FilmPlayer film={film} />}
        </div>
      </div>
    </section>
  );
}

/* 06 — The experience ---------------------------------------------------- */

const stages = [
  {
    title: "Getting to Know You",
    copy: "Every story begins with listening. We take the time to understand who you are as a couple, what matters most to you, and how you imagine your celebration should feel.",
  },
  {
    title: "Capturing What Matters",
    copy: "On the day, we are attentive and unobtrusive — documenting the emotions, traditions and quiet details that make your celebration unmistakably yours.",
  },
  {
    title: "Reliving Every Moment",
    copy: "Your photographs and films are crafted with care into a story you can return to again and again, and share with the people you love.",
  },
];

function ExperienceIntro() {
  return (
    <section aria-labelledby="experience-title" className="bg-porcelain section-y">
      <div className="frame editorial-grid gap-y-16">
        <div className="col-span-12 self-start lg:sticky lg:top-32 lg:col-span-5">
          <div {...reveal("fade")}>
            <Eyebrow className="text-muted">The Experience</Eyebrow>
          </div>
          <Lines
            id="experience-title"
            className="display-lg mt-10"
            lines={["An Experience", "As Personal", <em key="s">As Your Story.</em>]}
          />
          <div className="mt-12" {...reveal("up", 0.2)}>
            <ArrowLink href="/experience">Discover the experience</ArrowLink>
          </div>
        </div>

        <ol className="col-span-12 lg:col-span-6 lg:col-start-7">
          {stages.map((stage, i) => (
            <li
              key={stage.title}
              className={`grid grid-cols-[4.5rem_1fr] gap-x-6 border-t border-charcoal/12 py-12 sm:grid-cols-[7rem_1fr] lg:py-16 ${
                i === 1 ? "lg:ml-[8%]" : i === 2 ? "lg:ml-[16%]" : ""
              }`}
              {...reveal("up", i * 0.08)}
            >
              <span aria-hidden="true" className="font-serif text-[clamp(2.6rem,2rem+2.4vw,4.5rem)] font-light italic leading-none text-olive">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="display-sm">
                  <span className="sr-only">{`Stage ${i + 1}: `}</span>
                  {stage.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-muted">{stage.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 07 — Full-bleed editorial moment --------------------------------------- */

function EditorialMoment() {
  return (
    <section
      aria-labelledby="moment-title"
      className={`isolate overflow-hidden bg-charcoal text-ivory ${imagery.editorialMoment ? "sticky top-0 h-[60svh] min-h-[22rem] md:h-[50svh] lg:h-[92svh] lg:min-h-[32rem]" : "relative section-y"}`}
    >
      {/* Without a photograph this stays a typographic interlude on charcoal. */}
      {imagery.editorialMoment && (
        <div className="absolute inset-0 -z-10">
          <Picture media={imagery.editorialMoment} layout="fill" sizes="100vw" />
        </div>
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-charcoal/35" />
      <div className="frame flex h-full flex-col items-center justify-center text-center">
        <Lines
          id="moment-title"
          className="display-xl"
          lines={["The Moments Pass.", <em key="f">The Feeling Remains.</em>]}
        />
      </div>
    </section>
  );
}
