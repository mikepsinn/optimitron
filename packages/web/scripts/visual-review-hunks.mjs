/**
 * visual-review-hunks.mjs
 *
 * Computes screenshot diff HUNKS and a scroll ALIGNMENT map for two
 * full-page screenshots of (possibly) different heights.
 *
 * Dependency-free pure ESM. Callers pass decoded pngjs-shaped PNG objects
 * ({ width, height, data: RGBA buffer }); this module never imports pngjs.
 *
 * Algorithm:
 *   1. Slice each image into horizontal slabs of `slabHeight` px.
 *   2. Hash each slab (RGB quantized >>4, every 4th pixel horizontally,
 *      every 2nd row, over the overlapping width) into a 32-bit FNV-1a hash.
 *   3. LCS-diff the two slab-hash sequences (classic DP; sequences ~1000).
 *   4. Matched slabs -> alignment anchors; unmatched runs -> hunks
 *      ('changed' when both sides have content, 'deleted' before-only,
 *      'inserted' after-only).
 *   5. Merge hunks separated by < contextPx of matched content, drop hunks
 *      below the noise floor (unless the only hunk), extend by contextPx.
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** @typedef {{ width: number, height: number, data: Uint8Array | Buffer }} PngLike */

function assertPngLike(name, png) {
  if (
    !png ||
    !Number.isInteger(png.width) ||
    !Number.isInteger(png.height) ||
    png.width < 0 ||
    png.height < 0
  ) {
    throw new TypeError(`${name} must be a PNG-like object with integer width/height`);
  }
  if (!png.data || png.data.length < png.width * png.height * 4) {
    throw new TypeError(`${name}.data must be an RGBA buffer of >= width*height*4 bytes`);
  }
}

/**
 * Hash every slab of the image. Quantizes RGB to 4 bits per channel so
 * antialiasing / compression wobble does not split hashes, samples every
 * 4th pixel horizontally and every 2nd row, over `sampleWidth` px only
 * (the width both images share).
 *
 * @param {PngLike} png
 * @param {number} slabHeight
 * @param {number} sampleWidth
 * @returns {number[]} one 32-bit hash per slab
 */
function slabHashes(png, slabHeight, sampleWidth) {
  const { data, width, height } = png;
  const count = Math.ceil(height / slabHeight);
  const hashes = new Array(count);
  for (let s = 0; s < count; s++) {
    const yStart = s * slabHeight;
    const yEnd = Math.min(yStart + slabHeight, height);
    let h = FNV_OFFSET;
    for (let y = yStart; y < yEnd; y += 2) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < sampleWidth; x += 4) {
        const o = rowOffset + x * 4;
        const q = ((data[o] >> 4) << 8) | ((data[o + 1] >> 4) << 4) | (data[o + 2] >> 4);
        h = Math.imul(h ^ q, FNV_PRIME);
      }
    }
    hashes[s] = h >>> 0;
  }
  return hashes;
}

/**
 * Classic DP longest-common-subsequence over two hash sequences.
 * Sequences are ~height/slabHeight items (~1000 for a long page), so the
 * O(n*m) table is fine (a 2500x2500 Uint32 table is ~25 MB, transient).
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {Array<[number, number]>} matched index pairs, ascending in both
 */
function lcsMatches(a, b) {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return [];
  const W = m + 1;
  const dp = new Uint32Array((n + 1) * W);
  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1];
    const row = i * W;
    const prev = row - W;
    for (let j = 1; j <= m; j++) {
      if (ai === b[j - 1]) {
        dp[row + j] = dp[prev + j - 1] + 1;
      } else {
        const up = dp[prev + j];
        const left = dp[row + j - 1];
        dp[row + j] = up >= left ? up : left;
      }
    }
  }
  /** @type {Array<[number, number]>} */
  const matches = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matches.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[(i - 1) * W + j] >= dp[i * W + j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  matches.reverse();
  return matches;
}

/**
 * Compute diff hunks and scroll-alignment anchors for two full-page
 * screenshots.
 *
 * @param {object} options
 * @param {PngLike} options.before
 * @param {PngLike} options.after
 * @param {number} [options.slabHeight=8]   slab height in px
 * @param {number} [options.contextPx=160]  merge threshold + hunk padding in px
 * @param {number} [options.noiseFloorPct=0.10] hunks changing fewer slabs than
 *   this fraction of the page are dropped (unless the only hunk)
 * @returns {{
 *   hunks: Array<{
 *     before: { yStart: number, yEnd: number },
 *     after: { yStart: number, yEnd: number },
 *     kind: 'changed' | 'inserted' | 'deleted',
 *     pctOfPage: number,
 *   }>,
 *   alignmentAnchors: Array<{ beforeY: number, afterY: number }>,
 *   matchedPct: number,
 *   slabCount: number,
 * }}
 */
