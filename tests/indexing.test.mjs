/**
 * Tests for the canonical-domain and host rules (src/lib/indexing.ts) shared by
 * the pages and the Cloudflare Worker, before and after the move from
 * timelessknot.dravonix.dev to timelessknot.in.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideHost, DEFAULT_CANONICAL_ORIGIN, REDIRECT_HOSTNAMES, resolveCanonicalOrigin } from "../src/lib/indexing.ts";

const LEGACY = "https://timelessknot.dravonix.dev";
const NEW = "https://timelessknot.in";
const at = (href, origin) => decideHost(new URL(href), origin);

test("without NEXT_PUBLIC_SITE_URL the current production domain stays canonical", () => {
  assert.equal(DEFAULT_CANONICAL_ORIGIN, LEGACY);
  for (const value of [undefined, null, "", "  "]) assert.equal(resolveCanonicalOrigin(value), LEGACY);
});

test("a configured site URL is normalised to its bare HTTPS origin", () => {
  assert.equal(resolveCanonicalOrigin("https://timelessknot.in"), NEW);
  assert.equal(resolveCanonicalOrigin("https://timelessknot.in/"), NEW);
  assert.equal(resolveCanonicalOrigin(" https://TimelessKnot.IN/ "), NEW);
});

test("a mistyped site URL fails the build instead of publishing wrong canonicals", () => {
  for (const bad of ["timelessknot.in", "http://timelessknot.in", "https://timelessknot.in/home", "https://timelessknot.in?x=1", "https://timelessknot.in:8443", "not a url"]) {
    assert.throws(() => resolveCanonicalOrigin(bad), /NEXT_PUBLIC_SITE_URL/, bad);
  }
});

test("before the move: the legacy domain is indexable and timelessknot.in is not yet", () => {
  assert.deepEqual(at(`${LEGACY}/stories?category=couples`, LEGACY), { action: "serve", indexable: true });
  // Attached early for HTTPS/routing checks: it works, but stays out of search.
  assert.deepEqual(at(`${NEW}/`, LEGACY), { action: "serve", indexable: false });
});

test("after the move: timelessknot.in is indexable and the legacy domain redirects with path and query", () => {
  assert.deepEqual(at(`${NEW}/contact`, NEW), { action: "serve", indexable: true });
  assert.deepEqual(at(`${LEGACY}/stories?category=couples`, NEW), { action: "redirect", location: `${NEW}/stories?category=couples` });
  assert.deepEqual(at(`${LEGACY}/`, NEW), { action: "redirect", location: `${NEW}/` });
  assert.deepEqual(at("https://www.timelessknot.in/our-story", NEW), { action: "redirect", location: `${NEW}/our-story` });
});

test("host matching ignores letter case and port", () => {
  assert.deepEqual(at("https://TimelessKnot.in:443/", NEW), { action: "serve", indexable: true });
  assert.deepEqual(at("https://TIMELESSKNOT.DRAVONIX.DEV/", NEW).action, "redirect");
});

test("preview, workers.dev, local and look-alike hosts are never indexable and never redirected", () => {
  for (const origin of [LEGACY, NEW]) {
    for (const href of [
      "https://timeless-knot.dravonixmedia.workers.dev/",
      "https://abc123-timeless-knot.dravonixmedia.workers.dev/",
      "http://localhost:8787/",
      "http://127.0.0.1:3000/",
      "https://dravonix.dev/",
      "https://staging.timelessknot.in/",
      "https://timelessknot.in.example.com/",
      "https://www.timelessknot.dravonix.dev/",
    ]) {
      assert.deepEqual(at(href, origin), { action: "serve", indexable: false }, `${href} with canonical ${origin}`);
    }
  }
});

test("every redirect host is a studio domain, and the canonical never redirects to itself", () => {
  assert.deepEqual([...REDIRECT_HOSTNAMES].sort(), ["timelessknot.dravonix.dev", "www.timelessknot.in"]);
  assert.equal(at(`${LEGACY}/`, LEGACY).action, "serve");
});
