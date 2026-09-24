import { CAMPAIGN_NAME } from "@optimitron/data/campaign";
import { OPTIMITRON_REPOSITORY_URL } from "@optimitron/site-kit/lib/optimitron-links";
import {
  WAR_ON_DISEASE_CANONICAL_DOMAIN,
  WAR_ON_DISEASE_CANONICAL_ORIGIN,
} from "@/lib/domains";
import { EARTH_OPTIMIZATION_SERVICES } from "@/lib/corporate-identity";
import type { ReferendumSiteContentKey } from "@/content/referendum-sites";
import {
  ROUTES,
  communityLinks,
  exploreLinks,
  footerAppLinks,
  navSections,
  paperLinks,
  type NavItem,
  type NavSection,
} from "@/lib/routes";
import { OPTIMITRON_CANONICAL_ORIGIN } from "@optimitron/db/system-identities";

export { OPTIMITRON_CANONICAL_ORIGIN };
export const OPTIMITRON_LOCAL_ORIGIN = "http://localhost:3001";
export {
  WAR_ON_DISEASE_CANONICAL_DOMAIN,
  WAR_ON_DISEASE_CANONICAL_ORIGIN,
  WAR_ON_DISEASE_REPLY_DOMAIN,
  WAR_ON_DISEASE_UPDATES_DOMAIN,
} from "@/lib/domains";

// ---------------------------------------------------------------------------
// Site configuration
// ---------------------------------------------------------------------------

// This app serves optimitron.com only. War on Disease, dFDA, and DIH used to
// be host variants of this app; each brand now runs its own app under apps/*
// and owns its own domain, so the host no longer selects a configuration.
export type SiteKey = "optimitron";

// Domains this deployment answered for while it hosted those variants. OAuth
// still accepts their /api/mcp resource identifiers so older grants keep
// refreshing, and dfda.earth/api/mcp (a resource server that trusts this
// issuer) keeps authorizing.
export const LEGACY_VARIANT_DOMAINS = [
  "dfda.earth",
  "www.dfda.earth",
  "dfda.local",
  "dih.earth",
  "www.dih.earth",
  "dih.local",
  WAR_ON_DISEASE_CANONICAL_DOMAIN,
  `www.${WAR_ON_DISEASE_CANONICAL_DOMAIN}`,
  "warondisease.local",
  "1percenttreaty.org",
  "www.1percenttreaty.org",
  "trialabundancesurvey.org",
  "www.trialabundancesurvey.org",
  "acceleratedmedicine.org",
  "www.acceleratedmedicine.org",
] as const;

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

export interface SiteMailingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode?: string;
}

export function formatSiteMailingAddress(address: SiteMailingAddress): string {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
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
}

export interface SiteVariantUiConfig {
  footer: SiteFooterConfig;
  nav: SiteNavConfig;
}

