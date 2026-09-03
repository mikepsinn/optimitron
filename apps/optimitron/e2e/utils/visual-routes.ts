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
  appId: VisualAppId;
  appLabel: string;
  authenticated?: boolean;
  authenticatedEmail?: string;
  captureKind: VisualCaptureKind;
  /** UI source files whose rendered states this route is required to exercise. */
  covers?: string[];
  createTaskMode?: "person";
  expectSettings?: boolean;
  name: string;
  openCreateTask?: boolean;
  openContentShare?: boolean;
  openAddSubtask?: boolean;
  openTaskImpactTrace?: boolean;
  verifyMcpDisabledAuthorize?: boolean;
  mcpScopeAccess?: "admin" | "non-admin";
  openMenu?: boolean;
  openTaskManagement?: boolean;
  submitSearch?: boolean;
  typeSearchQuery?: string;
  path: string;
  required: boolean;
  requiredSelector?: string;
  requiredText?: RegExp;
  /** Capture under a non-default site variant via the review-only query override. */
  siteVariant?: SiteKey;
  waitForImages?: boolean;
};

export type VisualAppId =
  | "acceleratedmedicine"
  | "curedao"
  | "dfda"
  | "dih"
  | "optimitron"
  | "trialabundancesurvey"
  | "warondisease"
  | "wishocracy";

export type VisualCaptureKind = "app" | "legacy-host";

type VisualRouteOwnership = Pick<
  VisualRoute,
  "appId" | "appLabel" | "captureKind"
> & { siteVariant: SiteKey };

type VisualRouteSpec = Omit<
  VisualRoute,
  "appId" | "appLabel" | "captureKind"
> &
  Partial<Pick<VisualRoute, "appId" | "appLabel" | "captureKind">>;

const VISUAL_APP_LABELS: Record<VisualAppId, string> = {
  acceleratedmedicine: "Accelerated Medicine",
  curedao: "CureDAO",
  dfda: "dFDA",
  dih: "DIH",
  optimitron: "Optimitron",
  trialabundancesurvey: "Trial Abundance Survey",
  warondisease: "War on Disease",
  wishocracy: "Wishocracy",
};

const WAR_ON_DISEASE_ROUTE_PREFIXES = [
  ROUTES.treaty,
  ROUTES.vote,
  ROUTES.questions,
  "/r",
  ROUTES.declaration,
  ROUTES.joke,
  ROUTES.shirt,
  ROUTES.poster,
  ROUTES.doorToDoor,
  ROUTES.love,
  ROUTES.missions,
  ROUTES.fixAi,
  ROUTES.foundations,
  ROUTES.plaintiffs,
  ROUTES.court,
  ROUTES.humanityVGovernment,
  ROUTES.join,
  ROUTES.signatories,
  ROUTES.organizations,
  ROUTES.feedback,
  ROUTES.employees,
] as const;

