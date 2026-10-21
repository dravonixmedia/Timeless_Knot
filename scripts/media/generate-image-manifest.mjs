#!/usr/bin/env node
/**
 * Timeless Knot — build-time image and video discovery.
 *
 * Scans the approved folders inside `public/media/`, reads every supported
 * image's real dimensions, validates story metadata, collects the homepage
 * films from `home/video/` and `home/films/` (see selectHomeFilms), and writes:
 *
 *   1. src/content/generated/media-manifest.json — typed data bundled into the
 *      site at build time (the Cloudflare Worker never touches the filesystem).
 *   2. public/.assetsignore — keeps everything that is NOT a published,
 *      referenced image or video (drafts, unsupported files, notes, unapproved
 *      folders, oversized files) out of the Cloudflare static-asset upload.
 *   3. public/media-generated/film-posters/ — a poster frame for each homepage
 *      film without an uploaded poster, extracted with FFmpeg and cached by the
 *      film's content hash (see scripts/media/film-posters.mjs).
 *   4. public/media-cache/<content hash>/<file> — a copy of every published
 *      photograph at a content-addressed URL. The URL changes whenever the
 *      photograph's bytes change, so it can be cached as immutable by browsers
 *      and Cloudflare (public/_headers) and a replaced photograph — even one
 *      uploaded under the same filename — is picked up on the next deployment.
 *
 * Content problems never break the build: the affected image or story is
 * skipped and reported. Run with --strict to exit non-zero on any warning
 * (useful as a pre-merge check: `npm run media:check`).
 */

import { readdir, readFile, stat, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";
import { readMp4 } from "./read-mp4.mjs";
import { ensurePoster, findFfmpeg, pruneCache } from "./film-posters.mjs";

export const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
/** Cloudflare Workers static assets reject files larger than 25 MiB. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Above this, the image still publishes but a warning suggests resizing. */
export const LARGE_FILE_BYTES = 8 * 1024 * 1024;

/** Single-collection folders, mapped to the page sections that use them. */
export const SITE_COLLECTIONS = ["home/hero", "home/featured", "about", "experience", "contact"];

/** Legacy homepage film folder: one MP4 (H.264) plus an optional poster image. */
export const VIDEO_DIR = "home/video";
/** Homepage film collection: any number of MP4s (H.264), each with an optional poster. */
export const FILMS_DIR = "home/films";
export const VIDEO_EXTENSIONS = new Set([".mp4"]);
/** Above this a video still publishes, with a warning to compress it. */
export const LARGE_VIDEO_BYTES = 15 * 1024 * 1024;
/** H.264 sample entries: the codec every browser can play from an MP4. */
const PLAYABLE_CODECS = new Set(["avc1", "avc3"]);

/** Story roots: each subfolder is one story (slug = folder name). */
export const STORY_ROOTS = {
  weddings: "Wedding Photography",
  "pre-wedding": "Pre-Wedding",
  couples: "Couple Story",
};

/**
 * Category galleries: photographs placed directly in one of these folders form
 * that category's portfolio gallery. No story.json needed. The story roots are
 * galleries too (their subfolders are stories); beyond-the-frame/ is a gallery
 * only.
 */
export const GALLERY_LABELS = {
  weddings: { title: "Weddings", alt: "Wedding photograph by Timeless Knot" },
  "pre-wedding": { title: "Pre-Wedding", alt: "Pre-wedding portrait by Timeless Knot" },
  couples: { title: "Couples", alt: "Couple portrait by Timeless Knot" },
  "beyond-the-frame": { title: "Beyond the Frame", alt: "Beyond the Frame — photograph by Timeless Knot" },
};

export const STORY_CATEGORIES = ["Wedding Photography", "Wedding Film", "Elopement", "Pre-Wedding", "Couple Story"];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FOCAL = /^\d{1,3}% \d{1,3}%$/;
const EMBED_HOSTS = new Set(["www.youtube-nocookie.com", "www.youtube.com", "youtube.com", "player.vimeo.com"]);

/** Locale-independent natural sort: "2.jpg" before "10.jpg", stable across machines. */
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const byName = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);

const toPosix = (p) => p.split(path.sep).join("/");
/** Content fingerprint: first 16 hex chars of the SHA-256 of the file's bytes. */
export const contentHash = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);
const publicUrl = (relFromPublic) => "/" + toPosix(relFromPublic).split("/").map(encodeURIComponent).join("/");
const isHidden = (name) => name.startsWith(".") || name.startsWith("_");

/* ------------------------------------------------------------------------ */
/* Alt text                                                                  */
/* ------------------------------------------------------------------------ */

/** Single words that say where a photo goes, not what it shows. */
const GENERIC_NAMES = new Set(["hero", "cover", "banner", "main", "featured", "feature", "portrait", "landscape", "image", "photo", "picture", "gallery", "untitled", "final", "edit"]);

