#!/usr/bin/env node
// Generates the sticky PR review packet: preview links, visual-review links,
// and a reviewer checklist whose checked state survives CI reruns.
//
// Reads from env:
//   PREVIEW_URL                 Vercel preview deployment URL.
//   CHANGED_FILES               JSON array of changed PR paths.
//   EXISTING_COMMENT_BODY       Existing sticky packet body, if any.
//   VISUAL_REVIEW_URL           Published latest.html URL.
//   VISUAL_REVIEW_MANIFEST_PATH Optional JSON manifest path from visual:review.
//   VISUAL_REVIEW_MANIFEST_JSON Optional manifest JSON, mostly for tests.

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PREVIEW_URL = process.env.PREVIEW_URL?.replace(/\/$/, "") ?? "";
const CHANGED_FILES_JSON = process.env.CHANGED_FILES ?? "";
const EXISTING_COMMENT_BODY = process.env.EXISTING_COMMENT_BODY ?? "";
const VISUAL_REVIEW_URL =
  process.env.VISUAL_REVIEW_URL?.replace(/\/$/, "") ?? "";
const VISUAL_REVIEW_MANIFEST_PATH =
  process.env.VISUAL_REVIEW_MANIFEST_PATH ?? "";
const VISUAL_REVIEW_MANIFEST_JSON =
  process.env.VISUAL_REVIEW_MANIFEST_JSON ?? "";
const VISUAL_REVIEW_BASELINE_COMMIT_SHA = normalizeCommitSha(
  process.env.VISUAL_REVIEW_BASELINE_COMMIT_SHA,
);
const VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA = normalizeCommitSha(
  process.env.VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA,
);
const VISUAL_REVIEW_BASELINE_RUN_ID = normalizeRunId(
  process.env.VISUAL_REVIEW_BASELINE_RUN_ID,
);

if (!PREVIEW_URL) {
  console.error("PREVIEW_URL not set; skipping comment generation.");
  process.exit(0);
}

// AUTH-ONLY routes: render the sign-in page if hit logged-out, so reviewers
// need `?login=demo`. Mirrors AUTH_REQUIRED_PATHS in the web e2e helpers.
const AUTH_ROUTES = new Set([
  "/dashboard",
  "/profile",
  "/settings",
  "/census",
  "/check-in",
  "/organizations",
  "/people/manage",
  "/plaintiffs/manage",
  "/transmit",
  "/admin",
  "/mcp/authorize",
]);

// HYBRID routes render meaningfully differently authed vs unauthed.
const HYBRID_ROUTES = new Set([
  "/tasks",
]);

// Component folder -> routes it likely affects. Imperfect but cheap.
const COMPONENT_FOLDER_ROUTES = {
  "src/components/dashboard/": ["/dashboard"],
  "src/components/treaty/": ["/treaty"],
  "src/components/donate/": ["/donate"],
  "src/components/landing/": ["/"],
  "src/components/referendum/": ["/treaty", "/vote"],
  "src/components/signatories/": ["/signatories"],
  "src/components/tasks/": ["/tasks"],
  "src/components/plaintiffs/": ["/plaintiffs"],
  "src/components/join/": ["/join"],
  "src/components/site/": ["/", "/treaty"],
};

function getChangedFiles() {
  if (CHANGED_FILES_JSON) {
    try {
      const parsed = JSON.parse(CHANGED_FILES_JSON);
      return Array.isArray(parsed)
        ? parsed.filter((file) => typeof file === "string")
        : [];
    } catch (err) {
      console.error(`Failed to parse CHANGED_FILES JSON: ${err.message}`);
      return [];
    }
  }

  try {
    // Local fallback: name-status drops deletions so we do not link to 404s.
    const out = execSync("git diff --name-status origin/main...HEAD", {
      encoding: "utf8",
    });
    return out
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [status, ...rest] = line.split("\t");
        return { status, file: rest.join("\t") };
      })
      .filter(({ status }) => status !== "D")
      .map(({ file }) => file);
  } catch (err) {
    console.error(`git diff failed: ${err.message}`);
    return [];
  }
}

// `packages/web/src/app/foo/bar/page.tsx` -> `/foo/bar`
// `packages/web/src/app/page.tsx` -> `/`
// `packages/web/src/app/tasks/[id]/page.tsx` -> `/tasks`
function pageFileToRoute(file) {
  const match = file.match(
    /^packages\/web\/src\/app\/((?:[^/]+\/)*)page\.tsx$/,
  );
  if (!match) return null;
  const segments = match[1]
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("(") && !segment.startsWith("_"))
    .map((segment) =>
      segment.startsWith("[") && segment.endsWith("]") ? null : segment,
    );
  if (segments.some((segment) => segment === null)) {
    const truncated = segments.slice(0, segments.findIndex((segment) => segment === null));
    return truncated.length === 0 ? "/" : `/${truncated.join("/")}`;
  }
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function inferRouteChanges(changedFiles) {
  const routeChanges = new Map();

  for (const file of changedFiles) {
    const route = pageFileToRoute(file);
    if (route) {
      addRouteFile(routeChanges, route, shortFile(file));
      continue;
    }

    for (const [folder, routes] of Object.entries(COMPONENT_FOLDER_ROUTES)) {
      if (!file.startsWith(`packages/web/${folder}`)) continue;
      for (const mappedRoute of routes) {
        addRouteFile(routeChanges, mappedRoute, shortFile(file));
      }
    }
  }

  return routeChanges;
}

