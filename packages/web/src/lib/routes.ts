export const ROUTES = {
  home: "/",
  vote: "/vote",
  chat: "/chat",
  signIn: "/auth/signin",
} as const;

export interface NavItem {
  href: string;
  label: string;
  emoji?: string;
  description?: string;
  external?: boolean;
}

/** Pages under the "Explore" dropdown in the main nav */
export const exploreLinks: NavItem[] = [
  {
    href: "/outcomes",
    label: "Outcome Hubs",
    emoji: "📊",
    description: "Track health and wealth outcomes across jurisdictions",
  },
  {
    href: "/budget",
    label: "Optimal Budget",
    emoji: "💰",
    description: "Evidence-based budget allocation recommendations",
  },
  {
    href: "/policies",
    label: "Optimal Policies",
    emoji: "📋",
    description: "Policy scoring via causal inference on real outcomes",
  },
  {
    href: "/misconceptions",
    label: "Myth vs Data",
    emoji: "🔍",
    description: "Popular beliefs tested against empirical data",
  },
  {
    href: "/compare",
    label: "Compare Countries",
    emoji: "🌍",
    description: "Side-by-side outcome comparisons across nations",
  },
];

/** Top-level nav items (not in dropdown) */
export const topLinks: NavItem[] = [
  {
    href: "/vote",
    label: "Wishocracy",
    emoji: "🗳️",
    description: "Allocate your ideal budget via pairwise comparisons",
  },
  {
    href: "/chat",
    label: "Track",
    emoji: "💬",
    description: "Log treatments, symptoms, and meals",
  },
  {
    href: "/about",
    label: "About",
    emoji: "ℹ️",
    description: "How Optomitron works and why it exists",
  },
];

/** All internal nav links (explore + top-level) */
export const allNavLinks: NavItem[] = [...exploreLinks, ...topLinks];

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
    label: "MIT License",
    href: "https://opensource.org/licenses/MIT",
    emoji: "📄",
    description: "Free to use, modify, and distribute",
    external: true,
  },
];
