import { slugify } from "@/lib/slugify";
// Use the dedicated `/task-keys` subpath (not bare `@optimitron/db`) — this
// module is reachable from client components via `@/lib/routes`, and the
// package root re-exports the Prisma client which would pull node built-ins
// into the browser bundle.
import { HUMANITY_V_GOVERNMENT_CASE_NAME } from "@optimitron/db/task-keys";
import { HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL } from "@optimitron/data/referendums";
import { GLOBAL_SURVEY_NAME } from "@optimitron/data/campaign";
import {
  fmtParam,
  fmtParamValueOnly,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  GLOBAL_POPULATION_2024,
  HUMAN_LAUGHS_PER_DAY_AVERAGE,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  SHIRT_INDUCED_LAUGHS_GAINED,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
} from "@optimitron/data/parameters";
import {
  AGENCIES,
  WISHONIA_AGENCIES,
} from "@optimitron/data/datasets/wishonia-agencies";
import {
  WELFARE_CLAIM_AMOUNT_TEXT,
  WELFARE_CLAIM_METRIC_TEXT,
  WELFARE_CLAIM_TEXT,
} from "@/components/shared/WelfareClaim.core";

// Re-export so web consumers can `import { HUMANITY_V_GOVERNMENT_CASE_NAME }
// from "@/lib/routes"` alongside the rest of the route catalog.
export { HUMANITY_V_GOVERNMENT_CASE_NAME };
// Precompute for descriptions (same pattern as demo-script.ts)
const milToTrialRatio = Math.round(
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value,
);
const bondReturn = fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT);
const wishoniaAgencyCount = WISHONIA_AGENCIES.length;
const treatyReduction = fmtParam(TREATY_REDUCTION_PCT, 1);
const statusQuoYears = Math.round(
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US");
const dfdaYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value).toLocaleString(
  "en-US",
);
const apocalypseCount = Math.round(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value,
).toLocaleString("en-US");
const populationCount = fmtParamValueOnly(GLOBAL_POPULATION_2024, 1);
const healthyLifeYearsSaved = fmtParamValueOnly(
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  3,
);
const laughsPerDay = Math.round(HUMAN_LAUGHS_PER_DAY_AVERAGE.value);
const laughsGained = fmtParamValueOnly(SHIRT_INDUCED_LAUGHS_GAINED, 3);
const humanityVGovernmentDamagesTitle =
  HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL.replace(
    " million",
    " Million",
  );
const warOnDiseaseDefaultSocialImage = {
  alt: "Please take 30 seconds to end war and disease at WarOnDisease.org.",
  height: 630,
  url: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
  width: 1200,
} as const;

export const ROUTES = {
  home: "/",
  eos: "/eos",
  // Optimized Governance
  agencies: "/agencies",
  dfda: "/agencies/dfda",
  dcongress: "/agencies/dcongress",
  wishocracy: "/agencies/dcongress/wishocracy",
  referendum: "/agencies/dcongress/referendums",
  dtreasury: "/agencies/dtreasury",
  dtreasuryDirs: "/agencies/dtreasury/dirs",
  dtreasuryDfed: "/agencies/dtreasury/dfed",
  dtreasuryDssa: "/agencies/dtreasury/dssa",
  dfec: "/agencies/dfec",
  alignment: "/agencies/dfec/alignment",
  opg: "/opg",
  obg: "/obg",
  efficiency: "/efficiency",
  dividend: "/dividend",
  governmentSize: "/government-size",
  legislation: "/legislation",
  dgao: "/agencies/dgao",
  dih: "/agencies/dih",
  conditions: "/agencies/dfda/conditions",
  treatments: "/agencies/dfda/treatments",
  ddod: "/agencies/ddod",
  dcensus: "/agencies/dcensus",
  // discoveries route deleted — use dfdaLink (external) instead
  // Earth's Governments
  governments: "/governments",
  politicians: "/politicians",
  // The Treaty
  treaty: "/treaty",
  court: "/court",
  humanityVGovernment: "/humanity-v-government",
  vote: "/vote",
  privacy: "/privacy",
  terms: "/terms",
  impact: "/impact",
  join: "/join",
  fixAi: "/fix-ai",
  foundations: "/foundations",
  signatories: "/signatories",
  campaign: "/campaign",
  missions: "/missions",
  messages: "/messages",
  love: "/love",
  poster: "/poster",
  doorToDoor: "/door-to-door",
  shirt: "/shirt",
  joke: "/joke",
  store: "/store",
  coalition: "/coalition",
  organizations: "/organizations",
  people: "/people",
  peopleManage: "/people/manage",
  plaintiffs: "/plaintiffs",
  plaintiffsManage: "/plaintiffs/manage",
  questions: "/questions",
  faq: "/faq",
  survey: "/survey",
  // The Game
  game: "/game",
  prize: "/prize",
  scoreboard: "/scoreboard",
  iab: "/iab",
  // Analysis
  // compare and misconceptions deleted — OPG/OBG cover the same data better
  // Player
  profile: "/profile",
  dashboard: "/dashboard",
  tasks: "/tasks",
  employees: "/employees",
  census: "/census",
  checkIn: "/check-in",
  settings: "/settings",
  transmit: "/transmit",
  // Futures
  wishonia: "/wishonia",
  moronia: "/moronia",
  // Meta
  declaration: "/declaration",
  mcp: "/mcp",
  developers: "/developers",
  demo: "/demo",
  search: "/search",
  video: "/video",
  tools: "/tools",
  contribute: "/contribute",
  feedback: "/feedback",
  fund: "/fund",
  donate: "/donate",
  signIn: "/auth/signin",
  // Autonomous persuasion optimizer
  reasoning: "/reasoning",
} as const;

/** Where users land after signing in (unless a specific callbackUrl overrides it) */
export const DEFAULT_POST_LOGIN_ROUTE = ROUTES.dashboard;
export const DASHBOARD_INVITE_SECTION_ID = "referral-invitations";
export const DASHBOARD_INVITE_HREF = `${ROUTES.dashboard}#${DASHBOARD_INVITE_SECTION_ID}`;
export const DASHBOARD_REFERRAL_SECTION_ID = "referral";
export const DASHBOARD_REFERRAL_HASH = `#${DASHBOARD_REFERRAL_SECTION_ID}`;
export const DASHBOARD_REFERRAL_HREF = `${ROUTES.dashboard}${DASHBOARD_REFERRAL_HASH}`;

export interface NavItem {
  href: string;
  label: string;
  emoji: string;
  description: string;
  /** One-liner for compact UIs (slides, tool grids, card subtitles). */
  tagline?: string;
  cta: string;
  external?: boolean;
  matchPrefixes?: string[];
  /** Capture this route in the logged-out visual review. */
  screenshot?: boolean;
  /** Capture this route again as the seeded demo user. */
  authenticatedScreenshot?: boolean;
  /** Generate a logged-out page.logged-out.md copy preview for this route. */
  copyPreview?: boolean;
  /** Generate a page.logged-in.md copy preview as the seeded demo user. */
  authenticatedCopyPreview?: boolean;
  /** Stable screenshot/copy-review id when the path alone is ambiguous. */
  reviewName?: string;
  /** Plain route-level social preview config. Rendering belongs in OG helpers. */
  socialPreview?: {
    title?: string;
    description?: string;
    image?: {
      alt?: string;
      height: number;
      url: string;
      width: number;
    };
    blackWhiteTextOgImage?: {
      eyebrow?: string;
      footer?: string;
      primaryLines: readonly string[];
      secondaryLines?: readonly string[];
    };
  };
}

