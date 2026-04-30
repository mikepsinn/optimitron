import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import type { ReferendumSiteContentKey } from "@/content/referendum-sites";
import {
  ROUTES,
  conditionsLink,
  communityLinks,
  dashboardLink,
  dfdaLink,
  dihLink,
  exploreLinks,
  footerAppLinks,
  githubLink,
  inviteVoterLink,
  navSections,
  paperLinks,
  tasksLink,
  treatmentsLink,
  treatyLink,
  voteLink,
  type NavItem,
  type NavSection,
} from "@/lib/routes";

export const OPTIMITRON_CANONICAL_ORIGIN = "https://optimitron.com";
export const OPTIMITRON_LOCAL_ORIGIN = "http://localhost:3001";

// ---------------------------------------------------------------------------
// Per-host site configuration (generic Site* / referendum-microsite layer)
// ---------------------------------------------------------------------------

export type SiteKey =
  | "optimitron"
  | "dfda"
  | "dih"
  | "warOnDisease"
  | "onePercentTreaty"
  | "trialAbundanceSurvey";

export const SITE_VARIANT_OVERRIDE_HEADER = "x-optimitron-site-key";

export type SiteChromeVariant = "platform" | "referendum";
export type SiteHomeVariant =
  | "optimitronLanding"
  | "onePercentTreatyLanding"
  | "initiativeLanding";
export type SiteDashboardVariant =
  | "optimitronDashboard"
  | "treatyTaskDashboard";
export type SiteInitiativeKey = SiteKey | "optimizeEarth";

export interface SiteInitiativeConfig {
  key: SiteInitiativeKey;
  name: string;
  shortName: string;
  description: string;
  eyebrow: string;
  primaryPath: string;
  parentKey: SiteInitiativeKey | null;
  rootTaskKey: string | null;
}

export interface SiteHomeAction {
  href: string;
  label: string;
  variant?: "primary" | "outline" | "cyan" | "yellow";
}

export interface SiteRootMetadata {
  description: string;
  keywords: string[];
  openGraphDescription: string;
  openGraphImage: {
    alt: string;
    height?: number;
    url: string;
    width?: number;
  };
  openGraphTitle: string;
  title: string;
  twitterDescription: string;
  twitterImage: string;
  twitterTitle: string;
}

export interface SiteRoutePolicy {
  canonicalPrefixes: readonly string[];
  minimalChromePrefixes: readonly string[];
  operationalPrefixes: readonly string[];
  publicPrefixes: readonly string[];
  restrictToAllowlist: boolean;
}

export type SiteSitemapDynamicRouteGroup =
  | "conditions"
  | "treatments"
  | "conditionTreatments";

export interface SiteSitemapConfig {
  dynamicRouteGroups?: readonly SiteSitemapDynamicRouteGroup[];
  includePublicRoutes?: boolean;
  landingPageOnly?: boolean;
}

export interface SiteAssetsConfig {
  appleTouchIcon: string;
  backgroundColor: string;
  favicon: string;
  icon16?: string;
  icon32: string;
  icon192: string;
  icon512: string;
  maskableIcon?: string;
  themeColor: string;
}

