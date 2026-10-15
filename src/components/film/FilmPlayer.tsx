"use client";

import { useEffect, useRef, useState } from "react";
import type { Film } from "@/content/types";
import { Picture } from "@/components/media/Picture";

type Props = {
  /** A playable film (self-hosted `src` or an `embedUrl`). */
  film: Film;
  sizes?: string;
};

/**
 * Cinematic film frame. Nothing is downloaded until the visitor presses play:
 * the poster is a normal optimised image and the video (or embed) loads on
 * demand, with native accessible controls and sound only by user choice.
 */
export function FilmPlayer({ film, sizes = "(min-width: 1024px) 90vw, 100vw" }: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (playing) video?.focus();
    // Pause if the route is hidden by <Activity> or the player unmounts.
    return () => video?.pause();
  }, [playing]);

  return (
    <figure className="relative">
      <div className="relative aspect-video overflow-hidden bg-charcoal lg:aspect-[2.39/1]">
        {playing && film.src ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            src={film.src}
            controls
            autoPlay
            playsInline
            preload="metadata"
            aria-label={film.title}
          />
        ) : playing && film.embedUrl ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={film.embedUrl}
            title={film.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <Picture media={film.poster} layout="fill" sizes={sizes} imageClassName="zoom-media" />
            <div aria-hidden="true" className="absolute inset-0 bg-charcoal/25" />
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex items-center justify-center text-ivory"
              aria-label={`Play film: ${film.title}`}
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-full border border-ivory/60 transition-[transform,background-color] duration-700 ease-[var(--ease-editorial)] group-hover:scale-105 group-hover:bg-ivory/10 sm:h-28 sm:w-28">
                <svg viewBox="0 0 16 18" className="ml-1 h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M0 0l16 9-16 9z" />
                </svg>
              </span>
              <span className="meta absolute bottom-6 left-6 text-[0.65rem] sm:bottom-8 sm:left-8">Play film</span>
            </button>
          </>
        )}
      </div>
      <figcaption className="mt-5 flex items-baseline justify-between gap-6 text-[0.8rem]">
        <span className="font-serif text-lg italic">{film.title}</span>
        {film.duration && <span className="meta text-[0.62rem] opacity-70">{film.duration}</span>}
      </figcaption>
    </figure>
  );
}