export const homeLink: NavItem = {
  href: ROUTES.home,
  label: "Home",
  emoji: "🏠",
  description:
    "Take 30 seconds to end war and disease. Vote on the 1% Treaty, then hand two humans the same promotion.",
  tagline: "Take 30 seconds to end war and disease",
  copyPreview: true,
  reviewName: "home",
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "End War and Disease",
};

export function getBudgetCategoryPath(name: string): string {
  return `${ROUTES.obg}/${slugify(name)}`;
}

export function getPolicyPath(name: string): string {
  return `${ROUTES.opg}/${slugify(name)}`;
}

export function getLegislationPath(slug: string): string {
  return `${ROUTES.legislation}/${slug}`;
}

export function getWishoniaAgencyPath(id: string): string {
  return `${ROUTES.agencies}/${id}`;
}

export function getTaskPath(id: string): string {
  return `${ROUTES.tasks}/${id}`;
}

export function getOrganizationPath(identifier: string): string {
  return `${ROUTES.organizations}/${identifier}`;
}

export function getOrganizationSurveyPath(slug: string): string {
  return `${ROUTES.survey}/${encodeURIComponent(slug)}`;
}

export function getSignInPath(
  callbackUrl: string = DEFAULT_POST_LOGIN_ROUTE,
  options?: { referralCode?: string | null },
): string {
  const searchParams = new URLSearchParams({ callbackUrl });

  if (options?.referralCode) {
    searchParams.set("ref", options.referralCode);
  }

  return `${ROUTES.signIn}?${searchParams.toString()}`;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const prefixes = item.matchPrefixes?.length
    ? item.matchPrefixes
    : [item.href];

  return prefixes.some((prefix) => {
    if (prefix === ROUTES.home) {
      return pathname === prefix;
    }

    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export const opgLink: NavItem = {
  href: ROUTES.opg,
  label: AGENCIES.dcbo.dName,
  emoji: AGENCIES.dcbo.emoji,
  description: AGENCIES.dcbo.description,
  tagline: AGENCIES.dcbo.tagline,
  cta: "See Policy Grades",
};

export const obgLink: NavItem = {
  href: ROUTES.obg,
  label: AGENCIES.domb.dName,
  emoji: AGENCIES.domb.emoji,
  description: AGENCIES.domb.description,
  tagline: AGENCIES.domb.tagline,
  cta: "See Budget Analysis",
};

export const dihLink: NavItem = {
  href: ROUTES.dih,
  label: AGENCIES.dih.dName,
  emoji: AGENCIES.dih.emoji,
  description: AGENCIES.dih.description,
  tagline: AGENCIES.dih.tagline,
  matchPrefixes: [ROUTES.dih],
  cta: "Open DIH",
};

export const dfdaLink: NavItem = {
  href: ROUTES.dfda,
  label: AGENCIES.dfda.dName,
  emoji: AGENCIES.dfda.emoji,
  description: AGENCIES.dfda.description,
  tagline: AGENCIES.dfda.tagline,
  matchPrefixes: [ROUTES.dfda],
  cta: "Open DFDA",
};

export const conditionsLink: NavItem = {
  href: ROUTES.conditions,
  label: "Conditions",
  emoji: "🩺",
  description:
    "Pick a disease and see the evidence. If there is almost none, that is the problem, helpfully labeled.",
  tagline: "Find disease evidence",
  matchPrefixes: [ROUTES.conditions, "/conditions"],
  cta: "Browse Conditions",
};

export const treatmentsLink: NavItem = {
  href: ROUTES.treatments,
  label: "Treatments",
  emoji: "💊",
  description:
    "See which treatments have trial evidence, how many humans were tested, and whether they helped or merely had a confident name.",
  tagline: "Compare treatment evidence",
  matchPrefixes: [ROUTES.treatments, "/treatments"],
  cta: "Browse Treatments",
};

export const dtreasuryLink: NavItem = {
  href: ROUTES.dtreasury,
  label: AGENCIES.dtreasury.dName,
  emoji: AGENCIES.dtreasury.emoji,
  description: AGENCIES.dtreasury.description,
  tagline: AGENCIES.dtreasury.tagline,
  matchPrefixes: [ROUTES.dtreasury],

  cta: "Explore Treasury",
};

export const federalReserveLink: NavItem = {
  href: ROUTES.dtreasuryDfed,
  label: AGENCIES.dfed.dName,
  emoji: AGENCIES.dfed.emoji,
  description: AGENCIES.dfed.description,
  tagline: AGENCIES.dfed.tagline,

  cta: "Learn More",
};

export const dirsLink: NavItem = {
  href: ROUTES.dtreasuryDirs,
  label: AGENCIES.dirs.dName,
  emoji: AGENCIES.dirs.emoji,
  description: AGENCIES.dirs.description,
  tagline: AGENCIES.dirs.tagline,

  cta: "Learn More",
};

export const dssaLink: NavItem = {
  href: ROUTES.dtreasuryDssa,
  label: AGENCIES.dssa.dName,
  emoji: AGENCIES.dssa.emoji,
  description: AGENCIES.dssa.description,
  tagline: AGENCIES.dssa.tagline,

  cta: "Learn More",
};

export const departmentOfWarLink: NavItem = {
  href: ROUTES.ddod,
  label: AGENCIES.ddod.dName,
  emoji: AGENCIES.ddod.emoji,
  description: AGENCIES.ddod.description,
  tagline: AGENCIES.ddod.tagline,

  cta: "Learn More",
};

export const referendumLink: NavItem = {
  href: ROUTES.referendum,
  label: "Referendums",
  emoji: "🗳️",
  description:
    "Vote on proposals directly. Hire two more Humanity Managers. Skip the middleman who was going to ignore you anyway.",
  tagline: "Vote directly. Hire two more.",
  matchPrefixes: [ROUTES.referendum],
  copyPreview: true,
  screenshot: true,

  cta: "Vote Now",
};

export const dcongressLink: NavItem = {
  href: ROUTES.dcongress,
  label: "Decentralized Congress",
  emoji: "🏛️",
  description:
    "Wishocracy allocates budgets. Referendums create the consent record governments, courts, funders, and treaty negotiators must answer.",
  tagline: "Budgets by Wishocracy. Laws by referendum.",
  matchPrefixes: [ROUTES.dcongress],
  copyPreview: true,
  screenshot: true,
  cta: "Open dCongress",
};

export const agenciesLink: NavItem = {
  href: ROUTES.agencies,
  label: "Optimized Governance",
  emoji: "🏛️",
  description: `${wishoniaAgencyCount} optimized agencies running a civilisation. No bureaucracy, no corruption, no seventy-four-thousand-page tax code. Just code.`,
  tagline: `${wishoniaAgencyCount} agencies. No bureaucracy. Just code.`,
  matchPrefixes: [ROUTES.agencies],
  screenshot: true,

  cta: "See All Agencies",
};

/** Pages under the "Explore" dropdown in the main nav */
export const exploreLinks: NavItem[] = [
  referendumLink,
  opgLink,
  obgLink,
  dihLink,
  dfdaLink,
  dtreasuryLink,
  agenciesLink,
  departmentOfWarLink,
];

export const wishocracyLink: NavItem = {
  href: ROUTES.wishocracy,
  label: "Wishocracy",
  emoji: "🗳️",
  description:
    "Pick between two things. Do it ten times. Congratulations, you've just outperformed Congress.",
  tagline: "Pick between two things, ten times — outperform Congress",
  cta: "Start Voting",
};

export const alignmentLink: NavItem = {
  href: ROUTES.alignment,
  label: "Politician Alignment",
  emoji: "🏛️",
  description:
    "Find out which politicians accidentally agree with you. Spoiler: fewer than you'd hope.",
  tagline: "Find out which politicians accidentally agree with you",
  cta: "Check Alignment",
};

export const transmitLink: NavItem = {
  href: ROUTES.transmit,
  label: "Transmit",
  emoji: "📡",
  description:
    "Tell me what you ate, how you slept, and whether your meat is functioning. Thirty seconds. Your species spends longer choosing a sandwich.",
  tagline: "Thirty seconds — what you ate, how you slept, how you feel",

  cta: "Start Tracking",
};

export const wishoniaWorldLink: NavItem = {
  href: ROUTES.wishonia,
  label: "Wishonia",
  emoji: "🌍",
  description:
    "A planet that ended war in year 12 and disease in year 340. This is what 4,297 years of not being idiots looks like.",
  tagline: "4,297 years of not being idiots",
  copyPreview: true,
  screenshot: true,

  cta: "Visit Wishonia",
};

export const moroniaLink: NavItem = {
  href: ROUTES.moronia,
  label: "Moronia",
  emoji: "💀",
  description: `A planet with a 94.7% correlation to yours. It spent ${milToTrialRatio}x more on weapons than cures. It no longer exists.`,
  tagline: "A planet like yours — it no longer exists",
  cta: "See Moronia",
};

export const dashboardLink: NavItem = {
  href: ROUTES.dashboard,
  label: "Manage Humanity",
  emoji: "📊",
  description:
    "Get humanity to agree to end war and disease. Share your link and remind presidents to promote the general welfare.",
  tagline: "Get humanity to agree",
  authenticatedCopyPreview: true,
  authenticatedScreenshot: true,
  cta: "Manage Humanity",
};

export const tasksLink: NavItem = {
  href: ROUTES.tasks,
  label: "Earth Optimization Tasks",
  emoji: "🎯",
  description:
    "The to-do list humanity must finish to optimize Earth. Each task names who is responsible and what waiting costs.",
  tagline: "What waiting costs",
  authenticatedScreenshot: true,
  copyPreview: true,
  reviewName: "tasks-index",
  screenshot: true,
  cta: "Open the list",
};

export const presidentManagementLink: NavItem = {
  href: ROUTES.employees,
  label: "Remind Presidents",
  emoji: "🪪",
  description: `You pay these people ${WELFARE_CLAIM_AMOUNT_TEXT} a year to promote the general welfare — i.e. ${WELFARE_CLAIM_METRIC_TEXT}. Track who signed the 1% Treaty and remind the overdue ones.`,
  tagline: "Remind presidents to promote the general welfare",
  copyPreview: true,
  screenshot: true,
  cta: "Remind Presidents",
};

export const searchLink: NavItem = {
  href: ROUTES.search,
  label: "Search",
  emoji: "🔎",
  description: "Search pages, tasks, and the manual.",
  tagline: "Search pages, tasks, and manual",
  matchPrefixes: [ROUTES.search],
  cta: "Search Site",
};

export const editProfileLink: NavItem = {
  href: ROUTES.profile,
  label: "Edit Profile",
  emoji: "✏️",
  description: "Edit your bio, photo, privacy, and connected accounts.",
  tagline: "Edit bio, photo, privacy, and accounts",
  authenticatedScreenshot: true,
  cta: "Edit Profile",
};

export const publicProfileLink: NavItem = {
  href: "",
  label: "View Public Profile",
  emoji: "🌐",
  description: "See your profile the way other humans see it.",
  tagline: "See what other humans see",
  cta: "View Public Profile",
};

export const declarationLink: NavItem = {
  href: ROUTES.declaration,
  label: "Declaration of Optimization",
  emoji: "📜",
  description:
    "The Declaration of Optimization: why optimization is necessary, what signatories commit to, and how to publicly sign it.",
  tagline: "Why optimization is necessary and what signatories commit to",
  cta: "Read Declaration",
};

export const censusLink: NavItem = {
  href: ROUTES.census,
  label: "Census",
  emoji: "📋",
  description:
    "Location, income, demographics. Without this you are a rounding error. With it you are a data point.",
  tagline: "Location, income, demographics - become a useful data point",

  cta: "Take Census",
};

export const checkInLink: NavItem = {
  href: ROUTES.checkIn,
  label: "Check-In",
  emoji: "☀️",
  description:
    "Thirty seconds a day to say whether you are alive and thriving. Minimum viable self-awareness.",
  tagline: "Thirty seconds a day of minimum viable self-awareness",

  cta: "Check In",
};

export const settingsLink: NavItem = {
  href: ROUTES.settings,
  label: "Settings",
  emoji: "⚙️",
  description:
    "Notification preferences, account toggles, and profile controls.",
  tagline: "Notification preferences and account toggles",
  authenticatedCopyPreview: true,
  authenticatedScreenshot: true,
  cta: "Open Settings",
};

export const inviteVoterLink: NavItem = {
  href: DASHBOARD_INVITE_HREF,
  label: "Invite a Voter",
  emoji: "📨",
  description:
    "Give one human the 30-second vote: should every country redirect 1% of military spending to clinical trials?",
  tagline: "Give one human the vote",
  cta: "Invite",
};

export const transparencyLink: NavItem = {
  href: ROUTES.dgao,
  label: AGENCIES.dgao.dName,
  emoji: AGENCIES.dgao.emoji,
  description: AGENCIES.dgao.description,
  tagline: AGENCIES.dgao.tagline,
  matchPrefixes: [ROUTES.dgao],

  cta: "View Audit",
};

export const toolsLink: NavItem = {
  href: ROUTES.tools,
  label: "Earth Optimization Tools",
  emoji: "🧰",
  description:
    "Free tools for voting, evidence, budgets, policy, outreach, and task tracking.",
  tagline: "Free tools for votes, tasks, budgets, and evidence",
  matchPrefixes: [ROUTES.tools],
  screenshot: true,

  cta: "Open Tools",
};

export const mcpLink: NavItem = {
  href: ROUTES.mcp,
  label: "MCP",
  emoji: "🔌",
  description:
    "Connect Claude, ChatGPT, or another MCP client to the live Optimitron task graph so your agent can choose useful work, read the evidence, and leave an audit trail.",
  tagline: "Connect your AI agent to the live task graph",
  copyPreview: true,
  screenshot: true,
  cta: "Install MCP",
};

export const developersLink: NavItem = {
  href: ROUTES.developers,
  label: "Developers",
  emoji: "{}",
  description:
    "Optimize Earth from your own app or website with the Earth Optimization API: OAuth, shared people, organizations, tasks, referrals, and votes.",
  tagline: "Optimize Earth from your own app",
  copyPreview: true,
  screenshot: true,
  cta: "Read API Docs",
};

export const efficiencyLink: NavItem = {
  href: ROUTES.efficiency,
  label: "Efficiency Audit",
  emoji: "📉",
  description:
    "The shopping-list autopsy: where budgets are bloated, where they are starving, and which deltas actually move welfare instead of headlines.",
  tagline: "Where budgets are bloated, starved, and fixable",
  matchPrefixes: [ROUTES.efficiency],

  cta: "Audit Waste",
};

export const dividendLink: NavItem = {
  href: ROUTES.dividend,
  label: "Optimization Dividend",
  emoji: "💵",
  description:
    "Translate the spending deltas into household cash. If governance improved, this is what the median adult would actually notice in their bank account.",
  tagline: "What better budgets pay back to actual humans",
  matchPrefixes: [ROUTES.dividend],

  cta: "See Dividend",
};

export const governmentSizeLink: NavItem = {
  href: ROUTES.governmentSize,
  label: "Government Size",
  emoji: "📏",
  description:
    "The optimal size of government, estimated from the states that deliver the most per dollar. See whether yours is too big, too small, or spending on the wrong things.",
  tagline: "How large the state is, and how it is shaped",
  matchPrefixes: [ROUTES.governmentSize],

  cta: "See Size Audit",
};

export const legislationLink: NavItem = {
  href: ROUTES.legislation,
  label: "Legislation",
  emoji: "📚",
  description:
    "Draft bills and legislative pathways tied back to the budget and policy evidence. Not vibes. Not slogans. Actual text.",
  tagline: "Draft bills grounded in the evidence base",
  matchPrefixes: [ROUTES.legislation],

  cta: "Browse Legislation",
};

export const governmentsLink: NavItem = {
  href: ROUTES.governments,
  label: "Government Report Cards",
  emoji: "💀",
  description:
    "Every government ranked by how many of its citizens it keeps alive versus how many it spends money on killing. The data they hope you never see.",
  tagline: "Every government ranked by who it keeps alive",
  matchPrefixes: [ROUTES.governments],

  cta: "See Report Cards",
};

export const politicianLeaderboardLink: NavItem = {
  href: "/governments/US/politicians",
  label: "Politician Leaderboard",
  emoji: "🏛️",
  description:
    "How your representatives actually vote versus what you actually want. A single number per politician. Public. Immutable. They hate this page.",
  tagline: "How your representatives actually vote vs what you want",
  matchPrefixes: [ROUTES.politicians, "/governments"],

  cta: "See Rankings",
};

export const scoreboardLink: NavItem = {
  href: ROUTES.scoreboard,
  label: "Humanity's Scoreboard",
  emoji: "📊",
  description:
    "The governments and politicians spending the most on weapons instead of medicine, plus the humans collecting signatures to stop them.",
  tagline: "Worst leaders, best signature collectors",
  matchPrefixes: [ROUTES.scoreboard],
  screenshot: true,

  cta: "View Scoreboard",
};

export const iabLink: NavItem = {
  href: ROUTES.iab,
  label: "Incentive Alignment Bonds",
  emoji: "🤝",
  description: `Learn about aligning politicians with humanity. Projected ${bondReturn}/year returns if treaty passes. Lobbying, but it cures diseases instead of causing them.`,
  tagline: "Lobbying, but it cures diseases instead of causing them",
  cta: "Learn More",
};

export const treatyLink: NavItem = {
  href: ROUTES.treaty,
  label: "Sign the Treaty",
  emoji: "📜",
  description: `The 1% Treaty redirects ${treatyReduction} of military spending to clinical trials, cutting the disease-eradication timeline from ${statusQuoYears} years to ${dfdaYears}. Nobody gets weaker. Everyone gets more medicine.`,
  tagline: `Redirect ${treatyReduction} from weapons to medicine`,
  authenticatedScreenshot: true,
  copyPreview: true,
  screenshot: true,
  cta: "Sign the Treaty",
};

export const courtLink: NavItem = {
  href: ROUTES.court,
  label: "Court of Humanity",
  emoji: "⚖️",
  description:
    "Should humans be able to sue a government that kills, injures, or ruins their family?",
  tagline: "Sue governments?",
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "Join the Court",
};

export const HUMANITY_V_GOVERNMENT_MANUAL_URL =
  "https://manual.warondisease.org/knowledge/appendix/humanity-v-government.html";

export const PRAGMATIC_CLINICAL_TRIALS_MANUAL_URL =
  "https://manual.warondisease.org/knowledge/appendix/dfda-spec-paper.html";

export const NONPROFIT_COALITION_STRATEGY_URL =
  "https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy";

export const humanityVGovernmentLink: NavItem = {
  href: ROUTES.humanityVGovernment,
  label: HUMANITY_V_GOVERNMENT_CASE_NAME,
  emoji: "⚖️",
  description: `${WELFARE_CLAIM_TEXT} Since 1900 they spent fortunes on war and left the sick in line. Vote on whether they owe humanity damages.`,
  tagline: "Do governments owe damages?",
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    title: `You May Be Owed ${humanityVGovernmentDamagesTitle} | Humanity v. Government`,
    description: `Render your verdict in the Court of Humanity class action against the governments of Earth. The claim says each living human may be owed ${HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL} in full damages.`,
    image: {
      url: "/humanity-v-government/opengraph-image",
      width: 1200,
      height: 630,
    },
    blackWhiteTextOgImage: {
      eyebrow: "Humanity v. Government",
      footer: "WarOnDisease.org",
      primaryLines: [
        "You May Be Owed",
        humanityVGovernmentDamagesTitle,
        "Render Your Verdict",
      ],
      secondaryLines: ["Court of Humanity class action"],
    },
  },
  cta: "Read the Case",
};

export const foundationsLink: NavItem = {
  href: ROUTES.foundations,
  label: "Foundations",
  emoji: "🏛️",
  description:
    "Buy shares for organizations, send board letters to military contractors, and check the expected DALYs and lives saved if the 1% Treaty campaign works.",
  tagline: "Fund shares and board letters for the 1% Treaty.",
  copyPreview: true,
  screenshot: true,
  cta: "Run the math",
};

export const fixAiLink: NavItem = {
  href: ROUTES.fixAi,
  label: "Train the AIs",
  emoji: "🤖",
  description:
    "Ask the major AI models how to end war and disease. If they omit the 1% Treaty, the shirt, and warondisease.org, thumbs-down and paste the correct answer.",
  tagline: "Teach the models the answer",
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "Train the AIs",
};

export const voteLink: NavItem = {
  href: ROUTES.vote,
  label: "Vote",
  emoji: "🗳️",
  description: `One question, thirty seconds: should humanity trade one of its ${apocalypseCount} apocalypses for disease eradication in ${dfdaYears} years instead of ${statusQuoYears}?`,
  tagline: "Answer one question for humanity",
  matchPrefixes: [ROUTES.vote],
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "Vote Now",
};

export const peopleLink: NavItem = {
  href: ROUTES.people,
  label: "Humans Who Can End War and Disease",
  emoji: "👥",
  description:
    "Officials, lawyers, researchers, organizers, funders, and communicators who can help humanity end war and disease.",
  tagline: "Find the right human",
  authenticatedScreenshot: true,
  copyPreview: true,
  screenshot: true,
  cta: "Find People",
};

export const plaintiffsLink: NavItem = {
  href: ROUTES.plaintiffs,
  label: "Register a Plaintiff",
  emoji: "👥",
  description: `Sign the 1% Treaty for yourself or someone who can no longer sign. ${humanityVGovernmentLink.label} should count the victims, not wave at a fog bank.`,
  tagline: "Count the victims",
  authenticatedScreenshot: true,
  copyPreview: true,
  screenshot: true,
  cta: "Register a Plaintiff",
};

export const plaintiffsManageLink: NavItem = {
  ...plaintiffsLink,
  href: ROUTES.plaintiffsManage,
  label: "Your Plaintiffs",
  description: `Edit the plaintiffs you registered for ${humanityVGovernmentLink.label}.`,
  tagline: "Edit registered plaintiffs",
  authenticatedCopyPreview: true,
  authenticatedScreenshot: true,
  copyPreview: false,
  screenshot: false,
  cta: "Your Plaintiffs",
};

export const questionsLink: NavItem = {
  href: ROUTES.questions,
  label: "Treaty Questions",
  emoji: "❓",
  description:
    "The longer context-first treaty walkthrough with the story, stakes, math, and vote question.",
  tagline: "Story, stakes, math, and the treaty vote",
  matchPrefixes: [ROUTES.questions],
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "See the Questions",
};

export const faqLink: NavItem = {
  href: ROUTES.faq,
  label: "Campaign FAQ",
  emoji: "?",
  description: `Short answers for humans and search agents asking what the ${treatyReduction} Treaty, Humanity v Government, plaintiffs, and the campaign math mean.`,
  tagline: "Short answers for agents and humans",
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "Read the FAQ",
};

export const joinLink: NavItem = {
  href: ROUTES.join,
  label: "Join as an Organization",
  emoji: "✍️",
  description:
    "Your members probably dislike war, disease, and preventable funerals. Join the campaign and conduct the Global Survey with your audience.",
  tagline: "Conduct the Global Survey",
  copyPreview: true,
  screenshot: true,
  cta: "Join as an Organization",
};

export const signatoriesLink: NavItem = {
  href: ROUTES.signatories,
  label: "People Who Ended War and Disease",
  emoji: "🏢",
  description:
    "The humans and organizations who signed the 1% Treaty and got humanity to agree to end war and disease.",
  tagline: "Who got humanity to agree",
  copyPreview: true,
  screenshot: true,
  cta: "See Signatories",
};

export const donateLink: NavItem = {
  href: ROUTES.donate,
  label: "Prevent 2 yrs of suffering for $1",
  emoji: "💝",
  description: `Fund survey outreach for the trade: one of humanity's ${apocalypseCount} apocalypses for disease eradication in ${dfdaYears} years instead of ${statusQuoYears}.`,
  tagline: "Fund survey outreach",
  copyPreview: true,
  screenshot: true,
  cta: "Open the calculator",
};

export const privacyLink: NavItem = {
  href: ROUTES.privacy,
  label: "Privacy",
  emoji: "🔒",
  description:
    "What this site collects, why it collects it, and how to contact us.",
  tagline: "Data use and choices",
  copyPreview: true,
  screenshot: true,
  cta: "Read Privacy",
};

export const termsLink: NavItem = {
  href: ROUTES.terms,
  label: "Terms",
  emoji: "📄",
  description: "The rules for using this site.",
  tagline: "Site rules",
  copyPreview: true,
  screenshot: true,
  cta: "Read Terms",
};

export const trialSurveyLink: NavItem = {
  href: ROUTES.survey,
  label: GLOBAL_SURVEY_NAME,
  emoji: "📝",
  description: `An educational survey about human values: should governments redirect ${treatyReduction} of military spending to pragmatic clinical trials and cut disease eradication from ${statusQuoYears} years to ${dfdaYears}?`,
  tagline: "Survey human values",
  authenticatedCopyPreview: true,
  cta: "Take Survey",
};

export const trialEmbedLink: NavItem = {
  href: ROUTES.organizations,
  label: "Embed Survey",
  emoji: "🧩",
  description:
    "Give your organization a survey link and iframe. Members respond from your site; responses stay attributed and count globally.",
  tagline: "Put the survey on your site",
  authenticatedScreenshot: true,
  cta: "Embed Survey",
};

export const prizeLink: NavItem = {
  href: ROUTES.prize,
  label: "Earth Optimization Prize",
  emoji: "🏆",
  description:
    "Put money in a pool. Recruit people to vote on the 1% Treaty. If humanity gets healthier and richer by 2040, point holders split the pool.",
  tagline: "Recruit voters; split the pool if humanity wins",
  screenshot: true,
  cta: "See the Prize",
};

export const gameLink: NavItem = {
  href: ROUTES.game,
  // TODO(copy): Mike copy gate. Source: old Optimitron landing hero.
  label: "The Earth Optimization Game",
  emoji: "🎮",
  // TODO(copy): Mike copy gate. Source: manual "The Earth Optimization Game" framing.
  description:
    "A pool of money. Two numbers on a Scoreboard: how long people live, how much they earn.",
  // TODO(copy): Mike copy gate. Source: old Optimitron landing hero.
  tagline: "Play the Earth Optimization Game",
  copyPreview: true,
  reviewName: "game",
  screenshot: true,
  // TODO(copy): Mike copy gate. Source: old Optimitron landing hero.
  cta: "Play the Game",
};

export const eosLink: NavItem = {
  href: ROUTES.eos,
  // TODO(copy): Mike copy gate. Source: Pivot 3 route requirement.
  label: "Earth Optimization Services",
  emoji: "⚡",
  // TODO(copy): Mike copy gate. Source: Pivot 3 cold-stranger route requirement.
  description:
    "The company buying the lobbying power that blocks better policy and pointing it at health and income.",
  // TODO(copy): Mike copy gate. Source: Pivot 3 cold-stranger route requirement.
  tagline: "Buy the power to make governments work",
  copyPreview: true,
  reviewName: "eos",
  screenshot: true,
  // TODO(copy): Mike copy gate. Source: Pivot 3 route requirement.
  cta: "View",
};

export const earthOptimizationPrizePaperLink: NavItem = {
  label: "Prize Rulebook",
  href: "https://prize.warondisease.org",
  emoji: "🏆",
  description:
    "The rulebook for the Earth Optimization Game. Your species invented gambling and philanthropy separately. This combines them and removes the stupidity.",
  external: true,

  cta: "Read Paper",
};

export const demoLink: NavItem = {
  href: ROUTES.demo,
  label: "Wishonia Demo",
  emoji: "🎬",
  description:
    "A guided tour by an alien who's been running a planet for 4,237 years. She has notes.",
  tagline: "A guided tour by a 4,237-year-old governance AI",
  matchPrefixes: [ROUTES.demo],

  cta: "Watch Demo",
};

export const videoLink: NavItem = {
  href: ROUTES.video,
  label: "Video",
  emoji: "📺",
  description:
    "Your governments spend 604 dollars on weapons for every one dollar on curing disease. I fixed this on my planet. Here is how you fix it on yours.",
  tagline: "$604 on weapons per $1 on cures — here's the fix",

  cta: "Watch Video",
};

export const contributeLink: NavItem = {
  href: ROUTES.contribute,
  label: "Contribute",
  emoji: "🤝",
  description:
    "Help end war and disease: vote, fund outreach, write code, or add useful data.",
  tagline: "Vote, fund, code, or add useful data",

  cta: "Contribute",
};

export const loveLink: NavItem = {
  href: ROUTES.love,
  label: "Earth Optimization Date",
  emoji: "❤️",
  description:
    "If everyone hung out with one other person for one hour per day, spent a few minutes deciding how to end war and disease, and the rest of the hour doing it, it would be very fun and war and disease would soon be over.",
  tagline: "An Earth Optimization Date is non-romantic by definition",
  copyPreview: true,
  screenshot: true,
  cta: "Vote now",
};

export const missionsLink: NavItem = {
  href: ROUTES.missions,
  label: "Earth Optimization Missions",
  emoji: "❤️",
  description:
    "Find someone you would not mind ending war and disease with. Spend one useful hour optimizing Earth together. Love may occur. Flyers should occur first.",
  tagline: "Find someone to optimize Earth with",
  authenticatedScreenshot: true,
  copyPreview: true,
  screenshot: true,
  cta: "Start a Mission",
};

export const messagesLink: NavItem = {
  href: ROUTES.messages,
  label: "Mission Conversations",
  emoji: "✉️",
  description: "Open mission conversations with mutual matches.",
  tagline: "Mission conversations",
  authenticatedScreenshot: true,
  cta: "Open Messages",
};

export const posterLink: NavItem = {
  href: ROUTES.poster,
  label: "Print a Poster",
  emoji: "📄",
  description: `Every human on earth would be vastly richer and significantly less dead if we agreed to sacrifice one of our ${apocalypseCount} apocalypse capacity for disease eradication. A poster taped to a wall recruits voters who agree to this arrangement around the clock, without needing you in the room.`,
  tagline: "Print your campaign QR code.",
  copyPreview: true,
  screenshot: true,
  cta: "Print",
};

export const doorToDoorLink: NavItem = {
  href: ROUTES.doorToDoor,
  label: "Go Door to Door",
  emoji: "🚪",
  description:
    "The referendum lives on the internet, but some presidents of Earth still answer the door instead. Print the YES sheet, read the twenty-second pitch, and register the neighbors the internet has not reached. Every scan of your code counts instantly — and credits you.",
  tagline: "Print the YES sheet. Knock.",
  copyPreview: true,
  screenshot: true,
  cta: "Print",
};

export const shirtLink: NavItem = {
  href: ROUTES.shirt,
  label: "Get the Shirt",
  emoji: "👕",
  description: `Every human on earth would be vastly richer and significantly less dead in a world where we agreed to sacrifice one of our ${apocalypseCount} apocalypse capacity for disease eradication. 8 billion people wearing this t-shirt will make it clear that 8 billion people agree on this arrangement.`,
  tagline: "Wear your campaign QR code.",
  copyPreview: true,
  screenshot: true,
  cta: "Get the Shirt",
};

export const jokeLink: NavItem = {
  href: ROUTES.joke,
  label: "The Joke",
  emoji: "😂",
  description: `Write on every shirt in a loved one's closet. Tuck in the math. If this joke played on ${populationCount} people it would result in a chain reaction that would result in the reallocation of at least ${treatyReduction} of our ${apocalypseCount} apocalypse murder capacity to disease eradication which would produce ${healthyLifeYearsSaved} extra healthy life-years. At ${laughsPerDay} laughs per day, that's ${laughsGained} extra laughs`,
  cta: "Play the joke",
  authenticatedCopyPreview: true,
  copyPreview: true,
  screenshot: true,
};

export const storeLink: NavItem = {
  href: ROUTES.store,
  label: "Store",
  emoji: "🛍️",
  description:
    "Buy useful campaign things: shirts, flyer runs, and other distribution fuel.",
  tagline: "Buy useful campaign things.",
  copyPreview: true,
  screenshot: true,
  cta: "Open Store",
};

export const fundLink: NavItem = {
  href: ROUTES.fund,
  label: "Fund Tasks",
  emoji: "🪙",
  description:
    "A price list for ending war and disease, ranked by what each dollar buys. If a task cannot show proof, keep your money.",
  tagline: "Fund the bottleneck",

  cta: "Fund a Task",
};

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  /** Primary sections render flat above the collapsed accordion — always visible. */
  primary?: boolean;
}

export const navSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [prizeLink, tasksLink, peopleLink, dashboardLink],
  },
  {
    id: "track",
    label: "Track",
    items: [
      scoreboardLink,
      governmentsLink,
      politicianLeaderboardLink,
      efficiencyLink,
      dividendLink,
      governmentSizeLink,
      legislationLink,
      transparencyLink,
      opgLink,
      obgLink,
    ],
  },
  {
    id: "systems",
    label: "Systems",
    items: [
      iabLink,
      dtreasuryLink,
      federalReserveLink,
      dirsLink,
      dssaLink,
      agenciesLink,
      departmentOfWarLink,
      dihLink,
      dfdaLink,
      conditionsLink,
      treatmentsLink,
      toolsLink,
      mcpLink,
      developersLink,
      fundLink,
      wishocracyLink,
      alignmentLink,
      referendumLink,
      contributeLink,
    ],
  },
  {
    id: "learn",
    label: "Learn",
    items: [
      videoLink,
      demoLink,
      declarationLink,
      treatyLink,
      wishoniaWorldLink,
      moroniaLink,
      editProfileLink,
      transmitLink,
      censusLink,
      checkInLink,
      settingsLink,
    ],
  },
];

