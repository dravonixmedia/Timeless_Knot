/**
 * Tests for the build-time image manifest. Run with `npm test`.
 * Each test builds a throwaway public/ folder from the tiny fixtures.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, writeFile, rm, readFile, truncate } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateManifest, describeFromFilename, validateStoryMetadata } from "./generate-image-manifest.mjs";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

async function site(files) {
  const root = await mkdtemp(path.join(tmpdir(), "tk-media-"));
  const publicDir = path.join(root, "public");
  await mkdir(path.join(publicDir, "media"), { recursive: true });
  for (const [rel, source] of Object.entries(files)) {
    const dest = path.join(publicDir, "media", rel);
    await mkdir(path.dirname(dest), { recursive: true });
    if (source && typeof source === "object") await writeFile(dest, JSON.stringify(source));
    else if (typeof source === "string" && source.startsWith("fixture:")) await copyFile(path.join(FIX, source.slice(8)), dest);
    else await writeFile(dest, source ?? "");
  }
  const run = () =>
    generateManifest({
      publicDir,
      outFile: path.join(root, "manifest.json"),
      ignoreFile: path.join(publicDir, ".assetsignore"),
    });
  const ignored = async () => (await readFile(path.join(publicDir, ".assetsignore"), "utf8")).split("\n").filter((l) => l.startsWith("/"));
  return { root, publicDir, run, ignored, cleanup: () => rm(root, { recursive: true, force: true }) };
}

const story = (extra = {}) => ({ published: true, title: "A Garden Wedding", ...extra });

test("missing media folder and empty folders produce an empty manifest", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tk-media-"));
  const { manifest, warnings } = await generateManifest({ publicDir: path.join(root, "public"), outFile: path.join(root, "m.json") });
  assert.deepEqual(manifest.stories, []);
  assert.ok(Object.values(manifest.collections).every((list) => list.length === 0));
  assert.equal(warnings.length, 0);

  const s = await site({ "home/hero/.gitkeep": "", "weddings/.gitkeep": "" });
  const empty = await s.run();
  assert.equal(empty.manifest.collections["home/hero"].length, 0);
  assert.equal(empty.warnings.length, 0);
  await s.cleanup();
  await rm(root, { recursive: true, force: true });
});

test("discovers JPG, JPEG, PNG, WebP and AVIF with real dimensions", async () => {
  const s = await site({
    "about/a.jpg": "fixture:portrait.jpg",
    "about/b.JPEG": "fixture:landscape.jpg",
    "about/c.png": "fixture:square.png",
    "about/d.webp": "fixture:photo.webp",
    "about/e.avif": "fixture:photo.avif",
  });
  const { manifest, warnings } = await s.run();
  const about = manifest.collections.about;
  assert.deepEqual(about.map((i) => i.src), ["/media/about/a.jpg", "/media/about/b.JPEG", "/media/about/c.png", "/media/about/d.webp", "/media/about/e.avif"]);
  assert.deepEqual(about.map((i) => [i.width, i.height]), [[40, 60], [90, 50], [50, 50], [60, 40], [64, 48]]);
  assert.equal(warnings.length, 0);
  await s.cleanup();
});

test("unsupported, corrupt, misnamed, empty and oversized files are skipped and withheld", async () => {
  const s = await site({
    "home/featured/ok.jpg": "fixture:portrait.jpg",
    "home/featured/notes.txt": "private notes",
    "home/featured/raw.heic": "x",
    "home/featured/anim.gif": "GIF89a",
    "home/featured/broken.jpg": "fixture:corrupt.jpg",
    "home/featured/liar.png": "fixture:jpeg-named.png",
    "home/featured/empty.jpg": "",
    "home/featured/huge.jpg": "fixture:landscape.jpg",
  });
  await truncate(path.join(s.publicDir, "media/home/featured/huge.jpg"), 26 * 1024 * 1024);
  const { manifest, warnings } = await s.run();
  assert.deepEqual(manifest.collections["home/featured"].map((i) => i.src), ["/media/home/featured/ok.jpg"]);
  for (const name of ["notes.txt", "raw.heic", "anim.gif", "broken.jpg", "liar.png", "empty.jpg", "huge.jpg"]) {
    assert.ok(warnings.some((w) => w.includes(name)), `expected a warning for ${name}`);
    assert.ok((await s.ignored()).includes(`/media/home/featured/${name}`), `${name} must be withheld from upload`);
  }
  assert.ok(!(await s.ignored()).includes("/media/home/featured/ok.jpg"));
  await s.cleanup();
});

test("files in unrecognised or nested folders are reported and withheld", async () => {
  const s = await site({
    "wedding/typo.jpg": "fixture:portrait.jpg",
    "about/old/nested.jpg": "fixture:portrait.jpg",
    "weddings/loose.jpg": "fixture:portrait.jpg",
    "about/.DS_Store": "x",
  });
  const { warnings } = await s.run();
  for (const f of ["wedding/typo.jpg", "about/old/nested.jpg", "weddings/loose.jpg"]) {
    assert.ok(warnings.some((w) => w.includes(f) && w.includes("recognised")), `expected a warning for ${f}`);
    assert.ok((await s.ignored()).includes(`/media/${f}`));
  }
  assert.ok(!warnings.some((w) => w.includes(".DS_Store")), "hidden system files are withheld silently");
  assert.ok((await s.ignored()).includes("/media/about/.DS_Store"));
  await s.cleanup();
});

test("EXIF-rotated photographs report their displayed orientation", async () => {
  const s = await site({ "contact/turned.jpg": "fixture:rotated.jpg" });
  const [img] = (await s.run()).manifest.collections.contact;
  assert.deepEqual([img.width, img.height], [40, 60]);
  await s.cleanup();
});

test("ordering is natural and deterministic; images.json can override it", async () => {
  const s = await site({
    "home/featured/10-c.jpg": "fixture:portrait.jpg",
    "home/featured/2-b.jpg": "fixture:portrait.jpg",
    "home/featured/1-a.jpg": "fixture:portrait.jpg",
  });
  const first = await s.run();
  assert.deepEqual(first.manifest.collections["home/featured"].map((i) => i.src.split("/").pop()), ["1-a.jpg", "2-b.jpg", "10-c.jpg"]);
  const bytesA = await readFile(path.join(s.root, "manifest.json"), "utf8");
  await s.run();
  assert.equal(await readFile(path.join(s.root, "manifest.json"), "utf8"), bytesA, "output must be byte-identical between runs");

  await writeFile(path.join(s.publicDir, "media/home/featured/images.json"), JSON.stringify({ order: ["10-c.jpg", "missing.jpg"] }));
  const { manifest, warnings } = await s.run();
  assert.deepEqual(manifest.collections["home/featured"].map((i) => i.src.split("/").pop()), ["10-c.jpg", "1-a.jpg", "2-b.jpg"]);
  assert.ok(warnings.some((w) => w.includes("missing.jpg")));
  await s.cleanup();
});

test("adding, adding several and removing images is picked up on the next build", async () => {
  const s = await site({ "weddings/garden/story.json": story(), "weddings/garden/01.jpg": "fixture:portrait.jpg" });
  assert.equal((await s.run()).manifest.stories[0].gallery.length, 0); // only the cover

  for (const n of ["02", "03", "04"]) await copyFile(path.join(FIX, "landscape.jpg"), path.join(s.publicDir, `media/weddings/garden/${n}.jpg`));
  let [garden] = (await s.run()).manifest.stories;
  assert.deepEqual(garden.gallery.map((i) => i.src.split("/").pop()), ["02.jpg", "03.jpg", "04.jpg"]);

  await rm(path.join(s.publicDir, "media/weddings/garden/03.jpg"));
  [garden] = (await s.run()).manifest.stories;
  assert.deepEqual(garden.gallery.map((i) => i.src.split("/").pop()), ["02.jpg", "04.jpg"]);
  assert.ok(!(await s.ignored()).includes("/media/weddings/garden/02.jpg"));
  await s.cleanup();
});

test("a valid published story is discovered with its metadata, cover and category", async () => {
  const s = await site({
    "pre-wedding/ira-and-dev/story.json": story({
      title: "Before the Vows",
      couple: "Ira & Dev",
      location: "Kochi, Kerala",
      date: "2026-01-20",
      featured: true,
      cover: "02-portrait.jpg",
      introduction: ["A quiet morning by the backwaters."],
      images: { "02-portrait.jpg": { alt: "Ira and Dev by the water", focal: "50% 30%" } },
    }),
    "pre-wedding/ira-and-dev/01-walking-by-the-water.jpg": "fixture:landscape.jpg",
    "pre-wedding/ira-and-dev/02-portrait.jpg": "fixture:portrait.jpg",
    "pre-wedding/ira-and-dev/IMG_4821.jpg": "fixture:wide.jpg",
  });
  const { manifest } = await s.run();
  const [st] = manifest.stories;
  assert.equal(st.slug, "ira-and-dev");
  assert.equal(st.category, "Pre-Wedding");
  assert.equal(st.couple, "Ira & Dev");
  assert.equal(st.featured, true);
  assert.equal(st.cover.src, "/media/pre-wedding/ira-and-dev/02-portrait.jpg");
  assert.equal(st.cover.alt, "Ira and Dev by the water");
  assert.equal(st.cover.focal, "50% 30%");
  assert.ok(!st.gallery.some((i) => i.src === st.cover.src), "cover is not repeated in the gallery");
  assert.equal(st.gallery[0].alt, "Walking by the water — Before the Vows (Ira & Dev, Kochi, Kerala)");
  assert.match(st.gallery[1].alt, /^Pre-Wedding photograph 3 of 3 from Before the Vows/);
  await s.cleanup();
});

test("drafts, missing or invalid metadata, bad slugs, duplicates and empty stories stay private", async () => {
  const s = await site({
    "weddings/draft-story/story.json": story({ published: false }),
    "weddings/draft-story/a.jpg": "fixture:portrait.jpg",
    "weddings/no-metadata/a.jpg": "fixture:portrait.jpg",
    "weddings/bad-date/story.json": story({ date: "2026-02-31" }),
    "weddings/bad-date/a.jpg": "fixture:portrait.jpg",
    "weddings/no-title/story.json": { published: true },
    "weddings/no-title/a.jpg": "fixture:portrait.jpg",
    "weddings/string-flag/story.json": story({ published: "yes" }),
    "weddings/string-flag/a.jpg": "fixture:portrait.jpg",
    "weddings/bad-film/story.json": story({ film: { embedUrl: "http://example.com/x" } }),
    "weddings/bad-film/a.jpg": "fixture:portrait.jpg",
    "weddings/broken-json/story.json": "{ published: true,",
    "weddings/broken-json/a.jpg": "fixture:portrait.jpg",
    "weddings/Bad Slug/story.json": story(),
    "weddings/Bad Slug/a.jpg": "fixture:portrait.jpg",
    "weddings/no-images/story.json": story(),
    "weddings/no-images/notes.txt": "x",
    "weddings/same-name/story.json": story({ title: "First" }),
    "weddings/same-name/a.jpg": "fixture:portrait.jpg",
    "couples/same-name/story.json": story({ title: "Second" }),
    "couples/same-name/a.jpg": "fixture:portrait.jpg",
    "secret-folder/private.jpg": "fixture:portrait.jpg",
  });
  const { manifest, warnings } = await s.run();
  assert.deepEqual(manifest.stories.map((st) => `${st.collection}/${st.slug}`), ["weddings/same-name"]);
  assert.ok(warnings.some((w) => w.includes("secret-folder/private.jpg") && w.includes("not in a recognised upload folder")));
  for (const bad of ["no-metadata", "bad-date", "no-title", "string-flag", "bad-film", "broken-json", "Bad Slug", "no-images", "couples/same-name"]) {
    assert.ok(warnings.some((w) => w.includes(bad)), `expected a warning about ${bad}`);
  }
  const ignored = await s.ignored();
  for (const hidden of ["weddings/draft-story/a.jpg", "weddings/no-metadata/a.jpg", "weddings/bad-date/a.jpg", "weddings/bad-date/story.json", "couples/same-name/a.jpg", "secret-folder/private.jpg"]) {
    assert.ok(ignored.includes(`/media/${hidden}`), `${hidden} must not be uploaded`);
  }
  assert.ok(!ignored.includes("/media/weddings/same-name/a.jpg"));
  await s.cleanup();
});

test("stories are ordered by position, then newest date, then title", async () => {
  const s = await site({
    "weddings/old/story.json": story({ title: "Old", date: "2024-05-01" }),
    "weddings/old/a.jpg": "fixture:portrait.jpg",
    "weddings/new/story.json": story({ title: "New", date: "2026-05-01" }),
    "weddings/new/a.jpg": "fixture:portrait.jpg",
    "couples/pinned/story.json": story({ title: "Pinned", position: 0 }),
    "couples/pinned/a.jpg": "fixture:portrait.jpg",
    "weddings/undated/story.json": story({ title: "Undated" }),
    "weddings/undated/a.jpg": "fixture:portrait.jpg",
  });
  assert.deepEqual((await s.run()).manifest.stories.map((st) => st.slug), ["pinned", "new", "old", "undated"]);
  await s.cleanup();
});

test("public URLs are normalised and safely encoded", async () => {
  const s = await site({ "contact/Bride & Groom #1.jpg": "fixture:portrait.jpg" });
  const [img] = (await s.run()).manifest.collections.contact;
  assert.equal(img.src, "/media/contact/Bride%20%26%20Groom%20%231.jpg");
  await s.cleanup();
});

test("alt text from filenames ignores camera names and ordering prefixes", () => {
  assert.equal(describeFromFilename("03-first-dance.jpg"), "First dance");
  assert.equal(describeFromFilename("bride_getting_ready_final.JPG"), "Bride getting ready");
  assert.equal(describeFromFilename("IMG_4821.jpg"), null);
  assert.equal(describeFromFilename("DSC01234.jpg"), null);
  assert.equal(describeFromFilename("0042.jpg"), null);
  assert.equal(describeFromFilename("01-hero.jpg"), null);
  assert.equal(describeFromFilename("cover.png"), null);
  assert.equal(describeFromFilename("hero-at-sunset.jpg"), "Hero at sunset");
});

test("metadata validation explains every problem", () => {
  assert.deepEqual(validateStoryMetadata(story()), []);
  const problems = validateStoryMetadata({ published: "true", category: "Party", featured: "no", introduction: "text" });
  assert.equal(problems.length, 5);
});
