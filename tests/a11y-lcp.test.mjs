/**
 * Regression tests for three accessibility / LCP fixes: the mobile menu keeps
 * keyboard focus inside while open, the celebration dropdown's placeholder
 * meets WCAG AA contrast, and only the portfolio's first photograph loads
 * eagerly.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

test("mobile menu: every Tab is handled inside the menu, wrapping both ways, over the current focusable items", () => {
  const menu = read("src/components/layout/MobileMenu.tsx");
  const onKey = menu.slice(menu.indexOf("const onKey"), menu.indexOf('document.addEventListener("keydown"'));
  // The browser's own Tab order is never used while open (it led out of the dialog).
  assert.match(onKey, /if \(event\.key !== "Tab" \|\| !panel\.current\) return;\s*(\/\/.*\s*)*event\.preventDefault\(\);/);
  // Gathered on each press, skipping anything inert or not rendered.
  assert.match(onKey, /querySelectorAll<HTMLElement>\("a\[href\]"\)/);
  assert.match(onKey, /aria-controls="mobile-menu"/);
  assert.match(onKey, /!el\.closest\("\[inert\]"\) && el\.getClientRects\(\)\.length > 0/);
  assert.match(onKey, /if \(!items\.length\) return;/);
  // Wraps forwards and backwards; focus from outside the list re-enters at an end.
  assert.match(onKey, /% items\.length/);
  assert.match(onKey, /index === -1 \? \(event\.shiftKey \? items\.length - 1 : 0\)/);
  // Escape closes, and closing returns focus to the menu button.
  assert.match(onKey, /event\.key === "Escape"[\s\S]*onClose\(\);/);
  const header = read("src/components/layout/Header.tsx");
  assert.match(header, /const closeMenu = useCallback\(\(\) => \{\s*setMenuOpen\(false\);\s*toggleRef\.current\?\.focus\(\);/);
  assert.match(header, /<MobileMenu[^>]*onClose=\{closeMenu\}/);
});

/** WCAG relative luminance and contrast ratio. */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg, alpha, bg) => fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));

test("celebration placeholder text meets WCAG AA (4.5:1) on the form and in the open list", () => {
  const css = read("src/app/globals.css");
  const token = (name) => hex(new RegExp(`--color-${name}: (#[0-9a-f]{6})`).exec(css)[1]);
  const mutedAlpha = Number(/@utility text-muted \{\s*color: color-mix\(in oklab, var\(--color-charcoal\) (\d+)%/.exec(css)[1]) / 100;
  const charcoal = token("charcoal");
  const porcelain = token("porcelain");
  const highlighted = over(token("pale-sage"), 0.7, porcelain); // the active option's bg-pale-sage/70
  for (const [where, bg] of [["form", porcelain], ["highlighted option", highlighted]]) {
    const ratio = contrast(over(charcoal, mutedAlpha, bg), bg);
    assert.ok(ratio >= 4.5, `${where}: ${ratio.toFixed(2)}:1`);
  }

  const select = read("src/components/contact/CelebrationSelect.tsx");
  assert.match(select, /<span className=\{value \? "" : "text-muted"\}>\{items\[selected\]\.label\}<\/span>/);
  assert.match(select, /\$\{i === 0 \? "text-muted" : "text-charcoal"\}/);
  assert.ok(!/text-charcoal\/[1-6]\d\b/.test(select), "no faint charcoal text left in the dropdown");
});

test("portfolio: only the first photograph is prioritised; the rest stay lazy", () => {
  const gallery = read("src/components/stories/PortfolioGallery.tsx");
  const pictures = [...gallery.matchAll(/<Picture [^>]*\/>/g)].map((m) => m[0]);
  assert.deepEqual(pictures, ["<Picture media={image} sizes={SIZES} priority={i === 0} />"]);
  // The grid lists every photograph in order, so index 0 is the first in the default view.
  assert.match(gallery, /\{items\.map\(\(\{ image, category \}, i\) => \(/);
  // `priority` is the only eager path: Picture preloads it and lazy-loads everything else.
  const picture = read("src/components/media/Picture.tsx");
  assert.match(picture, /preload=\{priority\}/);
  assert.ok(!/loading=/.test(picture), "Picture leaves loading to next/image (lazy unless preloaded)");
});
