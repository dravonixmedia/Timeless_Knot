/**
 * Enquiry model, validation and the WhatsApp message the contact form
 * prepares. Enquiries are sent through WhatsApp only: the form opens the
 * studio's WhatsApp chat with this message filled in, and the visitor presses
 * Send there. Nothing is stored, emailed or sent anywhere else.
 *
 * No imports, so it can be unit-tested directly with Node.
 */

/** The "Type of celebration" choices, in display order (the field is optional). */
export const celebrationTypes = [
  "Wedding",
  "Engagement",
  "Pre-Wedding / Couple Shoot",
  "Intimate Wedding / Elopement",
  "Other Enquiry",
] as const;

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

/**
 * Shown once WhatsApp has opened with the enquiry. A wa.me link cannot tell
 * whether the visitor pressed Send, so this thanks them and asks them to send
 * it — it never says the enquiry was delivered or received.
 */
export const enquiryThankYou = {
  heading: "Thank You for Sharing Your Story.",
  subheading: "Every beautiful story begins with a conversation.",
  message: "Your enquiry is ready in WhatsApp. Please tap Send there to share it with us.",
  closing: "We look forward to hearing your story.",
  signature: "— Timeless Knot",
  continueLabel: "Continue to WhatsApp",
  resetLabel: "Send Another Enquiry",
} as const;

/** "2027-02-14" → "14 February 2027" (the date as chosen, independent of time zone). */
export function formatEnquiryDate(iso: string): string {
  if (!DATE.test(iso)) return iso;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** One line: surrounding space trimmed, inner runs of whitespace (including line breaks) collapsed. */
const line = (value: string) => value.replace(/\s+/g, " ").trim();

/**
 * The enquiry as a WhatsApp message to the studio: a short greeting, every
 * completed field on its own labelled line (labels in WhatsApp *bold*), then
 * the visitor's story with its paragraphs kept. Empty optional fields are left
 * out rather than shown blank.
 */
export function formatEnquiryMessage(input: Enquiry): string {
  const details: [string, string][] = [
    ["Name", line(input.name)],
    ["Email", line(input.email)],
    ["Phone", line(input.phone)],
    ["Wedding date", input.date ? formatEnquiryDate(input.date.trim()) : ""],
    ["Wedding location", line(input.location)],
    ["Type of celebration", line(input.celebration)],
  ];
  const story = input.message
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return [
    "Hello Timeless Knot,",
    "",
    "I would like to enquire about your wedding photography and cinematography.",
    "",
    ...details.filter(([, value]) => value).map(([label, value]) => `*${label}:* ${value}`),
    ...(story ? ["", "*Our story:*", story] : []),
    "",
    "— Sent from the enquiry form on the Timeless Knot website",
  ].join("\n");
}