export interface SiteEmailBranding {
  footerText?: string;
  fromName: string;
  orgName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface SiteNavConfig {
  brandHref: string;
  brandLabel: string;
  desktopBrandLabel: string;
  menuEnabled: boolean;
  menuTitle: string;
  quickAction?: NavItem;
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
}

export interface SitePageVariants {
  dashboard: SiteDashboardVariant;
  home: SiteHomeVariant;
}

export interface SiteConfig {
  key: SiteKey;
  chromeVariant: SiteChromeVariant;
  canonicalOrigin: string;
  domains: readonly string[];
  name: string;
  shortName: string;
  alternateSiteNames: string[];
  description: string;
  ogImage: string;
  analyticsId: string | undefined;
  contentKey: ReferendumSiteContentKey | null;
  organizationName: string;
  organizationUrl: string;
  organizationLogoPath: string;
  publicContactEmail: string;
  publicContactUrl: string;
  legalEntityName: string;
  emailBranding: SiteEmailBranding;
  footerComplianceNotice: string | null;
  sameAs: string[];
  initiative: SiteInitiativeConfig;
  homeActions: readonly SiteHomeAction[];
  /** Required for referendum microsites. Absent on the master platform. */
  primaryReferendumSlug: string | null;
  /** Optional support for task/accountability surfaces on referendum microsites. */
  primaryTaskKey: string | null;
  rootMetadata: SiteRootMetadata;
  routePolicy: SiteRoutePolicy;
  assets: SiteAssetsConfig;
  sitemap: SiteSitemapConfig;
  ui: SiteVariantUiConfig;
  pageVariants: SitePageVariants;
}

const ORGANIZATION_NAME = "The Earth Optimization Commission";
const ORGANIZATION_URL = OPTIMITRON_CANONICAL_ORIGIN;
const ORGANIZATION_LOGO_PATH = "/icons/icon-192.png";
const PUBLIC_CONTACT_EMAIL = "hello@warondisease.org";
const PUBLIC_CONTACT_URL = `${OPTIMITRON_CANONICAL_ORIGIN}/about`;
const ORGANIZATION_SAME_AS = ["https://github.com/mikepsinn/optimitron"];
const EARTH_OPTIMIZATION_COMMISSION =
  "The Earth Optimization Commission";
const NO_FOOTER_COMPLIANCE_NOTICE = null;

function siteAssetPath(directory: string, filename: string) {
  return `/site-assets/${directory}/${filename}`;
}

function copiedSiteAssets(input: {
  appleTouchIcon?: string;
  backgroundColor?: string;
  directory: string;
  favicon?: string;
  icon16?: string;
  icon32?: string;
  icon192?: string;
  icon512?: string;
  maskableIcon?: string;
  themeColor: string;
}): SiteAssetsConfig {
  const path = (filename: string) => siteAssetPath(input.directory, filename);

  return {
    appleTouchIcon: path(input.appleTouchIcon ?? "apple-touch-icon.png"),
    backgroundColor: input.backgroundColor ?? "#ffffff",
    favicon: path(input.favicon ?? "favicon.ico"),
    icon16: input.icon16 ? path(input.icon16) : undefined,
    icon32: path(input.icon32 ?? "favicon-32x32.png"),
    icon192: path(input.icon192 ?? "android-chrome-192x192.png"),
    icon512: path(input.icon512 ?? "android-chrome-512x512.png"),
    maskableIcon: input.maskableIcon ? path(input.maskableIcon) : undefined,
    themeColor: input.themeColor,
  };
}

const OPTIMITRON_ASSETS: SiteAssetsConfig = {
  appleTouchIcon: "/apple-touch-icon.png",
  backgroundColor: "#0f172a",
  favicon: "/favicon.ico",
  icon16: "/icons/icon-16.png",
  icon32: "/icons/icon-32.png",
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  maskableIcon: "/icons/icon-maskable-512.png",
  themeColor: "#3b82f6",
};

const DFDA_ASSETS = copiedSiteAssets({
  directory: "dfda",
  icon16: "favicon-16x16.png",
  themeColor: "#2563eb",
});

const DIH_ASSETS = copiedSiteAssets({
  directory: "dih",
  icon16: "favicon-16x16.png",
  themeColor: "#ff6b9d",
});

const WAR_ON_DISEASE_ASSETS = copiedSiteAssets({
  appleTouchIcon: "warondisease-apple-touch-icon.png",
  directory: "warondisease",
  favicon: "warondisease-favicon.png",
  icon32: "warondisease-favicon-32x32.png",
  icon192: "warondisease-android-chrome-192x192.png",
  icon512: "warondisease-android-chrome-512x512.png",
  maskableIcon: "warondisease-android-chrome-512x512.png",
  themeColor: "#ff6b9d",
});

const ONE_PERCENT_TREATY_ASSETS = copiedSiteAssets({
  appleTouchIcon: "treaty-icon-square.png",
  directory: "treaty",
  favicon: "1-percent-treaty-favicon.png",
  icon32: "1-percent-treaty-favicon.png",
  icon192: "treaty-icon-square.png",
  icon512: "treaty-icon-square.png",
  maskableIcon: "treaty-icon-square.png",
  themeColor: "#ff6b9d",
});

const TRIAL_ABUNDANCE_SURVEY_ASSETS = copiedSiteAssets({
  directory: "survey",
  icon16: "favicon-16x16.png",
  themeColor: "#000000",
});

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
    "Track public leaders and the Earth Optimization Tasks assigned to humans who still need to vote.",
  label: "President Management System",
  tagline: "Track public leaders and treaty assignments",
};

const onePercentVoteLink: NavItem = {
  ...voteLink,
  description:
    "Vote on the 1% Treaty, then ask another human to vote.",
  tagline: "Vote on the 1% Treaty",
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

const warOnDiseaseNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [onePercentVoteLink, onePercentDashboardLink, onePercentTreatyLink],
  },
  {
    id: "learn",
    label: "Learn",
    items: [
      conditionsLink,
      treatmentsLink,
      onePercentWhyLink,
      onePercentLegalLink,
    ],
  },
];

const trialSurveyLink: NavItem = {
  href: "/survey",
  label: "Take Survey",
  emoji: "□",
  description:
    "Answer two questions about government funding for pragmatic clinical trials.",
  tagline: "Answer two survey questions",
  cta: "Take Survey",
};

const trialEmbedLink: NavItem = {
  href: "/organizations",
  label: "Embed Survey",
  emoji: "<>",
  description: "Get your organization's survey link and iframe code.",
  tagline: "Survey link and iframe code",
  cta: "Embed Survey",
};

const trialSurveyNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [trialSurveyLink, trialEmbedLink],
  },
];

const dfdaNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [conditionsLink, treatmentsLink],
  },
  {
    id: "system",
    label: "System",
    items: [dfdaLink, dihLink],
  },
];

const dihNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [dihLink, trialEmbedLink],
  },
  {
    id: "allocation",
    label: "Allocation",
    items: [conditionsLink, treatmentsLink],
  },
];

const OPTIMITRON_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "Optimitron",
    desktopBrandLabel: "⚡ Optimitron",
    menuEnabled: true,
    menuTitle: "Navigation",
    quickAction: inviteVoterLink,
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
};

const DFDA_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "DFDA",
    desktopBrandLabel: "DFDA",
    menuEnabled: true,
    menuTitle: "DFDA",
    searchEnabled: false,
    sections: dfdaNavSections,
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "DFDA",
    brandDescription:
      "Find conditions, treatments, outcomes, and clinical trials in one evidence system.",
    bottomText: "DFDA makes medical evidence easier to find and use.",
    columns: [
      { title: "Medical", items: [conditionsLink, treatmentsLink] },
      { title: "System", items: [dfdaLink, dihLink] },
    ],
  },
};

const DIH_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "DIH",
    desktopBrandLabel: "DIH",
    menuEnabled: true,
    menuTitle: "DIH",
    searchEnabled: false,
    sections: dihNavSections,
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "DIH",
    brandDescription: "Create and fund disease-focused research institutes.",
    bottomText:
      "DIH funds disease eradication work by verified public priorities.",
    columns: [
      { title: "Institutes", items: [dihLink, trialEmbedLink] },
      { title: "Evidence", items: [conditionsLink, treatmentsLink] },
    ],
  },
};

const WAR_ON_DISEASE_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "War on Disease",
    desktopBrandLabel: "War on Disease",
    menuEnabled: true,
    menuTitle: "War on Disease",
    quickAction: inviteVoterLink,
    searchEnabled: false,
    sections: warOnDiseaseNavSections,
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "War on Disease",
    brandDescription:
      "Move money from weapons into cures, starting with the 1% Treaty.",
    bottomText:
      "War on Disease starts by moving money from weapons into cures.",
    columns: [
      {
        title: "Campaign",
        items: [
          onePercentVoteLink,
          onePercentTreatyLink,
          onePercentDashboardLink,
        ],
      },
      {
        title: "Evidence",
        items: [conditionsLink, treatmentsLink, onePercentWhyLink],
      },
    ],
  },
};

const ONE_PERCENT_TREATY_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "1% Treaty",
    desktopBrandLabel: "1% Treaty",
    menuEnabled: true,
    menuTitle: "1% Treaty",
    quickAction: inviteVoterLink,
    searchEnabled: false,
    sections: onePercentNavSections,
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "1% Treaty",
    brandDescription:
      "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
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
};

const TRIAL_ABUNDANCE_SURVEY_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "Trial Abundance Survey",
    desktopBrandLabel: "Trial Abundance Survey",
    menuEnabled: true,
    menuTitle: "Trial Abundance Survey",
    searchEnabled: false,
    sections: trialSurveyNavSections,
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "Trial Abundance Survey",
    brandDescription:
      "A two-question survey about clinical trial funding.",
    bottomText:
      "Use your organization link so responses from your audience get credited correctly.",
    columns: [{ title: "Survey", items: [trialSurveyLink, trialEmbedLink] }],
  },
};

const OPTIMITRON_PLATFORM_PREFIXES = [
  "/agencies",
  "/scoreboard",
  "/search",
  "/prize",
  "/iab",
  "/opg",
  "/obg",
  "/efficiency",
  "/dividend",
  "/government-size",
  "/legislation",
  "/wishonia",
  "/moronia",
  "/tools",
  "/contribute",
  "/fund",
  "/donate",
  "/developers",
  "/demo",
  "/video",
] as const;