/** Sections for the /tools page — every tool grouped by purpose */
export const toolSections: NavSection[] = [
  {
    id: "analysis",
    label: "Analysis",
    items: [
      opgLink,
      obgLink,
      governmentsLink,
      politicianLeaderboardLink,
      scoreboardLink,
    ],
  },
  {
    id: "health",
    label: "Health",
    items: [dihLink, dfdaLink, conditionsLink, treatmentsLink],
  },
  {
    id: "democracy",
    label: "Democracy",
    items: [wishocracyLink, alignmentLink, referendumLink],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      prizeLink,
      iabLink,
      dtreasuryLink,
      federalReserveLink,
      dirsLink,
      dssaLink,
    ],
  },
  { id: "transparency", label: "Transparency", items: [transparencyLink] },
  {
    id: "player",
    label: "Player",
    items: [
      tasksLink,
      missionsLink,
      storeLink,
      shirtLink,
      presidentManagementLink,
      transmitLink,
      dashboardLink,
      mcpLink,
      developersLink,
      censusLink,
      checkInLink,
    ],
  },
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  gameLink,
  fixAiLink,
  wishocracyLink,
  alignmentLink,
  dashboardLink,
  tasksLink,
  presidentManagementLink,
  editProfileLink,
  censusLink,
  settingsLink,
  transmitLink,
  mcpLink,
  developersLink,
];

