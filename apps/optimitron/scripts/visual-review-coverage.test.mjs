import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChangedFileDiscoveryArgs,
  buildVisualCoverage,
  getChangedUiFiles,
  isVisualUiSourceFile,
  parseChangedFileDiscoveryOutput,
} from "./visual-review-coverage.mjs";

test("discovers rename-aware changed-file records", () => {
  assert.deepEqual(buildChangedFileDiscoveryArgs("origin/main"), [
    "-c",
    "diff.renameLimit=999999",
    "diff",
    "--name-status",
    "--find-renames=100%",
    "-z",
    "origin/main",
    "--",
  ]);
  assert.deepEqual(
    parseChangedFileDiscoveryOutput(
      [
        "M",
        "apps/optimitron/src/components/changed.tsx",
        "R100",
        "packages/web/src/components/moved.tsx",
        "apps/optimitron/src/components/moved.tsx",
        "R097",
        "packages/web/src/components/renamed-and-changed.tsx",
        "apps/optimitron/src/components/renamed-and-changed.tsx",
        "D",
        "apps/optimitron/src/components/deleted.tsx",
        "",
      ].join("\0"),
    ),
    [
      "apps/optimitron/src/components/changed.tsx",
      "apps/optimitron/src/components/renamed-and-changed.tsx",
      "apps/optimitron/src/components/deleted.tsx",
    ],
  );
  assert.equal(
    isVisualUiSourceFile("apps/optimitron/src/components/deleted-panel.tsx"),
    true,
  );
});

const managerFile =
  "apps/optimitron/src/components/tasks/document-review-manager-panel.tsx";
const reviewerFile =
  "apps/optimitron/src/components/tasks/document-review-reviewer-panel.tsx";

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
    isVisualUiSourceFile("apps/optimitron/src/app/tasks/[id]/page.tsx"),
    true,
  );
  assert.equal(isVisualUiSourceFile(managerFile), true);
  assert.equal(
    isVisualUiSourceFile(
      "apps/optimitron/src/app/admin/organizations/AdminOrgRow.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "apps/optimitron/src/lib/humanity-manager-promotion.web.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "apps/optimitron/src/lib/humanity-manager-promotion-content.tsx",
    ),
    true,
  );
  assert.equal(
    isVisualUiSourceFile(
      "apps\\optimitron\\src\\components\\tasks\\task-comment-feed.tsx",
    ),
    true,
  );
});

test("excludes tests, stories, email renderers, and server-only JSX", () => {
  const excluded = [
    "apps/optimitron/src/components/tasks/task-comment-feed.test.tsx",
    "apps/optimitron/src/components/tasks/task-comment-feed.story.tsx",
    "apps/optimitron/src/components/__stories__/task-comment-feed.tsx",
    "apps/optimitron/src/emails/components/EmailFooter.tsx",
    "apps/optimitron/src/lib/humanity-manager-promotion.email.tsx",
    "apps/optimitron/src/lib/tasks/task-assignment-react-email.tsx",
    "apps/optimitron/src/lib/example.server.tsx",
    "apps/optimitron/src/app/api/og/referral/route.tsx",
    "apps/optimitron/src/app/feed/route.tsx",
    "apps/optimitron/src/app/icon.tsx",
    "apps/optimitron/src/app/tasks/[id]/opengraph-image.tsx",
    "apps/optimitron/src/lib/black-white-text-og-image-response.tsx",
  ];
  for (const filePath of excluded) {
    assert.equal(isVisualUiSourceFile(filePath), false, filePath);
  }

  assert.equal(
    isVisualUiSourceFile(
      "apps/optimitron/src/lib/tasks/document-review.server.ts",
    ),
    false,
  );
});

test("classifies site-app UI sources with their server-only exclusions", () => {
  const included = [
    "apps/warondisease/app/vote/page.tsx",
    "apps/warondisease/app/layout.tsx",
    "apps/warondisease/components/sharing/campaign-qr-code.tsx",
    "apps/dfda/app/conditions/[conditionSlug]/page.tsx",
    "apps/warondisease/app/globals.css",
    "apps/acceleratedmedicine/public/images/hero.png",
  ];
  for (const filePath of included) {
    assert.equal(isVisualUiSourceFile(filePath), true, filePath);
  }

  const excluded = [
    "apps/warondisease/app/api/og/route.tsx",
    "apps/warondisease/emails/referral-invitation.tsx",
    "apps/warondisease/app/opengraph-image.tsx",
    "apps/warondisease/app/not-found.tsx",
    "apps/warondisease/app/global-error.tsx",
    "apps/warondisease/app/soldiers/loading.tsx",
    "apps/warondisease/lib/treaty-votes.server.ts",
    "apps/warondisease/components/shared/ParameterValue.test.tsx",
    // Only apps enrolled in the site-app capture matrix are gated.
    "apps/courtofhumanity/app/page.tsx",
  ];
  for (const filePath of excluded) {
    assert.equal(isVisualUiSourceFile(filePath), false, filePath);
  }
});

test("keeps stylesheet, public image, and styling config coverage", () => {
  const included = [
    "apps/optimitron/src/app/globals.css",
    "apps/optimitron/public/images/treaty-seal.svg",
    "apps/optimitron/postcss.config.mjs",
    "apps/optimitron/tailwind.config.ts",
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

test("covers shared site UI when a site-app route registers the source file", () => {
  const sharedFile = "packages/site-kit/src/components/campaign-plan-page.tsx";
  const routeName = "site-app-warondisease-the-plan";
  const coverage = buildVisualCoverage({
    afterCaptures: capturesFor(routeName),
    changedFiles: [sharedFile],
    routes: [requiredRoute(routeName, [sharedFile])],
  });

  assert.equal(isVisualUiSourceFile(sharedFile), false);
  assert.equal(coverage.complete, true);
  assert.deepEqual(coverage.coveredUiFiles, [sharedFile]);
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
    "apps/optimitron/src/lib/tasks/document-review.server.ts",
    "apps/optimitron/src/lib/tasks/document-review.server.test.ts",
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
  const deleted = "apps/optimitron/src/components/tasks/blocks/TaskUnlocks.tsx";
  const kept = "apps/optimitron/src/components/tasks/TaskTreeView.tsx";
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
