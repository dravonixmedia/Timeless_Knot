/**
 * Tests for the MP4 inspector and homepage video selection.
 * MP4s are assembled from raw boxes here, so no real footage is committed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, writeFile, rm, readFile, truncate } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMp4 } from "./read-mp4.mjs";
import { generateManifest, contentHash, titleFromFilename } from "./generate-image-manifest.mjs";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n);
  return b;
};
const box = (type, ...parts) => {
  const body = Buffer.concat(parts);
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "latin1"), body]);
};
const zeros = (n) => Buffer.alloc(n);

function track({ handler, width = 0, height = 0, codec = "avc1", rotate = false }) {
  const m = rotate ? [0, 0x10000, 0, -0x10000, 0, 0, 0, 0, 0x40000000] : [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000];
  const tkhd = box("tkhd", zeros(40), ...m.map(u32), u32(width * 65536), u32(height * 65536));
  const hdlr = box("hdlr", zeros(8), Buffer.from(handler, "latin1"), zeros(13));
  const stsd = box("stsd", zeros(4), u32(1), u32(16), Buffer.from(codec, "latin1"), zeros(8));
  return box("trak", tkhd, box("mdia", hdlr, box("minf", box("stbl", stsd))));
}

/** A structurally valid MP4 (no real frames — only the boxes the reader inspects). */
export function mp4({ width = 1920, height = 1080, codec = "avc1", audio = true, fastStart = true, rotate = false, seconds = 30 } = {}) {
  const ftyp = box("ftyp", Buffer.from("isom", "latin1"), zeros(4), Buffer.from("isomavc1", "latin1"));
  const mvhd = box("mvhd", zeros(12), u32(1000), u32(seconds * 1000), zeros(80));
  const moov = box("moov", mvhd, track({ handler: "vide", width, height, codec, rotate }), ...(audio ? [track({ handler: "soun", codec: "mp4a" })] : []));
  const mdat = box("mdat", zeros(64));
  return fastStart ? Buffer.concat([ftyp, moov, mdat]) : Buffer.concat([ftyp, mdat, moov]);
}

test("reads dimensions, duration, codec, audio and fast start", () => {
  assert.deepEqual(readMp4(mp4()), { width: 1920, height: 1080, codec: "avc1", duration: 30, hasAudio: true, fastStart: true });
  const slow = readMp4(mp4({ audio: false, fastStart: false, width: 1280, height: 720 }));
  assert.equal(slow.hasAudio, false);
  assert.equal(slow.fastStart, false);
  assert.equal(slow.width, 1280);
});

test("a 90° rotation matrix swaps the display dimensions", () => {
  const r = readMp4(mp4({ width: 1920, height: 1080, rotate: true }));
  assert.equal(r.width, 1080);
  assert.equal(r.height, 1920);
});

test("non-MP4 data and MP4s without a video track are rejected", () => {
  assert.equal(readMp4(Buffer.from("not a video at all, just text")), null);
  assert.equal(readMp4(Buffer.alloc(0)), null);
  const audioOnly = Buffer.concat([box("ftyp", zeros(8)), box("moov", box("mvhd", zeros(100)), track({ handler: "soun", codec: "mp4a" }))]);
  assert.equal(readMp4(audioOnly), null);
  assert.equal(readMp4(mp4().subarray(0, 40)), null, "truncated file");
});

async function site(files) {
  const root = await mkdtemp(path.join(tmpdir(), "tk-video-"));
  const publicDir = path.join(root, "public");
  for (const [rel, source] of Object.entries(files)) {
    const dest = path.join(publicDir, "media", rel);
    await mkdir(path.dirname(dest), { recursive: true });
    if (typeof source === "string" && source.startsWith("fixture:")) await copyFile(path.join(FIX, source.slice(8)), dest);
    else await writeFile(dest, source);
  }
  const ignoreFile = path.join(publicDir, ".assetsignore");
  const result = await generateManifest({ publicDir, outFile: path.join(root, "m.json"), ignoreFile });
  const ignored = (await readFile(ignoreFile, "utf8")).split("\n").filter((l) => l.startsWith("/"));
  return { ...result, ignored, cleanup: () => rm(root, { recursive: true, force: true }) };
}

test("no video: the manifest has none and nothing is warned", async () => {
  const s = await site({ "home/video/.gitkeep": "" });
  assert.equal(s.manifest.video, null);
  assert.deepEqual(s.warnings, []);
  await s.cleanup();
});

