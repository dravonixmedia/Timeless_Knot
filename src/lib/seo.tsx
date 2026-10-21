import type { Metadata } from "next";
import { absoluteUrl, site } from "@/config/site";
import type { WeddingStory } from "@/content/types";

/*
 * Structured data built strictly from confirmed facts in `site` config: the
 * studio's name, its Kollam, Kerala base (city level only), the regions it
 * works in, its services and its WhatsApp contact. No street address,
 * coordinates, opening hours, prices, ratings, reviews or awards are emitted.
 * Every node has a stable @id so pages can refer to the same studio.
 */

/** `https://…/#name` for the home page, `https://…/path#name` elsewhere. */
const anchor = (path: string, name: string) => `${path === "/" ? `${site.url}/` : absoluteUrl(path)}#${name}`;

const ids = {
  organization: anchor("/", "organization"),
  website: anchor("/", "website"),
  page: (path: string) => anchor(path, "webpage"),
  breadcrumb: (path: string) => anchor(path, "breadcrumb"),
  service: (name: string) => anchor("/", `service-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`),
};

const region = (r: { name: string }) => ({
  "@type": "State",
  name: r.name,
  containedInPlace: { "@type": "Country", name: site.location.country },
});

const areaServed = () => [site.serviceArea.primary, ...site.serviceArea.extended].map(region);

/** The studio (a LocalBusiness subtype) and the website, emitted on every page. */
export function siteSchema() {
  const sameAs = [site.social.instagram].filter(Boolean);
  const { email, phone, whatsapp } = site.contact;
  const organization = {
    "@type": "ProfessionalService",
    "@id": ids.organization,
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl("/opengraph-image"),
    slogan: site.tagline,
    description: site.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location.locality,
      addressRegion: site.location.region,
      addressCountry: site.location.countryCode,
    },
    areaServed: areaServed(),
    knowsAbout: site.services.map((s) => s.name),
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    // The chat link without the pre-filled greeting the buttons add.
    ...(whatsapp ? { contactPoint: { "@type": "ContactPoint", contactType: "enquiries", url: whatsapp.split("?")[0] } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const website = {
    "@type": "WebSite",
    "@id": ids.website,
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: "en-IN",
    publisher: { "@id": ids.organization },
  };
  return { "@context": "https://schema.org", "@graph": [organization, website] };
}

/** The studio's services, linked to the studio; used where the services are described. */
export function servicesSchema() {
  return site.services.map((service) => ({
    "@type": "Service",
    "@id": ids.service(service.name),
    name: service.name,
    serviceType: service.name,
    description: service.description,
    provider: { "@id": ids.organization },
    areaServed: areaServed(),
  }));
}

type Crumb = { name: string; path: string };

/**
 * A page node (WebPage or a subtype) linked to the website and the studio,
 * with its breadcrumb trail and any extra nodes, as one @graph.
 */
export function pageSchema({
  path,
  name,
  description,
  type = "WebPage",
  breadcrumbs,
  extra = [],
}: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage";
  breadcrumbs?: Crumb[];
  extra?: object[];
}) {
  const page = {
    "@type": type,
    "@id": ids.page(path),
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": ids.website },
    about: { "@id": ids.organization },
    ...(breadcrumbs ? { breadcrumb: { "@id": ids.breadcrumb(path) } } : {}),
  };
  const trail = breadcrumbs ? [{ ...breadcrumbList(breadcrumbs), "@id": ids.breadcrumb(path) }] : [];
  return { "@context": "https://schema.org", "@graph": [page, ...trail, ...extra] };
}

function breadcrumbList(items: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function breadcrumbSchema(items: Crumb[]) {
  return { "@context": "https://schema.org", ...breadcrumbList(items) };
}

/** Questions and answers shown on the page, as an FAQPage node. */
export function faqSchema(path: string, faqs: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    "@id": anchor(path, "faq"),
    isPartOf: { "@id": ids.page(path) },
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
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
    creator: { "@id": ids.organization },
    ...(story.date ? { dateCreated: story.date } : {}),
    ...(story.location ? { locationCreated: { "@type": "Place", name: story.location } } : {}),
  };
}

/** The typographic share card (app/opengraph-image.tsx). */
export const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — wedding photography and cinematography, based in Kollam, Kerala`,
};

/**
 * Consistent per-page metadata: the full search title (used as given, without
 * the layout's title template), description, canonical URL, Open Graph and
 * Twitter card with the share image (set on every page: a page's own Open
 * Graph block would otherwise drop the image inherited from the root).
 */
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
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: site.name, type: "website", locale: "en_IN", images: [shareImage] },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
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
