import { slugify } from "@/lib/slugify";
import {
  fmtParam,
  DFDA_TRIAL_COST_REDUCTION_FACTOR,
  DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER,
  IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PRIZE_POOL_HORIZON_MULTIPLE,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
} from "@optimitron/data/parameters";
import {
  AGENCIES,
  WISHONIA_AGENCIES,
} from "@optimitron/data/datasets/wishonia-agencies";
// Precompute for descriptions (same pattern as demo-script.ts)
const costReduction = Math.round(DFDA_TRIAL_COST_REDUCTION_FACTOR.value);
const speedup = Math.round(DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER.value);
const iabLobbyRatio = Math.round(IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT.value);
const milToTrialRatio = Math.round(
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value,
);
const bondReturn = fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT);
const poolMultiple = `${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x`;
const wishoniaAgencyCount = WISHONIA_AGENCIES.length;

export const ROUTES = {
  home: "/",
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
  why: "/why",
  legal: "/legal",
  privacy: "/privacy",
  terms: "/terms",
  impact: "/impact",
  endorse: "/endorse",
  signatories: "/signatories",
  campaign: "/campaign",
  coalition: "/coalition",
  organizations: "/organizations",
  people: "/people",
  peopleManage: "/people/manage",
  plaintiffs: "/plaintiffs",
  plaintiffsManage: "/plaintiffs/manage",
  questions: "/questions",
  survey: "/survey",
  // The Game
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
  about: "/about",
  declaration: "/declaration",
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
}