const CAMERA_NAME = /^(img|dsc|dscf|dscn|dji|gopr|pxl|mvimg|_mg|p\d{3}|image|photo|picture|screenshot|whatsapp)[\s_-]*\d*/i;

/**
 * Turns a descriptive filename into alt text ("03-first-dance.jpg" → "First dance").
 * Returns null for camera-style names (IMG_1234, DSC01234…) that describe nothing.
 */
export function describeFromFilename(file) {
  let base = path.parse(file).name;
  base = base.replace(/^\d+[\s._-]+/, ""); // ordering prefix
  if (CAMERA_NAME.test(base) && !/[a-z]{3,}[\s_-]+[a-z]{3,}/i.test(base.replace(CAMERA_NAME, ""))) return null;
  const words = base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    // Tokens containing digits are numbers, dates, versions or hashes
    // ("66d304c1a5952aae…") — never descriptive words.
    .filter((w) => !/\d/.test(w) && !/^(final|edit|edited|web|copy|hi?res|lowres|export)$/i.test(w));
  if (!words.some((w) => /[a-z]{3,}/i.test(w))) return null;
  const text = words.join(" ").toLowerCase();
  if (GENERIC_NAMES.has(text)) return null;
  // Short fragments ("wed 01", "cou 03") describe nothing.
  const meaningful = words.filter((w) => /[a-z]{3,}/i.test(w));
  if (meaningful.length < 2 && !(meaningful.length === 1 && meaningful[0].length >= 5)) return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------------ */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------ */

async function listDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function readJson(file, report) {
  if (!existsSync(file)) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(await readFile(file, "utf8")) };
  } catch (error) {
    report.warn(`${file}: invalid JSON (${error.message.split("\n")[0]})`);
    return { ok: false, value: null };
  }
}

/** Per-image overrides: { "file.jpg": "alt text" } or { "file.jpg": { alt, focal } }. */
function imageOverrides(raw, where, report) {
  const map = new Map();
  if (raw == null) return map;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    report.warn(`${where}: "images" must be an object keyed by filename — ignored`);
    return map;
  }
  for (const [file, value] of Object.entries(raw)) {
    if (file === "order") continue;
    const entry = typeof value === "string" ? { alt: value } : value;
    if (!entry || typeof entry !== "object") continue;
    const clean = {};
    if (typeof entry.alt === "string" && entry.alt.trim()) clean.alt = entry.alt.trim();
    if (typeof entry.focal === "string") {
      if (FOCAL.test(entry.focal.trim())) clean.focal = entry.focal.trim();
      else report.warn(`${where}: focal for "${file}" must look like "50% 30%" — ignored`);
    }
    map.set(file, clean);
  }
  return map;
}

/**
 * Reads every supported image in a single folder (non-recursive), in
 * deterministic order. Unsupported, unreadable or oversized files are skipped.
 */
async function readImages(absDir, publicDir, report, { order } = {}) {
  const entries = (await listDir(absDir)).filter((e) => e.isFile() && !isHidden(e.name));
  const names = [];
  for (const entry of entries) {
    const ext = path.extname(entry.name).toLowerCase();
    const rel = toPosix(path.relative(publicDir, path.join(absDir, entry.name)));
    if (entry.name === "story.json" || entry.name === "images.json") continue;
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      report.warn(`${rel}: unsupported file type "${ext || "none"}" — not published`);
      continue;
    }
    names.push(entry.name);
  }

  names.sort(byName);
  if (Array.isArray(order) && order.length) {
    const listed = order.filter((n) => typeof n === "string" && names.includes(n));
    for (const missing of order.filter((n) => typeof n === "string" && !names.includes(n))) {
      report.warn(`${toPosix(path.relative(publicDir, absDir))}: "order" lists "${missing}" which does not exist`);
    }
    const rest = names.filter((n) => !listed.includes(n));
    names.splice(0, names.length, ...listed, ...rest);
  }

  const images = [];
  for (const name of names) {
    const abs = path.join(absDir, name);
    const rel = toPosix(path.relative(publicDir, abs));
    const info = await stat(abs);
    if (info.size === 0) {
      report.warn(`${rel}: empty file — skipped`);
      continue;
    }
    if (info.size > MAX_FILE_BYTES) {
      report.warn(`${rel}: ${(info.size / 1048576).toFixed(1)} MB exceeds Cloudflare's 25 MB asset limit — skipped (please resize)`);
      continue;
    }
    let dims;
    let bytes;
    try {
      bytes = await readFile(abs);
      dims = imageSize(bytes);
    } catch {
      dims = null;
    }
    if (!dims?.width || !dims?.height) {
      report.warn(`${rel}: unreadable or corrupt image — skipped`);
      continue;
    }
    const declared = path.extname(name).toLowerCase().replace("jpeg", "jpg").slice(1);
    const actual = String(dims.type).replace("jpeg", "jpg");
    if (actual !== declared) {
      report.warn(`${rel}: file is really ${dims.type.toUpperCase()} but named .${declared} — skipped (rename or re-export)`);
      continue;
    }
    if (info.size > LARGE_FILE_BYTES) {
      report.warn(`${rel}: ${(info.size / 1048576).toFixed(1)} MB — consider exporting at ~2400px / under 3 MB`);
    }
    // EXIF orientations 5–8 are displayed rotated by 90°.
    const rotated = dims.orientation && dims.orientation >= 5;
    images.push({
      file: name,
      src: publicUrl(rel),
      rel,
      width: rotated ? dims.height : dims.width,
      height: rotated ? dims.width : dims.height,
      hash: contentHash(bytes),
    });
  }
  return images;
}

