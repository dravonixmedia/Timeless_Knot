#!/usr/bin/env node
/**
 * Timeless Knot — build-time image discovery.
 *
 * Scans the approved folders inside `public/media/`, reads every supported
 * image's real dimensions, validates story metadata, and writes:
 *
 *   1. src/content/generated/media-manifest.json — typed data bundled into the
 *      site at build time (the Cloudflare Worker never touches the filesystem).
 *   2. public/.assetsignore — keeps everything that is NOT a published,
 *      referenced image (drafts, unsupported files, notes, unapproved folders)
 *      out of the Cloudflare static-asset upload.
 *
 * Content problems never break the build: the affected image or story is
 * skipped and reported. Run with --strict to exit non-zero on any warning
 * (useful as a pre-merge check: `npm run media:check`).
 */

import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";

export const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
/** Cloudflare Workers static assets reject files larger than 25 MiB. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Above this, the image still publishes but a warning suggests resizing. */
export const LARGE_FILE_BYTES = 8 * 1024 * 1024;

/** Single-collection folders, mapped to the page sections that use them. */
export const SITE_COLLECTIONS = ["home/hero", "home/featured", "about", "experience", "contact"];

/** Story roots: each subfolder is one story (slug = folder name). */
export const STORY_ROOTS = {
  weddings: "Wedding Photography",
  "pre-wedding": "Pre-Wedding",
  couples: "Couple Story",
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
    .filter((w) => !/^\d+$/.test(w) && !/^(final|edit|edited|web|copy|v\d+|hi?res|lowres|export)$/i.test(w));
  if (!words.some((w) => /[a-z]{3,}/i.test(w))) return null;
  const text = words.join(" ").toLowerCase();
  if (GENERIC_NAMES.has(text)) return null;
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
    try {
      dims = imageSize(await readFile(abs));
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

/** True when a file sits directly in a site collection or a story folder. */
function isRecognisedLocation(relFromPublic) {
  const parts = relFromPublic.split("/").slice(1, -1); // drop "media" and the filename
  const dir = parts.join("/");
  if (SITE_COLLECTIONS.includes(dir)) return true;
  return parts.length === 2 && Object.hasOwn(STORY_ROOTS, parts[0]);
}

/* ------------------------------------------------------------------------ */
/* Main                                                                      */
/* ------------------------------------------------------------------------ */

export async function generateManifest({ publicDir, outFile, ignoreFile }) {
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

  const manifest = { version: 1, collections, stories };
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(manifest, null, 2) + "\n");

  // Everything under /media that is not a published image stays out of the upload.
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
        "# Files in public/media that are not published images are excluded from the Cloudflare upload.",
        ...unpublished.map(escape),
        "",
      ].join("\n"),
    );
  }

  return { manifest, warnings, notes, unpublished };
}

/* ------------------------------------------------------------------------ */
/* CLI                                                                       */
/* ------------------------------------------------------------------------ */

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const strict = process.argv.includes("--strict");
  const quiet = process.argv.includes("--quiet");
  const { manifest, warnings, notes, unpublished } = await generateManifest({
    publicDir: path.join(root, "public"),
    outFile: path.join(root, "src/content/generated/media-manifest.json"),
    ignoreFile: path.join(root, "public/.assetsignore"),
  });
  const counts = Object.entries(manifest.collections).map(([k, v]) => `${k}: ${v.length}`).join(", ");
  console.log(`[media] ${manifest.stories.length} published stor${manifest.stories.length === 1 ? "y" : "ies"}; ${counts}; ${unpublished.length} file(s) withheld from upload`);
  if (!quiet) notes.forEach((m) => console.log(`[media] note: ${m}`));
  warnings.forEach((m) => console.warn(`[media] warning: ${m}`));
  if (strict && warnings.length) {
    console.error(`[media] ${warnings.length} warning(s) — failing because --strict was given`);
    process.exit(1);
  }
}
