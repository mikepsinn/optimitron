import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  GLOBAL_WARHEAD_COUNT,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import type { ReferendumSiteContentKey } from "@/content/referendum-sites";
import {
  ROUTES,
  coalitionLink,
  conditionsLink,
  communityLinks,
  courtLink,
  dfdaLink,
  dihLink,
  donateLink,
  endorseLink,
  exploreLinks,
  footerAppLinks,
  githubLink,
  inviteVoterLink,
  legalLink,
  navSections,
  paperLinks,
  peopleLink,
  privacyLink,
  profileLink,
  readTreatyLink,
  termsLink,
  treatmentsLink,
  treatyDashboardLink,
  presidentManagementLink,
  treatyVoteLink,
  trialEmbedLink,
  trialSurveyLink,
  whyLink,
  type NavItem,
  type NavSection,
} from "@/lib/routes";

// Campaign-copy numbers sourced from the parameter manifest so marketing
// strings stay synced when sources update (FAS warhead count, DFDA queue
// math, etc.). The manifest holds the precise figure plus citation; we
// round for prose. TREATY_FRACTION is the canonical 1% reallocation.
const TREATY_FRACTION = 0.01;
const warheadCount = Math.round(GLOBAL_WARHEAD_COUNT.value).toLocaleString(
  "en-US",
);
const nuclearWinterThreshold = Math.round(
  NUCLEAR_WINTER_WARHEAD_THRESHOLD.value,
);
const apocalypseCount = Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value);
const apocalypseSlice = (
  NUCLEAR_WINTER_OVERKILL_FACTOR.value * TREATY_FRACTION
).toFixed(2);
const statusQuoYears = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const dfdaYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);

export const OPTIMITRON_CANONICAL_ORIGIN = "https://optimitron.com";
export const OPTIMITRON_LOCAL_ORIGIN = "http://localhost:3001";
export const SITE_VARIANT_OVERRIDE_COOKIE = "optimitron_site_key";
export const SITE_VARIANT_OVERRIDE_QUERY_PARAM = "site";

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

/**
 * Recruitment / chain narrative frame for a site variant:
 * - "manager": Earth Optimization Services LLC is hiring humanity managers,
 *   each one hires 2 more. Identity-based, sustains chain behavior.
 * - "voter": Recruit verified voters for the referendum. Action-based,
 *   default for non-campaign and reference sites.
 *
 * Drives recruitment-chain copy via `getUserFramingVocabulary(framing)` in
 * `lib/messaging.ts`. Vote-action surfaces ("Vote yes on the 1% Treaty",
 * the actual ballot) are frame-independent and use literal strings.
 */
export type SiteUserFraming = "manager" | "voter";

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
  /** See SiteUserFraming. Drives vocabulary lookups via getUserFramingVocabulary(). */
  userFraming: SiteUserFraming;
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

const ORGANIZATION_NAME = "Earth Optimization Services LLC";
const ORGANIZATION_URL = OPTIMITRON_CANONICAL_ORIGIN;
const ORGANIZATION_LOGO_PATH = "/icons/icon-192.png";
const PUBLIC_CONTACT_EMAIL = "hello@warondisease.org";
const PUBLIC_CONTACT_URL = `${OPTIMITRON_CANONICAL_ORIGIN}/about`;
const ORGANIZATION_SAME_AS = ["https://github.com/mikepsinn/optimitron"];
const EARTH_OPTIMIZATION_SERVICES_LLC = "Earth Optimization Services LLC";
const NO_FOOTER_COMPLIANCE_NOTICE = null;

/// Public-facing campaign brand for sites operated by the campaign.
/// Distinct from `EARTH_OPTIMIZATION_SERVICES_LLC` (the legal entity, used
/// in compliance surfaces). Used by WoD, 1pt, and the Trial Abundance
/// Survey — all three point `organizationName` at this so SEO + footer
/// attribution carry the campaign brand instead of the LLC name. The
/// survey's neutral UX (no campaign branding in the embedded form) is a
/// separate concern from operator-metadata disclosure to crawlers.
const INTERNATIONAL_CAMPAIGN_ORG_NAME =
  "International Campaign to End War and Disease";

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

// Hidden until the public signatory list has enough real organizations to be
// useful. Keep the route and route object alive so restoring the link is one
// flag flip, not archaeology.
const SHOW_ORGANIZATIONAL_SIGNATORIES_LINK = false;
const organizationalSignatoryLinks: NavItem[] =
  SHOW_ORGANIZATIONAL_SIGNATORIES_LINK ? [coalitionLink] : [];

const onePercentNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [
      treatyVoteLink,
      treatyDashboardLink,
      peopleLink,
      presidentManagementLink,
    ],
  },
  {
    id: "learn",
    label: "Learn",
    items: [
      readTreatyLink,
      whyLink,
      peopleLink,
      ...organizationalSignatoryLinks,
      endorseLink,
      legalLink,
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [profileLink],
  },
];

const warOnDiseaseShareLink: NavItem = {
  ...treatyDashboardLink,
  label: "Share",
  tagline: "Share your voting link",
  cta: "Share",
};

const warOnDiseaseNavSections: NavSection[] = [
  {
    id: "primary",
    label: "Primary",
    primary: true,
    items: [
      treatyVoteLink,
      warOnDiseaseShareLink,
      donateLink,
      peopleLink,
      readTreatyLink,
      whyLink,
    ],
  },
];

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
      "Every condition, every treatment, ranked by what actually happened to real humans.",
    bottomText:
      "Your FDA waits 8.2 years to let dying humans take drugs already proven safe. This is your safety system.",
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
      "Your NIH spends 3.3% of its budget on actual clinical trials. It's like a fire department that spends 3% of its budget on water.",
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
    brandDescription: `Is it OK if we trade ${apocalypseSlice} of our ${apocalypseCount} apocalypses for disease eradication in ${dfdaYears} years instead of ${statusQuoYears}?`,
    bottomText: "",
    columns: [
      {
        title: "Campaign",
        items: [
          treatyVoteLink,
          readTreatyLink,
          warOnDiseaseShareLink,
          peopleLink,
          ...organizationalSignatoryLinks,
          endorseLink,
          donateLink,
        ],
      },
      {
        title: "Reference",
        items: [whyLink, courtLink],
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
      "Move one percent of the murder budget to the medicine budget. Your species will find this controversial.",
    bottomText:
      "© 4237 Wishonia. Reproduction of the general welfare is encouraged and, at this point, somewhat urgent.",
    columns: [
      {
        title: "Campaign",
        items: [
          treatyVoteLink,
          readTreatyLink,
          treatyDashboardLink,
          peopleLink,
          presidentManagementLink,
          donateLink,
        ],
      },
      {
        title: "Proof",
        items: [
          whyLink,
          courtLink,
          peopleLink,
          ...organizationalSignatoryLinks,
          endorseLink,
          legalLink,
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
    brandDescription: "A two-question survey about clinical trial funding.",
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
  userFraming: "manager",
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
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
  emailBranding: {
    fromName: "Optimitron",
    primaryColor: "#ff00ff",
    secondaryColor: "#00d9ff",
    orgName: EARTH_OPTIMIZATION_SERVICES_LLC,
  },
  footerComplianceNotice: NO_FOOTER_COMPLIANCE_NOTICE,
  sameAs: ORGANIZATION_SAME_AS,
  initiative: {
    key: "optimizeEarth",
    name: "Optimize Earth",
    shortName: "Optimize Earth",
    description:
      "Finds the highest-leverage work on your planet and assigns it to humans who would otherwise have spent the afternoon arguing online.",
    eyebrow: "Optimitron",
    primaryPath: "/",
    parentKey: null,
    rootTaskKey: null,
  },
  homeActions: [
    { href: ROUTES.dashboard, label: "Open Dashboard", variant: "primary" },
    { href: ROUTES.tasks, label: "See Tasks", variant: "outline" },
  ],
  primaryReferendumSlug: null,
  primaryTaskKey: null,
  rootMetadata: {
    title: "Optimitron — The Evidence-Based Earth Optimization Game",
    description:
      "Earth Optimization Game for budgets, policies, politicians, and personal tradeoffs. Planetary debugging software for a species that keeps ignoring its own data.",
    openGraphTitle: "Optimitron — The Evidence-Based Earth Optimization Game",
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
    minimalChromePrefixes: [ROUTES.vote, ROUTES.questions, ROUTES.donate],
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
  userFraming: "voter",
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
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
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
      "Treatments ranked by what happened to actual humans, not by which drug rep brought the best donuts in 2003.",
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
      "Every condition, every treatment, ranked by what actually happened to real humans. Your current method is donuts and vibes.",
    openGraphTitle: "DFDA — Decentralized FDA",
    openGraphDescription:
      "Treatments ranked by what happened to actual humans, not by what a marketing department hoped happened.",
    openGraphImage: {
      url: "/site-assets/dfda/dfda-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "DFDA — Decentralized FDA",
    },
    twitterTitle: "DFDA — Decentralized FDA",
    twitterDescription:
      "Treatments ranked by what happened to real humans. Like a leaderboard for not dying.",
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
      ROUTES.dfda,
    ],
    restrictToAllowlist: true,
    publicPrefixes: [
      "/conditions",
      "/treatments",
      "/outcome-labels",
      "/find-trials",
      ROUTES.dfda,
      ROUTES.about,
      ROUTES.donate,
    ],
    operationalPrefixes: [
      "/auth",
      ROUTES.dashboard,
      ROUTES.profile,
      ROUTES.settings,
    ],
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
  userFraming: "voter",
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
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
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
      "Pick the disease that's killing you. Fund the institute working on it. Skip the part where a committee decides which diseases are fashionable.",
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
      "Pick a disease. Spin up an institute for it. Fund it by what humans actually want, not by what a grant committee thinks is fashionable this year.",
    openGraphTitle: "DIH — Decentralized Institutes of Health",
    openGraphDescription:
      "An institute for whatever's killing you, funded by people who would rather not die of it.",
    openGraphImage: {
      url: "/site-assets/dih/dih-og-social-70s-utopian-1280x640.png",
      width: 1280,
      height: 640,
      alt: "DIH — Decentralized Institutes of Health",
    },
    twitterTitle: "DIH — Decentralized Institutes of Health",
    twitterDescription:
      "An institute for whatever's killing you, funded by people who would rather not die of it.",
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
    canonicalPrefixes: [ROUTES.dih, "/institutes", ROUTES.wishocracy],
    restrictToAllowlist: true,
    publicPrefixes: [
      ROUTES.dih,
      "/institutes",
      ROUTES.survey,
      ROUTES.organizations,
      "/conditions",
      "/treatments",
      ROUTES.conditions,
      ROUTES.treatments,
      ROUTES.wishocracy,
      ROUTES.about,
      ROUTES.donate,
    ],
    operationalPrefixes: [
      "/auth",
      ROUTES.dashboard,
      ROUTES.profile,
      ROUTES.settings,
    ],
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
  userFraming: "manager",
  canonicalOrigin: "https://warondisease.org",
  domains: ["warondisease.org", "www.warondisease.org", "warondisease.local"],
  name: "War on Disease",
  shortName: "War on Disease",
  alternateSiteNames: [
    "War on Disease",
    "International Campaign to End War and Disease",
  ],
  description: `Nuclear winter takes about ${nuclearWinterThreshold} warheads. You have ${warheadCount} — ${apocalypseCount} apocalypses. Sacrifice ${apocalypseSlice} of them to eradicate disease in ${dfdaYears} years instead of ${statusQuoYears}.`,
  ogImage: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_WAR_ON_DISEASE_ID,
  contentKey: "onePercentTreaty",
  // Public-facing campaign brand on WoD; the legal entity (Earth
  // Optimization Services LLC) stays in `legalEntityName` for compliance
  // surfaces. SEO + footer attribution show the campaign name.
  organizationName: INTERNATIONAL_CAMPAIGN_ORG_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
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
      "Your chance of dying from terrorism: 1 in 30 million. Your chance of dying from disease: 100%. The budget does not reflect this.",
    eyebrow: "Disease Eradication",
    primaryPath: "/",
    parentKey: "optimizeEarth",
    rootTaskKey: null,
  },
  homeActions: [
    { href: ROUTES.vote, label: "Vote Now", variant: "primary" },
    { href: ROUTES.treaty, label: "Read the Treaty", variant: "outline" },
  ],
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
  rootMetadata: {
    title: "War on Disease",
    description: `Nuclear winter takes about ${nuclearWinterThreshold} warheads. You have ${warheadCount} — ${apocalypseCount} apocalypses. Sacrifice ${apocalypseSlice} of them to eradicate disease in ${dfdaYears} years instead of ${statusQuoYears}.`,
    openGraphTitle: "War on Disease",
    openGraphDescription: `Trade ${apocalypseSlice} of your ${apocalypseCount} apocalypses for disease eradication in ${dfdaYears} years instead of ${statusQuoYears}. Your species will find this controversial.`,
    openGraphImage: {
      url: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "War on Disease social image",
    },
    twitterTitle: "War on Disease",
    twitterDescription: `Nuclear winter takes about ${nuclearWinterThreshold} warheads. You have ${warheadCount}. That is ${apocalypseCount} apocalypses, in case the first ${apocalypseCount - 1} do not take.`,
    twitterImage: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
    keywords: [
      "War on Disease",
      "International Campaign to End War and Disease",
      "1% Treaty",
      "disease eradication",
      "clinical trials",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [],
    restrictToAllowlist: true,
    publicPrefixes: [
      ROUTES.treaty,
      ROUTES.court,
      ROUTES.tasks,
      ROUTES.people,
      ROUTES.governments,
      ROUTES.declaration,
      ROUTES.endorse,
      ROUTES.signatories,
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.why,
      ROUTES.legal,
      ROUTES.privacy,
      ROUTES.terms,
      ROUTES.impact,
      ROUTES.organizations,
      ROUTES.survey,
      "/conditions",
      "/treatments",
      ROUTES.conditions,
      ROUTES.treatments,
      ROUTES.donate,
    ],
    operationalPrefixes: [
      "/r",
      ROUTES.vote,
      ROUTES.questions,
      "/auth",
      ROUTES.dashboard,
      ROUTES.profile,
      ROUTES.settings,
    ],
    minimalChromePrefixes: [
      ROUTES.vote,
      ROUTES.questions,
      ROUTES.donate,
      ROUTES.survey,
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
  userFraming: "manager",
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
    "Move one percent of the murder budget to the medicine budget. Your species will find this controversial.",
  ogImage: "/site-assets/treaty/treaty-og-1200x630.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_ONE_PERCENT_TREATY_ID,
  contentKey: "onePercentTreaty",
  // Same campaign brand as warondisease.org. Legal entity stays in
  // legalEntityName for compliance surfaces.
  organizationName: INTERNATIONAL_CAMPAIGN_ORG_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
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
      "One percent off the weapons budget. The other 99% is still available for weapons. Your species will find this radical.",
    eyebrow: "Referendum",
    primaryPath: ROUTES.treaty,
    parentKey: "warOnDisease",
    rootTaskKey: null,
  },
  homeActions: [
    { href: ROUTES.vote, label: "Vote Now", variant: "primary" },
    { href: ROUTES.treaty, label: "Read the Treaty", variant: "outline" },
  ],
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
  rootMetadata: {
    title: "1% Treaty",
    description:
      "Move one percent of the murder budget to the medicine budget. Your species will find this controversial.",
    openGraphTitle: "1% Treaty",
    openGraphDescription:
      "Your species spends 604 times more on weapons than on testing which medicines work. The treaty starts denting the ratio. Baby steps.",
    openGraphImage: {
      url: "/site-assets/treaty/treaty-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "1% Treaty social image",
    },
    twitterTitle: "1% Treaty",
    twitterDescription: `Nuclear winter takes about ${nuclearWinterThreshold} warheads. You have ${warheadCount} — ${apocalypseCount} apocalypses. Sacrifice ${apocalypseSlice} of them to eradicate disease in ${dfdaYears} years instead of ${statusQuoYears}.`,
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
      ROUTES.treaty,
      ROUTES.court,
      ROUTES.people,
      ROUTES.employees,
      ROUTES.governments,
      ROUTES.declaration,
      ROUTES.endorse,
      ROUTES.signatories,
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.why,
      ROUTES.legal,
      ROUTES.impact,
      ROUTES.vote,
      ROUTES.questions,
    ],
    restrictToAllowlist: true,
    publicPrefixes: [
      ROUTES.treaty,
      ROUTES.court,
      ROUTES.tasks,
      ROUTES.people,
      ROUTES.employees,
      ROUTES.governments,
      ROUTES.declaration,
      ROUTES.endorse,
      ROUTES.signatories,
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.why,
      ROUTES.legal,
      ROUTES.impact,
      ROUTES.organizations,
      ROUTES.donate,
    ],
    operationalPrefixes: [
      "/r",
      ROUTES.vote,
      ROUTES.questions,
      "/auth",
      ROUTES.dashboard,
      ROUTES.profile,
      ROUTES.settings,
    ],
    minimalChromePrefixes: [ROUTES.vote, ROUTES.donate],
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
  // Partner-embed neutral; no recruit copy renders here. The frame is unused
  // in practice but typed so the SiteConfig shape stays exhaustive.
  userFraming: "voter",
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
  // The trial-abundance survey is operated by the same campaign — neutral
  // SURVEY UX (intentional, so partners can embed it without political
  // branding) is distinct from operator-metadata disclosure. Crawlers,
  // journalists, and due-diligence-doing partners get truthful attribution.
  organizationName: INTERNATIONAL_CAMPAIGN_ORG_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LLC,
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
    primaryPath: ROUTES.survey,
    parentKey: "onePercentTreaty",
    rootTaskKey: null,
  },
  homeActions: [
    { href: ROUTES.survey, label: "Take Survey", variant: "primary" },
    { href: ROUTES.organizations, label: "Embed Survey", variant: "outline" },
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
    twitterDescription: "A two-question survey about clinical trial funding.",
    twitterImage: "/site-assets/survey/survey-og-1200x630.png",
    keywords: [
      "Trial Abundance Survey",
      "clinical trial survey",
      "nonprofit survey",
      "embeddable survey",
    ],
  },
  routePolicy: {
    canonicalPrefixes: [ROUTES.survey],
    restrictToAllowlist: true,
    publicPrefixes: [
      ROUTES.survey,
      ROUTES.vote,
      ROUTES.questions,
      ROUTES.organizations,
    ],
    operationalPrefixes: [
      "/auth",
      ROUTES.dashboard,
      ROUTES.profile,
      ROUTES.settings,
    ],
    minimalChromePrefixes: [ROUTES.survey, ROUTES.vote, ROUTES.questions],
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

const TREATY_SIGN_PATH = ROUTES.treaty;
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

  const cookieOverride = getCookieValue(
    headers.get("cookie"),
    SITE_VARIANT_OVERRIDE_COOKIE,
  );
  if (host && isLocalHost(host) && isSiteKey(cookieOverride)) {
    return SITE_CONFIGS[cookieOverride];
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

function getCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      try {
        return decodeURIComponent(rawValue.join("="));
      } catch {
        return rawValue.join("=");
      }
    }
  }

  return null;
}

export function isOnePercentTreatyHost(
  host: string | null | undefined,
): boolean {
  if (!host) return false;
  return HOST_TO_SITE_KEY[normalizeHost(host)] === "onePercentTreaty";
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isSiteRouteAllowed(
  site: SiteConfig,
  pathname: string,
): boolean {
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

const REFERENDUM_SITE_CONTENT_PATH_PREFIXES = [
  ROUTES.signatories,
  ROUTES.campaign,
  ROUTES.coalition,
  ROUTES.endorse,
  ROUTES.impact,
  ROUTES.legal,
  ROUTES.why,
] as const;

export function requiresReferendumSiteContent(pathname: string): boolean {
  return REFERENDUM_SITE_CONTENT_PATH_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isStaticPathEnabledForSite(
  site: SiteConfig,
  pathname: string,
): boolean {
  if (getSiteRouteDisposition(site, pathname).type !== "allow") {
    return false;
  }

  if (requiresReferendumSiteContent(pathname) && !site.contentKey) {
    return false;
  }

  return true;
}

export function getEnabledStaticPathsForSite(
  site: SiteConfig,
  candidatePaths: Iterable<string>,
): string[] {
  const enabled = new Set<string>();

  for (const candidatePath of candidatePaths) {
    const pathname = normalizePath(
      candidatePath.trim().split(/[?#]/, 1)[0] ?? "",
    );
    if (isStaticPathEnabledForSite(site, pathname)) {
      enabled.add(pathname);
    }
  }

  return [...enabled].sort((left, right) => left.localeCompare(right));
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

  const forwardedProto = input?.forwardedProto
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const protocol = forwardedProto || (isLocalHost(host) ? "http" : "https");

  return `${protocol}://${host.replace(/\/+$/, "")}`;
}

export function absoluteCanonicalSiteUrl(path: string) {
  return `${OPTIMITRON_CANONICAL_ORIGIN}${normalizePath(path)}`;
}

export function buildOrganizationSurveyUrl(
  organizationSlug: string,
  options?: { referralCode?: string | null },
) {
  const url = new URL(
    `/survey/${encodeURIComponent(organizationSlug)}`,
    WAR_ON_DISEASE_CONFIG.canonicalOrigin,
  );

  const referralCode = options?.referralCode?.trim();
  if (referralCode) {
    url.searchParams.set("ref", referralCode);
  }

  return url.toString();
}

export const buildTrialAbundanceSurveyUrl = buildOrganizationSurveyUrl;

export function absoluteConfiguredSiteUrl(
  path: string,
  options?: {
    allowLocalFallback?: boolean;
  },
) {
  return `${getConfiguredSiteOrigin(options)}${normalizePath(path)}`;
}