function withAlt(images, overrides, fallback, where, report) {
  let generic = 0;
  const out = images.map((img, i) => {
    const o = overrides.get(img.file) ?? {};
    const described = describeFromFilename(img.file);
    let alt = o.alt;
    if (!alt) {
      alt = described ? fallback.describe(described) : fallback.generic(i, images.length);
      if (!described) generic += 1;
    }
    const { rel, ...rest } = img;
    void rel;
    return { ...rest, alt, ...(o.focal ? { focal: o.focal } : {}) };
  });
  if (generic) report.note(`${where}: ${generic} image(s) use generic alt text — add descriptions in images.json for better accessibility`);
  return out;
}

/* ------------------------------------------------------------------------ */
/* Story metadata                                                            */
/* ------------------------------------------------------------------------ */

const optionalString = (v) => v === undefined || (typeof v === "string" && v.trim().length > 0);

/** Returns a list of problems; an empty list means the metadata is valid. */
export function validateStoryMetadata(meta) {
  const problems = [];
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return ["story.json must contain a JSON object"];
  if (typeof meta.published !== "boolean") problems.push('"published" must be true or false');
  if (typeof meta.title !== "string" || !meta.title.trim()) problems.push('"title" is required');
  for (const key of ["couple", "location", "excerpt", "closing", "cover"]) {
    if (!optionalString(meta[key])) problems.push(`"${key}" must be a non-empty string when present`);
  }
  if (meta.date !== undefined) {
    const valid = typeof meta.date === "string" && ISO_DATE.test(meta.date) && !Number.isNaN(Date.parse(`${meta.date}T00:00:00Z`)) && new Date(`${meta.date}T00:00:00Z`).toISOString().startsWith(meta.date);
    if (!valid) problems.push('"date" must be a real date in YYYY-MM-DD format');
  }
  if (meta.category !== undefined && !STORY_CATEGORIES.includes(meta.category)) {
    problems.push(`"category" must be one of: ${STORY_CATEGORIES.join(", ")}`);
  }
  if (meta.featured !== undefined && typeof meta.featured !== "boolean") problems.push('"featured" must be true or false');
  if (meta.position !== undefined && !(Number.isInteger(meta.position) && meta.position >= 0)) problems.push('"position" must be a whole number ≥ 0');
  for (const key of ["introduction", "statements", "order"]) {
    if (meta[key] !== undefined && !(Array.isArray(meta[key]) && meta[key].every((s) => typeof s === "string" && s.trim()))) {
      problems.push(`"${key}" must be a list of non-empty strings`);
    }
  }
  if (meta.film !== undefined) {
    const f = meta.film;
    if (!f || typeof f !== "object" || Array.isArray(f)) problems.push('"film" must be an object');
    else {
      let host = null;
      try {
        const url = new URL(f.embedUrl);
        host = url.protocol === "https:" ? url.hostname : null;
      } catch {
        host = null;
      }
      if (!host || !EMBED_HOSTS.has(host)) problems.push('"film.embedUrl" must be an https YouTube (youtube-nocookie.com) or Vimeo (player.vimeo.com) embed URL');
      for (const key of ["title", "poster", "duration"]) if (!optionalString(f[key])) problems.push(`"film.${key}" must be a non-empty string when present`);
    }
  }
  if (meta.seo !== undefined) {
    if (!meta.seo || typeof meta.seo !== "object") problems.push('"seo" must be an object');
    else for (const key of ["title", "description"]) if (!optionalString(meta.seo[key])) problems.push(`"seo.${key}" must be a non-empty string when present`);
  }
  return problems;
}

