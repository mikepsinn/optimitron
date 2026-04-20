/**
 * Locale resolution — Accept-Language parsing + LocaleConfig lookup
 * + fallback-chain resolution. Uses the data-driven LocaleConfig table
 * so adding a locale is a DB operation, not a code deploy.
 */

import { prisma } from "@/lib/prisma";

export const DEFAULT_LOCALE_KEY = "en";

export type LocaleResolution = {
  localeKey: string;
  displayName: string;
  usedFallback: boolean;
  bannedPhrases: string[];
  fallbackChain: string[];
};

/**
 * Parse an Accept-Language header into a ranked list of preferred locales.
 * Simple BCP-47 parsing — good enough for segment routing.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((entry) => {
      const [rawTag, ...params] = entry.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "0") : 1;
      return { tag: (rawTag ?? "").trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((e) => e.tag.length > 0 && e.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((e) => normalizeLocaleTag(e.tag));
}

/**
 * Normalize a BCP-47 tag to the form stored in LocaleConfig.localeKey.
 * Keeps primary subtag lowercase; script subtag Title-cased (e.g. zh-Hans).
 */
export function normalizeLocaleTag(tag: string): string {
  const parts = tag.split(/[-_]/);
  if (parts.length === 0) return tag;
  const primary = parts[0]!.toLowerCase();
  const rest = parts.slice(1).map((p) => {
    if (p.length === 4) {
      return p[0]!.toUpperCase() + p.slice(1).toLowerCase();
    }
    return p.toUpperCase();
  });
  return [primary, ...rest].join("-");
}

export type LocaleResolutionInput = {
  urlLocale?: string | null;
  userProfileLocale?: string | null;
  acceptLanguageHeader?: string | null;
};

/**
 * Resolve the effective locale for a visitor.
 * Precedence: url param > user profile > Accept-Language > default.
 * An explicit requested locale is used only if it's ENABLED in LocaleConfig.
 */
export async function resolveLocale(
  input: LocaleResolutionInput,
): Promise<LocaleResolution> {
  const candidates: string[] = [];
  if (input.urlLocale) candidates.push(normalizeLocaleTag(input.urlLocale));
  if (input.userProfileLocale) {
    candidates.push(normalizeLocaleTag(input.userProfileLocale));
  }
  candidates.push(...parseAcceptLanguage(input.acceptLanguageHeader));

  const enabled = await prisma.reasoningLocaleConfig.findMany({
    where: { enabled: true },
  });
  const enabledByKey = new Map(enabled.map((l) => [l.localeKey, l]));

  for (const candidate of candidates) {
    const hit = enabledByKey.get(candidate);
    if (hit) {
      return {
        localeKey: hit.localeKey,
        displayName: hit.displayName,
        usedFallback: false,
        bannedPhrases: readBannedPhrases(hit.bannedPhrases),
        fallbackChain: hit.fallbackChain,
      };
    }
  }

  // Try each candidate's fallback chain (walk the configured chain of any
  // registered locale that matches a candidate prefix, even if disabled).
  const allLocales = await prisma.reasoningLocaleConfig.findMany();
  const allByKey = new Map(allLocales.map((l) => [l.localeKey, l]));
  for (const candidate of candidates) {
    const cfg = allByKey.get(candidate);
    if (!cfg) continue;
    for (const fbKey of cfg.fallbackChain) {
      const fb = enabledByKey.get(fbKey);
      if (fb) {
        return {
          localeKey: fb.localeKey,
          displayName: fb.displayName,
          usedFallback: true,
          bannedPhrases: readBannedPhrases(fb.bannedPhrases),
          fallbackChain: fb.fallbackChain,
        };
      }
    }
  }

  // Default.
  const def = enabledByKey.get(DEFAULT_LOCALE_KEY);
  return {
    localeKey: DEFAULT_LOCALE_KEY,
    displayName: def?.displayName ?? "English",
    usedFallback: candidates.length > 0,
    bannedPhrases: def ? readBannedPhrases(def.bannedPhrases) : [],
    fallbackChain: def?.fallbackChain ?? [],
  };
}

function readBannedPhrases(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  return [];
}
