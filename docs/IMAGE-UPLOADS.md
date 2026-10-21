# Uploading photographs and the homepage film — Timeless Knot

Photographs are managed entirely through folders in this repository. Upload
images to the right folder, merge to `main`, and Cloudflare rebuilds the site.
The build discovers every image automatically — **no code changes needed.**

## Publishing workflow

1. Upload images (and a `story.json` for a new story) to the right folder in
   `public/media/` — on GitHub: open the folder → **Add file → Upload files**.
2. Commit to a development branch and open a pull request.
3. Review, then merge into `main`.
4. Cloudflare starts a new build automatically. The image manifest is
   regenerated as the first step of the build.
5. When the deployment succeeds, the photographs are live.

Before merging you can check everything locally with `npm run media:check`
(it fails on any problem), or read the `[media]` lines at the top of the
Cloudflare build log — they list exactly what was published and why anything
was skipped. **Problems never break the site:** an invalid image or story is
simply left out until it is fixed.

## Folders

```
public/media/
├── home/
│   ├── hero/          Home page hero (the first image by name is used)
│   ├── featured/      Home page photographs: “The Art of Remembering” portrait,
│   │                  the full-width “Moments Pass” photograph and the two small
│   │                  photographs beside the closing invitation (on every page)
│   └── video/         Home page cinematic film (one MP4 + optional poster) — see below
├── about/             Our Story page (4 photographs)
├── experience/        The Experience page (2 photographs)
├── contact/           Contact page portrait (1 photograph)
├── weddings/          Photos here → Weddings portfolio gallery
│   └── <story-name>/  A subfolder with story.json → an individual wedding story
├── pre-wedding/       Photos here → Pre-Wedding portfolio gallery
│   └── <story-name>/  (optional) individual pre-wedding story
├── couples/           Photos here → Couples portfolio gallery
│   └── <story-name>/  (optional) individual couple story
└── beyond-the-frame/  Photos here → Beyond the Frame portfolio gallery
                       (gallery only — subfolders are not read as stories)
```

**Two kinds of upload, depending on where the photo goes:**

| You want… | Upload to | Needs `story.json`? | Appears on |
| --- | --- | --- | --- |
| Photos in the **portfolio** | directly into `weddings/`, `pre-wedding/`, `couples/` or `beyond-the-frame/` | **No** | Timeless Stories page (/stories) → Portfolio (filter by category) |
| A full **wedding story** with its own page | a new subfolder, e.g. `weddings/anika-and-rohan/` | **Yes** (with `"published": true`) | Its own page `/stories/anika-and-rohan` + story listings |

### Portfolio galleries (`weddings/`, `pre-wedding/`, `couples/`, `beyond-the-frame/`)

- Upload photographs **directly** into the category folder — no metadata file is
  needed. They appear in the Portfolio on the Timeless Stories page (/stories) after the next
  successful deployment, with a filter for each category that has photos.
- Every photograph is shown **uncropped at its original shape** (portrait,
  landscape, square, 4:5, 2:3, 3:2 …) in a masonry layout.
- Order is by filename (`01-…`, `02-…`; `2` sorts before `10`). To set the order
  or add descriptions, add an optional `images.json` in the same folder:

  ```json
  {
    "order": ["05-first-look.jpg", "01-haldi.jpg"],
    "05-first-look.jpg": "The bride turning to see the groom for the first time"
  }
  ```

- Removing a photo from the folder removes it from the website on the next deployment.
- **Home page portfolio cards.** Each category that has photos gets one card in
  the home page "Moments Worth Remembering" section, linking to
  `/stories?category=<folder>`. The card shows the category's first **portrait**
  photograph (in the gallery order above) in a 4:5 frame — a 4:5 portrait is
  shown uncropped — or the first photograph if the folder has no portraits.
  An empty folder has no card and no filter. With all four categories the cards
  sit four in a row on desktop, 2 × 2 on tablets and one per row on phones.
- `beyond-the-frame/` is a gallery only: it never contains stories and does not
  use `story.json`.

### Page photographs (`home/`, `about/`, `experience/`, `contact/`)

Images fill the page's photo positions **in filename order**, and each position
prefers a photograph of the right shape:

| Folder | Positions, in order |
| --- | --- |
| `home/hero` | Hero (landscape works best) |
| `home/featured` | Portrait · Landscape (full width) · Portrait (small) · Landscape (small) |
| `about` | Portrait (hero) · Landscape (full width) · Portrait · Portrait |
| `experience` | Landscape (full width) · Portrait |
| `contact` | Portrait |

