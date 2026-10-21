/**
 * Which address is the canonical production site, and how every other host is
 * treated. Shared by the pages (canonical URLs, sitemap, robots.txt, Open
 * Graph and structured data — via src/config/site.ts) and by the Cloudflare
 * Worker (custom-worker.ts), so the two can never disagree.
 *
 * The canonical origin comes from one setting: the NEXT_PUBLIC_SITE_URL build
 * variable, captured at build time by scripts/site/write-site-config.mjs. When
 * it is not set, the current production domain below is used.
 *
 *   - The canonical host is served normally and may be indexed.
 *   - A host in REDIRECT_HOSTNAMES that is not (or is no longer) canonical
 *     permanently redirects to the same path on the canonical origin.
 *   - Every other host — workers.dev, preview URLs, localhost, or a new domain
 *     that is attached but not yet canonical — is served with
 *     `X-Robots-Tag: noindex, nofollow`.
 *
 * See docs/DOMAIN-MIGRATION.md for moving to https://timelessknot.in.
 */

/** Canonical origin when NEXT_PUBLIC_SITE_URL is not set: the current production domain. */
export const DEFAULT_CANONICAL_ORIGIN = "https://timelessknot.dravonix.dev";

/**
 * Hostnames that belong to the studio and should send visitors (and search
 * engines) to the canonical domain whenever they are not canonical themselves:
 * the legacy domain once the site has moved, and the www alias of the new one.
 * A listed hostname that *is* canonical is simply served.
 */
export const REDIRECT_HOSTNAMES: readonly string[] = ["timelessknot.dravonix.dev", "www.timelessknot.in"];

/**
 * Validates a configured site URL and returns its bare origin
 * (`https://host`, lower case, no path or trailing slash). Empty means the
 * default. Anything else — not HTTPS, a path, credentials, a port — throws, so
 * a mistyped build variable fails the build instead of publishing wrong
 * canonical URLs.
 */
export function resolveCanonicalOrigin(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return DEFAULT_CANONICAL_ORIGIN;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL "${raw}" is not a valid URL — expected e.g. https://timelessknot.in`);
  }
  const bare = url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password && !url.port;
  if (url.protocol !== "https:" || !bare) {
    throw new Error(`NEXT_PUBLIC_SITE_URL "${raw}" must be an HTTPS origin with no path, e.g. https://timelessknot.in`);
  }
  return url.origin;
}

export type HostDecision =
  | { action: "serve"; indexable: true }
  | { action: "serve"; indexable: false }
  | { action: "redirect"; location: string };

/** What the Worker does with a request URL, given the canonical origin. */
export function decideHost(requestUrl: URL, canonicalOrigin: string): HostDecision {
  const canonical = new URL(canonicalOrigin);
  const hostname = requestUrl.hostname.toLowerCase();
  if (hostname === canonical.hostname) return { action: "serve", indexable: true };
  if (REDIRECT_HOSTNAMES.includes(hostname)) {
    return { action: "redirect", location: `${canonical.origin}${requestUrl.pathname}${requestUrl.search}` };
  }
  return { action: "serve", indexable: false };
}
