import type { Metadata } from "next";
import { extraImagery, imagery } from "@/content/imagery";
import { composeGallery } from "@/lib/compose-gallery";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { SectionRule } from "@/components/ui/SectionRule";
import { Gallery } from "@/components/stories/Gallery";
import { Invitation } from "@/components/sections/Invitation";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our Story",
  description:
    "The vision and philosophy behind Timeless Knot — wedding photography and cinematography for couples who value personal expression, meaningful traditions and celebrations that feel entirely their own.",
  path: "/our-story",
});

/*
 * Copy is a refined rewrite of the client's supplied vision and philosophy:
 * every wedding is a personal story; genuine emotion, individuality, meaningful
 * traditions and relationships; adventurous weddings, unconventional traditions
 * and elopements. No history, team or achievements are claimed.
 */

const principles = [
  {
    title: "Emotion before perfection",
    copy: "We look for what is real — the laugh that breaks a ceremony’s stillness, the hand that reaches for another. Honest feeling will always matter more to us than a flawless pose.",
  },
  {
    title: "Tradition, understood",
    copy: "Rituals carry the memory of families and generations. We take the time to understand what each one means to you, so it is documented with the respect and attention it deserves.",
  },
  {
    title: "A story, not a sequence",
    copy: "Photographs and film are composed to be experienced together — a narrative with rhythm, pause and feeling, rather than a simple record of what happened next.",
  },
];