/**
 * Recruitment / chain narrative frame for a site variant:
 * - "manager": Earth Optimization Services Inc. is hiring humanity managers,
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
  legalEntityType: string;
  businessDescription: string;
  mailingAddress: SiteMailingAddress;
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
  ui: SiteVariantUiConfig;
}

const ORGANIZATION_NAME = EARTH_OPTIMIZATION_SERVICES.legalName;
const ORGANIZATION_URL = OPTIMITRON_CANONICAL_ORIGIN;
const ORGANIZATION_LOGO_PATH = "/icons/icon-192.png";
const PUBLIC_CONTACT_EMAIL = EARTH_OPTIMIZATION_SERVICES.publicContactEmail;
const PUBLIC_CONTACT_URL = `${OPTIMITRON_CANONICAL_ORIGIN}${ROUTES.eos}`;
const ORGANIZATION_SAME_AS = [OPTIMITRON_REPOSITORY_URL];
const EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME =
  EARTH_OPTIMIZATION_SERVICES.legalName;
/// Public-facing campaign brand, used in the Optimitron footer attribution.
const INTERNATIONAL_CAMPAIGN_ORG_NAME = CAMPAIGN_NAME;

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

const OPTIMITRON_UI: SiteVariantUiConfig = {
  nav: {
    brandHref: ROUTES.home,
    brandLabel: "Optimitron",
    desktopBrandLabel: "⚡ Optimitron",
    menuEnabled: true,
    menuTitle: "Navigation",
    searchEnabled: true,
    sections: navSections,
    // Post-login target for navbar sign-in links. Was ROUTES.wishocracy (via
    // ba286cc8 variant unification), which sent every Google login on
    // optimitron.com to /agencies/dcongress/wishocracy instead of the
    // dashboard. All other variants point here too.
    signInCallbackUrl: ROUTES.dashboard,
  },
  footer: {
    brandHref: ROUTES.home,
    brandLabel: "⚡ Optimitron",
    brandDescription: "The Earth Optimization Machine.",
    bottomText: `© 4237 ${INTERNATIONAL_CAMPAIGN_ORG_NAME}. All rights reserved in this and 6,412 adjacent timelines. Unauthorized reproduction of the general welfare is encouraged and, frankly, overdue.`,
    columns: [
      { title: "App", items: footerAppLinks },
      { title: "Analysis", items: exploreLinks },
      { title: "Papers", items: paperLinks },
      { title: "Open Source", items: communityLinks },
    ],
  },
};

const OPTIMITRON_PLATFORM_PREFIXES = [
  "/eos",
  "/services",
  "/invest",
  "/game",
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
  "/mcp",
  "/developers",
  "/demo",
  "/video",
] as const;

const OPTIMITRON_CONFIG: SiteConfig = {
  key: "optimitron",
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
  description:
    "The machine that optimizes Earth. Two numbers: how long you live, how much you keep.",
  ogImage: "/og-image.jpg",
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  legalEntityName: EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  legalEntityType: EARTH_OPTIMIZATION_SERVICES.legalForm,
  businessDescription: EARTH_OPTIMIZATION_SERVICES.businessDescription,
  mailingAddress: EARTH_OPTIMIZATION_SERVICES.mailingAddress,
  emailBranding: {
    fromName: "Earth Optimization Services",
    primaryColor: "#ff00ff",
    secondaryColor: "#00d9ff",
    orgName: EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  },
  footerComplianceNotice: null,
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
    { href: ROUTES.dashboard, label: "Run the machine", variant: "primary" },
    { href: ROUTES.tasks, label: "Pick a job", variant: "outline" },
  ],
  primaryReferendumSlug: null,
  primaryTaskKey: null,
  rootMetadata: {
    // TODO(copy): Mike copy gate. Source: EOS .qmd title.
    title: "Optimitron — Earth Optimization Services",
    description:
      "Are your governments wasting trillions on excess mass-murder capacity while everyone you love is slowly tortured and murdered by horrible diseases? Earth Optimization Services can help. Call today!",
    // TODO(copy): Mike copy gate. Source: EOS .qmd title.
    openGraphTitle: "Optimitron — Earth Optimization Services",
    openGraphDescription:
      "Are your governments wasting trillions on excess mass-murder capacity while you and everyone you love are slowly tortured and murdered by horrible diseases? Earth Optimization Services repairs your government and maximizes the health and wealth of your civilization. Call today!",
    openGraphImage: {
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      // TODO(copy): Mike copy gate. Source: EOS .qmd title.
      alt: "Optimitron — Earth Optimization Services",
    },
    // TODO(copy): Mike copy gate. Source: EOS .qmd title.
    twitterTitle: "Optimitron — Earth Optimization Services",
    twitterDescription:
      "Are your governments wasting trillions on excess mass-murder capacity while everyone you love dies slowly of horrible disease? Earth Optimization Services can help. Call today!",
    twitterImage: "/twitter-image.jpg",
    keywords: [
      "Optimitron",
      "Earth Optimization Services",
      "The Earth Optimization Game",
      "Earth Optimization Game",
      "median healthy life expectancy",
      "median real after-tax income",
      "budget optimization",
      "policy analysis",
      "public outcomes",
    ],
  },
  routePolicy: {
    canonicalPrefixes: OPTIMITRON_PLATFORM_PREFIXES,
    minimalChromePrefixes: [ROUTES.questions],
  },
  assets: OPTIMITRON_ASSETS,
  ui: OPTIMITRON_UI,
};

const SITE_CONFIGS: Record<SiteKey, SiteConfig> = {
  optimitron: OPTIMITRON_CONFIG,
};

function normalizeHost(host: string | null | undefined) {
  return host?.split(":")[0]?.toLowerCase() ?? "";
}

// This app serves one site, so every host resolves to it. The host parameter
// stays so callers keep passing the request host they already have.
export function getSiteFromHost(_host?: string | null): SiteConfig {
  return OPTIMITRON_CONFIG;
}

export function getSiteFromHeaders(headers: Pick<Headers, "get">): SiteConfig {
  return getSiteFromHost(headers.get("host"));
}

export function getSiteConfig(key: SiteKey): SiteConfig {
  return SITE_CONFIGS[key];
}

export function getAllSiteConfigs(): SiteConfig[] {
  return Object.values(SITE_CONFIGS);
}

/** Every domain whose /api/mcp resource identifier OAuth accepts. */
export function getMcpResourceDomains(): string[] {
  return [
    ...getAllSiteConfigs().flatMap((site) => site.domains),
    ...LEGACY_VARIANT_DOMAINS,
  ];
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
    process.env.NEXTAUTH_URL?.trim() ||
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

export function isLocalOrPreviewHost(host: string | null | undefined) {
  if (!host) return false;

  const hostname = normalizeHost(host).replace(/\.$/u, "");
  return (
    isLocalHost(host) ||
    (process.env.VERCEL_ENV === "preview" &&
      (hostname === "vercel.app" || hostname.endsWith(".vercel.app")))
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
    WAR_ON_DISEASE_CANONICAL_ORIGIN,
  );

  const referralCode = options?.referralCode?.trim();
  if (referralCode) {
    url.searchParams.set("ref", referralCode);
  }

  return url.toString();
}

export function absoluteConfiguredSiteUrl(
  path: string,
  options?: {
    allowLocalFallback?: boolean;
  },
) {
  return `${getConfiguredSiteOrigin(options)}${normalizePath(path)}`;
}
