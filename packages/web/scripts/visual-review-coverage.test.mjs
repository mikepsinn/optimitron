import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChangedFileDiscoveryArgs,
  buildVisualCoverage,
  getChangedUiFiles,
  isVisualUiSourceFile,
} from "./visual-review-coverage.mjs";

test("discovers deleted UI paths as well as added and modified files", () => {
  assert.deepEqual(buildChangedFileDiscoveryArgs("origin/main"), [
    "diff",
    "--name-only",
    "origin/main",
    "--",
  ]);
  assert.equal(
    isVisualUiSourceFile("packages/web/src/components/deleted-panel.tsx"),
    true,
  );
});

const managerFile =
  "packages/web/src/components/tasks/document-review-manager-panel.tsx";
const reviewerFile =
  "packages/web/src/components/tasks/document-review-reviewer-panel.tsx";

function requiredRoute(name, covers) {
  return {
    activationSelector: `#${name}`,
    covers,
    name,
    required: true,
    requiredProjects: ["default", "visual-mobile"],
  };
}

function capturesFor(...routeNames) {
  return routeNames.flatMap((routeName) => [
    { projectName: "default", routeName },
    { projectName: "visual-mobile", routeName },
  ]);
}

test("classifies rendered JSX throughout src, including app-local and web adapter components", () => {
  assert.equal(
    isVisualUiSourceFile("packages/web/src/app/tasks/[id]/page.tsx"),
    true,
  );
  assert.equal(isVisualUiSourceFile(managerFile), true);
  assert.equal(
    isVisualUiSourceFile(
      "packages/web/src/app/admin/organizations/AdminOrgRow.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "packages/web/src/lib/humanity-manager-promotion.web.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "packages/web/src/lib/humanity-manager-promotion-content.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "packages\\web\\src\\components\\tasks\\task-comment-feed.tsx",
    ),
    true,
  );
});

test("excludes tests, stories, email renderers, and server-only JSX", () => {
  const excluded = [
    "packages/web/src/components/tasks/task-comment-feed.test.tsx",
    "packages/web/src/components/tasks/task-comment-feed.story.tsx",
    "packages/web/src/components/__stories__/task-comment-feed.tsx",
    "packages/web/src/emails/components/EmailFooter.tsx",
    "packages/web/src/lib/humanity-manager-promotion.email.tsx",
    "packages/web/src/lib/tasks/task-assignment-react-email.tsx",
    "packages/web/src/lib/example.server.tsx",
    "packages/web/src/app/api/og/referral/route.tsx",
    "packages/web/src/app/feed/route.tsx",
    "packages/web/src/app/icon.tsx",
    "packages/web/src/app/tasks/[id]/opengraph-image.tsx",
    "packages/web/src/lib/black-white-text-og-image-response.tsx",
  ];
  for (const filePath of excluded) {
    assert.equal(isVisualUiSourceFile(filePath), false, filePath);
  }

  assert.equal(
    isVisualUiSourceFile(
      "packages/web/src/lib/tasks/document-review.server.ts",
    ),
    false,
  );
});

test("keeps stylesheet, public image, and styling config coverage", () => {
  const included = [
    "packages/web/src/app/globals.css",
    "packages/web/public/images/treaty-seal.svg",
    "packages/web/postcss.config.mjs",
    "packages/web/tailwind.config.ts",
  ];
  for (const filePath of included) {
    assert.equal(isVisualUiSourceFile(filePath), true, filePath);
  }
});

test("accepts zero pixel differences when every changed UI file was captured", () => {
  const routes = [
    requiredRoute("document-review-manager", [managerFile]),
    requiredRoute("document-review-reviewer", [reviewerFile]),
    requiredRoute("document-review-stale", [reviewerFile]),
  ];
  const coverage = buildVisualCoverage({
    afterCaptures: capturesFor(
      "document-review-manager",
      "document-review-reviewer",
      "document-review-stale",
    ),
    changedFiles: [managerFile, reviewerFile],
    routes,
  });

  assert.equal(coverage.complete, true);
  assert.deepEqual(coverage.coveredUiFiles, [managerFile, reviewerFile]);
  assert.deepEqual(coverage.blockingIssues, []);
});

test("fails when changed UI source has no registered state", () => {
  const coverage = buildVisualCoverage({
    afterCaptures: [],
    changedFiles: [managerFile],
    routes: [],
  });

  assert.equal(coverage.complete, false);
  assert.deepEqual(coverage.uncoveredUiFiles, [managerFile]);
  assert.match(coverage.blockingIssues[0], /no required visual state/);
});

test("fails when a mapped state is optional or lacks an activation selector", () => {
  const coverage = buildVisualCoverage({
    afterCaptures: capturesFor("document-review-manager"),
    changedFiles: [managerFile],
    routes: [
      {
        covers: [managerFile],
        name: "document-review-manager",
        required: false,
        requiredProjects: ["default", "visual-mobile"],
      },
    ],
  });

  assert.equal(coverage.complete, false);
  assert.deepEqual(coverage.invalidRoutes, [
    {
      reasons: ["route is optional", "activation selector is missing"],
      routeName: "document-review-manager",
    },
  ]);
});

test("fails when one required viewport was not captured", () => {
  const coverage = buildVisualCoverage({
    afterCaptures: [
      { projectName: "default", routeName: "document-review-manager" },
    ],
    changedFiles: [managerFile],
    routes: [requiredRoute("document-review-manager", [managerFile])],
  });

  assert.equal(coverage.complete, false);
  assert.deepEqual(coverage.missingCaptures, [
    {
      projectName: "visual-mobile",
      routeName: "document-review-manager",
    },
  ]);
});

test("fails closed when changed-file analysis is unavailable", () => {
  const coverage = buildVisualCoverage({
    afterCaptures: [],
    changedFiles: null,
    routes: [],
  });
  assert.equal(coverage.analysisAvailable, false);
  assert.equal(coverage.complete, false);
  assert.match(coverage.blockingIssues[0], /analysis is unavailable/);
});

test("keeps backend-only changes outside the visual coverage contract", () => {
  const files = [
    "packages/web/src/lib/tasks/document-review.server.ts",
    "packages/web/src/lib/tasks/document-review.server.test.ts",
  ];
  assert.deepEqual(getChangedUiFiles(files), []);
  assert.equal(
    buildVisualCoverage({ afterCaptures: [], changedFiles: files, routes: [] })
      .complete,
    true,
  );
});

// Deleting a component reports it via `git diff --name-only` exactly like an
// edit, but there is nothing left to screenshot. Before this, removing dead UI
// blocked the pull request with a demand that could never be satisfied.
test("does not demand a visual state for a deleted UI source", () => {
  const deleted = "packages/web/src/components/tasks/blocks/TaskUnlocks.tsx";
  const kept = "packages/web/src/components/tasks/TaskTreeView.tsx";
  const fileExists = (filePath) => filePath !== deleted;

  assert.deepEqual(getChangedUiFiles([deleted, kept], fileExists), [kept]);

  const coverage = buildVisualCoverage({
    afterCaptures: [{ projectName: "default", routeName: "tree" }],
    changedFiles: [deleted, kept],
    fileExists,
    routes: [
      {
        activationSelector: "#task-tree",
        covers: [kept],
        name: "tree",
        required: true,
        requiredProjects: ["default"],
      },
    ],
  });

  assert.equal(coverage.complete, true);
  assert.deepEqual(coverage.uncoveredUiFiles, []);
});
