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
import { AGENCIES, WISHONIA_AGENCIES } from "@optimitron/data";
// Precompute for descriptions (same pattern as demo-script.ts)
const costReduction = Math.round(DFDA_TRIAL_COST_REDUCTION_FACTOR.value);
const speedup = Math.round(DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER.value);
const iabLobbyRatio = Math.round(IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT.value);
const milToTrialRatio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
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
  vote: "/vote",
  questions: "/questions",
  humanityManagementTraining: "/humanity-management-training",
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
}

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
  const prefixes = item.matchPrefixes?.length ? item.matchPrefixes : [item.href];

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
    "Open the Optimitron agency for funding disease-focused institutes. The NIH, but pointed at measurable health instead of grant-page archaeology.",
  tagline: "Fund institutes that turn disease queues into work queues",
  matchPrefixes: [ROUTES.dih],
  cta: "Open DIH",
};

export const dfdaLink: NavItem = {
  href: ROUTES.dfda,
  label: AGENCIES.dfda.dName,
  emoji: "💊",
  description:
    "Open the Optimitron agency for conditions, treatments, trials, and outcome labels. Drug evidence, minus the ritual paperwork fog machine.",
  tagline: "Compare treatments before the brochure wins",
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
  description: "Vote on things that matter. Prove you're human. Skip the middleman who was going to ignore you anyway.",
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
  description: "Pick between two things. Do it ten times. Congratulations, you've just outperformed Congress.",
  tagline: "Pick between two things, ten times — outperform Congress",
  cta: "Start Voting",
};

export const alignmentLink: NavItem = {
  href: ROUTES.alignment,
  label: "Alignment",
  emoji: "🏛️",
  description: "Find out which politicians accidentally agree with you. Spoiler: fewer than you'd hope.",
  tagline: "Find out which politicians accidentally agree with you",
  cta: "Check Alignment",
};

export const transmitLink: NavItem = {
  href: ROUTES.transmit,
  label: "Transmit",
  emoji: "📡",
  description: "Tell me what you ate, how you slept, and whether your meat is functioning. Thirty seconds. Your species spends longer choosing a sandwich.",
  tagline: "Thirty seconds — what you ate, how you slept, how you feel",

  cta: "Start Tracking",
};

export const wishoniaWorldLink: NavItem = {
  href: ROUTES.wishonia,
  label: "Wishonia",
  emoji: "🌍",
  description: "A planet that ended war in year 12 and disease in year 340. This is what 4,297 years of not being idiots looks like.",
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
  label: "Dashboard",
  emoji: "📊",
  description: "Your referral link, your rank, and proof you did something other than argue about it on the internet. The rare human achievement of clicking a button.",
  tagline: "Your referral link, your rank, your progress",

  cta: "Open Dashboard",
};

export const tasksLink: NavItem = {
  href: ROUTES.tasks,
  label: "Tasks",
  emoji: "🎯",
  description: "Concrete tasks for actual humans, including the ones who run states and still need reminding. Claim what you can do. Track what others are supposed to do.",
  tagline: "Claim what you can do. Track what others should do.",
  cta: "Open Tasks",
};

export const searchLink: NavItem = {
  href: ROUTES.search,
  label: "Search",
  emoji: "🔎",
  description: "Search pages, tasks, and the manual from one screen. Because spelunking through menus is not a serious information architecture.",
  tagline: "Search pages, tasks, and manual docs from one place",
  matchPrefixes: [ROUTES.search],
  cta: "Search Site",
};

export const profileLink: NavItem = {
  href: ROUTES.profile,
  label: "Profile",
  emoji: "🧭",
  description: "Your name, your face, your connected accounts. On my planet this takes four seconds. Your species will somehow need twenty minutes and a password reset.",
  tagline: "Your name, your face, your connected accounts",

  cta: "View Profile",
};

export const declarationLink: NavItem = {
  href: ROUTES.declaration,
  label: "Declaration",
  emoji: "📜",
  description: "The Declaration of Optimization: why optimization is necessary, what signatories commit to, and how to publicly endorse it.",
  tagline: "Why optimization is necessary and what signatories commit to",
  cta: "Read Declaration",
};

