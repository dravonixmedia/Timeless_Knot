/**
 * HTTP byte ranges for video streaming. Safari and iOS only play a <video>
 * whose server answers `Range` requests with `206 Partial Content`. Pure, so it
 * is unit-tested directly (tests/byte-range.test.mjs).
 */

export type ByteRange = { start: number; end: number };

/**
 * Parses a single-range `Range` header against a resource of `size` bytes.
 * Returns undefined when there is no usable Range header (serve the whole
 * file), or "unsatisfiable" for a range outside the file (answer 416).
 * Multi-range requests are answered with the whole file, as RFC 9110 allows.
 */
export function parseRange(header: string | null, size: number): ByteRange | "unsatisfiable" | undefined {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return undefined;
  const [, from, to] = match;
  if (from === "" && to === "") return undefined;
  if (from === "") {
    // Suffix range: the last N bytes.
    const length = Number(to);
    if (length === 0) return "unsatisfiable";
    return { start: Math.max(0, size - length), end: size - 1 };
  }
  const start = Number(from);
  const end = to === "" ? size - 1 : Math.min(Number(to), size - 1);
  if (start >= size || end < start) return "unsatisfiable";
  return { start, end };
}

/** A stream transform that passes through only bytes start..end (inclusive). */
export function sliceStream({ start, end }: ByteRange): TransformStream<Uint8Array, Uint8Array> {
  let offset = 0;
  return new TransformStream({
    transform(chunk, controller) {
      const chunkStart = offset;
      offset += chunk.byteLength;
      if (offset <= start || chunkStart > end) return;
      controller.enqueue(chunk.subarray(Math.max(0, start - chunkStart), Math.min(chunk.byteLength, end - chunkStart + 1)));
      if (offset > end) controller.terminate();
    },
  });
}
