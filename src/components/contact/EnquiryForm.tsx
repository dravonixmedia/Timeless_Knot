"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { celebrationTypes, emptyEnquiry, formatEnquiryMessage, validateEnquiry, type Enquiry, type EnquiryErrors } from "@/lib/enquiry";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { Arrow } from "@/components/ui/Links";

/**
 * Contact form that sends enquiries through WhatsApp.
 *
 * On submit the fields are validated, then the studio's WhatsApp chat — the
 * same number as the floating WhatsApp button — opens with the enquiry written
 * out (the app on phones, WhatsApp Web on desktop). Nothing is sent until the
 * visitor presses Send in WhatsApp, so the form never claims the enquiry has
 * been delivered: it says WhatsApp is ready, keeps the details, and offers the
 * link again in case WhatsApp did not open.
 */
export function EnquiryForm({ whatsappNumber }: { whatsappNumber: string | null }) {
  const [values, setValues] = useState<Enquiry>(emptyEnquiry);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Enquiry, boolean>>>({});
  /** The WhatsApp link last opened for this enquiry — shown again so it can be reopened. */
  const [handoff, setHandoff] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as keyof Enquiry;
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    // Edited after WhatsApp opened: the earlier link no longer matches the form.
    setHandoff(null);
    if (touched[name]) setErrors(validateEnquiry(next));
  };

  const blur = (name: keyof Enquiry) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validateEnquiry(values));
  };

  const focusStatus = () => requestAnimationFrame(() => statusRef.current?.focus());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!whatsappNumber) return;

    const found = validateEnquiry(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      setHandoff(null);
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    // Opened directly in the submit handler so browsers treat it as the
    // visitor's own action. A new tab keeps this page (and the details) open;
    // where a new tab is blocked, this tab goes to WhatsApp instead.
    const url = whatsappChatUrl(whatsappNumber, formatEnquiryMessage(values));
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    else window.location.assign(url);
    setHandoff(url);
    focusStatus();
  }

  const field = (name: keyof Enquiry) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: update,
    onBlur: () => blur(name),
    "aria-invalid": touched[name] && errors[name] ? true : undefined,
    "aria-describedby": touched[name] && errors[name] ? `${uid}-${name}-error` : undefined,
    className: "field",
  });

  const error = (name: keyof Enquiry) =>
    touched[name] && errors[name] ? (
      <p id={`${uid}-${name}-error`} className="mt-2 text-[0.8rem] text-error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} noValidate onSubmit={submit} aria-describedby={`${uid}-how`}>

      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        <Field label="Full name" htmlFor={`${uid}-name`} required>
          <input {...field("name")} type="text" autoComplete="name" required />
          {error("name")}
        </Field>
        <Field label="Email address" htmlFor={`${uid}-email`} required>
          <input {...field("email")} type="email" autoComplete="email" inputMode="email" required />
          {error("email")}
        </Field>
        <Field label="Phone number" htmlFor={`${uid}-phone`}>
          <input {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" />
          {error("phone")}
        </Field>
        <Field label="Wedding date" htmlFor={`${uid}-date`}>
          <input {...field("date")} type="date" />
          {error("date")}
        </Field>
        <Field label="Wedding location" htmlFor={`${uid}-location`}>
          <input {...field("location")} type="text" autoComplete="off" placeholder="City, venue or ‘still dreaming’" />
          {error("location")}
        </Field>
        <Field label="Type of celebration" htmlFor={`${uid}-celebration`}>
          <div className="relative">
            <select {...field("celebration")} className="field pr-8">
              <option value="">Please choose</option>
              {celebrationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 12 8" className="pointer-events-none absolute right-1 top-1/2 h-2 w-3 -translate-y-1/2" fill="none" stroke="currentColor">
              <path d="M1 1l5 5 5-5" />
            </svg>
          </div>
          {error("celebration")}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Your story / message" htmlFor={`${uid}-message`} required>
            <textarea {...field("message")} rows={5} className="field resize-y" placeholder="Tell us about the two of you and the celebration you imagine." />
            {error("message")}
          </Field>
        </div>
      </div>

      <div className="mt-14 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[34ch] space-y-2 text-[0.8rem] text-muted">
          <p>
            Fields marked <span aria-hidden="true">*</span>
            <span className="sr-only">with an asterisk</span> are required.
          </p>
          <p id={`${uid}-how`}>
            {whatsappNumber
              ? "Your enquiry opens in WhatsApp, ready for you to send to our studio."
              : "Enquiries are sent through WhatsApp, which is not available on this page at the moment."}
          </p>
        </div>
        <button
          type="submit"
          disabled={!whatsappNumber}
          className="group meta inline-flex min-h-12 items-center gap-4 bg-forest px-8 py-4 text-[0.7rem] tracking-[0.24em] text-ivory transition-colors duration-500 hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>Send Enquiry via WhatsApp</span>
          <span className="sr-only">(opens WhatsApp)</span>
          <Arrow />
        </button>
      </div>

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {handoff && (
          <div className="mt-8 border-l border-olive/60 pl-5 text-[0.9rem] text-charcoal">
            <p>
              <strong className="font-medium">Almost there — your enquiry is ready in WhatsApp.</strong> It has not been
              sent yet: please check it and press <strong className="font-medium">Send</strong> in WhatsApp to deliver it to us.
            </p>
            <p className="mt-3 text-muted">
              WhatsApp didn’t open?{" "}
              <a href={handoff} target="_blank" rel="noopener noreferrer" className="link-draw text-charcoal">
                Open WhatsApp with your enquiry
              </a>
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, htmlFor, required, children }: { label: string; htmlFor: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="meta block text-[0.62rem] text-muted">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}