function addRouteFile(routeChanges, route, file) {
  if (!routeChanges.has(route)) routeChanges.set(route, new Set());
  routeChanges.get(route).add(file);
}

function classifyRoute(route) {
  if (HYBRID_ROUTES.has(route)) return "hybrid";
  if (AUTH_ROUTES.has(route)) return "auth";
  for (const authRoute of AUTH_ROUTES) {
    if (route.startsWith(`${authRoute}/`)) return "auth";
  }
  return "public";
}

function reviewStatesForRoute(route) {
  const classification = classifyRoute(route);
  if (classification === "auth") {
    return [{ id: "demo-logged-in", label: "demo logged-in", param: "login=demo" }];
  }
  if (classification === "hybrid") {
    return [
      { id: "logged-out", label: "logged-out", param: "logout=1" },
      { id: "demo-logged-in", label: "demo logged-in", param: "login=demo" },
    ];
  }
  return [{ id: "logged-out", label: "logged-out", param: "logout=1" }];
}

function buildUrl(route, authParam) {
  const path = route === "/" ? "/" : route;
  return addAuthParamToUrl(new URL(path, `${PREVIEW_URL}/`).toString(), authParam);
}

function addAuthParamToUrl(url, authParam) {
  const parsed = new URL(url);
  const [key, value] = authParam.split("=");
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

function shortFile(file) {
  return file.replace(/^packages\/web\/src\//, "");
}

function loadVisualReviewManifest() {
  const raw = VISUAL_REVIEW_MANIFEST_JSON ||
    (VISUAL_REVIEW_MANIFEST_PATH && existsSync(VISUAL_REVIEW_MANIFEST_PATH)
      ? readFileSync(VISUAL_REVIEW_MANIFEST_PATH, "utf8")
      : "");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    console.error(`Failed to parse visual review manifest: ${err.message}`);
    return null;
  }
}

function parseCheckedItemIds(body) {
  const checked = new Set();
  const regex = /^- \[[xX]\] <!-- review-item:([^>]+) -->/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    checked.add(match[1]);
  }
  return checked;
}

function renderCheckItem({ id, label }, checkedIds) {
  const checked = checkedIds.has(id) ? "x" : " ";
  return `- [${checked}] <!-- review-item:${id} --> ${label}`;
}

function changedManifestRoutes(manifest) {
  const routes = Array.isArray(manifest?.routes) ? manifest.routes : [];
  return routes
    .filter((route) =>
      route &&
      (route.changed ||
        route.copyChanged ||
        route.errored ||
        route.missingPairs > 0 ||
        route.erroredPairs > 0),
    )
    .sort((a, b) => String(a.routeName).localeCompare(String(b.routeName)));
}

function buildVisualReviewItems(manifest) {
  if (!VISUAL_REVIEW_URL || !manifest) return [];

  return changedManifestRoutes(manifest).map((route) => {
    const routeName = String(route.routeName || "unknown");
    const authState = normalizeAuthState(route.authState);
    const authParam = authState === "demo-logged-in" ? "login=demo" : "logout=1";
    const routeUrl = route.routeUrl
      ? addAuthParamToUrl(route.routeUrl, authParam)
      : typeof route.routePath === "string"
        ? buildUrl(route.routePath, authParam)
        : null;
    const reviewUrl =
      typeof route.reviewUrl === "string" && route.reviewUrl
        ? route.reviewUrl
        : `${VISUAL_REVIEW_URL}#route-${slugify(routeName)}`;
    const status = visualStatusLabel(route);
    const label =
      `:framed_picture: [${route.routeLabel || labelRouteName(routeName)}](${reviewUrl})` +
      ` - ${authLabel(authState)} ${status}` +
      (routeUrl ? ` - [open page](${routeUrl})` : "");
    return {
      id: `visual:${routeName}:${authState}`,
      label,
    };
  });
}

function normalizeAuthState(value) {
  if (value === "authenticated" || value === "demo logged-in" || value === "demo-logged-in") {
    return "demo-logged-in";
  }
  return "logged-out";
}

function authLabel(authState) {
  return authState === "demo-logged-in" ? "demo logged-in" : "logged-out";
}

function normalizeCommitSha(value) {
  const normalized = String(value ?? "").trim();
  return /^[0-9a-f]{7,40}$/i.test(normalized) ? normalized : null;
}

