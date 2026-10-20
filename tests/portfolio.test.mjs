/**
 * Tests for the portfolio's URL-based category filter (src/lib/portfolio.ts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { categoryFromParam, portfolioBootScript, portfolioCategoryHref, PORTFOLIO_CATEGORIES } from "../src/lib/portfolio.ts";

test("homepage cards link to the portfolio with their category selected", () => {
  assert.equal(portfolioCategoryHref("weddings"), "/stories?category=weddings");
  assert.equal(portfolioCategoryHref("pre-wedding"), "/stories?category=pre-wedding");
  assert.equal(portfolioCategoryHref("couples"), "/stories?category=couples");
  assert.equal(portfolioCategoryHref("beyond-the-frame"), "/stories?category=beyond-the-frame");
});

test("only known categories are selected from the URL; anything else shows All", () => {
  for (const c of ["weddings", "pre-wedding", "couples", "beyond-the-frame"]) assert.equal(categoryFromParam(c), c);
  for (const v of [null, undefined, "", "all", "Weddings", "elopements", "<script>"]) assert.equal(categoryFromParam(v), "all");
});

/** Runs the <head> boot script against a fake location and returns the data-portfolio it set. */
function boot(pathname, search, available = PORTFOLIO_CATEGORIES) {
  const attrs = {};
  const documentElement = { setAttribute: (k, v) => (attrs[k] = v) };
  vm.runInNewContext(portfolioBootScript(available), { document: { documentElement }, location: { pathname, search }, URLSearchParams });
  return attrs["data-portfolio"];
}

test("the boot script marks a valid category on /stories only", () => {
  assert.equal(boot("/stories", "?category=couples"), "couples");
  assert.equal(boot("/stories", "?category=pre-wedding&x=1"), "pre-wedding");
  assert.equal(boot("/stories", "?category=bogus"), undefined);
  assert.equal(boot("/stories", ""), undefined);
  assert.equal(boot("/", "?category=couples"), undefined);
  assert.equal(boot("/stories", "?category=couples", ["weddings"]), undefined, "a category without photographs shows All");
});

test("the pre-paint CSS covers every portfolio category", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  for (const c of PORTFOLIO_CATEGORIES) {
    assert.ok(css.includes(`[data-portfolio="${c}"] [data-portfolio-fallback] [data-portfolio-variant="${c}"]`), `${c}: filter bar rule`);
    assert.ok(css.includes(`[data-portfolio="${c}"] [data-portfolio-fallback] figure:not([data-category="${c}"])`), `${c}: photograph rule`);
  }
});