export function extractHunksAndAlignment({
  before,
  after,
  slabHeight = 8,
  contextPx = 160,
  noiseFloorPct = 0.1,
}) {
  assertPngLike('before', before);
  assertPngLike('after', after);
  if (!Number.isInteger(slabHeight) || slabHeight < 1) {
    throw new TypeError('slabHeight must be a positive integer');
  }

  const beforeHeight = before.height;
  const afterHeight = after.height;
  // Width mismatch: hash only the overlapping width so identical content
  // at different capture widths still matches.
  const sampleWidth = Math.min(before.width, after.width);

  const beforeHashes = slabHashes(before, slabHeight, sampleWidth);
  const afterHashes = slabHashes(after, slabHeight, sampleWidth);
  const slabCount = Math.max(beforeHashes.length, afterHashes.length);

  const matches = lcsMatches(beforeHashes, afterHashes);

  /** Slab index -> pixel y, clamped to the image height (last slab may be partial). */
  const bPx = (slab) => Math.min(slab * slabHeight, beforeHeight);
  const aPx = (slab) => Math.min(slab * slabHeight, afterHeight);

  // ---- raw hunks: the unmatched gaps between consecutive matches ----
  /** @type {Array<{ kind: 'changed'|'inserted'|'deleted', before: {yStart:number,yEnd:number}, after: {yStart:number,yEnd:number}, changedSlabs: number }>} */
  const raw = [];
  let cursorB = 0;
  let cursorA = 0;
  const flushGap = (endB, endA) => {
    const lenB = endB - cursorB;
    const lenA = endA - cursorA;
    if (lenB === 0 && lenA === 0) return;
    raw.push({
      kind: lenB > 0 && lenA > 0 ? 'changed' : lenB > 0 ? 'deleted' : 'inserted',
      before: { yStart: bPx(cursorB), yEnd: bPx(endB) },
      after: { yStart: aPx(cursorA), yEnd: aPx(endA) },
      // extent of the change: the larger of the two runs
      changedSlabs: Math.max(lenB, lenA),
    });
  };
  for (const [mi, mj] of matches) {
    flushGap(mi, mj);
    cursorB = mi + 1;
    cursorA = mj + 1;
  }
  flushGap(beforeHashes.length, afterHashes.length);

  // ---- merge hunks separated by < contextPx of matched content ----
  const merged = [];
  for (const h of raw) {
    const last = merged[merged.length - 1];
    if (last) {
      const gap = Math.min(
        h.before.yStart - last.before.yEnd,
        h.after.yStart - last.after.yEnd,
      );
      if (gap < contextPx) {
        last.before.yEnd = h.before.yEnd;
        last.after.yEnd = h.after.yEnd;
        last.changedSlabs += h.changedSlabs;
        if (last.kind !== h.kind) last.kind = 'changed';
        continue;
      }
    }
    merged.push({
      kind: h.kind,
      before: { ...h.before },
      after: { ...h.after },
      changedSlabs: h.changedSlabs,
    });
  }

  // ---- noise floor: drop tiny hunks unless it's the only hunk ----
  const floorSlabs = noiseFloorPct * slabCount;
  const kept =
    merged.length === 1 ? merged : merged.filter((h) => h.changedSlabs >= floorSlabs);

  // ---- extend each hunk by contextPx both sides (clamped) ----
  const hunks = kept.map((h) => ({
    before: {
      yStart: Math.max(0, h.before.yStart - contextPx),
      yEnd: Math.min(beforeHeight, h.before.yEnd + contextPx),
    },
    after: {
      yStart: Math.max(0, h.after.yStart - contextPx),
      yEnd: Math.min(afterHeight, h.after.yEnd + contextPx),
    },
    kind: h.kind,
    pctOfPage: slabCount === 0 ? 0 : (h.changedSlabs / slabCount) * 100,
  }));

  // ---- alignment anchors ----
  // Collapse matches into runs of consecutive (i, j) pairs; the scroll offset
  // is constant inside a run, so each run contributes its start point and its
  // exclusive end point. Always includes {0,0} and {beforeHeight, afterHeight}.
  const alignmentAnchors = [{ beforeY: 0, afterY: 0 }];
  const pushAnchor = (beforeY, afterY) => {
    const last = alignmentAnchors[alignmentAnchors.length - 1];
    if (beforeY < last.beforeY || afterY < last.afterY) return; // keep monotonic
    if (beforeY === last.beforeY && afterY === last.afterY) return; // dedupe
    alignmentAnchors.push({ beforeY, afterY });
  };
  let r = 0;
  while (r < matches.length) {
    let e = r;
    while (
      e + 1 < matches.length &&
      matches[e + 1][0] === matches[e][0] + 1 &&
      matches[e + 1][1] === matches[e][1] + 1
    ) {
      e++;
    }
    pushAnchor(bPx(matches[r][0]), aPx(matches[r][1]));
    pushAnchor(bPx(matches[e][0] + 1), aPx(matches[e][1] + 1));
    r = e + 1;
  }
  pushAnchor(beforeHeight, afterHeight);

  return {
    hunks,
    alignmentAnchors,
    matchedPct: slabCount === 0 ? 100 : (matches.length / slabCount) * 100,
    slabCount,
  };
}
