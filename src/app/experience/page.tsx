import type { Metadata } from "next";
import { imagery } from "@/content/imagery";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { Parallax } from "@/components/motion/Parallax";
import { Invitation } from "@/components/sections/Invitation";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The Experience",
  description:
    "How Timeless Knot works with couples — from the first conversation and creative preparation to wedding-day storytelling, post-production and the delivery of your memories.",
  path: "/experience",
});

/*
 * Stages describe the approach only. Package inclusions, turnaround times and
 * deliverable formats are intentionally omitted until confirmed by the studio.
 */
const stages = [
  {
    title: "The First Conversation",
    copy: "It begins simply: you tell us about yourselves and the celebration you are dreaming of. There is no script — just an honest conversation to see whether we are right for one another.",
  },
  {
    title: "Understanding You",
    copy: "We take time to learn what makes you, you — your relationship, your families, the traditions you hold close and the moments you most want to remember.",
  },
  {
    title: "Creative Preparation",
    copy: "With your story in mind, we prepare thoughtfully for the day: its rhythm, its places and its people, so that we can be fully present when it matters.",
  },
  {
    title: "Wedding-Day Storytelling",
    copy: "On the day itself we work with quiet attention, documenting what unfolds naturally — the emotion, the rituals, the details and the in-between moments that are easy to miss.",
  },
  {
    title: "Post-Production",
    copy: "Every photograph and film is thoughtfully edited and shaped into a cohesive story that feels true to the day, and to you.",
  },
  {
    title: "Delivering Your Memories",
    copy: "Finally, your story is returned to you — to revisit, to share with the people you love, and to keep long after the day itself has passed.",
  },
];

export default function ExperiencePage() {
  return (
    <Page>
      {/* Hero */}
      <section aria-labelledby="experience-title" className="bg-porcelain pt-[calc(var(--header-h)+clamp(3rem,9vw,8rem))]">
        <div className="frame pb-[var(--section-tight)]">
          <p className="eyebrow intro-fade mb-10 flex items-center gap-4 text-muted" style={{ ["--delay" as string]: "0.1s" }}>
            <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
            The Experience
          </p>
          <div className="editorial-grid items-end gap-y-10">
            <Lines
              as="h1"
              id="experience-title"
              mode="intro"
              className="display-xl col-span-12 lg:col-span-8"
              lines={["Every Detail.", "Every Emotion.", <em key="m">Every Moment.</em>]}
            />
            <p className="lede intro-fade col-span-12 text-muted sm:col-span-8 lg:col-span-4 lg:pb-3" style={{ ["--delay" as string]: "0.9s" }}>
              An experience shaped around you — personal, unhurried and attentive from the first hello to the final
              frame.
            </p>
          </div>
        </div>
        <div className="intro-fade" style={{ ["--delay" as string]: "0.6s" }}>
          <Parallax amount={12} className="h-[70svh] min-h-[22rem]">
            <Picture media={imagery.experienceHero} layout="fill" sizes="100vw" priority caption="tag" />
          </Parallax>
        </div>
      </section>

      {/* Journey */}
      <section aria-labelledby="journey-title" className="bg-porcelain section-y">
        <div className="frame editorial-grid gap-y-14">
          <div className="col-span-12 self-start lg:sticky lg:top-32 lg:col-span-4">
            <div {...reveal("fade")}>
              <Eyebrow className="text-muted">The Journey</Eyebrow>
            </div>
            <Lines id="journey-title" className="display-lg mt-10" lines={["From Hello", <em key="f">to Forever.</em>]} />
            <p className="body-lg mt-8 max-w-[36ch] text-muted" {...reveal("up", 0.15)}>
              Six quiet chapters, each one guided by the same belief: your wedding should be remembered as it was
              felt.
            </p>
          </div>

          <ol className="col-span-12 lg:col-span-7 lg:col-start-6">
            {stages.map((stage, i) => (
              <li
                key={stage.title}
                className="grid grid-cols-[3.75rem_1fr] gap-x-5 border-t border-charcoal/12 py-10 sm:grid-cols-[8rem_1fr] sm:gap-x-8 lg:py-14"
                {...reveal("up")}
              >
                <span aria-hidden="true" className="font-serif text-[clamp(2.4rem,1.8rem+2.4vw,4.75rem)] font-light italic leading-[0.9] text-olive">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="display-sm">
                    <span className="sr-only">{`Chapter ${i + 1}: `}</span>
                    {stage.title}
                  </h3>
                  <p className="mt-4 max-w-[48ch] text-muted">{stage.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Editorial pairing */}
      <section aria-labelledby="keep-title" className="bg-pale-sage section-y">
        <div className="frame editorial-grid items-center gap-y-14">
          <div className="col-span-10 sm:col-span-6 lg:col-span-4 lg:col-start-2" {...reveal("mask")}>
            <Picture media={imagery.experienceDetail} sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 84vw" />
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-7">
            <Lines id="keep-title" className="display-lg" lines={["Made to Be", "Returned To,", <em key="a">Again and Again.</em>]} />
            <p className="body-lg mt-10 max-w-[44ch] text-muted" {...reveal("up", 0.15)}>
              The day passes quickly. What remains is how it felt — and a story you can step back into whenever you
              wish, for years to come.
            </p>
          </div>
        </div>
      </section>

      <Invitation />
    </Page>
  );
}
