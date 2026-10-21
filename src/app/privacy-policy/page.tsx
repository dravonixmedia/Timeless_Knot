import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { StudioContact } from "@/components/legal/StudioContact";
import { pageMetadata } from "@/lib/seo";

const path = "/privacy-policy";
const title = "Privacy Policy | Timeless Knot";
const description =
  "Learn how Timeless Knot handles personal information, website privacy and photography enquiries through WhatsApp.";

export const metadata: Metadata = pageMetadata({ title, description, path });

/** Change whenever the policy text changes. */
const UPDATED = "2026-10-21";

/*
 * Every statement about the website describes what the code actually does
 * (checked against this repository):
 * - The enquiry form (components/contact/EnquiryForm.tsx, lib/enquiry.ts)
 *   validates in the browser and opens a wa.me link with the message as its
 *   `text` parameter. There is no form backend, database or email service.
 * - The site sets no cookies of its own and loads no analytics, advertising
 *   or social tracking scripts; fonts are self-hosted by next/font. Nothing is
 *   kept in browser storage.
 * - Hosting, images and delivery run on Cloudflare Workers, with Workers
 *   observability (request logs) enabled in wrangler.jsonc.
 *
 * REVIEW before launch — see docs/LEGAL-REVIEW.md. In particular: Cloudflare
 * dashboard features that can add cookies or analytics outside this code
 * (Web Analytics, Bot Fight Mode, Turnstile); a retention period for enquiry
 * conversations; a named privacy / grievance contact and email address; and
 * the wording on the Digital Personal Data Protection Act, 2023 and its Rules.
 */
