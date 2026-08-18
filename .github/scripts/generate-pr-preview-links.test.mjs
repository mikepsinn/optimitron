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
      VISUAL_REVIEW_BASELINE_COMMIT_SHA: "",
      VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA: "",
      VISUAL_REVIEW_BASELINE_RUN_ID: "",
      ...env,
    },
  });
}

test("generates a review packet with visual-review links and preserved checkboxes", () => {
  const previewUrl = "https://preview.example.vercel.app";
  const visualReviewUrl =
    "https://mikepsinn.github.io/optimitron/pr-123/abcdef123456/latest.html";
  const manifest = {
    commitSha: "abcdef1234567890abcdef1234567890abcdef12",
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
      "apps/optimitron/src/components/landing/TreatyVoteFlow.tsx",
    ]),
    EXISTING_COMMENT_BODY:
      "- [x] <!-- review-item:author:noise-audited:abcdef123456 --> old author preflight\n- [x] <!-- review-item:scope:no-unrelated-diffs --> old scope\n- [x] <!-- review-item:visual:home:logged-out --> old label",
  });

  assert.match(output, /<!-- pr-review-packet -->/);
  assert.match(output, /\[Visual review\]\(https:\/\/mikepsinn\.github\.io\/optimitron\/pr-123\/abcdef123456\/latest\.html\)/);
  assert.match(output, /Cmd\/Ctrl-click review links to keep this PR open/);
  assert.match(output, /### Agent preflight/);
  assert.match(output, /It resets for each commit/);
  assert.match(output, /- \[x\] <!-- review-item:author:noise-audited:abcdef123456 -->/);
  assert.match(output, /inspected every changed and copy-only route/);
  assert.match(output, /### Human review checklist/);
  assert.match(output, /Agents leave these boxes unchecked/);
  assert.match(output, /- \[x\] <!-- review-item:scope:no-unrelated-diffs -->/);
  assert.match(output, /investigate and fix unexplained drift before approval/);
  assert.match(output, /- \[x\] <!-- review-item:visual:home:logged-out -->/);
  assert.match(output, /\[Home\]\(https:\/\/mikepsinn\.github\.io\/optimitron\/pr-123\/abcdef123456\/latest\.html#route-home\)/);
  assert.match(output, /\[open page\]\(https:\/\/preview\.example\.vercel\.app\/\?logout=1\)/);
});

test("resets the agent preflight checkbox for a new commit", () => {
  const output = runGenerator({
    PREVIEW_URL: "https://preview.example.vercel.app",
    VISUAL_REVIEW_URL:
      "https://mikepsinn.github.io/optimitron/pr-123/222222222222/latest.html",
    VISUAL_REVIEW_MANIFEST_JSON: JSON.stringify({
      commitSha: "2222222222222222222222222222222222222222",
      routes: [
        {
          routeName: "home",
          routeLabel: "Home",
          routePath: "/",
          authState: "logged-out",
          changed: true,
          changedPairs: 1,
          missingPairs: 0,
          erroredPairs: 0,
        },
      ],
    }),
    CHANGED_FILES: JSON.stringify([]),
    EXISTING_COMMENT_BODY:
      "- [x] <!-- review-item:author:noise-audited:111111111111 --> old author preflight",
  });

  assert.match(output, /- \[ \] <!-- review-item:author:noise-audited:222222222222 -->/);
  assert.doesNotMatch(output, /author:noise-audited:111111111111/);
});

test("lists authenticated and logged-out preview states for hybrid routes", () => {
  const output = runGenerator({
    PREVIEW_URL: "https://preview.example.vercel.app/",
    CHANGED_FILES: JSON.stringify([
      "apps/optimitron/src/components/tasks/TaskCard.tsx",
    ]),
  });

  assert.match(output, /<!-- review-item:preview:\/tasks:logged-out -->/);
  assert.match(output, /https:\/\/preview\.example\.vercel\.app\/tasks\?logout=1/);
  assert.match(output, /<!-- review-item:preview:\/tasks:demo-logged-in -->/);
  assert.match(output, /https:\/\/preview\.example\.vercel\.app\/tasks\?login=demo/);
});

test("includes copy-only review states from the visual manifest", () => {
  const previewUrl = "https://preview.example.vercel.app";
  const visualReviewUrl =
    "https://mikepsinn.github.io/optimitron/pr-123/latest/latest.html";
  const output = runGenerator({
    PREVIEW_URL: previewUrl,
    VISUAL_REVIEW_URL: visualReviewUrl,
    VISUAL_REVIEW_MANIFEST_JSON: JSON.stringify({
      routes: [
        {
          routeName: "survey",
          routeLabel: "Survey",
          routePath: "/survey",
          routeUrl: `${previewUrl}/survey`,
          authState: "demo-logged-in",
          changed: false,
          copyChanged: true,
          errored: false,
          changedPairs: 0,
          missingPairs: 0,
          erroredPairs: 0,
          reviewUrl: `${visualReviewUrl}#route=survey`,
        },
      ],
    }),
    CHANGED_FILES: JSON.stringify([]),
  });

  assert.match(output, /<!-- review-item:visual:survey:demo-logged-in -->/);
  assert.match(output, /copy changed/);
  assert.match(
    output,
    /https:\/\/preview\.example\.vercel\.app\/survey\?login=demo/,
  );
});

test("reports when no user-facing page or component routes are inferred", () => {
  const output = runGenerator({
    PREVIEW_URL: "https://preview.example.vercel.app",
    CHANGED_FILES: JSON.stringify(["apps/optimitron/src/lib/messaging.ts"]),
  });

  assert.match(output, /No user-facing page or component changes were inferred/);
  assert.doesNotMatch(output, /<!-- review-item:/);
});

test("identifies exact and fallback screenshot baselines", () => {
  const exactBase = "a21b72d83b4207cd89481d84a0cff952c6107bc4";
  const staleBase = "6fb97658853ac6114047a7b0642f27be646b1580";
  const sharedEnv = {
    PREVIEW_URL: "https://preview.example.vercel.app",
    CHANGED_FILES: JSON.stringify([]),
    VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA: exactBase,
    VISUAL_REVIEW_BASELINE_RUN_ID: "30252000160",
  };

  const exactOutput = runGenerator({
    ...sharedEnv,
    VISUAL_REVIEW_BASELINE_COMMIT_SHA: exactBase,
  });
  assert.match(
    exactOutput,
    /Screenshot baseline: exact PR base `main@a21b72d83b42` from CI run `30252000160`\./,
  );

  const fallbackOutput = runGenerator({
    ...sharedEnv,
    VISUAL_REVIEW_BASELINE_COMMIT_SHA: staleBase,
  });
  assert.match(
    fallbackOutput,
    /Screenshot baseline fallback: `main@6fb97658853a` from CI run `30252000160`; exact PR base `main@a21b72d83b42` had no usable artifact\./,
  );
});