async function readStory(root, slug, absDir, publicDir, report, seen) {
  const where = toPosix(path.relative(publicDir, absDir));
  const { ok, value: meta } = await readJson(path.join(absDir, "story.json"), report);
  if (!ok) return { status: "invalid" };
  if (!meta) {
    report.warn(`${where}: no story.json — story not published`);
    return { status: "missing" };
  }
  if (!SLUG.test(slug)) {
    report.warn(`${where}: folder name must be lowercase-words-with-hyphens (it becomes the URL) — not published`);
    return { status: "invalid" };
  }
  const problems = validateStoryMetadata(meta);
  if (problems.length) {
    report.warn(`${where}/story.json: ${problems.join("; ")} — not published`);
    return { status: "invalid" };
  }
  if (!meta.published) {
    report.note(`${where}: draft (published: false) — not published`);
    return { status: "draft" };
  }
  if (seen.has(slug)) {
    report.warn(`${where}: slug "${slug}" is already used by ${seen.get(slug)} — not published`);
    return { status: "invalid" };
  }

  const found = await readImages(absDir, publicDir, report, { order: meta.order });
  if (!found.length) {
    report.warn(`${where}: no valid images — not published`);
    return { status: "empty" };
  }

  const category = meta.category ?? STORY_ROOTS[root];
  const context = [meta.couple, meta.location].filter(Boolean).join(", ");
  const label = `${meta.title}${context ? ` (${context})` : ""}`;
  const images = withAlt(
    found,
    imageOverrides(meta.images, `${where}/story.json`, report),
    {
      describe: (d) => `${d} — ${label}`,
      generic: (i, n) => `${category} photograph ${i + 1} of ${n} from ${label}`,
    },
    where,
    report,
  );

  const pick = (file, key) => {
    if (!file) return null;
    const hit = images.find((img) => img.file === file);
    if (!hit) report.warn(`${where}/story.json: "${key}" refers to "${file}" which is not a valid image — using default`);
    return hit ?? null;
  };
  const cover = pick(meta.cover, "cover") ?? images[0];
  const gallery = images.filter((img) => img !== cover);

  let film;
  if (meta.film) {
    const poster = pick(meta.film.poster, "film.poster") ?? cover;
    film = {
      title: meta.film.title ?? `${meta.title} — Wedding Film`,
      embedUrl: meta.film.embedUrl,
      poster,
      ...(meta.film.duration ? { duration: meta.film.duration } : {}),
    };
  }

  seen.set(slug, where);
  const strip = ({ file, ...img }) => {
    void file;
    return img;
  };
  return {
    status: "published",
    story: {
      slug,
      collection: root,
      title: meta.title.trim(),
      ...(meta.couple ? { couple: meta.couple.trim() } : {}),
      ...(meta.location ? { location: meta.location.trim() } : {}),
      ...(meta.date ? { date: meta.date } : {}),
      category,
      featured: meta.featured ?? false,
      ...(meta.position !== undefined ? { position: meta.position } : {}),
      ...(meta.excerpt ? { excerpt: meta.excerpt.trim() } : {}),
      introduction: (meta.introduction ?? []).map((p) => p.trim()),
      ...(meta.closing ? { closing: meta.closing.trim() } : {}),
      statements: (meta.statements ?? []).map((s) => s.trim()),
      cover: strip(cover),
      gallery: gallery.map(strip),
      ...(film ? { film: { ...film, poster: strip(film.poster) } } : {}),
      ...(meta.seo ? { seo: meta.seo } : {}),
    },
    files: images.map((img) => img.src),
  };
}

/* ------------------------------------------------------------------------ */
/* Homepage films                                                            */
/* ------------------------------------------------------------------------ */

/**
 * Validates one uploaded MP4 and returns its manifest entry, or null (with a
 * warning) when it cannot be published.
 */
async function inspectVideo(abs, rel, publicDir, report) {
  const { size } = await stat(abs);
  if (size === 0) {
    report.warn(`${rel}: empty file — skipped`);
    return null;
  }
  if (size > MAX_FILE_BYTES) {
    report.warn(`${rel}: ${(size / 1048576).toFixed(1)} MB exceeds Cloudflare's 25 MB asset limit — skipped (please compress; see docs/IMAGE-UPLOADS.md)`);
    return null;
  }
  const bytes = await readFile(abs);
  const info = readMp4(bytes);
  if (!info) {
    report.warn(`${rel}: not a readable MP4 video — skipped`);
    return null;
  }
  if (!PLAYABLE_CODECS.has(info.codec)) {
    report.warn(`${rel}: video codec "${info.codec}" does not play in every browser — skipped (export as H.264 MP4)`);
    return null;
  }
  if (!info.fastStart) report.warn(`${rel}: not optimised for streaming — playback starts only after a large part downloads (export with "fast start" / "web optimised")`);
  if (size > LARGE_VIDEO_BYTES) report.warn(`${rel}: ${(size / 1048576).toFixed(1)} MB — consider compressing to under 15 MB for faster loading`);
  return { src: publicUrl(path.relative(publicDir, abs)), type: "video/mp4", width: info.width, height: info.height, duration: info.duration, hasAudio: info.hasAudio, bytes: size, hash: contentHash(bytes) };
}