export function getVisualRouteOwnership(
  pathname: string,
): VisualRouteOwnership {
  const path = pathname.split(/[?#]/u, 1)[0];
  const isWarOnDiseaseRoute = WAR_ON_DISEASE_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  const appId: VisualAppId = isWarOnDiseaseRoute
    ? "warondisease"
    : "optimitron";

  return {
    appId,
    appLabel: VISUAL_APP_LABELS[appId],
    captureKind: isWarOnDiseaseRoute ? "legacy-host" : "app",
    siteVariant: isWarOnDiseaseRoute ? "warOnDisease" : "optimitron",
  };
}

type DocumentReviewFixtureManifest = {
  activeReviewTaskId: string;
  managerTaskId: string;
  managementClaimTaskId: string;
  managementOwnerTaskId: string;
  staleReviewTaskId: string;
  version: 1;
};

type McpAuthorizeFixtureManifest = {
  authorizePath: string;
  nonAdminAuthorizePath: string;
  nonAdminEmail: string;
  version: 2;
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

function isMcpAuthorizeFixtureManifest(
  value: unknown,
): value is McpAuthorizeFixtureManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 2 &&
    isNonEmptyString(candidate.authorizePath) &&
    isNonEmptyString(candidate.nonAdminAuthorizePath) &&
    isNonEmptyString(candidate.nonAdminEmail)
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
const MCP_AUTHORIZE_FIXTURE_MANIFEST_PATH = path.resolve(
  WEB_ROOT,
  "output",
  "playwright",
  "visual-fixtures",
  "mcp-authorize.json",
);
const MCP_AUTHORIZE_PAGE_FILE = "apps/optimitron/src/app/mcp/authorize/page.tsx";
const MCP_CONSENT_FORM_FILE =
  "apps/optimitron/src/app/mcp/authorize/consent-form.tsx";
const RETRO_UI_BUTTON_FILE = "apps/optimitron/src/components/retroui/Button.tsx";
const TASK_DETAIL_PAGE_FILE = "apps/optimitron/src/app/tasks/[id]/page.tsx";
const DOCUMENT_REVIEW_MANAGER_FILE =
  "apps/optimitron/src/components/tasks/document-review-manager-panel.tsx";
const DOCUMENT_REVIEW_REVIEWER_FILE =
  "apps/optimitron/src/components/tasks/document-review-reviewer-panel.tsx";
const TASK_COMMENT_FEED_FILE =
  "apps/optimitron/src/components/tasks/task-comment-feed.tsx";
const TASK_COMPLETE_FORM_FILE =
  "apps/optimitron/src/components/tasks/TaskCompleteForm.tsx";
const TASK_DELETE_BUTTON_FILE =
  "apps/optimitron/src/components/tasks/TaskDeleteButton.tsx";
const TASK_MANAGEMENT_CONTROLS_FILE =
  "apps/optimitron/src/components/tasks/TaskManagementControls.tsx";
const CREATE_TASK_DIALOG_FILE =
  "apps/optimitron/src/components/tasks/CreateTaskDialog.tsx";
const TASK_DEPENDENCIES_SECTION_FILE =
  "apps/optimitron/src/components/tasks/TaskDependenciesSection.tsx";
const TASK_TREE_VIEW_FILE =
  "apps/optimitron/src/components/tasks/TaskTreeView.tsx";
const TASK_LIST_CONTROLS_FILE =
  "apps/optimitron/src/components/tasks/task-list-controls.tsx";
const TASK_IMPACT_TRACE_DISCLOSURE_FILE =
  "apps/optimitron/src/components/tasks/task-impact-trace-disclosure.tsx";
const OBG_CATEGORY_PAGE_FILE = "apps/optimitron/src/app/obg/[slug]/page.tsx";
const HEALTH_ECONOMICS_DISPLAY_FILE =
  "apps/optimitron/src/components/treatment/HealthEconomicsDisplay.tsx";
const PERSONAL_QUEUE_SECTION_FILE =
  "apps/optimitron/src/components/dashboard/PersonalQueueSection.tsx";
const SEARCH_PAGE_FILE = "apps/optimitron/src/app/search/page.tsx";
const SEARCH_DISCOVERY_FILE =
  "apps/optimitron/src/app/search/search-discovery.tsx";
const STANDALONE_VIDEO_PAGE_FILE = "apps/optimitron/src/app/video/page.tsx";
const DEMO_PLAYER_FILE =
  "apps/optimitron/src/components/demo/DemoPlayer.tsx";
const CAMPAIGN_VOTE_AND_SHARE_SLIDE_FILE =
  "apps/optimitron/src/components/demo/slides/sierra/slide-vote-and-share.tsx";
const GLOBAL_FAILED_STATE_SLIDE_FILE =
  "apps/optimitron/src/components/demo/slides/sierra/slide-global-failed-state.tsx";
const POLITICIAN_SCORECARD_TABLE_FILE =
  "apps/optimitron/src/components/shared/PoliticianScorecardTable.tsx";
// Sections rendered by both optimitron.com/ and /game. Either capture proves
// they render, so both cover lists include them.
const SHARED_LANDING_SECTION_FILES = [
  "apps/optimitron/src/components/animations/CollapseCountdownTimer.tsx",
  "apps/optimitron/src/components/animations/LiveDeathTicker.tsx",
  "apps/optimitron/src/components/animations/ScrollReveal.tsx",
  "apps/optimitron/src/components/dfda/ComparativeEffectivenessSection.tsx",
  "apps/optimitron/src/components/dfda/OutcomeLabel.tsx",
  "apps/optimitron/src/components/dfda/OutcomeLabelsSection.tsx",
  "apps/optimitron/src/components/landing/GovernmentReportCardPreview.tsx",
  "apps/optimitron/src/components/landing/HeroSection.tsx",
  "apps/optimitron/src/components/landing/OptimalPolicyPreview.tsx",
  "apps/optimitron/src/components/landing/OptimizedGovernanceSection.tsx",
  "apps/optimitron/src/components/landing/PleaseSelectAnEarthSection.tsx",
  "apps/optimitron/src/components/landing/TreatyVoteFlow.tsx",
  "apps/optimitron/src/components/landing/TreatyVoteSection.tsx",
  "apps/optimitron/src/components/landing/WhyPlaySection.tsx",
  "apps/optimitron/src/components/landing/WishocracyPreview.tsx",
];

// optimitron.com/ renders OptimitronLandingPage, not the game page.
const OPTIMITRON_HOME_FILES = [
  "apps/optimitron/src/app/page.tsx",
  "apps/optimitron/src/components/landing/EarthOptimizationTaskSystemSection.tsx",
  "apps/optimitron/src/components/landing/LovingTakeoverSection.tsx",
  "apps/optimitron/src/components/landing/TheBillSection.tsx",
  "apps/optimitron/src/components/invest/GiantNumber.tsx",
  "apps/optimitron/src/components/invest/WarheadGrid.tsx",
  "apps/optimitron/src/components/site/OptimitronLandingPage.tsx",
  ...SHARED_LANDING_SECTION_FILES,
];

// /game keeps the original game ordering and its game-only sections.
const OPTIMITRON_GAME_LANDING_FILES = [
  "apps/optimitron/src/app/game/page.tsx",
  "apps/optimitron/src/components/landing/ArmorySection.tsx",
  "apps/optimitron/src/components/landing/DecisionMatrixSection.tsx",
  "apps/optimitron/src/components/landing/DemoVideoSection.tsx",
  "apps/optimitron/src/components/landing/FinalCTASection.tsx",
  "apps/optimitron/src/components/landing/HowToWinSection.tsx",
  "apps/optimitron/src/components/landing/InvisibleGraveyardSection.tsx",
  "apps/optimitron/src/components/landing/TLDRSection.tsx",
  POLITICIAN_SCORECARD_TABLE_FILE,
  "apps/optimitron/src/components/site/EarthOptimizationGameLandingPage.tsx",
  "apps/optimitron/src/components/tasks/TasksRootIntro.tsx",
  ...SHARED_LANDING_SECTION_FILES,
];

// /invest renders EosInvestLandingPage, the only page with the scroll-driven
// investor sections. StepReveal ships nowhere else, so without this list a
// change to it has no registered visual state.
const INVEST_LANDING_FILES = [
  "apps/optimitron/src/app/invest/page.tsx",
  "apps/optimitron/src/components/animations/ScrollReveal.tsx",
  "apps/optimitron/src/components/animations/StepReveal.tsx",
  "apps/optimitron/src/components/invest/EosInvestLandingPage.tsx",
  "apps/optimitron/src/components/invest/GiantNumber.tsx",
  "apps/optimitron/src/components/invest/OptimitronLoop.tsx",
  "apps/optimitron/src/components/invest/ProgressSpine.tsx",
  "apps/optimitron/src/components/invest/ShareClassCards.tsx",
  "apps/optimitron/src/components/invest/StickyRiskSteps.tsx",
  "apps/optimitron/src/components/invest/WarheadGrid.tsx",
  "apps/optimitron/src/components/landing/TreatyVoteFlow.tsx",
];

// /prize is the only place CitizenDashboard mounts. Without this list a
// one-line sign-in fix still fails visual-review incomplete coverage.
const PRIZE_PAGE_FILES = [
  "apps/optimitron/src/app/prize/page.tsx",
  "apps/optimitron/src/components/prize/CitizenDashboard.tsx",
  "apps/optimitron/src/components/prize/CitizenDashboardWrapper.tsx",
  "apps/optimitron/src/components/prize/ShareTemplatesCard.tsx",
  "apps/optimitron/src/components/prize/TwoOutcomes.tsx",
  "apps/optimitron/src/components/prize/VoterPrizeTreasuryDeposit.tsx",
];

const VISUAL_COVERS_BY_PATH = new Map<string, string[]>([
  [
    ROUTES.eos,
    [
      "apps/optimitron/src/components/eos-retro/AgencyBooths.tsx",
      "apps/optimitron/src/components/eos-retro/OptimizedPublicAdministration.tsx",
      "apps/optimitron/src/components/eos-retro/DfdaOutcomeLabel.tsx",
      "apps/optimitron/src/components/eos-retro/eos-retro.css",
      "apps/optimitron/src/components/eos-retro/EosRetroLandingPage.tsx",
      "apps/optimitron/src/components/eos-retro/MachineDiagram.tsx",
    ],
  ],
  [
    ROUTES.fixAi,
    [
      "apps/optimitron/src/app/fix-ai/content.ts",
      "apps/optimitron/src/app/fix-ai/corpus.server.ts",
      "apps/optimitron/src/app/fix-ai/page.tsx",
    ],
  ],
  [ROUTES.game, OPTIMITRON_GAME_LANDING_FILES],
  [
    ROUTES.methodology,
    [
      "packages/data/src/parameters/expected-value-methodology.ts",
      "apps/optimitron/src/app/methodology/page.tsx",
    ],
  ],
  [
    ROUTES.poster,
    [
      "apps/optimitron/src/app/poster/page.tsx",
      "apps/optimitron/src/app/poster/poster-client.tsx",
    ],
  ],
  [ROUTES.invest, INVEST_LANDING_FILES],
  [ROUTES.prize, PRIZE_PAGE_FILES],
  [ROUTES.profile, ["apps/optimitron/src/components/Providers.tsx"]],
  [ROUTES.scoreboard, [POLITICIAN_SCORECARD_TABLE_FILE]],
  [ROUTES.services, ["apps/optimitron/src/app/services/page.tsx"]],
  [
    ROUTES.tasksTree,
    [
      TASK_TREE_VIEW_FILE,
      "packages/db/src/managed-data/optimize-earth-task-tree.ts",
      "apps/optimitron/src/app/tasks/tree/page.tsx",
    ],
  ],
]);

const PRESIDENT_TASK_LIST_SELECTOR =
  '[data-visual-section="president-task-list"]';

const REQUIRED_SELECTOR_BY_PATH = new Map<string, string>([
  [ROUTES.employees, PRESIDENT_TASK_LIST_SELECTOR],
  [ROUTES.eos, "h1"],
  [ROUTES.fixAi, "#next-hour"],
  [ROUTES.game, "#vote"],
  [ROUTES.methodology, "#methodology"],
  [ROUTES.poster, '[data-visual-action="copy-flyer-route-prompt"]'],
  // Last section of the page: proves the capture rendered the whole pitch,
  // not just the hero.
  [ROUTES.invest, "#claim"],
  // Citizen dashboard section (sign-in card when logged out).
  [ROUTES.prize, "#dashboard"],
  [ROUTES.profile, '[data-visual-auth-state="authenticated"]'],
  [ROUTES.scoreboard, 'input[placeholder="Search name or state..."]'],
  [ROUTES.services, "h1"],
  [ROUTES.tasksTree, "#task-tree"],
]);

const IMAGE_STABLE_ROUTE_PATHS = new Set<string>([
  ROUTES.employees,
  ROUTES.profile,
]);

const REQUIRED_TEXT_BY_PATH = new Map<string, RegExp>([
  [ROUTES.court, /IN WITNESS WHEREOF/],
  [ROUTES.methodology, /Task scenario: probability-weighted expected value/],
]);

// The calendar server-renders the requested date, and freezeClock only
// reaches the browser — so an unpinned capture drifts every calendar day
// (baseline "Friday, Jul 17" vs PR "Saturday, Jul 18" flagged 0.32%).
// Past dates clamp to today (calendar/page.tsx), so pin far-future; the
// fixed date also takes the deterministic dayStart planning branch.
const VISUAL_PATH_OVERRIDE_BY_PATH = new Map<string, string>([
  [ROUTES.calendar, `${ROUTES.calendar}?date=2036-01-01`],
]);

const SPECIAL_STATE_ROUTES: VisualRouteSpec[] = [
  {
    covers: [SEARCH_PAGE_FILE, SEARCH_DISCOVERY_FILE],
    name: "search-empty",
    path: ROUTES.search,
    required: true,
    requiredSelector: '[data-search-popular] a[href="/tasks"]',
    requiredText: /Popular pages/i,
    siteVariant: "optimitron",
  },
  {
    covers: [SEARCH_DISCOVERY_FILE],
    name: "search-typeahead",
    path: ROUTES.search,
    required: true,
    requiredSelector: '[data-search-suggestions] a[href="/vote"]',
    siteVariant: "optimitron",
    typeSearchQuery: "vote",
  },
  {
    covers: [SEARCH_DISCOVERY_FILE],
    name: "search-loading",
    path: ROUTES.search,
    required: true,
    requiredSelector: 'form[aria-busy="true"] button:disabled',
    requiredText: /^Searching…$/i,
    siteVariant: "optimitron",
    submitSearch: true,
    typeSearchQuery: "vote",
  },
  {
    covers: [SEARCH_PAGE_FILE],
    name: "search-results",
    path: `${ROUTES.search}?q=vote`,
    required: true,
    requiredSelector: 'a[href="/vote"]',
    siteVariant: "optimitron",
  },
  {
    covers: [STANDALONE_VIDEO_PAGE_FILE],
    name: "campaign-video",
    path: ROUTES.video,
    required: true,
    requiredSelector:
      'video[src*="optimitron-game-campaign-cut-2026-08-09.mp4"]',
  },
  {
    covers: [DEMO_PLAYER_FILE, CAMPAIGN_VOTE_AND_SHARE_SLIDE_FILE],
    name: "campaign-vote-and-share-slide",
    path: `${ROUTES.demo}?playlist=campaign-cut#campaign-vote-and-share`,
    required: true,
    requiredSelector: '[data-testid="slide-vote-and-share"]',
  },
  {
    covers: [DEMO_PLAYER_FILE, GLOBAL_FAILED_STATE_SLIDE_FILE],
    name: "global-failed-state-slide",
    path: `${ROUTES.demo}?playlist=hackathon#global-failed-state`,
    required: true,
    requiredSelector: '[data-testid="slide-global-failed-state"]',
    requiredText: /^INFRASTRUCTURE COLLAPSE$/,
  },
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

const SEEDED_DYNAMIC_ROUTES: VisualRouteSpec[] = [
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
    requiredText: /^Review the demo health proposal$/,
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
    path: "/search?q=demo%20health",
    required: true,
    authenticated: true,
    requiredText: /^Review the demo health proposal$/,
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
    covers: [OBG_CATEGORY_PAGE_FILE],
    name: "obg-category-detail",
    path: "/obg/epa-environment",
    required: true,
    requiredSelector: "h1",
    requiredText: /^EPA \/ Environment$/,
  },
  {
    covers: [HEALTH_ECONOMICS_DISPLAY_FILE],
    name: "treatment-health-economics",
    path: "/agencies/dfda/conditions/endometriosis/treatments/laparoscopic-excision-surgery",
    required: true,
    requiredSelector: '[data-visual-section="health-economics"]',
  },
  {
    // Required, and asserted on #also-serves rather than something always
    // present: this is the state that proves a task renders under every goal
    // it serves, so a capture without that section would be worthless.
    covers: [TASK_DEPENDENCIES_SECTION_FILE],
    name: "task-one-percent-treaty",
    path: "/tasks/1-pct-treaty",
    required: true,
    requiredSelector: "#also-serves",
  },
  {
    covers: [TASK_IMPACT_TRACE_DISCLOSURE_FILE],
    name: "task-one-percent-treaty-impact-trace",
    openTaskImpactTrace: true,
    path: "/tasks/1-pct-treaty",
    required: true,
    requiredSelector: 'details[open] a[href="/methodology"]',
    requiredText: /^Estimate$/,
  },
  {
    name: "task-signer-canada",
    path: "/tasks/1-pct-treaty-signer-ca",
    required: false,
  },
  ...loadDocumentReviewRoutes(),
  ...loadMcpAuthorizeRoutes(),
];

const PUBLIC_SCREENSHOT_ROUTES: VisualRouteSpec[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("screenshot"),
)
  .filter(({ path }) => PUBLIC_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    covers:
      path === ROUTES.home
        ? [...(VISUAL_COVERS_BY_PATH.get(path) ?? []), ...OPTIMITRON_HOME_FILES]
        : VISUAL_COVERS_BY_PATH.get(path),
    name,
    path: VISUAL_PATH_OVERRIDE_BY_PATH.get(path) ?? path,
    required: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
  }));

const AUTHENTICATED_SCREENSHOT_ROUTES: VisualRouteSpec[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("authenticatedScreenshot"),
)
  .filter(({ path }) => ALL_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    covers:
      path === ROUTES.dashboard
        ? [
            ...(VISUAL_COVERS_BY_PATH.get(path) ?? []),
            PERSONAL_QUEUE_SECTION_FILE,
            TASK_LIST_CONTROLS_FILE,
          ]
        : VISUAL_COVERS_BY_PATH.get(path),
    name: publicRouteHasScreenshot(path) ? `${name}-auth` : name,
    path: VISUAL_PATH_OVERRIDE_BY_PATH.get(path) ?? path,
    required: true,
    authenticated: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
  }));

