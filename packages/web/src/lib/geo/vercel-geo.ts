export interface VercelGeo {
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  timeZone?: string;
}

const IGNORED_COUNTRY_CODES = new Set(["XX", "T1"]);

function cleanString(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function decodeCity(value: string | null | undefined): string | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;
  try {
    const decoded = decodeURIComponent(raw);
    return cleanString(decoded);
  } catch {
    return raw;
  }
}

function parseFloatOrUndefined(value: string | null | undefined): number | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readVercelGeo(requestHeaders: Headers): VercelGeo {
  const rawCountry = cleanString(requestHeaders.get("x-vercel-ip-country"));
  const countryCode =
    rawCountry && !IGNORED_COUNTRY_CODES.has(rawCountry.toUpperCase())
      ? rawCountry.toUpperCase()
      : undefined;

  const regionCode = cleanString(requestHeaders.get("x-vercel-ip-country-region"));
  const city = decodeCity(requestHeaders.get("x-vercel-ip-city"));
  const latitude = parseFloatOrUndefined(requestHeaders.get("x-vercel-ip-latitude"));
  const longitude = parseFloatOrUndefined(requestHeaders.get("x-vercel-ip-longitude"));
  const timeZone = cleanString(requestHeaders.get("x-vercel-ip-timezone"));

  return {
    ...(city ? { city } : {}),
    ...(countryCode ? { countryCode } : {}),
    ...(latitude != null ? { latitude } : {}),
    ...(longitude != null ? { longitude } : {}),
    ...(regionCode ? { regionCode } : {}),
    ...(timeZone ? { timeZone } : {}),
  };
}
