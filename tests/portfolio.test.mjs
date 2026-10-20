/**
 * Tests for the portfolio's URL-based category filter (src/lib/portfolio.ts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryFromParam, portfolioCategoryHref } from "../src/lib/portfolio.ts";

test("homepage cards link to the portfolio with their category selected", () => {
  assert.equal(portfolioCategoryHref("weddings"), "/stories?category=weddings");
  assert.equal(portfolioCategoryHref("pre-wedding"), "/stories?category=pre-wedding");
  assert.equal(portfolioCategoryHref("couples"), "/stories?category=couples");
});

test("only known categories are selected from the URL; anything else shows All", () => {
  for (const c of ["weddings", "pre-wedding", "couples"]) assert.equal(categoryFromParam(c), c);
  for (const v of [null, undefined, "", "all", "Weddings", "elopements", "<script>"]) assert.equal(categoryFromParam(v), "all");
});
