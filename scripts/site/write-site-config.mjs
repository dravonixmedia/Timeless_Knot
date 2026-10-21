/**
 * Captures the site's canonical origin at build time.
 *
 * Writes src/content/generated/site-config.json with the NEXT_PUBLIC_SITE_URL
 * build variable (or null when unset). Both the pages (src/config/site.ts) and
 * the Cloudflare Worker (custom-worker.ts) read this one file, and validate it
 * with resolveCanonicalOrigin() in src/lib/indexing.ts — so canonical URLs and
 * the Worker's indexing/redirect rules always come from the same value.
 *
 * Runs before `next build`, `next dev` and after install (package.json).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = path.join(root, "src/content/generated/site-config.json");

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify({ siteUrl }, null, 2)}\n`);
if (!process.argv.includes("--quiet")) {
  console.log(`[site] canonical origin: ${siteUrl ?? "default (src/lib/indexing.ts → DEFAULT_CANONICAL_ORIGIN)"}${siteUrl ? " (from NEXT_PUBLIC_SITE_URL)" : ""}`);
}
