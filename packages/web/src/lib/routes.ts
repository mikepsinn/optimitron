export const ROUTES = {
  home: "/",
  wishocracy: "/wishocracy",
  alignment: "/alignment",
  profile: "/profile",
  wishonia: "/wishonia",
  about: "/about",
  outcomes: "/outcomes",
  compare: "/compare",
  policies: "/policies",
  budget: "/budget",
  misconceptions: "/misconceptions",
  discoveries: "/discoveries",
  studies: "/studies",
  civic: "/civic",
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

/** Pages under the "Explore" dropdown in the main nav */
export const exploreLinks: NavItem[] = [
  studiesLink,
  compareLink,
  policiesLink,
  budgetLink,
  misconceptionsLink,
  discoveriesLink,
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
  trackLink,
  aboutLink,
];

/** Footer-only internal links */
export const footerAppLinks: NavItem[] = [
  wishocracyLink,
  alignmentLink,
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
  href: "https://github.com/mikepsinn/optomitron",
  emoji: "💻",
  description: "Source code, issues, and contributions",
  external: true,
};

export const readmeLink: NavItem = {
  label: "README",
  href: "https://github.com/mikepsinn/optomitron#readme",
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
