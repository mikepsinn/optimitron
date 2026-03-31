import { slugify } from "@/lib/slugify";
import {
  fmtParam,
  IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PRIZE_POOL_HORIZON_MULTIPLE,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
} from "@optimitron/data/parameters";
// Precompute for descriptions (same pattern as demo-script.ts)
const iabLobbyRatio = Math.round(IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT.value);
const milToTrialRatio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
const bondReturn = fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT);
const poolMultiple = `${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x`;

export const ROUTES = {
  home: "/",
  // Optimized Governance
  agencies: "/agencies",
  dcongress: "/agencies/dcongress",
  wishocracy: "/agencies/dcongress/wishocracy",
  referendum: "/agencies/dcongress/referendums",
  dtreasury: "/agencies/dtreasury",
  dtreasuryDirs: "/agencies/dtreasury/dirs",
  dtreasuryDfed: "/agencies/dtreasury/dfed",
  dtreasuryDssa: "/agencies/dtreasury/dssa",
  dfec: "/agencies/dfec",
  alignment: "/agencies/dfec/alignment",
  dcbo: "/agencies/dcbo",
  domb: "/agencies/domb",
  dgao: "/agencies/dgao",
  dih: "/agencies/dih",
  ddod: "/agencies/ddod",
  dcensus: "/agencies/dcensus",
  discoveries: "/agencies/dih/discoveries",
  // Earth's Governments
  governments: "/governments",
  politicians: "/politicians",
  // The Game
  prize: "/prize",
  scoreboard: "/scoreboard",
  iab: "/iab",
  // Analysis
  compare: "/compare",
  misconceptions: "/misconceptions",
  outcomes: "/outcomes",
  studies: "/studies",
  // Player
  profile: "/profile",
  dashboard: "/dashboard",
  census: "/census",
  checkIn: "/check-in",
  settings: "/settings",
  transmit: "/transmit",
  // Futures
  wishonia: "/wishonia",
  moronia: "/moronia",
  // Meta
  about: "/about",
  demo: "/demo",
  video: "/video",
  tools: "/tools",
  contribute: "/contribute",
  signIn: "/auth/signin",
} as const;

/** Where users land after signing in (unless a specific callbackUrl overrides it) */
export const DEFAULT_POST_LOGIN_ROUTE = ROUTES.dashboard;

export interface NavItem {
  href: string;
  label: string;
  emoji?: string;
  description?: string;
  external?: boolean;
  matchPrefixes?: string[];
}

export function getBudgetCategoryPath(name: string): string {
  return `${ROUTES.domb}/${slugify(name)}`;
}

