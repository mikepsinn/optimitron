/**
 * US first-level subdivisions keyed by their ISO 3166-2:US code without the
 * "US-" prefix. That bare two-letter form is what Vercel's
 * `x-vercel-ip-country-region` header and the signup geo path already write
 * into `User.regionCode`, so survey answers stored the same way group with
 * geo-detected profiles on the `[countryCode, regionCode]` index instead of
 * splitting one state across "MO", "Missouri", and "US-MO".
 */

export const US_STATES = [
  ["Alabama", "AL"],
  ["Alaska", "AK"],
  ["Arizona", "AZ"],
  ["Arkansas", "AR"],
  ["California", "CA"],
  ["Colorado", "CO"],
  ["Connecticut", "CT"],
  ["Delaware", "DE"],
  ["Florida", "FL"],
  ["Georgia", "GA"],
  ["Hawaii", "HI"],
  ["Idaho", "ID"],
  ["Illinois", "IL"],
  ["Indiana", "IN"],
  ["Iowa", "IA"],
  ["Kansas", "KS"],
  ["Kentucky", "KY"],
  ["Louisiana", "LA"],
  ["Maine", "ME"],
  ["Maryland", "MD"],
  ["Massachusetts", "MA"],
  ["Michigan", "MI"],
  ["Minnesota", "MN"],
  ["Mississippi", "MS"],
  ["Missouri", "MO"],
  ["Montana", "MT"],
  ["Nebraska", "NE"],
  ["Nevada", "NV"],
  ["New Hampshire", "NH"],
  ["New Jersey", "NJ"],
  ["New Mexico", "NM"],
  ["New York", "NY"],
  ["North Carolina", "NC"],
  ["North Dakota", "ND"],
  ["Ohio", "OH"],
  ["Oklahoma", "OK"],
  ["Oregon", "OR"],
  ["Pennsylvania", "PA"],
  ["Rhode Island", "RI"],
  ["South Carolina", "SC"],
  ["South Dakota", "SD"],
  ["Tennessee", "TN"],
  ["Texas", "TX"],
  ["Utah", "UT"],
  ["Vermont", "VT"],
  ["Virginia", "VA"],
  ["Washington", "WA"],
  ["West Virginia", "WV"],
  ["Wisconsin", "WI"],
  ["Wyoming", "WY"],
] as const;

export type StateName = (typeof US_STATES)[number][0];

export type StateAbbreviation = (typeof US_STATES)[number][1];

/**
 * Inhabited subdivisions that are not states. The survey accepts them because
 * their residents are US patients too; state campaign pages are not generated
 * for them.
 */
export const US_NON_STATE_REGIONS = [
  ["American Samoa", "AS"],
  ["District of Columbia", "DC"],
  ["Guam", "GU"],
  ["Northern Mariana Islands", "MP"],
  ["Puerto Rico", "PR"],
  ["U.S. Virgin Islands", "VI"],
] as const;

export const US_REGIONS = [...US_STATES, ...US_NON_STATE_REGIONS] as const;

export type UsRegionCode = (typeof US_REGIONS)[number][1];

/** `US_REGIONS` in display order for a select. */
export const US_REGION_OPTIONS: ReadonlyArray<{
  code: UsRegionCode;
  name: string;
}> = [...US_REGIONS]
  .map(([name, code]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const REGION_CODE_BY_KEY = new Map<string, UsRegionCode>();
for (const [name, code] of US_REGIONS) {
  REGION_CODE_BY_KEY.set(code, code);
  REGION_CODE_BY_KEY.set(name.toLowerCase(), code);
}

/**
 * Canonicalize whatever a human, an older client, or a prefilled link sends
 * for a US region — "MO", "mo", "US-MO", "Missouri", " missouri " — to the
 * stored code. Returns null when nothing matches so the caller can reject it
 * instead of storing free text.
 */
export function normalizeUsRegionCode(
  value: string | null | undefined,
): UsRegionCode | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return (
    REGION_CODE_BY_KEY.get(trimmed.toUpperCase().replace(/^US-/, "")) ??
    REGION_CODE_BY_KEY.get(trimmed.toLowerCase()) ??
    null
  );
}
