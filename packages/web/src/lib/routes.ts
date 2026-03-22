import { slugify } from "@/lib/slugify";

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
  civic: "/civic",
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
  tools: "/tools",
  dashboard: "/dashboard",
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
  description: "Outcome hubs, pair studies, and jurisdiction drilldowns",
  matchPrefixes: [ROUTES.outcomes, ROUTES.studies],
};

export const compareLink: NavItem = {
  href: ROUTES.compare,
  label: "Compare",
  emoji: "🌍",
  description: "Side-by-side country and system comparisons",
};

export const policiesLink: NavItem = {
  href: ROUTES.policies,
  label: "Policies",
  emoji: "📋",
  description: "Evidence-ranked policy recommendations",
};

export const budgetLink: NavItem = {
  href: ROUTES.budget,
  label: "Optimal Budget",
  emoji: "💰",
  description: "Budget size and composition analysis",
};

export const misconceptionsLink: NavItem = {
  href: ROUTES.misconceptions,
  label: "Myth vs Data",
  emoji: "🔍",
  description: "Popular beliefs tested against empirical data",
};

export const discoveriesLink: NavItem = {
  href: ROUTES.discoveries,
  label: "Discoveries",
  emoji: "🔬",
  description: "Population-level health discoveries from contributor data",
};

export const moneyLink: NavItem = {
  href: ROUTES.money,
  label: "How Money Should Work",
  emoji: "💸",
  description: "Programmable currency with built-in governance — transaction tax, UBI, wishocratic allocation",
};

export const federalReserveLink: NavItem = {
  href: ROUTES.federalReserve,
  label: "Algorithmic Central Bank",
  emoji: "🏦",
  description: "Why a transparent algorithm beats 12 people guessing about interest rates",
};

export const departmentOfWarLink: NavItem = {
  href: ROUTES.departmentOfWar,
  label: "Department of War",
  emoji: "💀",
  description: "We don't have one. War is a negative-sum game and the spreadsheet agrees.",
};

export const referendumLink: NavItem = {
  href: ROUTES.referendum,
  label: "Referendums",
  emoji: "🗳️",
  description: "Vote on proposals, verify with World ID, earn referral rewards",
  matchPrefixes: [ROUTES.referendum],
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
  federalReserveLink,
  departmentOfWarLink,
];

export const wishocracyLink: NavItem = {
  href: ROUTES.wishocracy,
  label: "Wishocracy",
  emoji: "🗳️",
  description: "Build and save your ideal public budget",
};

export const alignmentLink: NavItem = {
  href: ROUTES.alignment,
  label: "Alignment",
  emoji: "🏛️",
  description: "See which benchmark politicians match your priorities",
};

export const trackLink: NavItem = {
  href: ROUTES.wishonia,
  label: "Wishonia",
  emoji: "👽",
  description: "Planetary debugging for your health, habits, and everyday tradeoffs",
};

export const dashboardLink: NavItem = {
  href: ROUTES.dashboard,
  label: "Dashboard",
  emoji: "📊",
  description: "Track your impact, manage preferences, and coordinate with organisations",
};

export const profileLink: NavItem = {
  href: ROUTES.profile,
  label: "Profile",
  emoji: "🧭",
  description: "Save demographics, daily check-ins, and shared reports",
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
  description: "Verifiable attestations, IPFS storage, and the full governance pipeline",
};

export const toolsLink: NavItem = {
  href: ROUTES.tools,
  label: "Tools",
  emoji: "🧰",
  description: "Every tool available to help win the Earth Optimization Game",
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
  description: "How your representatives actually vote vs what citizens want",
  matchPrefixes: [ROUTES.politicians],
};

export const scoreboardLink: NavItem = {
  href: ROUTES.scoreboard,
  label: "Scoreboard",
  emoji: "📊",
  description: "Humanity's Scoreboard — live game metrics: health, income, pool size, participants",
  matchPrefixes: [ROUTES.scoreboard],
};

export const iabLink: NavItem = {
  href: ROUTES.iab,
  label: "Incentive Alignment Bonds",
  emoji: "🤝",
  description: "Phase 2 lobbying bonds — fund the treaty campaign, earn 10% of treaty revenue",
};

export const prizeLink: NavItem = {
  href: ROUTES.prize,
  label: "Prize",
  emoji: "🏆",
  description: "Earth Optimization Prize — outcome-based pool for governance reform",
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
  description: "How the Earth Optimization Machine works and why it exists",
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
  { id: "participate", label: "Participate", items: [wishocracyLink, alignmentLink, referendumLink] },
  { id: "explore", label: "Explore", items: [studiesLink, compareLink, policiesLink, budgetLink, governmentsLink, misconceptionsLink, discoveriesLink] },
  { id: "fund", label: "Fund", items: [prizeLink, scoreboardLink, iabLink, moneyLink] },
  { id: "system", label: "System", items: [politicianLeaderboardLink, transparencyLink, federalReserveLink, departmentOfWarLink, aboutLink] },
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
