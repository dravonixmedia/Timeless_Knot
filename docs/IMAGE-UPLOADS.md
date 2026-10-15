# Uploading photographs — Timeless Knot

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
│   └── featured/      Home page photographs: “The Art of Remembering” portrait,
│                      the full-width “Moments Pass” photograph and the two small
│                      photographs beside the closing invitation (on every page)
├── about/             Our Story page (4 photographs)
├── experience/        The Experience page (2 photographs)
├── contact/           Contact page portrait (1 photograph)
├── weddings/          Photos here → Weddings portfolio gallery
│   └── <story-name>/  A subfolder with story.json → an individual wedding story
├── pre-wedding/       Photos here → Pre-Wedding portfolio gallery
│   └── <story-name>/  (optional) individual pre-wedding story
└── couples/           Photos here → Couples portfolio gallery
    └── <story-name>/  (optional) individual couple story
```

**Two kinds of upload, depending on where the photo goes:**

| You want… | Upload to | Needs `story.json`? | Appears on |
| --- | --- | --- | --- |
| Photos in the **portfolio** | directly into `weddings/`, `pre-wedding/` or `couples/` | **No** | Wedding Stories page → Portfolio (filter by category) |
| A full **wedding story** with its own page | a new subfolder, e.g. `weddings/anika-and-rohan/` | **Yes** (with `"published": true`) | Its own page `/stories/anika-and-rohan` + story listings |

### Portfolio galleries (`weddings/`, `pre-wedding/`, `couples/`)

- Upload photographs **directly** into the category folder — no metadata file is
  needed. They appear in the Portfolio on the Wedding Stories page after the next
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
landscape position. Positions without a photograph keep their elegant
placeholder, so a half-filled folder never breaks the layout. **Extra images
beyond the number of positions are uploaded but not shown** — put additional
portfolio photographs in a category gallery folder instead.

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
- Stories appear on the Wedding Stories page (with a filter by type) and,
  if `featured`, on the home page. Pre-wedding and couple stories use the same
  pages and layouts.
- While no real story is published, the site shows its clearly labelled
  demonstration stories. They disappear as soon as the first real story is live.

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

- Generator: `scripts/media/generate-image-manifest.mjs` (runs in `npm run build`,
  `npm run dev` and after `npm install`). Output: `src/content/generated/media-manifest.json`
  and `public/.assetsignore` (both generated, not committed).
- Typed access and slot/gallery logic: `src/content/media.ts`, `src/lib/compose-gallery.ts`.
- Tests: `npm test`. Content check: `npm run media:check`.
