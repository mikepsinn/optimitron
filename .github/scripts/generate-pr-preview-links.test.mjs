import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(
  new URL("./generate-pr-preview-links.mjs", import.meta.url),
);

function runGenerator(env) {
  return execFileSync(process.execPath, [SCRIPT], {
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });
}

test("generates a review packet with visual-review links and preserved checkboxes", () => {
  const previewUrl = "https://preview.example.vercel.app";
  const visualReviewUrl =
    "https://mikepsinn.github.io/optimitron/pr-123/abcdef123456/latest.html";
  const manifest = {
    routes: [
      {
        routeName: "home",
        routeLabel: "Home",
        routePath: "/",
        routeUrl: `${previewUrl}/`,
        authState: "logged-out",
        changed: true,
        errored: false,
        changedPairs: 2,
        missingPairs: 0,
        erroredPairs: 0,
        reviewUrl: `${visualReviewUrl}#route-home`,
      },
    ],
  };

  const output = runGenerator({
    PREVIEW_URL: previewUrl,
    VISUAL_REVIEW_URL: visualReviewUrl,
    VISUAL_REVIEW_MANIFEST_JSON: JSON.stringify(manifest),
    CHANGED_FILES: JSON.stringify([
      "packages/web/src/components/landing/TreatyVoteFlow.tsx",
    ]),
    EXISTING_COMMENT_BODY:
      "- [x] <!-- review-item:visual:home:logged-out --> old label",
  });

  assert.match(output, /<!-- pr-review-packet -->/);
  assert.match(output, /\[Visual review\]\(https:\/\/mikepsinn\.github\.io\/optimitron\/pr-123\/abcdef123456\/latest\.html\)/);
  assert.match(output, /- \[x\] <!-- review-item:visual:home:logged-out -->/);
  assert.match(output, /\[Home\]\(https:\/\/mikepsinn\.github\.io\/optimitron\/pr-123\/abcdef123456\/latest\.html#route-home\)/);
  assert.match(output, /\[open page\]\(https:\/\/preview\.example\.vercel\.app\/\?logout=1\)/);
});

test("lists authenticated and logged-out preview states for hybrid routes", () => {
  const output = runGenerator({
    PREVIEW_URL: "https://preview.example.vercel.app/",
    CHANGED_FILES: JSON.stringify([
      "packages/web/src/components/tasks/TaskCard.tsx",
    ]),
  });

  assert.match(output, /<!-- review-item:preview:\/tasks:logged-out -->/);
  assert.match(output, /https:\/\/preview\.example\.vercel\.app\/tasks\?logout=1/);
  assert.match(output, /<!-- review-item:preview:\/tasks:demo-logged-in -->/);
  assert.match(output, /https:\/\/preview\.example\.vercel\.app\/tasks\?login=demo/);
});

test("reports when no user-facing page or component routes are inferred", () => {
  const output = runGenerator({
    PREVIEW_URL: "https://preview.example.vercel.app",
    CHANGED_FILES: JSON.stringify(["packages/web/src/lib/messaging.ts"]),
  });

  assert.match(output, /No user-facing page or component changes were inferred/);
  assert.doesNotMatch(output, /<!-- review-item:/);
});
