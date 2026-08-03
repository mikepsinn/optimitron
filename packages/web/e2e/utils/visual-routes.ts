import { getRouteReviewSpecs, ROUTES } from "@/lib/routes";
import {
  MANAGED_DEMO_COLLECTION_ID,
  MANAGED_DEMO_DOCUMENT_ID,
} from "@optimitron/db/constants";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SiteKey } from "@/lib/site";
import {
  filterRedirectOnlyRoutes,
  isRedirectOnlyRoutePath,
} from "@/lib/redirect-review";
import { ALL_PAGE_PATHS, PUBLIC_PAGE_PATHS } from "./static-pages";

export type VisualRoute = {
  authenticated?: boolean;
  /** UI source files whose rendered states this route is required to exercise. */
  covers?: string[];
  createTaskMode?: "person";
  expectSettings?: boolean;
  name: string;
  openCreateTask?: boolean;
  openContentShare?: boolean;
  openAddStep?: boolean;
  openMenu?: boolean;
  openTaskManagement?: boolean;
  path: string;
  required: boolean;
  requiredSelector?: string;
  requiredText?: RegExp;
  /** Capture under a non-default site variant via the review-only query override. */
  siteVariant?: SiteKey;
  waitForImages?: boolean;
};

type DocumentReviewFixtureManifest = {
  activeReviewTaskId: string;
  managerTaskId: string;
  managementClaimTaskId: string;
  managementOwnerTaskId: string;
  staleReviewTaskId: string;
  version: 1;
};

function isDocumentReviewFixtureManifest(
  value: unknown,
): value is DocumentReviewFixtureManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    isNonEmptyString(candidate.managerTaskId) &&
    isNonEmptyString(candidate.managementClaimTaskId) &&
    isNonEmptyString(candidate.managementOwnerTaskId) &&
    isNonEmptyString(candidate.activeReviewTaskId) &&
    isNonEmptyString(candidate.staleReviewTaskId)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const WEB_ROOT = path.resolve(__dirname, "../..");
const DOCUMENT_REVIEW_FIXTURE_MANIFEST_PATH = path.resolve(
  WEB_ROOT,
  "output",
  "playwright",
  "visual-fixtures",
  "document-review.json",
);
const TASK_DETAIL_PAGE_FILE = "packages/web/src/app/tasks/[id]/page.tsx";
const DOCUMENT_REVIEW_MANAGER_FILE =
  "packages/web/src/components/tasks/document-review-manager-panel.tsx";
const DOCUMENT_REVIEW_REVIEWER_FILE =
  "packages/web/src/components/tasks/document-review-reviewer-panel.tsx";
const TASK_COMMENT_FEED_FILE =
  "packages/web/src/components/tasks/task-comment-feed.tsx";
const TASK_COMPLETE_FORM_FILE =
  "packages/web/src/components/tasks/TaskCompleteForm.tsx";
const TASK_DELETE_BUTTON_FILE =
  "packages/web/src/components/tasks/TaskDeleteButton.tsx";
const TASK_MANAGEMENT_CONTROLS_FILE =
  "packages/web/src/components/tasks/TaskManagementControls.tsx";
const CREATE_TASK_DIALOG_FILE =
  "packages/web/src/components/tasks/CreateTaskDialog.tsx";
const POLITICIAN_SCORECARD_TABLE_FILE =
  "packages/web/src/components/shared/PoliticianScorecardTable.tsx";
