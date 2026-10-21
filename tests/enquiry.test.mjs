/**
 * Tests for WhatsApp enquiries from the contact form: validation
 * (src/lib/enquiry.ts), the destination number (src/lib/whatsapp.ts — the same
 * one as the floating WhatsApp button), the message and its URL encoding.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { celebrationTypes, emptyEnquiry, enquiryLabels, enquiryThankYou, formatEnquiryDate, formatEnquiryMessage, validateEnquiry } from "../src/lib/enquiry.ts";
import { resolveWhatsappUrl, whatsappChatUrl, whatsappNumber } from "../src/lib/whatsapp.ts";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
/** The studio link committed in src/config/site.ts — what the floating button uses. */
const CONFIGURED = /^const WHATSAPP_URL: string \| null = "([^"]+)";/m.exec(read("src/config/site.ts"))[1];

const valid = {
  ...emptyEnquiry,
  name: "Asha Nair",
  email: "asha@example.com",
  message: "We are planning an intimate wedding by the backwaters and would love you to film it.",
};

test("required fields: name, a valid email and a story of at least 20 characters", () => {
  assert.deepEqual(validateEnquiry(valid), {});
  const empty = validateEnquiry(emptyEnquiry);
  assert.deepEqual(Object.keys(empty).sort(), ["email", "message", "name"]);
  assert.match(empty.name, /your name/);
  assert.match(validateEnquiry({ ...valid, email: "asha@example" }).email, /valid email/);
  assert.match(validateEnquiry({ ...valid, message: "Hello there" }).message, /at least 20/);
  assert.match(validateEnquiry({ ...valid, message: "x".repeat(5001) }).message, /under 5,000/);
});

test("optional fields are checked only when filled in", () => {
  assert.deepEqual(validateEnquiry({ ...valid, phone: "+91 70346 71830", date: "2027-02-14", celebration: "Wedding" }), {});
  assert.ok(validateEnquiry({ ...valid, phone: "call me" }).phone);
  assert.ok(validateEnquiry({ ...valid, date: "14/02/2027" }).date);
  assert.ok(validateEnquiry({ ...valid, celebration: "Birthday" }).celebration);
});

test("the celebration choices, in order; the field stays optional", () => {
  assert.deepEqual([...celebrationTypes], ["Wedding", "Engagement", "Pre-Wedding / Couple Shoot", "Intimate Wedding / Elopement", "Other Enquiry"]);
  assert.deepEqual(validateEnquiry({ ...valid, celebration: "" }), {}, "no choice is fine");
  for (const type of celebrationTypes) assert.deepEqual(validateEnquiry({ ...valid, celebration: type }), {}, type);
  for (const old of ["Elopement", "Intimate celebration", "Something else", "Select your celebration"]) {
    assert.ok(validateEnquiry({ ...valid, celebration: old }).celebration, `${old} is not a choice`);
  }
  // The form offers exactly these, with the agreed placeholder.
  const form = read("src/components/contact/EnquiryForm.tsx");
  assert.match(form, /options=\{celebrationTypes\}/);
  assert.match(form, /placeholder="Select your celebration"/);
});

test("each celebration choice appears verbatim in the WhatsApp message and survives URL encoding", () => {
  for (const type of celebrationTypes) {
    const message = formatEnquiryMessage({ ...valid, celebration: type });
    assert.ok(message.includes(`*Type of celebration:* ${type}\n`), type);
    assert.equal(new URL(whatsappChatUrl("917034671830", message)).searchParams.get("text"), message, type);
  }
  assert.ok(whatsappChatUrl("917034671830", formatEnquiryMessage({ ...valid, celebration: "Pre-Wedding / Couple Shoot" })).includes("Pre-Wedding%20%2F%20Couple%20Shoot"));
  assert.ok(!formatEnquiryMessage({ ...valid, celebration: "" }).includes("Type of celebration"), "no choice → no line");
});

test("the form uses the exact number of the floating WhatsApp button", () => {
  const buttonLink = resolveWhatsappUrl(CONFIGURED); // what WhatsAppButton links to
  assert.ok(buttonLink?.startsWith("https://wa.me/917034671830?"), buttonLink);
  assert.equal(whatsappNumber(CONFIGURED), "917034671830");
  assert.equal(whatsappNumber(buttonLink), "917034671830");
  // The contact page hands the form that same configured link's number.
  assert.match(read("src/app/contact/page.tsx"), /<EnquiryForm whatsappNumber=\{whatsappNumber\(whatsapp\)\} \/>/);
  assert.match(read("src/app/contact/page.tsx"), /const \{ email, phone, whatsapp \} = site\.contact;/);
});

test("no number is derived from a missing, unsafe or short-code link", () => {
  for (const link of [null, undefined, "", "https://example.com/917034671830", "http://wa.me/917034671830", "https://wa.me/message/ABC123XYZ"]) {
    assert.equal(whatsappNumber(link), null, String(link));
  }
});