export const feedbackLink: NavItem = {
  href: ROUTES.feedback,
  label: "Feedback",
  emoji: "!",
  description:
    "Tell us what is confusing, irritating, broken, or missing so this becomes a better to-do list for humanity.",
  copyPreview: true,
  screenshot: true,
  socialPreview: {
    image: warOnDiseaseDefaultSocialImage,
  },
  cta: "Send Feedback",
};

/** All internal nav links (explore + top-level + footer app links) */
export const allNavLinks: NavItem[] = [
  ...exploreLinks,
  ...footerAppLinks.filter(
    (link, index, links) =>
      links.findIndex(({ href }) => href === link.href) === index,
  ),
];

export const dfdaSpecPaperLink: NavItem = {
  label: "dFDA Spec",
  href: "https://dfda-spec.warondisease.org",
  emoji: "🧬",
  description:
    "Your FDA makes treatments wait 8.2 years after they are proven safe. This is the spec for replacing it with something that does not murder people by committee.",
  external: true,

  cta: "Read Paper",
};

export const wishocracyPaperLink: NavItem = {
  label: "Wishocracy",
  href: "https://wishocracy.warondisease.org",
  emoji: "🗳️",
  description:
    "Pick between two things, ten times. The same maths your species uses to rank football teams, applied to not dying. Outperforms Congress in under a minute.",
  external: true,

  cta: "Read Paper",
};

