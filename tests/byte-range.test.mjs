/**
 * Tests for HTTP range handling used by the homepage film route
 * (src/lib/byte-range.ts). Node strips the TypeScript types natively.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRange, sliceStream } from "../src/lib/byte-range.ts";

test("parses the ranges browsers send for video", () => {
  assert.deepEqual(parseRange("bytes=0-1", 1000), { start: 0, end: 1 }); // Safari's probe
  assert.deepEqual(parseRange("bytes=0-", 1000), { start: 0, end: 999 }); // Chrome
  assert.deepEqual(parseRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(parseRange("bytes=900-5000", 1000), { start: 900, end: 999 }, "end is clamped to the file");
  assert.deepEqual(parseRange("bytes=-100", 1000), { start: 900, end: 999 }, "suffix range");
  assert.deepEqual(parseRange("bytes=-5000", 1000), { start: 0, end: 999 });
});

test("no usable Range header means the whole file", () => {
  assert.equal(parseRange(null, 1000), undefined);
  assert.equal(parseRange("", 1000), undefined);
  assert.equal(parseRange("items=0-1", 1000), undefined);
  assert.equal(parseRange("bytes=0-1,5-9", 1000), undefined, "multi-range falls back to the full file");
  assert.equal(parseRange("bytes=-", 1000), undefined);
});

test("ranges outside the file are unsatisfiable", () => {
  assert.equal(parseRange("bytes=1000-", 1000), "unsatisfiable");
  assert.equal(parseRange("bytes=5-2", 1000), "unsatisfiable");
  assert.equal(parseRange("bytes=-0", 1000), "unsatisfiable");
});

async function sliced(chunks, range) {
  const source = new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(Uint8Array.from(chunk));
      c.close();
    },
  });
  const out = [];
  for await (const part of source.pipeThrough(sliceStream(range))) out.push(...part);
  return out;
}

test("slices exactly the requested bytes across chunk boundaries", async () => {
  const chunks = [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]];
  assert.deepEqual(await sliced(chunks, { start: 0, end: 1 }), [0, 1]);
  assert.deepEqual(await sliced(chunks, { start: 2, end: 8 }), [2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(await sliced(chunks, { start: 4, end: 6 }), [4, 5, 6]);
  assert.deepEqual(await sliced(chunks, { start: 9, end: 9 }), [9]);
  assert.deepEqual(await sliced(chunks, { start: 0, end: 9 }), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});
