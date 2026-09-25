import { getRouteReviewSpecs, ROUTES } from "@/lib/routes";
import {
  MANAGED_DEMO_COLLECTION_ID,
  MANAGED_DEMO_DOCUMENT_ID,
} from "@optimitron/db/constants";
import { readFileSync } from "node:fs";
import path from "node:path";
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
  expectAdmin?: boolean;
  expectSettings?: boolean;
  /** The route is expected to render the app's 404 page. */
  expectNotFound?: boolean;
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
>;

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

export function getVisualRouteOwnership(): VisualRouteOwnership {
  return {
    appId: "optimitron",
    appLabel: VISUAL_APP_LABELS.optimitron,
    captureKind: "app",
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
const SIGN_IN_PAGE_FILE = "apps/optimitron/src/app/auth/signin/page.tsx";
const SIGN_IN_IN_CONSENT_FLOW_PATH = `${ROUTES.signIn}?callbackUrl=${encodeURIComponent(
  `${ROUTES.mcpAuthorize}?client_id=visual-review`,
)}`;
// The consent flow is where these render nothing, so its states cover them.
const SITE_CHROME_FILES = [
  "apps/optimitron/src/components/site/SiteChrome.tsx",
  "apps/optimitron/src/components/site/SiteChromeFrame.tsx",
  "apps/optimitron/src/components/site/CampaignActionFab.tsx",
];
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
const PERSONAL_QUEUE_SECTION_FILE =
  "apps/optimitron/src/components/dashboard/PersonalQueueSection.tsx";
const SEARCH_PAGE_FILE = "apps/optimitron/src/app/search/page.tsx";
const SEARCH_DISCOVERY_FILE =
  "apps/optimitron/src/app/search/search-discovery.tsx";
const PEOPLE_DIRECTORY_PAGE_FILE = "apps/optimitron/src/app/people/page.tsx";
const NOT_FOUND_PAGE_FILE = "apps/optimitron/src/app/not-found.tsx";
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
  "apps/optimitron/src/components/shared/ParasiticEconomyChart.tsx",
];

// optimitron.com/ renders OptimitronLandingPage, not the game page.
const OPTIMITRON_HOME_FILES = [
  "apps/optimitron/src/app/page.tsx",
  // Global styles, the footer, and the analytics tag load on every page.
  "apps/optimitron/src/app/globals.css",
  "apps/optimitron/src/components/Footer.tsx",
  "apps/optimitron/src/components/site/MicrosoftClarity.tsx",
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
  [ROUTES.admin, ["apps/optimitron/src/app/admin/page.tsx"]],
  [ROUTES.dashboard, ["apps/optimitron/src/app/dashboard/page.tsx"]],
  [ROUTES.donate, ["apps/optimitron/src/app/donate/page.tsx"]],
  [
    ROUTES.eosShareholders,
    ["apps/optimitron/src/components/eos-shareholder/EosShareholderLandingPage.tsx"],
  ],
  [ROUTES.messages, ["apps/optimitron/src/app/messages/page.tsx"]],
  [ROUTES.organizations, ["apps/optimitron/src/app/organizations/page.tsx"]],
  [ROUTES.shirt, ["apps/optimitron/src/app/shirt/page.tsx"]],
  [ROUTES.tasks, ["apps/optimitron/src/app/tasks/page.tsx"]],
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
  [ROUTES.game, OPTIMITRON_GAME_LANDING_FILES],
  [
    ROUTES.methodology,
    [
      "packages/data/src/parameters/expected-value-methodology.ts",
      "apps/optimitron/src/app/methodology/page.tsx",
    ],
  ],
  [ROUTES.invest, INVEST_LANDING_FILES],
  [ROUTES.prize, PRIZE_PAGE_FILES],
  [ROUTES.profile, ["apps/optimitron/src/components/Providers.tsx"]],
  [
    ROUTES.scoreboard,
    [POLITICIAN_SCORECARD_TABLE_FILE, "apps/optimitron/src/app/scoreboard/page.tsx"],
  ],
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

const REQUIRED_SELECTOR_BY_PATH = new Map<string, string>([
  [ROUTES.admin, 'nav[aria-label="Admin tools"]'],
  [ROUTES.dashboard, "h1"],
  [ROUTES.donate, "h1"],
  [ROUTES.eosShareholders, "h1"],
  [ROUTES.messages, "h1"],
  [ROUTES.organizations, "h1"],
  [ROUTES.shirt, "h1"],
  [ROUTES.tasks, "h1"],
  [ROUTES.eos, "h1"],
  [ROUTES.game, "#vote"],
  // The home route covers every shared landing section, so without a selector
  // the coverage gate cannot prove any of them rendered. #vote is the last
  // section on the page, the same anchor /game asserts.
  [ROUTES.home, "#vote"],
  [ROUTES.methodology, "#methodology"],
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

const IMAGE_STABLE_ROUTE_PATHS = new Set<string>([ROUTES.profile]);

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
    authenticated: true,
    covers: ["apps/optimitron/src/app/admin/task-payouts/page.tsx"],
    name: "admin-task-payouts",
    path: "/admin/task-payouts",
    required: true,
    requiredSelector: "h1",
    requiredText: /^Task payouts$/,
  },
  {
    // The Officials filter and "Public official" label use the officeholder rule.
    covers: [PEOPLE_DIRECTORY_PAGE_FILE],
    name: "people-officials",
    path: "/people?role=officials",
    required: true,
    requiredSelector: "h1",
    requiredText: /Find the human who should do something/i,
  },
  {
    covers: ["apps/optimitron/src/app/agencies/[agencyId]/page.tsx"],
    name: "agency-dcbo",
    path: "/agencies/dcbo",
    required: true,
    requiredSelector: "h1",
  },
  {
    covers: ["apps/optimitron/src/app/agencies/dcensus/page.tsx"],
    name: "agency-dcensus",
    path: "/agencies/dcensus",
    required: true,
    requiredSelector: "h1",
  },
  {
    covers: ["apps/optimitron/src/app/agencies/dfec/page.tsx"],
    name: "agency-dfec",
    path: "/agencies/dfec",
    required: true,
    requiredSelector: "h1",
  },
  {
    covers: ["apps/optimitron/src/app/agencies/dih/page.tsx"],
    name: "agency-dih",
    path: "/agencies/dih",
    required: true,
    requiredSelector: "h1",
  },
  {
    // Managed data gives Mike's user the person handle "mike".
    covers: ["apps/optimitron/src/app/agencies/dfec/alignment/[identifier]/page.tsx"],
    name: "alignment-report-mike",
    path: "/agencies/dfec/alignment/mike",
    required: true,
    requiredSelector: "h1",
  },
  {
    // scripts/seed-visual-review-fixtures.ts writes this vote.
    covers: ["apps/optimitron/src/app/civic/votes/[identifier]/page.tsx"],
    name: "civic-vote",
    path: "/civic/votes/visual_document_review_civic_vote",
    required: true,
    requiredSelector: "h1",
    requiredText: /^Citizen Vote$/,
  },
  {
    // Each agency card links to its report, so its chart sources render as text.
    covers: [
      "apps/optimitron/src/app/governments/[code]/agencies/page.tsx",
      "apps/optimitron/src/components/shared/AgencyGradeChart.tsx",
    ],
    name: "government-agencies",
    path: "/governments/US/agencies",
    required: true,
    requiredSelector: "h1",
  },
  {
    covers: [
      "apps/optimitron/src/app/governments/[code]/agencies/[agencyId]/page.tsx",
      "apps/optimitron/src/components/shared/AgencyGradeChart.tsx",
    ],
    name: "government-agency",
    path: "/governments/US/agencies/nih",
    required: true,
    requiredSelector: "h1",
  },
  {
    covers: ["apps/optimitron/src/app/governments/[code]/politicians/page.tsx"],
    name: "government-politicians",
    path: "/governments/US/politicians",
    required: true,
    requiredSelector: "h1",
  },
  {
    // An unknown bioguide ID renders the page's not-found state. The page
    // streams, so the status stays 200.
    covers: ["apps/optimitron/src/app/governments/[code]/politicians/[bioguideId]/page.tsx"],
    name: "politician-not-found",
    path: "/governments/US/politicians/VISUAL0000",
    required: true,
    requiredSelector: 'nav[aria-label="Page recovery"] a[href="/search"]',
    requiredText: /Page Not Found/i,
  },
  {
    covers: [
      "apps/optimitron/src/app/dysfunction-tax/page.tsx",
      "apps/optimitron/src/components/landing/PoliticalDysfunctionTaxSection.tsx",
    ],
    name: "dysfunction-tax",
    path: "/dysfunction-tax",
    required: true,
    requiredSelector: "section h2",
  },
  {
    covers: [NOT_FOUND_PAGE_FILE],
    expectNotFound: true,
    name: "not-found",
    path: "/this-page-does-not-exist",
    required: true,
    requiredSelector: 'nav[aria-label="Page recovery"] a[href="/search"]',
    requiredText: /Page Not Found/i,
  },
  {
    covers: [SEARCH_PAGE_FILE, SEARCH_DISCOVERY_FILE],
    name: "search-empty",
    path: ROUTES.search,
    required: true,
    requiredSelector: '[data-search-popular] a[href="/tasks"]',
    requiredText: /Popular pages/i,
  },
  {
    covers: [SEARCH_DISCOVERY_FILE],
    name: "search-typeahead",
    path: ROUTES.search,
    required: true,
    requiredSelector:
      '[data-search-suggestions] a[href="https://warondisease.org/vote"]',
    typeSearchQuery: "vote",
  },
  {
    covers: [SEARCH_DISCOVERY_FILE],
    name: "search-loading",
    path: ROUTES.search,
    required: true,
    requiredSelector: 'form[aria-busy="true"] button:disabled',
    requiredText: /^Searching…$/i,
    submitSearch: true,
    typeSearchQuery: "vote",
  },
  {
    covers: [SEARCH_PAGE_FILE],
    name: "search-results",
    path: `${ROUTES.search}?q=vote`,
    required: true,
    requiredSelector: 'a[href="https://warondisease.org/vote"]',
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
    covers: [SIGN_IN_PAGE_FILE, ...SITE_CHROME_FILES],
    name: "signin-in-oauth-consent-flow",
    path: SIGN_IN_IN_CONSENT_FLOW_PATH,
    required: true,
    requiredSelector: 'input[type="email"]',
  },
  {
    covers: ["apps/optimitron/src/components/Navbar.tsx"],
    expectAdmin: false,
    name: "side-menu",
    path: ROUTES.home,
    required: true,
    openMenu: true,
    requiredSelector: '[role="dialog"]',
  },
  {
    covers: ["apps/optimitron/src/components/Navbar.tsx"],
    expectAdmin: true,
    name: "side-menu-auth",
    path: ROUTES.home,
    required: true,
    authenticated: true,
    openMenu: true,
    expectSettings: true,
    requiredSelector: '[role="dialog"]',
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
    required: true,
    requiredSelector: "section h1",
    requiredText: /^Ballot Question$/,
    covers: ["apps/optimitron/src/app/agencies/dcongress/referendums/[slug]/page.tsx"],
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

export const VISUAL_ROUTES: VisualRoute[] = dedupeRoutes([
  ...PUBLIC_SCREENSHOT_ROUTES,
  ...AUTHENTICATED_SCREENSHOT_ROUTES,
  ...SPECIAL_STATE_ROUTES,
  ...SEEDED_DYNAMIC_ROUTES,
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
    const ownership = getVisualRouteOwnership();
    deduped.push({
      ...route,
      appId: route.appId ?? ownership.appId,
      appLabel: route.appLabel ?? ownership.appLabel,
      captureKind: route.captureKind ?? ownership.captureKind,
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
      authenticatedEmail: manifest.nonAdminEmail,
      covers: ["apps/optimitron/src/components/Navbar.tsx"],
      expectAdmin: false,
      expectSettings: true,
      name: "side-menu-non-admin",
      openMenu: true,
      path: ROUTES.home,
      required: true,
      requiredSelector: '[role="dialog"]',
    },
    {
      authenticated: true,
      covers: [
        MCP_AUTHORIZE_PAGE_FILE,
        MCP_CONSENT_FORM_FILE,
        RETRO_UI_BUTTON_FILE,
        ...SITE_CHROME_FILES,
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
