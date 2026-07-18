import {
  isLocalHost,
  isSiteKey,
  isSiteVariantOverrideHost,
  type SiteKey,
} from "@/lib/site";
export { SITE_VARIANT_OVERRIDE_QUERY_PARAM } from "@/lib/site";

const RESET_OVERRIDE_VALUES = new Set(["", "default", "host", "reset"]);

interface ResolveReviewSiteVariantOverrideInput {
  cookieSiteKey?: string | null;
  host: string | null | undefined;
  querySiteKey?: string | null;
}

export interface ReviewSiteVariantOverrideResolution {
  clearCookie: boolean;
  enabled: boolean;
  persistSiteKey: SiteKey | null;
  siteKey: SiteKey | null;
  stripQueryParam: boolean;
}

export function isLocalSiteVariantOverrideEnabled(
  host: string | null | undefined,
) {
  return !!host && isLocalHost(host);
}

export function resolveReviewSiteVariantOverride({
  cookieSiteKey,
  host,
  querySiteKey,
}: ResolveReviewSiteVariantOverrideInput): ReviewSiteVariantOverrideResolution {
  const enabled = isSiteVariantOverrideHost(host);
  const hasQuery = querySiteKey !== null && querySiteKey !== undefined;

  if (!enabled) {
    return {
      clearCookie: false,
      enabled: false,
      persistSiteKey: null,
      siteKey: null,
      stripQueryParam: false,
    };
  }

  const normalizedQuery = querySiteKey?.trim() ?? "";
  if (hasQuery) {
    if (RESET_OVERRIDE_VALUES.has(normalizedQuery.toLowerCase())) {
      return {
        clearCookie: true,
        enabled: true,
        persistSiteKey: null,
        siteKey: null,
        stripQueryParam: true,
      };
    }

    if (isSiteKey(normalizedQuery)) {
      return {
        clearCookie: false,
        enabled: true,
        persistSiteKey: normalizedQuery,
        siteKey: normalizedQuery,
        stripQueryParam: true,
      };
    }

    return {
      clearCookie: !!cookieSiteKey && !isSiteKey(cookieSiteKey),
      enabled: true,
      persistSiteKey: null,
      siteKey: isSiteKey(cookieSiteKey) ? cookieSiteKey : null,
      stripQueryParam: true,
    };
  }

  return {
    clearCookie: !!cookieSiteKey && !isSiteKey(cookieSiteKey),
    enabled: true,
    persistSiteKey: null,
    siteKey: isSiteKey(cookieSiteKey) ? cookieSiteKey : null,
    stripQueryParam: false,
  };
}