const OPTIMITRON_GAME_LANDING_FILES = [
  "packages/web/src/app/page.tsx",
  "packages/web/src/components/animations/CollapseCountdownTimer.tsx",
  "packages/web/src/components/animations/LiveDeathTicker.tsx",
  "packages/web/src/components/animations/ScrollReveal.tsx",
  "packages/web/src/components/dfda/OutcomeLabel.tsx",
  "packages/web/src/components/landing/DecisionMatrixSection.tsx",
  "packages/web/src/components/landing/HeroSection.tsx",
  "packages/web/src/components/landing/InvisibleGraveyardSection.tsx",
  "packages/web/src/components/landing/TreatyVoteFlow.tsx",
  "packages/web/src/components/landing/TreatyVoteSection.tsx",
  "packages/web/src/components/landing/WishocracyPreview.tsx",
  POLITICIAN_SCORECARD_TABLE_FILE,
  "packages/web/src/components/site/EarthOptimizationGameLandingPage.tsx",
  "packages/web/src/components/tasks/TasksRootIntro.tsx",
];

const VISUAL_COVERS_BY_PATH = new Map<string, string[]>([
  [
    ROUTES.eos,
    [
      "packages/web/src/components/eos-retro/AgencyBooths.tsx",
      "packages/web/src/components/eos-retro/DfdaOutcomeLabel.tsx",
      "packages/web/src/components/eos-retro/EosRetroLandingPage.tsx",
      "packages/web/src/components/eos-retro/MachineDiagram.tsx",
    ],
  ],
  [ROUTES.game, ["packages/web/src/app/game/page.tsx"]],
  [ROUTES.scoreboard, [POLITICIAN_SCORECARD_TABLE_FILE]],
  [ROUTES.services, ["packages/web/src/app/services/page.tsx"]],
]);

const PRESIDENT_TASK_LIST_SELECTOR =
  '[data-visual-section="president-task-list"]';

const REQUIRED_SELECTOR_BY_PATH = new Map<string, string>([
  [ROUTES.employees, PRESIDENT_TASK_LIST_SELECTOR],
  [ROUTES.game, "#vote"],
  [ROUTES.scoreboard, 'input[placeholder="Search name or state..."]'],
  [ROUTES.services, "h1"],
]);

const IMAGE_STABLE_ROUTE_PATHS = new Set<string>([ROUTES.employees]);

const REQUIRED_TEXT_BY_PATH = new Map<string, RegExp>([
  [ROUTES.court, /IN WITNESS WHEREOF/],
]);

// The calendar server-renders the requested date, and freezeClock only
// reaches the browser — so an unpinned capture drifts every calendar day
// (baseline "Friday, Jul 17" vs PR "Saturday, Jul 18" flagged 0.32%).
// Past dates clamp to today (calendar/page.tsx), so pin far-future; the
// fixed date also takes the deterministic dayStart planning branch.
const VISUAL_PATH_OVERRIDE_BY_PATH = new Map<string, string>([
  [ROUTES.calendar, `${ROUTES.calendar}?date=2036-01-01`],
]);

const SPECIAL_STATE_ROUTES: VisualRoute[] = [
  {
    name: "side-menu",
    path: ROUTES.home,
    required: true,
    openMenu: true,
  },
  {
    name: "side-menu-auth",
    path: ROUTES.home,
    required: true,
    authenticated: true,
    openMenu: true,
    expectSettings: true,
  },
  {
    name: "create-task-dialog-person",
    path: ROUTES.home,
    required: true,
    authenticated: true,
    openCreateTask: true,
    createTaskMode: "person",
    requiredText: /New person/,
  },
];