A portrait goes to the next portrait position and a landscape to the next
landscape position; if no photograph of the right shape is left, the next one
is used anyway — always uncropped, at its own proportions (full-width banners
excepted). **Positions without a photograph are simply left out** — the page
never shows an empty frame or "photograph to come" placeholder.

**Extra images beyond the number of positions:**

- `about/` and `experience/` — shown in an uncropped editorial sequence lower on
  the page (portraits in pairs and trios, landscapes full width).
- `home/hero`, `home/featured`, `contact/` — uploaded but not shown. Put
  additional portfolio photographs in a category gallery folder instead.

### Individual stories (subfolders of `weddings/`, `pre-wedding/`, `couples/`)

Each story is one folder. **The folder name becomes the web address**, so use
lowercase words joined by hyphens, e.g. `weddings/anika-and-rohan` →
`/stories/anika-and-rohan`.

```
public/media/weddings/anika-and-rohan/
├── story.json
├── 01-couple-under-the-banyan-tree.jpg
├── 02-getting-ready.jpg
└── …
```

- The **cover** is the image named in `story.json` → `cover`, otherwise the
  first image. It is not repeated in the gallery.
- The **gallery** is laid out automatically in the site's editorial style:
  portraits are grouped into pairs and trios, landscapes alternate between
  full-width and offset frames. Original proportions are always preserved.
- **New images added to a published story appear automatically** on the next
  deployment. Removed images disappear.
- Stories appear on the Timeless Stories page, `/stories` (with a filter by type) and,
  if `featured`, on the home page. Pre-wedding and couple stories use the same
  pages and layouts. Story covers are shown uncropped.
- While no story is published, the Stories list and its filters are hidden
  (the Portfolio stays visible), and the home page shows one photograph from each
  portfolio category instead of featured stories.

## Homepage film (`home/video/`)

The “Love, In Motion” section on the home page plays the film uploaded to:

```
public/media/home/video/
```

**With no valid video in this folder the whole section is hidden** — no
placeholder, no play button, no gap. Upload a video and it appears
automatically after the next deployment.

### Uploading

1. On GitHub open `public/media/home/video/` → **Add file → Upload files**.
2. Upload the **MP4** (and, optionally, a poster image — see below).
3. Commit to a branch, open a pull request, review and merge into `main`.
4. Cloudflare rebuilds the site; when the deployment succeeds the film is live.
   The build log shows the result, e.g.
   `[media] … home video: 01-timeless-knot-film.mp4 (1920×1080, 14.2 MB, poster)`.

### Export settings

| Setting | Recommended |
| --- | --- |
| Container / codec | **MP4, H.264** (also called AVC). HEVC/H.265, ProRes, MOV and WebM are not used. |
| Resolution | **1920×1080** (1280×720 for a lighter file). Landscape 16:9 is best; other shapes are shown uncropped. |
| Frame rate | 24 or 25 fps |
| Bitrate | about **4–6 Mbps** for 1080p (2–3 Mbps for 720p) |
| Length | a **30–90 second** highlight loop |
| File size | **under 15 MB recommended — 25 MB maximum** (Cloudflare’s per-file limit; larger files are skipped automatically so the deployment never fails) |
| Fast start | turn on **“Fast start” / “Web optimised” / “Optimize for web”** so playback begins before the whole file downloads |
| Audio | optional (AAC). The film always starts **muted**; visitors can turn sound on. |

HandBrake: preset *Web → Vimeo YouTube HQ 1080p30*, tick **Web Optimized**.
FFmpeg: `ffmpeg -i master.mov -c:v libx264 -preset slow -crf 23 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart 01-timeless-knot-film.mp4`

### Filenames and the poster

- Use lowercase words with a number prefix, e.g. `01-timeless-knot-film.mp4`.
- **Only one film is shown.** If the folder holds several MP4s, the first by
  name is used (`01-…` before `02-…`); the others are not published.
- **Poster (optional, recommended):** a still from the film, saved as a JPG with
  the **same name as the video** (`01-timeless-knot-film.jpg`) or named
  `poster.jpg`. It shows while the film loads and for visitors who prefer reduced
  motion. Without a poster the film’s first frame is used — nothing is generated.

### Replacing or removing the film

- **Replace:** upload the new MP4 (with its poster) and delete the old files in
  the same pull request. Keeping the same filename is fine — the site detects
  the new content and every visitor gets the new version after the deployment.
- **Remove:** delete the MP4 (and poster) from the folder and merge. After the
  deployment the film section disappears from the home page.

### How it plays

Muted, looping and inline (no full-screen takeover on phones), starting only
when the section scrolls into view — nothing is downloaded before then. It
pauses when scrolled away. Visitors get **Play/Pause** and **Sound on/off**
controls. With “reduce motion” or Data Saver turned on, it does not autoplay:
the poster is shown with a Play button.