export function getPolicyPath(name: string): string {
  return `${ROUTES.dcbo}/${slugify(name)}`;
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

export const studiesLink: NavItem = {
  href: ROUTES.outcomes,
  label: "Studies",
  emoji: "🧪",
  description: "What actually causes what. Your species has the data — you just never bothered to look at it properly.",
  matchPrefixes: [ROUTES.outcomes, ROUTES.studies],
};

export const compareLink: NavItem = {
  href: ROUTES.compare,
  label: "Compare",
  emoji: "🌍",
  description: "Same species, different settings. See which countries figured out the obvious bits.",
};

export const policiesLink: NavItem = {
  href: ROUTES.dcbo,
  label: "dCBO — Policy Scoring",
  emoji: "📋",
  description: "Every policy ranked by whether it actually works. Most don't. You'll be unsurprised which ones.",
};

export const budgetLink: NavItem = {
  href: ROUTES.domb,
  label: "dOMB — Budget Optimization",
  emoji: "💰",
  description: "Your government's shopping receipt, annotated by someone who can do maths.",
};

export const misconceptionsLink: NavItem = {
  href: ROUTES.misconceptions,
  label: "Myth vs Data",
  emoji: "🔍",
  description: "Things your species confidently believes vs what the spreadsheet says. The spreadsheet wins.",
};

export const discoveriesLink: NavItem = {
  href: ROUTES.discoveries,
  label: "Discoveries",
  emoji: "🔬",
  description: "Health patterns discovered by people who tracked their data. Your doctor doesn't know these yet.",
};

export const dtreasuryLink: NavItem = {
  href: ROUTES.dtreasury,
  label: "dTreasury — The $WISH System",
  emoji: "💸",
  description: "0.5% transaction tax, UBI, and wishocratic allocation — in one currency. Your seventy-four-thousand-page tax code is not invited.",
  matchPrefixes: [ROUTES.dtreasury],
};

export const federalReserveLink: NavItem = {
  href: ROUTES.dtreasuryDfed,
  label: "dFED — Monetary Policy",
  emoji: "🏦",
  description: "Why a transparent algorithm beats 12 people guessing about interest rates",
};

export const dirsLink: NavItem = {
  href: ROUTES.dtreasuryDirs,
  label: "dIRS — Transaction Tax",
  emoji: "🏦",
  description: "74,000 pages of tax code replaced by 6 lines of Solidity. 0.5% on every transaction. No filing. No audits. No accountants.",
};

export const dssaLink: NavItem = {
  href: ROUTES.dtreasuryDssa,
  label: "dSSA — Universal Basic Income",
  emoji: "🍞",
  description: "80+ welfare programs replaced by one for-loop. Every verified citizen gets an equal share. No means testing. No case workers.",
};

export const departmentOfWarLink: NavItem = {
  href: ROUTES.ddod,
  label: "dDoD — Defense",
  emoji: "💀",
  description: "We don't have one. War is a negative-sum game and the spreadsheet agrees.",
};

export const referendumLink: NavItem = {
  href: ROUTES.referendum,
  label: "Referendums",
  emoji: "🗳️",
  description: "Vote on things that matter. Prove you're human. Skip the middleman who was going to ignore you anyway.",
  matchPrefixes: [ROUTES.referendum],
};

export const agenciesLink: NavItem = {
  href: ROUTES.agencies,
  label: "Optimized Governance",
  emoji: "🏛️",
  description: "Ten agencies running a civilisation. No bureaucracy, no corruption, no seventy-four-thousand-page tax code. Just code.",
  matchPrefixes: [ROUTES.agencies],
};

/** Pages under the "Explore" dropdown in the main nav */
export const exploreLinks: NavItem[] = [
  referendumLink,
  studiesLink,
  compareLink,
  policiesLink,
  budgetLink,
  misconceptionsLink,
  discoveriesLink,
  dtreasuryLink,
  agenciesLink,
  departmentOfWarLink,
];

export const wishocracyLink: NavItem = {
  href: ROUTES.wishocracy,
  label: "Wishocracy",
  emoji: "🗳️",
  description: "Pick between two things. Do it ten times. Congratulations, you've just outperformed Congress.",
};

export const alignmentLink: NavItem = {
  href: ROUTES.alignment,
  label: "Alignment",
  emoji: "🏛️",
  description: "Find out which politicians accidentally agree with you. Spoiler: fewer than you'd hope.",
};

export const transmitLink: NavItem = {
  href: ROUTES.transmit,
  label: "Transmit",
  emoji: "📡",
  description: "Send data to an alien intelligence. Health, meals, mood, questions — every transmission helps optimise your planet.",
};

export const wishoniaWorldLink: NavItem = {
  href: ROUTES.wishonia,
  label: "Wishonia",
  emoji: "🌍",
  description: "A planet that ended war in year 12 and disease in year 340. This is what 4,297 years of not being idiots looks like.",
};

export const moroniaLink: NavItem = {
  href: ROUTES.moronia,
  label: "Moronia",
  emoji: "💀",
  description: `A planet with a 94.7% correlation to yours. It spent ${milToTrialRatio}x more on weapons than cures. It no longer exists.`,
};

/** @deprecated Use transmitLink instead */
export const trackLink = transmitLink;

export const dashboardLink: NavItem = {
  href: ROUTES.dashboard,
  label: "Dashboard",
  emoji: "📊",
  description: "Your referral link, badges, leaderboard rank, and proof you played. The campaign control room.",
};

export const profileLink: NavItem = {
  href: ROUTES.profile,
  label: "Profile",
  emoji: "🧭",
  description: "Your name, your face, your connected accounts. The bit where you tell the system who you are.",
};

export const censusLink: NavItem = {
  href: ROUTES.census,
  label: "Census",
  emoji: "📋",
  description: "Location, income, demographics. The data that turns you from a rounding error into a data point.",
};

export const checkInLink: NavItem = {
  href: ROUTES.checkIn,
  label: "Check-In",
  emoji: "☀️",
  description: "Thirty seconds a day to tell me if you're alive and thriving. On my planet we call this 'minimum viable self-awareness.'",
};

export const settingsLink: NavItem = {
  href: ROUTES.settings,
  label: "Settings",
  emoji: "⚙️",
  description: "Notification preferences, account toggles, and other knobs your species inexplicably needs labelled.",
};

export const appLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  trackLink,
  profileLink,
];

