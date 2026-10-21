import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { whatsappNumber } from "@/lib/whatsapp";
import { imagery } from "@/content/imagery";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { Eyebrow, Lines, reveal } from "@/components/ui/Typography";
import { SectionRule } from "@/components/ui/SectionRule";
import { faqSchema, JsonLd, pageMetadata, pageSchema } from "@/lib/seo";

const title = "Contact Timeless Knot | Wedding Photography Enquiries Kerala";
const description =
  "Enquire with Timeless Knot for wedding photography, cinematography, pre-wedding and couple shoots in Kerala and across South India.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/contact" });

const extendedStates = site.serviceArea.extended.map((r) => r.name);

/**
 * Short answers to the questions couples ask first. Each one states only
 * confirmed facts (src/config/site.ts) and is mirrored in the FAQPage data.
 */
const faqs: { question: string; answer: string; link?: { href: string; label: string } }[] = [
  {
    question: "Where is Timeless Knot based?",
    answer: `Timeless Knot is based in ${site.location.locality}, ${site.location.region}, ${site.location.country}.`,
  },
  {
    question: "What does Timeless Knot photograph and film?",
    answer: "Wedding photography and wedding cinematography, as well as pre-wedding and couple photography.",
  },
  {
    question: "Do you work outside Kollam?",
    answer: `Yes. We work across ${site.serviceArea.primary.name} and welcome enquiries for photography and cinematography assignments throughout South India, including ${extendedStates.slice(0, -1).join(", ")} and ${extendedStates.at(-1)}.`,
  },
  {
    question: "Where can we see your work?",
    answer: "Our portfolio, Timeless Stories, brings together wedding, pre-wedding, couple and creative photography.",
    link: { href: "/stories", label: "Explore Timeless Stories" },
  },
  {
    question: "How do we get in touch?",
    answer: site.contact.whatsapp
      ? "Send us an enquiry using the form on this page, or message us directly on WhatsApp."
      : "Send us an enquiry using the form on this page.",
  },
];

export default function ContactPage() {
  const { email, phone, whatsapp } = site.contact;

  return (
    <Page>
      <JsonLd
        data={pageSchema({
          path: "/contact",
          name: title,
          description,
          type: "ContactPage",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ],
          extra: [faqSchema("/contact", faqs)],
        })}
      />
      <section aria-labelledby="contact-title" className="bg-porcelain pb-[var(--section)] pt-[calc(var(--header-h)+clamp(3rem,9vw,8rem))]">
        <div className="frame editorial-grid gap-y-16">
          <div className="col-span-12 lg:col-span-5">
            <p className="eyebrow intro-fade mb-10 flex items-center gap-4 text-muted" style={{ ["--delay" as string]: "0.1s" }}>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
              Contact
            </p>
            <Lines
              as="h1"
              id="contact-title"
              mode="intro"
              className="display-xl"
              lines={["Every Story", <em key="b">Begins Somewhere.</em>]}
            />
            <p className="lede intro-fade mt-10 text-muted" style={{ ["--delay" as string]: "0.8s" }}>
              Tell us a little about yours.
            </p>
            <p className="intro-fade mt-6 max-w-[40ch] text-muted" style={{ ["--delay" as string]: "0.9s" }}>
              {site.positioning}
            </p>

            {(email || phone || whatsapp) && (
              <ul className="mt-12 space-y-3" {...reveal("up")}>
                {email && (
                  <li>
                    <a className="link-draw" href={`mailto:${email}`}>
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a className="link-draw" href={`tel:${phone.replace(/\s/g, "")}`}>
                      {phone}
                    </a>
                  </li>
                )}
                {whatsapp && (
                  <li>
                    <a className="link-draw" href={whatsapp} target="_blank" rel="noopener noreferrer">
                      Message us on WhatsApp
                    </a>
                  </li>
                )}
              </ul>
            )}

            {imagery.contact && (
              <div className="mt-16 hidden w-[62%] lg:block" {...reveal("mask")}>
                <Picture media={imagery.contact} sizes="24vw" />
              </div>
            )}
          </div>

          <div className="intro-fade col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-6" style={{ ["--delay" as string]: "0.6s" }}>
            <EnquiryForm whatsappNumber={whatsappNumber(whatsapp)} />
          </div>
        </div>
      </section>

      {/* Good to know — concise answers, also published as FAQPage structured data */}
      <section aria-labelledby="faq-title" className="bg-porcelain pb-[var(--section)]">
        <SectionRule className="mb-[var(--section-tight)]" />
        <div className="frame editorial-grid gap-y-14">
          <div className="col-span-12 self-start lg:col-span-4">
            <div {...reveal("fade")}>
              <Eyebrow className="text-muted">Good to Know</Eyebrow>
            </div>
            <Lines id="faq-title" className="display-lg mt-10" lines={["Questions,", <em key="a">Answered.</em>]} />
          </div>
          <dl className="col-span-12 lg:col-span-7 lg:col-start-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-t border-charcoal/12 py-8 lg:py-10" {...reveal("up")}>
                <dt className="display-sm">{faq.question}</dt>
                <dd className="mt-4 max-w-[52ch] text-muted">
                  {faq.answer}
                  {faq.link && (
                    <>
                      {" "}
                      <Link href={faq.link.href} className="link-draw text-charcoal">
                        {faq.link.label}
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </Page>
  );
}
