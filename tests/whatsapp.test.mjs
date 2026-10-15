/** Tests for direct WhatsApp link validation (src/lib/whatsapp.ts). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveWhatsappUrl, whatsappMessage } from "../src/lib/whatsapp.ts";

const withDefault = (n) => `https://wa.me/${n}?text=${encodeURIComponent(whatsappMessage)}`;

test("accepts direct wa.me number links and adds the studio message", () => {
  assert.equal(resolveWhatsappUrl("https://wa.me/919876543210"), withDefault("919876543210"));
  assert.equal(resolveWhatsappUrl("  https://wa.me/919876543210/  "), withDefault("919876543210"));
  assert.equal(resolveWhatsappUrl("https://WA.ME/15550109999"), withDefault("15550109999"));
});

test("keeps a message already present in the link", () => {
  assert.equal(resolveWhatsappUrl("https://wa.me/919876543210?text=Hi%20there"), "https://wa.me/919876543210?text=Hi%20there");
  assert.equal(resolveWhatsappUrl("https://wa.me/919876543210?text="), withDefault("919876543210"));
});

test("accepts WhatsApp Business short links unchanged", () => {
  assert.equal(resolveWhatsappUrl("https://wa.me/message/ABCDEF12345"), "https://wa.me/message/ABCDEF12345");
});

test("rejects unsafe schemes and unrelated domains", () => {
  for (const bad of [
    "http://wa.me/919876543210",
    "javascript:alert(1)",
    "data:text/html,hi",
    "//wa.me/919876543210",
    "wa.me/919876543210",
    "https://wa.me.evil.com/919876543210",
    "https://evilwa.me/919876543210",
    "https://api.whatsapp.com/send?phone=919876543210",
    "https://example.com/919876543210",
    "https://user:pass@wa.me/919876543210",
    "https://evil.com@wa.me/919876543210",
    "https://wa.me:8443/919876543210",
  ]) {
    assert.equal(resolveWhatsappUrl(bad), null, bad);
  }
});

test("rejects malformed wa.me links", () => {
  for (const bad of [
    "https://wa.me/",
    "https://wa.me/+91 98765 43210",
    "https://wa.me/0987654321",
    "https://wa.me/1234",
    "https://wa.me/1234567890123456",
    "https://wa.me/919876543210#x",
    "https://wa.me/919876543210?text=hi&phone=1",
    "https://wa.me/919876543210/extra",
    "https://wa.me/message/AB",
    "https://wa.me/message/ABCDEF?text=hi",
  ]) {
    assert.equal(resolveWhatsappUrl(bad), null, bad);
  }
});

test("dot segments are normalised by the URL parser to the same clean link", () => {
  assert.equal(resolveWhatsappUrl("https://wa.me/../919876543210"), withDefault("919876543210"));
});

test("missing values hide WhatsApp", () => {
  for (const v of [null, undefined, "", "   "]) assert.equal(resolveWhatsappUrl(v), null);
});