export const censusLink: NavItem = {
  href: ROUTES.census,
  label: "Census",
  emoji: "📋",
  description: "Location, income, demographics. Without this you are a rounding error. With it you are a data point. On your planet this counts as a promotion.",
  tagline: "Location, income, demographics — become a data point",

  cta: "Take Census",
};

export const checkInLink: NavItem = {
  href: ROUTES.checkIn,
  label: "Check-In",
  emoji: "☀️",
  description: "Thirty seconds a day to tell me if you're alive and thriving. On my planet we call this 'minimum viable self-awareness.'",
  tagline: "Thirty seconds a day of minimum viable self-awareness",

  cta: "Check In",
};

export const settingsLink: NavItem = {
  href: ROUTES.settings,
  label: "Settings",
  emoji: "⚙️",
  description: "Notification preferences, account toggles, and other knobs your species inexplicably needs labelled.",
  tagline: "Notification preferences and account toggles",

  cta: "Open Settings",
};

export const inviteVoterLink: NavItem = {
  href: DASHBOARD_INVITE_HREF,
  label: "Invite a Voter",
  emoji: "📨",
  description: "Assign one human an Earth optimization task: vote on the 1% Treaty.",
  tagline: "Assign one Earth optimization task",
  cta: "Invite",
};

export const humanityManagementTrainingLink: NavItem = {
  href: ROUTES.humanityManagementTraining,
  label: "Humanity Management Training",
  emoji: "ðŸ“‹",
  description: "Post-vote training for newly promoted Humanity Managers: share your referral URL and give two humans their voting tasks.",
  tagline: "Give two humans their voting tasks",
  cta: "Start Training",
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
  description: "Eighteen weapons for fixing civilisation. All free. Your move.",
  tagline: "Every tool for fixing civilisation — all free",
  matchPrefixes: [ROUTES.tools],

  cta: "Open Armory",
};

export const efficiencyLink: NavItem = {
  href: ROUTES.efficiency,
  label: "Efficiency Audit",
  emoji: "📉",
  description: "The shopping-list autopsy: where budgets are bloated, where they are starving, and which deltas actually move welfare instead of headlines.",
  tagline: "Where budgets are bloated, starved, and fixable",
  matchPrefixes: [ROUTES.efficiency],

  cta: "Audit Waste",
};

export const dividendLink: NavItem = {
  href: ROUTES.dividend,
  label: "Dividend",
  emoji: "💵",
  description: "Translate the spending deltas into household cash. If governance improved, this is what the median adult would actually notice in their bank account.",
  tagline: "What better budgets pay back to actual humans",
  matchPrefixes: [ROUTES.dividend],

  cta: "See Dividend",
};

export const governmentSizeLink: NavItem = {
  href: ROUTES.governmentSize,
  label: "Government Size",
  emoji: "📏",
  description: "A size-and-composition check on the state itself. Not just how much it spends, but how the whole machine is proportioned.",
  tagline: "How large the state is, and how it is shaped",
  matchPrefixes: [ROUTES.governmentSize],

  cta: "See Size Audit",
};

export const legislationLink: NavItem = {
  href: ROUTES.legislation,
  label: "Legislation",
  emoji: "📚",
  description: "Draft bills and legislative pathways tied back to the budget and policy evidence. Not vibes. Not slogans. Actual text.",
  tagline: "Draft bills grounded in the evidence base",
  matchPrefixes: [ROUTES.legislation],

  cta: "Browse Legislation",
};

export const governmentsLink: NavItem = {
  href: ROUTES.governments,
  label: "Government Report Cards",
  emoji: "💀",
  description: "Every government ranked by how many of its citizens it keeps alive versus how many it spends money on killing. The data they hope you never see.",
  tagline: "Every government ranked by who it keeps alive",
  matchPrefixes: [ROUTES.governments],

  cta: "See Report Cards",
};