// Preserve the old host-rendered pages while their routes move into peer apps.
// These checks are compatibility evidence, not peer-app captures.
const LEGACY_HOST_ROUTES: VisualRouteSpec[] = [
  {
    appId: "warondisease",
    appLabel: VISUAL_APP_LABELS.warondisease,
    captureKind: "legacy-host",
    name: "legacy-warondisease-home",
    path: ROUTES.home,
    required: true,
    requiredSelector: "#sign",
    siteVariant: "warOnDisease",
  },
  {
    appId: "warondisease",
    appLabel: VISUAL_APP_LABELS.warondisease,
    authenticated: true,
    captureKind: "legacy-host",
    name: "legacy-warondisease-dashboard-auth",
    path: ROUTES.dashboard,
    required: true,
    siteVariant: "warOnDisease",
  },
  {
    appId: "dfda",
    appLabel: VISUAL_APP_LABELS.dfda,
    captureKind: "legacy-host",
    name: "variant-dfda-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dfda",
  },
  {
    appId: "dfda",
    appLabel: VISUAL_APP_LABELS.dfda,
    captureKind: "legacy-host",
    name: "variant-dfda-conditions",
    path: ROUTES.conditions,
    required: true,
    siteVariant: "dfda",
  },
  {
    appId: "dih",
    appLabel: VISUAL_APP_LABELS.dih,
    captureKind: "legacy-host",
    name: "variant-dih-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dih",
  },
  {
    appId: "dih",
    appLabel: VISUAL_APP_LABELS.dih,
    captureKind: "legacy-host",
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
  ...LEGACY_HOST_ROUTES,
]);

