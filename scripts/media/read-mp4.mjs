/**
 * Minimal, dependency-free MP4 (ISO BMFF) inspector used at build time.
 *
 * Reads only the box headers needed to validate an uploaded homepage film:
 * display dimensions (rotation-aware), duration, the video codec, whether an
 * audio track exists, and whether the `moov` index comes before the media
 * data ("fast start", so playback can begin before the whole file arrives).
 *
 * Returns null when the buffer is not a readable MP4 with a video track.
 */

function* boxes(buf, start, end) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString("latin1", offset + 4, offset + 8);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > end) return;
      size = Number(buf.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) return;
    yield { type, start: offset, body: offset + header, end: offset + size };
    offset += size;
  }
}

const child = (buf, box, type) => {
  for (const b of boxes(buf, box.body, box.end)) if (b.type === type) return b;
  return undefined;
};

const fixed16 = (buf, at) => buf.readInt32BE(at) / 65536;

function readTrack(buf, trak) {
  const tkhd = child(buf, trak, "tkhd");
  const mdia = child(buf, trak, "mdia");
  const hdlr = mdia && child(buf, mdia, "hdlr");
  if (!tkhd || !hdlr) return undefined;
  const handler = buf.toString("latin1", hdlr.body + 8, hdlr.body + 12);

  // tkhd: version 1 uses 64-bit times, shifting the matrix and size by 12 bytes.
  const v1 = buf[tkhd.body] === 1;
  const matrix = tkhd.body + (v1 ? 52 : 40);
  const sizeAt = matrix + 36;
  if (sizeAt + 8 > tkhd.end) return { handler };
  let width = Math.round(fixed16(buf, sizeAt));
  let height = Math.round(fixed16(buf, sizeAt + 4));
  // A 90° / 270° rotation matrix has a = d = 0: the display is transposed.
  if (fixed16(buf, matrix) === 0 && fixed16(buf, matrix + 16) === 0) [width, height] = [height, width];

  let codec;
  const stbl = child(buf, child(buf, mdia, "minf") ?? mdia, "stbl");
  const stsd = stbl && child(buf, stbl, "stsd");
  if (stsd && stsd.body + 16 <= stsd.end) codec = buf.toString("latin1", stsd.body + 12, stsd.body + 16);

  return { handler, width, height, codec };
}

export function readMp4(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16) return null;
  const top = [...boxes(buf, 0, buf.length)];
  if (top[0]?.type !== "ftyp") return null;
  const moovIndex = top.findIndex((b) => b.type === "moov");
  const mdatIndex = top.findIndex((b) => b.type === "mdat");
  if (moovIndex === -1) return null;
  const moov = top[moovIndex];

  let duration = 0;
  const mvhd = child(buf, moov, "mvhd");
  if (mvhd) {
    const v1 = buf[mvhd.body] === 1;
    const timescale = buf.readUInt32BE(mvhd.body + (v1 ? 20 : 12));
    const units = v1 ? Number(buf.readBigUInt64BE(mvhd.body + 24)) : buf.readUInt32BE(mvhd.body + 16);
    if (timescale) duration = units / timescale;
  }

  const tracks = [];
  for (const b of boxes(buf, moov.body, moov.end)) if (b.type === "trak") tracks.push(readTrack(buf, b));
  const video = tracks.find((t) => t?.handler === "vide" && t.width > 0 && t.height > 0);
  if (!video) return null;

  return {
    width: video.width,
    height: video.height,
    codec: video.codec ?? "unknown",
    duration: Math.round(duration * 10) / 10,
    hasAudio: tracks.some((t) => t?.handler === "soun"),
    fastStart: mdatIndex === -1 || moovIndex < mdatIndex,
  };
}