const SEEDED_DYNAMIC_ROUTES: VisualRoute[] = [
  {
    name: "document-detail",
    path: `/documents/${MANAGED_DEMO_DOCUMENT_ID}`,
    required: true,
    authenticated: true,
    requiredText: /^Current decision$/,
  },
  {
    name: "collection-detail",
    path: `/collections/${MANAGED_DEMO_COLLECTION_ID}`,
    required: true,
    authenticated: true,
    requiredText: /^Finish the Vaultanium Systems proposal$/,
  },
  {
    name: "collection-share",
    path: `/collections/${MANAGED_DEMO_COLLECTION_ID}`,
    required: true,
    authenticated: true,
    openContentShare: true,
    requiredText: /^Only you can access this item\.$/,
  },
  {
    name: "content-search",
    path: "/search?q=Vaultanium",
    required: true,
    authenticated: true,
    requiredText: /^Finish the Vaultanium Systems proposal$/,
  },
  {
    name: "referendum-one-percent-treaty",
    path: "/agencies/dcongress/referendums/one-percent-treaty",
    required: false,
  },
  {
    name: "organization-iam-public",
    path: "/organizations/institute-for-accelerated-medicine",
    required: false,
  },
  {
    name: "organization-iam-survey",
    path: "/survey/institute-for-accelerated-medicine",
    required: false,
  },
  { name: "people-mike", path: "/people/mike", required: false },
  {
    name: "people-demo-owner",
    path: "/people/demo",
    required: false,
    authenticated: true,
    requiredText: /work to end war and disease/i,
  },
  {
    name: "people-demo-assign-dialog",
    path: "/people/demo?assignTask=1",
    required: false,
    authenticated: true,
    requiredText: /Who should do it\?/,
  },
  {
    name: "people-missions",
    path: "/people?missions=1",
    required: false,
    authenticated: true,
    requiredText: /Mission people/,
  },
  {
    name: "people-missions-romantic",
    path: "/people?missions=1&intent=DATES",
    required: false,
    authenticated: true,
    requiredText: /Could be romantic/,
  },
  {
    name: "task-optimize-earth",
    path: "/tasks/optimize-earth",
    required: false,
  },
  {
    name: "task-one-percent-treaty",
    path: "/tasks/1-pct-treaty",
    required: false,
  },
  {
    name: "task-signer-canada",
    path: "/tasks/1-pct-treaty-signer-ca",
    required: false,
  },
  ...loadDocumentReviewRoutes(),
];

const PUBLIC_SCREENSHOT_ROUTES: VisualRoute[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("screenshot"),
)
  .filter(({ path }) => PUBLIC_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    covers: VISUAL_COVERS_BY_PATH.get(path),
    name,
    path: VISUAL_PATH_OVERRIDE_BY_PATH.get(path) ?? path,
    required: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
  }));

const AUTHENTICATED_SCREENSHOT_ROUTES: VisualRoute[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("authenticatedScreenshot"),
)
  .filter(({ path }) => ALL_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    name: publicRouteHasScreenshot(path) ? `${name}-auth` : name,
    path: VISUAL_PATH_OVERRIDE_BY_PATH.get(path) ?? path,
    required: true,
    authenticated: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
  }));

// Cover each variant's home and one real owned route without multiplying the
// review matrix. Disallowed routes redirect to production, so exclude them.
const VARIANT_DELTA_ROUTES: VisualRoute[] = [
  {
    covers: OPTIMITRON_GAME_LANDING_FILES,
    name: "variant-optimitron-home",
    path: ROUTES.home,
    required: true,
    requiredSelector: "#vote",
    siteVariant: "optimitron",
  },
  {
    name: "variant-optimitron-tasks",
    path: ROUTES.tasks,
    required: true,
    siteVariant: "optimitron",
  },
  {
    name: "variant-dfda-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dfda",
  },
  {
    name: "variant-dfda-conditions",
    path: ROUTES.conditions,
    required: true,
    siteVariant: "dfda",
  },
  {
    name: "variant-dih-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dih",
  },
  {
    name: "variant-dih-fund-a-disease",
    path: ROUTES.dih,
    required: true,
    siteVariant: "dih",
  },
];

export const VISUAL_ROUTES: VisualRoute[] = dedupeRoutes([
  ...PUBLIC_SCREENSHOT_ROUTES,
  ...AUTHENTICATED_SCREENSHOT_ROUTES,
  ...SPECIAL_STATE_ROUTES,
  ...SEEDED_DYNAMIC_ROUTES,
  ...VARIANT_DELTA_ROUTES,
]);