const OPTIMITRON_CONFIG: SiteConfig = {
  key: "optimitron",
  chromeVariant: "platform",
  canonicalOrigin: OPTIMITRON_CANONICAL_ORIGIN,
  domains: [
    "optimitron.com",
    "www.optimitron.com",
    "optimitron.earth",
    "www.optimitron.earth",
    "optimitron.local",
  ],
  name: "Optimitron",
  shortName: "Optimitron",
  alternateSiteNames: ["The Earth Optimization Game"],
  description: "Earth Optimization Machine.",
  ogImage: "/og-image.jpg",
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "Optimitron",
    primaryColor: "#ff00ff",
    secondaryColor: "#00d9ff",
    orgName: EARTH_OPTIMIZATION_COMMISSION,
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "optimizeEarth",
    name: "Optimize Earth",
    shortName: "Optimize Earth",
    description:
      "A task system for finding the highest-value work on Earth and assigning it to humans and institutions.",
    eyebrow: "Optimitron",
    primaryPath: "/",
    parentKey: null,
    rootTaskKey: null,
  },
  homeActions: [
    { href: "/dashboard", label: "Open Dashboard", variant: "primary" },
    { href: "/tasks", label: "See Tasks", variant: "outline" },
  ],
  primaryReferendumSlug: null,
  primaryTaskKey: null,
  rootMetadata: {
    title: "Optimitron — The Evidence-Based Earth Optimization Game",
    description:
      "Earth Optimization Game for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data.",
    openGraphTitle:
      "Optimitron — The Evidence-Based Earth Optimization Game",
    openGraphDescription:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes. See what works, what fails, and what to change next.",
    openGraphImage: {
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Optimitron — The Evidence-Based Earth Optimization Game",
    },
    twitterTitle: "Optimitron — Earth Optimization Game",
    twitterDescription:
      "Planetary debugging software for budgets, policies, politicians, and public outcomes.",
    twitterImage: "/twitter-image.jpg",
    keywords: [
      "Optimitron",
      "The Earth Optimization Game",
      "Earth Optimization Game",
      "budget optimization",
      "policy analysis",
      "public outcomes",
    ],
  },
  routePolicy: {
    canonicalPrefixes: OPTIMITRON_PLATFORM_PREFIXES,
    restrictToAllowlist: false,
    publicPrefixes: [],
    operationalPrefixes: [],
    minimalChromePrefixes: [
      "/vote",
      "/questions",
      "/humanity-management-training",
    ],
  },
  assets: OPTIMITRON_ASSETS,
  sitemap: {
    includePublicRoutes: true,
  },
  ui: OPTIMITRON_UI,
  pageVariants: {
    home: "optimitronLanding",
    dashboard: "optimitronDashboard",
  },
};

const DFDA_CONFIG: SiteConfig = {
  key: "dfda",
  chromeVariant: "platform",
  canonicalOrigin: "https://dfda.earth",
  domains: ["dfda.earth", "www.dfda.earth", "dfda.local"],
  name: "DFDA",
  shortName: "DFDA",
  alternateSiteNames: ["Decentralized FDA", "dFDA"],
  description:
    "Find conditions, treatments, outcomes, and clinical trials in one evidence system.",
  ogImage: "/site-assets/dfda/dfda-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_DFDA_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "DFDA",
    primaryColor: "#2563eb",
    secondaryColor: "#ffffff",
    orgName: "DFDA",
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "dfda",
    name: "Decentralized FDA",
    shortName: "DFDA",
    description:
      "Find conditions, treatments, outcomes, and clinical trials in one evidence system.",
    eyebrow: "Medical Evidence",
    primaryPath: "/agencies/dfda/conditions",
    parentKey: "optimizeEarth",
    rootTaskKey: null,
  },
  homeActions: [
    { href: ROUTES.conditions, label: "Browse Conditions", variant: "primary" },
    { href: ROUTES.treatments, label: "Browse Treatments", variant: "outline" },
  ],
  primaryReferendumSlug: null,
  primaryTaskKey: null,
  rootMetadata: {
    title: "DFDA — Decentralized FDA",
    description:
      "Find conditions, treatments, outcomes, and clinical trials in one evidence system.",
    openGraphTitle: "DFDA — Decentralized FDA",
    openGraphDescription:
      "Browse medical conditions, compare treatments, and find pragmatic clinical trials.",
    openGraphImage: {
      url: "/site-assets/dfda/dfda-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "DFDA — Decentralized FDA",
    },
    twitterTitle: "DFDA — Decentralized FDA",
    twitterDescription:
      "Browse conditions, treatments, outcomes, and clinical trials.",
    twitterImage: "/site-assets/dfda/dfda-og-1200x630.png",
    keywords: [
      "DFDA",
      "Decentralized FDA",
      "clinical trials",
      "treatment rankings",
      "outcome labels",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [
      "/conditions",
      "/treatments",
      "/outcome-labels",
      "/find-trials",
      "/agencies/dfda",
    ],
    restrictToAllowlist: true,
    publicPrefixes: [
      "/conditions",
      "/treatments",
      "/outcome-labels",
      "/find-trials",
      "/agencies/dfda",
      "/about",
      "/donate",
    ],
    operationalPrefixes: ["/auth", "/dashboard", "/profile", "/settings"],
    minimalChromePrefixes: [],
  },
  assets: DFDA_ASSETS,
  sitemap: {
    dynamicRouteGroups: ["conditions", "treatments", "conditionTreatments"],
  },
  ui: DFDA_UI,
  pageVariants: {
    home: "initiativeLanding",
    dashboard: "optimitronDashboard",
  },
};

