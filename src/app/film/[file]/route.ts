import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getHomeVideo } from "@/content/media";
import { parseRange, sliceStream } from "@/lib/byte-range";

/**
 * Streams the homepage film with HTTP range support.
 *
 * The MP4 itself is a static asset (public/media/home/video/). Safari and iOS
 * only play video from a server that answers Range requests with 206 Partial
 * Content, which the Workers static-asset server cannot be relied on to do, so
 * the player loads it through this route: it reads the asset from the ASSETS
 * binding and returns exactly the requested bytes. Only the one video selected
 * by the media manifest is served; anything else is a 404.
 */
export async function GET(request: Request, { params }: RouteContext<"/film/[file]">) {
  const video = getHomeVideo();
  const { file } = await params;
  if (!video || decodeURIComponent(video.src.split("/").pop() ?? "") !== file) {
    return new Response("Not found", { status: 404 });
  }

  const assetUrl = new URL(video.src, request.url);
  let asset: Response;
  try {
    const { env } = await getCloudflareContext({ async: true });
    asset = env.ASSETS ? await env.ASSETS.fetch(assetUrl) : await fetch(assetUrl);
  } catch {
    // `next dev` / `next start` without the Cloudflare adapter: public/ is served directly.
    asset = await fetch(assetUrl);
  }
  if (!asset.ok || !asset.body) return new Response("Not found", { status: 404 });

  const size = Number(asset.headers.get("content-length")) || video.bytes;
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    // The player's URL carries the film's content hash (?v=…), so that URL can
    // never point at different bytes and is cached for a year: resuming or
    // revisiting re-uses what the browser already holds. Any other URL keeps a
    // short lifetime, so a replaced film is never served stale for long.
    "Cache-Control":
      video.hash && new URL(request.url).searchParams.get("v") === video.hash
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
  });
  const etag = asset.headers.get("etag");
  if (etag) headers.set("ETag", etag);

  const range = parseRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    await asset.body.cancel();
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  if (!range) {
    headers.set("Content-Length", String(size));
    return new Response(asset.body, { status: 200, headers });
  }
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(range.end - range.start + 1));
  return new Response(asset.body.pipeThrough(sliceStream(range)), { status: 206, headers });
}