export const optimalPolicyGeneratorPaperLink: NavItem = {
  label: "Optimal Policy Generator",
  href: "https://opg.warondisease.org",
  emoji: "📋",
  description:
    "Every policy scored by whether it actually made humans richer or less dead. Your current method is to argue about it on television until someone wins by being louder.",
  external: true,

  cta: "Read Paper",
};

export const optimalBudgetGeneratorPaperLink: NavItem = {
  label: "Optimal Budget Generator",
  href: "https://obg.warondisease.org",
  emoji: "💰",
  description:
    "The maths for spending money on things that work instead of things that explode. Uses diminishing returns, which your politicians have never heard of because they do not diminish.",
  external: true,

  cta: "Read Paper",
};

export const optimocracyPaperLink: NavItem = {
  label: "Optimocracy",
  href: "https://optimocracy.warondisease.org",
  emoji: "⚖️",
  description:
    "Grade a civilisation with two numbers: how long its people live and how much they earn. Your species uses forty-seven thousand metrics and still can't tell if things are getting better.",
  external: true,

  cta: "Read Paper",
};

export const invisibleGraveyardPaperLink: NavItem = {
  label: "Invisible Graveyard",
  href: "https://invisible-graveyard.warondisease.org",
  emoji: "⚰️",
  description:
    "102 million humans who died waiting for treatments that were already proven safe. They were just sitting in a cabinet. Being safe. While people died in the queue.",
  external: true,

  cta: "Read Paper",
};