test("the first valid MP4 by name is the homepage video; others are withheld", async () => {
  const s = await site({
    "home/video/02-wedding-film.mp4": mp4({ width: 1280, height: 720 }),
    "home/video/01 Showreel.mp4": mp4({ audio: false }),
  });
  assert.deepEqual(s.manifest.video, {
    src: "/media/home/video/01%20Showreel.mp4",
    type: "video/mp4",
    width: 1920,
    height: 1080,
    duration: 30,
    hasAudio: false,
    bytes: mp4({ audio: false }).length,
    hash: contentHash(mp4({ audio: false })),
  });
  assert.ok(s.ignored.includes("/media/home/video/02-wedding-film.mp4"), "the unused video is not uploaded");
  assert.ok(!s.ignored.some((l) => l.includes("Showreel")), "the chosen video is uploaded");
  assert.ok(s.warnings.some((w) => w.includes("02-wedding-film.mp4") && w.includes("only one homepage video")));
  await s.cleanup();
});

test("invalid videos are skipped so the next valid one is used, or none", async () => {
  const s = await site({
    "home/video/01-broken.mp4": "this is not a video",
    "home/video/02-hevc.mp4": mp4({ codec: "hvc1" }),
    "home/video/03-film.mp4": mp4(),
  });
  assert.equal(s.manifest.video.src, "/media/home/video/03-film.mp4");
  assert.ok(s.warnings.some((w) => w.includes("01-broken.mp4") && w.includes("not a readable MP4")));
  assert.ok(s.warnings.some((w) => w.includes("02-hevc.mp4") && w.includes("H.264")));
  assert.ok(s.ignored.includes("/media/home/video/01-broken.mp4"));
  await s.cleanup();

  const none = await site({ "home/video/film.mp4": "garbage", "home/video/film.mov": "x" });
  assert.equal(none.manifest.video, null, "the section stays hidden");
  assert.ok(none.ignored.includes("/media/home/video/film.mp4"));
  assert.ok(none.warnings.some((w) => w.includes("film.mov") && w.includes(".mp4")));
  await none.cleanup();
});

test("a poster is matched by the video's name or poster.*; other images are not used", async () => {
  const s = await site({
    "home/video/film.mp4": mp4(),
    "home/video/film.jpg": "fixture:landscape.jpg",
    "home/video/poster.jpg": "fixture:portrait.jpg",
  });
  assert.equal(s.manifest.video.poster.src, "/media/home/video/film.jpg");
  assert.ok(s.manifest.video.poster.width > 0);
  assert.ok(s.ignored.includes("/media/home/video/poster.jpg"));
  await s.cleanup();

  const p = await site({ "home/video/film.mp4": mp4(), "home/video/poster.jpg": "fixture:landscape.jpg" });
  assert.equal(p.manifest.video.poster.src, "/media/home/video/poster.jpg");
  await p.cleanup();

  const none = await site({ "home/video/film.mp4": mp4() });
  assert.equal(none.manifest.video.poster, undefined);
  await none.cleanup();
});

test("slow-start videos publish with a warning", async () => {
  const s = await site({ "home/video/film.mp4": mp4({ fastStart: false }) });
  assert.equal(s.manifest.video.src, "/media/home/video/film.mp4");
  assert.ok(s.warnings.some((w) => w.includes("fast start")));
  await s.cleanup();
});

test("videos over Cloudflare's 25 MB asset limit are withheld so the deploy cannot fail", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tk-video-"));
  const publicDir = path.join(root, "public");
  const dest = path.join(publicDir, "media/home/video/film.mp4");
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, mp4());
  await truncate(dest, 26 * 1024 * 1024); // sparse: no real data written
  const ignoreFile = path.join(publicDir, ".assetsignore");
  const { manifest, warnings } = await generateManifest({ publicDir, outFile: path.join(root, "m.json"), ignoreFile });
  assert.equal(manifest.video, null);
  assert.ok(warnings.some((w) => w.includes("25 MB")));
  assert.ok((await readFile(ignoreFile, "utf8")).includes("/media/home/video/film.mp4"));
  await rm(root, { recursive: true, force: true });
});

/* Homepage film collection (home/films/ plus the legacy home/video/ film) */

const names = (films) => films.map((f) => decodeURIComponent(f.src.split("/").pop()));

test("no films anywhere: the collection is empty and the section stays hidden", async () => {
  const s = await site({ "home/films/.gitkeep": "", "home/video/.gitkeep": "" });
  assert.deepEqual(s.manifest.films, []);
  assert.deepEqual(s.warnings, []);
  await s.cleanup();
});

test("the legacy home/video film on its own is the single homepage film, unchanged", async () => {
  const s = await site({ "home/video/V 01.mp4": mp4({ width: 960, height: 720 }) });
  assert.equal(s.manifest.films.length, 1);
  const [film] = s.manifest.films;
  assert.equal(film.src, "/media/home/video/V%2001.mp4");
  assert.equal(film.id, film.hash);
  assert.equal(film.title, "V 01");
  assert.deepEqual({ ...film, id: undefined, title: undefined }, { ...s.manifest.video, id: undefined, title: undefined });
  await s.cleanup();
});

