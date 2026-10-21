/**
 * The production origin — the only address search engines should index.
 *
 * Used for canonical URLs, the sitemap and structured data (src/config/site.ts),
 * and by the Cloudflare Worker (custom-worker.ts), which marks every response
 * served from any other host — workers.dev, preview URLs, localhost — as
 * `noindex`, so previews never compete with the live site in search results.
 * If the site moves to a new domain, change it here.
 */
export const PRODUCTION_ORIGIN = "https://timelessknot.dravonix.dev";

const productionHostname = new URL(PRODUCTION_ORIGIN).hostname;

/** True only for the production hostname (any port, any letter case). */
export const isProductionHost = (hostname: string) => hostname.toLowerCase() === productionHostname;