export const homeLink: NavItem = {
  href: ROUTES.home,
  label: "Home",
  emoji: "",
  description: "Primary public landing page.",
  tagline: "Primary public landing page",
  copyPreview: true,
  reviewName: "home",
  screenshot: true,
  cta: "Go Home",
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

export function getOrganizationPath(id: string): string {
  return `${ROUTES.organizations}/${id}`;
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
  emoji: "📋",
  description: AGENCIES.dcbo.description,
  tagline: AGENCIES.dcbo.tagline,
  cta: "See Policy Grades",
};

export const obgLink: NavItem = {
  href: ROUTES.obg,
  label: AGENCIES.domb.dName,
  emoji: "💰",
  description: AGENCIES.domb.description,
  tagline: AGENCIES.domb.tagline,
  cta: "See Budget Analysis",
};

export const dihLink: NavItem = {
  href: ROUTES.dih,
  label: AGENCIES.dih.dName,
  emoji: "🧬",
  description:
    "Create and fund disease-focused institutes by what humans actually need cured.",
  tagline: "Fund institutes for diseases humans need cured",
  matchPrefixes: [ROUTES.dih],
  cta: "Open DIH",
};

export const dfdaLink: NavItem = {
  href: ROUTES.dfda,
  label: AGENCIES.dfda.dName,
  emoji: "💊",
  description:
    "Compare conditions, treatments, trials, and outcomes before the brochure wins.",
  tagline: "Compare treatments by outcomes",
  matchPrefixes: [ROUTES.dfda],
  cta: "Open DFDA",
};

export const conditionsLink: NavItem = {
  href: ROUTES.conditions,
  label: "Conditions",
  emoji: "🩺",
  description:
    "Browse medical conditions and the evidence attached to treatments and clinical trials.",
  tagline: "Browse conditions and treatment evidence",
  matchPrefixes: [ROUTES.conditions, "/conditions"],
  cta: "Browse Conditions",
};

export const treatmentsLink: NavItem = {
  href: ROUTES.treatments,
  label: "Treatments",
  emoji: "💊",
  description:
    "Compare treatments across conditions by trials, participants, effectiveness, and safety.",
  tagline: "Compare treatments across conditions",
  matchPrefixes: [ROUTES.treatments, "/treatments"],
  cta: "Browse Treatments",
};

export const dtreasuryLink: NavItem = {
  href: ROUTES.dtreasury,
  label: AGENCIES.dtreasury.dName,
  emoji: "💸",
  description: AGENCIES.dtreasury.description,
  tagline: AGENCIES.dtreasury.tagline,
  matchPrefixes: [ROUTES.dtreasury],

  cta: "Explore Treasury",
};

export const federalReserveLink: NavItem = {
  href: ROUTES.dtreasuryDfed,
  label: AGENCIES.dfed.dName,
  emoji: "🏦",
  description: AGENCIES.dfed.description,
  tagline: AGENCIES.dfed.tagline,

  cta: "Learn More",
};

export const dirsLink: NavItem = {
  href: ROUTES.dtreasuryDirs,
  label: AGENCIES.dirs.dName,
  emoji: "🏦",
  description: AGENCIES.dirs.description,
  tagline: AGENCIES.dirs.tagline,

  cta: "Learn More",
};

export const dssaLink: NavItem = {
  href: ROUTES.dtreasuryDssa,
  label: AGENCIES.dssa.dName,
  emoji: "🍞",
  description: AGENCIES.dssa.description,
  tagline: AGENCIES.dssa.tagline,

  cta: "Learn More",
};

export const departmentOfWarLink: NavItem = {
  href: ROUTES.ddod,
  label: AGENCIES.ddod.dName,
  emoji: "💀",
  description: AGENCIES.ddod.description,
  tagline: AGENCIES.ddod.tagline,

  cta: "Learn More",
};

export const referendumLink: NavItem = {
  href: ROUTES.referendum,
  label: "Referendums",
  emoji: "🗳️",
  description:
    "Vote on things that matter. Prove you're human. Skip the middleman who was going to ignore you anyway.",
  tagline: "Vote on things that matter — skip the middleman",
  matchPrefixes: [ROUTES.referendum],

  cta: "Vote Now",
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
  label: "Alignment",
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
    "Invite humans to vote on the 1% Treaty and track who still needs a reminder.",
  tagline: "Copy your voting link and coordinate reminders",
  authenticatedCopyPreview: true,
  authenticatedScreenshot: true,
  cta: "Manage Humanity",
};

export const tasksLink: NavItem = {
  href: ROUTES.tasks,
  label: "Tasks",
  emoji: "🎯",
  description:
    "Find public tasks that move health, income, and treaty adoption. Claim one or remind the person responsible.",
  tagline: "Claim tasks or remind the person responsible",
  authenticatedScreenshot: true,
  copyPreview: true,
  reviewName: "tasks-index",
  screenshot: true,
  cta: "Open Tasks",
};

export const presidentManagementLink: NavItem = {
  href: ROUTES.employees,
  label: "Remind Presidents",
  emoji: "🪪",
  description:
    "You give these people $37 trillion a year to promote the general welfare. Track who signed the 1% Treaty and remind the overdue ones.",
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

export const profileLink: NavItem = {
  href: ROUTES.profile,
  label: "Profile",
  emoji: "🧭",
  description: "Your name, face, public profile, and connected accounts.",
  tagline: "Your name, your face, your connected accounts",

  cta: "View Profile",
};

export const declarationLink: NavItem = {
  href: ROUTES.declaration,
  label: "Declaration",
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
  description: "Help one human vote on the 1% Treaty.",
  tagline: "Help someone vote",
  cta: "Invite",
};

export const transparencyLink: NavItem = {
  href: ROUTES.dgao,
  label: AGENCIES.dgao.dName,
  emoji: "🔍",
  description: AGENCIES.dgao.description,
  tagline: AGENCIES.dgao.tagline,
  matchPrefixes: [ROUTES.dgao],

  cta: "View Audit",
};

export const toolsLink: NavItem = {
  href: ROUTES.tools,
  label: "Tools",
  emoji: "🧰",
  description:
    "Free tools for voting, evidence, budgets, policy, outreach, and task tracking.",
  tagline: "Free tools for votes, tasks, budgets, and evidence",
  matchPrefixes: [ROUTES.tools],
  screenshot: true,

  cta: "Open Tools",
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
  label: "Dividend",
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
    "A size-and-composition check on the state itself. Not just how much it spends, but how the whole machine is proportioned.",
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
  emoji: "🕹️",
  description:
    "Two numbers: how long you live without disease and how much a normal person earns. Not GDP. Not billionaire wealth. The median. Everything else on this site exists to move these two numbers up.",
  tagline: "Two numbers: disease-free lifespan and median income",
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
  description:
    "The full text of the treaty that redirects 1% of military spending to clinical trials. Read it, sign it, share it. Every signature from an official account is verified on the public ledger.",
  tagline: "Read it, sign it, share it",
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
    "Join the public jury and plaintiff class for government harm. If a government kills, injures, imprisons, or ruins your family, humanity should be able to hear the case.",
  tagline: "Public jury for government harm",
  copyPreview: true,
  screenshot: true,
  cta: "Join the Court",
};

export const HUMANITY_V_GOVERNMENT_MANUAL_URL =
  "https://manual.warondisease.org/knowledge/appendix/humanity-v-government.html";

export const NONPROFIT_COALITION_STRATEGY_URL =
  "https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy";

export const humanityVGovernmentLink: NavItem = {
  href: ROUTES.humanityVGovernment,
  label: "Humanity v. Government",
  emoji: "⚖️",
  description:
    "Governments were hired to promote the general welfare. They chose war instead. Now there's a legal theory for that.",
  tagline: "The case against government harm",
  copyPreview: true,
  screenshot: true,
  cta: "Read the Case",
};

export const voteLink: NavItem = {
  href: ROUTES.vote,
  label: "Vote",
  emoji: "🗳️",
  description:
    "Answer the 1% Treaty question. Thirty seconds. Then give the next human their voting task.",
  tagline: "Answer the 1% Treaty question",
  matchPrefixes: [ROUTES.vote],
  copyPreview: true,
  screenshot: true,
  cta: "Vote Now",
};

export const peopleLink: NavItem = {
  href: ROUTES.people,
  label: "People",
  emoji: "👥",
  description:
    "1% Treaty work needs actual humans. Find people with public tasks and remind the right one.",
  tagline: "1% Treaty task coordination",
  authenticatedScreenshot: true,
  copyPreview: true,
  screenshot: true,
  cta: "Find People",
};

export const plaintiffsLink: NavItem = {
  href: ROUTES.plaintiffs,
  label: "Register a Plaintiff",
  emoji: "👥",
  description: `Sign the 1% Treaty for someone who can no longer sign it themselves, so they can be listed as a plaintiff in ${humanityVGovernmentLink.label}.`,
  tagline: "Register yourself or a deceased relative as a plaintiff",
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
  tagline: "Edit your plaintiffs",
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
  cta: "See the Questions",
};

export const whyLink: NavItem = {
  href: ROUTES.why,
  label: "Check the Math",
  emoji: "🧠",
  description:
    "The core numbers behind the 1% Treaty: disease, war spending, trial capacity, and why one apocalypse is enough to trade.",
  tagline: "The numbers behind the treaty",
  copyPreview: true,
  screenshot: true,
  cta: "Check the Math",
};

export const endorseLink: NavItem = {
  href: ROUTES.endorse,
  label: "Join as Organization",
  emoji: "✍️",
  description:
    "Join the International Campaign to End War and Disease as an organization.",
  tagline: "Join as an organization",
  copyPreview: true,
  screenshot: true,
  cta: "Join as Organization",
};

export const signatoriesLink: NavItem = {
  href: ROUTES.signatories,
  label: "Signatories",
  emoji: "🏢",
  description: "Organizations and humans publicly signed onto the 1% Treaty.",
  tagline: "See who signed",
  copyPreview: true,
  screenshot: true,
  cta: "See Signatories",
};

export const donateLink: NavItem = {
  href: ROUTES.donate,
  label: "Fund Campaign",
  emoji: "💝",
  description:
    "Use the calculator to buy expected lives saved or years of suffering prevented. Tax-deductible to a U.S. 501(c)(3).",
  tagline: "Fund the campaign",
  copyPreview: true,
  screenshot: true,
  cta: "Fund Campaign",
};

export const legalLink: NavItem = {
  href: ROUTES.legal,
  label: "Legal",
  emoji: "⚖️",
  description:
    "Legal notes for organizations reviewing nonpartisan treaty support.",
  tagline: "For organizations",
  copyPreview: true,
  cta: "Read Legal Notes",
};

export const privacyLink: NavItem = {
  href: ROUTES.privacy,
  label: "Privacy",
  emoji: "🔒",
  description:
    "What this site collects, why it collects it, and how to contact us.",
  tagline: "Data use and choices",
  copyPreview: true,
  cta: "Read Privacy",
};

export const termsLink: NavItem = {
  href: ROUTES.terms,
  label: "Terms",
  emoji: "📄",
  description: "The rules for using this site.",
  tagline: "Site rules",
  copyPreview: true,
  cta: "Read Terms",
};

export const trialSurveyLink: NavItem = {
  href: ROUTES.survey,
  label: "Take Survey",
  emoji: "📝",
  description:
    "Answer two questions about government funding for pragmatic clinical trials.",
  tagline: "Answer two survey questions",
  cta: "Take Survey",
};

export const trialEmbedLink: NavItem = {
  href: ROUTES.organizations,
  label: "Embed Survey",
  emoji: "🧩",
  description: "Get your organization's survey link and iframe code.",
  tagline: "Survey link and iframe code",
  authenticatedScreenshot: true,
  cta: "Embed Survey",
};

export const prizeLink: NavItem = {
  href: ROUTES.prize,
  label: "Prize",
  emoji: "🏆",
  description: `Fund the prize pool, recruit players, and get up to ${poolMultiple} back if the world misses the target.`,
  tagline: `Deposit, recruit, win or get ${poolMultiple} back`,
  cta: "Play the Game",
};

export const earthOptimizationPrizePaperLink: NavItem = {
  label: "Earth Optimization Prize",
  href: "https://prize.warondisease.org",
  emoji: "🏆",
  description:
    "A dominant assurance design combining philanthropy and game theory. Your species invented gambling and philanthropy separately. This is what happens when you combine them and remove the stupidity.",
  external: true,

  cta: "Read Paper",
};

export const aboutLink: NavItem = {
  href: ROUTES.about,
  label: "About",
  emoji: "ℹ️",
  description:
    "What this is, why it exists, and why an alien had to build it because your species wouldn't.",
  tagline: "What this is, why it exists, and why an alien built it",
  screenshot: true,

  cta: "Learn More",
};

export const demoLink: NavItem = {
  href: ROUTES.demo,
  label: "Demo",
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
    "Four useful ways to help: vote, fund, code, or add useful data.",
  tagline: "Vote, fund, code, or add useful data",

  cta: "Contribute",
};

export const fundLink: NavItem = {
  href: ROUTES.fund,
  label: "Fund Optimization",
  emoji: "🪙",
  description:
    "Insert coin. AI agents optimize Earth. See what your dollar did and where the money went.",
  tagline: "Insert coin, optimize Earth",

  cta: "Fund Now",
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
      aboutLink,
      videoLink,
      demoLink,
      declarationLink,
      treatyLink,
      wishoniaWorldLink,
      moroniaLink,
      profileLink,
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
      presidentManagementLink,
      transmitLink,
      dashboardLink,
      censusLink,
      checkInLink,
    ],
  },
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  dashboardLink,
  tasksLink,
  presidentManagementLink,
  profileLink,
  censusLink,
  settingsLink,
  transmitLink,
  aboutLink,
];

