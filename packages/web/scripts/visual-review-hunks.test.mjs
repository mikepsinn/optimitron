/**
 * Tests for visual-review-hunks.mjs.
 * Run: cd packages/web && pnpm exec node --test scripts/visual-review-hunks.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractHunksAndAlignment } from './visual-review-hunks.mjs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const SLAB = 8;
const WIDTH = 640;
const WHITE = [255, 255, 255];

/**
 * Deterministic per-slab color, unique under 4-bit quantization for the
 * first 4096 slabs (channel value = (nibble << 4) + 8, mid-bucket).
 */
function contentColor(y) {
  const i = Math.floor(y / SLAB);
  return [((i & 15) << 4) + 8, (((i >> 4) & 15) << 4) + 8, (((i >> 8) & 15) << 4) + 8];
}

function makePng(height, colorFor, width = WIDTH) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const [r, g, b] = colorFor(y);
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      png.data[o] = r;
      png.data[o + 1] = g;
      png.data[o + 2] = b;
      png.data[o + 3] = 255;
    }
  }
  return png;
}

function assertMonotonicAnchors(anchors) {
  for (let k = 1; k < anchors.length; k++) {
    assert.ok(
      anchors[k].beforeY >= anchors[k - 1].beforeY,
      `anchor ${k} beforeY not monotonic`,
    );
    assert.ok(
      anchors[k].afterY >= anchors[k - 1].afterY,
      `anchor ${k} afterY not monotonic`,
    );
  }
}

test('identical images: 0 hunks, full anchors, 100% matched', () => {
  const before = makePng(2000, contentColor);
  const after = makePng(2000, contentColor);
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 0);
  assert.equal(res.matchedPct, 100);
  assert.equal(res.slabCount, 250);
  assert.deepEqual(res.alignmentAnchors[0], { beforeY: 0, afterY: 0 });
  assert.deepEqual(res.alignmentAnchors[res.alignmentAnchors.length - 1], {
    beforeY: 2000,
    afterY: 2000,
  });
  assertMonotonicAnchors(res.alignmentAnchors);
});

test('width mismatch: identical content at different widths compares at min width', () => {
  const before = makePng(2000, contentColor, 640);
  const after = makePng(2000, contentColor, 600);
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 0);
  assert.equal(res.matchedPct, 100);
});

test('recolored band mid-page: 1 changed hunk covering the band plus context', () => {
  const before = makePng(2000, contentColor);
  // rows 800..1199 (slabs 100..149) recolored
  const after = makePng(2000, (y) => (y >= 800 && y < 1200 ? WHITE : contentColor(y)));
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 1);
  const hunk = res.hunks[0];
  assert.equal(hunk.kind, 'changed');
  assert.equal(hunk.before.yStart, 800 - 160);
  assert.equal(hunk.before.yEnd, 1200 + 160);
  assert.equal(hunk.after.yStart, 800 - 160);
  assert.equal(hunk.after.yEnd, 1200 + 160);
  assert.equal(hunk.pctOfPage, 20); // 50 of 250 slabs

  assertMonotonicAnchors(res.alignmentAnchors);
  // content above and below the band stays aligned 1:1
  for (const a of res.alignmentAnchors) assert.equal(a.beforeY, a.afterY);
});

test('400px band inserted mid-page: 1 inserted hunk, anchors realign below', () => {
  const before = makePng(2000, contentColor);
  const after = makePng(2400, (y) => {
    if (y < 1000) return contentColor(y);
    if (y < 1400) return WHITE; // inserted band
    return contentColor(y - 400); // original content shifted down
  });
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 1);
  const hunk = res.hunks[0];
  assert.equal(hunk.kind, 'inserted');
  assert.equal(hunk.after.yStart, 1000 - 160);
  assert.equal(hunk.after.yEnd, 1400 + 160);
  // before side is the insertion point extended by context
  assert.equal(hunk.before.yStart, 1000 - 160);
  assert.equal(hunk.before.yEnd, 1000 + 160);
  assert.ok(hunk.pctOfPage > 10);

  const anchors = res.alignmentAnchors;
  assertMonotonicAnchors(anchors);
  assert.deepEqual(anchors[0], { beforeY: 0, afterY: 0 });
  assert.deepEqual(anchors[anchors.length - 1], { beforeY: 2000, afterY: 2400 });
  // every anchor below the inserted band carries the +400 offset
  const postInsert = anchors.filter((a) => a.afterY >= 1400);
  assert.ok(postInsert.length > 0, 'expected anchors below the inserted band');
  for (const a of postInsert) assert.equal(a.afterY - a.beforeY, 400);
  // content above the band stays aligned 1:1
  for (const a of anchors.filter((x) => x.afterY <= 1000)) {
    assert.equal(a.beforeY, a.afterY);
  }
});

test('400px band deleted mid-page: 1 deleted hunk, anchors realign below', () => {
  const before = makePng(2400, (y) => {
    if (y < 1000) return contentColor(y);
    if (y < 1400) return WHITE;
    return contentColor(y - 400);
  });
  const after = makePng(2000, contentColor);
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 1);
  const hunk = res.hunks[0];
  assert.equal(hunk.kind, 'deleted');
  assert.equal(hunk.before.yStart, 1000 - 160);
  assert.equal(hunk.before.yEnd, 1400 + 160);
  assert.equal(hunk.after.yStart, 1000 - 160);
  assert.equal(hunk.after.yEnd, 1000 + 160);

  const postDelete = res.alignmentAnchors.filter((a) => a.beforeY >= 1400);
  assert.ok(postDelete.length > 0);
  for (const a of postDelete) assert.equal(a.beforeY - a.afterY, 400);
});

test('noise below the floor is dropped when a real hunk exists', () => {
  const before = makePng(2000, contentColor);
  const after = makePng(2000, (y) => {
    if (y >= 800 && y < 1200) return WHITE; // real change: 50 slabs = 20%
    if (y >= 1760 && y < 1768) return WHITE; // noise: 1 slab = 0.4%
    return contentColor(y);
  });
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 1);
  assert.equal(res.hunks[0].kind, 'changed');
  assert.equal(res.hunks[0].before.yStart, 640);
  assert.equal(res.hunks[0].before.yEnd, 1360); // noise did not stretch the hunk
});

test('a below-floor hunk survives when it is the only hunk', () => {
  const before = makePng(2000, contentColor);
  const after = makePng(2000, (y) => (y >= 1760 && y < 1768 ? WHITE : contentColor(y)));
  const res = extractHunksAndAlignment({ before, after });

  assert.equal(res.hunks.length, 1);
  assert.equal(res.hunks[0].kind, 'changed');
  assert.ok(res.hunks[0].pctOfPage < 10);
  assert.equal(res.hunks[0].before.yStart, 1760 - 160);
  assert.equal(res.hunks[0].before.yEnd, 1768 + 160);
});