export const politicianLeaderboardLink: NavItem = {
  href: "/governments/US/politicians",
  label: "Politician Leaderboard",
  emoji: "🏛️",
  description: "How your representatives actually vote versus what you actually want. A single number per politician. Public. Immutable. They hate this page.",
  tagline: "How your representatives actually vote vs what you want",
  matchPrefixes: [ROUTES.politicians, "/governments"],

  cta: "See Rankings",
};

export const scoreboardLink: NavItem = {
  href: ROUTES.scoreboard,
  label: "Humanity's Scoreboard",
  emoji: "🕹️",
  description: "Two numbers: how long you live without disease and how much a normal person earns. Not GDP. Not billionaire wealth. The median. Everything else on this site exists to move these two numbers up.",
  tagline: "Two numbers: disease-free lifespan and median income",
  matchPrefixes: [ROUTES.scoreboard],

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
  label: "The 1% Treaty",
  emoji: "📜",
  description: "The full text of the treaty that redirects 1% of military spending to clinical trials. Read it, sign it, share it. Every signature from an official account is verified on the public ledger.",
  tagline: "1% of war budgets → clinical trials",
  cta: "Read the Treaty",
};

export const voteLink: NavItem = {
  href: ROUTES.vote,
  label: "Vote",
  emoji: "🗳️",
  description: "Answer the 1% Treaty question. Thirty seconds. Then give the next human their voting task.",
  tagline: "Answer the 1% Treaty question",
  matchPrefixes: [ROUTES.vote],
  cta: "Vote Now",
};

export const questionsLink: NavItem = {
  href: ROUTES.questions,
  label: "Treaty Questions",
  emoji: "ðŸ—³ï¸",
  description: "The longer context-first treaty walkthrough with the story, stakes, math, and vote question.",
  tagline: "Story, stakes, math, and the treaty vote",
  matchPrefixes: [ROUTES.questions],
  cta: "See the Questions",
};

export const prizeLink: NavItem = {
  href: ROUTES.prize,
  label: "Prize",
  emoji: "🏆",
  description: `A dominant assurance game with projected ${poolMultiple} return if thresholds are missed. Currently seeking a foundation host.`,
  tagline: "Deposit, recruit, win or get ~4.2x back",
  cta: "Play the Game",
};

export const earthOptimizationPrizePaperLink: NavItem = {
  label: "Earth Optimization Prize",
  href: "https://prize.warondisease.org",
  emoji: "🏆",
  description: "A dominant assurance design combining philanthropy and game theory. Your species invented gambling and philanthropy separately. This is what happens when you combine them and remove the stupidity.",
  external: true,

  cta: "Read Paper",
};

export const aboutLink: NavItem = {
  href: ROUTES.about,
  label: "About",
  emoji: "ℹ️",
  description: "What this is, why it exists, and why an alien had to build it because your species wouldn't.",
  tagline: "What this is, why it exists, and why an alien built it",

  cta: "Learn More",
};

export const demoLink: NavItem = {
  href: ROUTES.demo,
  label: "Demo",
  emoji: "🎬",
  description: "A guided tour by an alien who's been running a planet for 4,237 years. She has notes.",
  tagline: "A guided tour by a 4,237-year-old governance AI",
  matchPrefixes: [ROUTES.demo],

  cta: "Watch Demo",
};

export const videoLink: NavItem = {
  href: ROUTES.video,
  label: "Video",
  emoji: "📺",
  description: "Your governments spend 604 dollars on weapons for every one dollar on curing disease. I fixed this on my planet. Here is how you fix it on yours.",
  tagline: "$604 on weapons per $1 on cures — here's the fix",

  cta: "Watch Video",
};

export const contributeLink: NavItem = {
  href: ROUTES.contribute,
  label: "Contribute",
  emoji: "🤝",
  description: "How to help. The bar is on the floor and your species still trips over it.",
  tagline: "How to help — the bar is on the floor",

  cta: "Contribute",
};

