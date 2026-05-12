#!/usr/bin/env node
// Generates a markdown table of one-click preview-deploy links for a PR.
// Each row: a route that this PR's diff touches + the auth state to view it
// in. Reviewer clicks the link and lands on the right preview page already
// authed/unauthed via the ?login=demo / ?logout=1 dev-auth query params.
//
// Reads from env:
//   PREVIEW_URL    - the Vercel preview deployment URL (https://...vercel.app)
//   CHANGED_FILES  - JSON array of paths changed in this PR, e.g.
//                    '["packages/web/src/app/treaty/page.tsx", ...]'
//                    (excludes deleted files — caller's responsibility).
//                    If unset, falls back to `git diff origin/main...HEAD`
//                    for local testing.
//
// Writes markdown to stdout.

import { execSync } from "node:child_process";

const PREVIEW_URL = process.env.PREVIEW_URL?.replace(/\/$/, "") ?? "";
const CHANGED_FILES_JSON = process.env.CHANGED_FILES ?? "";

if (!PREVIEW_URL) {
  console.error("PREVIEW_URL not set; skipping comment generation.");
  process.exit(0);
}

// AUTH-ONLY routes: render the sign-in page if you hit them logged-out, so
// reviewers need `?login=demo`. Mirrors AUTH_REQUIRED_PATHS in
// packages/web/e2e/utils/static-pages.ts.
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

// HYBRID routes: render meaningfully differently when authed vs unauthed.
// Listed twice in the table (once per state) so reviewers compare both.
const HYBRID_ROUTES = new Set([
  "/tasks", // task detail page shows different CTAs based on viewer-claim state
]);

// Component folder → routes it likely affects. Imperfect but cheap.
const COMPONENT_FOLDER_ROUTES = {
  "src/components/dashboard/": ["/dashboard"],
  "src/components/treaty/": ["/treaty"],
  "src/components/donate/": ["/donate"],
  "src/components/landing/": ["/"],
  "src/components/referendum/": ["/treaty", "/vote"],
  "src/components/signatories/": ["/signatories"],
  "src/components/tasks/": ["/tasks"],
  "src/components/plaintiffs/": ["/plaintiffs"],
  "src/components/endorse/": ["/endorse"],
  "src/components/site/": ["/", "/treaty"],
};

function getChangedFiles() {
  if (CHANGED_FILES_JSON) {
    try {
      const parsed = JSON.parse(CHANGED_FILES_JSON);
      return Array.isArray(parsed) ? parsed.filter((f) => typeof f === "string") : [];
    } catch (err) {
      console.error(`Failed to parse CHANGED_FILES JSON: ${err.message}`);
      return [];
    }
  }
  try {
    // Local fallback: name-status to drop deletions so we don't link to 404s.
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

// `packages/web/src/app/foo/bar/page.tsx` → `/foo/bar`
// `packages/web/src/app/page.tsx`         → `/`
// `packages/web/src/app/tasks/[id]/page.tsx` → `/tasks`
function pageFileToRoute(file) {
  const match = file.match(
    /^packages\/web\/src\/app\/((?:[^/]+\/)*)page\.tsx$/,
  );
  if (!match) return null;
  const segments = match[1]
    .split("/")
    .filter(Boolean)
    .filter((s) => !s.startsWith("(") && !s.startsWith("_"))
    .map((s) => (s.startsWith("[") && s.endsWith("]") ? null : s));
  if (segments.some((s) => s === null)) {
    const truncated = segments.slice(0, segments.findIndex((s) => s === null));
    return truncated.length === 0 ? "/" : `/${truncated.join("/")}`;
  }
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function classifyRoute(route) {
  if (HYBRID_ROUTES.has(route)) return "hybrid";
  if (AUTH_ROUTES.has(route)) return "auth";
  for (const authRoute of AUTH_ROUTES) {
    if (route.startsWith(authRoute + "/")) return "auth";
  }
  return "public";
}

function buildUrl(route, authParam) {
  const path = route === "/" ? "" : route;
  return `${PREVIEW_URL}${path}?${authParam}`;
}

function shortFile(file) {
  return file.replace(/^packages\/web\/src\//, "");
}

function main() {
  const changed = getChangedFiles();
  const routeChanges = new Map(); // route → Set<changed-file-shortnames>

  for (const file of changed) {
    const route = pageFileToRoute(file);
    if (route) {
      if (!routeChanges.has(route)) routeChanges.set(route, new Set());
      routeChanges.get(route).add(shortFile(file));
      continue;
    }
    for (const [folder, routes] of Object.entries(COMPONENT_FOLDER_ROUTES)) {
      if (file.startsWith(`packages/web/${folder}`)) {
        for (const r of routes) {
          if (!routeChanges.has(r)) routeChanges.set(r, new Set());
          routeChanges.get(r).add(shortFile(file));
        }
      }
    }
  }

  if (routeChanges.size === 0) {
    console.log(
      "<!-- pr-preview-links -->\n_No user-facing page or component changes in this PR._",
    );
    return;
  }

  const lines = [
    "<!-- pr-preview-links -->",
    "## Preview deploy — one-click review links",
    "",
    `Latest preview: ${PREVIEW_URL}`,
    "",
    "| Page | State | What changed |",
    "| --- | --- | --- |",
  ];

  const sortedRoutes = Array.from(routeChanges.keys()).sort();
  for (const route of sortedRoutes) {
    const files = Array.from(routeChanges.get(route)).sort();
    const filesCell = files.slice(0, 4).join(", ") +
      (files.length > 4 ? ` (+${files.length - 4} more)` : "");
    const classification = classifyRoute(route);

    if (classification === "auth") {
      lines.push(
        `| [\`${route}\`](${buildUrl(route, "login=demo")}) | demo logged-in | ${filesCell} |`,
      );
    } else if (classification === "hybrid") {
      lines.push(
        `| [\`${route}\`](${buildUrl(route, "logout=1")}) | logged-out | ${filesCell} |`,
      );
      lines.push(
        `| [\`${route}\`](${buildUrl(route, "login=demo")}) | demo logged-in | ${filesCell} |`,
      );
    } else {
      lines.push(
        `| [\`${route}\`](${buildUrl(route, "logout=1")}) | logged-out | ${filesCell} |`,
      );
    }
  }

  lines.push("");
  lines.push(
    "_`?login=demo` signs you in as the demo user; `?logout=1` clears the session. Updated automatically when this PR's preview deploys._",
  );

  console.log(lines.join("\n"));
}

main();
