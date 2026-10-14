import type { Metadata } from "next";
import { absoluteUrl, site } from "@/config/site";
import type { WeddingStory } from "@/content/types";

/**
 * Structured data built strictly from confirmed facts in `site` config.
 * No address, service area, rating or review is emitted until verified.
 */
export function organizationSchema() {
  const sameAs = [site.social.instagram].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${absoluteUrl("/")}#organization`,
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url: absoluteUrl("/"),
    knowsAbout: ["Wedding photography", "Wedding cinematography", "Elopement photography"],
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function storySchema(story: WeddingStory) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: story.couple ? `${story.couple} — ${story.title}` : story.title,
    description: story.seo?.description ?? story.excerpt,
    url: absoluteUrl(`/stories/${story.slug}`),
    genre: story.category,
    creator: { "@id": `${absoluteUrl("/")}#organization` },
    ...(story.date ? { dateCreated: story.date } : {}),
    ...(story.location ? { locationCreated: { "@type": "Place", name: story.location } } : {}),
  };
}

/** Consistent per-page metadata with canonical URL and Open Graph. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} — ${site.name}`, description, url: path, siteName: site.name, type: "website" },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
