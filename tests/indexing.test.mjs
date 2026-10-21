/**
 * Tests for the production-only indexing rule (src/lib/indexing.ts), which the
 * Worker uses to mark every non-production response `noindex`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isProductionHost, PRODUCTION_ORIGIN } from "../src/lib/indexing.ts";

test("the production origin is the live HTTPS domain", () => {
  assert.equal(PRODUCTION_ORIGIN, "https://timelessknot.dravonix.dev");
});

test("only the production hostname is indexable", () => {
  assert.equal(isProductionHost("timelessknot.dravonix.dev"), true);
  assert.equal(isProductionHost("TimelessKnot.Dravonix.dev"), true);
  for (const host of [
    "timeless-knot.dravonixmedia.workers.dev",
    "abc123-timeless-knot.dravonixmedia.workers.dev",
    "localhost",
    "127.0.0.1",
    "dravonix.dev",
    "www.timelessknot.dravonix.dev",
    "timelessknot.dravonix.dev.example.com",
  ]) {
    assert.equal(isProductionHost(host), false, host);
  }
});