test("the message is professional and lists every completed field, leaving empty ones out", () => {
  const full = formatEnquiryMessage({
    name: "  Asha   Nair ",
    email: "asha@example.com",
    phone: "+91 70346 71830",
    date: "2027-02-14",
    location: "Kollam,\nKerala",
    celebration: "Wedding",
    message: "We met in college.\r\n\r\n\r\n\r\nWe would love a quiet film.   ",
  });
  assert.equal(
    full,
    [
      "Hello Timeless Knot,",
      "",
      "I would like to enquire about your photography and cinematography services.",
      "",
      "*Name:* Asha Nair",
      "*Email:* asha@example.com",
      "*Phone:* +91 70346 71830",
      "*Event / Shoot Date:* 14 February 2027",
      "*Event / Shoot Location:* Kollam, Kerala",
      "*Type of celebration:* Wedding",
      "",
      "*Our story:*",
      "We met in college.",
      "",
      "We would love a quiet film.",
      "",
      "— Sent from the enquiry form on the Timeless Knot website",
    ].join("\n"),
  );
  const minimal = formatEnquiryMessage(valid);
  assert.ok(!/Phone|Event \/ Shoot|Type of celebration/.test(minimal), "empty optional fields are omitted");
  assert.ok(!/undefined|null/.test(minimal));
});

test("date and location are worded for every kind of shoot, in the form and the WhatsApp message alike", () => {
  assert.equal(enquiryLabels.date, "Event / Shoot Date");
  assert.equal(enquiryLabels.location, "Event / Shoot Location");
  const form = read("src/components/contact/EnquiryForm.tsx");
  for (const key of Object.keys(enquiryLabels)) assert.match(form, new RegExp(`label=\\{enquiryLabels\\.${key}\\}`), key);
  // Both stay optional: no required marker, and an enquiry without them is valid.
  assert.match(form, /label=\{enquiryLabels\.date\} htmlFor=\{`\$\{uid\}-date`\}>/);
  assert.match(form, /label=\{enquiryLabels\.location\} htmlFor=\{`\$\{uid\}-location`\}>/);
  assert.deepEqual(validateEnquiry({ ...valid, date: "", location: "" }), {});
  const message = formatEnquiryMessage({ ...valid, date: "2027-02-14", location: "Munnar" });
  assert.ok(message.includes(`*${enquiryLabels.date}:* 14 February 2027\n*${enquiryLabels.location}:* Munnar\n`));
  for (const text of [form, message, read("src/lib/enquiry.ts")]) assert.ok(!/wedding (date|location)/i.test(text), "no wedding-only wording");
  assert.ok(!/wedding photography/i.test(message), "the greeting covers every service");
});

test("dates read naturally, whatever the visitor's time zone", () => {
  assert.equal(formatEnquiryDate("2027-02-14"), "14 February 2027");
  assert.equal(formatEnquiryDate("2026-12-31"), "31 December 2026");
  assert.equal(formatEnquiryDate("not-a-date"), "not-a-date");
});

test("the WhatsApp link encodes the whole message so it arrives exactly as written", () => {
  const tricky = formatEnquiryMessage({
    ...valid,
    name: "Rahul & Meera",
    location: "Café #1, 50% off? a+b=c / Kochi",
    message: "Line one 💍 with “quotes” and ‘apostrophes’.\nLine two: ?text=evil&phone=123 — done.",
  });
  const url = whatsappChatUrl("917034671830", tricky);
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, "https://wa.me/917034671830");
  assert.deepEqual([...parsed.searchParams.keys()], ["text"], "user input cannot add parameters");
  assert.equal(parsed.searchParams.get("text"), tricky, "round-trips exactly");
  assert.ok(!/[\s&#+?💍]/u.test(url.split("?text=")[1]), "spaces, &, #, +, ? and emoji are percent-encoded");
  assert.ok(url.includes("%0A"), "line breaks are kept");
});

test("the thank-you uses the agreed copy and never claims the enquiry was delivered", () => {
  assert.deepEqual(enquiryThankYou, {
    heading: "Thank You for Sharing Your Story.",
    subheading: "Every beautiful story begins with a conversation.",
    message: "Your enquiry is ready in WhatsApp. Please tap Send there to share it with us.",
    closing: "We look forward to hearing your story.",
    signature: "— Timeless Knot",
    continueLabel: "Continue to WhatsApp",
    resetLabel: "Send Another Enquiry",
  });
  const all = Object.values(enquiryThankYou).join(" ").toLowerCase();
  for (const claim of ["received", "delivered", "has been sent", "was sent", "we got", "we'll be in touch", "successfully"]) {
    assert.ok(!all.includes(claim), `no "${claim}"`);
  }
});

test("the thank-you replaces the form only after WhatsApp opens, reopens the same link and can reset", () => {
  const form = read("src/components/contact/EnquiryForm.tsx");
  const thanks = read("src/components/contact/EnquiryThankYou.tsx");
  // Shown with the very link that was opened (built from the formatted message).
  assert.match(form, /const url = whatsappChatUrl\(whatsappNumber, formatEnquiryMessage\(values\)\);[\s\S]*setHandoff\(url\);/);
  assert.match(form, /if \(handoff\) return <EnquiryThankYou whatsappUrl=\{handoff\} onReset=\{reset\} \/>;/);
  // Validation still runs first: an invalid form returns before anything opens.
  assert.ok(form.indexOf("if (firstInvalid)") < form.indexOf("window.open(url"), "validation precedes opening WhatsApp");
  assert.match(thanks, /href=\{whatsappUrl\}[\s\S]*target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(thanks, /onClick=\{onReset\}/);
  for (const key of Object.keys(enquiryThankYou)) assert.match(thanks, new RegExp(`copy\\.${key}`), key);
});
