import type { ReactNode } from "react";
import { imagery } from "@/content/imagery";
import { Picture } from "@/components/media/Picture";
import { Monogram } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Links";
import { Lines, reveal } from "@/components/ui/Typography";
import { SectionRule } from "@/components/ui/SectionRule";

/**
 * Closing invitation used across pages — a personal note, not a sales banner.
 * Two small photographs drift at the margins on wide screens.
 */
export function Invitation({
  heading = ["Let’s Create", <em key="t">Something Timeless.</em>],
  copy = "Every extraordinary story begins with a conversation. We’d love to hear yours.",
  cta = "Tell us your story",
  divided = false,
}: {
  heading?: ReactNode[];
  copy?: string;
  cta?: string;
  /** Opens with a section divider: use when the section above is also porcelain. */
  divided?: boolean;
}) {
  return (
    <section
      aria-labelledby="invitation-title"
      className={`relative overflow-hidden bg-porcelain ${divided ? "pb-[var(--section)]" : "section-y"}`}
    >
      {divided && <SectionRule className="mb-[var(--section-tight)]" />}
      <div className="frame relative">
        {imagery.invitationLeft && (
          <div className="pointer-events-none absolute left-[var(--gutter)] top-0 hidden w-[15%] max-w-56 lg:block" {...reveal("mask")}>
            <Picture media={imagery.invitationLeft} sizes="15vw" />
          </div>
        )}
        {imagery.invitationRight && (
          <div className="pointer-events-none absolute bottom-0 right-[var(--gutter)] hidden w-[19%] max-w-72 lg:block" {...reveal("mask", 0.2)}>
            <Picture media={imagery.invitationRight} sizes="19vw" />
          </div>
        )}

        <div className="relative mx-auto flex max-w-3xl flex-col items-center py-6 text-center lg:py-20">
          <div {...reveal("fade")}>
            <Monogram className="mb-10 h-12 w-12 text-olive" />
          </div>
          <Lines id="invitation-title" lines={heading} className="display-xl" />
          <p className="body-lg mt-8 max-w-[38ch] text-muted" {...reveal("up", 0.2)}>
            {copy}
          </p>
          <div className="mt-12" {...reveal("up", 0.3)}>
            <ButtonLink href="/contact">{cta}</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