function publicRouteHasScreenshot(path: string): boolean {
  return (
    !isRedirectOnlyRoutePath(path) &&
    getRouteReviewSpecs("screenshot").some((spec) => spec.path === path)
  );
}

function dedupeRoutes(routes: VisualRoute[]): VisualRoute[] {
  const seen = new Set<string>();
  const deduped: VisualRoute[] = [];
  for (const route of routes) {
    if (seen.has(route.name)) {
      throw new Error(`Duplicate visual route name: ${route.name}`);
    }
    seen.add(route.name);
    deduped.push(route);
  }
  return deduped;
}

function loadDocumentReviewRoutes(): VisualRoute[] {
  if (process.env.ROUTE_VISUAL_REVIEW !== "1") {
    return [];
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(
      readFileSync(DOCUMENT_REVIEW_FIXTURE_MANIFEST_PATH, "utf8"),
    );
  } catch (error) {
    throw new Error(
      `Document-review visual fixture manifest is missing at ${DOCUMENT_REVIEW_FIXTURE_MANIFEST_PATH}. The visual fixture seeder must run before Playwright.`,
      { cause: error },
    );
  }

  if (!isDocumentReviewFixtureManifest(manifest)) {
    throw new Error(
      `Document-review visual fixture manifest is invalid at ${DOCUMENT_REVIEW_FIXTURE_MANIFEST_PATH}.`,
    );
  }

  return [
    {
      authenticated: true,
      covers: [
        TASK_DETAIL_PAGE_FILE,
        TASK_MANAGEMENT_CONTROLS_FILE,
        TASK_COMPLETE_FORM_FILE,
        TASK_DELETE_BUTTON_FILE,
      ],
      name: "task-management-owner",
      openTaskManagement: true,
      path: `/tasks/${manifest.managementOwnerTaskId}`,
      required: true,
      requiredSelector: "[data-task-management][open]",
    },
    {
      authenticated: true,
      covers: [
        TASK_DETAIL_PAGE_FILE,
        TASK_COMPLETE_FORM_FILE,
        TASK_DELETE_BUTTON_FILE,
      ],
      name: "task-management-claimant-admin",
      path: `/tasks/${manifest.managementClaimTaskId}`,
      required: true,
      requiredSelector: "#complete",
      requiredText: /^Release Task$/,
    },
    {
      authenticated: true,
      covers: [CREATE_TASK_DIALOG_FILE, TASK_MANAGEMENT_CONTROLS_FILE],
      name: "task-management-add-step",
      openAddStep: true,
      path: `/tasks/${manifest.managementOwnerTaskId}`,
      required: true,
      requiredSelector: '[role="dialog"]',
    },
    {
      authenticated: true,
      covers: [
        TASK_DETAIL_PAGE_FILE,
        DOCUMENT_REVIEW_MANAGER_FILE,
        TASK_COMMENT_FEED_FILE,
      ],
      name: "document-review-manager",
      path: `/tasks/${manifest.managerTaskId}`,
      required: true,
      requiredSelector: "#document-review-manager-heading",
    },
    {
      authenticated: true,
      covers: [
        TASK_DETAIL_PAGE_FILE,
        DOCUMENT_REVIEW_REVIEWER_FILE,
        TASK_COMMENT_FEED_FILE,
      ],
      name: "document-review-reviewer",
      path: `/tasks/${manifest.activeReviewTaskId}`,
      required: true,
      requiredSelector:
        '[data-document-review-state="active"] #document-review-heading',
      requiredText: /^Review this version$/,
    },
    {
      authenticated: true,
      covers: [TASK_DETAIL_PAGE_FILE, DOCUMENT_REVIEW_REVIEWER_FILE],
      name: "document-review-stale",
      path: `/tasks/${manifest.staleReviewTaskId}`,
      required: true,
      requiredSelector:
        '[data-document-review-state="stale"] #document-review-heading',
      requiredText: /^Past review$/,
    },
  ];
}
