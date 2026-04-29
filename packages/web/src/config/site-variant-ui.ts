import type { SiteKey } from "@/lib/site";
import {
  ROUTES,
  communityLinks,
  dashboardLink,
  exploreLinks,
  footerAppLinks,
  githubLink,
  navSections,
  paperLinks,
  tasksLink,
  treatyLink,
  voteLink,
  type NavItem,
  type NavSection,
} from "@/lib/routes";

export interface SiteNavConfig {
  brandHref: string;
  brandLabel: string;
  desktopBrandLabel: string;
  menuEnabled: boolean;
  menuTitle: string;
  searchEnabled: boolean;
  sections: NavSection[];
  signInCallbackUrl: string;
}

export interface SiteFooterColumn {
  items: NavItem[];
  title: string;
}

export interface SiteFooterConfig {
  bottomText: string;
  brandDescription: string;
  brandHref: string;
  brandLabel: string;
  columns: SiteFooterColumn[];
  sourceLink?: NavItem;
}

export interface SiteVariantUiConfig {
  footer: SiteFooterConfig;
  nav: SiteNavConfig;
  showGameScoreBar: boolean;
}

const onePercentDashboardLink: NavItem = {
  ...dashboardLink,
  description:
    "Assign humans Earth Optimization Tasks and track the assignments you created.",
  label: "Dashboard",
  tagline: "Assign and track Earth Optimization Tasks",
};

const onePercentTasksLink: NavItem = {
  ...tasksLink,
  description:
    "The President Management System for the humans who still need to complete the 1% Treaty task.",
  label: "President Management System",
  tagline: "Track overdue treaty assignments",
};

const onePercentVoteLink: NavItem = {
  ...voteLink,
  description:
    "Complete the 1% Treaty task, then give the next human their Earth Optimization Task.",
  tagline: "Complete the 1% Treaty task",
};

const onePercentTreatyLink: NavItem = {
  ...treatyLink,
  label: "Read the Treaty",
};

const onePercentWhyLink: NavItem = {
  href: "/why",
  label: "Why",
  emoji: "?",
  description: "The numbers behind redirecting 1% of military spending.",
  tagline: "The numbers behind the treaty",
  cta: "Read Why",
};

const onePercentEndorseLink: NavItem = {
  href: "/endorse",
  label: "Endorse",
  emoji: "+",
  description: "Put an organization on record supporting the 1% Treaty.",
  tagline: "Endorse as an organization",
  cta: "Endorse",
};

const onePercentCoalitionLink: NavItem = {
  href: "/coalition",
  label: "Supporters",
  emoji: "*",
  description: "Organizations publicly supporting the 1% Treaty.",
  tagline: "See public supporters",
  cta: "See Supporters",
};

const onePercentLegalLink: NavItem = {
  href: "/legal",
  label: "Legal",
  emoji: "§",
  description: "Legal notes for boards and counsel reviewing endorsement.",
  tagline: "For boards and counsel",
  cta: "Read Legal Notes",
};

const onePercentNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [
      onePercentVoteLink,
      onePercentDashboardLink,
      onePercentTasksLink,
    ],
  },
  {
    id: "learn",
    label: "Learn",
    items: [
      onePercentTreatyLink,
      onePercentWhyLink,
      onePercentCoalitionLink,
      onePercentEndorseLink,
      onePercentLegalLink,
    ],
  },
];

const SITE_VARIANT_UI_CONFIGS: Record<SiteKey, SiteVariantUiConfig> = {
  optimitron: {
    showGameScoreBar: true,
    nav: {
      brandHref: ROUTES.home,
      brandLabel: "Optimitron",
      desktopBrandLabel: "⚡ Optimitron",
      menuEnabled: true,
      menuTitle: "Navigation",
      searchEnabled: true,
      sections: navSections,
      signInCallbackUrl: ROUTES.wishocracy,
    },
    footer: {
      brandHref: ROUTES.home,
      brandLabel: "⚡ Optimitron",
      brandDescription: "The Earth Optimization Machine.",
      bottomText:
        "© 4237 Wishonia. All rights reserved in this and 6,412 adjacent timelines. Unauthorized reproduction of the general welfare is encouraged and, frankly, overdue.",
      sourceLink: githubLink,
      columns: [
        { title: "App", items: footerAppLinks },
        { title: "Analysis", items: exploreLinks },
        { title: "Papers", items: paperLinks },
        { title: "Open Source", items: communityLinks },
      ],
    },
  },
  onePercentTreaty: {
    showGameScoreBar: false,
    nav: {
      brandHref: ROUTES.home,
      brandLabel: "1% Treaty",
      desktopBrandLabel: "1% Treaty",
      menuEnabled: true,
      menuTitle: "1% Treaty",
      searchEnabled: false,
      sections: onePercentNavSections,
      signInCallbackUrl: ROUTES.dashboard,
    },
    footer: {
      brandHref: ROUTES.home,
      brandLabel: "1% Treaty",
      brandDescription:
        "Redirect 1% of military spending to curing disease.",
      bottomText:
        "© 4237 Wishonia. Reproduction of the general welfare is encouraged and, at this point, somewhat urgent.",
      columns: [
        {
          title: "Campaign",
          items: [
            onePercentVoteLink,
            onePercentTreatyLink,
            onePercentDashboardLink,
            onePercentTasksLink,
          ],
        },
        {
          title: "Proof",
          items: [
            onePercentWhyLink,
            onePercentCoalitionLink,
            onePercentEndorseLink,
            onePercentLegalLink,
          ],
        },
      ],
    },
  },
};

export function getSiteVariantUiConfig(
  siteKey: SiteKey,
): SiteVariantUiConfig {
  return SITE_VARIANT_UI_CONFIGS[siteKey];
}
