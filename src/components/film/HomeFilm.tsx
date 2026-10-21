"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { HomeVideo } from "@/content/media";
import { homeVideoStreamUrl } from "@/lib/home-video";
import { Picture } from "@/components/media/Picture";
import { toMedia } from "@/lib/compose-gallery";

type Props = {
  video: HomeVideo;
  title?: string;
  /** Start playing as soon as it mounts: the visitor chose this film (film collection). */
  autoStart?: boolean;
  /** Initial sound state — lets the collection keep a visitor's choice across films. Default muted. */
  initialMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
};

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

const REDUCE = "(prefers-reduced-motion: reduce)";
/** How long the frame must stay well out of view before its source is released. */
const RELEASE_AFTER_MS = 120000;
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
/** Autoplay only without reduced motion and without Data Saver. */
const canAutoplay = () =>
  !window.matchMedia(REDUCE).matches &&
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData !== true;

/**
 * The homepage cinematic film, uploaded to public/media/home/video/.
 *
 * - Nothing is downloaded until the frame is near the viewport (`preload="none"`
 *   and no source until then); it pauses whenever it scrolls out of view.
 * - It buffers ahead (`preload="auto"`) only while it is on screen and playing
 *   or about to autoplay. Paused or scrolled away it switches to
 *   `preload="metadata"`, which stops further downloading while keeping what is
 *   already buffered, so resuming does not fetch it again.
 * - As a safety net for browsers that ignore that switch, the source is released
 *   after the frame has been well away from the viewport for a while; it is
 *   re-attached before the frame scrolls back in and resumes from the same moment.
 * - Plays muted, inline and looping where the browser allows autoplay. If
 *   autoplay is refused — or the visitor prefers reduced motion or has Data
 *   Saver on — it waits on its poster / first frame for a press of Play.
 * - Sound only ever starts from the visitor's own click on Unmute.
 * - Full screen uses the frame (custom controls stay available), or the native
 *   video player where only that is allowed (iPhone Safari).
 * - In the film collection a film the visitor picks starts at once
 *   (`autoStart`), keeping their sound choice; it never starts with sound by itself.
 * - The frame takes the video's own aspect ratio, so the footage is never
 *   stretched or cropped and the layout never shifts as it loads.
 */