function normalizeRunId(value) {
  const normalized = String(value ?? "").trim();
  return /^\d+$/.test(normalized) ? normalized : null;
}

function shortSha(value) {
  return value.slice(0, 12);
}

function buildBaselineSummaryLine() {
  if (!VISUAL_REVIEW_BASELINE_COMMIT_SHA) return null;

  const baseline = `\`main@${shortSha(VISUAL_REVIEW_BASELINE_COMMIT_SHA)}\``;
  const run = VISUAL_REVIEW_BASELINE_RUN_ID
    ? ` from CI run \`${VISUAL_REVIEW_BASELINE_RUN_ID}\``
    : "";

  if (!VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA) {
    return `- :straight_ruler: Screenshot baseline: ${baseline}${run}.`;
  }

  if (
    VISUAL_REVIEW_BASELINE_COMMIT_SHA ===
    VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA
  ) {
    return `- :straight_ruler: Screenshot baseline: exact PR base ${baseline}${run}.`;
  }

  return (
    `- :warning: Screenshot baseline fallback: ${baseline}${run}; ` +
    `exact PR base \`main@${shortSha(VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA)}\` had no usable artifact.`
  );
}

function visualStatusLabel(route) {
  if (route.errored || route.erroredPairs > 0) return "visual review errored";
  const parts = [];
  const screenshotParts = [];
  if (route.changedPairs > 0) screenshotParts.push(`${route.changedPairs} changed`);
  if (route.missingPairs > 0) screenshotParts.push(`${route.missingPairs} missing`);
  if (screenshotParts.length > 0) {
    parts.push(`${screenshotParts.join(" / ")} screenshots`);
  }
  if (route.copyChanged) parts.push("copy changed");
  return parts.join(" / ") || "changed";
}

function buildPreviewItems(routeChanges) {
  const items = [];
  for (const route of Array.from(routeChanges.keys()).sort()) {
    const files = Array.from(routeChanges.get(route)).sort();
    const filesLabel =
      files.slice(0, 4).join(", ") +
      (files.length > 4 ? ` (+${files.length - 4} more)` : "");
    for (const state of reviewStatesForRoute(route)) {
      items.push({
        id: `preview:${route}:${state.id}`,
        label:
          `:rocket: [\`${route}\`](${buildUrl(route, state.param)})` +
          ` - ${state.label} preview - ${filesLabel}`,
      });
    }
  }
  return items;
}

function labelRouteName(routeName) {
  return String(routeName)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderPacket({
  changedFiles,
  checkedIds,
  manifest,
  routeChanges,
}) {
  const visualItems = buildVisualReviewItems(manifest);
  const previewItems = buildPreviewItems(routeChanges);
  const allItems = [...visualItems, ...previewItems];

  const lines = [
    "<!-- pr-review-packet -->",
    "<!-- pr-preview-links -->",
    "## PR review packet",
    "",
    "### Start here",
  ];

  if (VISUAL_REVIEW_URL) {
    lines.push(`- :framed_picture: [Visual review](${VISUAL_REVIEW_URL})`);
  } else {
    lines.push("- :framed_picture: Visual review link appears here after CI publishes `latest.html`.");
  }
  const baselineSummaryLine = buildBaselineSummaryLine();
  if (baselineSummaryLine) lines.push(baselineSummaryLine);
  lines.push(`- :rocket: [Preview deployment](${PREVIEW_URL})`);
  lines.push("- :point_up: Cmd/Ctrl-click review links to keep this PR open.");
  lines.push("- :key: `?login=demo` signs in as the demo user; `?logout=1` clears the session.");
  lines.push("- :speech_balloon: For a visual problem, use the comment button in `latest.html` or reply here with `@claude` and the checklist item.");
  lines.push("");

  if (allItems.length === 0) {
    lines.push(
      "_No user-facing page or component changes were inferred from changed files or the visual review manifest._",
    );
  } else {
    lines.push("### Review checklist");
    lines.push("");
    lines.push(...allItems.map((item) => renderCheckItem(item, checkedIds)));
  }

  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Changed files considered</summary>");
  lines.push("");
  if (changedFiles.length === 0) {
    lines.push("_No changed file list was available._");
  } else {
    for (const file of changedFiles.slice(0, 40)) {
      lines.push(`- \`${file}\``);
    }
    if (changedFiles.length > 40) {
      lines.push(`- ...and ${changedFiles.length - 40} more`);
    }
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
  lines.push("_Updated automatically when this PR's preview or visual review reruns._");

  return lines.join("\n");
}

function main() {
  const changedFiles = getChangedFiles();
  const routeChanges = inferRouteChanges(changedFiles);
  const checkedIds = parseCheckedItemIds(EXISTING_COMMENT_BODY);
  const manifest = loadVisualReviewManifest();
  console.log(renderPacket({ changedFiles, checkedIds, manifest, routeChanges }));
}

main();
