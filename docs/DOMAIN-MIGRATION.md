# The timelessknot.in domain

The site has moved from **https://timelessknot.dravonix.dev** to
**https://timelessknot.in**, which is now the canonical production domain in
code (`DEFAULT_CANONICAL_ORIGIN` in `src/lib/indexing.ts`). No Cloudflare
variable is needed for it.

## What went wrong at the cutover (resolved)

`timelessknot.in` went live while the build still used the old default
canonical origin, because `NEXT_PUBLIC_SITE_URL` had not been set as a *build*
variable. The Worker therefore treated `timelessknot.in` as a non-canonical
host. Every response got `X-Robots-Tag: noindex, nofollow` (PageSpeed SEO 69),
and canonical tags pointed at the old domain. The default is now
`https://timelessknot.in`. A stale `NEXT_PUBLIC_SITE_URL` that still names the
old domain (or `www.timelessknot.in`) now fails the build with instructions,
instead of shipping a site whose own domain is `noindex`.

## How the domain is decided

- The canonical origin is `DEFAULT_CANONICAL_ORIGIN` in `src/lib/indexing.ts`:
  **`https://timelessknot.in`**.
- The optional `NEXT_PUBLIC_SITE_URL` build variable can override it. At build
  time `scripts/site/write-site-config.mjs` records it in
  `src/content/generated/site-config.json`, and both the pages and the Worker
  read that file, so they always agree. It must be a bare HTTPS origin, and must
  not be a redirect-only host. Otherwise the build fails instead of publishing
  wrong URLs.

Everything below uses that origin: canonical tags, `og:url`, `og:image`,
`twitter:image`, the JSON-LD `@id`s and URLs, `robots.txt` (`Sitemap:` line) and
every `sitemap.xml` entry.

The Worker (`custom-worker.ts`) then handles each request by its hostname:

| Request hostname | Behaviour |
| --- | --- |
| The canonical hostname | Served normally; indexable. |
| `timelessknot.dravonix.dev` or `www.timelessknot.in` when **not** canonical (`REDIRECT_HOSTNAMES`) | `301` to the same path and query on the canonical origin (`308` for non-GET requests, so a form POST is not turned into a GET). |
| Anything else: `*.workers.dev`, Worker preview URLs, `localhost`, staging hosts | Served with `X-Robots-Tag: noindex, nofollow`. |

In production this means `timelessknot.in` is indexable, while the old domain
and `www.timelessknot.in` redirect to it with the path and query kept.

- **Static files:** photographs, JS and CSS under `/media`, `/_next/static` and
  `/brand` are served by Cloudflare's asset layer before the Worker runs, so on
  the legacy host they keep loading (HTTP 200) rather than redirecting. That is
  harmless: pages, `robots.txt`, `sitemap.xml` and `/_next/image` all redirect,
  and the pages on the new domain only reference the new domain.

## Cloudflare settings to check

| Where | Setting | Required |
| --- | --- | --- |
| Workers & Pages → `timeless-knot` → Settings → **Build** → Variables and secrets | `NEXT_PUBLIC_SITE_URL` | **Remove it**, or set it to exactly `https://timelessknot.in`. If it still says `https://timelessknot.dravonix.dev`, the build stops with an error naming this setting. |
| Workers & Pages → `timeless-knot` → Settings → Variables and Secrets (runtime) | `NEXT_PUBLIC_SITE_URL` | Not used; remove any copy to avoid confusion. |
| Workers & Pages → `timeless-knot` → Settings → Domains & Routes | Custom domains | `timelessknot.in`, `www.timelessknot.in` and `timelessknot.dravonix.dev` all attached to this Worker. |
| `timelessknot.in` zone → Rules → Transform Rules (*Modify Response Header*) | — | No rule that adds `X-Robots-Tag`. None is needed; the Worker handles previews. |
| `timelessknot.in` zone → SSL/TLS → Edge Certificates | Always Use HTTPS | On |

After deploying, the production build log shows
`[site] canonical origin: default (src/lib/indexing.ts → DEFAULT_CANONICAL_ORIGIN)`
(or `https://timelessknot.in (from NEXT_PUBLIC_SITE_URL)` if you kept the variable).

## Verify production

- `curl -sI https://timelessknot.in/` shows `200` and **no** `x-robots-tag` header.
- `curl -sI "https://timelessknot.dravonix.dev/stories?category=couples"` shows `301` with
  `location: https://timelessknot.in/stories?category=couples`.
- `curl -sI https://www.timelessknot.in/` shows `301` to `https://timelessknot.in/`.
- `https://timelessknot.in/robots.txt` lists `Sitemap: https://timelessknot.in/sitemap.xml`.
  `https://timelessknot.in/sitemap.xml` lists only `https://timelessknot.in/…` URLs.
- View source on any page: the canonical, `og:url`, `og:image` and JSON-LD URLs use `https://timelessknot.in`.
- Run PageSpeed Insights on `https://timelessknot.in/`. SEO should report the page as indexable.

## The old dravonix.dev hostname

- **Keep `timelessknot.dravonix.dev` attached to the Worker** as a custom domain
  for at least 12 months, ideally permanently. The Worker's 301s are what
  transfer search ranking and keep old links, shares and QR codes working.
  Detaching it, or deleting its DNS record in the `dravonix.dev` zone, breaks
  every old link.
- No Cloudflare Redirect Rule is needed: the Worker redirects. If you prefer a
  Redirect Rule in the `dravonix.dev` zone instead, use
  `https://timelessknot.in${http.request.uri.path}` with *Preserve query string*
  and status 301. The Worker's own redirect is then never reached.
- **Google Search Console:**
  1. Add and verify a property for `timelessknot.in`.
  2. In the `https://timelessknot.dravonix.dev/` property, use **Settings → Change of address** to point it at the new site.
  3. Submit `https://timelessknot.in/sitemap.xml` in the new property.
  4. Keep both properties for monitoring.
- **Everywhere else:** update the website link on the Google Business Profile
  (if one exists), Instagram and WhatsApp Business profile, and any printed
  material.
- **Rolling back to the old domain** is a code change, not a variable: revert the
  pull request that made `https://timelessknot.in` the default (the old domain
  is a redirect-only host and cannot be set as `NEXT_PUBLIC_SITE_URL`).

## Adding another domain later

- **To redirect it to the site:** add the hostname to `REDIRECT_HOSTNAMES` in
  `src/lib/indexing.ts`, add a test in `tests/indexing.test.mjs`, and attach it
  as a custom domain.
- **Staging or preview hostnames:** do not add them. Unlisted hosts are always
  `noindex`.
