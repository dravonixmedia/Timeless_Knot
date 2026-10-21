import type { ReactNode } from "react";
import { Page } from "@/components/layout/Page";
import { Lines } from "@/components/ui/Typography";
import { JsonLd, pageSchema } from "@/lib/seo";
import { InPageLinks } from "./InPageLinks";

export type LegalSection = { id: string; heading: string; body: ReactNode };

type Props = {
  path: string;
  /** Search title and description, also used for the page's structured data. */
  title: string;
  description: string;
  eyebrow: string;
  heading: ReactNode[];
  intro: ReactNode;
  /** ISO date (YYYY-MM-DD) the text was last changed. */
  updated: string;
  sections: LegalSection[];
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * A long-form legal page in the editorial style: eyebrow, display heading,
 * a short introduction and the last-updated date, then numbered sections in a
 * comfortable reading measure. Contents sit in a sticky column on wide
 * screens and in a disclosure on phones; each section heading is an anchor.
 */
export function LegalPage({ path, title, description, eyebrow, heading, intro, updated, sections }: Props) {
  const contents = (
    <ol className="space-y-2.5 text-[0.9rem] leading-snug">
      {sections.map((section, i) => (
        <li key={section.id} className="flex gap-3">
          <span aria-hidden="true" className="w-6 shrink-0 tabular-nums text-muted">
            {String(i + 1).padStart(2, "0")}
          </span>
          <a href={`#${section.id}`} className="link-draw text-charcoal/85 hover:text-charcoal">
            {section.heading}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <Page>
      <JsonLd
        data={pageSchema({
          path,
          name: title,
          description,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: eyebrow, path },
          ],
        })}
      />
      <article id="legal" aria-labelledby="legal-title" className="bg-porcelain pb-[var(--section)] pt-[calc(var(--header-h)+clamp(3rem,9vw,8rem))]">
        <header className="frame editorial-grid pb-[var(--section-tight)]">
          <div className="col-span-12 lg:col-span-10">
            <p className="eyebrow intro-fade mb-10 flex items-center gap-4 text-muted" style={{ ["--delay" as string]: "0.1s" }}>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
              {eyebrow}
            </p>
            <Lines as="h1" id="legal-title" mode="intro" className="display-xl" lines={heading} />
            <div className="intro-fade mt-12 max-w-[44ch] lg:ml-[14%]" style={{ ["--delay" as string]: "0.8s" }}>
              <p className="lede text-muted">{intro}</p>
              <p className="meta mt-8 text-[0.62rem] text-muted">
                Last updated <time dateTime={updated}>{formatDate(updated)}</time>
              </p>
            </div>
          </div>
        </header>

        <div className="frame">
          <div className="h-px bg-charcoal/15" aria-hidden="true" />
        </div>

        <div className="frame editorial-grid gap-y-12 pt-[var(--section-tight)]">
          <nav aria-label="Contents" className="col-span-12 lg:col-span-3">
            <details className="legal-contents border-b border-charcoal/12 pb-5 lg:hidden">
              <summary className="meta flex min-h-11 cursor-pointer items-center justify-between text-[0.62rem] text-muted">
                Contents
                <svg aria-hidden="true" viewBox="0 0 12 8" className="h-2 w-3" fill="none" stroke="currentColor">
                  <path d="M1 1l5 5 5-5" />
                </svg>
              </summary>
              <div className="pt-4">{contents}</div>
            </details>
            <div className="sticky top-[calc(var(--header-h)+2rem)] hidden lg:block">
              <p className="meta mb-6 text-[0.62rem] text-muted">Contents</p>
              {contents}
            </div>
          </nav>

          <div className="legal-prose col-span-12 lg:col-span-7 lg:col-start-5">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                tabIndex={-1}
                className="outline-none scroll-mt-[calc(var(--header-h)+1.5rem)] border-t border-charcoal/12 py-10 first:border-t-0 first:pt-0 lg:py-12"
              >
                <h2 id={`${section.id}-title`} className="display-sm flex items-baseline gap-4">
                  <span aria-hidden="true" className="meta shrink-0 text-[0.62rem] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{section.heading}</span>
                </h2>
                <div className="mt-6 space-y-5 text-charcoal/85">{section.body}</div>
              </section>
            ))}
          </div>
        </div>
      </article>
      <InPageLinks within="legal" />
    </Page>
  );
}