export const transparencyLink: NavItem = {
  href: ROUTES.dgao,
  label: "dGAO — Transparency & Audit",
  emoji: "🔍",
  description: "Every attestation, every fund distribution — on IPFS, impossible to quietly delete. Unlike your government's version.",
  matchPrefixes: [ROUTES.dgao],
};

export const toolsLink: NavItem = {
  href: ROUTES.tools,
  label: "Tools",
  emoji: "🧰",
  description: "Eighteen weapons for fixing civilisation. All free. Your move.",
  matchPrefixes: [ROUTES.tools],
};

export const governmentsLink: NavItem = {
  href: ROUTES.governments,
  label: "Government Report Cards",
  emoji: "💀",
  description: "Every government ranked by body count — the data they hope you never see",
  matchPrefixes: [ROUTES.governments],
};


export const politicianLeaderboardLink: NavItem = {
  href: "/governments/US/politicians",
  label: "Politician Leaderboard",
  emoji: "🏛️",
  description: "How your representatives actually vote vs what you actually wanted. The receipts.",
  matchPrefixes: [ROUTES.politicians, "/governments"],
};

export const scoreboardLink: NavItem = {
  href: ROUTES.scoreboard,
  label: "Humanity's Scoreboard",
  emoji: "🕹️",
  description: "Healthy lifespan and median income — the two numbers that matter. Plus the prize pool, voter count, and collapse countdown.",
  matchPrefixes: [ROUTES.scoreboard],
};

export const iabLink: NavItem = {
  href: ROUTES.iab,
  label: "Incentive Alignment Bonds",
  emoji: "🤝",
  description: `Invest in the campaign that outguns the defence lobby ${iabLobbyRatio}x. Bondholders earn ${bondReturn}/year when the treaty passes. Lobbying, but it cures diseases instead of causing them.`,
};

export const prizeLink: NavItem = {
  href: ROUTES.prize,
  label: "Prize",
  emoji: "🏆",
  description: `The only prize where losing means you get richer. Deposit, recruit, and either save civilisation or collect ${poolMultiple}.`,
};

export const earthOptimizationPrizePaperLink: NavItem = {
  label: "Earth Optimization Prize",
  href: "https://prize.warondisease.org",
  emoji: "🏆",
  description: "Outcome-based charity for governance reforms that reduce suffering",
  external: true,
};

export const aboutLink: NavItem = {
  href: ROUTES.about,
  label: "About",
  emoji: "ℹ️",
  description: "What this is, why it exists, and why an alien had to build it because your species wouldn't.",
};

export const demoLink: NavItem = {
  href: ROUTES.demo,
  label: "Demo",
  emoji: "🎬",
  description: "A guided tour by an alien who's been running a planet for 4,237 years. She has notes.",
  matchPrefixes: [ROUTES.demo],
};

export const videoLink: NavItem = {
  href: ROUTES.video,
  label: "Video",
  emoji: "📺",
  description: "Your governments spend 604 dollars on weapons for every one dollar on curing disease. I fixed this on my planet. Here is how you fix it on yours.",
};

/** @deprecated Use dtreasuryLink instead */
export const treasuryLink = dtreasuryLink;

/** @deprecated Use dtreasuryLink instead — /money page removed */
export const moneyLink = dtreasuryLink;

export const contributeLink: NavItem = {
  href: ROUTES.contribute,
  label: "Contribute",
  emoji: "🤝",
  description: "How to help. The bar is on the floor and your species still trips over it.",
};

