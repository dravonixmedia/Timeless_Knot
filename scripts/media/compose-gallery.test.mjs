/**
 * Tests for gallery composition and slot assignment (src/lib/compose-gallery.ts).
 * Node strips the TypeScript types natively; the module imports types only.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assignSlots, composeGallery, toMedia } from "../../src/lib/compose-gallery.ts";

const P = (n) => ({ src: `/p${n}.jpg`, width: 800, height: 1200, alt: `p${n}` });
const L = (n) => ({ src: `/l${n}.jpg`, width: 1500, height: 1000, alt: `l${n}` });
const W = (n) => ({ src: `/w${n}.jpg`, width: 2400, height: 1000, alt: `w${n}` });

const shape = (blocks) =>
  blocks.map((b) => (b.kind === "single" ? `single:${b.align}` : b.kind === "statement" ? `“${b.text}”` : b.kind));

test("portraits group into pairs and trios, landscapes alternate full and single", () => {
  assert.deepEqual(shape(composeGallery([L(1), P(1), P(2), L(2), P(3), P(4), P(5), W(1)])), ["full", "pair", "single:left", "trio", "full"]);
  assert.deepEqual(shape(composeGallery([P(1), P(2), P(3), P(4)])), ["pair", "pair"]);
  assert.deepEqual(shape(composeGallery([P(1)])), ["single:center"]);
  assert.deepEqual(composeGallery([]), []);
});

test("composition keeps every photograph exactly once, in order", () => {
  const input = [P(1), L(1), P(2), P(3), W(1), P(4), P(5), P(6), P(7), L(2)];
  const flat = composeGallery(input).flatMap((b) => ("images" in b ? b.images : "image" in b ? [b.image] : []));
  assert.deepEqual(flat.map((m) => m.src), input.map((m) => m.src));
  assert.ok(flat.every((m) => m.width && m.height), "original dimensions are preserved");
});

test("pull quotes are woven in between blocks, never at the end", () => {
  const blocks = composeGallery([L(1), L(2), L(3), L(4)], ["One", "Two"]);
  assert.deepEqual(shape(blocks), ["full", "single:left", "full", "“One”", "single:right"]);
});

test("slots prefer matching orientation, then take what remains", () => {
  const slots = { portraitA: "portrait", wide: "landscape", portraitB: "portrait" };
  const { slots: out, extra } = assignSlots([L(1), P(1)], slots);
  assert.equal(out.portraitA.src, "/p1.jpg");
  assert.equal(out.wide.src, "/l1.jpg");
  assert.equal(out.portraitB, undefined, "an unfilled slot has no media, so nothing is rendered");
  assert.deepEqual(extra, []);
  assert.deepEqual(assignSlots([], slots), { slots: {}, extra: [] });
});

test("photographs beyond the slots are returned as extras, in order", () => {
  const { slots: out, extra } = assignSlots([L(1), P(1), P(2), L(2)], { wide: "landscape", tall: "portrait" });
  assert.equal(out.wide.src, "/l1.jpg");
  assert.equal(out.tall.src, "/p1.jpg");
  assert.deepEqual(extra.map((m) => m.src), ["/p2.jpg", "/l2.jpg"]);
  assert.ok(extra.every((m) => m.width && m.height), "extras keep their original dimensions");
});

test("a mismatched photograph still fills a slot rather than leaving it empty", () => {
  const { slots: out, extra } = assignSlots([P(1), P(2)], { tall: "portrait", wide: "landscape" });
  assert.equal(out.tall.src, "/p1.jpg");
  assert.equal(out.wide.src, "/p2.jpg");
  assert.deepEqual(extra, []);
});

test("fingerprinted photographs use their content-addressed URL", () => {
  assert.equal(toMedia({ src: "/media/home/hero/hero%20one.jpg", width: 3, height: 2, alt: "a", hash: "0123456789abcdef" }).src, "/media-cache/0123456789abcdef/hero%20one.jpg");
  assert.equal(toMedia({ src: "/media/a.jpg", width: 3, height: 2, alt: "a" }).src, "/media/a.jpg", "unhashed images keep their path");
});