export const feedbackLink: NavItem = {
  href: ROUTES.feedback,
  label: "Feedback",
  emoji: "!",
  description:
    "Tell us what is confusing, irritating, broken, or missing so this becomes a better to-do list for humanity.",
  copyPreview: true,
  screenshot: true,
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
  label: "Full Manual",
  href: "https://manual.warondisease.org",
  emoji: "📖",
  description:
    "The complete idiot's guide to legally bribing your way to utopia. Contains pictures, because reading is hard when you are diseased and dying.",
  external: true,

  cta: "Read Paper",
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
  label: "Smart Contracts",
  href: "https://github.com/mikepsinn/optimitron/tree/main/packages",
  emoji: "📜",
  description:
    "The contracts that handle the money. Auditable, immutable, and incapable of taking a lobbying lunch. Unlike your current system.",
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
  voteLink,
  treatyLink,
  whyLink,
  aboutLink,
  agenciesLink,
  scoreboardLink,
  toolsLink,
  humanityVGovernmentLink,
  plaintiffsLink,
  plaintiffsManageLink,
  courtLink,
  donateLink,
  endorseLink,
  signatoriesLink,
  presidentManagementLink,
  dashboardLink,
  tasksLink,
  peopleLink,
  questionsLink,
  feedbackLink,
  legalLink,
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

function getReviewPathFromNavItem(navItem: NavItem): string | null {
  const href = navItem.href.trim();
  if (!href.startsWith("/")) {
    return null;
  }
  return href.split(/[?#]/, 1)[0] || ROUTES.home;
}

function dedupeRouteReviewSpecs(
  specs: RouteReviewSpec[],
): RouteReviewSpec[] {
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