/** Top-level nav items (not in dropdown) */
export const topLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  prizeLink,
  iabLink,
  moneyLink,
  transparencyLink,
  aboutLink,
];

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  { id: "play", label: "Play", items: [dashboardLink, profileLink, censusLink, checkInLink, settingsLink, wishocracyLink, alignmentLink, referendumLink, prizeLink, demoLink] },
  { id: "optimized-gov", label: "Optimized Governance", items: [dtreasuryLink, policiesLink, budgetLink, transparencyLink, discoveriesLink, agenciesLink, departmentOfWarLink] },
  { id: "earth", label: "Earth", items: [governmentsLink, politicianLeaderboardLink, compareLink, misconceptionsLink, studiesLink] },
  { id: "fund", label: "Fund", items: [prizeLink, scoreboardLink, iabLink] },
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  dashboardLink,
  profileLink,
  censusLink,
  settingsLink,
  trackLink,
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
  description: "Decentralized FDA — causal inference on health interventions",
  external: true,
};

export const wishocracyPaperLink: NavItem = {
  label: "Wishocracy",
  href: "https://wishocracy.warondisease.org",
  emoji: "🗳️",
  description: "Preference aggregation via pairwise comparisons (RAPPA)",
  external: true,
};

export const optimalPolicyGeneratorPaperLink: NavItem = {
  label: "Optimal Policy Generator",
  href: "https://opg.warondisease.org",
  emoji: "📋",
  description: "Score and rank policies by causal impact on welfare",
  external: true,
};

export const optimalBudgetGeneratorPaperLink: NavItem = {
  label: "Optimal Budget Generator",
  href: "https://obg.warondisease.org",
  emoji: "💰",
  description: "Allocate budgets using diminishing-returns modeling",
  external: true,
};

export const optimocracyPaperLink: NavItem = {
  label: "Optimocracy",
  href: "https://optimocracy.warondisease.org",
  emoji: "⚖️",
  description: "Two-metric welfare function for governance evaluation",
  external: true,
};

export const invisibleGraveyardPaperLink: NavItem = {
  label: "Invisible Graveyard",
  href: "https://invisible-graveyard.warondisease.org",
  emoji: "⚰️",
  description: "102M deaths from FDA post-safety efficacy delays since 1962",
  external: true,
};

export const onePercentTreatyPaperLink: NavItem = {
  label: "The 1% Treaty",
  href: "https://impact.warondisease.org",
  emoji: "🕊️",
  description: "Redirect 1% of military spending to clinical trials",
  external: true,
};

export const politicalDysfunctionTaxPaperLink: NavItem = {
  label: "Political Dysfunction Tax",
  href: "https://political-dysfunction-tax.warondisease.org",
  emoji: "🏛️",
  description: "$101T/yr cost of governance inefficiency worldwide",
  external: true,
};

export const incentiveAlignmentBondsPaperLink: NavItem = {
  label: "Incentive Alignment Bonds",
  href: "https://iab.warondisease.org",
  emoji: "🤝",
  description: "Smart contracts funding politicians by alignment score",
  external: true,
};

export const fullManualPaperLink: NavItem = {
  label: "Full Manual",
  href: "https://manual.warondisease.org",
  emoji: "📖",
  description: "Complete guide to ending war and disease",
  external: true,
};

export const dfdaImpactPaperLink: NavItem = {
  label: "dFDA Impact Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper",
  emoji: "📊",
  description: "Cost-effectiveness of pragmatic trials at $0.842 per DALY averted. Your current system manages about $50,000. Bit of a gap.",
  external: true,
};

export const gdpTrajectoriesPaperLink: NavItem = {
  label: "Choose Your Own Earth",
  href: "https://manual.warondisease.org/knowledge/economics/gdp-trajectories",
  emoji: "📈",
  description: "Three GDP trajectories. One where you fix things. Two where you don't. Guess which ones you're currently on.",
  external: true,
};

export const costOfChangePaperLink: NavItem = {
  label: "The Price of Political Change",
  href: "https://manual.warondisease.org/knowledge/appendix/cost-of-change-analysis",
  emoji: "💵",
  description: "$25B to $200B to fix governance. Sounds expensive until you see the $101T you're losing annually by not bothering.",
  external: true,
};

