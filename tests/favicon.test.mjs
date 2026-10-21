/**
 * Favicon regression tests. Google Search shows a site's favicon from the
 * <link rel="icon"> tags on its home page: a square image, ideally larger than
 * 48×48, at a stable URL that Googlebot-Image may fetch. Next.js generates
 * those tags from the icon files in src/app, so these tests pin the files.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url));
const text = (rel) => read(rel).toString("utf8");

/** Width, height and colour type of a PNG, from its IHDR chunk. */
function png(rel) {
  const b = read(rel);
  assert.equal(b.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${rel} is a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
}

/** The image sizes inside an .ico file. */
function icoSizes(rel) {
  const b = read(rel);
  assert.equal(b.readUInt16LE(0), 0);
  assert.equal(b.readUInt16LE(2), 1, `${rel} is an icon file`);
  return Array.from({ length: b.readUInt16LE(4) }, (_, i) => {
    const entry = 6 + i * 16;
    return `${b[entry] || 256}x${b[entry + 1] || 256}`;
  }).sort();
}

test("favicon.ico holds the 16, 32 and 48 px versions", () => {
  assert.deepEqual(icoSizes("src/app/favicon.ico"), ["16x16", "32x32", "48x48"]);
});

test("a 96×96 PNG favicon (a multiple of 48, larger than 48) is declared for Google Search", () => {
  assert.deepEqual(png("src/app/icon1.png"), { width: 96, height: 96, colorType: 6 });
  // The 32 px browser-tab icon and the Apple touch icon stay as they were.
  assert.deepEqual(png("src/app/icon.png"), { width: 32, height: 32, colorType: 6 });
  assert.deepEqual(png("src/app/apple-icon.png"), { width: 180, height: 180, colorType: 6 });
});

test("icons are square, and only the app/ icon files declare them", () => {
  const icons = readdirSync(new URL("../src/app/", import.meta.url)).filter((n) => /^(icon|apple-icon|favicon)/.test(n));
  assert.deepEqual(icons.sort(), ["apple-icon.png", "favicon.ico", "icon.png", "icon1.png"]);
  for (const f of ["icon.png", "icon1.png", "apple-icon.png"]) {
    const { width, height } = png(`src/app/${f}`);
    assert.equal(width, height, `${f} is square`);
  }
  // No hand-written icon metadata that could duplicate or override the generated <link> tags.
  for (const f of ["src/app/layout.tsx", "src/lib/seo.tsx"]) assert.ok(!/\bicons\s*:/.test(text(f)), `${f} declares no icons`);
});

test("the web app manifest's icons exist at the sizes it states", () => {
  const manifest = text("src/app/manifest.ts");
  for (const [, src, size] of manifest.matchAll(/src: "(\/icons\/[^"]+)", sizes: "(\d+)x\d+"/g)) {
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src);
    const { width, height } = png(`public${src}`);
    assert.deepEqual([width, height], [Number(size), Number(size)], src);
  }
});

test("nothing blocks crawlers from the icons", () => {
  // robots.txt allows everything except /api/.
  assert.match(text("src/app/robots.ts"), /rules: \{ userAgent: "\*", allow: "\/", disallow: "\/api\/" \}/);
  // The Worker only rewrites image-optimiser requests; icon URLs pass straight through.
  const worker = text("custom-worker.ts");
  assert.ok(!/favicon|icon\d*\.png|apple-icon/.test(worker), "the Worker has no icon-specific rules");
});
