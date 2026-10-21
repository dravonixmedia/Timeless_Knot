"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { celebrationTypes, emptyEnquiry, enquiryLabels, formatEnquiryMessage, validateEnquiry, type Enquiry, type EnquiryErrors } from "@/lib/enquiry";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { Arrow } from "@/components/ui/Links";
import { CelebrationSelect } from "./CelebrationSelect";
import { EnquiryThankYou } from "./EnquiryThankYou";

/**
 * Contact form that sends enquiries through WhatsApp.
 *
 * On submit the fields are validated, then the studio's WhatsApp chat — the
 * same number as the floating WhatsApp button — opens with the enquiry written
 * out (the app on phones, WhatsApp Web on desktop). Nothing is sent until the
 * visitor presses Send in WhatsApp, so the form never claims the enquiry has
 * been delivered: a thank-you (EnquiryThankYou) asks them to send it there,
 * offers the same prefilled link again, and can return to an empty form.
 */
export function EnquiryForm({ whatsappNumber }: { whatsappNumber: string | null }) {
  const [values, setValues] = useState<Enquiry>(emptyEnquiry);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Enquiry, boolean>>>({});
  /** The WhatsApp link opened for this enquiry; while set, the thank-you replaces the form. */
  const [handoff, setHandoff] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setField(event.target.name as keyof Enquiry, event.target.value);

  const setField = (name: keyof Enquiry, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name]) setErrors(validateEnquiry(next));
  };

  const blur = (name: keyof Enquiry) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validateEnquiry(values));
  };


  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!whatsappNumber) return;

    const found = validateEnquiry(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
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
  }

  /** "Send Another Enquiry": an empty form again, ready to type into. */
  const reset = () => {
    setValues(emptyEnquiry);
    setErrors({});
    setTouched({});
    setHandoff(null);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[name="name"]')?.focus());
  };

  if (handoff) return <EnquiryThankYou whatsappUrl={handoff} onReset={reset} />;

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
        <Field label={enquiryLabels.name} htmlFor={`${uid}-name`} required>
          <input {...field("name")} type="text" autoComplete="name" required />
          {error("name")}
        </Field>
        <Field label={enquiryLabels.email} htmlFor={`${uid}-email`} required>
          <input {...field("email")} type="email" autoComplete="email" inputMode="email" required />
          {error("email")}
        </Field>
        <Field label={enquiryLabels.phone} htmlFor={`${uid}-phone`}>
          <input {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" />
          {error("phone")}
        </Field>
        <Field label={enquiryLabels.date} htmlFor={`${uid}-date`}>
          <input {...field("date")} type="date" />
          {error("date")}
        </Field>
        <Field label={enquiryLabels.location} htmlFor={`${uid}-location`}>
          <input {...field("location")} type="text" autoComplete="off" placeholder="City, venue or ‘still dreaming’" />
          {error("location")}
        </Field>
        <Field label={enquiryLabels.celebration} htmlFor={`${uid}-celebration`} labelId={`${uid}-celebration-label`}>
          <CelebrationSelect
            id={`${uid}-celebration`}
            labelId={`${uid}-celebration-label`}
            name="celebration"
            value={values.celebration}
            options={celebrationTypes}
            placeholder="Select your celebration"
            onChange={(value) => setField("celebration", value)}
            onBlur={() => blur("celebration")}
            invalid={Boolean(touched.celebration && errors.celebration)}
            describedBy={touched.celebration && errors.celebration ? `${uid}-celebration-error` : undefined}
          />
          {error("celebration")}
        </Field>
        <div className="sm:col-span-2">
          <Field label={enquiryLabels.message} htmlFor={`${uid}-message`} required>
            <textarea {...field("message")} rows={5} className="field resize-y" placeholder="Tell us about yourselves and the celebration or shoot you have in mind." />
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

    </form>
  );
}

function Field({
  label,
  htmlFor,
  labelId,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Set when the control is named by aria-labelledby (the custom dropdown). */
  labelId?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label id={labelId} htmlFor={htmlFor} className="meta block text-[0.62rem] text-muted">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}
