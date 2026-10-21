# Moving to timelessknot.in

The site currently runs on **https://timelessknot.dravonix.dev**. It will move to
**https://timelessknot.in** once GoDaddy's registrar (RAA) verification and the
Cloudflare zone activation are complete. Until then nothing changes: the
legacy domain stays canonical.

## How the domain is decided

One setting decides the canonical domain: the **`NEXT_PUBLIC_SITE_URL` build variable**.

- At build time `scripts/site/write-site-config.mjs` records it in
  `src/content/generated/site-config.json`. Both the pages and the Worker read
  that file, so they always agree.
- When it is not set, the canonical origin is `DEFAULT_CANONICAL_ORIGIN` in
  `src/lib/indexing.ts`: `https://timelessknot.dravonix.dev`.
- The value must be a bare HTTPS origin such as `https://timelessknot.in`. A
  path, a port, `http://` or a typo fails the build instead of publishing
  wrong URLs.

Everything below uses that origin: canonical tags, `og:url`, `og:image`,
`twitter:image`, the JSON-LD `@id`s and URLs, `robots.txt` (`Sitemap:` line) and
every `sitemap.xml` entry.

The Worker (`custom-worker.ts`) then handles each request by its hostname:

| Request hostname | Behaviour |
| --- | --- |
| The canonical hostname | Served normally; indexable. |
| `timelessknot.dravonix.dev` or `www.timelessknot.in` when **not** canonical (`REDIRECT_HOSTNAMES`) | `301` to the same path and query on the canonical origin (`308` for non-GET requests, so a form POST is not turned into a GET). |
| Anything else: `*.workers.dev`, Worker preview URLs, `localhost`, staging hosts, or `timelessknot.in` while it is not yet canonical | Served with `X-Robots-Tag: noindex, nofollow`. |

What this means at each stage:

- **Before the switch:** `timelessknot.in` can be attached to the Worker and
  tested in full. It is served with `noindex`, while its canonical tags still
  point to `timelessknot.dravonix.dev`. Nothing is redirected away from the live
  site.
- **After the switch:** `timelessknot.in` is indexable, and the legacy domain
  and `www.timelessknot.in` redirect to it automatically.
- **Static files:** photographs, JS and CSS under `/media`, `/_next/static` and
  `/brand` are served by Cloudflare's asset layer before the Worker runs, so on
  the legacy host they keep loading (HTTP 200) rather than redirecting. That is
  harmless: pages, `robots.txt`, `sitemap.xml` and `/_next/image` all redirect,
  and the pages on the new domain only reference the new domain.

## Before the switch: verify the new domain

Do not change `NEXT_PUBLIC_SITE_URL` until every item below is true.

1. GoDaddy RAA verification is complete. The domain is no longer suspended or
   parked, and WHOIS shows it as active.
2. The `timelessknot.in` zone shows **Active** in Cloudflare (the nameservers at
   GoDaddy point to the two Cloudflare nameservers shown for the zone).
3. In Cloudflare: **Workers & Pages → `timeless-knot` → Settings → Domains & Routes → Add → Custom domain**:
   - add `timelessknot.in`;
   - add `www.timelessknot.in`.

   Keep the existing `timelessknot.dravonix.dev` custom domain attached; it is
   needed for the redirect.
4. Both new custom domains show an active certificate. Then
   `https://timelessknot.in/` loads the site over HTTPS with a valid
   certificate, on desktop and mobile.
5. In the `timelessknot.in` zone: SSL/TLS → Edge Certificates → **Always Use
   HTTPS** is on.
6. Optional check from a terminal: `curl -sI https://timelessknot.in/` shows
   `HTTP/2 200` and `x-robots-tag: noindex, nofollow`. That is expected before
   the switch.

## The switch

These are the only Cloudflare changes needed. Make them when you are ready to deploy.

| Where | Setting | Change |
| --- | --- | --- |
| Workers & Pages → `timeless-knot` → Settings → **Build** → Variables and secrets (the *build* variables) | `NEXT_PUBLIC_SITE_URL` | Set to `https://timelessknot.in` (no trailing path). |
| Same place, if present | Any other copy of `NEXT_PUBLIC_SITE_URL` (e.g. under runtime *Variables and Secrets*) | Remove it or make it identical. The runtime value is not used: the build value is what counts. |
| Non-production (preview) builds | `NEXT_PUBLIC_SITE_URL` | Leave it as is. Previews are `noindex` on their own preview hostnames regardless. |

Then:

1. Trigger a new production build (Deployments → *Retry build*, or push to
   `main`). A variable change only takes effect in a new build.
2. In the build log, confirm the line
   `[site] canonical origin: https://timelessknot.in (from NEXT_PUBLIC_SITE_URL)`.

## After the switch: verify

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
- **Rolling back:** clear `NEXT_PUBLIC_SITE_URL` (or set it back to
  `https://timelessknot.dravonix.dev`) and rebuild. The legacy domain becomes
  canonical again, `timelessknot.in` goes back to `noindex`, and
  `www.timelessknot.in` redirects to the legacy domain.

## Adding another domain later

- **To redirect it to the site:** add the hostname to `REDIRECT_HOSTNAMES` in
  `src/lib/indexing.ts`, add a test in `tests/indexing.test.mjs`, and attach it
  as a custom domain.
- **Staging or preview hostnames:** do not add them. Unlisted hosts are always
  `noindex`.
