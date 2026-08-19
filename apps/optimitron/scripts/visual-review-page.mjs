/**
 * visual-review-page.mjs — renders latest.html for the PR visual+copy review artifact.
 *
 * Hybrid of review-variants/v2.html (Inspector base: header chips, grouped rail,
 * per-route detail pane, viewport toggle, comparator modes, hash deep links,
 * mobile accordion) and v3.html (verdict system: looks-right/needs-work/skip
 * persisted to localStorage keyed by commit, j/k + 1/2/s keys, reviewed count,
 * markdown export; mobile defaults to the swipe comparator).
 *
 * New in this rewrite: hunked screenshot strips with collapsed identical
 * regions, linked full-page scrolling via piecewise-linear alignment anchors,
 * diff minimap with n/p hunk stepping, overlay (diff-PNG composite) mode,
 * hunk permalinks, client-side noise threshold, collapsing header chrome,
 * production-only live compare (Vercel SSO blocks preview iframes).
 *
 * DATA CONTRACT — renderReviewHtml(input) where input is:
 * {
 *   meta: { prNumber, shortSha, commitSha, headBranch, repo, generatedAt,
 *           generatedAtCentral, previewBaseUrl, productionBaseUrl,
 *           reviewUrl, baselineDescription },
 *   summary: { changedRoutes, copyOnlyRoutes, unchangedRoutes, appCount,
 *              appRoutes, compatibilityRoutes, erroredRoutes, totalRoutes },
 *   coverage: { analysisAvailable, complete, changedUiFiles, coveredUiFiles, blockingIssues },
 *   routes: [{
 *     routeName, routeLabel, routePath, routeUrl, productionUrl, authState,
 *     appId, appLabel, captureKind, // captureKind: "app" | "legacy-host"
 *     siteVariant, variantLabel,    // explicit host variant used by legacy captures
 *     changed, copyChanged, errored, statusLabel,
 *     markdownDiff: null | { addedLines, removedLines,
 *       metaChanges: [{field,before,after}],
 *       lines: [{kind: 'header'|'hunk'|'context'|'add'|'del', text}] },
 *     pairs: [{
 *       projectName, projectLabel, changed, missing, errored, diffLabel,
 *       beforeRelPath, afterRelPath, diffRelPath,   // relative to output root, null when absent
 *       beforeWidth, beforeHeight, afterWidth, afterHeight,
 *       hunks: [{ before:{yStart,yEnd}, after:{yStart,yEnd},
 *                 kind:'changed'|'inserted'|'deleted', pctOfPage }],
 *       alignmentAnchors: [{ beforeY, afterY }]     // monotonic, incl. {0,0} and ends
 *     }]
 *   }]
 * }
 * Returns the COMPLETE html string for latest.html. All assets referenced
 * relative to the emitted file (assets/...). No external network dependencies
 * except live-compare iframes and preview links.
 */

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** JSON safe to inline inside a <script> element. */
function jsonIsland(input) {
  return JSON.stringify(input)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

const CSS = `
  :root {
    --bg: #f6f7f8;
    --panel: #ffffff;
    --ink: #16181d;
    --dim: #6e7781;
    --border: #d9dce1;
    --accent: #0b62d6;
    --accent-soft: #e8f0fc;
    --add-bg: #e6ffec;
    --add-ink: #116329;
    --del-bg: #ffebe9;
    --del-ink: #82071e;
    --err: #d1242f;
    --good: #137a3a;
    --good-soft: #e5f3ea;
    --bad: #b3261e;
    --bad-soft: #fbeae9;
    --band: #e05d44;
    --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  a { color: var(--accent); }
  button { font: inherit; color: inherit; cursor: pointer; }
  select { font: inherit; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  [hidden] { display: none !important; }

  /* ---------- header ---------- */
  header#hdr {
    flex: 0 0 auto;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    padding: 8px 16px;
    z-index: 20;
  }
  .hdr-row1 { display: flex; align-items: center; gap: 10px; }
  .hdr-row1 h1 { font-size: 15px; margin: 0; font-weight: 700; white-space: nowrap; }
  .header-tools { display: block; flex: 1 1 auto; min-width: 0; }
  .header-tools-panel { display: flex; align-items: center; gap: 10px; flex: 1 1 auto; min-width: 0; flex-wrap: wrap; }
  .header-tools > summary { display: none; }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .chip {
    font-size: 12px;
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
    white-space: nowrap;
  }
  .chip.changed { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .chip.errored { border-color: var(--err); color: var(--err); }
  .chip.coverage-complete { border-color: var(--good); color: var(--good); background: var(--good-soft); }
  .chip.coverage-failed { border-color: var(--err); color: var(--err); background: var(--bad-soft); }
  .chip.reviewed { border-color: var(--good); color: var(--good); background: var(--good-soft); }
  .hdr-spacer { flex: 1 1 auto; }
  .noise-label { font-size: 12px; color: var(--dim); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  #noise { padding: 3px 4px; border: 1px solid var(--border); border-radius: 4px; background: var(--panel); font-size: 12px; }
  .hbtn {
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--panel);
    padding: 3px 10px;
    white-space: nowrap;
  }
  .hbtn:hover { border-color: var(--dim); }
  .header-actions { display: contents; }
  .hdr-row2 { flex: 1 1 100%; font-size: 12px; color: var(--dim); margin-top: 4px; overflow-wrap: anywhere; }
  .hdr-row2 code { font-family: var(--mono); font-size: 11px; }
  body.condensed .hdr-row2 { display: none; }
  body.condensed header#hdr { box-shadow: 0 1px 4px rgba(0,0,0,.08); }

  .coverage-failure {
    flex: 0 0 auto;
    border-bottom: 1px solid var(--err);
    background: var(--bad-soft);
    color: var(--ink);
    padding: 10px 16px;
  }
  .coverage-failure p { margin: 2px 0 0; }
  .coverage-failure ul { margin: 6px 0 0; padding-left: 22px; }
  .coverage-failure code { font-family: var(--mono); font-size: 12px; overflow-wrap: anywhere; }

  /* ---------- layout ---------- */
  .app { flex: 1 1 auto; display: flex; min-height: 0; }

  /* ---------- mobile rail toggle ---------- */
  #rail-toggle {
    display: none;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    text-align: left;
    background: var(--panel);
    border: none;
    border-bottom: 1px solid var(--border);
    font-weight: 600;
  }
  #rail-toggle .rt-caret { display: inline-block; transition: transform .12s; color: var(--dim); }
  body.rail-open #rail-toggle .rt-caret { transform: rotate(180deg); }
  #rail-toggle .rt-sel {
    font-weight: 400; color: var(--dim);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  }

  /* ---------- rail ---------- */
  nav.rail {
    flex: 0 0 280px;
    width: 280px;
    border-right: 1px solid var(--border);
    background: var(--panel);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .rail-filter { position: sticky; top: 0; background: var(--panel); padding: 8px; border-bottom: 1px solid var(--border); z-index: 2; }
  .rail-filter input {
    width: 100%; padding: 5px 8px;
    border: 1px solid var(--border); border-radius: 4px;
    font: inherit; background: var(--bg);
  }
  .rail-group-h {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
    color: var(--dim); padding: 10px 10px 4px;
  }
  button.rail-group-h {
    display: block; width: 100%; text-align: left;
    background: none; border: none; padding: 10px 10px;
  }
  button.rail-group-h:hover { color: var(--ink); }
  .rail-app { border-top: 1px solid var(--border); }
  .rail-app:first-of-type { border-top: none; }
  .rail-app-h {
    display: block; width: 100%; padding: 8px 10px;
    color: var(--ink); background: var(--bg);
    font-size: 12px; font-weight: 700; cursor: pointer;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    list-style: none;
  }
  .rail-app-h::-webkit-details-marker { display: none; }
  .rail-app-h::before { content: "\\25b8"; display: inline-block; width: 14px; color: var(--dim); }
  .rail-app[open] > .rail-app-h::before { content: "\\25be"; }
  .rail-app-h:hover { color: var(--accent); }
  .rail-app .route-row { padding-left: 20px; }
  .rail-compat > summary { cursor: pointer; list-style: none; }
  .rail-compat > summary::-webkit-details-marker { display: none; }
  .route-row {
    display: block; width: 100%; text-align: left;
    background: none; border: none; border-left: 3px solid transparent;
    padding: 6px 10px 6px 9px;
  }
  .route-row:hover { background: var(--bg); }
  .route-row.selected { background: var(--accent-soft); border-left-color: var(--accent); }
  .route-row .r-top { display: flex; align-items: center; gap: 6px; }
  .dot { flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%; background: #c4c9d0; }
  .dot.changed { background: var(--accent); }
  .dot.copy { background: var(--panel); border: 2px solid var(--accent); }
  .dot.errored { background: var(--err); }
  .r-label { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 auto; min-width: 0; }
  .r-verdict { flex: 0 0 auto; font-size: 12px; }
  .r-badges { display: flex; gap: 4px; margin: 3px 0 0 14px; flex-wrap: wrap; }
  .badge {
    font-family: var(--mono); font-size: 10.5px; padding: 0 5px;
    border: 1px solid var(--border); border-radius: 3px;
    color: var(--dim); background: var(--bg); white-space: nowrap;
  }
  .badge.hot { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .badge.err { border-color: var(--err); color: var(--err); }
  .badge.copy { color: var(--ink); }
  .badge.variant { border-color: #8250df; color: #8250df; background: #fbf7ff; }
  .badge .plus { color: var(--add-ink); }
  .badge .minus { color: var(--del-ink); }
  .kbd-hint { font-size: 11px; color: var(--dim); padding: 8px 10px 14px; }
  kbd {
    font-family: var(--mono); font-size: 10px;
    border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 3px;
    padding: 0 4px; background: var(--bg);
  }

  /* ---------- pane ---------- */
  main.pane { flex: 1 1 auto; min-width: 0; overflow-y: auto; display: flex; flex-direction: column; }
  #pane-content { padding: 16px 20px 120px; flex: 1 0 auto; }
  .route-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .route-head h2 { margin: 0; font-size: 20px; }
  .route-head .path { font-family: var(--mono); font-size: 13px; color: var(--dim); overflow-wrap: anywhere; }
  .route-head .auth {
    font-size: 11px; border: 1px solid var(--border); border-radius: 3px;
    padding: 0 6px; color: var(--dim);
  }
  .route-head .auth.v-good { border-color: var(--good); color: var(--good); background: var(--good-soft); }
  .route-head .auth.v-bad { border-color: var(--bad); color: var(--bad); background: var(--bad-soft); }
  .route-meta { display: flex; align-items: center; gap: 6px; margin: 4px 0 14px; font-size: 12px; color: var(--dim); min-width: 0; flex-wrap: wrap; }
  .route-meta a { min-width: 0; flex: 0 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .copy-url {
    flex: 0 0 auto; font-size: 11px;
    border: 1px solid var(--border); border-radius: 3px;
    background: var(--bg); color: var(--dim); padding: 1px 8px;
  }
  .copy-url:hover { color: var(--ink); }
  .context-actions { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .context-btn {
    flex: 0 0 auto; font-size: 11px;
    border: 1px solid var(--border); border-radius: 3px;
    background: var(--bg); color: var(--dim); padding: 1px 8px;
  }
  .context-btn:hover { color: var(--ink); }
  .context-btn:disabled { opacity: .45; cursor: not-allowed; }

  .route-tools, .route-tools-panel { display: contents; }
  .route-tools > summary { display: none; }

  .toolbar { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
  .seg { display: inline-flex; flex-wrap: wrap; max-width: 100%; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; background: var(--panel); }
  .seg button { border: none; background: none; padding: 5px 12px; font-size: 13px; border-right: 1px solid var(--border); }
  .seg button:last-child { border-right: none; }
  .seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }
  .seg button:disabled { color: var(--border); cursor: not-allowed; }
  .seg-label { font-size: 12px; color: var(--dim); margin-right: -8px; }
  .vp-info { font-size: 12px; color: var(--dim); font-family: var(--mono); margin: 0 0 8px; overflow-wrap: anywhere; }
  .vp-info b { color: var(--ink); }

  section.card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
    min-width: 0;
  }
  section.card > h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .03em; color: var(--dim); }
  .img-missing {
    padding: 24px; text-align: center; color: var(--dim); font-size: 13px;
    border: 1px dashed var(--border); background: var(--bg);
  }
  .err-note {
    padding: 10px 12px; font-size: 13px;
    border: 1px solid var(--err); color: var(--err); background: #fff5f5;
    margin-bottom: 10px;
  }

  /* ---------- comparator + minimap ---------- */
  .cmp-row { display: flex; gap: 8px; align-items: stretch; }
  .cmp-main { flex: 1 1 auto; min-width: 0; }
  .cmp-scroll { max-height: 75vh; overflow: auto; border: 1px solid var(--border); background: #eceef1; }
  .cmp-hint, .onion-ctl, .overlay-ctl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--dim); margin: 0 0 8px; }
  .onion-ctl input[type=range] { width: 240px; max-width: 100%; min-width: 0; accent-color: var(--accent); }

  .mm {
    position: relative;
    flex: 0 0 14px; width: 14px;
    min-height: 120px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    cursor: pointer;
    align-self: stretch;
  }
  .mm-band {
    position: absolute; left: 1px; right: 1px;
    top: calc(var(--start, 0) * 100%);
    height: max(3px, calc(var(--len, 0) * 100%));
    background: var(--band); border-radius: 1px;
  }
  .mm-band.active { background: var(--accent); }
  .mm-view {
    position: absolute; left: 0; right: 0;
    top: calc(var(--start, 0) * 100%);
    height: calc(var(--len, 0) * 100%);
    background: rgba(11,98,214,.14);
    border: 1px solid rgba(11,98,214,.5);
    pointer-events: none;
  }

  /* hunk strips */
  .hunk-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 8px 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); }
  .hunk-block { padding: 8px; }
  .hunk-block.flash { animation: hunkflash 1.6s ease-out; }
  @keyframes hunkflash {
    0% { background: rgba(255,166,0,.35); }
    100% { background: transparent; }
  }
  .hunk-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11.5px; color: var(--dim); font-family: var(--mono); margin-bottom: 4px; }
  .hunk-head .hk { font-weight: 700; color: var(--ink); }
  .hunk-head .kind-changed { color: var(--accent); }
  .hunk-head .kind-inserted { color: var(--add-ink); }
  .hunk-head .kind-deleted { color: var(--del-ink); }
  .hunk-link {
    border: 1px solid var(--border); border-radius: 3px; background: var(--panel);
    color: var(--dim); font-size: 11px; padding: 0 6px; margin-left: auto;
  }
  .hunk-link:hover { color: var(--accent); border-color: var(--accent); }
  .hunk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .strip { position: relative; overflow: hidden; background: #fff; border: 1px solid var(--border); }
  .strip img { display: block; width: 100%; height: auto; }
  .strip-cap { display: none; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); margin: 2px 0; }
  .hatch {
    border: 1px dashed var(--border);
    background: repeating-linear-gradient(45deg, #f2f3f5, #f2f3f5 8px, #e3e6ea 8px, #e3e6ea 16px);
    display: flex; align-items: center; justify-content: center;
    color: var(--dim); font-size: 11px; min-height: 40px;
  }
  .gap-row { padding: 0 8px; }
  .gap-btn {
    display: block; width: 100%;
    border: 1px dashed var(--border); border-radius: 3px;
    background: var(--bg); color: var(--dim);
    font-size: 12px; padding: 4px 8px; text-align: center; margin: 4px 0;
  }
  .gap-btn:hover { color: var(--ink); }
  .gap-open { padding: 4px 0; }

  /* full page linked scrolling */
  .full-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .full-grid figure { margin: 0; min-width: 0; }
  .full-grid figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); margin-bottom: 4px; }
  .well { height: 70vh; overflow: auto; border: 1px solid var(--border); background: #fff; }
  .well img { display: block; width: 100%; height: auto; }

  /* swipe / onion / overlay stage */
  .cmp-stage { position: relative; }
  .cmp-stage.mode-swipe { touch-action: pan-y; }
  .cmp-stage.vp-narrow { max-width: 420px; margin: 0 auto; }
  .cmp-stage img { display: block; width: 100%; height: auto; }
  .cmp-stage .img-top { position: absolute; top: 0; left: 0; }
  .cmp-stage .img-top.blend { mix-blend-mode: multiply; }
  .swipe-handle {
    position: absolute; top: 0; bottom: 0; width: 2px;
    background: var(--accent); cursor: ew-resize; touch-action: none; z-index: 3;
  }
  .swipe-handle::before { content: ""; position: absolute; top: 0; bottom: 0; left: -20px; right: -20px; }
  .swipe-pill {
    position: absolute; left: 50%; top: 120px;
    transform: translate(-50%, -50%);
    background: var(--accent); color: #fff;
    font-size: 11px; padding: 3px 8px; border-radius: 10px;
    white-space: nowrap; pointer-events: none;
  }
  .cmp-stage.swiping { cursor: ew-resize; user-select: none; }

  /* plain side-by-side fallback (no hunk data) */
  .sbs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .sbs figure { margin: 0; min-width: 0; }
  .sbs figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); margin-bottom: 4px; }
  .sbs img { display: block; width: 100%; height: auto; border: 1px solid var(--border); background: #fff; }
  .single-shot { margin: 0; }
  .single-shot figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); margin-bottom: 4px; }
  .single-shot img { display: block; width: 100%; height: auto; border: 1px solid var(--border); background: #fff; }

  /* ---------- screenshot lightbox ---------- */
  img.zoomable-shot { cursor: zoom-in; }
  img.zoomable-shot:hover { outline: 2px solid var(--accent); outline-offset: -2px; }
  .zoom-btn { margin-left: auto; }
  .shot-lightbox {
    width: min(96vw, 1800px); max-width: none; height: 94vh; max-height: none;
    padding: 0; border: 1px solid var(--ink); border-radius: 6px;
    background: var(--panel); color: var(--ink);
  }
  .shot-lightbox[open] { display: flex; flex-direction: column; }
  .shot-lightbox::backdrop { background: rgba(0,0,0,.78); }
  .shot-lightbox-bar {
    flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--panel);
  }
  .shot-lightbox-title {
    flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap; font-size: 13px;
  }
  .shot-lightbox-stage {
    flex: 1 1 auto; min-height: 0; overflow: auto; background: #20242a;
  }
  .shot-lightbox-image {
    display: block; width: 100%; height: auto; margin: 0 auto; cursor: zoom-in;
    background: #fff;
  }
  .shot-lightbox-image.actual-size { width: auto; max-width: none; cursor: zoom-out; }

  /* ---------- copy diff ---------- */
  .tbl-scroll { overflow-x: auto; margin-bottom: 10px; }
  .meta-table { border-collapse: collapse; font-size: 12px; width: 100%; }
  .meta-table th, .meta-table td { border: 1px solid var(--border); padding: 3px 8px; text-align: left; vertical-align: top; }
  .meta-table th { background: var(--bg); font-weight: 600; }
  .meta-table .b { background: var(--del-bg); color: var(--del-ink); }
  .meta-table .a { background: var(--add-bg); color: var(--add-ink); }
  .diff-view {
    font-family: var(--mono); font-size: 12px; line-height: 1.5;
    border: 1px solid var(--border); background: #fff;
    max-height: 420px; overflow: auto;
  }
  .diff-view .ln { white-space: pre-wrap; overflow-wrap: anywhere; padding: 0 10px; }
  .diff-view .add { background: var(--add-bg); color: var(--add-ink); }
  .diff-view .del { background: var(--del-bg); color: var(--del-ink); }
  .diff-view .hunk { background: var(--accent-soft); color: var(--dim); }
  .diff-view .meta { color: var(--dim); }
  .no-copy { color: var(--dim); font-size: 13px; }

  /* ---------- live compare ---------- */
  .live-btn {
    border: 1px solid var(--accent); background: var(--panel); color: var(--accent);
    border-radius: 5px; padding: 6px 14px; font-weight: 600;
  }
  .live-btn[aria-pressed="true"] { background: var(--accent); color: #fff; }
  .live-note { font-size: 12px; color: var(--dim); margin: 10px 0 8px; overflow-wrap: anywhere; }
  .live-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .live-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--dim); margin: 0 0 4px; }
  .live-grid iframe { width: 100%; height: 70vh; border: 1px solid var(--border); background: #fff; }
  .preview-panel {
    border: 2px solid var(--accent); background: var(--accent-soft);
    min-height: 200px; height: 70vh;
    display: flex; flex-direction: column; gap: 12px;
    align-items: flex-start; justify-content: center; padding: 24px;
  }
  .preview-panel p { margin: 0; font-size: 13px; color: var(--ink); max-width: 40ch; }
  .preview-open {
    display: inline-block; background: var(--accent); color: #fff;
    padding: 10px 18px; border-radius: 5px; font-weight: 600; text-decoration: none;
  }

  /* ---------- verdict bar ---------- */
  .verdict-bar {
    position: sticky; bottom: 0; z-index: 10;
    background: var(--panel); border-top: 1px solid var(--border);
    padding: 8px 20px;
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }
  .vbtn { border: 1px solid var(--border); border-radius: 4px; background: var(--panel); padding: 6px 12px; white-space: nowrap; }
  .vbtn.btn-good { border-color: var(--good); color: var(--good); }
  .vbtn.btn-good:hover { background: var(--good-soft); }
  .vbtn.btn-good.on { background: var(--good); color: #fff; font-weight: 700; }
  .vbtn.btn-bad { border-color: var(--bad); color: var(--bad); }
  .vbtn.btn-bad:hover { background: var(--bad-soft); }
  .vbtn.btn-bad.on { background: var(--bad); color: #fff; font-weight: 700; }
  .vbtn.btn-skip { border-style: dashed; }
  .vbtn.btn-skip.on { background: var(--ink); color: #fff; font-weight: 700; }
  .review-status { flex: 1 1 100%; font-size: 12px; font-weight: 700; color: var(--ink); }
  .verdict-more, .verdict-more-panel { display: contents; }
  .verdict-more > summary { display: none; }
  .note-box { flex: 1 1 200px; min-width: 160px; }
  .note-box input {
    width: 100%; font: inherit;
    border: 1px solid var(--border); border-radius: 4px; padding: 6px 8px;
  }
  .v-kbd { font-size: 11px; color: var(--dim); white-space: nowrap; }

  .fatal { margin: 40px auto; max-width: 520px; padding: 20px; background: var(--panel); border: 1px solid var(--err); color: var(--err); }
  .mobile-only { display: none; }

  /* ---------- touch targets ---------- */
  @media (pointer: coarse) {
    .seg button { min-height: 40px; padding: 8px 14px; }
    .live-btn, .hbtn, .vbtn, .gap-btn, .hunk-link, .context-btn { min-height: 40px; }
    .route-row { min-height: 40px; }
    .rail-filter input, #noise { min-height: 40px; }
    .copy-url { min-height: 40px; min-width: 40px; }
    .kbd-hint, .v-kbd { display: none; }
  }

  /* ---------- narrow screens ---------- */
  @media (max-width: 700px) {
    header#hdr { position: relative; padding: 6px 10px; }
    .hdr-row1 { min-height: 40px; flex-wrap: nowrap; }
    .hdr-row1 h1 { overflow: hidden; text-overflow: ellipsis; }
    .header-tools { flex: 0 0 auto; margin-left: auto; }
    .header-tools > summary {
      display: flex; align-items: center; min-height: 40px;
      border: 1px solid var(--border); border-radius: 4px;
      background: var(--panel); padding: 6px 10px; font-weight: 600;
      list-style: none; white-space: nowrap; cursor: pointer;
    }
    .header-tools > summary::-webkit-details-marker { display: none; }
    .header-tools > summary::after { content: "\\22ef"; margin-left: 6px; color: var(--dim); }
    .header-tools-panel {
      display: none; position: absolute; z-index: 30;
      top: calc(100% + 4px); left: 8px; right: 8px;
      max-height: calc(100dvh - 70px); overflow: auto;
      background: var(--panel); border: 1px solid var(--border); border-radius: 6px;
      box-shadow: 0 8px 28px rgba(0,0,0,.2); padding: 12px;
    }
    .header-tools[open] > .header-tools-panel { display: flex; flex-direction: column; gap: 12px; }
    .header-tools-panel .chips { display: flex; }
    .header-tools-panel .hdr-spacer { display: none; }
    body.condensed .header-tools-panel .hdr-row2 { display: block; }
    .header-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .header-actions .noise-label { grid-column: 1 / -1; justify-content: space-between; }
    .header-actions .hbtn { width: 100%; }
    .hdr-row2 { margin: 0; }

    .app { flex-direction: column; }
    #rail-toggle { display: flex; }
    nav.rail {
      display: none; flex: 0 0 auto; width: 100%;
      max-height: 55vh; border-right: none; border-bottom: 1px solid var(--border);
    }
    body.rail-open nav.rail { display: flex; }
    #pane-content { padding: 12px 12px 90px; }
    .route-head { align-items: center; }
    .route-head h2 { font-size: 19px; }
    .route-tools { display: block; position: relative; margin: 8px 0 10px; }
    .route-tools > summary {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 40px; padding: 7px 10px;
      border: 1px solid var(--border); border-radius: 4px;
      background: var(--panel); font-size: 13px; font-weight: 600;
      list-style: none; cursor: pointer;
    }
    .route-tools > summary::-webkit-details-marker { display: none; }
    .route-tools > summary::after { content: "\\25be"; color: var(--dim); margin-left: 8px; }
    .route-tools[open] > summary::after { transform: rotate(180deg); }
    .route-tools-panel {
      display: none; position: absolute; z-index: 15;
      top: calc(100% + 4px); left: 0; right: 0;
      max-height: min(70vh, 520px); overflow: auto;
      background: var(--panel); border: 1px solid var(--border); border-radius: 5px;
      box-shadow: 0 8px 24px rgba(0,0,0,.2); padding: 12px;
    }
    .route-tools[open] > .route-tools-panel { display: block; }
    .route-tools-panel .route-meta { margin: 0 0 12px; }
    .route-tools-panel .toolbar { margin: 0; gap: 10px; }
    .mobile-only { display: inline; }
    .desktop-only { display: none; }
    .hunk-grid, .full-grid, .sbs, .live-grid { grid-template-columns: minmax(0, 1fr); }
    .hunk-cols { display: none; }
    .strip-cap { display: block; }
    .cmp-row { flex-direction: column; }
    .mm { width: 100%; height: 14px; flex: 0 0 14px; min-height: 0; align-self: auto; order: -1; }
    .mm-band {
      top: 1px; bottom: 1px; height: auto; right: auto;
      left: calc(var(--start, 0) * 100%);
      width: max(3px, calc(var(--len, 0) * 100%));
    }
    .mm-view {
      top: 0; bottom: 0; height: auto; right: auto;
      left: calc(var(--start, 0) * 100%);
      width: calc(var(--len, 0) * 100%);
    }
    .well { height: 60vh; }
    .cmp-scroll { max-height: 65vh; }
    .live-grid iframe { height: 55vh; }
    .preview-panel { height: auto; min-height: 140px; }
    .verdict-bar { padding: 6px 10px; gap: 6px; flex-wrap: nowrap; position: sticky; }
    .vbtn { padding: 8px 10px; font-size: 13px; }
    .vbtn .mobile-only { display: inline; }
    .vbtn .desktop-only { display: none; }
    .v-kbd { display: none; }
    .review-status {
      position: absolute; left: 10px; right: 10px; bottom: calc(100% + 6px);
      padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px;
      background: var(--panel); box-shadow: 0 3px 12px rgba(0,0,0,.14);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      pointer-events: none;
    }
    .verdict-more { display: block; margin-left: auto; }
    .verdict-more > summary {
      display: flex; align-items: center; justify-content: center;
      min-height: 40px; padding: 8px 10px;
      border: 1px solid var(--border); border-radius: 4px;
      background: var(--panel); font-size: 13px; list-style: none; cursor: pointer;
    }
    .verdict-more > summary::-webkit-details-marker { display: none; }
    .verdict-more-panel {
      display: none; position: absolute; z-index: 20;
      left: 10px; right: 10px; bottom: calc(100% + 6px);
      background: var(--panel); border: 1px solid var(--border); border-radius: 5px;
      box-shadow: 0 -6px 20px rgba(0,0,0,.18); padding: 10px;
    }
    .verdict-more[open] > .verdict-more-panel { display: block; }
    .note-box input { font-size: 16px; } /* stops iOS focus zoom */
  }
`;

/**
 * Client JS. Embedded verbatim inside the emitted HTML.
 * IMPORTANT: no backtick and no dollar-brace sequences in here — the whole
 * script lives inside a server-side template literal.
 */
const CLIENT_JS = `
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("review-data").textContent);
  var meta = DATA.meta || {};
  var routes = DATA.routes || [];

  /* ---------------- state ---------------- */
  var selectedName = null;
  var pairName = null;          // selected viewport (projectName) for the current route
  var cmpMode = null;           // "hunks" | "full" | "swipe" | "onion" | "overlay"
  var noise = 0;                // hide hunks with pctOfPage below this (percent)
  var swipePos = 50;
  var onionOpacity = 50;
  var overlayStyle = "blend";   // "blend" | "tint"
  var hunkPointer = -1;         // n/p stepping index into visible hunks
  var minimap = null;           // { el, update(startFrac, lenFrac), setActive(origIdx) }
  var fullWells = null;         // linked-scroll wells for the current full-page render
  var verdicts = {};            // routeName -> { v, note, ts, commit }
  var reviewStatus = "";        // visible confirmation after a route verdict
  var lightbox = null;           // native dialog for full-size screenshot inspection
  var storeKey = "visualReview:" + (meta.commitSha || meta.shortSha || "unknown");
  var MOBILE_MQ = "(max-width: 700px)";
  var STRIP_CONTEXT_PX = 16;    // extra context cropped around each hunk band

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function joinRouteUrl(base, routePath) {
    if (!base || !routePath) return "";
    return String(base).replace(/\\/$/, "") + routePath;
  }
  function reviewPageUrl(routeName) {
    var pageUrl = meta.reviewUrl || (typeof location !== "undefined" ? location.href.split("#")[0] : "");
    if (!pageUrl) return null;
    return pageUrl.split("#")[0] + "#route=" + encodeURIComponent(routeName || selectedName || "");
  }
  function reviewBaseUrl() {
    var pageUrl = meta.reviewUrl || (typeof location !== "undefined" ? location.href.split("#")[0] : "");
    if (!pageUrl) return "";
    return pageUrl
      .split("#")[0]
      .replace(/\\/latest\\.html(?:[?#].*)?$/, "")
      .replace(/\\/$/, "");
  }
  function assetUrl(relPath) {
    if (!relPath) return null;
    var base = reviewBaseUrl();
    var clean = String(relPath).replace(/^\\/+/, "");
    return base ? base + "/" + clean : clean;
  }
  function isMobile() { return window.matchMedia(MOBILE_MQ).matches; }
  function closeMobileMenus() {
    document.querySelectorAll(".header-tools[open], .route-tools[open], .verdict-more[open]").forEach(function (details) {
      details.removeAttribute("open");
    });
  }
  function fmtPx(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmtPct(n) {
    if (!isFinite(n)) return "0";
    var fixed = Number(n).toFixed(n >= 10 ? 1 : 2);
    return fixed.replace(/\.?0+$/, "");
  }
  function pctOf(label) {
    var m = /([\\d.]+%)/.exec(label || "");
    return m ? m[1] : (label || "\\u2014");
  }
  function pctNum(label) {
    var m = /([\\d.]+)%/.exec(label || "");
    return m ? parseFloat(m[1]) : 0;
  }
  function routeByName(name) {
    return routes.find(function (r) { return r.routeName === name; });
  }
  function pairOf(r, name) {
    return ((r && r.pairs) || []).find(function (p) { return p.projectName === name; }) || null;
  }
  var APP_DISPLAY_ORDER = [
    "warondisease",
    "optimitron",
    "dfda",
    "wishocracy",
    "trialabundancesurvey",
    "curedao",
    "acceleratedmedicine"
  ];
  var COMPATIBILITY_DISPLAY_ORDER = ["warondisease", "dfda", "dih"];
  function routeNeedsReview(r) {
    return Boolean(
      r.errored ||
      r.changed ||
      r.copyChanged ||
      Number(r.baselineMissingPairs) > 0
    );
  }
  function routePriority(r) {
    if (r.errored) return 0;
    if (r.changed) return 1;
    if (r.copyChanged) return 2;
    if (Number(r.baselineMissingPairs) > 0) return 3;
    return 4;
  }
  function sortRoutesForReview(list) {
    return list.slice().sort(function (a, b) {
      return routePriority(a) - routePriority(b);
    });
  }
  function ownerKey(r) {
    return r.appId || r.siteVariant || r.routeName;
  }
  function appPageLabel(r) {
    var parts = String(r.routeLabel || r.routeName).split(" \u00b7 ");
    return parts.length > 1 ? parts.slice(1).join(" \u00b7 ") : r.routeLabel;
  }
  function visibleHunks(pair) {
    var out = [];
    ((pair && pair.hunks) || []).forEach(function (h, i) {
      if (!noise || (h.pctOfPage || 0) >= noise) out.push({ h: h, i: i });
    });
    return out;
  }
  function pairIsHot(pair) {
    if (!pair) return false;
    if (pair.errored) return true;
    if (!pair.changed) return false;
    if (pair.hunks && pair.hunks.length) return visibleHunks(pair).length > 0;
    return true;
  }
  function defaultPairFor(r) {
    if (!r || !r.pairs || !r.pairs.length) return null;
    var best = null;
    r.pairs.forEach(function (p) {
      if (!pairIsHot(p)) return;
      if (!best || pctNum(p.diffLabel) > pctNum(best.diffLabel)) best = p;
    });
    return (best || r.pairs[0]).projectName;
  }
  function defaultModeFor(pair) {
    if (isMobile()) return "swipe";
    if (pair && pair.hunks && pair.hunks.length) return "hunks";
    return "full";
  }
  function anchorsFor(pair) {
    var a = (pair && pair.alignmentAnchors) || [];
    if (a.length >= 2) return a;
    var bh = (pair && pair.beforeHeight) || 1;
    var ah = (pair && pair.afterHeight) || 1;
    return [{ beforeY: 0, afterY: 0 }, { beforeY: bh, afterY: ah }];
  }
  // piecewise-linear map over alignment anchors (NOT naive percentage)
  function mapY(y, anchors, fromKey, toKey) {
    if (!anchors || anchors.length < 2) return y;
    var seg = anchors.length - 2;
    for (var k = 0; k < anchors.length - 1; k++) {
      if (y <= anchors[k + 1][fromKey]) { seg = k; break; }
    }
    var a = anchors[seg], b = anchors[seg + 1];
    var span = b[fromKey] - a[fromKey];
    var t = span > 0 ? (y - a[fromKey]) / span : 0;
    return a[toKey] + t * (b[toKey] - a[toKey]);
  }
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, "\\\\$&");
  }

  /* ---------------- verdict storage ---------------- */
  function loadVerdicts() {
    try {
      var raw = localStorage.getItem(storeKey);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved.verdicts === "object" && saved.verdicts) verdicts = saved.verdicts;
    } catch (e) { /* corrupted state loses politely */ }
  }
  function saveVerdicts() {
    try {
      localStorage.setItem(storeKey, JSON.stringify({ verdicts: verdicts }));
      return true;
    } catch (e) {
      return false;
    }
  }
  function verdictOf(r) { return verdicts[r.routeName] || null; }
  function verdictMark(v) {
    return v ? (v.v === "looks-right" ? "\\uD83D\\uDC4D" : v.v === "needs-work" ? "\\uD83D\\uDC4E" : "\\u23ED") : "";
  }
  function reviewable() {
    return routes.filter(routeNeedsReview);
  }
  function updateReviewedChip() {
    var pool = reviewable();
    var done = 0, flagged = 0, skipped = 0;
    pool.forEach(function (r) {
      var v = verdictOf(r);
      if (v) done++;
      if (v && v.v === "needs-work") flagged++;
      if (v && v.v === "skipped") skipped++;
    });
    var text = done + "/" + pool.length + " reviewed" +
      (flagged ? " \\u00b7 " + flagged + " flagged" : "") +
      (skipped ? " \\u00b7 " + skipped + " skipped" : "");
    document.querySelectorAll("[data-reviewed-chip]").forEach(function (chip) {
      chip.textContent = text;
      chip.classList.toggle("reviewed", done > 0);
    });
  }

  /* ---------------- hash deep links ---------------- */
  function parseHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return null;
    if (h.indexOf("=") === -1) return { route: decodeURIComponent(h) };
    var out = {};
    h.split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      if (i === -1) return;
      out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
    });
    return out;
  }
  function hunkPermalink(routeName, pName, i) {
    return location.href.split("#")[0] +
      "#route=" + encodeURIComponent(routeName) +
      "&pair=" + encodeURIComponent(pName) +
      "&hunk=" + i;
  }

  /* ---------------- header wiring ---------------- */
  function wireHeader() {
    var noiseSel = document.getElementById("noise");
    noiseSel.addEventListener("change", function () {
      noise = parseFloat(noiseSel.value) || 0;
      refreshRailBadges();
      renderPane(true);
    });
    var copyReview = document.getElementById("copy-review-btn");
    copyReview.addEventListener("click", function () {
      copyText(buildReviewMarkdown(), function (ok) {
        copyReview.textContent = ok ? "Copied PR comment" : "Copy failed";
        setTimeout(function () { copyReview.textContent = "Copy PR comment"; }, 1500);
      });
    });
    document.getElementById("export-btn").addEventListener("click", exportNotes);
    document.getElementById("reset-btn").addEventListener("click", function () {
      if (!confirm("Clear all saved verdicts and notes for commit " + (meta.shortSha || "?") + "?")) return;
      verdicts = {};
      saveVerdicts();
      updateReviewedChip();
      refreshRailMarks();
      renderPane(true);
    });
    document.addEventListener("click", function (event) {
      if (!isMobile()) return;
      document.querySelectorAll(".header-tools[open], .route-tools[open], .verdict-more[open]").forEach(function (details) {
        if (!details.contains(event.target)) details.removeAttribute("open");
      });
    });
    // collapsing chrome: condense to one sticky line once the pane scrolls
    var pane = document.getElementById("pane");
    pane.addEventListener("scroll", function () {
      var y = pane.scrollTop;
      if (y > 48) document.body.classList.add("condensed");
      else if (y < 8) document.body.classList.remove("condensed");
    });
  }

  /* ---------------- rail ---------------- */
  var appOpen = {};
  var compatibilityHostOpen = {};
  var compatibilityOpen = false;
  routes.forEach(function (r) {
    if (!routeNeedsReview(r)) return;
    if (r.captureKind === "legacy-host") {
      compatibilityOpen = true;
      compatibilityHostOpen[ownerKey(r)] = true;
    } else {
      appOpen[ownerKey(r)] = true;
    }
  });
  var firstAppRoute = routes.find(function (r) {
    return r.captureKind === "app" && r.appId === "warondisease";
  }) || routes.find(function (r) { return r.captureKind === "app"; });
  if (firstAppRoute && !Object.keys(appOpen).length) {
    appOpen[ownerKey(firstAppRoute)] = true;
  }
  var routeFilter = "";
  function renderRail() {
    var rail = document.getElementById("rail");
    rail.innerHTML = "";

    var filterWrap = el("div", { class: "rail-filter" });
    var input = el("input", {
      type: "search", id: "route-filter", placeholder: "Filter routes\\u2026",
      "aria-label": "Filter routes", autocomplete: "off", value: routeFilter
    });
    input.addEventListener("input", function () {
      routeFilter = input.value;
      applyFilter();
    });
    filterWrap.appendChild(input);
    rail.appendChild(filterWrap);

    var appRoutes = routes.filter(function (r) { return r.captureKind === "app"; });
    var compatibilityRoutes = routes.filter(function (r) { return r.captureKind === "legacy-host"; });

    function orderedOwnerKeys(grouped, kind) {
      var preferred = kind === "app" ? APP_DISPLAY_ORDER : COMPATIBILITY_DISPLAY_ORDER;
      return Object.keys(grouped).sort(function (a, b) {
        var ai = preferred.indexOf(a);
        var bi = preferred.indexOf(b);
        if (ai === -1) ai = preferred.length;
        if (bi === -1) bi = preferred.length;
        return ai - bi || a.localeCompare(b);
      });
    }
    function addOwnerGroups(wrap, list, kind) {
      if (!list.length) return;
      var grouped = {};
      list.forEach(function (r) {
        var key = ownerKey(r);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      orderedOwnerKeys(grouped, kind).forEach(function (key) {
        var ownerRoutes = sortRoutesForReview(grouped[key]);
        var openState = kind === "app" ? appOpen : compatibilityHostOpen;
        var details = el("details", {
          class: "rail-app", "data-owner-key": key, "data-owner-kind": kind
        });
        details.open = Boolean(openState[key]);
        details.appendChild(el("summary", {
          class: "rail-app-h",
          text: (ownerRoutes[0].appLabel || key) + " (" + ownerRoutes.length + ")"
        }));
        ownerRoutes.forEach(function (r) {
          details.appendChild(routeRow(r, appPageLabel(r)));
        });
        details.addEventListener("toggle", function () {
          if (!routeFilter.trim()) openState[key] = details.open;
        });
        wrap.appendChild(details);
      });
    }
    function addApps(list) {
      if (!list.length) return;
      var appCount = new Set(list.map(function (r) { return ownerKey(r); })).size;
      var wrap = el("div", {
        class: "rail-group", "data-title": "Apps",
        "data-total": String(appCount), "data-key": "apps"
      });
      wrap.appendChild(el("div", {
        class: "rail-group-h", text: "Apps (" + appCount + ")"
      }));
      addOwnerGroups(wrap, list, "app");
      rail.appendChild(wrap);
    }
    function addCompatibility(list) {
      if (!list.length) return;
      var hostCount = new Set(list.map(function (r) { return ownerKey(r); })).size;
      var wrap = el("details", {
        class: "rail-group rail-compat", "data-title": "Compatibility checks",
        "data-total": String(hostCount), "data-key": "compatibility"
      });
      wrap.open = compatibilityOpen;
      wrap.appendChild(el("summary", {
        class: "rail-group-h", text: "Compatibility checks (" + hostCount + ")"
      }));
      addOwnerGroups(wrap, list, "legacy-host");
      wrap.addEventListener("toggle", function () {
        if (!routeFilter.trim()) compatibilityOpen = wrap.open;
      });
      rail.appendChild(wrap);
    }
    addApps(appRoutes);
    addCompatibility(compatibilityRoutes);

    rail.appendChild(el("div", {
      class: "kbd-hint",
      html: "<kbd>j</kbd>/<kbd>k</kbd> routes \\u00b7 <kbd>n</kbd>/<kbd>p</kbd> hunks \\u00b7 <kbd>1</kbd> \\uD83D\\uDC4D \\u00b7 <kbd>2</kbd> \\uD83D\\uDC4E \\u00b7 <kbd>s</kbd> skip"
    }));
  }

  function routeRow(r, displayLabel) {
    var btn = el("button", {
      class: "route-row",
      "data-route": r.routeName,
      "data-filter": (r.routeLabel + " " + r.routeName + " " + r.routePath + " " + (r.appLabel || "") + " " + (r.appId || "")).toLowerCase(),
      title: r.routeLabel + " \\u2014 " + r.statusLabel
    });
    var dotCls = "dot";
    if (r.errored) dotCls += " errored";
    else if (r.changed) dotCls += " changed";
    else if (r.copyChanged) dotCls += " copy";
    btn.appendChild(el("div", { class: "r-top" }, [
      el("span", { class: dotCls }),
      el("span", { class: "r-label", text: displayLabel || r.routeLabel }),
      el("span", { class: "r-verdict", "data-verdict-for": r.routeName, text: verdictMark(verdictOf(r)) })
    ]));

    var badges = el("div", { class: "r-badges", "data-badges-for": r.routeName });
    fillRouteBadges(badges, r);
    if (badges.childNodes.length) btn.appendChild(badges);
    btn.addEventListener("click", function () { selectRoute(r.routeName); });
    return btn;
  }

  function fillRouteBadges(container, r) {
    container.innerHTML = "";
    if (r.captureKind === "legacy-host") {
      container.appendChild(el("span", {
        class: "badge variant",
        title: "Temporary capture from the legacy host",
        text: "legacy host"
      }));
    }
    (r.pairs || []).forEach(function (p) {
      var initial = String(p.projectLabel || p.projectName || "?").charAt(0).toUpperCase();
      var cls = "badge";
      if (p.errored) cls += " err";
      else if (pairIsHot(p)) cls += " hot";
      container.appendChild(el("span", {
        class: cls,
        title: (p.projectLabel || p.projectName) + ": " + (p.diffLabel || (p.missing ? "missing" : "")),
        text: initial + " " + (p.missing ? "\\u2014" : pctOf(p.diffLabel))
      }));
    });
    if (!(r.pairs || []).length) {
      container.appendChild(el("span", { class: "badge", title: r.statusLabel, text: "no shots" }));
    }
    var c = r.markdownDiff;
    if (r.copyChanged && c) {
      var b = el("span", { class: "badge copy", title: "Copy changed: +" + c.addedLines + " / \\u2212" + c.removedLines });
      b.innerHTML = 'copy <span class="plus">+' + Number(c.addedLines) + '</span> <span class="minus">\\u2212' + Number(c.removedLines) + "</span>";
      container.appendChild(b);
    }
  }

  function refreshRailBadges() {
    routes.forEach(function (r) {
      var c = document.querySelector('[data-badges-for="' + cssEscape(r.routeName) + '"]');
      if (c) fillRouteBadges(c, r);
    });
  }
  function refreshRailMarks() {
    routes.forEach(function (r) {
      var m = document.querySelector('[data-verdict-for="' + cssEscape(r.routeName) + '"]');
      if (m) m.textContent = verdictMark(verdictOf(r));
    });
  }

  function applyFilter() {
    var inp = document.getElementById("route-filter");
    var q = inp ? inp.value.trim().toLowerCase() : "";
    document.querySelectorAll(".rail-app").forEach(function (group) {
      var matches = 0;
      group.querySelectorAll(".route-row").forEach(function (row) {
        var show = !q || row.getAttribute("data-filter").indexOf(q) !== -1;
        row.style.display = show ? "" : "none";
        if (show) matches++;
      });
      group.style.display = !q || matches ? "" : "none";
      var key = group.getAttribute("data-owner-key");
      var state = group.getAttribute("data-owner-kind") === "app"
        ? appOpen
        : compatibilityHostOpen;
      group.open = q ? matches > 0 : Boolean(state[key]);
    });
    document.querySelectorAll(".rail-group").forEach(function (group) {
      var count = Array.prototype.filter.call(
        group.querySelectorAll(".rail-app"),
        function (owner) { return owner.style.display !== "none"; }
      ).length;
      var total = Number(group.getAttribute("data-total"));
      var h = group.querySelector(".rail-group-h");
      if (h) {
        h.textContent = group.getAttribute("data-title") + " (" + (count < total ? count + "/" + total : String(total)) + ")";
      }
      group.style.display = count ? "" : "none";
      if (group.getAttribute("data-key") === "compatibility") {
        group.open = q ? count > 0 : compatibilityOpen;
      }
    });
  }

  function visibleRows() {
    return Array.prototype.filter.call(document.querySelectorAll(".route-row"), function (r) {
      if (r.style.display === "none") return false;
      var parent = r.parentElement;
      while (parent && parent.id !== "rail") {
        if (parent.tagName === "DETAILS" && !parent.open) return false;
        parent = parent.parentElement;
      }
      return true;
    });
  }
  // Route order for j/k and verdict auto-advance. Rail rows when visible;
  // otherwise (mobile, rail accordion closed) the same grouped order the rail would show.
  function navNames() {
    var rows = visibleRows();
    return rows.map(function (row) { return row.getAttribute("data-route"); });
  }
  function markSelectedRow() {
    document.querySelectorAll(".route-row").forEach(function (row) {
      var sel = row.getAttribute("data-route") === selectedName;
      row.classList.toggle("selected", sel);
      if (sel && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
    });
  }

  /* ---------------- selection ---------------- */
  function selectRoute(name, opts) {
    opts = opts || {};
    var r = routeByName(name);
    if (!r) return;
    reviewStatus = typeof opts.reviewStatus === "string" ? opts.reviewStatus : "";
    var key = ownerKey(r);
    var shouldRenderRail = false;
    if (r.captureKind === "legacy-host") {
      if (!compatibilityOpen || !compatibilityHostOpen[key]) shouldRenderRail = true;
      compatibilityOpen = true;
      compatibilityHostOpen[key] = true;
    } else if (!appOpen[key]) {
      appOpen[key] = true;
      shouldRenderRail = true;
    }
    if (shouldRenderRail) {
      renderRail();
    }
    selectedName = name;
    pairName = (opts.pair && pairOf(r, opts.pair)) ? opts.pair : defaultPairFor(r);
    if (opts.mode) cmpMode = opts.mode;
    else if (!cmpMode) cmpMode = defaultModeFor(pairOf(r, pairName));
    hunkPointer = -1;
    if (!opts.skipHash) history.replaceState(null, "", "#route=" + encodeURIComponent(name));
    markSelectedRow();
    var sel = document.getElementById("rail-toggle-sel");
    if (sel) sel.textContent = "\\u00b7 " + r.routeLabel;
    if (isMobile()) {
      document.body.classList.remove("rail-open");
      document.getElementById("rail-toggle").setAttribute("aria-expanded", "false");
    }
    renderPane(false, opts.hunk);
  }

  /* ---------------- pane ---------------- */
  function renderPane(keepScroll, focusHunk) {
    var pane = document.getElementById("pane");
    var y = keepScroll ? pane.scrollTop : 0;
    pane.innerHTML = "";
    minimap = null;
    fullWells = null;
    var r = routeByName(selectedName);
    if (!r) { pane.textContent = "No route selected."; return; }

    var content = el("div", { id: "pane-content" });
    pane.appendChild(content);

    // head
    var v = verdictOf(r);
    var headBits = [
      el("h2", { text: r.routeLabel }),
      el("span", { class: "path", text: r.routePath }),
      el("span", { class: "auth", text: r.authState }),
      el("span", { class: "auth", text: r.statusLabel })
    ];
    if (v) headBits.push(el("span", {
      class: "auth " + (v.v === "looks-right" ? "v-good" : v.v === "needs-work" ? "v-bad" : ""),
      text: verdictMark(v) + " " + (v.v === "looks-right" ? "looks right" : v.v === "needs-work" ? "needs work" : "skipped")
    }));
    content.appendChild(el("div", { class: "route-head" }, headBits));

    var metaRow = el("div", { class: "route-meta" });
    metaRow.appendChild(el("span", { text: "Preview:" }));
    var previewUrl = r.routeUrl || joinRouteUrl(meta.previewBaseUrl, r.routePath);
    if (previewUrl) {
      metaRow.appendChild(el("a", { href: previewUrl, target: "_blank", rel: "noopener", text: previewUrl, title: previewUrl }));
      var cp = el("button", { type: "button", class: "copy-url", text: "Copy" });
      cp.addEventListener("click", function () {
        copyText(previewUrl, function (ok) {
          cp.textContent = ok ? "Copied" : "Copy failed";
          setTimeout(function () { cp.textContent = "Copy"; }, 1500);
        });
      });
      metaRow.appendChild(cp);
    } else {
      metaRow.appendChild(el("span", { text: "n/a" }));
    }
    metaRow.appendChild(buildContextActions(r));
    var routeTools = el("details", {
      class: "route-tools",
      open: isMobile() ? null : ""
    });
    routeTools.appendChild(el("summary", {}, [
      el("span", { text: "Review controls" }),
      el("span", {
        class: "mobile-only",
        text: " " + ((pairName && pairOf(r, pairName)) ? (pairOf(r, pairName).projectLabel || pairName) : "")
      })
    ]));
    var routeToolsPanel = el("div", { class: "route-tools-panel" });
    routeToolsPanel.appendChild(metaRow);
    routeTools.appendChild(routeToolsPanel);
    content.appendChild(routeTools);

    if (r.errored) {
      content.appendChild(el("div", { class: "err-note", text: "This route errored during capture: " + r.statusLabel }));
    }

    var hasPairs = (r.pairs || []).length > 0;
    if (hasPairs) {
      var pair = pairOf(r, pairName) || r.pairs[0];
      pairName = pair.projectName;

      // toolbar: viewport + comparator mode
      var toolbar = el("div", { class: "toolbar" });
      toolbar.appendChild(el("span", { class: "seg-label", text: "Viewport" }));
      toolbar.appendChild(segControl(
        r.pairs.map(function (p) { return { v: p.projectName, t: p.projectLabel || p.projectName }; }),
        function () { return pairName; },
        function (val) { pairName = val; hunkPointer = -1; renderPane(true); }
      ));
      if (pair.beforeRelPath && pair.afterRelPath) {
        toolbar.appendChild(el("span", { class: "seg-label", text: "Compare" }));
        var hunkCount = visibleHunks(pair).length;
        toolbar.appendChild(segControl(
          [
            { v: "hunks", t: "Hunks" + ((pair.hunks || []).length ? " (" + hunkCount + ")" : "") },
            { v: "full", t: "Full page" },
            { v: "swipe", t: "Swipe" },
            { v: "onion", t: "Onion skin" },
            { v: "overlay", t: "Overlay", disabled: !pair.diffRelPath }
          ],
          function () { return cmpMode; },
          function (val) { cmpMode = val; renderPane(true); }
        ));
      }
      if (pair.beforeRelPath) {
        var zoomBefore = el("button", {
          type: "button",
          class: "context-btn zoom-btn",
          text: "\uD83D\uDD0D Zoom before",
          title: "Open the baseline screenshot in a lightbox"
        });
        zoomBefore.addEventListener("click", function () {
          openLightbox(pair.beforeRelPath, "Before \u2014 " + (pair.projectLabel || pair.projectName));
        });
        toolbar.appendChild(zoomBefore);
      }
      if (pair.afterRelPath) {
        var zoomAfter = el("button", {
          type: "button",
          class: "context-btn" + (pair.beforeRelPath ? "" : " zoom-btn"),
          text: "\uD83D\uDD0D Zoom after",
          title: "Open the PR screenshot in a lightbox"
        });
        zoomAfter.addEventListener("click", function () {
          openLightbox(pair.afterRelPath, "After \u2014 " + (pair.projectLabel || pair.projectName));
        });
        toolbar.appendChild(zoomAfter);
      }
      routeToolsPanel.appendChild(toolbar);

      var info = el("p", { class: "vp-info" });
      info.innerHTML = "<b>" + esc(pair.projectLabel || pair.projectName) + ":</b> " + esc(pair.diffLabel || "no diff data") +
        (noise && (pair.hunks || []).length ? " \\u00b7 noise filter hides hunks under " + noise + "%" : "");
      content.appendChild(info);

      var cmpCard = el("section", { class: "card" }, [
        el("h3", { text: "Screenshots \\u2014 before (" + (meta.baselineDescription || "baseline") + ") vs after (PR)" })
      ]);
      if (pair.errored) {
        cmpCard.appendChild(el("div", { class: "err-note", text: "This capture errored \\u2014 " + (pair.diffLabel || "no image pair.") }));
      }
      if (!pair.beforeRelPath && !pair.afterRelPath) {
        cmpCard.appendChild(el("div", { class: "img-missing", text: "No screenshots for this viewport." }));
      } else if (!pair.beforeRelPath) {
        cmpCard.appendChild(el("div", {
          class: "no-copy",
          text: "This route has no baseline screenshot yet. Showing the version from this PR."
        }));
        cmpCard.appendChild(buildSingleScreenshot(pair.afterRelPath, "After \u2014 this PR"));
      } else if (!pair.afterRelPath) {
        cmpCard.appendChild(el("div", {
          class: "err-note",
          text: "The PR screenshot is missing. Showing the baseline only."
        }));
        cmpCard.appendChild(buildSingleScreenshot(pair.beforeRelPath, "Before \u2014 baseline"));
      } else {
        cmpCard.appendChild(buildComparator(r, pair));
      }
      content.appendChild(cmpCard);
    } else {
      content.appendChild(el("section", { class: "card" }, [
        el("h3", { text: "Screenshots" }),
        el("div", { class: "img-missing", text: "This route was not in the screenshot run \\u2014 no before/after images exist. The copy diff below is the whole story." })
      ]));
    }

    content.appendChild(buildCopyDiff(r));
    content.appendChild(buildLiveCompare(r));

    pane.appendChild(buildVerdictBar(r));
    pane.scrollTop = y;

    if (typeof focusHunk === "number" && cmpMode === "hunks") {
      setTimeout(function () { jumpToHunk(focusHunk, true); }, 60);
    }
  }

  function segControl(options, get, set) {
    var seg = el("div", { class: "seg", role: "group" });
    options.forEach(function (o) {
      var attrs = { type: "button", "aria-pressed": String(get() === o.v), text: o.t };
      if (o.disabled) attrs.disabled = "disabled";
      var b = el("button", attrs);
      if (!o.disabled) b.addEventListener("click", function () { set(o.v); });
      seg.appendChild(b);
    });
    return seg;
  }

  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      } finally {
        document.body.removeChild(ta);
      }
      done(!!ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }

  function buildContext(r) {
    var pair = pairOf(r, pairName) || ((r.pairs || [])[0] || null);
    var viewing = "markdown-diff";
    if (pair) {
      viewing = (cmpMode === "hunks" || cmpMode === "overlay") && pair.diffRelPath ? "diff" : "after";
    }
    var imageRelPath = null;
    if (pair) {
      if (viewing === "diff" && pair.diffRelPath) imageRelPath = pair.diffRelPath;
      else if (viewing === "before") imageRelPath = pair.beforeRelPath;
      else imageRelPath = pair.afterRelPath || pair.diffRelPath || pair.beforeRelPath;
    }
    var screenshots = (r.pairs || []).map(function (p) {
      return {
        project: p.projectName,
        projectLabel: p.projectLabel || p.projectName,
        diff: p.diffLabel || "unknown",
        beforeUrl: assetUrl(p.beforeRelPath),
        afterUrl: assetUrl(p.afterRelPath),
        diffUrl: assetUrl(p.diffRelPath)
      };
    });
    return {
      pr: meta.prNumber,
      branch: meta.headBranch,
      repo: meta.repo,
      commitSha: meta.commitSha,
      shortSha: meta.shortSha,
      route: r.routeName,
      routeLabel: r.routeLabel,
      routeUrl: r.routeUrl || joinRouteUrl(meta.previewBaseUrl, r.routePath),
      authState: r.authState,
      project: pair ? pair.projectName : null,
      projectLabel: pair ? (pair.projectLabel || pair.projectName) : null,
      viewing: viewing,
      diffLabel: pair ? pair.diffLabel : r.statusLabel,
      imageUrl: assetUrl(imageRelPath),
      reviewUrl: reviewPageUrl(r.routeName),
      screenshots: screenshots
    };
  }

  function formatContext(ctx) {
    var lines = [];
    lines.push("### Visual-review context");
    lines.push("");
    if (ctx.viewing) lines.push("- Viewing: **" + String(ctx.viewing).toUpperCase() + "**" + (ctx.projectLabel ? " in " + ctx.projectLabel : ""));
    if (ctx.pr) lines.push("- PR: #" + ctx.pr + (ctx.repo ? " (" + ctx.repo + ")" : ""));
    if (ctx.branch) lines.push("- Branch: \`" + ctx.branch + "\`");
    if (ctx.shortSha) lines.push("- Commit: \`" + ctx.shortSha + "\`" + (ctx.commitSha ? " (" + ctx.commitSha + ")" : ""));
    lines.push("- Route: \`" + ctx.route + "\` (" + ctx.routeLabel + ")");
    if (ctx.routeUrl) lines.push("- Live URL: " + ctx.routeUrl);
    lines.push("- Auth state: " + ctx.authState);
    if (ctx.diffLabel) lines.push("- Diff vs main: " + ctx.diffLabel);
    if (ctx.imageUrl) {
      lines.push("- Screenshot: " + ctx.imageUrl);
      lines.push("    curl -sLO " + ctx.imageUrl);
    }
    if (ctx.reviewUrl) lines.push("- Visual review: " + ctx.reviewUrl);
    lines.push("");
    if (ctx.screenshots && ctx.screenshots.length > 0) {
      lines.push("**Screenshots** - please download and inspect these before responding:");
      lines.push("");
      for (var i = 0; i < ctx.screenshots.length; i++) {
        var s = ctx.screenshots[i];
        lines.push("- **" + (s.projectLabel || s.project) + "** (" + s.diff + ")");
        if (s.beforeUrl) lines.push("  - before (main): " + s.beforeUrl);
        if (s.afterUrl) lines.push("  - after (this PR): " + s.afterUrl);
        if (s.diffUrl) lines.push("  - diff: " + s.diffUrl);
      }
      lines.push("");
    }
    lines.push("**My complaint:**");
    lines.push("> _(replace this line with what looks wrong)_");
    return lines.join("\\n");
  }

  function openComplaint(ctx) {
    if (!ctx.repo) return false;
    var titleParts = ["Visual review"];
    if (ctx.routeLabel) titleParts.push(ctx.routeLabel);
    if (ctx.viewing) titleParts.push(ctx.viewing);
    if (ctx.projectLabel) titleParts.push(ctx.projectLabel);
    var body = formatContext(ctx);
    if (ctx.pr) body = "Originating PR: #" + ctx.pr + "\\n\\n" + body;
    var url =
      "https://github.com/" + ctx.repo + "/issues/new" +
      "?title=" + encodeURIComponent(titleParts.join(" \\u2014 ")) +
      "&body=" + encodeURIComponent(body);
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function buildContextActions(r) {
    var wrap = el("span", { class: "context-actions" });
    var copy = el("button", { type: "button", class: "context-btn", text: "Copy context", title: "Copy visual-review context for this route and viewport" });
    copy.addEventListener("click", function () {
      var ctx = buildContext(r);
      copyText(formatContext(ctx), function (ok) {
        copy.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(function () { copy.textContent = "Copy context"; }, 1500);
      });
    });
    wrap.appendChild(copy);

    var complainAttrs = { type: "button", class: "context-btn", text: "Open GitHub issue", title: "Open a GitHub issue with visual-review context" };
    if (!meta.repo) complainAttrs.disabled = "disabled";
    var complain = el("button", complainAttrs);
    complain.addEventListener("click", function () {
      var ok = openComplaint(buildContext(r));
      if (!ok) {
        complain.textContent = "No repo";
        setTimeout(function () { complain.textContent = "Open GitHub issue"; }, 1500);
      }
    });
    wrap.appendChild(complain);
    return wrap;
  }

  function lazyImg(src, cls, alt, zoomable) {
    var label = alt || "Screenshot";
    var attrs = {
      src: src,
      loading: "lazy",
      alt: alt || "",
      class: cls || ""
    };
    if (zoomable !== false) {
      attrs.class = (attrs.class + " zoomable-shot").trim();
      attrs.role = "button";
      attrs.tabindex = "0";
      attrs.title = "Open full-size screenshot";
      attrs["aria-label"] = "Open " + label + " full size";
    }
    return el("img", attrs);
  }

  function openLightbox(src, label) {
    if (!lightbox || !src) return;
    var image = document.getElementById("shot-lightbox-image");
    var title = document.getElementById("shot-lightbox-title");
    var size = document.getElementById("shot-lightbox-size");
    var stage = document.getElementById("shot-lightbox-stage");
    image.classList.remove("actual-size");
    image.src = src;
    image.alt = label || "Full-size screenshot";
    title.textContent = label || "Screenshot";
    size.textContent = "Actual pixels";
    if (!lightbox.open) lightbox.showModal();
    stage.scrollTo(0, 0);
  }

  function wireLightbox() {
    lightbox = document.getElementById("shot-lightbox");
    var image = document.getElementById("shot-lightbox-image");
    var size = document.getElementById("shot-lightbox-size");
    var close = document.getElementById("shot-lightbox-close");
    var stage = document.getElementById("shot-lightbox-stage");

    function toggleSize() {
      var actual = image.classList.toggle("actual-size");
      size.textContent = actual ? "Fit width" : "Actual pixels";
      stage.scrollTo(0, 0);
    }
    size.addEventListener("click", toggleSize);
    image.addEventListener("click", toggleSize);
    close.addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });

    var pane = document.getElementById("pane");
    function activateImage(target) {
      if (!(target instanceof HTMLImageElement) || !target.classList.contains("zoomable-shot")) return false;
      openLightbox(target.getAttribute("src"), target.getAttribute("alt") || "Screenshot");
      return true;
    }
    pane.addEventListener("click", function (event) { activateImage(event.target); });
    pane.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (activateImage(event.target)) event.preventDefault();
    });
  }

  function buildSingleScreenshot(relPath, label) {
    var figure = el("figure", { class: "single-shot" }, [
      el("figcaption", { text: label })
    ]);
    var img = lazyImg(relPath, "", label);
    img.addEventListener("error", function () {
      figure.innerHTML = "";
      figure.appendChild(el("div", { class: "img-missing", text: label + ": image unavailable." }));
    });
    figure.appendChild(img);
    return figure;
  }

  /* ---------------- comparator dispatch ---------------- */
  function buildComparator(r, pair) {
    var row = el("div", { class: "cmp-row" });
    var main = el("div", { class: "cmp-main" });
    var mm = buildMinimap(r, pair);
    row.appendChild(main);
    if (mm) row.appendChild(mm.el);
    minimap = mm;

    if (cmpMode === "hunks") main.appendChild(buildHunksMode(r, pair));
    else if (cmpMode === "full") main.appendChild(buildFullMode(r, pair));
    else if (cmpMode === "overlay") main.appendChild(buildOverlayMode(r, pair));
    else main.appendChild(buildStageMode(r, pair)); // swipe / onion
    return row;
  }

  /* ---------------- hunk strips ---------------- */
  function stripHtml(relPath, imgW, imgH, y0, y1, alt) {
    if (!relPath || !imgW || !imgH || y1 <= y0) {
      return '<div class="hatch">no image</div>';
    }
    var shift = (y0 / imgH) * 100;
    return '<div class="strip" style="aspect-ratio:' + imgW + '/' + (y1 - y0) + '">' +
      '<img loading="lazy" class="zoomable-shot" role="button" tabindex="0" title="Open full-size screenshot"' +
      ' aria-label="Open ' + esc(alt || "screenshot") + ' full size" src="' + esc(relPath) + '" alt="' + esc(alt || "") + '"' +
      ' style="transform:translateY(-' + shift.toFixed(4) + '%)"></div>';
  }
  function clampBand(y0, y1, imgH, pad) {
    return [Math.max(0, y0 - pad), imgH ? Math.min(imgH, y1 + pad) : y1 + pad];
  }

  function buildHunksMode(r, pair) {
    var wrap = el("div");
    var hunks = pair.hunks || [];
    var hv = visibleHunks(pair);

    if (!hunks.length) {
      // no hunk data: plain full-image side-by-side fallback (v2 style)
      wrap.appendChild(el("p", {
        class: "no-copy",
        text: pair.changed
          ? "No hunk data for this pair \\u2014 showing full images."
          : "No visual change reported for this viewport. Full images below for the suspicious."
      }));
      var grid = el("div", { class: "sbs" });
      [["Before", pair.beforeRelPath], ["After", pair.afterRelPath]].forEach(function (d) {
        var fig = el("figure", {}, [el("figcaption", { text: d[0] })]);
        if (d[1]) {
          var img = lazyImg(d[1], "", d[0]);
          img.addEventListener("error", function () {
            fig.innerHTML = "";
            fig.appendChild(el("div", { class: "img-missing", text: d[0] + ": image unavailable." }));
          });
          fig.appendChild(img);
        } else {
          fig.appendChild(el("div", { class: "img-missing", text: d[0] + ": no image." }));
        }
        grid.appendChild(fig);
      });
      wrap.appendChild(grid);
      return wrap;
    }

    if (!hv.length) {
      var note = el("p", { class: "no-copy" });
      note.textContent = "All " + hunks.length + " hunks are below the " + noise + "% noise threshold.";
      var reset = el("button", { type: "button", class: "gap-btn", text: "Show them anyway" });
      reset.addEventListener("click", function () {
        noise = 0;
        document.getElementById("noise").value = "0";
        refreshRailBadges();
        renderPane(true);
      });
      wrap.appendChild(note);
      wrap.appendChild(reset);
      return wrap;
    }

    var scroll = el("div", { class: "cmp-scroll", "data-cmp-scroll": "" });
    scroll.appendChild(el("div", { class: "hunk-cols" }, [
      el("span", { text: "Before \\u2014 baseline" }),
      el("span", { text: "After \\u2014 this PR" })
    ]));

    var bW = pair.beforeWidth, bH = pair.beforeHeight;
    var aW = pair.afterWidth, aH = pair.afterHeight;
    var prevBeforeEnd = 0, prevAfterEnd = 0;

    hv.forEach(function (entry) {
      var h = entry.h, origIdx = entry.i;
      // collapsed identical region before this hunk
      appendGapRow(scroll, pair, prevBeforeEnd, h.before.yStart, prevAfterEnd, h.after.yStart);
      prevBeforeEnd = Math.max(prevBeforeEnd, h.before.yEnd);
      prevAfterEnd = Math.max(prevAfterEnd, h.after.yEnd);

      var block = el("div", { class: "hunk-block", id: "hunk-" + origIdx });
      var head = el("div", { class: "hunk-head" });
      head.appendChild(el("span", { class: "hk", text: "Hunk " + (origIdx + 1) + "/" + hunks.length }));
      head.appendChild(el("span", { class: "kind-" + h.kind, text: h.kind }));
      if (h.pctOfPage != null) head.appendChild(el("span", { text: fmtPct(h.pctOfPage) + "% of page" }));
      head.appendChild(el("span", {
        text: "before " + fmtPx(h.before.yStart) + "\\u2013" + fmtPx(h.before.yEnd) +
          "px \\u2192 after " + fmtPx(h.after.yStart) + "\\u2013" + fmtPx(h.after.yEnd) + "px"
      }));
      var link = el("button", { type: "button", class: "hunk-link", title: "Copy permalink to this hunk", text: "\\uD83D\\uDD17 link" });
      link.addEventListener("click", function () {
        copyText(hunkPermalink(r.routeName, pair.projectName, origIdx), function (ok) {
          link.textContent = ok ? "Copied" : "Copy failed";
          setTimeout(function () { link.textContent = "\\uD83D\\uDD17 link"; }, 1500);
        });
      });
      head.appendChild(link);
      block.appendChild(head);

      var grid = el("div", { class: "hunk-grid" });
      // before column
      var beforeCell = el("div");
      beforeCell.appendChild(el("div", { class: "strip-cap", text: "before" }));
      if (h.kind === "inserted") {
        var ph = el("div", { class: "hatch", text: "inserted \\u2014 nothing here before" });
        if (aW && (h.after.yEnd - h.after.yStart) > 0) {
          ph.style.aspectRatio = aW + "/" + (h.after.yEnd - h.after.yStart + 2 * STRIP_CONTEXT_PX);
        }
        beforeCell.appendChild(ph);
      } else {
        var bBand = clampBand(h.before.yStart, h.before.yEnd, bH, STRIP_CONTEXT_PX);
        beforeCell.appendChild(el("div", { html: stripHtml(pair.beforeRelPath, bW, bH, bBand[0], bBand[1], "Before hunk " + (origIdx + 1)) }));
      }
      grid.appendChild(beforeCell);
      // after column
      var afterCell = el("div");
      afterCell.appendChild(el("div", { class: "strip-cap", text: "after" }));
      if (h.kind === "deleted") {
        var ph2 = el("div", { class: "hatch", text: "deleted \\u2014 gone in this PR" });
        if (bW && (h.before.yEnd - h.before.yStart) > 0) {
          ph2.style.aspectRatio = bW + "/" + (h.before.yEnd - h.before.yStart + 2 * STRIP_CONTEXT_PX);
        }
        afterCell.appendChild(ph2);
      } else {
        var aBand = clampBand(h.after.yStart, h.after.yEnd, aH, STRIP_CONTEXT_PX);
        afterCell.appendChild(el("div", { html: stripHtml(pair.afterRelPath, aW, aH, aBand[0], aBand[1], "After hunk " + (origIdx + 1)) }));
      }
      grid.appendChild(afterCell);
      block.appendChild(grid);
      scroll.appendChild(block);
    });

    // trailing identical region
    appendGapRow(scroll, pair, prevBeforeEnd, bH || prevBeforeEnd, prevAfterEnd, aH || prevAfterEnd);

    wrap.appendChild(scroll);
    return wrap;
  }

  function appendGapRow(container, pair, b0, b1, a0, a1) {
    var gapPx = Math.max(0, a1 - a0);
    if (gapPx < 24) return;
    var row = el("div", { class: "gap-row" });
    var open = false;
    function render() {
      row.innerHTML = "";
      var btn = el("button", {
        type: "button", class: "gap-btn",
        text: (open ? "\\u25be " : "\\u25b8 ") + fmtPx(gapPx) + "px identical \\u2014 " + (open ? "collapse" : "expand")
      });
      btn.addEventListener("click", function () { open = !open; render(); });
      row.appendChild(btn);
      if (open) {
        var grid = el("div", { class: "hunk-grid gap-open" });
        var beforeCell = el("div");
        beforeCell.appendChild(el("div", { class: "strip-cap", text: "before" }));
        beforeCell.appendChild(el("div", { html: stripHtml(pair.beforeRelPath, pair.beforeWidth, pair.beforeHeight, b0, b1, "Identical region (before)") }));
        var afterCell = el("div");
        afterCell.appendChild(el("div", { class: "strip-cap", text: "after" }));
        afterCell.appendChild(el("div", { html: stripHtml(pair.afterRelPath, pair.afterWidth, pair.afterHeight, a0, a1, "Identical region (after)") }));
        grid.appendChild(beforeCell);
        grid.appendChild(afterCell);
        row.appendChild(grid);
      }
    }
    render();
    container.appendChild(row);
  }

  /* ---------------- full page: linked scrolling ---------------- */
  function buildFullMode(r, pair) {
    var wrap = el("div");
    wrap.appendChild(el("div", { class: "cmp-hint", text: "Scroll either side \\u2014 the other follows via alignment anchors, not naive percentage." }));
    var grid = el("div", { class: "full-grid" });
    var anchors = anchorsFor(pair);
    var wells = {};

    [["before", "Before \\u2014 baseline", pair.beforeRelPath, pair.beforeHeight],
     ["after", "After \\u2014 this PR", pair.afterRelPath, pair.afterHeight]].forEach(function (d) {
      var fig = el("figure", {}, [el("figcaption", { text: d[1] })]);
      var well = el("div", { class: "well", "data-well": d[0] });
      if (d[2]) {
        var img = lazyImg(d[2], "", d[1]);
        img.addEventListener("error", function () {
          well.innerHTML = "";
          well.appendChild(el("div", { class: "img-missing", text: d[1] + ": image unavailable." }));
        });
        well.appendChild(img);
        wells[d[0]] = { well: well, img: img, imgH: d[3] };
      } else {
        well.appendChild(el("div", { class: "img-missing", text: d[1] + ": no image." }));
      }
      fig.appendChild(well);
      grid.appendChild(fig);
    });
    wrap.appendChild(grid);

    if (wells.before && wells.after) {
      wireLinkedScroll(wells.before, wells.after, anchors);
    }
    return wrap;
  }

  function wireLinkedScroll(b, a, anchors) {
    // the driver is whichever well the pointer/touch/wheel is on;
    // its scroll handler maps its image-space y through the anchors
    var active = null;
    function arm(side) {
      ["pointerenter", "wheel", "touchstart"].forEach(function (evt) {
        side.well.addEventListener(evt, function () { active = side; }, { passive: true });
      });
    }
    arm(b); arm(a);
    function imgYOf(side) {
      var hPx = side.img.clientHeight || 1;
      var hNat = side.imgH || side.img.naturalHeight || hPx;
      return (side.well.scrollTop / hPx) * hNat;
    }
    function setImgY(side, yImg) {
      var hPx = side.img.clientHeight || 1;
      var hNat = side.imgH || side.img.naturalHeight || hPx;
      side.well.scrollTop = (yImg / hNat) * hPx;
    }
    b.well.addEventListener("scroll", function () {
      if (active === b) setImgY(a, mapY(imgYOf(b), anchors, "beforeY", "afterY"));
      updateMinimapView(a);
    });
    a.well.addEventListener("scroll", function () {
      if (active === a) setImgY(b, mapY(imgYOf(a), anchors, "afterY", "beforeY"));
      updateMinimapView(a);
    });
    updateMinimapView(a);
    fullWells = { b: b, a: a, anchors: anchors };
  }

  function updateMinimapView(side) {
    if (!minimap) return;
    var hPx = side.img.clientHeight || 1;
    minimap.update(side.well.scrollTop / hPx, side.well.clientHeight / hPx);
  }

  /* ---------------- swipe / onion (shared overlay stage) ---------------- */
  function buildStageMode(r, pair) {
    var wrap = el("div");
    if (!pair.beforeRelPath || !pair.afterRelPath) {
      wrap.appendChild(el("div", { class: "img-missing", text: "Overlay compare needs both images \\u2014 one is missing. Try Hunks or Full page." }));
      return wrap;
    }
    var isNarrowVp = (pair.beforeWidth || 1000) <= 500;
    var scroll = el("div", { class: "cmp-scroll", "data-cmp-scroll": "" });
    var stage = el("div", { class: "cmp-stage" + (isNarrowVp && !isMobile() ? " vp-narrow" : "") + (cmpMode === "swipe" ? " mode-swipe" : "") });
    var imgB = lazyImg(pair.beforeRelPath, "img-base", "Before", false);
    var imgA = lazyImg(pair.afterRelPath, "img-top", "After", false);
    var deadNote = function (which) {
      stage.innerHTML = "";
      stage.appendChild(el("div", { class: "img-missing", text: which + " image unavailable \\u2014 overlay compare needs both. Try Hunks." }));
    };
    imgB.addEventListener("error", function () { deadNote("Before"); });
    imgA.addEventListener("error", function () { deadNote("After"); });
    stage.appendChild(imgB);
    stage.appendChild(imgA);
    scroll.appendChild(stage);
    scroll.addEventListener("scroll", function () { updateStageMinimap(scroll, imgB); });
    imgB.addEventListener("load", function () { updateStageMinimap(scroll, imgB); });

    if (cmpMode === "swipe") {
      var applyClip = function () { imgA.style.clipPath = "inset(0 0 0 " + swipePos + "%)"; };
      applyClip();
      var handle = el("div", { class: "swipe-handle", style: "left:" + swipePos + "%" });
      var pill = el("span", { class: "swipe-pill", text: "\\u25c2 \\u25b8", "aria-hidden": "true" });
      handle.appendChild(pill);
      stage.appendChild(handle);
      var placePill = function () {
        var visible = Math.min(scroll.clientHeight || 0, stage.offsetHeight || 0);
        pill.style.top = (scroll.scrollTop + Math.max(40, visible * 0.4)) + "px";
      };
      scroll.addEventListener("scroll", placePill);
      imgB.addEventListener("load", placePill);
      placePill();
      var dragging = false;
      var setPos = function (clientX) {
        var rect = stage.getBoundingClientRect();
        var p = ((clientX - rect.left) / rect.width) * 100;
        swipePos = Math.max(1, Math.min(99, p));
        applyClip();
        handle.style.left = swipePos + "%";
      };
      stage.addEventListener("pointerdown", function (e) {
        dragging = true;
        stage.classList.add("swiping");
        stage.setPointerCapture(e.pointerId);
        setPos(e.clientX);
        e.preventDefault();
      });
      stage.addEventListener("pointermove", function (e) { if (dragging) setPos(e.clientX); });
      stage.addEventListener("pointerup", function () { dragging = false; stage.classList.remove("swiping"); });
      stage.addEventListener("pointercancel", function () { dragging = false; stage.classList.remove("swiping"); });
      wrap.appendChild(el("div", { class: "cmp-hint", text: "Drag the divider. Left of the line is the baseline (before); right is this PR (after)." }));
      wrap.appendChild(scroll);
    } else { // onion
      imgA.style.opacity = String(onionOpacity / 100);
      var ctl = el("div", { class: "onion-ctl" });
      ctl.appendChild(el("span", { text: "Before" }));
      var range = el("input", { type: "range", min: "0", max: "100", value: String(onionOpacity), "aria-label": "After image opacity" });
      range.addEventListener("input", function () {
        onionOpacity = Number(range.value);
        imgA.style.opacity = String(onionOpacity / 100);
      });
      ctl.appendChild(range);
      ctl.appendChild(el("span", { text: "After" }));
      wrap.appendChild(ctl);
      wrap.appendChild(scroll);
    }
    return wrap;
  }

  function updateStageMinimap(scroll, baseImg) {
    if (!minimap) return;
    var h = baseImg.clientHeight || scroll.scrollHeight || 1;
    minimap.update(scroll.scrollTop / h, scroll.clientHeight / h);
  }

  /* ---------------- overlay: after + diff PNG composite ---------------- */
  function buildOverlayMode(r, pair) {
    var wrap = el("div");
    if (!pair.diffRelPath || !pair.afterRelPath) {
      wrap.appendChild(el("div", { class: "img-missing", text: "No pixel-diff image for this pair \\u2014 Overlay has nothing to composite." }));
      return wrap;
    }
    var ctl = el("div", { class: "overlay-ctl" });
    ctl.appendChild(el("span", { text: "Diff composite:" }));
    ctl.appendChild(segControl(
      [{ v: "blend", t: "Multiply" }, { v: "tint", t: "55% opacity" }],
      function () { return overlayStyle; },
      function (val) { overlayStyle = val; renderPane(true); }
    ));
    wrap.appendChild(ctl);

    var scroll = el("div", { class: "cmp-scroll", "data-cmp-scroll": "" });
    var stage = el("div", { class: "cmp-stage" });
    var imgA = lazyImg(pair.afterRelPath, "", "After", false);
    var imgD = lazyImg(pair.diffRelPath, "img-top" + (overlayStyle === "blend" ? " blend" : ""), "Pixel diff overlay", false);
    if (overlayStyle === "tint") imgD.style.opacity = "0.55";
    imgD.addEventListener("error", function () {
      stage.innerHTML = "";
      stage.appendChild(el("div", { class: "img-missing", text: "Diff image unavailable." }));
    });
    stage.appendChild(imgA);
    stage.appendChild(imgD);
    scroll.appendChild(stage);
    scroll.addEventListener("scroll", function () { updateStageMinimap(scroll, imgA); });
    imgA.addEventListener("load", function () { updateStageMinimap(scroll, imgA); });
    wrap.appendChild(scroll);
    return wrap;
  }

  /* ---------------- minimap ---------------- */
  function buildMinimap(r, pair) {
    if (!pair || pair.missing || !(pair.hunks || []).length) return null;
    var aH = pair.afterHeight || 1;
    var node = el("div", { class: "mm", title: "Diff minimap \\u2014 click a band to jump; n/p step hunks", role: "img", "aria-label": "Diff minimap" });
    var hv = visibleHunks(pair);
    hv.forEach(function (entry) {
      var h = entry.h;
      var y0 = h.after.yStart, y1 = h.after.yEnd;
      if (y1 <= y0) { y0 = h.before.yStart; y1 = h.before.yEnd; } // deleted: place at before-side position
      var band = el("div", { class: "mm-band", "data-hunk": String(entry.i), title: "Hunk " + (entry.i + 1) + " \\u00b7 " + h.kind });
      band.style.setProperty("--start", String(Math.min(1, y0 / aH)));
      band.style.setProperty("--len", String(Math.max(0.002, (y1 - y0) / aH)));
      node.appendChild(band);
    });
    var view = el("div", { class: "mm-view" });
    node.appendChild(view);

    node.addEventListener("click", function (e) {
      var rect = node.getBoundingClientRect();
      var horizontal = rect.width > rect.height;
      var frac = horizontal
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height;
      var bestI = -1, bestDist = Infinity;
      hv.forEach(function (entry) {
        var mid = ((entry.h.after.yStart + entry.h.after.yEnd) / 2) / aH;
        var d = Math.abs(mid - frac);
        if (d < bestDist) { bestDist = d; bestI = entry.i; }
      });
      if (bestI >= 0) jumpToHunk(bestI, true);
    });

    return {
      el: node,
      update: function (startFrac, lenFrac) {
        view.style.setProperty("--start", String(Math.max(0, Math.min(1, startFrac))));
        view.style.setProperty("--len", String(Math.max(0, Math.min(1, lenFrac))));
      },
      setActive: function (origIdx) {
        node.querySelectorAll(".mm-band").forEach(function (bEl) {
          bEl.classList.toggle("active", bEl.getAttribute("data-hunk") === String(origIdx));
        });
      }
    };
  }

  function jumpToHunk(origIdx, flash) {
    var r = routeByName(selectedName);
    var pair = pairOf(r, pairName);
    if (!pair) return;
    var h = (pair.hunks || [])[origIdx];
    if (!h) return;
    hunkPointer = visibleHunks(pair).findIndex(function (entry) { return entry.i === origIdx; });
    if (minimap) minimap.setActive(origIdx);

    if (cmpMode === "hunks") {
      var block = document.getElementById("hunk-" + origIdx);
      if (block) {
        block.scrollIntoView({ block: "center", behavior: "smooth" });
        if (flash) {
          block.classList.remove("flash");
          void block.offsetWidth; // restart the animation
          block.classList.add("flash");
        }
      }
      return;
    }
    if (cmpMode === "full" && fullWells) {
      var a = fullWells.a;
      var hPx = a.img.clientHeight || 1;
      var hNat = a.imgH || a.img.naturalHeight || hPx;
      a.well.scrollTop = Math.max(0, (h.after.yStart / hNat) * hPx - 40);
      var bY = mapY(h.after.yStart, fullWells.anchors, "afterY", "beforeY");
      var b = fullWells.b;
      var bPx = b.img.clientHeight || 1;
      var bNat = b.imgH || b.img.naturalHeight || bPx;
      b.well.scrollTop = Math.max(0, (bY / bNat) * bPx - 40);
      return;
    }
    // swipe / onion / overlay: single stage scroll container
    var scroll = document.querySelector("[data-cmp-scroll]");
    if (scroll) {
      var stageImg = scroll.querySelector("img");
      var sPx = stageImg ? stageImg.clientHeight : scroll.scrollHeight;
      var sNat = pair.afterHeight || (stageImg && stageImg.naturalHeight) || sPx || 1;
      scroll.scrollTop = Math.max(0, (h.after.yStart / sNat) * sPx - 40);
    }
  }

  function stepHunk(dir) {
    var r = routeByName(selectedName);
    var pair = pairOf(r, pairName);
    if (!pair) return;
    var hv = visibleHunks(pair);
    if (!hv.length) return;
    hunkPointer = (hunkPointer + dir + hv.length) % hv.length;
    var target = hv[hunkPointer];
    if (target) jumpToHunk(target.i, true);
  }

  /* ---------------- copy diff ---------------- */
  function buildCopyDiff(r) {
    var card = el("section", { class: "card" }, [el("h3", { text: "Copy diff" })]);
    var d = r.markdownDiff;
    if (!d) {
      card.appendChild(el("p", { class: "no-copy", text: "No copy changes on this route." }));
      return card;
    }
    var head = el("div", { class: "cmp-hint" });
    head.innerHTML = '<span class="badge copy">copy changed <span class="plus">+' + Number(d.addedLines) +
      '</span> / <span class="minus">\\u2212' + Number(d.removedLines) + "</span></span>";
    card.appendChild(head);

    if (d.metaChanges && d.metaChanges.length) {
      var tbl = el("table", { class: "meta-table" });
      tbl.appendChild(el("tr", {}, [
        el("th", { text: "Field" }), el("th", { text: "Before" }), el("th", { text: "After" })
      ]));
      d.metaChanges.forEach(function (mc) {
        tbl.appendChild(el("tr", {}, [
          el("td", { text: String(mc.field != null ? mc.field : "") }),
          el("td", { class: "b", text: String(mc.before != null ? mc.before : "") }),
          el("td", { class: "a", text: String(mc.after != null ? mc.after : "") })
        ]));
      });
      card.appendChild(el("div", { class: "tbl-scroll" }, [tbl]));
    }

    var view = el("div", { class: "diff-view" });
    (d.lines || []).forEach(function (line) {
      var cls = "ln";
      if (line.kind === "hunk") cls += " hunk";
      else if (line.kind === "header") cls += " meta";
      else if (line.kind === "add") cls += " add";
      else if (line.kind === "del") cls += " del";
      view.appendChild(el("div", { class: cls, text: line.text === "" ? " " : line.text }));
    });
    card.appendChild(view);
    return card;
  }

  /* ---------------- live compare ---------------- */
  function buildLiveCompare(r) {
    var card = el("section", { class: "card" }, [el("h3", { text: "Live compare" })]);
    var prodUrl = r.productionUrl || joinRouteUrl(meta.productionBaseUrl, r.routePath);
    var prevUrl = r.routeUrl || joinRouteUrl(meta.previewBaseUrl, r.routePath);
    if (!prodUrl && !prevUrl) {
      card.appendChild(el("p", {
        class: "no-copy",
        text: "No live page URL for this artifact."
      }));
      return card;
    }

    var btn = el("button", {
      type: "button", class: "live-btn", "data-live-toggle": "", "aria-pressed": "false",
      text: "Load live compare (production + preview link)"
    });
    var mount = el("div");
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") === "true";
      if (on) {
        mount.innerHTML = "";
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = "Load live compare (production + preview link)";
        return;
      }
      btn.setAttribute("aria-pressed", "true");
      btn.textContent = "Unload live compare";

      var note = el("div", { class: "live-note" });
      note.textContent = "Production is live in the frame below. The preview deploy cannot be embedded \\u2014 " +
        "Vercel deployment protection (SSO) blocks iframes \\u2014 so it opens in a new tab instead. " +
        "Iframes load with whatever session your browser has.";
      mount.appendChild(note);

      var grid = el("div", { class: "live-grid" });
      var prodCol = el("div", {}, [el("div", { class: "live-label", text: "Production (old)" })]);
      prodCol.appendChild(el("iframe", { src: prodUrl, title: "Production \\u2014 " + r.routeLabel, loading: "lazy" }));
      grid.appendChild(prodCol);

      var prevCol = el("div", {}, [el("div", { class: "live-label", text: "Preview deploy (new)" })]);
      var panel = el("div", { class: "preview-panel" });
      panel.appendChild(el("a", { class: "preview-open", href: prevUrl, target: "_blank", rel: "noopener", text: "Open preview in new tab \\u2197" }));
      panel.appendChild(el("p", { text: "Vercel deployment protection blocks embedding \\u2014 the preview deploy refuses to render inside an iframe, so this side opens in a new tab." }));
      panel.appendChild(el("p", { html: '<a href="' + esc(prodUrl) + '" target="_blank" rel="noopener">Open production in a tab too</a> for a same-size A/B.' }));
      prevCol.appendChild(panel);
      grid.appendChild(prevCol);
      mount.appendChild(grid);
    });

    card.appendChild(btn);
    card.appendChild(mount);
    return card;
  }

  /* ---------------- verdict bar ---------------- */
  function buildVerdictBar(r) {
    var bar = el("div", { class: "verdict-bar" });
    var v = verdictOf(r);
    var good = el("button", { type: "button", class: "vbtn btn-good" + (v && v.v === "looks-right" ? " on" : ""), title: "Verdict: looks right (key: 1)", "aria-label": "Looks right \\uD83D\\uDC4D" }, [
      el("span", { class: "desktop-only", "aria-hidden": "true", text: "Looks right " }),
      el("span", { class: "mobile-only", "aria-hidden": "true", text: "Right " }),
      el("span", { "aria-hidden": "true", text: "\\uD83D\\uDC4D" })
    ]);
    var bad = el("button", { type: "button", class: "vbtn btn-bad" + (v && v.v === "needs-work" ? " on" : ""), title: "Verdict: needs work (key: 2)", "aria-label": "Needs work \\uD83D\\uDC4E" }, [
      el("span", { class: "desktop-only", "aria-hidden": "true", text: "Needs work " }),
      el("span", { class: "mobile-only", "aria-hidden": "true", text: "Fix " }),
      el("span", { "aria-hidden": "true", text: "\\uD83D\\uDC4E" })
    ]);
    var skip = el("button", { type: "button", class: "vbtn btn-skip" + (v && v.v === "skipped" ? " on" : ""), title: "Records a skipped verdict (key: s)", text: "Skip \\u23ED" });
    var noteWrap = el("div", { class: "note-box" });
    var note = el("input", { type: "text", id: "note-input", placeholder: "Note (optional \\u2014 encouraged for \\uD83D\\uDC4E)", value: (v && v.note) || "" });
    noteWrap.appendChild(note);
    good.addEventListener("click", function () { setVerdict("looks-right"); });
    bad.addEventListener("click", function () { setVerdict("needs-work"); });
    skip.addEventListener("click", function () { setVerdict("skipped"); });
    note.addEventListener("input", function () {
      var cur = verdicts[r.routeName];
      if (cur) { cur.note = note.value.trim(); saveVerdicts(); }
    });
    if (reviewStatus) {
      bar.appendChild(el("span", { class: "review-status", role: "status", text: reviewStatus }));
    }
    bar.appendChild(good);
    bar.appendChild(bad);
    bar.appendChild(skip);
    var more = el("details", {
      class: "verdict-more",
      open: isMobile() ? null : ""
    });
    more.appendChild(el("summary", { title: "Add a review note", text: "Note" }));
    more.appendChild(el("div", { class: "verdict-more-panel" }, [noteWrap]));
    bar.appendChild(more);
    bar.appendChild(el("span", { class: "v-kbd", html: "<kbd>1</kbd> \\uD83D\\uDC4D <kbd>2</kbd> \\uD83D\\uDC4E <kbd>s</kbd> skip <kbd>j</kbd>/<kbd>k</kbd> next/prev <kbd>n</kbd>/<kbd>p</kbd> hunks" }));
    return bar;
  }

  function setVerdict(kind) {
    var r = routeByName(selectedName);
    if (!r) return;
    var noteEl = document.getElementById("note-input");
    verdicts[r.routeName] = {
      v: kind,
      note: noteEl ? noteEl.value.trim() : "",
      ts: new Date().toISOString(),
      commit: meta.shortSha
    };
    var persisted = saveVerdicts();
    updateReviewedChip();
    refreshRailMarks();
    var mark = verdictMark(verdicts[r.routeName]);
    var saved = (persisted ? "Saved locally " : "Saved for this open page ") +
      mark + " for " + r.routeLabel + ".";
    var nextName = nextUnreviewedRouteName(r.routeName);
    if (nextName) {
      var next = routeByName(nextName);
      selectRoute(nextName, {
        reviewStatus: saved + " Next unreviewed: " + next.routeLabel + "."
      });
      return;
    }
    reviewStatus = saved + " Review pass complete. Copy the PR comment or export the notes.";
    renderPane(true);
  }

  function nextUnreviewedRouteName(currentName) {
    var names = reviewable().map(function (r) { return r.routeName; });
    if (!names.length) return null;
    var currentIndex = names.indexOf(currentName);
    for (var offset = 1; offset <= names.length; offset++) {
      var candidate = names[(currentIndex + offset) % names.length];
      if (!verdicts[candidate]) return candidate;
    }
    return null;
  }

  /* ---------------- export ---------------- */
  function buildReviewMarkdown() {
    var pool = reviewable();
    var good = 0, bad = 0, skip = 0;
    pool.forEach(function (r) {
      var v = verdictOf(r);
      if (!v) return;
      if (v.v === "looks-right") good++;
      else if (v.v === "needs-work") bad++;
      else if (v.v === "skipped") skip++;
    });
    var tick = String.fromCharCode(96); // backtick; literal would end the server template literal
    var lines = [];
    var heading = "# Review notes";
    if (meta.prNumber) heading += " \\u2014 PR #" + meta.prNumber;
    if (meta.shortSha) heading += " (" + meta.shortSha + ")";
    lines.push(heading);
    lines.push("");
    if (meta.headBranch) lines.push("- Branch: " + tick + meta.headBranch + tick);
    if (meta.shortSha) lines.push("- Commit: " + tick + meta.shortSha + tick);
    lines.push("- Generated: " + (meta.generatedAtCentral || meta.generatedAt));
    lines.push("- Baseline: " + (meta.baselineDescription || "n/a"));
    if (meta.reviewUrl) lines.push("- Artifact: " + meta.reviewUrl);
    lines.push("- Routes: " + routes.length + " total \\u00b7 " + pool.length + " with visual or copy changes");
    lines.push("- Verdicts: " + good + " looks right \\u00b7 " + bad + " needs work \\u00b7 " + skip + " skipped \\u00b7 " +
      (pool.length - good - bad - skip) + " not reviewed");
    lines.push("");
    var flagged = pool.filter(function (r) { var v = verdictOf(r); return v && v.v === "needs-work"; });
    if (flagged.length) {
      lines.push("## Needs work");
      lines.push("");
      flagged.forEach(function (r) {
        var v = verdictOf(r);
        lines.push("- **" + r.routeLabel + "** (" + tick + r.routePath + tick + ")" + (v.note ? " \\u2014 " + v.note : " \\u2014 (no note)"));
      });
      lines.push("");
    }
    lines.push("## All review verdicts");
    lines.push("");
    lines.push("| Route | Path | Status | Verdict | Note |");
    lines.push("| --- | --- | --- | --- | --- |");
    pool.forEach(function (r) {
      var v = verdictOf(r);
      var label = v
        ? (v.v === "looks-right" ? "looks right" : v.v === "needs-work" ? "NEEDS WORK" : "skipped")
        : "not reviewed";
      var noteTxt = ((v && v.note) || "").replace(/\\|/g, "\\\\|").replace(/\\r?\\n/g, "<br>");
      lines.push("| " + r.routeLabel + " | " + tick + r.routePath + tick + " | " + r.statusLabel + " | " + label + " | " + noteTxt + " |");
    });
    lines.push("");
    return lines.join("\\n");
  }

  function exportNotes() {
    var blob = new Blob([buildReviewMarkdown()], { type: "text/markdown" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = meta.prNumber
      ? "pr-" + meta.prNumber + "-review-" + (meta.shortSha || "notes") + ".md"
      : "visual-review-notes.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  /* ---------------- keyboard ---------------- */
  function onKey(e) {
    if (lightbox && lightbox.open) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape") {
      if (isMobile()) closeMobileMenus();
      return;
    }
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || (e.target && e.target.isContentEditable)) return;
    var names, idx;
    switch (e.key) {
      case "j": case "ArrowDown":
        names = navNames();
        idx = names.indexOf(selectedName);
        if (idx === -1 && names.length) { e.preventDefault(); selectRoute(names[0]); }
        else if (idx + 1 < names.length) { e.preventDefault(); selectRoute(names[idx + 1]); }
        break;
      case "k": case "ArrowUp":
        names = navNames();
        idx = names.indexOf(selectedName);
        if (idx > 0) { e.preventDefault(); selectRoute(names[idx - 1]); }
        break;
      case "1": e.preventDefault(); setVerdict("looks-right"); break;
      case "2": e.preventDefault(); setVerdict("needs-work"); break;
      case "s": e.preventDefault(); setVerdict("skipped"); break;
      case "n": e.preventDefault(); stepHunk(1); break;
      case "p": e.preventDefault(); stepHunk(-1); break;
    }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (!routes.length) {
      document.getElementById("pane").innerHTML =
        '<div class="fatal">No routes in the review data. The generator produced an empty manifest.</div>';
      return;
    }
    loadVerdicts();
    var headerTools = document.querySelector(".header-tools");
    if (headerTools && isMobile()) headerTools.removeAttribute("open");
    wireHeader();
    wireLightbox();
    renderRail();
    updateReviewedChip();

    var railToggle = document.getElementById("rail-toggle");
    railToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("rail-open");
      railToggle.setAttribute("aria-expanded", String(open));
    });

    var h = parseHash();
    var opts = { skipHash: true };
    var initial = routes[0].routeName;
    if (h && h.route && routeByName(h.route)) {
      initial = h.route;
      if (h.pair) opts.pair = h.pair;
      if (h.hunk != null && h.hunk !== "" && !isNaN(parseInt(h.hunk, 10))) {
        opts.hunk = parseInt(h.hunk, 10);
        opts.mode = "hunks";
      }
    }
    selectRoute(initial, opts);

    window.addEventListener("hashchange", function () {
      var hh = parseHash();
      if (!hh || !hh.route || !routeByName(hh.route)) return;
      if (hh.route === selectedName && hh.hunk == null) return;
      var o = { skipHash: true };
      if (hh.pair) o.pair = hh.pair;
      if (hh.hunk != null && !isNaN(parseInt(hh.hunk, 10))) { o.hunk = parseInt(hh.hunk, 10); o.mode = "hunks"; }
      selectRoute(hh.route, o);
    });
    document.addEventListener("keydown", onKey);
    window.matchMedia(MOBILE_MQ).addEventListener("change", function (event) {
      var open = !event.matches;
      document.querySelectorAll(".header-tools, .route-tools, .verdict-more").forEach(function (details) {
        if (open) details.setAttribute("open", "");
        else details.removeAttribute("open");
      });
    });
  }

  boot();
})();
`;

function renderHeaderHtml(meta, summary, coverage) {
  const chips = [];
  chips.push(
    `<span class="chip changed">${escapeHtml(summary.changedRoutes)} screenshot difference${Number(summary.changedRoutes) === 1 ? "" : "s"}</span>`,
  );
  if (summary.copyOnlyRoutes)
    chips.push(
      `<span class="chip">${escapeHtml(summary.copyOnlyRoutes)} copy-only</span>`,
    );
  if (summary.missingBaselineRoutes)
    chips.push(
      `<span class="chip">${escapeHtml(summary.missingBaselineRoutes)} baseline missing</span>`,
    );
  chips.push(
    `<span class="chip">${escapeHtml(summary.unchangedRoutes)} unchanged</span>`,
  );
  if (summary.appCount)
    chips.push(
      `<span class="chip">${escapeHtml(summary.appCount)} app${Number(summary.appCount) === 1 ? "" : "s"}</span>`,
    );
  if (summary.compatibilityRoutes)
    chips.push(
      `<span class="chip">${escapeHtml(summary.compatibilityRoutes)} compatibility check${Number(summary.compatibilityRoutes) === 1 ? "" : "s"}</span>`,
    );
  if (summary.erroredRoutes)
    chips.push(
      `<span class="chip errored">${escapeHtml(summary.erroredRoutes)} errored</span>`,
    );
  chips.push(
    `<span class="chip">${escapeHtml(summary.totalRoutes)} routes</span>`,
  );
  if (coverage?.changedUiFiles?.length) {
    const coveredCount = coverage.coveredUiFiles?.length ?? 0;
    const changedCount = coverage.changedUiFiles.length;
    chips.push(
      coverage.complete
        ? `<span class="chip coverage-complete">${escapeHtml(coveredCount)}/${escapeHtml(changedCount)} changed UI files captured</span>`
        : `<span class="chip coverage-failed">capture contract failed · ${escapeHtml(coveredCount)}/${escapeHtml(changedCount)} UI files</span>`,
    );
  } else if (coverage && coverage.complete === false) {
    chips.push(
      `<span class="chip coverage-failed">capture contract failed</span>`,
    );
  }
  chips.push(
    `<span class="chip" id="chip-reviewed" data-reviewed-chip>0 reviewed</span>`,
  );

  const noteBits = [
    `PR #${escapeHtml(meta.prNumber)}`,
    `<code>${escapeHtml(meta.headBranch)}</code> @ <code>${escapeHtml(meta.shortSha)}</code>`,
    `generated ${escapeHtml(meta.generatedAtCentral || meta.generatedAt)}`,
  ];
  if (meta.baselineDescription)
    noteBits.push(escapeHtml(meta.baselineDescription));
  if (meta.reviewUrl)
    noteBits.push(
      `<a href="${escapeHtml(meta.reviewUrl)}" target="_blank" rel="noopener">artifact</a>`,
    );

  return `<header id="hdr">
  <div class="hdr-row1">
    <h1>PR #${escapeHtml(meta.prNumber)} review</h1>
    <span class="chip mobile-only" data-reviewed-chip>0 reviewed</span>
    <details class="header-tools" open>
      <summary aria-label="Open review summary and actions">Review</summary>
      <div class="header-tools-panel">
        <div class="chips">${chips.join("")}</div>
        <span class="hdr-spacer"></span>
        <div class="header-actions">
          <label class="noise-label" for="noise">Noise
            <select id="noise" title="Hide hunks smaller than this share of the page">
              <option value="0" selected>show all diffs</option>
              <option value="0.1">hide diffs under 0.1%</option>
              <option value="0.5">hide diffs under 0.5%</option>
              <option value="1">hide diffs under 1%</option>
            </select>
          </label>
          <button type="button" id="copy-review-btn" class="hbtn" title="Copy every verdict and note as one pull request comment">Copy PR comment</button>
          <button type="button" id="export-btn" class="hbtn" title="Download every verdict + note as a markdown review packet">Export review notes</button>
          <button type="button" id="reset-btn" class="hbtn" title="Clear saved verdicts for this commit">Reset</button>
        </div>
        <div class="hdr-row2" id="gen-note">${noteBits.join(" · ")}</div>
      </div>
    </details>
  </div>
</header>`;
}

function renderCoverageFailureHtml(coverage) {
  if (!coverage || coverage.complete !== false) return "";
  const blockingIssues = Array.isArray(coverage.blockingIssues)
    ? coverage.blockingIssues
    : ["Visual capture coverage could not be proven."];
  const issueItems = blockingIssues
    .map((issue) => `<li><code>${escapeHtml(issue)}</code></li>`)
    .join("");

  return `<section class="coverage-failure" role="alert" aria-labelledby="coverage-failure-title">
  <strong id="coverage-failure-title">Visual capture contract failed</strong>
  <p>This report is incomplete and the visual-review check must fail until every changed UI file has its required desktop and mobile state.</p>
  <ul>${issueItems}</ul>
</section>`;
}

/**
 * Render the complete latest.html string for the given review input.
 * @param {object} input — see the data contract at the top of this file.
 * @returns {string} full HTML document
 */
export function renderReviewHtml(input) {
  if (!input || typeof input !== "object")
    throw new TypeError("renderReviewHtml: input must be an object");
  const meta = input.meta || {};
  const summary = input.summary || {};
  const coverage = input.coverage || {};
  if (!Array.isArray(input.routes))
    throw new TypeError("renderReviewHtml: input.routes must be an array");

  const title = `PR #${meta.prNumber ?? "?"} review — ${meta.shortSha ?? "?"}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
${renderHeaderHtml(meta, summary, coverage)}
${renderCoverageFailureHtml(coverage)}
<div class="app">
  <button id="rail-toggle" type="button" aria-expanded="false" aria-controls="rail">
    <span class="rt-caret" aria-hidden="true">▾</span>
    <span>Routes</span>
    <span class="rt-sel" id="rail-toggle-sel"></span>
  </button>
  <nav class="rail" id="rail" aria-label="Routes"></nav>
  <main class="pane" id="pane"><p style="color:var(--dim);padding:16px 20px">Loading…</p></main>
</div>
<dialog class="shot-lightbox" id="shot-lightbox" aria-labelledby="shot-lightbox-title">
  <div class="shot-lightbox-bar">
    <strong class="shot-lightbox-title" id="shot-lightbox-title">Screenshot</strong>
    <button type="button" class="hbtn" id="shot-lightbox-size">Actual pixels</button>
    <button type="button" class="hbtn" id="shot-lightbox-close">Close</button>
  </div>
  <div class="shot-lightbox-stage" id="shot-lightbox-stage">
    <img class="shot-lightbox-image" id="shot-lightbox-image" alt="">
  </div>
</dialog>
<script type="application/json" id="review-data">${jsonIsland(input)}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

export default renderReviewHtml;