export default function OurStoryPage() {
  const { storyHero, storyVision, storyPairA, storyPairB } = imagery;
  const pair = [storyPairA, storyPairB].filter((media) => media !== undefined);
  const more = composeGallery(extraImagery.about);

  return (
    <Page>
      {/* Hero */}
      <section aria-labelledby="our-story-title" className="bg-porcelain pt-[calc(var(--header-h)+clamp(3rem,9vw,8rem))]">
        <div className="frame editorial-grid items-end gap-y-14 pb-[var(--section-tight)]">
          <div className={`col-span-12 ${storyHero ? "lg:col-span-8" : "lg:col-span-10"}`}>
            <p className="eyebrow intro-fade mb-10 flex items-center gap-4 text-muted" style={{ ["--delay" as string]: "0.1s" }}>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
              Our Story
            </p>
            <Lines
              as="h1"
              id="our-story-title"
              mode="intro"
              className="display-xl"
              lines={["Behind Every Frame,", <em key="f">A Feeling.</em>]}
            />
            <p className="lede intro-fade mt-12 max-w-[30ch] text-muted lg:ml-[14%]" style={{ ["--delay" as string]: "0.9s" }}>
              Every wedding is a deeply personal story. Ours is the privilege of telling it well.
            </p>
          </div>
          {storyHero && (
            <div className="col-span-10 col-start-3 sm:col-span-6 sm:col-start-7 lg:col-span-4 lg:col-start-9">
              <div className="intro-fade" style={{ ["--delay" as string]: "0.5s" }}>
                <Picture media={storyHero} priority sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 84vw" />
              </div>
            </div>
          )}
        </div>
      </section>

      <SectionRule />

      {/* Brand introduction */}
      <section aria-labelledby="intro-title" className="bg-porcelain pb-[var(--section)] pt-[var(--section-tight)]">
        <div className="frame editorial-grid gap-y-10">
          <div className="col-span-12 lg:col-span-3" {...reveal("fade")}>
            <Eyebrow className="text-muted">Who we are</Eyebrow>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:col-start-5">
            <h2 id="intro-title" className="sr-only">
              Who we are
            </h2>
            <p className="display-sm max-w-[34ch] font-light leading-[1.35]" {...reveal("up")}>
              Timeless Knot is a wedding photography and cinematography studio devoted to the stories of the couples
              we work with — their emotions, their personalities, their traditions and the relationships that surround
              them.
            </p>
            <p className="body-lg mt-10 max-w-[52ch] text-muted" {...reveal("up", 0.1)}>
              We believe a wedding should be remembered as it was felt. Not as a checklist of moments, but as a living
              story: the anticipation, the people, the rituals and the quiet in-between, all preserved through thoughtful
              imagery and cinematic storytelling.
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section aria-labelledby="vision-title" className="relative bg-forest text-ivory">
        {/* The landscape photograph holds still while the vision text scrolls up over it. */}
        {storyVision && (
          <div className="sticky top-0 h-[62svh] min-h-[22rem] overflow-hidden md:h-[46svh] lg:h-[62svh]">
            <Picture media={storyVision} layout="fill" sizes="100vw" />
          </div>
        )}
        <div className="frame editorial-grid relative gap-y-10 bg-forest section-y">
          <div className="col-span-12 lg:col-span-4">
            <div {...reveal("fade")}>
              <Eyebrow className="text-sage">Our Vision</Eyebrow>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <Lines
              id="vision-title"
              className="display-lg"
              lines={["For the adventurous,", "the unconventional,", <em key="i">and the intimate.</em>]}
            />
            <div className="mt-12 grid gap-8 text-ivory/85 sm:grid-cols-2 sm:gap-12" {...reveal("up", 0.15)}>
              <p>
                We are especially drawn to couples who see their wedding as an expression of who they are — those who
                choose adventurous celebrations, reimagine traditions in their own way, or simply slip away to elope.
              </p>
              <p>
                Whatever shape your celebration takes, our vision stays the same: to honour its individuality, and to
                tell its story with the sincerity and artistry it deserves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Artistic philosophy */}
      <section aria-labelledby="philosophy-title" className="bg-porcelain section-y">
        <div className="frame editorial-grid gap-y-16">
          {pair[0] && (
            <div className="col-span-7 sm:col-span-5 lg:col-span-4" {...reveal("mask")}>
              <Picture media={pair[0]} sizes="(min-width: 1024px) 30vw, 55vw" />
            </div>
          )}
          {pair[1] && (
            <div className="col-span-7 col-start-6 -mt-28 sm:col-span-5 sm:col-start-7 sm:mt-40 lg:col-span-3 lg:col-start-6 lg:mt-64" {...reveal("mask", 0.15)}>
              <Picture media={pair[1]} sizes="(min-width: 1024px) 24vw, 55vw" />
            </div>
          )}
          <div
            className={`col-span-12 self-center ${
              pair.length === 2 ? "lg:col-span-4 lg:col-start-9" : pair.length === 1 ? "lg:col-span-6 lg:col-start-7" : "lg:col-span-8 lg:col-start-3"
            }`}
          >
            <div {...reveal("fade")}>
              <Eyebrow className="text-muted">Artistic Philosophy</Eyebrow>
            </div>
            <Lines id="philosophy-title" className="display-md mt-8" lines={["Not simply photographs.", <em key="n">Not merely films.</em>]} />
            <p className="body-lg mt-8 text-muted" {...reveal("up", 0.1)}>
              Our work lives between documentary and fine art. We observe with patience, compose with intention, and
              let light, gesture and atmosphere carry the emotion of each moment — so that, years from now, your
              photographs return not just the memory of the day, but the feeling of being there.
            </p>
          </div>
        </div>
      </section>

      {/* Further photographs uploaded to about/ beyond the slots above */}
      {more.length > 0 && (
        <section aria-label="Photographs" className="bg-porcelain pb-[var(--section)]">
          <Gallery blocks={more} />
        </section>
      )}

      {/* Approach to storytelling */}
      <section aria-labelledby="approach-title" className="bg-pale-sage section-y">
        <div className="frame">
          <div className="editorial-grid items-end gap-y-8">
            <div className="col-span-12 lg:col-span-7">
              <div {...reveal("fade")}>
                <Eyebrow className="text-muted">Our Approach</Eyebrow>
              </div>
              <Lines id="approach-title" className="display-lg mt-10" lines={["How We Tell", <em key="s">Your Story.</em>]} />
            </div>
          </div>
          <ol className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-3 lg:mt-24">
            {principles.map((item, i) => (
              <li key={item.title} className="border-t border-charcoal/15 pt-8" {...reveal("up", i * 0.1)}>
                <span aria-hidden="true" className="font-serif text-3xl font-light italic text-olive">
                  {["i.", "ii.", "iii."][i]}
                </span>
                <h3 className="display-sm mt-6">{item.title}</h3>
                <p className="mt-4 text-muted">{item.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Personalised experiences */}
      <section aria-labelledby="personal-title" className="bg-porcelain pb-[var(--section-tight)] pt-[var(--section)]">
        <div className="frame">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center" {...reveal("fade")}>
              <Eyebrow className="text-muted">Personal, Always</Eyebrow>
            </div>
            <Lines
              id="personal-title"
              className="display-lg mt-10"
              lines={["No two couples are alike.", <em key="n">Neither are their stories.</em>]}
            />
            <p className="body-lg mx-auto mt-10 max-w-[56ch] text-muted" {...reveal("up", 0.15)}>
              That is why every celebration we document begins with conversation. By understanding who you are and what
              matters most to you, we shape an experience — and a story — that feels entirely your own, whether you are
              planning a grand celebration, an intimate gathering or an elopement for two.
            </p>
          </div>
        </div>
      </section>

      <Invitation
        divided
        heading={["Your Story", <em key="b">Begins Here.</em>]}
        copy="We would love to learn about you, your plans and the celebration you imagine."
        cta="Start the conversation"
      />
    </Page>
  );
}