export const algorithmicAdminPaperLink: NavItem = {
  label: "Algorithmic Public Administration",
  href: "https://manual.warondisease.org/knowledge/appendix/algorithmic-public-administration.html",
  emoji: "🤖",
  description: "Replace bureaucrats with deterministic functions. Same outputs, fewer expense accounts.",
  external: true,
};

export const usEfficiencyAuditPaperLink: NavItem = {
  label: "US Efficiency Audit",
  href: "https://manual.warondisease.org/knowledge/appendix/us-efficiency-audit",
  emoji: "🔎",
  description: "$4.9 trillion in annual inefficiency. That's not a rounding error. That's the error.",
  external: true,
};

export const prizeProtocolPaperLink: NavItem = {
  label: "Earth Optimization Prize Protocol",
  href: "https://manual.warondisease.org/knowledge/appendix/earth-optimization-prize-protocol",
  emoji: "🏆",
  description: "The technical spec for a prize where losing still pays 4.2x. The maths is annoyingly sound.",
  external: true,
};

export const rightToTrialPaperLink: NavItem = {
  label: "Right to Trial & FDA Upgrade Act",
  href: "https://manual.warondisease.org/knowledge/appendix/right-to-trial-fda-upgrade-act",
  emoji: "⚖️",
  description: "Draft legislation to let safe treatments reach patients before they die waiting. Radical concept, apparently.",
  external: true,
};

export const planetaryConstitutionPaperLink: NavItem = {
  label: "Planetary Constitutional Convention",
  href: "https://manual.warondisease.org/strategy/planetary-constitutional-convention",
  emoji: "🌐",
  description: "A constitutional framework for 8 billion people. Your current approach of 193 competing rule books is not going well.",
  external: true,
};

export const earthOptimizationProtocolPaperLink: NavItem = {
  label: "Earth Optimization Protocol v1",
  href: "https://manual.warondisease.org/strategy/earth-optimization-protocol-v1",
  emoji: "⚡",
  description: "Step-by-step instructions for fixing a planet. Written slowly, in case you're reading this on your little phone.",
  external: true,
};

export const drugDevCostPaperLink: NavItem = {
  label: "Drug Development Cost Analysis",
  href: "https://manual.warondisease.org/knowledge/appendix/drug-development-cost-analysis",
  emoji: "💊",
  description: "Drug development costs increased 105x since 1970. Adjusted for inflation. Not a typo.",
  external: true,
};

export const parametersPaperLink: NavItem = {
  label: "Methodology & Parameters",
  href: "https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations",
  emoji: "🔢",
  description: "Every number cited, every source linked, every calculation shown. Transparency is not optional on my planet.",
  external: true,
};

export const recoveryTrialPaperLink: NavItem = {
  label: "Oxford RECOVERY Trial",
  href: "https://manual.warondisease.org/knowledge/appendix/recovery-trial",
  emoji: "🏥",
  description: "One pragmatic trial saved more lives during COVID than most governments managed. Cost almost nothing. Filed under 'obvious.'",
  external: true,
};

export const realWorldEvidencePaperLink: NavItem = {
  label: "Real-World Evidence History",
  href: "https://manual.warondisease.org/knowledge/appendix/real-world-evidence-historical-success",
  emoji: "📜",
  description: "Centuries of real-world evidence working better than controlled trials. Your regulators pretend this history doesn't exist.",
  external: true,
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
  description: "Source code, issues, and contributions",
  external: true,
};

export const contractsSourceLink: NavItem = {
  label: "Smart Contracts",
  href: "https://github.com/mikepsinn/optimitron/tree/main/packages",
  emoji: "📜",
  description: "treasury-prize, treasury-iab, treasury-wish, treasury-shared — all Solidity source",
  external: true,
};

export const readmeLink: NavItem = {
  label: "README",
  href: "https://github.com/mikepsinn/optimitron#readme",
  emoji: "📝",
  description: "Feature overview, setup, and architecture at a glance",
  external: true,
};

export const mitLicenseLink: NavItem = {
  label: "MIT License",
  href: "https://opensource.org/licenses/MIT",
  emoji: "📄",
  description: "Free to use, modify, and distribute",
  external: true,
};

/** Community links for the footer */
export const communityLinks: NavItem[] = [
  githubLink,
  readmeLink,
  mitLicenseLink,
];
