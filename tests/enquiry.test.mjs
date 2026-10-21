/**
 * Tests for WhatsApp enquiries from the contact form: validation
 * (src/lib/enquiry.ts), the destination number (src/lib/whatsapp.ts — the same
 * one as the floating WhatsApp button), the message and its URL encoding.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyEnquiry, formatEnquiryDate, formatEnquiryMessage, validateEnquiry } from "../src/lib/enquiry.ts";
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
      "I would like to enquire about your wedding photography and cinematography.",
      "",
      "*Name:* Asha Nair",
      "*Email:* asha@example.com",
      "*Phone:* +91 70346 71830",
      "*Wedding date:* 14 February 2027",
      "*Wedding location:* Kollam, Kerala",
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
  assert.ok(!/Phone|Wedding date|Wedding location|Type of celebration/.test(minimal), "empty optional fields are omitted");
  assert.ok(!/undefined|null/.test(minimal));
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
