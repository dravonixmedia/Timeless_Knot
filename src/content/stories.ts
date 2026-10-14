import type { Media, PlateTone, WeddingStory } from "./types";

/**
 * Wedding stories.
 *
 * IMPORTANT: no real client weddings have been supplied yet. Every entry below
 * is DEMONSTRATION content (`isDemo: true`) that shows how a story will be art
 * directed. Demo entries carry no couple names, locations or dates, are labelled
 * on screen, excluded from the sitemap and marked noindex. Replace them with
 * verified client stories (and real photographs via `src`) before launch.
 */

const plate = (
  width: number,
  height: number,
  brief: string,
  tone: PlateTone,
  alt = `Placeholder for a photograph: ${brief.toLowerCase()}`,
): Media => ({ width, height, brief, tone, alt });

export const stories: WeddingStory[] = [
  {
    slug: "under-the-eucalyptus",
    title: "Under the Eucalyptus",
    category: "Wedding Photography",
    featured: true,
    isDemo: true,
    excerpt: "A garden ceremony told through soft light, quiet glances and the hands of family.",
    introduction: [
      "Some celebrations unfold slowly — a morning of quiet preparation, a garden filling with the people who matter most, a ceremony held in the soft green shade of old trees.",
      "This feature demonstrates how a Timeless Knot wedding will be presented: an unhurried sequence of moments, given the space to breathe, arranged the way the day was felt rather than simply the order in which it happened.",
    ],
    closing: "Not simply the day as it happened — but the day as it felt.",
    cover: plate(1800, 1200, "The couple beneath the trees, late afternoon light", "forest"),
    gallery: [
      { kind: "single", image: plate(1200, 1500, "Morning preparations by the window", "pale"), align: "left", caption: "The quiet before." },
      { kind: "pair", images: [plate(1000, 1400, "A parent fastening a detail", "sage"), plate(1000, 1400, "Hands, rings, a held breath", "charcoal")], stagger: true },
      { kind: "full", image: plate(2400, 1200, "The ceremony seen from the back of the garden", "forest") },
      { kind: "statement", text: "Every glance, every hand held a little longer, every tear that fell without warning." },
      { kind: "trio", images: [plate(900, 1200, "Guests in conversation", "pale"), plate(900, 1200, "A grandmother’s smile", "sage"), plate(900, 1200, "Petals mid-air", "porcelain")] },
      { kind: "single", image: plate(1600, 1066, "Portrait of the couple walking away", "charcoal"), align: "right", caption: "Afterwards, alone together." },
      { kind: "full", image: plate(2400, 1350, "Evening celebration under string lights", "forest") },
    ],
    film: {
      title: "Under the Eucalyptus — Wedding Film",
      poster: plate(2400, 1004, "Opening frame of the wedding film", "forest"),
    },
  },
  {
    slug: "a-promise-in-the-hills",
    title: "A Promise in the Hills",
    category: "Elopement",
    featured: true,
    isDemo: true,
    excerpt: "An intimate elopement — two people, an open horizon, and nothing else required.",
    introduction: [
      "An elopement asks for very little: a place that means something, a promise spoken plainly, and the freedom to let the day find its own shape.",
      "This demonstration shows how a small, adventurous celebration can be told with the same care as the grandest wedding — wide landscapes, close portraits and the silence in between.",
    ],
    closing: "The smallest celebrations often hold the largest feelings.",
    cover: plate(1200, 1600, "The couple on a ridge, wind in their clothes", "sage"),
    gallery: [
      { kind: "full", image: plate(2400, 1030, "Wide landscape with two small figures", "pale") },
      { kind: "pair", images: [plate(1000, 1250, "Exchanging handwritten vows", "porcelain"), plate(1000, 1250, "A forehead touch", "sage")] },
      { kind: "statement", text: "No audience. No schedule. Only the two of them, and the promise." },
      { kind: "single", image: plate(1200, 1600, "Portrait in the last light", "charcoal"), align: "center" },
      { kind: "trio", images: [plate(900, 1200, "Boots on the trail", "pale"), plate(900, 1200, "A shared flask of tea", "sage"), plate(900, 1200, "Veil caught by the wind", "porcelain")] },
    ],
  },
  {
    slug: "the-monsoon-mehndi",
    title: "The Monsoon Mehndi",
    category: "Couple Story",
    featured: true,
    isDemo: true,
    excerpt: "Colour, music and rain — a celebration of tradition, family and joyful imperfection.",
    introduction: [
      "Traditions carry the memory of generations. Documenting them well means understanding what each ritual holds for the families who keep it.",
      "This demonstration shows how cultural celebrations will be presented — the detail of every ritual and the spontaneity of everyone gathered around it.",
    ],
    closing: "The rituals are old. The feeling is entirely theirs.",
    cover: plate(1600, 1100, "Hands with fresh mehndi, rain on the window", "charcoal"),
    gallery: [
      { kind: "pair", images: [plate(1000, 1300, "Intricate mehndi in progress", "sage"), plate(1000, 1300, "Laughter between cousins", "pale")], stagger: true },
      { kind: "full", image: plate(2400, 1300, "Dancing in the courtyard during rain", "forest") },
      { kind: "single", image: plate(1200, 1500, "A quiet moment with the bride’s mother", "porcelain"), align: "right", caption: "Between songs." },
      { kind: "statement", text: "Joy is rarely perfect. It is always worth remembering." },
    ],
  },
  {
    slug: "a-quiet-city-wedding",
    title: "A Quiet City Wedding",
    category: "Wedding Film",
    featured: false,
    isDemo: true,
    excerpt: "A small registry ceremony and an evening walk through familiar streets.",
    introduction: [
      "A wedding does not need a grand stage to be extraordinary. Sometimes the most meaningful backdrop is the city a couple already calls home.",
      "This demonstration shows how a wedding film and still photographs can live together in one story.",
    ],
    closing: "Familiar streets, seen for the first time.",
    cover: plate(1800, 1200, "The couple crossing a street at dusk", "forest"),
    gallery: [
      { kind: "single", image: plate(1600, 1066, "Signing the register", "pale"), align: "left" },
      { kind: "pair", images: [plate(1000, 1400, "Confetti on the steps", "porcelain"), plate(1000, 1400, "An evening portrait by a lamppost", "charcoal")] },
      { kind: "full", image: plate(2400, 1030, "City lights reflected after rain", "forest") },
    ],
    film: {
      title: "A Quiet City Wedding — Film",
      poster: plate(2400, 1004, "Opening frame of the city wedding film", "charcoal"),
    },
  },
];

export function getStories() {
  return stories;
}

export function getFeaturedStories(limit = 3) {
  return stories.filter((story) => story.featured).slice(0, limit);
}

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export function getNextStory(slug: string) {
  const index = stories.findIndex((story) => story.slug === slug);
  if (index === -1 || stories.length < 2) return undefined;
  return stories[(index + 1) % stories.length];
}

/** Categories that actually contain at least one story — avoids empty filters. */
export function getStoryCategories() {
  return Array.from(new Set(stories.map((story) => story.category)));
}

/** First story with a playable film, used by the home page film showcase. */
export function getShowcaseFilm() {
  return stories.find((story) => story.film?.src || story.film?.embedUrl)?.film;
}