const DIH_CONFIG: SiteConfig = {
  key: "dih",
  chromeVariant: "platform",
  canonicalOrigin: "https://dih.earth",
  domains: [
    "dih.earth",
    "www.dih.earth",
    "dih.local",
    "acceleratedmedicine.org",
    "www.acceleratedmedicine.org",
    "acceleratedmedicine.local",
  ],
  name: "DIH",
  shortName: "DIH",
  alternateSiteNames: [
    "Decentralized Institutes of Health",
    "Institute for Accelerated Medicine",
  ],
  description:
    "Create and fund disease-focused research institutes, then allocate resources by verified public priorities.",
  ogImage: "/site-assets/dih/dih-og-social-70s-utopian-1280x640.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_DIH_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "DIH",
    primaryColor: "#ff6b9d",
    secondaryColor: "#00d4ff",
    orgName: "Decentralized Institutes of Health",
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "dih",
    name: "Decentralized Institutes of Health",
    shortName: "DIH",
    description:
      "Create and fund disease-focused research institutes, then allocate resources by verified public priorities.",
    eyebrow: "Research Funding",
    primaryPath: "/agencies/dih",
    parentKey: "optimizeEarth",
    rootTaskKey: null,
  },
  homeActions: [
    { href: "/agencies/dih", label: "Open DIH", variant: "primary" },
    {
      href: "/agencies/dcongress/wishocracy",
      label: "Open Wishocracy",
      variant: "outline",
    },
  ],
  primaryReferendumSlug: null,
  primaryTaskKey: null,
  rootMetadata: {
    title: "DIH — Decentralized Institutes of Health",
    description:
      "Create disease-focused institutes, fund them through verified demand, and allocate resources with Wishocracy.",
    openGraphTitle: "DIH — Decentralized Institutes of Health",
    openGraphDescription:
      "Create and fund disease-focused research institutes, then allocate resources by verified public priorities.",
    openGraphImage: {
      url: "/site-assets/dih/dih-og-social-70s-utopian-1280x640.png",
      width: 1280,
      height: 640,
      alt: "DIH — Decentralized Institutes of Health",
    },
    twitterTitle: "DIH — Decentralized Institutes of Health",
    twitterDescription:
      "Create and fund disease-focused research institutes.",
    twitterImage: "/site-assets/dih/dih-og-social-70s-utopian-1280x640.png",
    keywords: [
      "DIH",
      "Decentralized Institutes of Health",
      "medical research funding",
      "Wishocracy",
      "disease eradication",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [
      "/agencies/dih",
      "/institutes",
      "/agencies/dcongress/wishocracy",
    ],
    restrictToAllowlist: true,
    publicPrefixes: [
      "/agencies/dih",
      "/institutes",
      "/survey",
      "/organizations",
      "/conditions",
      "/treatments",
      "/agencies/dfda/conditions",
      "/agencies/dfda/treatments",
      "/agencies/dcongress/wishocracy",
      "/about",
      "/donate",
    ],
    operationalPrefixes: ["/auth", "/dashboard", "/profile", "/settings"],
    minimalChromePrefixes: [],
  },
  assets: DIH_ASSETS,
  sitemap: {
    includePublicRoutes: false,
  },
  ui: DIH_UI,
  pageVariants: {
    home: "initiativeLanding",
    dashboard: "optimitronDashboard",
  },
};

const WAR_ON_DISEASE_CONFIG: SiteConfig = {
  key: "warOnDisease",
  chromeVariant: "referendum",
  canonicalOrigin: "https://warondisease.org",
  domains: [
    "warondisease.org",
    "www.warondisease.org",
    "warondisease.local",
  ],
  name: "War on Disease",
  shortName: "War on Disease",
  alternateSiteNames: ["War on Disease"],
  description:
    "Move money from weapons into cures, starting with the 1% Treaty.",
  ogImage: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_WAR_ON_DISEASE_ID,
  contentKey: "onePercentTreaty",
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "War on Disease",
    primaryColor: "#ff6b9d",
    secondaryColor: "#00d4ff",
    orgName: "War on Disease",
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "warOnDisease",
    name: "War on Disease",
    shortName: "War on Disease",
    description:
      "Move money from weapons into cures, starting with the 1% Treaty.",
    eyebrow: "Disease Eradication",
    primaryPath: "/",
    parentKey: "optimizeEarth",
    rootTaskKey: null,
  },
  homeActions: [
    { href: "/vote", label: "Vote Now", variant: "primary" },
    { href: "/treaty", label: "Read the Treaty", variant: "outline" },
  ],
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
  rootMetadata: {
    title: "War on Disease",
    description:
      "Vote on redirecting 1% of military spending toward clinical trials and disease eradication.",
    openGraphTitle: "War on Disease",
    openGraphDescription:
      "Move money from weapons into cures, starting with the 1% Treaty.",
    openGraphImage: {
      url: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "War on Disease social image",
    },
    twitterTitle: "War on Disease",
    twitterDescription:
      "Vote on redirecting 1% of military spending toward clinical trials and disease eradication.",
    twitterImage: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
    keywords: [
      "War on Disease",
      "1% Treaty",
      "disease eradication",
      "clinical trials",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [],
    restrictToAllowlist: true,
    publicPrefixes: [
      "/treaty",
      "/tasks",
      "/people",
      "/governments",
      "/declaration",
      "/why",
      "/legal",
      "/impact",
      "/organizations",
      "/conditions",
      "/treatments",
      "/agencies/dfda/conditions",
      "/agencies/dfda/treatments",
      "/reasoning",
      "/donate",
    ],
    operationalPrefixes: [
      "/r",
      "/vote",
      "/questions",
      "/auth",
      "/dashboard",
      "/profile",
      "/settings",
      "/humanity-management-training",
    ],
    minimalChromePrefixes: [
      "/vote",
      "/questions",
      "/humanity-management-training",
    ],
  },
  assets: WAR_ON_DISEASE_ASSETS,
  sitemap: {
    includePublicRoutes: true,
  },
  ui: WAR_ON_DISEASE_UI,
  pageVariants: {
    home: "onePercentTreatyLanding",
    dashboard: "treatyTaskDashboard",
  },
};