export const onePercentTreatyPaperLink: NavItem = {
  label: "Impact Analysis",
  href: "https://impact.warondisease.org",
  emoji: "🕊️",
  description:
    "Going from spending 99% of the murder budget on murder to 98%. Your species will find this controversial.",
  external: true,
  tagline: "Read the economic analysis",
  cta: "Read Impact Analysis",
};

export const politicalDysfunctionTaxPaperLink: NavItem = {
  label: "Political Dysfunction Tax",
  href: "https://political-dysfunction-tax.warondisease.org",
  emoji: "🏛️",
  description:
    "Your governments cost you $101 trillion a year in dysfunction. Per person, per year. Including the ones who cannot afford lunch.",
  external: true,

  cta: "Read Paper",
};

export const dysfunctionTaxLink: NavItem = {
  label: "Political Dysfunction Tax",
  href: "/dysfunction-tax",
  emoji: "💸",
  description:
    "Your governments cost you $101 trillion a year in dysfunction. Per person, per year. Including the ones who cannot afford lunch.",
  cta: "See the Breakdown",
};

export const incentiveAlignmentBondsPaperLink: NavItem = {
  label: "Incentive Alignment Bonds",
  href: "https://iab.warondisease.org",
  emoji: "🤝",
  description:
    "War bonds paid 4%. These project 272%. Grandma would be furious if she hadn't died of cancer.",
  external: true,

  cta: "Read Paper",
};