## `story.json`

A story is **only published when** its folder has a valid `story.json` with
`"published": true` and at least one valid image. Anything else stays private —
its files are not even uploaded to Cloudflare.

Minimal example:

```json
{
  "published": true,
  "title": "Under the Banyan Tree",
  "couple": "Anika & Rohan",
  "location": "Udaipur, Rajasthan",
  "date": "2026-02-14"
}
```

All fields — see [`docs/media/story.example.json`](media/story.example.json):

| Field | Required | Notes |
| --- | --- | --- |
| `published` | yes | `true` to publish, `false` to keep as a private draft |
| `title` | yes | Story title shown on the page and cards |
| `couple` | no | Couple names, as they wish to be credited |
| `location` | no | e.g. `"Udaipur, Rajasthan"` |
| `date` | no | `YYYY-MM-DD`; shown as month and year. Newer stories are listed first |
| `category` | no | Overrides the folder: `Wedding Photography`, `Wedding Film`, `Elopement`, `Pre-Wedding`, `Couple Story` |
| `featured` | no | `true` to show on the home page (up to 3; otherwise the latest stories fill in) |
| `position` | no | Whole number to pin the listing order (`0` = first) |
| `cover` | no | Filename of the cover image |
| `excerpt` | no | One sentence for cards and search results |
| `introduction` | no | List of opening paragraphs |
| `statements` | no | Pull quotes woven between photographs |
| `closing` | no | Closing line after the gallery |
| `order` | no | Filenames to show first, in this order; the rest follow by name |
| `images` | no | Per-image alt text (and optional `focal` point, e.g. `"50% 30%"`) |
| `film` | no | `{ "embedUrl", "title", "poster", "duration" }` — YouTube (youtube-nocookie.com) or Vimeo embed |
| `seo` | no | `{ "title", "description" }` for search engines |

**Only write details the couple has confirmed.** Nothing is invented by the
site — fields you leave out are simply not shown.

## Image guidelines

- **Formats:** JPG, JPEG, PNG, WebP or AVIF. Other files are ignored and never uploaded.
- **Size:** export at about **2400px on the long edge, under 3 MB**. Files over
  25 MB are skipped (Cloudflare's limit). The site creates smaller versions
  automatically for phones and tablets.
- **Names:** prefix with numbers to control order — `01-`, `02-`, … `10-`
  (sorted naturally, so `2` comes before `10`).
- **Descriptive names become alt text** for screen readers and search engines:
  `07-first-look.jpg` → “First look — Under the Banyan Tree (Anika & Rohan, …)”.
  Camera names like `IMG_4821.jpg` fall back to a generic description — add
  better text under `images` in `story.json`, or in an `images.json` file in any
  page folder:

  ```json
  { "01-hero-at-sunset.jpg": { "alt": "The couple walking at sunset", "focal": "50% 40%" } }
  ```

- **Privacy:** everything in `public/media/` that is not a published image
  (drafts, notes, unsupported files, unknown folders) is excluded from the
  Cloudflare upload. Still, never put anything confidential in this repository.

## Developers

- Homepage film: the MP4 is validated at build time by `scripts/media/read-mp4.mjs`
  (H.264, dimensions, fast start) and streamed through `src/app/film/[file]/route.ts`,
  which answers HTTP range requests with `206 Partial Content` (required by Safari / iOS).
  Player: `src/components/film/HomeFilm.tsx`.
- Generator: `scripts/media/generate-image-manifest.mjs` (runs in `npm run build`,
  `npm run dev` and after `npm install`). Output: `src/content/generated/media-manifest.json`,
  `public/.assetsignore` and `public/media-cache/` (all generated, not committed).
- Caching: every published photograph is copied to `/media-cache/<content hash>/<file>`
  and the site references that URL. `public/_headers` marks `/media-cache/*` and
  `/_next/static/*` immutable (both are content-addressed); OpenNext then marks the
  optimised `/_next/image` response immutable for browsers, and `custom-worker.ts`
  (wrangler `main`) stores it in Cloudflare's edge cache (`X-Image-Cache: HIT/MISS`).
  Replacing a photograph — even under the same filename — changes its hash, URL and
  cache key on the next deployment, so nothing stale is served. HTML and `/media/*`
  originals keep revalidated caching. The film stream URL carries the MP4's hash
  (`/film/<file>?v=<hash>`) and is cached as immutable for that hash only.
- Typed access and slot/gallery logic: `src/content/media.ts`, `src/lib/compose-gallery.ts`.
- Tests: `npm test`. Content check: `npm run media:check`.