const ONE_PERCENT_TREATY_CONFIG: SiteConfig = {
  key: "onePercentTreaty",
  chromeVariant: "referendum",
  canonicalOrigin: "https://1percenttreaty.org",
  domains: [
    "1percenttreaty.org",
    "www.1percenttreaty.org",
    "1percenttreaty.local",
  ],
  name: "1% Treaty",
  shortName: "1% Treaty",
  alternateSiteNames: ["1 Percent Treaty"],
  description:
    "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
  ogImage: "/site-assets/treaty/treaty-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_ONE_PERCENT_TREATY_ID,
  contentKey: "onePercentTreaty",
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "1% Treaty",
    primaryColor: "#ff6b9d",
    secondaryColor: "#00d4ff",
    orgName: "1% Treaty",
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "onePercentTreaty",
    name: "1% Treaty",
    shortName: "1% Treaty",
    description:
      "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
    eyebrow: "Referendum",
    primaryPath: "/treaty",
    parentKey: "warOnDisease",
    rootTaskKey: null,
  },
  homeActions: [
    { href: "/vote", label: "Vote Now", variant: "primary" },
    { href: "/treaty", label: "Read the Treaty", variant: "outline" },
  ],
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
  rootMetadata: {
    title: "1% Treaty",
    description:
      "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
    openGraphTitle: "1% Treaty",
    openGraphDescription:
      "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
    openGraphImage: {
      url: "/site-assets/treaty/treaty-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "1% Treaty social image",
    },
    twitterTitle: "1% Treaty",
    twitterDescription:
      "Vote on redirecting 1% of military spending to pragmatic clinical trials.",
    twitterImage: "/site-assets/treaty/treaty-og-1200x630.png",
    keywords: [
      "1% Treaty",
      "1 Percent Treaty",
      "Earth Optimization Game",
      "budget optimization",
      "policy analysis",
      "public outcomes",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [
      "/treaty",
      "/people",
      "/governments",
      "/declaration",
      "/endorse",
      "/coalition",
      "/why",
      "/legal",
      "/impact",
      "/humanity-management-training",
      "/vote",
      "/questions",
    ],
    restrictToAllowlist: true,
    publicPrefixes: [
      "/treaty",
      "/tasks",
      "/people",
      "/governments",
      "/declaration",
      "/endorse",
      "/coalition",
      "/why",
      "/legal",
      "/impact",
      "/organizations",
      "/reasoning",
      "/donate",
    ],
    operationalPrefixes: [
      "/r",
      "/vote",
      "/questions",
      "/auth",
      "/dashboard",
      "/profile",
      "/settings",
      "/humanity-management-training",
    ],
    minimalChromePrefixes: [
      "/vote",
      "/humanity-management-training",
    ],
  },
  assets: ONE_PERCENT_TREATY_ASSETS,
  sitemap: {
    includePublicRoutes: true,
  },
  ui: ONE_PERCENT_TREATY_UI,
  pageVariants: {
    home: "onePercentTreatyLanding",
    dashboard: "treatyTaskDashboard",
  },
};

