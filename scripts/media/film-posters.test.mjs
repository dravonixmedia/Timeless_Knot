/**
 * Tests for build-time film posters (scripts/media/film-posters.mjs) and their
 * place in the media manifest. Short clips are made with FFmpeg on the fly, so
 * no footage is committed; without FFmpeg these tests are skipped.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";
import { extractPoster, findFfmpeg, MIN_BRIGHTNESS, POSTER_VERSION } from "./film-posters.mjs";
import { generateManifest } from "./generate-image-manifest.mjs";

const FFMPEG = findFfmpeg();
const skip = FFMPEG ? false : "FFmpeg is not available";
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

/** A real H.264 MP4 (fast start). `black` seconds of black open it, then a bright test pattern. */
function clip(file, { width = 640, height = 360, black = 0, seconds = 4, sar = "1" } = {}) {
  const parts = [];
  const inputs = [];
  if (black) {
    inputs.push("-f", "lavfi", "-i", `color=c=black:s=${width}x${height}:d=${black}:r=25`);
    parts.push(`[${parts.length}:v]setsar=${sar}[v${parts.length}]`);
  }
  inputs.push("-f", "lavfi", "-i", `testsrc2=s=${width}x${height}:d=${seconds}:r=25`);
  parts.push(`[${parts.length}:v]setsar=${sar}[v${parts.length}]`);
  const labels = parts.map((_, i) => `[v${i}]`).join("");
  const filter = `${parts.join(";")};${labels}concat=n=${parts.length}:v=1:a=0[out]`;
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", ...inputs, "-filter_complex", filter, "-map", "[out]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-movflags", "+faststart", "-y", file]);
  assert.equal(r.status, 0, r.stderr?.toString());
}

async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(), "tk-posters-"));
  const publicDir = path.join(root, "public");
  const films = path.join(publicDir, "media/home/films");
  await mkdir(films, { recursive: true });
  const posters = { cacheDir: path.join(root, "poster-cache"), outDir: path.join(publicDir, "media-generated/film-posters") };
  const run = (extra = {}) =>
    generateManifest({
      publicDir,
      outFile: path.join(root, "m.json"),
      ignoreFile: path.join(publicDir, ".assetsignore"),
      cacheDir: path.join(publicDir, "media-cache"),
      posters: { ...posters, ...extra },
    });
  return { root, publicDir, films, posters, run, cleanup: () => rm(root, { recursive: true, force: true }) };
}

test("a poster avoids black opening frames and keeps the film's proportions", { skip }, async () => {
  const w = await workspace();
  const video = path.join(w.films, "fade-in.mp4");
  clip(video, { black: 2, seconds: 4 });
  const out = path.join(w.root, "poster.jpg");
  const result = await extractPoster({ ffmpeg: FFMPEG, videoPath: video, duration: 6, outFile: out });
  assert.ok(result, "a poster is produced");
  // 22% in (1.3 s) falls in the black opening, so a later position is used;
  // `seconds` is where the search window starts — the chosen frame lies within it.
  assert.ok(result.seconds > 6 * 0.22, `the dark first position was passed over (window at ${result.seconds}s)`);
  assert.ok(result.brightness >= MIN_BRIGHTNESS, `bright enough (${result.brightness})`);
  assert.deepEqual(imageSize(await readFile(out)), { height: 360, width: 640, type: "jpg" });
  assert.deepEqual((await readdir(w.root)).filter((n) => n.startsWith("poster.jpg.")), [], "no candidate frames are left behind");
  await w.cleanup();
});

test("non-square pixels are shown at display proportions, and wide films are scaled down to 1920 px — never cropped", { skip }, async () => {
  const w = await workspace();
  const anamorphic = path.join(w.films, "anamorphic.mp4");
  clip(anamorphic, { width: 320, height: 360, sar: "2/1", seconds: 2 }); // displays as 640×360
  const a = path.join(w.root, "a.jpg");
  assert.ok(await extractPoster({ ffmpeg: FFMPEG, videoPath: anamorphic, duration: 2, outFile: a }));
  const da = imageSize(await readFile(a));
  assert.deepEqual([da.width, da.height], [640, 360]);

  const wide = path.join(w.films, "wide.mp4");
  clip(wide, { width: 2560, height: 1440, seconds: 1 });
  const b = path.join(w.root, "b.jpg");
  assert.ok(await extractPoster({ ffmpeg: FFMPEG, videoPath: wide, duration: 1, outFile: b }));
  const db = imageSize(await readFile(b));
  assert.deepEqual([db.width, db.height], [1920, 1080]);
  await w.cleanup();
});