/** Reads a poster image's real dimensions; undefined (with a warning) when unusable. */
async function readPoster(absDir, name, where, publicDir, report) {
  const abs = path.join(absDir, name);
  let dims = null;
  let bytes;
  try {
    if ((await stat(abs)).size <= MAX_FILE_BYTES) {
      bytes = await readFile(abs);
      dims = imageSize(bytes);
    }
  } catch {
    dims = null;
  }
  if (!dims?.width || !dims?.height) {
    report.warn(`${where}/${name}: unreadable or oversized poster image — the video is shown without it`);
    return undefined;
  }
  const rotated = dims.orientation && dims.orientation >= 5;
  return { src: publicUrl(path.relative(publicDir, abs)), width: rotated ? dims.height : dims.width, height: rotated ? dims.width : dims.height, alt: "", hash: contentHash(bytes) };
}

async function listFiles(absDir) {
  return (await listDir(absDir)).filter((e) => e.isFile() && !isHidden(e.name)).map((e) => e.name).sort(byName);
}

/**
 * Picks the legacy homepage film from public/media/home/video/.
 *
 * Deterministic: the first valid .mp4 in natural filename order is used
 * (`01-…` before `02-…`); any others are withheld. A poster is optional — an
 * image with the same name as the video (`film.mp4` + `film.jpg`), otherwise
 * one named `poster.*`. With no valid video the result is null.
 */
export async function selectHomeVideo(publicDir, report) {
  const absDir = path.join(publicDir, "media", ...VIDEO_DIR.split("/"));
  const where = `media/${VIDEO_DIR}`;
  const files = await listFiles(absDir);
  const videos = files.filter((name) => VIDEO_EXTENSIONS.has(path.extname(name).toLowerCase()));
  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext) && !SUPPORTED_EXTENSIONS.has(ext)) {
      report.warn(`${where}/${name}: unsupported file type "${ext || "none"}" — not published (videos must be .mp4)`);
    }
  }

  let chosen = null;
  for (const name of videos) {
    const rel = `${where}/${name}`;
    if (chosen) {
      report.warn(`${rel}: only one homepage video is shown from home/video — "${chosen.file}" is used (first by name); this file is not published (put more films in home/films/)`);
      continue;
    }
    const entry = await inspectVideo(path.join(absDir, name), rel, publicDir, report);
    if (entry) chosen = { file: name, ...entry };
  }
  if (!chosen) return null;

  // Optional poster: same base name as the video, else poster.*
  const base = path.parse(chosen.file).name.toLowerCase();
  const images = files.filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()));
  const posterName = images.find((n) => path.parse(n).name.toLowerCase() === base) ?? images.find((n) => path.parse(n).name.toLowerCase() === "poster");
  const poster = posterName ? await readPoster(absDir, posterName, where, publicDir, report) : undefined;
  for (const name of images) {
    if (name !== posterName) report.warn(`${where}/${name}: not used — a poster must share the video's name ("${base}.jpg") or be named poster.jpg`);
  }

  const { file, ...video } = chosen;
  void file;
  return { ...video, ...(poster ? { poster } : {}) };
}

/**
 * Readable fallback title from a filename: separators become spaces and an
 * all-lower-case name is capitalised ("wedding-film_02.mp4" → "Wedding Film 02").
 * Nothing is invented — it is the filename, tidied.
 */
export function titleFromFilename(file) {
  const words = path.parse(file).name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return "Film";
  return words === words.toLowerCase() ? words.replace(/(^|\s)(\p{L})/gu, (m, sp, ch) => sp + ch.toUpperCase()) : words;
}

/**
 * Every homepage film, in display order (the first is the featured film).
 *
 * Sources: the legacy single film from home/video/ (selectHomeVideo, kept so
 * the existing film keeps working unchanged) plus every valid MP4 in
 * home/films/. Each film may have a poster image with the same base name
 * (`ceremony.mp4` + `ceremony.jpg`).
 *
 * Order: by default the legacy film comes first (it is the current featured
 * film), then home/films/ in natural filename order. An optional
 * home/films/films.json reorders and titles them, by filename:
 *
 *   { "order": ["ceremony.mp4", "V 01.mp4"], "ceremony.mp4": "Wedding Film 01" }
 *
 * Films listed in "order" come first, in that order; the rest follow in the
 * default order. A film without a title uses its tidied filename.
 *
 * Duplicates are shown once: a film in home/films/ with the same content as
 * the legacy film replaces it (taking its place in home/films/ order), and a
 * repeated file inside home/films/ is withheld. Film URLs are keyed by
 * filename, so a different film sharing the legacy film's filename is withheld
 * with a request to rename it.
 */
