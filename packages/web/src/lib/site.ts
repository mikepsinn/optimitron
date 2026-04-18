import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import type { ReferendumSiteContentKey } from "@/content/referendum-sites";

export const OPTIMITRON_CANONICAL_ORIGIN = "https://optimitron.com";
export const OPTIMITRON_LOCAL_ORIGIN = "http://localhost:3001";

// ---------------------------------------------------------------------------
// Per-host site configuration (generic Site* / referendum-microsite layer)
// ---------------------------------------------------------------------------

export type SiteKey = "optimitron" | "onePercentTreaty";

export interface SiteConfig {
  key: SiteKey;
  canonicalOrigin: string;
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
  sameAs: string[];
  /** Required for referendum microsites. Absent on the master platform. */
  primaryReferendumSlug: string | null;
  /** Optional support for task/accountability surfaces on referendum microsites. */
  primaryTaskKey: string | null;
}

const ORGANIZATION_NAME = "The Earth Optimization Commission";
const ORGANIZATION_URL = OPTIMITRON_CANONICAL_ORIGIN;
const ORGANIZATION_LOGO_PATH = "/icons/icon-192.png";
const PUBLIC_CONTACT_EMAIL = "hello@warondisease.org";
const PUBLIC_CONTACT_URL = `${OPTIMITRON_CANONICAL_ORIGIN}/about`;
const ORGANIZATION_SAME_AS = ["https://github.com/mikepsinn/optimitron"];

const OPTIMITRON_CONFIG: SiteConfig = {
  key: "optimitron",
  canonicalOrigin: OPTIMITRON_CANONICAL_ORIGIN,
  name: "Optimitron",
  shortName: "Optimitron",
  alternateSiteNames: ["The Earth Optimization Game"],
  description: "Earth Optimization Machine.",
  ogImage: "/og/optimitron.png",
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  contentKey: null,
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  sameAs: ORGANIZATION_SAME_AS,
  primaryReferendumSlug: null,
  primaryTaskKey: null,
};

const ONE_PERCENT_TREATY_CONFIG: SiteConfig = {
  key: "onePercentTreaty",
  canonicalOrigin: "https://1percenttreaty.org",
  name: "1% Treaty",
  shortName: "1% Treaty",
  alternateSiteNames: ["1 Percent Treaty"],
  description: "Redirect 1% of military spending to curing disease.",
  ogImage: "/api/og/one-percent-treaty",
  analyticsId: process.env.NEXT_PUBLIC_GA_ONE_PERCENT_TREATY_ID,
  contentKey: "onePercentTreaty",
  organizationName: ORGANIZATION_NAME,
  organizationUrl: ORGANIZATION_URL,
  organizationLogoPath: ORGANIZATION_LOGO_PATH,
  publicContactEmail: PUBLIC_CONTACT_EMAIL,
  publicContactUrl: PUBLIC_CONTACT_URL,
  sameAs: ORGANIZATION_SAME_AS,
  primaryReferendumSlug: TREATY_REFERENDUM_SLUG,
  primaryTaskKey: null,
};

const SITE_CONFIGS: Record<SiteKey, SiteConfig> = {
  optimitron: OPTIMITRON_CONFIG,
  onePercentTreaty: ONE_PERCENT_TREATY_CONFIG,
};

const ONE_PERCENT_TREATY_HOSTS = new Set([
  "1percenttreaty.org",
  "www.1percenttreaty.org",
  "1percenttreaty.local",
]);

export function getSiteFromHost(host: string | null | undefined): SiteConfig {
  if (!host) return OPTIMITRON_CONFIG;
  const cleanHost = host.split(":")[0]?.toLowerCase() ?? "";
  if (ONE_PERCENT_TREATY_HOSTS.has(cleanHost)) {
    return ONE_PERCENT_TREATY_CONFIG;
  }
  return OPTIMITRON_CONFIG;
}

export function getSiteConfig(key: SiteKey): SiteConfig {
  return SITE_CONFIGS[key];
}

export function isOnePercentTreatyHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const cleanHost = host.split(":")[0]?.toLowerCase() ?? "";
  return ONE_PERCENT_TREATY_HOSTS.has(cleanHost);
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

function isLocalHost(host: string) {
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

export function absoluteConfiguredSiteUrl(
  path: string,
  options?: {
    allowLocalFallback?: boolean;
  },
) {
  return `${getConfiguredSiteOrigin(options)}${normalizePath(path)}`;
}