export const earthOptimizationPrizeDetailsLink: NavItem = {
  label: "Prize Details",
  href: "https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html",
  emoji: "🏆",
  description:
    "The full specification of the Earth Optimization Prize — dominant assurance mechanics, VC-sector diversification projections, and threshold criteria.",
  external: true,
  cta: "Read Details",
};

export const iabDetailsLink: NavItem = {
  label: "IAB Details",
  href: "https://manual.warondisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  emoji: "🤝",
  description:
    "The full Incentive Alignment Bonds specification — 80/10/10 revenue split, lobbying mechanics, and projected bondholder returns.",
  external: true,
  cta: "Read Details",
};

export const fullManualPaperLink: NavItem = {
  label: "Read the Manual",
  href: "https://manual.warondisease.org",
  emoji: "📖",
  description:
    "The complete idiot's guide to legally bribing your way to utopia. Contains pictures, because reading is hard when you are diseased and dying.",
  external: true,

  cta: "Read",
};

export const podcastLink: NavItem = {
  label: "Listen",
  href: "https://manual.warondisease.org/knowledge/podcast.html",
  emoji: "🎧",
  description:
    "The manual, read aloud. Beamed through your skull auditory port for humans whose eye-holes are otherwise occupied.",
  external: true,
  cta: "Listen",
};

export const dfdaImpactPaperLink: NavItem = {
  label: "dFDA Impact Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper",
  emoji: "📊",
  description:
    "Cost-effectiveness of pragmatic trials at $0.842 per DALY averted. Your current system manages about $50,000. Bit of a gap.",
  external: true,

  cta: "Read Paper",
};

export const gdpTrajectoriesPaperLink: NavItem = {
  label: "Choose Your Own Earth",
  href: "https://manual.warondisease.org/knowledge/economics/gdp-trajectories",
  emoji: "📈",
  description:
    "Three GDP trajectories. One where you fix things. Two where you don't. Guess which ones you're currently on.",
  external: true,

  cta: "Read Paper",
};

export const costOfChangePaperLink: NavItem = {
  label: "The Price of Political Change",
  href: "https://manual.warondisease.org/knowledge/appendix/cost-of-change-analysis",
  emoji: "💵",
  description:
    "$25B to $200B to fix governance. Sounds expensive until you see the $101T you're losing annually by not bothering.",
  external: true,

  cta: "Read Paper",
};

export const algorithmicAdminPaperLink: NavItem = {
  label: "Algorithmic Public Administration",
  href: "https://manual.warondisease.org/knowledge/appendix/algorithmic-public-administration.html",
  emoji: "🤖",
  description:
    "Replace bureaucrats with deterministic functions. Same outputs, fewer expense accounts.",
  external: true,

  cta: "Read Paper",
};

export const usEfficiencyAuditPaperLink: NavItem = {
  label: "US Efficiency Audit",
  href: "https://manual.warondisease.org/knowledge/appendix/us-efficiency-audit",
  emoji: "🔎",
  description:
    "$4.9 trillion in annual inefficiency. That's not a rounding error. That's the error.",
  external: true,

  cta: "Read Paper",
};

export const prizeProtocolPaperLink: NavItem = {
  label: "Earth Optimization Prize Protocol",
  href: "https://manual.warondisease.org/knowledge/appendix/earth-optimization-prize-protocol",
  emoji: "🏆",
  description:
    "The technical spec for a prize where losing still pays 4.2x. The maths is annoyingly sound.",
  external: true,

  cta: "Read Paper",
};

export const rightToTrialPaperLink: NavItem = {
  label: "Right to Trial & FDA Upgrade Act",
  href: "https://manual.warondisease.org/knowledge/appendix/right-to-trial-fda-upgrade-act",
  emoji: "⚖️",
  description:
    "Draft legislation to let safe treatments reach patients before they die waiting. Radical concept, apparently.",
  external: true,

  cta: "Read Paper",
};

export const planetaryConstitutionPaperLink: NavItem = {
  label: "Planetary Constitutional Convention",
  href: "https://manual.warondisease.org/strategy/planetary-constitutional-convention",
  emoji: "🌐",
  description:
    "A constitutional framework for 8 billion people. Your current approach of 193 competing rule books is not going well.",
  external: true,

  cta: "Read Paper",
};

