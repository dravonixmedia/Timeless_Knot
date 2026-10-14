"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  celebrationTypes,
  emptyEnquiry,
  validateEnquiry,
  type Enquiry,
  type EnquiryErrors,
  type EnquiryResult,
} from "@/lib/enquiry";
import { Arrow } from "@/components/ui/Links";

type Status = "idle" | "submitting" | "sent" | "demo" | "failed";

/**
 * Contact form with honest states: "sent" is shown only after the server
 * confirms delivery. In demonstration mode nothing is transmitted and the
 * visitor is told so plainly.
 */
export function EnquiryForm({ live }: { live: boolean }) {
  const [values, setValues] = useState<Enquiry>(emptyEnquiry);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Enquiry, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as keyof Enquiry;
    const next = { ...values, [name]: event.target.value };
    setValues(next);
    if (touched[name]) setErrors(validateEnquiry(next));
  };

  const blur = (name: keyof Enquiry) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validateEnquiry(values));
  };

  const focusStatus = () => requestAnimationFrame(() => statusRef.current?.focus());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const found = validateEnquiry(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    const honeypot = new FormData(event.currentTarget).get("company");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: honeypot }),
      });
      const result = (await res.json().catch(() => ({ ok: false, reason: "delivery" }))) as EnquiryResult;
      if (res.ok && result.ok) {
        setStatus("sent");
        setValues(emptyEnquiry);
        setTouched({});
      } else if (!result.ok && result.reason === "demo") {
        setStatus("demo");
      } else if (!result.ok && result.reason === "invalid" && result.errors) {
        setErrors(result.errors);
        setStatus("idle");
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    }
    focusStatus();
  }

  if (status === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="border-t border-charcoal/15 py-16 outline-none">
        <p className="display-md italic">Thank you.</p>
        <p className="body-lg mt-6 max-w-[42ch] text-muted">
          Your story has reached us. We will read it carefully and be in touch soon.
        </p>
      </div>
    );
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
    <form ref={formRef} noValidate onSubmit={submit} aria-describedby={!live ? `${uid}-demo` : undefined}>
      {!live && (
        <p id={`${uid}-demo`} className="mb-12 border-l border-olive/60 bg-pale-sage/60 px-5 py-4 text-[0.88rem] text-charcoal">
          <strong className="font-medium">Demonstration mode.</strong> This form is not yet connected to the studio, so
          enquiries cannot be sent from this page at the moment.
        </p>
      )}

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

      {/* Honeypot — hidden from people and assistive technology */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="mt-14 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8rem] text-muted">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group meta inline-flex min-h-12 items-center gap-4 bg-forest px-8 py-4 text-[0.7rem] tracking-[0.24em] text-ivory transition-colors duration-500 hover:bg-charcoal disabled:cursor-wait disabled:opacity-70"
        >
          <span>{status === "submitting" ? "Sending…" : "Send your story"}</span>
          {status !== "submitting" && <Arrow />}
        </button>
      </div>

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {status === "demo" && (
          <p className="mt-8 border-l border-error/60 pl-5 text-[0.9rem] text-charcoal">
            Your message has <strong className="font-medium">not</strong> been sent — the enquiry service is not yet
            connected. Your details are still in the form.
          </p>
        )}
        {status === "failed" && (
          <p className="mt-8 border-l border-error/60 pl-5 text-[0.9rem] text-error">
            We couldn’t send your message just now. Please check your connection and try again in a moment.
          </p>
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
