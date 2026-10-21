/**
 * Tests for the Privacy Policy and Terms & Conditions pages: their metadata,
 * the required sections, the footer links, and that the policy describes the
 * site's real behaviour (WhatsApp hand-off, no stored enquiries, no trackers)
 * without inventing business terms.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const privacy = read("src/app/privacy-policy/page.tsx");
const terms = read("src/app/terms-and-conditions/page.tsx");
const headings = (source) => [...source.matchAll(/heading: "([^"]+)"/g)].map((m) => m[1]);

test("each page has the agreed title, description and canonical path", () => {
  assert.match(privacy, /const path = "\/privacy-policy";/);
  assert.match(privacy, /const title = "Privacy Policy \| Timeless Knot";/);
  assert.match(privacy, /Learn how Timeless Knot handles personal information, website privacy and photography enquiries through WhatsApp\./);
  assert.match(terms, /const path = "\/terms-and-conditions";/);
  assert.match(terms, /const title = "Terms & Conditions \| Timeless Knot";/);
  assert.match(terms, /Read the website terms, enquiry information, intellectual property conditions and service-related policies for Timeless Knot\./);
  for (const page of [privacy, terms]) {
    assert.match(page, /pageMetadata\(\{ title, description, path \}\)/, "canonical comes from pageMetadata");
    assert.ok(!/noindex/.test(page), "indexable");
    assert.match(page, /const UPDATED = "\d{4}-\d{2}-\d{2}";/);
  }
});

test("the Privacy Policy has every required section, in order", () => {
  assert.deepEqual(headings(privacy), [
    "Introduction",
    "Information We Collect",
    "How We Use Your Information",
    "Contact Forms and WhatsApp Enquiries",
    "Cookies and Website Analytics",
    "Third-Party Services",
    "Information Sharing",
    "Data Security",
    "Data Retention",
    "Your Privacy Rights",
    "Children’s Privacy",
    "External Website Links",
    "Changes to This Privacy Policy",
    "Contact Information",
  ]);
});

test("the Terms & Conditions have every required section, in order", () => {
  assert.deepEqual(headings(terms), [
    "Introduction",
    "Acceptance of Terms",
    "Website Purpose",
    "Photography and Cinematography Services",
    "Enquiries and Availability",
    "Booking Confirmation",
    "Pricing and Quotations",
    "Payments and Booking Agreements",
    "Cancellation and Rescheduling",
    "Intellectual Property and Copyright",
    "Photography and Film Portfolio Usage",
    "Client Content and Permissions",
    "Unauthorized Content Usage",
    "Third-Party Websites and Links",
    "Website Availability",
    "Limitations of Liability",
    "Applicable Law and Jurisdiction",
    "Changes to These Terms",
    "Contact Information",
  ]);
});

test("the policy matches how enquiries really work: prepared in the browser, sent only from WhatsApp", () => {
  assert.match(privacy, /Nothing reaches us until you press Send in WhatsApp\./);
  assert.match(privacy, /does not send your enquiry to our servers, and the website does not store or email it/);
  // …which is true: the form has no backend and the site no tracking or storage.
  const form = read("src/components/contact/EnquiryForm.tsx");
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|action=/.test(form), "the form posts nowhere");
  const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(`${dir}/${n}`).isDirectory() ? files(`${dir}/${n}`) : [`${dir}/${n}`]));
  const src = new URL("../src", import.meta.url).pathname;
  for (const file of files(src).filter((f) => /\.(ts|tsx)$/.test(f))) {
    const code = readFileSync(file, "utf8");
    assert.ok(!/document\.cookie|localStorage|sessionStorage|googletagmanager|gtag\(|fbq\(/.test(code), `${file} sets no cookies or trackers`);
  }
});

test("no invented business terms, contacts or guarantees", () => {
  const both = `${privacy}\n${terms}`;
  for (const invented of [/\d+\s*%/, /₹|\bINR\b|\bRs\.?\s?\d/, /\b\d+\s*(days?|weeks?|months?|years?)\b/i, /@[a-z0-9-]+\.[a-z]{2,}/i, /Pvt\.? Ltd|LLP|Private Limited/, /guarantee (?!that it will always|absolute)/i]) {
    assert.ok(!invented.test(both), `nothing matching ${invented}`);
  }
  assert.ok(!/\+91|7034671830/.test(both), "the number comes from site config, not the page");
  assert.match(terms, /does not confirm a booking or reserve a date/);
  assert.match(terms, /These website terms do not replace that agreement/);
});

test("REVIEW notes stay in source comments and never reach the page", () => {
  for (const [name, page] of [["privacy", privacy], ["terms", terms]]) {
    assert.ok(page.includes("REVIEW"), `${name} keeps its review notes`);
    const rendered = page.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/REVIEW|TODO|\bTBC\b|lorem ipsum/.test(rendered), `${name}: no draft markers outside comments`);
  }
});

test("statements the studio has not confirmed are not published as commitments", () => {
  const both = `${privacy}\n${terms}`.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const unconfirmed of [/do not sell (your )?personal/i, /associate|collaborator|second shooter|editors?\b/i, /promptly/i, /Trade Marks Act/, /only where they have agreed/i, /are covered by the agreement/i]) {
    assert.ok(!unconfirmed.test(both), `nothing matching ${unconfirmed}`);
  }
});

test("canonical URLs come from the central site configuration, not a hard-coded domain", () => {
  for (const file of ["src/app/privacy-policy/page.tsx", "src/app/terms-and-conditions/page.tsx", "src/components/legal/LegalPage.tsx", "src/components/legal/StudioContact.tsx"]) {
    assert.ok(!/timelessknot\.|dravonix\.dev|https?:\/\/(?!www\.(whatsapp|cloudflare)\.com)/.test(read(file)), `${file} names no site origin`);
  }
});

test("the footer links to both pages, and they are in the sitemap", () => {
  const site = read("src/config/site.ts");
  assert.match(site, /\{ label: "Privacy Policy", href: "\/privacy-policy" \}/);
  assert.match(site, /\{ label: "Terms & Conditions", href: "\/terms-and-conditions" \}/);
  assert.match(read("src/components/layout/Footer.tsx"), /site\.legal\.map[\s\S]*<Link href=\{item\.href\}/);
  assert.match(read("src/app/sitemap.ts"), /"\/privacy-policy", "\/terms-and-conditions"/);
});
