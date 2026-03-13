export const ROUTES = {
  home: "/",
  vote: "/vote",
  alignment: "/alignment",
  profile: "/profile",
  chat: "/chat",
  about: "/about",
  outcomes: "/outcomes",
  compare: "/compare",
  policies: "/policies",
  budget: "/budget",
  misconceptions: "/misconceptions",
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
  callbackUrl: string = ROUTES.vote,
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
  matchPrefixes: [ROUTES.outcomes, "/studies"],
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

/** Pages under the "Explore" dropdown in the main nav */
export const exploreLinks: NavItem[] = [
  studiesLink,
  compareLink,
  policiesLink,
  budgetLink,
  misconceptionsLink,
];

export const wishocracyLink: NavItem = {
  href: ROUTES.vote,
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
  href: ROUTES.chat,
  label: "Wishonia",
  emoji: "👽",
  description: "Chat with an alien AI that's been governing a planet for 4,237 years",
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
  description: "How Optomitron works and why it exists",
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

/** External paper links for the footer */
export const paperLinks: NavItem[] = [
  {
    label: "dFDA Spec",
    href: "https://dfda-spec.warondisease.org",
    emoji: "🧬",
    description: "Decentralized FDA — causal inference on health interventions",
    external: true,
  },
  {
    label: "Wishocracy",
    href: "https://wishocracy.warondisease.org",
    emoji: "🗳️",
    description: "Preference aggregation via pairwise comparisons (RAPPA)",
    external: true,
  },
  {
    label: "Optimal Policy Generator",
    href: "https://opg.warondisease.org",
    emoji: "📋",
    description: "Score and rank policies by causal impact on welfare",
    external: true,
  },
  {
    label: "Optimal Budget Generator",
    href: "https://obg.warondisease.org",
    emoji: "💰",
    description: "Allocate budgets using diminishing-returns modeling",
    external: true,
  },
  {
    label: "Optimocracy",
    href: "https://optimocracy.warondisease.org",
    emoji: "⚖️",
    description: "Two-metric welfare function for governance evaluation",
    external: true,
  },
  {
    label: "Invisible Graveyard",
    href: "https://invisible-graveyard.warondisease.org",
    emoji: "⚰️",
    description: "102M deaths from FDA post-safety efficacy delays since 1962",
    external: true,
  },
  {
    label: "The 1% Treaty",
    href: "https://impact.warondisease.org",
    emoji: "🕊️",
    description: "Redirect 1% of military spending to clinical trials",
    external: true,
  },
  {
    label: "Political Dysfunction Tax",
    href: "https://political-dysfunction-tax.warondisease.org",
    emoji: "🏛️",
    description: "$101T/yr cost of governance inefficiency worldwide",
    external: true,
  },
  {
    label: "Incentive Alignment Bonds",
    href: "https://iab.warondisease.org",
    emoji: "🤝",
    description: "Smart contracts funding politicians by alignment score",
    external: true,
  },
  {
    label: "Full Manual",
    href: "https://manual.warondisease.org",
    emoji: "📖",
    description: "Complete guide to ending war and disease",
    external: true,
  },
];

/** Community links for the footer */
export const communityLinks: NavItem[] = [
  {
    label: "GitHub",
    href: "https://github.com/mikepsinn/optomitron",
    emoji: "💻",
    description: "Source code, issues, and contributions",
    external: true,
  },
  {
    label: "README",
    href: "https://github.com/mikepsinn/optomitron#readme",
    emoji: "📝",
    description: "Feature overview, setup, and architecture at a glance",
    external: true,
  },
  {
    label: "MIT License",
    href: "https://opensource.org/licenses/MIT",
    emoji: "📄",
    description: "Free to use, modify, and distribute",
    external: true,
  },
];
