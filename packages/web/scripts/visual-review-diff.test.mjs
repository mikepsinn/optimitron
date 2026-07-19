/**
 * Tests for visual-review-diff.mjs.
 * Run: cd packages/web && pnpm exec node --test scripts/visual-review-diff.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { isSignificantDimensionChange } from "./visual-review-diff.mjs";

test("identical dimensions are not a change", () => {
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 4000 }, { width: 1440, height: 4000 }),
    false,
  );
});

test("any width difference is a real change (fixed viewport)", () => {
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 4000 }, { width: 1441, height: 4000 }),
    true,
  );
});

test("a few-pixel height delta below the floor is noise, not a change", () => {
  // The reported bug: a sub-pixel reflow shifts total height by a handful of
  // px and force-flags every route sharing chrome.
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 2000 }, { width: 1440, height: 2005 }),
    false,
  );
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 2000 }, { width: 1440, height: 1995 }),
    false,
  );
});

test("a large height delta (a real inserted/removed component) still flags", () => {
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 2000 }, { width: 1440, height: 2200 }),
    true,
  );
});

test("the tolerance scales with page height", () => {
  // Tall page: 0.4% of 5000 = 20px, so a 15px delta is still noise...
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 5000 }, { width: 1440, height: 5015 }),
    false,
  );
  // ...but a 25px delta exceeds it.
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 5000 }, { width: 1440, height: 5025 }),
    true,
  );
  // Short page uses the absolute floor (12px), not the ratio.
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 800 }, { width: 1440, height: 810 }),
    false,
  );
  assert.equal(
    isSignificantDimensionChange({ width: 1440, height: 800 }, { width: 1440, height: 815 }),
    true,
  );
});

test("options override the defaults", () => {
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 2000 },
      { width: 1440, height: 2005 },
      { tolerancePx: 2, toleranceRatio: 0 },
    ),
    true,
  );
});