function publicRouteHasScreenshot(path: string): boolean {
  return (
    !isRedirectOnlyRoutePath(path) &&
    getRouteReviewSpecs("screenshot").some((spec) => spec.path === path)
  );
}

function dedupeRoutes(routes: VisualRouteSpec[]): VisualRoute[] {
  const seen = new Set<string>();
  const deduped: VisualRoute[] = [];
  for (const route of routes) {
    if (seen.has(route.name)) {
      throw new Error(`Duplicate visual route name: ${route.name}`);
    }
    seen.add(route.name);
    const ownership = getVisualRouteOwnership(route.path);
    deduped.push({
      ...route,
      appId: route.appId ?? ownership.appId,
      appLabel: route.appLabel ?? ownership.appLabel,
      captureKind: route.captureKind ?? ownership.captureKind,
      siteVariant: route.siteVariant ?? ownership.siteVariant,
    });
  }
  return deduped;
}

function loadMcpAuthorizeRoutes(): VisualRouteSpec[] {
  if (process.env.ROUTE_VISUAL_REVIEW !== "1") {
    return [];
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(
      readFileSync(MCP_AUTHORIZE_FIXTURE_MANIFEST_PATH, "utf8"),
    );
  } catch (error) {
    throw new Error(
      `MCP authorize visual fixture manifest is missing at ${MCP_AUTHORIZE_FIXTURE_MANIFEST_PATH}. The visual fixture seeder must run before Playwright.`,
      { cause: error },
    );
  }

  if (!isMcpAuthorizeFixtureManifest(manifest)) {
    throw new Error(
      `MCP authorize visual fixture manifest is invalid at ${MCP_AUTHORIZE_FIXTURE_MANIFEST_PATH}.`,
    );
  }

  return [
    {
      authenticated: true,
      covers: [
        MCP_AUTHORIZE_PAGE_FILE,
        MCP_CONSENT_FORM_FILE,
        RETRO_UI_BUTTON_FILE,
      ],
      name: "mcp-authorize-admin-user",
      mcpScopeAccess: "admin",
      path: manifest.authorizePath,
      required: true,
      requiredSelector: "#mcp-authorize-heading",
      requiredText: /^Authorize$/,
      verifyMcpDisabledAuthorize: true,
    },
    {
      authenticated: true,
      authenticatedEmail: manifest.nonAdminEmail,
      covers: [MCP_AUTHORIZE_PAGE_FILE, MCP_CONSENT_FORM_FILE],
      mcpScopeAccess: "non-admin",
      name: "mcp-authorize-non-admin-user",
      path: manifest.nonAdminAuthorizePath,
      required: true,
      requiredSelector: "#mcp-authorize-heading",
      requiredText: /^Authorize$/,
    },
  ];
}

function loadDocumentReviewRoutes(): VisualRouteSpec[] {
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
      name: "task-management-add-subtask",
      openAddSubtask: true,
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