test("films: legacy first, then home/films in natural order, each with an optional same-name poster", async () => {
  const s = await site({
    "home/video/original.mp4": mp4({ seconds: 10 }),
    "home/films/10-reception.mp4": mp4({ seconds: 30 }),
    "home/films/2-ceremony.mp4": mp4({ seconds: 20 }),
    "home/films/2-ceremony.jpg": "fixture:landscape.jpg",
    "home/films/stray.jpg": "fixture:landscape.jpg",
  });
  assert.deepEqual(names(s.manifest.films), ["original.mp4", "2-ceremony.mp4", "10-reception.mp4"]);
  assert.equal(s.manifest.films[1].poster.src, "/media/home/films/2-ceremony.jpg");
  assert.equal(s.manifest.films[2].poster, undefined);
  for (const f of ["/media/home/video/original.mp4", "/media/home/films/2-ceremony.mp4", "/media/home/films/10-reception.mp4", "/media/home/films/2-ceremony.jpg"]) {
    assert.ok(!s.ignored.includes(f), `${f} is uploaded`);
  }
  assert.ok(s.ignored.includes("/media/home/films/stray.jpg"));
  assert.ok(s.warnings.some((w) => w.includes("stray.jpg") && w.includes("poster")));
  await s.cleanup();
});

test("films.json sets the order (featured first) and titles; unlisted films follow; unknown names are reported", async () => {
  const s = await site({
    "home/video/V 01.mp4": mp4({ seconds: 10 }),
    "home/films/a.mp4": mp4({ seconds: 20 }),
    "home/films/b.mp4": mp4({ seconds: 30 }),
    "home/films/films.json": JSON.stringify({ order: ["b.mp4", "missing.mp4", "V 01.mp4"], "b.mp4": "Wedding Film 01", "V 01.mp4": "Wedding Film 02", "a.mp4": "" }),
  });
  assert.deepEqual(names(s.manifest.films), ["b.mp4", "V 01.mp4", "a.mp4"]);
  assert.deepEqual(s.manifest.films.map((f) => f.title), ["Wedding Film 01", "Wedding Film 02", "A"]);
  assert.ok(s.warnings.some((w) => w.includes("missing.mp4")));
  assert.ok(s.warnings.some((w) => w.includes('"a.mp4"') && w.includes("non-empty")));
  assert.ok(s.ignored.includes("/media/home/films/films.json"), "the settings file is not uploaded");
  await s.cleanup();
});

test("the same film is shown once: a home/films copy replaces the legacy film; repeats are withheld", async () => {
  const s = await site({
    "home/video/V 01.mp4": mp4({ seconds: 10 }),
    "home/films/1-new.mp4": mp4({ seconds: 20 }),
    "home/films/2-original.mp4": mp4({ seconds: 10 }),
    "home/films/3-again.mp4": mp4({ seconds: 20 }),
  });
  assert.deepEqual(names(s.manifest.films), ["1-new.mp4", "2-original.mp4"]);
  assert.ok(s.ignored.includes("/media/home/video/V%2001.mp4") || s.ignored.includes("/media/home/video/V 01.mp4"), "the legacy copy is not uploaded twice");
  assert.ok(s.ignored.includes("/media/home/films/3-again.mp4"));
  assert.ok(s.warnings.some((w) => w.includes("3-again.mp4") && w.includes("same film")));
  await s.cleanup();
});

test("a different film with the legacy film's filename is withheld (film URLs are keyed by filename)", async () => {
  const s = await site({ "home/video/film.mp4": mp4({ seconds: 10 }), "home/films/film.mp4": mp4({ seconds: 20 }) });
  assert.deepEqual(names(s.manifest.films), ["film.mp4"]);
  assert.equal(s.manifest.films[0].src, "/media/home/video/film.mp4");
  assert.ok(s.warnings.some((w) => w.includes("home/films/film.mp4") && w.includes("rename")));
  await s.cleanup();
});

test("invalid, non-H.264 and non-MP4 files in home/films are skipped with a reason", async () => {
  const s = await site({
    "home/films/a.mp4": "not a video",
    "home/films/b.mp4": mp4({ codec: "hvc1" }),
    "home/films/c.mov": "x",
    "home/films/d.mp4": mp4(),
  });
  assert.deepEqual(names(s.manifest.films), ["d.mp4"]);
  assert.ok(s.warnings.some((w) => w.includes("a.mp4") && w.includes("not a readable MP4")));
  assert.ok(s.warnings.some((w) => w.includes("b.mp4") && w.includes("H.264")));
  assert.ok(s.warnings.some((w) => w.includes("c.mov") && w.includes(".mp4")));
  await s.cleanup();
});

test("fallback titles are the tidied filename — nothing is invented", () => {
  assert.equal(titleFromFilename("wedding-film_02.mp4"), "Wedding Film 02");
  assert.equal(titleFromFilename("V 01.mp4"), "V 01");
  assert.equal(titleFromFilename("Our Highlights.mp4"), "Our Highlights");
  assert.equal(titleFromFilename("---.mp4"), "Film");
});
