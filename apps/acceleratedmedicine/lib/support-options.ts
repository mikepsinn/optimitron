import { US_STATES } from "@/lib/us-states"

// Shared by the /support forms and the server, so it imports nothing server-only.

/** An organization that works across the US picks this instead of one state. */
export const NATIONWIDE = "Nationwide"
/** Before the forms asked for a country, everyone abroad picked this as their state. */
export const OUTSIDE_US = "Outside the United States"

export const US = "US"

// Washington, D.C. is not a state, but people and organizations there need a choice too.
const stateNames: string[] = [...US_STATES.map(([name]) => name), "District of Columbia"].sort((a, b) => a.localeCompare(b, "en"))

/** A US supporter picks their state, or the District of Columbia. */
export const SUPPORTER_STATES = stateNames as [string, ...string[]]

/** A US organization picks the state it works in, or says it works nationwide. */
const organizationStates: string[] = [...stateNames, NATIONWIDE]
export const ORGANIZATION_STATES = organizationStates as [string, ...string[]]

/** ISO 3166-1 alpha-2 codes, the form Person.countryCode uses. Names come from the browser's Intl data. */
const isoCountryCodes = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
  // Kosovo has no ISO code yet; XK is the code in common use.
  "XK",
] as const

export const COUNTRY_CODES = isoCountryCodes as unknown as [string, ...string[]]

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

/** "Germany" for "DE". */
export function countryName(code: string): string {
  return regionNames.of(code) ?? code
}

/** The country select's options: the United States first, then every country by name. */
export const COUNTRY_OPTIONS = [
  { code: US, name: countryName(US) },
  ...isoCountryCodes
    .filter(code => code !== US)
    .map(code => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en")),
]

/** Where a supporter lives or an organization works, for emails and listings: a state, "Nationwide" or a country. */
export function placeLabel({ countryCode, state }: { countryCode: string; state: string }): string {
  if (countryCode === US) return state || countryName(US)
  return countryCode ? countryName(countryCode) : OUTSIDE_US
}

/** "Ada Lovelace", or just "Ada" for someone with one name. */
export function fullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ")
}
