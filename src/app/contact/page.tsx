import type { Metadata } from "next";
import { site } from "@/config/site";
import { imagery } from "@/content/imagery";
import { Page } from "@/components/layout/Page";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { Lines, reveal } from "@/components/ui/Typography";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Tell Timeless Knot about your wedding, elopement or celebration. Every story begins with a conversation.",
  path: "/contact",
});

export default function ContactPage() {
  const live = Boolean(process.env.ENQUIRY_WEBHOOK_URL);
  const { email, phone, whatsapp } = site.contact;

  return (
    <Page>
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

            <div className="mt-16 hidden w-[62%] lg:block" {...reveal("mask")}>
              <Picture media={imagery.contact} sizes="24vw" caption="tag" />
            </div>
          </div>

          <div className="intro-fade col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-6" style={{ ["--delay" as string]: "0.6s" }}>
            <EnquiryForm live={live} />
          </div>
        </div>
      </section>
    </Page>
  );
}
