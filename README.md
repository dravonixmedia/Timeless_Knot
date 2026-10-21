# Timeless Knot — Website

Official website for **Timeless Knot**, wedding photography & cinematography.
*“Crafting Memories That Last Beyond Time.”*

Built by [Dravonix Media](https://dravonixmedia.com/).

## Stack

- Next.js 16.3 (App Router, Turbopack, static generation) — deployed to Cloudflare Workers via the OpenNext adapter
- React 19.3 (`<ViewTransition>` for page transitions and story cover → hero morphs)
- TypeScript, Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- GSAP ScrollTrigger (restrained scroll-linked parallax only)
- Lenis smooth scrolling (desktop pointer devices only; touch keeps native scrolling)
- `next/font` (Cormorant Garamond + Manrope), `next/image`

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build && npm start
```

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Optional build variable — normally leave it unset.** The canonical production origin is `https://timelessknot.in` (`DEFAULT_CANONICAL_ORIGIN` in `src/lib/indexing.ts`). It drives canonical URLs, sitemap, robots.txt, Open Graph, structured data and the Worker's host rules: only the canonical host is indexable, `timelessknot.dravonix.dev` and `www.timelessknot.in` 301 to it, and every other host (previews, workers.dev, localhost) gets `X-Robots-Tag: noindex, nofollow`. A value that is not a bare HTTPS origin, or that names a redirect-only host, fails the build. See [docs/DOMAIN-MIGRATION.md](docs/DOMAIN-MIGRATION.md). |
| `NEXT_PUBLIC_WHATSAPP_URL` | *Optional* fallback for the WhatsApp link — see **WhatsApp** below. Read at build time. |

## WhatsApp

One direct link drives the floating WhatsApp button, the footer link, the contact-page link and the
contact form's enquiries.
Set it in **`src/config/site.ts`**:

```ts
const WHATSAPP_URL: string | null = "https://wa.me/919876543210";
```

- Accepted: `https://wa.me/<country code + number>` (digits only, no `+` or spaces) or a WhatsApp
  Business short link `https://wa.me/message/<code>`. Anything else (other domains, `http:`,
  `javascript:` …) is rejected and the build log shows a `[whatsapp]` warning.
- Number links get the studio's prefilled enquiry message unless the link already has `?text=`.
- Because it is committed, no Cloudflare variable is needed. Commit, merge to `main`, and the
  automatic deployment shows the button.
- Alternative: leave it `null` and set `NEXT_PUBLIC_WHATSAPP_URL` as a Cloudflare **Build**
  variable. Pages are prerendered at build time, so a *runtime* variable has no effect.
- The button is intentionally hidden on `/contact`, which has its own form and WhatsApp link.
- **Contact form → WhatsApp.** The enquiry form sends through WhatsApp only, to this same number.
  On *Send Enquiry via WhatsApp* the fields are validated and WhatsApp opens (the app on phones,
  WhatsApp Web on desktop) with the enquiry written out (`formatEnquiryMessage` in
  `src/lib/enquiry.ts`). The enquiry is delivered only when the visitor presses **Send** in
  WhatsApp. Nothing is stored, emailed or sent to a server, and the form says so rather than
  claiming success. A WhatsApp Business short link (`wa.me/message/…`) cannot carry a message, so
  with one configured the form explains that it is unavailable — use a number link.

## Deploying to Cloudflare Workers

The site runs on Cloudflare Workers through [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare),
which builds the Next.js app and wraps it in a Worker (`.open-next/worker.js`).

```bash
npm run preview    # OpenNext build + local Worker (workerd) at http://localhost:8787
npm run deploy     # OpenNext build + populate cache + deploy (needs `wrangler login`)
npm run deploy:preview  # OpenNext build + populate cache + Worker Preview (non-production branches)
```

Cloudflare dashboard → Workers & Pages → `timeless-knot` → Settings → Build:

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy command | `npm run deploy:preview` — builds with OpenNext, copies the prerendered pages into the assets, then runs `wrangler preview`. Cloudflare runs only the install step before this command for preview builds, so a bare `npx wrangler preview` has no `.open-next/worker.js` to deploy. Bindings come from the `previews` block in `wrangler.jsonc`. |
| Build variables | `NEXT_PUBLIC_WHATSAPP_URL` only if not set in code. `NEXT_PUBLIC_SITE_URL` is not needed — remove it, or it must be exactly `https://timelessknot.in` ([docs/DOMAIN-MIGRATION.md](docs/DOMAIN-MIGRATION.md)) |
| Runtime variables / secrets | none |

- Use `opennextjs-cloudflare deploy`, **not** a bare `wrangler deploy`: it first copies the prerendered
  pages into the Worker's static assets (the read-only cache configured in `open-next.config.ts`).
- Runtime settings (entry point, `nodejs_compat`, static assets, bindings) live in `wrangler.jsonc`.
- Version constraints: Next.js is pinned to **16.3.8**. Next 16.4 emits a `preview-props.json`
  manifest the adapter cannot inline yet (Worker error 1101), and Cache Components deadlock on
  Workers with Next 16.3 — so `cacheComponents` stays off. Re-test with `npm run preview` before
  upgrading either `next` or `@opennextjs/cloudflare`.

## Where things live

```
src/
  app/                    routes: /, /our-story, /stories, /stories/[slug], /experience, /contact,
                          404, sitemap, robots, OG image, /film/[file] (range-request film stream)
  config/site.ts          confirmed business facts (name, tagline, contact, socials, logo, nav)
  content/
    types.ts              CMS-ready content model (WeddingStory, Media, Film, GalleryBlock)
    stories.ts            published wedding stories (from story.json folders)
    imagery.ts            site-wide photography slots, extra photographs + optional showreel
  components/
    brand/                official TK monogram + typeset name, botanical illustration
    layout/               header, mobile menu, footer, page transition wrapper
    media/Picture.tsx     next/image wrapper (real photographs only — empty slots are not rendered)
    motion/               shared reveal observer, Lenis + ScrollTrigger sync, parallax
    stories/              story card, archive with filters, art-directed gallery
    film/FilmPlayer.tsx   click-to-load accessible video / embed player
    contact/              enquiry form
  lib/                    SEO helpers + JSON-LD, enquiry validation, scroll registry
```

## Adding real content

**Photographs, portfolio galleries and wedding stories are folder-based — no code changes needed.** Photos placed directly in `weddings/`, `pre-wedding/`, `couples/` or `beyond-the-frame/` publish to the Portfolio with no metadata; a subfolder with `story.json` becomes an individual story. Upload images to the
right folder in `public/media/` (stories also need a `story.json`), merge to `main`, and the Cloudflare
build discovers them automatically. See **[docs/IMAGE-UPLOADS.md](docs/IMAGE-UPLOADS.md)** for the
folders, `story.json` fields and image guidelines.

- `npm run media` regenerates the image manifest (also runs in `build`, `dev` and after install).
- `npm run media:check` fails on any content problem — useful before merging uploads.
- `npm test` runs the manifest and gallery-composition tests.
- Image positions without a photograph are left out of the page; there are no placeholder images or demo stories.

**Homepage films:** upload H.264 MP4s (each under 25 MB, ideally under 15 MB), with posters generated
automatically at build time (or your own same-name poster), to `public/media/home/films/` — they appear in the home page film section after the next
deployment (one film plays alone; two or more become a collection). Order and titles live in an optional
`films.json`. The original film in `public/media/home/video/` keeps working. With no films the section
is hidden. See [docs/IMAGE-UPLOADS.md](docs/IMAGE-UPLOADS.md#homepage-films-homefilms).
Story films: set `film.embedUrl` (YouTube-nocookie / Vimeo) in `story.json`.

**Logo and icons:** the official TK monogram is `public/brand/tk-monogram-white.png` (`site.logo`); it is
drawn in the surrounding text colour, so it reads on light and dark backgrounds. Browser icons follow the
App Router file conventions: `src/app/favicon.ico`, `icon.png` (32×32), `apple-icon.png` (180×180), and the
192/512 icons in `public/icons/` listed by `src/app/manifest.ts`.

**Contact details / Instagram / WhatsApp:** fill in `site.contact` and `site.social`. Anything left
`null` stays hidden.

A future CMS only needs to return the same shapes as `content/types.ts` from the getter functions in
`content/stories.ts`.

## Motion & accessibility notes

- Reveals use one `IntersectionObserver` + CSS; hidden states apply only when JS is running and
  `prefers-reduced-motion` is not set. A 4-second failsafe reveals everything if scripts fail.
- Hero animation is CSS-only, so meaningful content paints immediately (no loading screen).
- The mobile menu is a modal dialog: focus moves in, Tab is contained, Escape closes, page is inert.
- All forms have visible labels, inline errors linked via `aria-describedby`, and focus management.