const TRIAL_ABUNDANCE_SURVEY_CONFIG: SiteConfig = {
  key: "trialAbundanceSurvey",
  chromeVariant: "platform",
  canonicalOrigin: "https://trialabundancesurvey.org",
  domains: [
    "trialabundancesurvey.org",
    "www.trialabundancesurvey.org",
    "trialabundancesurvey.local",
  ],
  name: "Trial Abundance Survey",
  shortName: "Trial Abundance Survey",
  alternateSiteNames: ["Trial Abundance Survey"],
  description:
    "A two-question survey organizations can use to ask their communities about clinical trial funding.",
  ogImage: "/site-assets/survey/survey-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_TRIAL_ABUNDANCE_SURVEY_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_COMMISSION,
  emailBranding: {
    fromName: "Trial Abundance Survey",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    orgName: "Trial Abundance Survey",
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "trialAbundanceSurvey",
    name: "Trial Abundance Survey",
    shortName: "Trial Abundance Survey",
    description:
      "A two-question survey about whether governments should fund more pragmatic clinical trials.",
    eyebrow: "Partner Survey",
    primaryPath: "/survey",
    parentKey: "onePercentTreaty",
    rootTaskKey: null,
  },
  homeActions: [
    { href: "/survey", label: "Take Survey", variant: "primary" },
    { href: "/organizations", label: "Embed Survey", variant: "outline" },
  ],
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
  rootMetadata: {
    title: "Trial Abundance Survey",
    description:
      "A two-question survey organizations can embed to ask their communities about clinical trial funding.",
    openGraphTitle: "Trial Abundance Survey",
    openGraphDescription:
      "Ask your community whether governments should fund more pragmatic clinical trials.",
    openGraphImage: {
      url: "/site-assets/survey/survey-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "Trial Abundance Survey",
    },
    twitterTitle: "Trial Abundance Survey",
    twitterDescription:
      "A two-question survey about clinical trial funding.",
    twitterImage: "/site-assets/survey/survey-og-1200x630.png",
    keywords: [
      "Trial Abundance Survey",
      "clinical trial survey",
      "nonprofit survey",
      "embeddable survey",
    ],
  },
  routePolicy: {
    canonicalPrefixes: ["/survey"],
    restrictToAllowlist: true,
    publicPrefixes: ["/survey", "/vote", "/questions", "/organizations"],
    operationalPrefixes: [
      "/auth",
      "/dashboard",
      "/profile",
      "/settings",
    ],
    minimalChromePrefixes: ["/survey", "/vote", "/questions"],
  },
  assets: TRIAL_ABUNDANCE_SURVEY_ASSETS,
  sitemap: {
    includePublicRoutes: true,
  },
  ui: TRIAL_ABUNDANCE_SURVEY_UI,
  pageVariants: {
    home: "initiativeLanding",
    dashboard: "treatyTaskDashboard",
  },
};

const SITE_CONFIGS: Record<SiteKey, SiteConfig> = {
  optimitron: OPTIMITRON_CONFIG,
  dfda: DFDA_CONFIG,
  dih: DIH_CONFIG,
  warOnDisease: WAR_ON_DISEASE_CONFIG,
  onePercentTreaty: ONE_PERCENT_TREATY_CONFIG,
  trialAbundanceSurvey: TRIAL_ABUNDANCE_SURVEY_CONFIG,
};

const SITE_CONFIG_ORDER: readonly SiteKey[] = [
  "onePercentTreaty",
  "trialAbundanceSurvey",
  "dfda",
  "dih",
  "warOnDisease",
  "optimitron",
];

const HOST_TO_SITE_KEY = Object.fromEntries(
  Object.entries(SITE_CONFIGS).flatMap(([key, site]) =>
    site.domains.map((domain) => [domain.toLowerCase(), key as SiteKey]),
  ),
) as Record<string, SiteKey>;

const PUBLIC_FILE_PATH_REGEX = /\.[^/]+$/;

function normalizeHost(host: string | null | undefined) {
  return host?.split(":")[0]?.toLowerCase() ?? "";
}

export function getCanonicalHostForSiteKey(key: SiteKey): string {
  return new URL(SITE_CONFIGS[key].canonicalOrigin).host;
}

const TREATY_SIGN_PATH = "/treaty";
const TREATY_SIGN_FALLBACK_URL = "https://1percenttreaty.org/treaty";

// Returns the URL where the user should publicly sign the 1% Treaty from the
// given site. Stays on-domain when the site allows /treaty, falls through to
// the canonical 1percenttreaty.org otherwise. Send the user across domains as
// a last resort; most who leave do not come back.
export function getTreatySignUrl(site: SiteConfig): string {
  if (!site.routePolicy.restrictToAllowlist) return TREATY_SIGN_PATH;
  const matches = (prefix: string) =>
    prefix === TREATY_SIGN_PATH || prefix.startsWith(`${TREATY_SIGN_PATH}/`);
  const allowed =
    site.routePolicy.publicPrefixes.some(matches) ||
    site.routePolicy.operationalPrefixes.some(matches) ||
    site.routePolicy.canonicalPrefixes.some(matches);
  return allowed ? TREATY_SIGN_PATH : TREATY_SIGN_FALLBACK_URL;
}

export function getSiteFromHost(host: string | null | undefined): SiteConfig {
  if (!host) return OPTIMITRON_CONFIG;
  return SITE_CONFIGS[HOST_TO_SITE_KEY[normalizeHost(host)] ?? "optimitron"];
}