const sections: LegalSection[] = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          {site.name} is a photography and cinematography studio based in {site.location.locality}, {site.location.region},{" "}
          {site.location.country}. This Privacy Policy explains how we handle personal information when you visit this website,
          prepare an enquiry with our contact form or talk to us on WhatsApp.
        </p>
        <p>
          In this policy, “{site.name}”, “we”, “us” and “our” refer to our studio, and “personal information” means
          information that identifies you or could reasonably be used to identify you.
        </p>
        <p>
          If you book our services, the photographs, films and details involved in that booking may also be covered by any
          agreement we make with you.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: (
      <>
        <h3>Information you choose to share</h3>
        <p>
          Our contact form asks for your name, email address and a message about your plans. You may also add a phone
          number, the event or shoot date and location, and the type of celebration. How these details reach us is explained in{" "}
          <a href="#contact-forms-and-whatsapp-enquiries">Contact Forms and WhatsApp Enquiries</a>.
        </p>
        <p>
          When you message us on WhatsApp, we receive what you send, together with the phone number and profile name your
          WhatsApp account shows us. You may also tell us about other people, such as your partner or family. Please share
          only what you are comfortable sharing and are entitled to share.
        </p>
        <h3>Information collected automatically</h3>
        <p>
          Like any website, when you visit, your browser sends technical information such as your IP address, browser and
          device type, the page or file requested, the page you came from and the date and time. Cloudflare, which hosts the
          website, processes this to deliver pages and keep the website secure, and it may be recorded in technical logs.
        </p>
        <p>
          We do not ask for sensitive information, such as bank or card details, passwords, health information or
          identity documents, through this website. Please do not include them in an enquiry.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-your-information",
    heading: "How We Use Your Information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>reply to your enquiry and discuss your plans, our availability and a quotation;</li>
          <li>plan and provide services you book with us;</li>
          <li>keep a record of our conversations with you;</li>
          <li>run the website, keep it secure and fix technical problems;</li>
          <li>meet our legal obligations and protect our legal rights.</li>
        </ul>
      </>
    ),
  },
  {
    id: "contact-forms-and-whatsapp-enquiries",
    heading: "Contact Forms and WhatsApp Enquiries",
    body: (
      <>
        <p>
          Our contact form does not send your enquiry to our servers, and the website does not store or email it. When you
          choose “Send Enquiry via WhatsApp”, your browser checks the details and writes them into a message. WhatsApp then
          opens with that message ready: the app on phones, or WhatsApp Web on a computer.
        </p>
        <p>
          <strong className="font-medium text-charcoal">Nothing reaches us until you press Send in WhatsApp.</strong> Before
          then you can change the message, delete it or simply close WhatsApp.
        </p>
        <p>
          The prepared message is passed to WhatsApp in the link that opens the chat. From that point it is handled by
          WhatsApp under its own{" "}
          <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          . Once you send it, your message and WhatsApp details are kept in our WhatsApp account and on the devices we use
          to run the studio.
        </p>
        <p>
          What you type stays on the page in your browser until you leave it or start a new enquiry; the website does not
          save it.
        </p>
      </>
    ),
  },
  {
    id: "cookies-and-website-analytics",
    heading: "Cookies and Website Analytics",
    body: (
      <>
        <p>
          This website does not set cookies of its own and does not use analytics, advertising or social-media tracking
          tools. Our fonts are served from this website rather than from a third-party font service.
        </p>
        {/* REVIEW: confirm in the Cloudflare dashboard which security features are on for the production domain. */}
        <p>
          Cloudflare may set strictly necessary cookies, or use similar technical measures, to recognise harmful traffic and
          protect the website. We do not use them to identify you or for advertising.
        </p>
        <p>
          If we introduce analytics or other cookies, we will update this policy first, and ask for your consent where the
          law requires it. You can block or delete cookies in your browser settings at any time.
        </p>
      </>
    ),
  },
  {
    id: "third-party-services",
    heading: "Third-Party Services",
    body: (
      <>
        <p>We rely on two providers that may process personal information:</p>
        <ul>
          <li>
            <strong className="font-medium text-charcoal">Cloudflare</strong> hosts the website and delivers its pages,
            photographs and films, and protects it from abuse. See the{" "}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
              Cloudflare privacy policy
            </a>
            .
          </li>
          <li>
            <strong className="font-medium text-charcoal">WhatsApp</strong> carries enquiries and our conversations with
            you. See the{" "}
            <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              WhatsApp privacy policy
            </a>
            .
          </li>
        </ul>
        {/* REVIEW: cross-border transfer wording under the DPDP Act. */}
        <p>These providers operate internationally, so information may be processed in countries outside India.</p>
      </>
    ),
  },
  {
    id: "information-sharing",
    heading: "Information Sharing",
    body: (
      <>
        <p>
          The website itself passes your details to no one except the providers described above: Cloudflare, which delivers
          the website, and WhatsApp, when you choose to open your enquiry there.
        </p>
        <p>
          We may disclose personal information where the law, a court or a government authority requires it, or with your
          agreement.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    heading: "Data Security",
    body: (
      <>
        <p>
          The website is served over an encrypted (HTTPS) connection, and enquiry details are not stored by the website. We
          take reasonable care to protect the personal information we hold.
        </p>
        <p>
          No website, app or method of storage is completely secure, so we cannot guarantee absolute security. If a breach
          affecting your personal information occurs, we will respond as applicable law requires.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    heading: "Data Retention",
    body: (
      <>
        <p>The contact form keeps nothing: the website does not retain the details you type into it.</p>
        {/* REVIEW: decide a retention period for enquiry conversations and booking records. */}
        <p>
          We keep enquiry conversations and booking information only for as long as we reasonably need them for the purposes
          in this policy, such as replying to you, providing a service you book and keeping business records, or for longer
          where the law requires it. After that, we delete them.
        </p>
        <p>
          Technical logs are kept by Cloudflare for limited periods under its own settings and policies. You can delete your
          own copy of a WhatsApp conversation at any time, and you can ask us to delete ours.
        </p>
      </>
    ),
  },
  {
    id: "your-privacy-rights",
    heading: "Your Privacy Rights",
    body: (
      <>
        {/* REVIEW: DPDP Act, 2023 and Digital Personal Data Protection Rules, 2025 — obligations commence in phases. */}
        <p>
          Subject to applicable Indian law, including the Digital Personal Data Protection Act, 2023 as its provisions come
          into force, you may ask us to:
        </p>
        <ul>
          <li>tell you what personal information we hold about you and how we use it;</li>
          <li>correct, complete or update it;</li>
          <li>delete it, unless the law requires us to keep it;</li>
          <li>stop using it where you have given consent, by withdrawing that consent;</li>
          <li>accept a person you nominate to exercise these rights if you die or become unable to do so;</li>
          <li>address a concern or complaint about how we have handled it.</li>
        </ul>
        <p>
          To make a request, contact us using the details in{" "}
          <a href="#contact-information">Contact Information</a>. We may need to confirm your identity first. We will reply
          within a reasonable time and within any period the law sets. If you are not satisfied with our response, you may be
          able to complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    heading: "Children’s Privacy",
    body: (
      <>
        <p>
          This website is intended for adults planning a celebration or shoot. It is not directed at children, and we do not
          knowingly collect personal information from anyone under 18 through it.
        </p>
        <p>
          If you are a parent or guardian and believe a child has sent us personal information, please contact us and we will
          delete it.
        </p>
      </>
    ),
  },
  {
    id: "external-website-links",
    heading: "External Website Links",
    body: (
      <p>
        This website links to other websites and services, such as WhatsApp and the studio that designed this website. We
        are not responsible for their content or privacy practices, so please read their own policies when you visit them.
      </p>
    ),
  },
  {
    id: "changes-to-this-privacy-policy",
    heading: "Changes to This Privacy Policy",
    body: (
      <p>
        We may update this policy when our practices, our website or the law change. The “Last updated” date at the top of
        this page shows when it last changed. Please check this page from time to time.
      </p>
    ),
  },
  {
    id: "contact-information",
    heading: "Contact Information",
    body: (
      <>
        {/* REVIEW: add a dedicated privacy / grievance contact (name and email) once confirmed. */}
        <p>
          For questions about this policy or a privacy request, message us on WhatsApp and mention “Privacy request”. You can
          also read our <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>.
        </p>
        <StudioContact />
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      path={path}
      title={title}
      description={description}
      eyebrow="Privacy Policy"
      heading={["Your Privacy,", <em key="r">Respected.</em>]}
      intro="How we handle personal information on this website, and how enquiries reach us through WhatsApp."
      updated={UPDATED}
      sections={sections}
    />
  );
}