export function HomeFilm({ video, title = "Timeless Knot wedding film", autoStart = false, initialMuted = true, onMutedChange }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  /** The source is attached: the frame is near the viewport, or left it only moments ago. */
  const [near, setNear] = useState(autoStart);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [fullscreen, setFullscreen] = useState(false);
  /** Played once on mount when the visitor picked this film. */
  const startNow = useRef(autoStart);
  const [shown, setShown] = useState(false);
  /** A meaningful part of the frame is on screen. */
  const [onScreen, setOnScreen] = useState(false);
  /** null on the server: avoids flashing a Play button before autoplay starts. */
  const autoplay = useSyncExternalStore<boolean | null>(subscribeMotion, canAutoplay, () => null);
  /** The browser refused autoplay (e.g. Low Power Mode): wait for a press of Play. */
  const [blocked, setBlocked] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  /** Mirrors pausedByUser for the observers: never resume a film the visitor paused. */
  const userPaused = useRef(false);
  const inView = useRef(false);
  /** Playback position to restore when a released source is attached again. */
  const resumeAt = useRef(0);

  const tryPlay = useCallback(() => {
    ref.current?.play().then(
      () => setBlocked(false),
      () => {
        setPlaying(false);
        setBlocked(true);
      },
    );
  }, []);

  const setUserPaused = (value: boolean) => {
    userPaused.current = value;
    setPausedByUser(value);
  };

  const allowed = useRef(false);
  useEffect(() => {
    allowed.current = autoplay === true;
  }, [autoplay]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    // Attach the source a little before the frame scrolls in, and release it
    // once the frame has stayed well away for a while (stops the download).
    let release: ReturnType<typeof setTimeout> | undefined;
    const preload = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(release);
        if (entry.isIntersecting) setNear(true);
        else
          release = setTimeout(() => {
            setNear(false);
            setShown(false);
          }, RELEASE_AFTER_MS);
      },
      { rootMargin: "400px 0px" },
    );
    // …and play only while a meaningful part of it is visible.
    const visible = new IntersectionObserver(
      ([entry]) => {
        const v = ref.current;
        inView.current = entry.isIntersecting;
        setOnScreen(entry.isIntersecting);
        if (!v) return;
        if (entry.isIntersecting) {
          if (allowed.current && !userPaused.current) tryPlay();
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: 0.35 },
    );
    preload.observe(el);
    visible.observe(el);
    return () => {
      clearTimeout(release);
      preload.disconnect();
      visible.disconnect();
    };
  }, [tryPlay]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!near) {
      // Source released: remember the position, then load() with no source,
      // which aborts the in-flight download and frees the buffer.
      if (v.currentTime > 0) resumeAt.current = v.currentTime;
      if (v.networkState !== v.NETWORK_EMPTY) v.load();
      return;
    }
    // Once the source is attached, start straight away if the frame is already in
    // view — or at once if the visitor just chose this film.
    v.muted = startNow.current ? initialMuted : true;
    if (startNow.current) {
      startNow.current = false;
      tryPlay();
    } else if (autoplay && inView.current && !userPaused.current) tryPlay();
    // initialMuted only applies to the first start; later changes come from the controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, autoplay, tryPlay]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const togglePlay = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (!near) setNear(true);
    if (v.paused) {
      setUserPaused(false);
      tryPlay();
    } else {
      setUserPaused(true);
      v.pause();
    }
  }, [near, tryPlay]);

  const toggleFullscreen = useCallback(() => {
    const el = frame.current;
    const v = ref.current as FullscreenVideo | null;
    if (!el || !v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (!near) setNear(true);
    if (el.requestFullscreen) el.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
  }, [near]);

  const toggleMute = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) {
      setUserPaused(false);
      tryPlay();
    }
  }, [tryPlay]);

  const ratio = video.width / video.height;
  // Without autoplay and without a poster, show the first frame instead of a blank frame.
  const stream = homeVideoStreamUrl(video);
  const src = near ? (autoplay || video.poster ? stream : `${stream}#t=0.1`) : undefined;
  // Buffer ahead only while the film is on screen and playing or about to autoplay.
  const preloadMode = !near
    ? "none"
    : onScreen && (playing || (autoplay && !pausedByUser && !blocked))
      ? "auto"
      : "metadata";
  const waiting = !playing && (autoplay === false || blocked || pausedByUser);

  return (
    <figure className="relative">
      <div
        ref={frame}
        className="group relative mx-auto w-full overflow-hidden bg-charcoal [&:fullscreen_video]:object-contain"
        style={{ aspectRatio: `${video.width} / ${video.height}`, maxWidth: `calc(82svh * ${ratio.toFixed(4)})` }}
      >
        {video.poster && (
          <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${shown ? "opacity-0" : "opacity-100"}`}>
            <Picture media={toMedia(video.poster)} layout="fill" sizes="(min-width: 1024px) 90vw, 100vw" />
          </div>
        )}

        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${shown || !video.poster ? "opacity-100" : "opacity-0"}`}
          src={src}
          muted
          loop
          playsInline
          preload={preloadMode}
          aria-label={title}
          onLoadedMetadata={(e) => {
            if (resumeAt.current > 0) {
              e.currentTarget.currentTime = resumeAt.current;
              resumeAt.current = 0;
            }
          }}
          onPlaying={() => {
            setPlaying(true);
            setShown(true);
          }}
          onPause={() => setPlaying(false)}
          onVolumeChange={(e) => {
            setMuted(e.currentTarget.muted);
            onMutedChange?.(e.currentTarget.muted);
          }}
        />

        {/* Large play affordance only while the film is waiting for the visitor. */}
        {waiting && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center text-ivory"
            aria-label={`Play ${title}`}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-ivory/60 bg-charcoal/20 backdrop-blur-[2px] transition-[transform,background-color] duration-700 ease-[var(--ease-editorial)] hover:scale-105 hover:bg-ivory/10 sm:h-24 sm:w-24">
              <PlayIcon className="ml-1 h-5 w-5" />
            </span>
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-charcoal/55 to-transparent px-4 pb-4 pt-12 text-ivory sm:px-6 sm:pb-5">
          <button
            type="button"
            onClick={togglePlay}
            className="meta flex min-h-11 items-center gap-3 text-[0.6rem] tracking-[0.2em]"
            aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          >
            {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
            <span aria-hidden="true">{playing ? "Pause" : "Play"}</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            {video.hasAudio && (
              <button
                type="button"
                onClick={toggleMute}
                aria-pressed={!muted}
                className="meta flex min-h-11 items-center gap-3 text-[0.6rem] tracking-[0.2em]"
                aria-label={muted ? "Turn sound on" : "Turn sound off"}
              >
                {muted ? <MutedIcon className="h-4 w-4" /> : <SoundIcon className="h-4 w-4" />}
                <span aria-hidden="true">{muted ? "Sound off" : "Sound on"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex min-h-11 min-w-11 items-center justify-center"
              aria-label={fullscreen ? "Exit full screen" : `Watch ${title} in full screen`}
            >
              {fullscreen ? <ShrinkIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </figure>
  );
}

function PlayIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 18" className={className} fill="currentColor" aria-hidden="true">
      <path d="M0 0l16 9-16 9z" />
    </svg>
  );
}

function PauseIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 18" className={className} fill="currentColor" aria-hidden="true">
      <path d="M1 0h4.5v18H1zM10.5 0H15v18h-4.5z" />
    </svg>
  );
}

function MutedIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M17 9l5 6M22 9l-5 6" strokeLinecap="round" />
    </svg>
  );
}

function SoundIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" />
    </svg>
  );
}

function ShrinkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" />
    </svg>
  );
}