export const fundLink: NavItem = {
  href: ROUTES.fund,
  label: "Fund Optimization",
  emoji: "🪙",
  description: "Insert coin. AI agents optimise your planet. You get a receipt showing exactly how many suffering-hours your dollar prevented. It is genuinely less complicated than your tax code.",
  tagline: "Insert coin, optimise Earth",

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
    items: [prizeLink, tasksLink, dashboardLink],
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
  { id: "analysis", label: "Analysis", items: [opgLink, obgLink, governmentsLink, politicianLeaderboardLink, scoreboardLink] },
  { id: "health", label: "Health", items: [dihLink, dfdaLink, conditionsLink, treatmentsLink] },
  { id: "democracy", label: "Democracy", items: [wishocracyLink, alignmentLink, referendumLink] },
  { id: "finance", label: "Finance", items: [prizeLink, iabLink, dtreasuryLink, federalReserveLink, dirsLink, dssaLink] },
  { id: "transparency", label: "Transparency", items: [transparencyLink] },
  { id: "player", label: "Player", items: [tasksLink, transmitLink, dashboardLink, censusLink, checkInLink] },
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  dashboardLink,
  tasksLink,
  profileLink,
  censusLink,
  settingsLink,
  transmitLink,
  aboutLink,
];

/** All internal nav links (explore + top-level + footer app links) */
export const allNavLinks: NavItem[] = [
  ...exploreLinks,
  ...footerAppLinks.filter(
    (link, index, links) => links.findIndex(({ href }) => href === link.href) === index,
  ),
];

export const dfdaSpecPaperLink: NavItem = {
  label: "dFDA Spec",
  href: "https://dfda-spec.warondisease.org",
  emoji: "🧬",
  description: "Your FDA makes treatments wait 8.2 years after they are proven safe. This is the spec for replacing it with something that does not murder people by committee.",
  external: true,

  cta: "Read Paper",
};

export const wishocracyPaperLink: NavItem = {
  label: "Wishocracy",
  href: "https://wishocracy.warondisease.org",
  emoji: "🗳️",
  description: "Pick between two things, ten times. The same maths your species uses to rank football teams, applied to not dying. Outperforms Congress in under a minute.",
  external: true,

  cta: "Read Paper",
};

export const optimalPolicyGeneratorPaperLink: NavItem = {
  label: "Optimal Policy Generator",
  href: "https://opg.warondisease.org",
  emoji: "📋",
  description: "Every policy scored by whether it actually made humans richer or less dead. Your current method is to argue about it on television until someone wins by being louder.",
  external: true,

  cta: "Read Paper",
};

export const optimalBudgetGeneratorPaperLink: NavItem = {
  label: "Optimal Budget Generator",
  href: "https://obg.warondisease.org",
  emoji: "💰",
  description: "The maths for spending money on things that work instead of things that explode. Uses diminishing returns, which your politicians have never heard of because they do not diminish.",
  external: true,

  cta: "Read Paper",
};

export const optimocracyPaperLink: NavItem = {
  label: "Optimocracy",
  href: "https://optimocracy.warondisease.org",
  emoji: "⚖️",
  description: "Grade a civilisation with two numbers: how long its people live and how much they earn. Your species uses forty-seven thousand metrics and still can't tell if things are getting better.",
  external: true,

  cta: "Read Paper",
};

export const invisibleGraveyardPaperLink: NavItem = {
  label: "Invisible Graveyard",
  href: "https://invisible-graveyard.warondisease.org",
  emoji: "⚰️",
  description: "102 million humans who died waiting for treatments that were already proven safe. They were just sitting in a cabinet. Being safe. While people died in the queue.",
  external: true,

  cta: "Read Paper",
};

export const onePercentTreatyPaperLink: NavItem = {
  label: "The 1% Treaty",
  href: "https://impact.warondisease.org",
  emoji: "🕊️",
  description: "Going from spending 99% of the murder budget on murder to 98%. Your species will find this controversial.",
  external: true,

  cta: "Read Paper",
};

