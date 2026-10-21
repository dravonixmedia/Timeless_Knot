import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { StudioContact } from "@/components/legal/StudioContact";
import { pageMetadata } from "@/lib/seo";

const path = "/terms-and-conditions";
const title = "Terms & Conditions | Timeless Knot";
const description =
  "Read the website terms, enquiry information, intellectual property conditions and service-related policies for Timeless Knot.";

export const metadata: Metadata = pageMetadata({ title, description, path });

/** Change whenever the terms change. */
const UPDATED = "2026-10-21";

/*
 * Website terms only. Prices, deposits, payment schedules, refunds,
 * cancellation charges, delivery timelines and usage rights are deliberately
 * not stated: they belong in each client's written booking agreement, which
 * these terms defer to. No registered company name, address or specific court
 * is named because none is confirmed (site.legalName is null).
 *
 * REVIEW before launch — see docs/LEGAL-REVIEW.md: ownership of the studio's
 * work and brand, client permission for portfolio images, the limitation of
 * liability and the governing-law / jurisdiction clause.
 */
const services = site.services.map((s) => s.name.toLowerCase());

const sections: LegalSection[] = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          These Terms &amp; Conditions apply to your use of this website, which is operated by {site.name}, a photography and
          cinematography studio based in {site.location.locality}, {site.location.region}, {site.location.country}.
        </p>
        <p>
          In these terms, “{site.name}”, “we”, “us” and “our” refer to our studio, and “you” means anyone who visits or uses the
          website.
        </p>
      </>
    ),
  },
  {
    id: "acceptance-of-terms",
    heading: "Acceptance of Terms",
    body: (
      <p>
        By using this website you agree to these terms. If you do not agree, please do not use the website. Our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link> explains how we handle personal information.
      </p>
    ),
  },
  {
    id: "website-purpose",
    heading: "Website Purpose",
    body: (
      <p>
        This website presents our work, describes our services and lets you prepare an enquiry. Its content is general
        information, not an offer or a contract, and we may change it at any time without notice.
      </p>
    ),
  },
  {
    id: "photography-and-cinematography-services",
    heading: "Photography and Cinematography Services",
    body: (
      <>
        <p>
          We offer {services.slice(0, -1).join(", ")} and {services.at(-1)}, and welcome enquiries for engagements and other
          celebrations. Service descriptions on this website are general.
        </p>
        <p>
          The coverage, deliverables, timelines and other details of each booking are set out in the quotation and booking
          agreement we make with you. These website terms do not replace that agreement. If they differ, the booking agreement
          applies to the services it covers.
        </p>
      </>
    ),
  },
  {
    id: "enquiries-and-availability",
    heading: "Enquiries and Availability",
    body: (
      <>
        <p>
          Sending an enquiry, through our contact form, on WhatsApp or in any other way,{" "}
          <strong className="font-medium text-charcoal">does not confirm a booking or reserve a date</strong>. We check
          availability when we receive your enquiry, and a date is held for you only once your booking is confirmed.
        </p>
        <p>Please give us accurate details so we can respond properly.</p>
      </>
    ),
  },
  {
    id: "booking-confirmation",
    heading: "Booking Confirmation",
    body: (
      <p>
        A booking is confirmed only when we confirm it to you in writing. We may require a separate written booking
        agreement to be accepted, and any payment it sets out to be made, before a booking is confirmed.
      </p>
    ),
  },
  {
    id: "pricing-and-quotations",
    heading: "Pricing and Quotations",
    body: (
      <p>
        We do not publish prices on this website. Any price or quotation we give you depends on your requirements, is valid
        only for the period it states and remains subject to confirmation until your booking is confirmed.
      </p>
    ),
  },
  {
    id: "payments-and-booking-agreements",
    heading: "Payments and Booking Agreements",
    body: (
      <p>
        We do not take payments through this website. The amounts, schedule and methods of payment for a booking, and what
        happens to payments if plans change, are set out in your written quotation or booking agreement.
      </p>
    ),
  },
  {
    id: "cancellation-and-rescheduling",
    heading: "Cancellation and Rescheduling",
    body: (
      <p>
        Cancellation and rescheduling are governed by your booking agreement. If your plans change, please tell us as early as
        possible. A new date depends on our availability. This website does not set any cancellation charge or refund.
      </p>
    ),
  },
  {
    id: "intellectual-property-and-copyright",
    heading: "Intellectual Property and Copyright",
    body: (
      <>
        {/* REVIEW: confirm ownership of all published work and brand assets, including any by associate photographers. */}
        <p>
          The photographs, films, text, design, logo, TK monogram and the name {site.name} on this website, and all other
          content on it, are owned by or licensed to {site.name}. They are protected by the Copyright Act, 1957 and other
          applicable intellectual property laws.
        </p>
        <p>
          Using this website does not give you any licence to use this content, except as these terms expressly allow. Any rights
          a client receives in their own photographs and films are set out in their booking agreement.
        </p>
      </>
    ),
  },
  {
    id: "photography-and-film-portfolio-usage",
    heading: "Photography and Film Portfolio Usage",
    body: (
      <>
        {/* REVIEW: once the studio confirms permission is on record for every identifiable person shown, a statement
            to that effect may be added here (see docs/LEGAL-REVIEW.md). */}
        <p>
          The photographs and films on this website show examples of our work. Publishing a photograph or film here does not
          give anyone else the right to use it.
        </p>
        <p>
          If you appear in our portfolio and would like a photograph or film reviewed or removed, please{" "}
          <a href="#contact-information">contact us</a>.
        </p>
      </>
    ),
  },
  {
    id: "client-content-and-permissions",
    heading: "Client Content and Permissions",
    body: (
      <p>
        If you send us photographs, reference images, music, guest details or other material, you confirm that you are entitled
        to share it with us. You keep any rights you have in it. We use it only to respond to your enquiry and to provide the
        services you book, unless you agree otherwise.
      </p>
    ),
  },
  {
    id: "unauthorized-content-usage",
    heading: "Unauthorized Content Usage",
    body: (
      <>
        <p>
          You are welcome to view this website and share links to its pages. Without our prior written permission, you may not:
        </p>
        <ul>
          <li>copy, download, reproduce, publish, distribute or sell our photographs, films or other content;</li>
          <li>use our work in advertising, in another portfolio or on social media as if it were your own;</li>
          <li>edit, crop or filter our work, or remove any credit, watermark or copyright notice;</li>
          <li>use our work or website content to train, test or prompt artificial intelligence or machine-learning systems;</li>
          <li>collect content from the website with automated tools, or display it within another website.</li>
        </ul>
        <p>
          This does not limit any rights a client has under their booking agreement. We may take any action available to us
          under law against unauthorised use.
        </p>
      </>
    ),
  },
  {
    id: "third-party-websites-and-links",
    heading: "Third-Party Websites and Links",
    body: (
      <p>
        This website links to services and websites run by others, such as WhatsApp. We do not control them and are not
        responsible for their content, availability or practices. Their own terms apply when you use them.
      </p>
    ),
  },
  {
    id: "website-availability",
    heading: "Website Availability",
    body: (
      <p>
        We aim to keep the website available and accurate, but we do not guarantee that it will always be available,
        uninterrupted or free of errors. We may change, suspend or withdraw any part of it. Colours and detail in photographs
        and films may look different from screen to screen.
      </p>
    ),
  },
  {
    id: "limitations-of-liability",
    heading: "Limitations of Liability",
    body: (
      <>
        {/* REVIEW: legal approval required. */}
        <p>
          The website and its content are provided for general information. To the fullest extent permitted by law, we are not
          liable for any loss or damage arising from your use of the website or your reliance on its content, or from any
          period when it is unavailable.
        </p>
        <p>
          Nothing in these terms excludes or limits any liability that cannot be excluded or limited under applicable law. Our
          responsibilities for services you book are set out in your booking agreement.
        </p>
      </>
    ),
  },
  {
    id: "applicable-law-and-jurisdiction",
    heading: "Applicable Law and Jurisdiction",
    body: (
      <>
        {/* REVIEW: the studio may wish to name specific courts (for example in Kollam, Kerala) — legal approval required. */}
        <p>
          These terms are governed by the laws of India. Subject to any dispute-resolution terms in a booking agreement,
          disputes about this website are subject to the courts in India that have jurisdiction under Indian law.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-these-terms",
    heading: "Changes to These Terms",
    body: (
      <p>
        We may update these terms from time to time. The “Last updated” date at the top of this page shows when they last
        changed. The version shown here applies whenever you use the website.
      </p>
    ),
  },
  {
    id: "contact-information",
    heading: "Contact Information",
    body: (
      <>
        <p>For questions about these terms, please get in touch:</p>
        <StudioContact />
      </>
    ),
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      path={path}
      title={title}
      description={description}
      eyebrow="Terms & Conditions"
      heading={["The Terms", <em key="t">Behind the Frame.</em>]}
      intro="The terms for using this website, how enquiries and bookings work, and how our photographs and films are protected."
      updated={UPDATED}
      sections={sections}
    />
  );
}
