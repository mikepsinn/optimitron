/**
 * Extract an ISO 3166-1 alpha-2 country code from the browser's locale.
 *
 * `navigator.language` returns BCP 47 tags like "en-US", "fr-FR", "zh-CN".
 * The region subtag (after the hyphen) maps directly to a country code.
 * Returns null if no region subtag is present (e.g., "en", "fr").
 */
export function getCountryFromLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  const lang = navigator.language;
  if (!lang) return null;
  const parts = lang.split("-");
  const region = parts[1];
  if (!region || region.length !== 2) return null;
  return region.toUpperCase();
}