export async function selectHomeFilms(publicDir, legacy, report) {
  const absDir = path.join(publicDir, "media", ...FILMS_DIR.split("/"));
  const where = `media/${FILMS_DIR}`;
  const files = await listFiles(absDir);
  const { value: config } = await readJson(path.join(absDir, "films.json"), report);
  const settings = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  if (config !== null && settings !== config) report.warn(`${where}/films.json: must be an object — ignored`);

  const images = files.filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()));
  const usedPosters = new Set();
  const legacyFile = legacy ? decodeURIComponent(legacy.src.split("/").pop()) : null;
  const pool = [];
  let legacyReplaced = false;

  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (name === "films.json" || SUPPORTED_EXTENSIONS.has(ext)) continue;
    const rel = `${where}/${name}`;
    if (!VIDEO_EXTENSIONS.has(ext)) {
      report.warn(`${rel}: unsupported file type "${ext || "none"}" — not published (films must be .mp4, H.264)`);
      continue;
    }
    const entry = await inspectVideo(path.join(absDir, name), rel, publicDir, report);
    if (!entry) continue;
    const twin = pool.find((f) => f.hash === entry.hash);
    if (twin) {
      report.warn(`${rel}: the same film as "${twin.file}" — shown once; this copy is not published`);
      continue;
    }
    if (legacy && entry.hash === legacy.hash) legacyReplaced = true;
    else if (name === legacyFile) {
      report.warn(`${rel}: shares its filename with the film in home/video/ — rename it so each film has its own address; not published`);
      continue;
    }
    const base = path.parse(name).name.toLowerCase();
    const posterName = images.find((n) => path.parse(n).name.toLowerCase() === base);
    let poster;
    if (posterName) {
      usedPosters.add(posterName);
      poster = await readPoster(absDir, posterName, where, publicDir, report);
    }
    pool.push({ file: name, ...entry, ...(poster ? { poster } : {}) });
  }
  for (const name of images) {
    if (!usedPosters.has(name)) report.warn(`${where}/${name}: not used — a poster must share its film's name ("ceremony.mp4" + "ceremony.jpg")`);
  }
  if (legacy && !legacyReplaced) pool.unshift({ file: legacyFile, ...legacy });

  // Optional explicit order, then the default order for everything else.
  const order = Array.isArray(settings.order) ? settings.order.filter((n) => typeof n === "string") : [];
  if (settings.order !== undefined && !Array.isArray(settings.order)) report.warn(`${where}/films.json: "order" must be a list of filenames — ignored`);
  for (const name of order) if (!pool.some((f) => f.file === name)) report.warn(`${where}/films.json: "${name}" in "order" is not a published film — ignored`);
  const rank = (f) => (order.includes(f.file) ? order.indexOf(f.file) : order.length + pool.indexOf(f));
  const sorted = [...pool].sort((a, b) => rank(a) - rank(b));

  return sorted.map(({ file, ...film }) => {
    const configured = settings[file];
    const title = typeof configured === "string" && configured.trim() ? configured.trim() : titleFromFilename(file);
    if (configured !== undefined && !(typeof configured === "string" && configured.trim())) {
      report.warn(`${where}/films.json: the title for "${file}" must be a non-empty string — the filename is used`);
    }
    return { id: film.hash, title, ...film };
  });
}

/**
 * Gives every film without an uploaded poster a generated one (an uploaded
 * poster always wins). Posters come from the cache when the film is unchanged,
 * otherwise from FFmpeg; they are written to `outDir` (inside public/, so the
 * fingerprinted copy can be made) and recorded on the film like an uploaded
 * poster, marked `generated`. Without FFmpeg or a cached poster the film keeps
 * no poster, as before.
 */
async function addGeneratedPosters(films, { publicDir, cacheDir, outDir, ffmpeg, report }) {
  await rm(outDir, { recursive: true, force: true });
  const missing = films.filter((film) => !film.poster);
  const keep = new Set();
  const stats = { generated: 0, cached: 0, without: 0 };
  let bin = ffmpeg;
  for (const film of missing) {
    if (bin === undefined) bin = findFfmpeg();
    const rel = decodeURIComponent(film.src.slice(1));
    const videoPath = path.join(publicDir, ...rel.split("/"));
    const result = await ensurePoster({ ffmpeg: bin, videoPath, videoHash: film.hash, duration: film.duration, cacheDir });
    if (!result) {
      stats.without++;
      if (bin) report.warn(`${rel}: no poster frame could be extracted — shown without a poster (upload one with the film's name to set it)`);
      continue;
    }
    keep.add(path.basename(result.file));
    const slug = path.parse(rel).name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "film";
    const dest = path.join(outDir, `${slug}-${film.hash.slice(0, 8)}.jpg`);
    await mkdir(outDir, { recursive: true });
    await copyFile(result.file, dest);
    const bytes = await readFile(dest);
    const dims = imageSize(bytes);
    film.poster = { src: publicUrl(path.relative(publicDir, dest)), width: dims.width, height: dims.height, alt: "", hash: contentHash(bytes), generated: true };
    stats[result.generated ? "generated" : "cached"]++;
  }
  if (stats.without && !bin) {
    report.note(`FFmpeg not found — ${stats.without} homepage film(s) shown without a poster. Install dependencies with optional packages (npm ci), or set FFMPEG_PATH; see docs/IMAGE-UPLOADS.md`);
  }
  await pruneCache(cacheDir, keep);
  return stats;
}