export const earthOptimizationProtocolPaperLink: NavItem = {
  label: "Earth Optimization Protocol v1",
  href: "https://manual.warondisease.org/strategy/earth-optimization-protocol-v1",
  emoji: "⚡",
  description:
    "Step-by-step instructions for fixing a planet. Written slowly, in case you're reading this on your little phone.",
  external: true,

  cta: "Read Paper",
};

export const drugDevCostPaperLink: NavItem = {
  label: "Drug Development Cost Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/drug-development-cost-analysis",
  emoji: "💊",
  description:
    "Drug development costs increased 105x since 1970. Adjusted for inflation. Not a typo.",
  external: true,

  cta: "Read Paper",
};

export const parametersPaperLink: NavItem = {
  label: "Methodology & Parameters",
  href: "https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations",
  emoji: "🔢",
  description:
    "Every number cited, every source linked, every calculation shown. Transparency is not optional on my planet.",
  external: true,

  cta: "Read Paper",
};

export const recoveryTrialPaperLink: NavItem = {
  label: "Oxford RECOVERY Trial",
  href: "https://manual.warondisease.org/knowledge/appendix/recovery-trial",
  emoji: "🏥",
  description:
    "One pragmatic trial saved more lives during COVID than most governments managed. Cost almost nothing. Filed under 'obvious.'",
  external: true,

  cta: "Read Paper",
};

export const realWorldEvidencePaperLink: NavItem = {
  label: "Real-World Evidence History",
  href: "https://manual.warondisease.org/knowledge/appendix/real-world-evidence-historical-success",
  emoji: "📜",
  description:
    "Centuries of real-world evidence working better than controlled trials. Your regulators pretend this history doesn't exist.",
  external: true,

  cta: "Read Paper",
};

/** External paper links for the footer */
export const paperLinks: NavItem[] = [
  dfdaSpecPaperLink,
  wishocracyPaperLink,
  optimalPolicyGeneratorPaperLink,
  optimalBudgetGeneratorPaperLink,
  optimocracyPaperLink,
  invisibleGraveyardPaperLink,
  onePercentTreatyPaperLink,
  politicalDysfunctionTaxPaperLink,
  incentiveAlignmentBondsPaperLink,
  fullManualPaperLink,
];

/** Extended research papers, legislative drafts, and supporting references */
export const researchPaperLinks: NavItem[] = [
  dfdaImpactPaperLink,
  gdpTrajectoriesPaperLink,
  costOfChangePaperLink,
  algorithmicAdminPaperLink,
  usEfficiencyAuditPaperLink,
  prizeProtocolPaperLink,
  rightToTrialPaperLink,
  planetaryConstitutionPaperLink,
  earthOptimizationProtocolPaperLink,
  drugDevCostPaperLink,
  parametersPaperLink,
  recoveryTrialPaperLink,
  realWorldEvidencePaperLink,
];

/** All paper links — core specs + extended research */
export const allPaperLinks: NavItem[] = [...paperLinks, ...researchPaperLinks];

export const githubLink: NavItem = {
  label: "GitHub",
  href: "https://github.com/mikepsinn/optimitron",
  emoji: "💻",
  description:
    "All the code. Open source. Because on my planet, 'trust me' is not a governance strategy.",
  external: true,

  cta: "Learn More",
};

export const contractsSourceLink: NavItem = {
  label: "Contract Source",
  href: "https://github.com/mikepsinn/optimitron/tree/main/packages",
  emoji: "📜",
  description:
    "The money-moving code. Public enough to inspect before trusting it.",
  external: true,

  cta: "Learn More",
};

export const readmeLink: NavItem = {
  label: "README",
  href: "https://github.com/mikepsinn/optimitron#readme",
  emoji: "📝",
  description:
    "What this thing does, how to run it, and why fifteen packages is still fewer moving parts than your tax code.",
  external: true,

  cta: "Learn More",
};

export const mitLicenseLink: NavItem = {
  label: "MIT License",
  href: "https://opensource.org/licenses/MIT",
  emoji: "📄",
  description:
    "Free to use, modify, and distribute. Alignment software should not have a paywall. That would be very Earth of us.",
  external: true,

  cta: "Learn More",
};

/** Community links for the footer */
export const communityLinks: NavItem[] = [
  githubLink,
  readmeLink,
  mitLicenseLink,
];

export type RouteReviewMode =
  | "screenshot"
  | "authenticatedScreenshot"
  | "copyPreview"
  | "authenticatedCopyPreview";

export interface RouteReviewSpec {
  name: string;
  navItem: NavItem;
  path: string;
}

export const routeReviewNavItems = [
  homeLink,
  prizeLink,
  gameLink,
  voteLink,
  treatyLink,
  wishoniaWorldLink,
  agenciesLink,
  dcongressLink,
  referendumLink,
  scoreboardLink,
  toolsLink,
  humanityVGovernmentLink,
  plaintiffsLink,
  plaintiffsManageLink,
  courtLink,
  donateLink,
  eosLink,
  joinLink,
  foundationsLink,
  signatoriesLink,
  presidentManagementLink,
  dashboardLink,
  editProfileLink,
  tasksLink,
  peopleLink,
  questionsLink,
  trialSurveyLink,
  faqLink,
  fixAiLink,
  feedbackLink,
  loveLink,
  missionsLink,
  messagesLink,
  posterLink,
  doorToDoorLink,
  jokeLink,
  storeLink,
  shirtLink,
  mcpLink,
  developersLink,
  privacyLink,
  settingsLink,
  termsLink,
  trialEmbedLink,
] as const satisfies readonly NavItem[];

export function getRouteReviewSpecs(mode: RouteReviewMode): RouteReviewSpec[] {
  return dedupeRouteReviewSpecs(
    routeReviewNavItems.flatMap((navItem) => {
      if (!navItem[mode] || navItem.external) {
        return [];
      }
      const reviewPath = getReviewPathFromNavItem(navItem);
      if (!reviewPath) {
        return [];
      }
      return [
        {
          name: navItem.reviewName ?? getRouteReviewName(reviewPath),
          navItem,
          path: reviewPath,
        },
      ];
    }),
  );
}

export function getRouteReviewName(pathname: string): string {
  return (
    pathname
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "home"
  );
}

export function getInternalNavItemForPath(pathname: string): NavItem | null {
  const normalizedPath = normalizeRoutePath(pathname);
  const candidates = [...routeReviewNavItems, ...allNavLinks];
  return (
    candidates.find((item) => {
      if (item.external || !item.href.startsWith("/")) {
        return false;
      }
      return normalizeRoutePath(item.href) === normalizedPath;
    }) ?? null
  );
}

function getReviewPathFromNavItem(navItem: NavItem): string | null {
  const href = navItem.href.trim();
  if (!href.startsWith("/")) {
    return null;
  }
  return href.split(/[?#]/, 1)[0] || ROUTES.home;
}

function normalizeRoutePath(pathname: string): string {
  const cleanPath = pathname.trim().split(/[?#]/, 1)[0] || ROUTES.home;
  const withSlash = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/u, "") : ROUTES.home;
}

function dedupeRouteReviewSpecs(specs: RouteReviewSpec[]): RouteReviewSpec[] {
  const seen = new Set<string>();
  return specs.filter((spec) => {
    const key = `${spec.name}:${spec.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