export const politicalDysfunctionTaxPaperLink: NavItem = {
  label: "Political Dysfunction Tax",
  href: "https://political-dysfunction-tax.warondisease.org",
  emoji: "🏛️",
  description: "Your governments cost you $101 trillion a year in dysfunction. Per person, per year. Including the ones who cannot afford lunch.",
  external: true,

  cta: "Read Paper",
};

export const dysfunctionTaxLink: NavItem = {
  label: "Political Dysfunction Tax",
  href: "/dysfunction-tax",
  emoji: "💸",
  description: "Your governments cost you $101 trillion a year in dysfunction. Per person, per year. Including the ones who cannot afford lunch.",
  cta: "See the Breakdown",
};

export const incentiveAlignmentBondsPaperLink: NavItem = {
  label: "Incentive Alignment Bonds",
  href: "https://iab.warondisease.org",
  emoji: "🤝",
  description: "War bonds paid 4%. These project 272%. Grandma would be furious if she hadn't died of cancer.",
  external: true,

  cta: "Read Paper",
};

export const earthOptimizationPrizeDetailsLink: NavItem = {
  label: "Prize Details",
  href: "https://manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html",
  emoji: "🏆",
  description: "The full specification of the Earth Optimization Prize — dominant assurance mechanics, VC-sector diversification projections, and threshold criteria.",
  external: true,
  cta: "Read Details",
};

export const iabDetailsLink: NavItem = {
  label: "IAB Details",
  href: "https://manual.warondisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  emoji: "🤝",
  description: "The full Incentive Alignment Bonds specification — 80/10/10 revenue split, lobbying mechanics, and projected bondholder returns.",
  external: true,
  cta: "Read Details",
};

export const fullManualPaperLink: NavItem = {
  label: "Full Manual",
  href: "https://manual.warondisease.org",
  emoji: "📖",
  description: "The complete idiot's guide to legally bribing your way to utopia. Contains pictures, because reading is hard when you are diseased and dying.",
  external: true,

  cta: "Read Paper",
};

export const dfdaImpactPaperLink: NavItem = {
  label: "dFDA Impact Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper",
  emoji: "📊",
  description: "Cost-effectiveness of pragmatic trials at $0.842 per DALY averted. Your current system manages about $50,000. Bit of a gap.",
  external: true,

  cta: "Read Paper",
};

export const gdpTrajectoriesPaperLink: NavItem = {
  label: "Choose Your Own Earth",
  href: "https://manual.warondisease.org/knowledge/economics/gdp-trajectories",
  emoji: "📈",
  description: "Three GDP trajectories. One where you fix things. Two where you don't. Guess which ones you're currently on.",
  external: true,

  cta: "Read Paper",
};

export const costOfChangePaperLink: NavItem = {
  label: "The Price of Political Change",
  href: "https://manual.warondisease.org/knowledge/appendix/cost-of-change-analysis",
  emoji: "💵",
  description: "$25B to $200B to fix governance. Sounds expensive until you see the $101T you're losing annually by not bothering.",
  external: true,

  cta: "Read Paper",
};

export const algorithmicAdminPaperLink: NavItem = {
  label: "Algorithmic Public Administration",
  href: "https://manual.warondisease.org/knowledge/appendix/algorithmic-public-administration.html",
  emoji: "🤖",
  description: "Replace bureaucrats with deterministic functions. Same outputs, fewer expense accounts.",
  external: true,

  cta: "Read Paper",
};

export const usEfficiencyAuditPaperLink: NavItem = {
  label: "US Efficiency Audit",
  href: "https://manual.warondisease.org/knowledge/appendix/us-efficiency-audit",
  emoji: "🔎",
  description: "$4.9 trillion in annual inefficiency. That's not a rounding error. That's the error.",
  external: true,

  cta: "Read Paper",
};

export const prizeProtocolPaperLink: NavItem = {
  label: "Earth Optimization Prize Protocol",
  href: "https://manual.warondisease.org/knowledge/appendix/earth-optimization-prize-protocol",
  emoji: "🏆",
  description: "The technical spec for a prize where losing still pays 4.2x. The maths is annoyingly sound.",
  external: true,

  cta: "Read Paper",
};