test("films without an uploaded poster get a generated one; an uploaded poster always wins", { skip }, async () => {
  const w = await workspace();
  clip(path.join(w.films, "01-generated.mp4"), { seconds: 3 });
  clip(path.join(w.films, "02-uploaded.mp4"), { seconds: 3, width: 480, height: 360 });
  await copyFile(path.join(FIX, "landscape.jpg"), path.join(w.films, "02-uploaded.jpg"));
  const { manifest, posterStats } = await w.run();
  const [gen, up] = manifest.films;
  assert.equal(gen.poster.generated, true);
  assert.match(gen.poster.src, /^\/media-generated\/film-posters\/01-generated-[0-9a-f]{8}\.jpg$/);
  assert.deepEqual([gen.poster.width, gen.poster.height], [640, 360]);
  assert.ok(gen.poster.hash);
  assert.ok(existsSync(path.join(w.publicDir, "media-cache", gen.poster.hash, gen.poster.src.split("/").pop())), "fingerprinted copy for next/image");
  assert.equal(up.poster.src, "/media/home/films/02-uploaded.jpg");
  assert.equal(up.poster.generated, undefined);
  assert.deepEqual(posterStats, { generated: 1, cached: 0, without: 0 });
  assert.deepEqual(await readdir(w.posters.cacheDir), [`${gen.hash}-v${POSTER_VERSION}.jpg`], "only the film that needed one is cached");
  assert.match(await readFile(path.join(w.publicDir, ".assetsignore"), "utf8"), /^\/media-generated$/m, "originals stay out of the upload");
  await w.cleanup();
});

test("posters come from the cache until the film changes; stale entries are pruned", { skip }, async () => {
  const w = await workspace();
  const video = path.join(w.films, "film.mp4");
  clip(video, { seconds: 3 });
  const first = await w.run();
  assert.deepEqual(first.posterStats, { generated: 1, cached: 0, without: 0 });

  // Unchanged film: reused even with no FFmpeg at all.
  const second = await w.run({ ffmpeg: null });
  assert.deepEqual(second.posterStats, { generated: 0, cached: 1, without: 0 });
  assert.equal(second.manifest.films[0].poster.hash, first.manifest.films[0].poster.hash);

  // Replaced film (same filename, new content): regenerated, old cache entry removed.
  clip(video, { seconds: 3, width: 480, height: 360 });
  const third = await w.run();
  assert.deepEqual(third.posterStats, { generated: 1, cached: 0, without: 0 });
  assert.deepEqual([third.manifest.films[0].poster.width, third.manifest.films[0].poster.height], [480, 360]);
  assert.deepEqual(await readdir(w.posters.cacheDir), [`${third.manifest.films[0].hash}-v${POSTER_VERSION}.jpg`]);
  const published = await readdir(w.posters.outDir);
  assert.equal(published.length, 1, "only current posters are published");
  await w.cleanup();
});

test("without FFmpeg (and no cached poster) films publish without a poster and the build explains why", { skip }, async () => {
  const w = await workspace();
  clip(path.join(w.films, "film.mp4"), { seconds: 2 });
  const { manifest, posterStats, notes, warnings } = await w.run({ ffmpeg: null });
  assert.equal(manifest.films.length, 1);
  assert.equal(manifest.films[0].poster, undefined);
  assert.deepEqual(posterStats, { generated: 0, cached: 0, without: 1 });
  assert.ok(notes.some((n) => n.includes("FFmpeg not found")));
  assert.deepEqual(warnings, []);
  await w.cleanup();
});

test("a film FFmpeg cannot decode keeps playing without a poster, with a warning", { skip }, async () => {
  const w = await workspace();
  const good = path.join(w.root, "good.mp4");
  clip(good, { seconds: 2 });
  // Keep the header (so the film still validates) but drop every frame.
  const bytes = await readFile(good);
  const mdat = bytes.indexOf(Buffer.from("mdat")) - 4;
  await writeFile(path.join(w.films, "broken.mp4"), bytes.subarray(0, mdat));
  const { manifest, posterStats, warnings } = await w.run();
  assert.equal(manifest.films.length, 1, "the film is still published");
  assert.equal(manifest.films[0].poster, undefined);
  assert.deepEqual(posterStats, { generated: 0, cached: 0, without: 1 });
  assert.ok(warnings.some((m) => m.includes("broken.mp4") && m.includes("no poster frame")));
  assert.deepEqual(await readdir(w.posters.cacheDir).catch(() => []), [], "nothing half-written is cached");
  await w.cleanup();
});

test("FFMPEG_PATH pointing at something that is not FFmpeg is ignored", () => {
  assert.equal(findFfmpeg({ env: { FFMPEG_PATH: "/definitely/not/ffmpeg" } }), null);
});
