/**
 * Build-time poster frames for homepage films.
 *
 * For a film without an uploaded poster, FFmpeg extracts one representative
 * still at build time (never in the Cloudflare Worker): it looks about a fifth
 * of the way in, lets FFmpeg's `thumbnail` filter pick the most representative
 * of the next couple of seconds' frames (skipping flashes and transitions), and
 * measures its brightness so a black or near-black frame (fades, title cards)
 * is passed over for a later or earlier moment.
 *
 * The frame keeps the film's display proportions — rotation and non-square
 * pixels are applied, nothing is cropped or stretched — and is scaled down (never
 * up) to at most 1920 px wide, as a JPEG. next/image then serves it as
 * AVIF/WebP at the size each preview needs.
 *
 * Posters are cached by the film's content hash (plus POSTER_VERSION), so a
 * film is only processed again when its bytes change.
 *
 * FFmpeg is found in this order: the FFMPEG_PATH environment variable, an
 * `ffmpeg` on the PATH, then the optional `@ffmpeg-installer/ffmpeg` package
 * (a static binary installed from npm — this is what Cloudflare's build image
 * uses, as it has no FFmpeg of its own). Without any, no posters are generated
 * and the site behaves as before.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

/** Bump when the extraction settings change, so cached posters are regenerated. */
export const POSTER_VERSION = 1;
/** Where in the film to look, as fractions of its duration, in order of preference. */
export const POSTER_POSITIONS = [0.22, 0.3, 0.15, 0.4, 0.55, 0.7];
/** Mean luma (0–255) below which a frame counts as too dark to represent the film. */
export const MIN_BRIGHTNESS = 32;
const MAX_WIDTH = 1920;
const TIMEOUT_MS = 60_000;

const works = (bin) => {
  try {
    return spawnSync(bin, ["-hide_banner", "-version"], { stdio: "ignore", timeout: 10_000 }).status === 0;
  } catch {
    return false;
  }
};

/** The FFmpeg binary to use, or null when none is available. */
export function findFfmpeg({ env = process.env } = {}) {
  if (env.FFMPEG_PATH) return works(env.FFMPEG_PATH) ? env.FFMPEG_PATH : null;
  if (works("ffmpeg")) return "ffmpeg";
  try {
    const bundled = createRequire(import.meta.url)("@ffmpeg-installer/ffmpeg").path;
    if (bundled && existsSync(bundled) && works(bundled)) return bundled;
  } catch {
    // optional dependency not installed on this platform
  }
  return null;
}

/**
 * Extracts one frame at `seconds` into `outFile`; returns its mean brightness,
 * or null when FFmpeg could not decode a frame there.
 */
function extractFrame(ffmpeg, videoPath, seconds, outFile) {
  const filters = [
    "thumbnail=24",
    // display proportions: square pixels, then fit within MAX_WIDTH (never upscale)
    "scale=trunc(iw*sar/2)*2:ih",
    "setsar=1",
    `scale='min(${MAX_WIDTH},iw)':-2`,
    "signalstats",
    "metadata=mode=print:key=lavfi.signalstats.YAVG:file=-",
  ].join(",");
  const result = spawnSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "error", "-ss", seconds.toFixed(3), "-i", videoPath, "-an", "-vf", filters, "-frames:v", "1", "-q:v", "3", "-y", outFile],
    { encoding: "utf8", timeout: TIMEOUT_MS },
  );
  if (result.status !== 0 || !existsSync(outFile)) return null;
  const match = /lavfi\.signalstats\.YAVG=([\d.]+)/.exec(result.stdout ?? "");
  return match ? Number(match[1]) : 0;
}

/**
 * Writes a poster for the film at `videoPath` to `outFile`. Tries each position
 * in POSTER_POSITIONS and keeps the first frame bright enough; if none is, the
 * brightest one found. Returns { seconds, brightness } or null on failure.
 */
export async function extractPoster({ ffmpeg, videoPath, duration, outFile }) {
  await mkdir(path.dirname(outFile), { recursive: true });
  const length = duration > 0 ? duration : 0;
  const tried = new Set();
  let best = null;
  for (const [i, fraction] of POSTER_POSITIONS.entries()) {
    // Very short or unknown durations fall back to the first second.
    const seconds = length > 2 ? Math.min(length - 1, length * fraction) : Math.min(1, length / 2);
    const key = seconds.toFixed(2);
    if (tried.has(key)) continue;
    tried.add(key);
    const candidate = `${outFile}.${i}.jpg`;
    const brightness = extractFrame(ffmpeg, videoPath, seconds, candidate);
    if (brightness === null) continue;
    if (!best || brightness > best.brightness) {
      if (best) await rm(best.file, { force: true });
      best = { file: candidate, seconds, brightness };
    } else {
      await rm(candidate, { force: true });
    }
    if (brightness >= MIN_BRIGHTNESS) break;
  }
  if (!best) return null;
  await rename(best.file, outFile);
  return { seconds: best.seconds, brightness: best.brightness };
}

/**
 * The cached poster for a film, generating it when missing. Returns the cache
 * file path, or null when FFmpeg is unavailable or no frame could be extracted.
 */
export async function ensurePoster({ ffmpeg, videoPath, videoHash, duration, cacheDir }) {
  const cached = path.join(cacheDir, `${videoHash}-v${POSTER_VERSION}.jpg`);
  if (existsSync(cached)) return { file: cached, generated: false };
  if (!ffmpeg) return null;
  const result = await extractPoster({ ffmpeg, videoPath, duration, outFile: cached });
  return result ? { file: cached, generated: true, ...result } : null;
}

/** Removes cached posters for films that are no longer published. */
export async function pruneCache(cacheDir, keep) {
  let removed = 0;
  for (const name of await readdir(cacheDir).catch(() => [])) {
    if (!keep.has(name)) {
      await rm(path.join(cacheDir, name), { force: true });
      removed++;
    }
  }
  return removed;
}
