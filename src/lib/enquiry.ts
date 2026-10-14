/**
 * Enquiry model and validation, shared by the contact form (client) and the
 * /api/enquiry route handler (server) so both enforce identical rules.
 */

export const celebrationTypes = ["Wedding", "Elopement", "Intimate celebration", "Something else"] as const;

export type Enquiry = {
  name: string;
  email: string;
  phone: string;
  date: string;
  location: string;
  celebration: string;
  message: string;
};

export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

export type EnquiryResult =
  | { ok: true }
  | { ok: false; reason: "demo" | "invalid" | "delivery"; errors?: EnquiryErrors };

export const emptyEnquiry: Enquiry = {
  name: "",
  email: "",
  phone: "",
  date: "",
  location: "",
  celebration: "",
  message: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\-\s\d]{7,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateEnquiry(input: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (input.name.trim().length < 2) errors.name = "Please tell us your name.";
  if (!EMAIL.test(input.email.trim())) errors.email = "Please enter a valid email address, e.g. name@example.com.";
  if (input.phone.trim() && !PHONE.test(input.phone.trim()))
    errors.phone = "Please use digits, spaces and an optional leading +.";
  if (input.date && !DATE.test(input.date)) errors.date = "Please choose a date using the date picker.";
  if (input.celebration && !(celebrationTypes as readonly string[]).includes(input.celebration))
    errors.celebration = "Please choose one of the options.";
  if (input.message.trim().length < 20)
    errors.message = "Please share a little more about your story (at least 20 characters).";
  if (input.message.length > 5000) errors.message = "Please keep your message under 5,000 characters.";
  return errors;
}

/** Coerces unknown JSON into an Enquiry, trimming and bounding every field. */
export function parseEnquiry(raw: unknown): Enquiry {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const field = (key: keyof Enquiry, max: number) =>
    typeof source[key] === "string" ? (source[key] as string).slice(0, max).trim() : "";
  return {
    name: field("name", 120),
    email: field("email", 200),
    phone: field("phone", 40),
    date: field("date", 10),
    location: field("location", 200),
    celebration: field("celebration", 60),
    message: field("message", 5001),
  };
}
