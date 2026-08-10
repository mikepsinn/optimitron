/**
 * Tests for visual-review-diff.mjs.
 * Run: cd packages/web && pnpm exec node --test scripts/visual-review-diff.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  isNewCopySnapshot,
  isSignificantDimensionChange,
  normalizeVisualReviewMarkdown,
} from "./visual-review-diff.mjs";

test("a newly enrolled existing route has a new copy snapshot", () => {
  assert.equal(
    isNewCopySnapshot(null, "# Existing route\n\nNew snapshot"),
    true,
  );
  assert.equal(isNewCopySnapshot("# Baseline", "# Current"), false);
  assert.equal(isNewCopySnapshot(null, null), false);
});

test("identical dimensions are not a change", () => {
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 4000 },
      { width: 1440, height: 4000 },
    ),
    false,
  );
});

test("any width difference is a real change (fixed viewport)", () => {
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 4000 },
      { width: 1441, height: 4000 },
    ),
    true,
  );
});

test("a few-pixel height delta below the floor is noise, not a change", () => {
  // The reported bug: a sub-pixel reflow shifts total height by a handful of
  // px and force-flags every route sharing chrome.
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 2000 },
      { width: 1440, height: 2005 },
    ),
    false,
  );
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 2000 },
      { width: 1440, height: 1995 },
    ),
    false,
  );
});

test("a large height delta (a real inserted/removed component) still flags", () => {
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 2000 },
      { width: 1440, height: 2200 },
    ),
    true,
  );
});

test("the tolerance scales with page height", () => {
  // Tall page: 0.4% of 5000 = 20px, so a 15px delta is still noise...
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 5000 },
      { width: 1440, height: 5015 },
    ),
    false,
  );
  // ...but a 25px delta exceeds it.
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 5000 },
      { width: 1440, height: 5025 },
    ),
    true,
  );
  // Short page uses the absolute floor (12px), not the ratio.
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 800 },
      { width: 1440, height: 810 },
    ),
    false,
  );
  assert.equal(
    isSignificantDimensionChange(
      { width: 1440, height: 800 },
      { width: 1440, height: 815 },
    ),
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

test("copy diffs ignore recreated preview record ids", () => {
  const before =
    "[Task](/tasks/cmrxvo33400eqwx4s1d6wbbja) " +
    "https%3A%2F%2Fexample.org%2Ftasks%2Fcmrxvo33400eqwx4s1d6wbbja%3Fref%3Dmike";
  const after =
    "[Task](/tasks/cmrya66ud00fc0i1mh34labjl) " +
    "https%3A%2F%2Fexample.org%2Ftasks%2Fcmrya66ud00fc0i1mh34labjl%3Fref%3Dmike";

  assert.equal(
    normalizeVisualReviewMarkdown(
      before,
      "packages/web/src/app/tasks/page.logged-in.md",
    ),
    normalizeVisualReviewMarkdown(
      after,
      "packages/web/src/app/tasks/page.logged-in.md",
    ),
  );
  assert.equal(
    normalizeVisualReviewMarkdown(
      "intramuscular-cobalamin",
      "page.logged-out.md",
    ),
    "intramuscular-cobalamin",
  );
});

test("calendar copy diffs ignore the capture date and generated schedule time", () => {
  const before = [
    "- Thursday, July 23, 2026 · America/Chicago",
    "- [TODAY](/calendar?date=2026-07-23)",
    "|   | Thursday, Jul 23 |",
    "- [7:02 - 7:03 Sign the treaty](/tasks/cmrxvo33400eqwx4s1d6wbbja)",
    "- [7:02 PM Sign the treaty](/tasks/cmrxvo33400eqwx4s1d6wbbja)",
  ].join("\n");
  const after = [
    "- Thursday, January 1, 2036 · America/Chicago",
    "- [TODAY](/calendar?date=2026-07-24)",
    "|   | Thursday, Jan 1 |",
    "- [8:00 - 8:01 Sign the treaty](/tasks/cmrya66ud00fc0i1mh34labjl)",
    "- [8:00 AM Sign the treaty](/tasks/cmrya66ud00fc0i1mh34labjl)",
  ].join("\n");
  const snapshotPath = "packages/web/src/app/calendar/page.logged-in.md";

  assert.equal(
    normalizeVisualReviewMarkdown(before, snapshotPath),
    normalizeVisualReviewMarkdown(after, snapshotPath),
  );
});

test("copy diffs ignore the decorative terminal cursor but preserve wording", () => {
  assert.equal(
    normalizeVisualReviewMarkdown("- awaiting input _", "page.logged-out.md"),
    "- awaiting input",
  );
  assert.notEqual(
    normalizeVisualReviewMarkdown("- awaiting input", "page.logged-out.md"),
    normalizeVisualReviewMarkdown("- awaiting approval", "page.logged-out.md"),
  );
});
