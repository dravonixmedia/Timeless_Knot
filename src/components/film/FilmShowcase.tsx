"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import type { HomeFilm as Film } from "@/content/media";
import { HomeFilm } from "@/components/film/HomeFilm";
import { Picture } from "@/components/media/Picture";
import { toMedia } from "@/lib/compose-gallery";
import { reveal } from "@/components/ui/Typography";

const pad = (n: number) => String(n).padStart(2, "0");
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${pad(Math.round(seconds % 60))}`;
const REDUCE = "(prefers-reduced-motion: reduce)";

/**
 * The homepage film collection (two or more films; one film uses HomeFilm alone).
 *
 * One featured player (HomeFilm, with its lazy source, autoplay rules and
 * controls) and, beneath it, a quiet strip of every film: a poster image or a
 * numbered tile, the title and the running time. Choosing a film replaces the
 * player — the previous film is unmounted, which stops it and its download, so
 * two films can never play at once — and starts the chosen one, keeping the
 * visitor's sound choice. Previews are images only: no preview video is loaded.
 * The strip scrolls (and swipes) horizontally; arrow keys move between films.
 */
export function FilmShowcase({ films }: { films: Film[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const [muted, setMuted] = useState(true);
  const player = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const film = films[index];

  const choose = useCallback(
    (i: number) => {
      if (i === index) return;
      setIndex(i);
      setPicked(true);
      // Keep the player in view, so the chosen film is seen (and is not paused as off-screen).
      const frame = player.current;
      if (frame) {
        const { top, bottom } = frame.getBoundingClientRect();
        if (top < 0 || bottom > window.innerHeight) {
          frame.scrollIntoView({ block: "nearest", behavior: window.matchMedia(REDUCE).matches ? "auto" : "smooth" });
        }
      }
    },
    [index],
  );

  // Left/Right (and Home/End) move focus along the strip; Enter or Space plays.
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const buttons = [...(strip.current?.querySelectorAll<HTMLButtonElement>("button[data-film]") ?? [])];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    const next =
      event.key === "ArrowRight" ? current + 1 : event.key === "ArrowLeft" ? current - 1 : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = buttons[Math.max(0, Math.min(buttons.length - 1, next))];
    target.focus();
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: window.matchMedia(REDUCE).matches ? "auto" : "smooth" });
  };

  return (
    <div>
      <div ref={player} {...reveal("mask")}>
        <div key={film.id} className="film-swap">
          <HomeFilm
            video={film}
            title={film.title}
            autoStart={picked}
            initialMuted={muted}
            onMutedChange={setMuted}
          />
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-6 text-pale-sage">
        <p className="meta text-[0.62rem]" aria-live="polite">
          <span className="sr-only">Now showing: </span>
          {film.title}
        </p>
        <p className="meta shrink-0 text-[0.62rem] text-ivory/60" aria-hidden="true">
          {pad(index + 1)} / {pad(films.length)}
        </p>
      </div>

      <div className="mt-12 lg:mt-16" {...reveal("up", 0.1)}>
        <h3 className="sr-only">More films</h3>
        <ul
          ref={strip}
          onKeyDown={onKeyDown}
          className="-mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-5 overflow-x-auto px-[var(--gutter)] pb-3 [scrollbar-width:none] sm:gap-6 lg:gap-8 [&::-webkit-scrollbar]:hidden"
        >
          {films.map((item, i) => {
            const active = i === index;
            return (
              <li key={item.id} className="w-[64%] shrink-0 snap-start sm:w-[38%] lg:w-[23%]">
                <button
                  type="button"
                  data-film=""
                  onClick={() => choose(i)}
                  aria-current={active ? "true" : undefined}
                  aria-label={active ? `${item.title} — now showing` : `Play ${item.title}`}
                  className={`group block w-full text-left transition-opacity duration-500 ${active ? "opacity-100" : "opacity-60 hover:opacity-100 focus-visible:opacity-100"}`}
                >
                  <span className="relative block aspect-video overflow-hidden bg-ivory/[0.06]">
                    {item.poster ? (
                      <Picture
                        media={toMedia(item.poster)}
                        layout="fill"
                        sizes="(min-width: 1024px) 23vw, (min-width: 640px) 38vw, 64vw"
                        imageClassName="zoom-media"
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-serif text-[clamp(2rem,1.6rem+1.6vw,3rem)] font-light italic text-pale-sage/80">
                        {pad(i + 1)}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-4 block h-px origin-left bg-ivory/70 transition-transform duration-700 ease-[var(--ease-editorial)] ${active ? "scale-x-100" : "scale-x-0"}`}
                  />
                  <span className="mt-4 flex items-baseline justify-between gap-4">
                    <span className="meta text-[0.6rem] text-ivory/90">{item.title}</span>
                    <span className="meta shrink-0 text-[0.58rem] text-ivory/50">{duration(item.duration)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