/** True when a file sits directly in a site collection or a story folder. */
function isRecognisedLocation(relFromPublic) {
  const parts = relFromPublic.split("/").slice(1, -1); // drop "media" and the filename
  const dir = parts.join("/");
  if (SITE_COLLECTIONS.includes(dir) || dir === VIDEO_DIR || dir === FILMS_DIR) return true;
  // weddings/<photo> is a category gallery; weddings/<story>/<photo> is a story.
  if (parts.length === 1 && Object.hasOwn(GALLERY_LABELS, parts[0])) return true;
  return parts.length === 2 && Object.hasOwn(STORY_ROOTS, parts[0]);
}

/* ------------------------------------------------------------------------ */
/* Main                                                                      */
/* ------------------------------------------------------------------------ */

/** Every manifest image (anything with a src and a content hash), wherever it is nested. */
function collectImages(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collectImages(n, out));
  else if (node && typeof node === "object") {
    if (typeof node.src === "string" && typeof node.hash === "string" && node.type !== "video/mp4") out.push(node);
    Object.values(node).forEach((n) => collectImages(n, out));
  }
  return out;
}

/**
 * Writes each published photograph to <cacheDir>/<hash>/<file>. The directory
 * is rebuilt from scratch, so photographs that were replaced or removed leave
 * nothing behind.
 */
async function writeFingerprintedCopies(publicDir, cacheDir, manifest) {
  await rm(cacheDir, { recursive: true, force: true });
  const done = new Set();
  for (const img of collectImages(manifest)) {
    const name = decodeURIComponent(img.src.split("/").pop());
    const dest = path.join(cacheDir, img.hash, name);
    if (done.has(dest)) continue;
    done.add(dest);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(path.join(publicDir, ...img.src.split("/").map(decodeURIComponent)), dest);
  }
  return done.size;
}

