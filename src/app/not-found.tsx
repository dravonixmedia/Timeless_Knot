import type { Metadata } from "next";
import { EucalyptusSprig } from "@/components/brand/Botanical";
import { ArrowLink, ButtonLink } from "@/components/ui/Links";
import { Lines } from "@/components/ui/Typography";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-porcelain pb-24 pt-[calc(var(--header-h)+4rem)]"
    >
      <EucalyptusSprig className="pointer-events-none absolute -right-10 top-1/2 -z-10 h-[80%] w-auto -translate-y-1/2 rotate-[12deg] text-sage opacity-50" />
      <div className="frame">
        <p className="meta text-[0.62rem] text-muted">Error 404</p>
        <Lines
          as="h1"
          id="not-found-title"
          mode="intro"
          className="display-xl mt-8"
          lines={["This Page Has", <em key="w">Wandered Off.</em>]}
        />
        <p className="body-lg mt-10 max-w-[40ch] text-muted">
          The page you were looking for may have moved, or perhaps it was never here at all. Let us guide you back.
        </p>
        <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10">
          <ButtonLink href="/">Return home</ButtonLink>
          <ArrowLink href="/stories">Wedding stories</ArrowLink>
        </div>
      </div>
    </section>
  );
}
