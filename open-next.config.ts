import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * OpenNext adapter configuration for Cloudflare Workers.
 *
 * Every route is prerendered at build time and nothing revalidates, so the
 * read-only static-assets incremental cache serves prerendered pages straight
 * from the Worker's ASSETS binding — no R2 bucket or KV namespace required.
 * Switch to the R2 incremental cache if ISR / on-demand revalidation is added.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
