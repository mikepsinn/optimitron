import { slugify } from "@/lib/slugify";
import { fmtParam } from "@/lib/format-parameter";
import {
  IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT,
  PRIZE_POOL_HORIZON_MULTIPLE,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
} from "@/lib/parameters-calculations-citations";

// Precompute for descriptions (same pattern as demo-script.ts)
const iabLobbyRatio = Math.round(IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT.value);
const bondReturn = fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT);
const poolMultiple = `${Math.round(PRIZE_POOL_HORIZON_MULTIPLE.value)}x`;

export const ROUTES = {
  home: "/",
  wishocracy: "/wishocracy",
  alignment: "/alignment",
  profile: "/profile",
  wishonia: "/wishonia",
  about: "/about",
  transparency: "/transparency",
  prize: "/prize",
  outcomes: "/outcomes",
  compare: "/compare",
  policies: "/policies",
  budget: "/budget",
  misconceptions: "/misconceptions",
  discoveries: "/discoveries",
  studies: "/studies",
  money: "/money",
  federalReserve: "/federal-reserve",
  departmentOfWar: "/department-of-war",
  treasury: "/treasury",
  iab: "/iab",
  contribute: "/contribute",
  referendum: "/referendum",
  politicians: "/politicians",
  scoreboard: "/scoreboard",
  governments: "/governments",
  agencies: "/agencies",
  tools: "/tools",
  dashboard: "/dashboard",
  demo: "/demo",
  signIn: "/auth/signin",
} as const;

export interface NavItem {
  href: string;
  label: string;
  emoji?: string;
  description?: string;
  external?: boolean;
  matchPrefixes?: string[];
}

export function getBudgetCategoryPath(name: string): string {
  return `${ROUTES.budget}/${slugify(name)}`;
}

export function getPolicyPath(name: string): string {
  return `${ROUTES.policies}/${slugify(name)}`;
}

export function getSignInPath(
  callbackUrl: string = ROUTES.wishocracy,
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
  href: ROUTES.policies,
  label: "Policies",
  emoji: "📋",
  description: "Every policy ranked by whether it actually works. Most don't. You'll be unsurprised which ones.",
};

export const budgetLink: NavItem = {
  href: ROUTES.budget,
  label: "Optimal Budget",
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

export const moneyLink: NavItem = {
  href: ROUTES.money,
  label: "How Money Should Work",
  emoji: "💸",
  description: "0.5% transaction tax, UBI, and wishocratic allocation — in one currency. Your seventy-four-thousand-page tax code is not invited.",
};

export const federalReserveLink: NavItem = {
  href: "/agencies/dfed",
  label: "Deprecated Fed",
  emoji: "🏦",
  description: "Why a transparent algorithm beats 12 people guessing about interest rates",
};

export const departmentOfWarLink: NavItem = {
  href: "/agencies/ddod",
  label: "Deprecated DoD",
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
  label: "Deprecated Agencies",
  emoji: "🏚️",
  description: "Government agencies replaced by smart contract functions — the code that makes them obsolete",
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
  moneyLink,
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

export const trackLink: NavItem = {
  href: ROUTES.wishonia,
  label: "Wishonia",
  emoji: "👽",
  description: "Track your health with an alien systems engineer. She'll tell you what's working. You won't like it.",
};

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
  description: "Your permanent record of giving a damn. Check-ins, reports, and evidence you tried.",
};

export const appLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  trackLink,
  profileLink,
];

export const transparencyLink: NavItem = {
  href: ROUTES.transparency,
  label: "Transparency",
  emoji: "🔍",
  description: "Every attestation, every fund distribution — on IPFS, impossible to quietly delete. Unlike your government's version.",
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
  href: ROUTES.politicians,
  label: "Politician Leaderboard",
  emoji: "🏛️",
  description: "How your representatives actually vote vs what you actually wanted. The receipts.",
  matchPrefixes: [ROUTES.politicians],
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

export const treasuryLink: NavItem = {
  href: ROUTES.treasury,
  label: "Treasury",
  emoji: "🪙",
  description: "The $WISH token — 0.5% transaction tax replaces your entire tax code. UBI and wishocratic allocation included.",
  matchPrefixes: [ROUTES.treasury],
};

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
  { id: "participate", label: "Participate", items: [wishocracyLink, alignmentLink, referendumLink, demoLink] },
  { id: "explore", label: "Explore", items: [studiesLink, compareLink, policiesLink, budgetLink, governmentsLink, misconceptionsLink, discoveriesLink] },
  { id: "fund", label: "Fund", items: [prizeLink, scoreboardLink, iabLink, moneyLink, treasuryLink] },
  { id: "system", label: "System", items: [politicianLeaderboardLink, transparencyLink, agenciesLink, departmentOfWarLink, aboutLink, contributeLink] },
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
  dashboardLink,
  profileLink,
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
