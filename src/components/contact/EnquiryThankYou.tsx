"use client";

import { useEffect, useRef } from "react";
import { enquiryThankYou as copy } from "@/lib/enquiry";
import { Arrow } from "@/components/ui/Links";

/**
 * Replaces the contact form once WhatsApp has opened with the visitor's
 * enquiry. It thanks them and asks them to press Send in WhatsApp — a wa.me
 * link cannot confirm delivery, so nothing here says the enquiry was received.
 * "Continue to WhatsApp" reopens the same prefilled message; "Send Another
 * Enquiry" returns to an empty form.
 *
 * Focus moves to the heading so screen readers announce the change; the card
 * and its lines settle in with the site's fade-up (none with reduced motion).
 */
export function EnquiryThankYou({ whatsappUrl, onReset }: { whatsappUrl: string; onReset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: false }), []);
  const step = (i: number) => ({ className: "intro-fade", style: { ["--delay" as string]: `${0.1 + i * 0.12}s` } });

  return (
    <section
      aria-labelledby="enquiry-thank-you-title"
      className="intro-fade border border-charcoal/10 bg-ivory px-7 py-14 sm:px-12 sm:py-16"
      style={{ ["--delay" as string]: "0s" }}
    >
      <HeartLine className="heart-draw h-9 w-9 text-olive" />

      <h2 id="enquiry-thank-you-title" ref={heading} tabIndex={-1} className="display-md mt-10 max-w-[16ch] outline-none">
        <span {...step(0)}>{copy.heading}</span>
      </h2>
      <p {...step(1)} className={`${step(1).className} lede mt-6 max-w-[34ch] italic text-muted`}>
        {copy.subheading}
      </p>

      <span aria-hidden="true" {...step(2)} className={`${step(2).className} mt-10 block h-px w-14 bg-charcoal/20`} />

      <p {...step(3)} className={`${step(3).className} body-lg mt-10 max-w-[38ch] text-charcoal`}>
        {copy.message}
      </p>
      <p {...step(4)} className={`${step(4).className} mt-6 text-muted`}>
        {copy.closing}
      </p>
      <p {...step(5)} className={`${step(5).className} mt-3 font-serif text-[1.35rem] italic leading-snug text-charcoal`}>
        {copy.signature}
      </p>

      <div {...step(6)} className={`${step(6).className} mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10`}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group meta inline-flex min-h-12 max-w-full items-center gap-4 bg-forest px-6 py-4 text-[0.7rem] tracking-[0.2em] text-ivory transition-colors duration-500 hover:bg-charcoal sm:px-8 sm:tracking-[0.24em]"
        >
          <span>{copy.continueLabel}</span>
          <span className="sr-only">(opens WhatsApp with your enquiry)</span>
          <Arrow />
        </a>
        <button type="button" onClick={onReset} className="meta inline-flex min-h-11 items-center text-[0.68rem] tracking-[0.22em] text-charcoal">
          <span className="link-draw">{copy.resetLabel}</span>
        </button>
      </div>
    </section>
  );
}

/** A single hairline heart that draws itself in (see .heart-draw in globals.css). */
function HeartLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path pathLength={1} d="M16 27.5C10.2 23.4 3.5 18.3 3.5 11.6 3.5 7.9 6.3 5 9.8 5c2.6 0 4.8 1.6 6.2 3.9C17.4 6.6 19.6 5 22.2 5c3.5 0 6.3 2.9 6.3 6.6 0 6.7-6.7 11.8-12.5 15.9Z" />
    </svg>
  );
}