export const rightToTrialPaperLink: NavItem = {
  label: "Right to Trial & FDA Upgrade Act",
  href: "https://manual.warondisease.org/knowledge/appendix/right-to-trial-fda-upgrade-act",
  emoji: "⚖️",
  description: "Draft legislation to let safe treatments reach patients before they die waiting. Radical concept, apparently.",
  external: true,

  cta: "Read Paper",
};

export const planetaryConstitutionPaperLink: NavItem = {
  label: "Planetary Constitutional Convention",
  href: "https://manual.warondisease.org/strategy/planetary-constitutional-convention",
  emoji: "🌐",
  description: "A constitutional framework for 8 billion people. Your current approach of 193 competing rule books is not going well.",
  external: true,

  cta: "Read Paper",
};

export const earthOptimizationProtocolPaperLink: NavItem = {
  label: "Earth Optimization Protocol v1",
  href: "https://manual.warondisease.org/strategy/earth-optimization-protocol-v1",
  emoji: "⚡",
  description: "Step-by-step instructions for fixing a planet. Written slowly, in case you're reading this on your little phone.",
  external: true,

  cta: "Read Paper",
};

export const drugDevCostPaperLink: NavItem = {
  label: "Drug Development Cost Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/drug-development-cost-analysis",
  emoji: "💊",
  description: "Drug development costs increased 105x since 1970. Adjusted for inflation. Not a typo.",
  external: true,

  cta: "Read Paper",
};

export const parametersPaperLink: NavItem = {
  label: "Methodology & Parameters",
  href: "https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations",
  emoji: "🔢",
  description: "Every number cited, every source linked, every calculation shown. Transparency is not optional on my planet.",
  external: true,

  cta: "Read Paper",
};

export const recoveryTrialPaperLink: NavItem = {
  label: "Oxford RECOVERY Trial",
  href: "https://manual.warondisease.org/knowledge/appendix/recovery-trial",
  emoji: "🏥",
  description: "One pragmatic trial saved more lives during COVID than most governments managed. Cost almost nothing. Filed under 'obvious.'",
  external: true,

  cta: "Read Paper",
};

export const realWorldEvidencePaperLink: NavItem = {
  label: "Real-World Evidence History",
  href: "https://manual.warondisease.org/knowledge/appendix/real-world-evidence-historical-success",
  emoji: "📜",
  description: "Centuries of real-world evidence working better than controlled trials. Your regulators pretend this history doesn't exist.",
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
export const allPaperLinks: NavItem[] = [
  ...paperLinks,
  ...researchPaperLinks,
];

export const githubLink: NavItem = {
  label: "GitHub",
  href: "https://github.com/mikepsinn/optimitron",
  emoji: "💻",
  description: "All the code. Open source. Because on my planet, 'trust me' is not a governance strategy.",
  external: true,

  cta: "Learn More",
};

export const contractsSourceLink: NavItem = {
  label: "Smart Contracts",
  href: "https://github.com/mikepsinn/optimitron/tree/main/packages",
  emoji: "📜",
  description: "The contracts that handle the money. Auditable, immutable, and incapable of taking a lobbying lunch. Unlike your current system.",
  external: true,

  cta: "Learn More",
};

export const readmeLink: NavItem = {
  label: "README",
  href: "https://github.com/mikepsinn/optimitron#readme",
  emoji: "📝",
  description: "What this thing does, how to run it, and why fifteen packages is still fewer moving parts than your tax code.",
  external: true,

  cta: "Learn More",
};

export const mitLicenseLink: NavItem = {
  label: "MIT License",
  href: "https://opensource.org/licenses/MIT",
  emoji: "📄",
  description: "Free to use, modify, and distribute. Alignment software should not have a paywall. That would be very Earth of us.",
  external: true,

  cta: "Learn More",
};

/** Community links for the footer */
export const communityLinks: NavItem[] = [
  githubLink,
  readmeLink,
  mitLicenseLink,
];