export function getSiteFromHeaders(headers: Pick<Headers, "get">): SiteConfig {
  const host = headers.get("host");
  const override = headers.get(SITE_VARIANT_OVERRIDE_HEADER);
  if (host && isLocalHost(host) && isSiteKey(override)) {
    return SITE_CONFIGS[override];
  }

  return getSiteFromHost(host);
}

export function getSiteConfig(key: SiteKey): SiteConfig {
  return SITE_CONFIGS[key];
}

export function getAllSiteConfigs(): SiteConfig[] {
  return Object.values(SITE_CONFIGS);
}

export function isSiteKey(value: string | null | undefined): value is SiteKey {
  return typeof value === "string" && value in SITE_CONFIGS;
}

export function isOnePercentTreatyHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return HOST_TO_SITE_KEY[normalizeHost(host)] === "onePercentTreaty";
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isSiteRouteAllowed(site: SiteConfig, pathname: string): boolean {
  if (!site.routePolicy.restrictToAllowlist) {
    return true;
  }

  if (pathname === "/") {
    return true;
  }

  if (PUBLIC_FILE_PATH_REGEX.test(pathname)) {
    return true;
  }

  return (
    site.routePolicy.publicPrefixes.some((prefix) =>
      matchesPrefix(pathname, prefix),
    ) ||
    site.routePolicy.operationalPrefixes.some((prefix) =>
      matchesPrefix(pathname, prefix),
    )
  );
}

function getCanonicalSiteForPath(pathname: string): SiteConfig | null {
  if (pathname === "/" || PUBLIC_FILE_PATH_REGEX.test(pathname)) {
    return null;
  }

  const siteKey = SITE_CONFIG_ORDER.find((key) =>
    SITE_CONFIGS[key].routePolicy.canonicalPrefixes.some((prefix) =>
      matchesPrefix(pathname, prefix),
    ),
  );

  return siteKey ? SITE_CONFIGS[siteKey] : null;
}

export function getSiteRouteRedirect(
  site: SiteConfig,
  pathname: string,
): string | null {
  if (isSiteRouteAllowed(site, pathname)) {
    return null;
  }

  const canonicalSite = getCanonicalSiteForPath(pathname);
  if (!canonicalSite || canonicalSite.key === site.key) {
    return null;
  }

  return `${canonicalSite.canonicalOrigin}${pathname}`;
}

export type SiteRouteDisposition =
  | { type: "allow" }
  | { type: "redirect"; url: string }
  | { type: "notFound" };

export function getSiteRouteDisposition(
  site: SiteConfig,
  pathname: string,
): SiteRouteDisposition {
  if (isSiteRouteAllowed(site, pathname)) {
    return { type: "allow" };
  }

  const redirectUrl = getSiteRouteRedirect(site, pathname);
  if (redirectUrl) {
    return { type: "redirect", url: redirectUrl };
  }

  return { type: "notFound" };
}

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function canonicalizeSiteUrl(url: string | null | undefined) {
  if (!url?.trim()) {
    return url ?? null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "optimitron.earth" || host === "www.optimitron.earth") {
      parsed.protocol = "https:";
      parsed.hostname = "optimitron.com";
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function getConfiguredSiteOrigin(options?: {
  allowLocalFallback?: boolean;
}) {
  const envOrigin =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envOrigin) {
    return normalizeOrigin(envOrigin);
  }

  if (options?.allowLocalFallback) {
    return OPTIMITRON_LOCAL_ORIGIN;
  }

  return OPTIMITRON_CANONICAL_ORIGIN;
}

export function isLocalHost(host: string) {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

export function getRequestSiteOrigin(input?: {
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  host?: string | null;
}) {
  const forwardedHost = input?.forwardedHost?.split(",")[0]?.trim();
  const host = forwardedHost || input?.host?.trim() || "";
  if (!host) {
    return getConfiguredSiteOrigin({ allowLocalFallback: true });
  }

  const forwardedProto = input?.forwardedProto?.split(",")[0]?.trim().toLowerCase();
  const protocol = forwardedProto || (isLocalHost(host) ? "http" : "https");

  return `${protocol}://${host.replace(/\/+$/, "")}`;
}

export function absoluteCanonicalSiteUrl(path: string) {
  return `${OPTIMITRON_CANONICAL_ORIGIN}${normalizePath(path)}`;
}

export function buildTrialAbundanceSurveyUrl(organizationSlug: string) {
  return `${TRIAL_ABUNDANCE_SURVEY_CONFIG.canonicalOrigin}/survey/${encodeURIComponent(
    organizationSlug,
  )}`;
}

export function absoluteConfiguredSiteUrl(
  path: string,
  options?: {
    allowLocalFallback?: boolean;
  },
) {
  return `${getConfiguredSiteOrigin(options)}${normalizePath(path)}`;
}
