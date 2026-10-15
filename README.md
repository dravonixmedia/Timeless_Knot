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
| `NEXT_PUBLIC_SITE_URL` | Production origin. Drives canonical URLs, sitemap and Open Graph. **While unset, the site is marked `noindex` and robots.txt disallows crawling.** |
| `ENQUIRY_WEBHOOK_URL` | Server-side endpoint that receives contact enquiries as JSON. **While unset, the contact form runs in clearly labelled demonstration mode and never reports a false success.** |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number in international format (e.g. `+91 98765 43210`). Enables the floating WhatsApp button and the footer/contact WhatsApp links with a prefilled message. **While unset or invalid, all WhatsApp UI is hidden.** |

## Deploying to Cloudflare Workers

The site runs on Cloudflare Workers through [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare),
which builds the Next.js app and wraps it in a Worker (`.open-next/worker.js`).

```bash
npm run preview    # OpenNext build + local Worker (workerd) at http://localhost:8787
npm run deploy     # OpenNext build + populate cache + deploy (needs `wrangler login`)
```

Cloudflare dashboard → Workers & Pages → `timeless-knot` → Settings → Build:

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Build variables | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `ENQUIRY_WEBHOOK_URL` (when available) |
| Runtime variables / secrets | `ENQUIRY_WEBHOOK_URL` (when available) |

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
                          404, sitemap, robots, OG image, /api/enquiry
  config/site.ts          confirmed business facts (name, tagline, contact, socials, logo, nav)
  content/
    types.ts              CMS-ready content model (WeddingStory, Media, Film, GalleryBlock)
    stories.ts            wedding stories (currently DEMONSTRATION entries only)
    imagery.ts            site-wide photography slots + optional showreel
  components/
    brand/                logo (provisional wordmark), botanical illustration
    layout/               header, mobile menu, footer, page transition wrapper
    media/Picture.tsx     next/image, or an honest "photograph to come" plate until `src` is set
    motion/               shared reveal observer, Lenis + ScrollTrigger sync, parallax
    stories/              story card, archive with filters, art-directed gallery
    film/FilmPlayer.tsx   click-to-load accessible video / embed player
    contact/              enquiry form
  lib/                    SEO helpers + JSON-LD, enquiry validation, scroll registry
```

## Adding real content

**Photographs:** put files in `public/media/` and set `src`, accurate `alt`, `width` and `height` on the
relevant `Media` object (in `content/imagery.ts` or a story). Plates disappear automatically.

**Wedding stories:** add entries to `content/stories.ts`. Remove `isDemo` only for real, client-approved
weddings — demo stories are labelled on screen, `noindex`, and excluded from the sitemap. Gallery
sequences are composed from blocks: `full`, `single` (left / right / center), `pair`, `trio`, `statement`.

**Films:** set `film.src` (self-hosted MP4/WebM) or `film.embedUrl` (YouTube-nocookie / Vimeo) with a
real poster. Set `showreel` in `content/imagery.ts` to feature one on the home page.

**Logo:** set `site.logo` to the official SVG/PNG files (light and dark versions); the provisional
typographic wordmark is then replaced everywhere. Replace `src/app/icon.svg` with the official mark.

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
