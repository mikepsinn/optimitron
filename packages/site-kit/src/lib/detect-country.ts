/**
 * Extract an ISO 3166-1 alpha-2 country code from the browser's locale.
 *
 * Returns null if the locale has no region subtag (e.g., "en", "fr").
 */
export function getCountryCodeFromLocale(locale: string): string | null {
  try {
    return new Intl.Locale(locale).region?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

export function getCountryFromLocale(): string | null {
  if (typeof navigator === "undefined" || !navigator.language) return null;
  return getCountryCodeFromLocale(navigator.language);
}
