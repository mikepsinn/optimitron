/**
 * visual-review-diff.mjs
 *
 * Pure classifiers for the screenshot review's before/after comparison.
 * Dependency-free ESM so it can be unit-tested with `node --test`.
 */

/**
 * Whether two full-page screenshots differ in dimensions enough to count as a
 * real change.
 *
 * Screenshots are captured full-page, so `height` is the whole document
 * height. Across a tall page, sub-pixel font-hinting drift between the
 * "before" (a baseline run, possibly a different Chromium build) and the
 * "after" accumulates into a multi-pixel height delta even when nothing
 * visibly changed. Flagging that forces the route — and every route sharing
 * header/nav/footer chrome, so a whole batch at once — to render as "changed"
 * with "0% overlap", which is the noise the review is known for.
 *
 * So a small height delta whose overlapping pixels are otherwise identical is
 * treated as unchanged; a genuinely inserted/removed component far exceeds the
 * tolerance and still flags (and its overlap pixel diff flags it anyway).
 * Width stays exact — the viewport width is fixed, so any width change is real.
 *
 * @param {{ width: number, height: number }} before
 * @param {{ width: number, height: number }} after
 * @param {{ tolerancePx?: number, toleranceRatio?: number }} [options]
 *   tolerancePx: absolute floor (px); toleranceRatio: fraction of the taller
 *   image, so tall pages (which accrue more drift) get proportionally more slack.
 * @returns {boolean}
 */
export function isSignificantDimensionChange(
  before,
  after,
  { tolerancePx = 12, toleranceRatio = 0.004 } = {},
) {
  if (before.width !== after.width) return true;
  const heightDelta = Math.abs(before.height - after.height);
  const maxHeight = Math.max(before.height, after.height);
  const tolerance = Math.max(tolerancePx, maxHeight * toleranceRatio);
  return heightDelta > tolerance;
}

const GENERATED_CUID = /(?<![a-z0-9])c[a-z0-9]{24}(?![a-z0-9])/gi;
const ENCODED_GENERATED_CUID = /(%2f)c[a-z0-9]{24}(?![a-z0-9])/gi;
const CALENDAR_DATE = new RegExp(
  String.raw`\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+` +
    String.raw`(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+` +
    String.raw`\d{1,2}(?:,\s+\d{4})?\b`,
  "g",
);

/**
 * Remove values that identify a seeded row or the instant a review ran.
 * The copy report should flag language changes, not recreated preview records.
 *
 * @param {string} markdown
 * @param {string} repoRelativePath
 * @returns {string}
 */
export function normalizeVisualReviewMarkdown(markdown, repoRelativePath) {
  let normalized = markdown
    .replace(ENCODED_GENERATED_CUID, "$1generated-id")
    .replace(GENERATED_CUID, "generated-id")
    .replace(/(\bawaiting input)\s+_(?=\s|$)/gi, "$1");

  if (repoRelativePath.replaceAll("\\", "/").endsWith("/calendar/page.logged-in.md")) {
    normalized = normalized
      .replace(CALENDAR_DATE, "[calendar date]")
      .replace(/([?&]date=)\d{4}-\d{2}-\d{2}\b/g, "$1calendar-date")
      .replace(/\[\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s+/g, "[SCHEDULED TIME ")
      .replace(/\[\d{1,2}:\d{2}\s+(?:AM|PM)\s+/gi, "[SCHEDULED TIME ");
  }

  return normalized;
}
