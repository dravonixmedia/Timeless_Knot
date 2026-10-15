/**
 * Tests for gallery composition and slot assignment (src/lib/compose-gallery.ts).
 * Node strips the TypeScript types natively; the module imports types only.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { assignSlots, composeGallery } from "../../src/lib/compose-gallery.ts";

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
  const slot = (w, h) => ({ width: w, height: h, alt: "placeholder" });
  const slots = { portraitA: slot(3, 4), wide: slot(16, 9), portraitB: slot(3, 4) };
  const out = assignSlots([L(1), P(1)], slots);
  assert.equal(out.portraitA.src, "/p1.jpg");
  assert.equal(out.wide.src, "/l1.jpg");
  assert.equal(out.portraitB.src, undefined, "unfilled slot keeps its placeholder");
  assert.equal(assignSlots([], slots).wide, slots.wide);
});