export async function generateManifest({ publicDir, outFile, ignoreFile, cacheDir, posters }) {
  const mediaDir = path.join(publicDir, "media");
  const warnings = [];
  const notes = [];
  const report = { warn: (m) => warnings.push(m), note: (m) => notes.push(m) };
  const published = new Set();

  // Site collections
  const collections = {};
  for (const name of SITE_COLLECTIONS) {
    const absDir = path.join(mediaDir, name);
    const { value: config } = await readJson(path.join(absDir, "images.json"), report);
    const found = await readImages(absDir, publicDir, report, { order: config?.order });
    const images = withAlt(
      found,
      imageOverrides(config, `media/${name}/images.json`, report),
      { describe: (d) => d, generic: () => "Wedding photograph by Timeless Knot" },
      `media/${name}`,
      report,
    ).map(({ file, ...img }) => {
      void file;
      return img;
    });
    images.forEach((img) => published.add(img.src));
    collections[name] = images;
  }

  // Category galleries: images directly inside weddings/, pre-wedding/, couples/, beyond-the-frame/
  const galleries = {};
  for (const root of Object.keys(GALLERY_LABELS)) {
    const absDir = path.join(mediaDir, root);
    const { value: config } = await readJson(path.join(absDir, "images.json"), report);
    const found = await readImages(absDir, publicDir, report, { order: config?.order });
    const label = GALLERY_LABELS[root];
    galleries[root] = withAlt(
      found,
      imageOverrides(config, `media/${root}/images.json`, report),
      { describe: (d) => `${d} — ${label.alt}`, generic: () => label.alt },
      `media/${root}`,
      report,
    ).map(({ file, ...img }) => {
      void file;
      return img;
    });
    galleries[root].forEach((img) => published.add(img.src));
  }

  // Stories
  const stories = [];
  const seen = new Map();
  for (const root of Object.keys(STORY_ROOTS)) {
    const rootDir = path.join(mediaDir, root);
    const dirs = (await listDir(rootDir)).filter((e) => e.isDirectory() && !isHidden(e.name)).map((e) => e.name).sort(byName);
    for (const slug of dirs) {
      const result = await readStory(root, slug, path.join(rootDir, slug), publicDir, report, seen);
      if (result.status === "published") {
        stories.push(result.story);
        result.files.forEach((src) => published.add(src));
      }
    }
  }
  // Display order: explicit position, then newest date, then title.
  stories.sort(
    (a, b) =>
      (a.position ?? Infinity) - (b.position ?? Infinity) ||
      (b.date ?? "").localeCompare(a.date ?? "") ||
      byName(a.title, b.title) ||
      byName(a.slug, b.slug),
  );

  // Homepage films: the legacy home/video/ film plus home/films/
  const video = await selectHomeVideo(publicDir, report);
  const films = await selectHomeFilms(publicDir, video, report);
  // Posters for films without an uploaded one — before the manifest is written.
  const posterStats = posters ? await addGeneratedPosters(films, { publicDir, report, ...posters }) : null;
  for (const film of films) {
    published.add(film.src);
    if (film.poster) published.add(film.poster.src);
  }

  const manifest = { version: 1, collections, galleries, stories, video, films };
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(manifest, null, 2) + "\n");
  const fingerprinted = cacheDir ? await writeFingerprintedCopies(publicDir, cacheDir, manifest) : 0;

  // Everything under /media that is not a published image or video stays out of the upload.
  const unpublished = [];
  const walk = async (dir) => {
    for (const entry of await listDir(dir)) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else if (!published.has(publicUrl(path.relative(publicDir, abs)))) {
        const rel = toPosix(path.relative(publicDir, abs));
        unpublished.push("/" + rel);
        if (!isHidden(entry.name) && !isRecognisedLocation(rel)) {
          report.warn(`${rel}: not in a recognised upload folder — not published (see docs/IMAGE-UPLOADS.md)`);
        }
      }
    }
  };
  await walk(mediaDir);
  unpublished.sort(byName);
  if (ignoreFile) {
    const escape = (p) => p.replace(/([\\*?[\]!#])/g, "\\$1").replace(/^(\s)|(\s)$/g, "\\$1$2");
    await writeFile(
      ignoreFile,
      [
        "# Generated by scripts/media/generate-image-manifest.mjs — do not edit.",
        "# Files in public/media that are not published images or videos are excluded from the Cloudflare upload.",
        ...unpublished.map(escape),
        "# Generated film posters are served from their fingerprinted copies in /media-cache.",
        "/media-generated",
        "",
      ].join("\n"),
    );
  }

  return { manifest, warnings, notes, unpublished, fingerprinted, posterStats };
}

/* ------------------------------------------------------------------------ */
/* CLI                                                                       */
/* ------------------------------------------------------------------------ */

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const strict = process.argv.includes("--strict");
  const quiet = process.argv.includes("--quiet");
  const { manifest, warnings, notes, unpublished, fingerprinted, posterStats } = await generateManifest({
    publicDir: path.join(root, "public"),
    outFile: path.join(root, "src/content/generated/media-manifest.json"),
    ignoreFile: path.join(root, "public/.assetsignore"),
    cacheDir: path.join(root, "public/media-cache"),
    posters: {
      // Survives between local builds (and Cloudflare builds that restore node_modules);
      // posters are only extracted again when a film's content changes.
      cacheDir: path.join(root, "node_modules/.cache/timeless-knot/film-posters"),
      outDir: path.join(root, "public/media-generated/film-posters"),
    },
  });
  const counts = [...Object.entries(manifest.collections), ...Object.entries(manifest.galleries).map(([k, v]) => [`gallery/${k}`, v])]
    .map(([k, v]) => `${k}: ${v.length}`)
    .join(", ");
  const film = manifest.films.length
    ? `home films: ${manifest.films.map((f) => `${decodeURIComponent(f.src.split("/").pop())} (${f.width}×${f.height}, ${(f.bytes / 1048576).toFixed(1)} MB${f.poster ? (f.poster.generated ? ", generated poster" : ", poster") : ""})`).join(", ")}`
    : "home films: none";
  const posterLine = posterStats && posterStats.generated + posterStats.cached
    ? `; film posters: ${posterStats.generated} generated, ${posterStats.cached} from cache`
    : "";
  console.log(`[media] ${manifest.stories.length} published stor${manifest.stories.length === 1 ? "y" : "ies"}; ${counts}; ${film}${posterLine}; ${fingerprinted} fingerprinted photo URL(s); ${unpublished.length} file(s) withheld from upload`);
  if (!quiet) notes.forEach((m) => console.log(`[media] note: ${m}`));
  warnings.forEach((m) => console.warn(`[media] warning: ${m}`));
  if (strict && warnings.length) {
    console.error(`[media] ${warnings.length} warning(s) — failing because --strict was given`);
    process.exit(1);
  }
}
