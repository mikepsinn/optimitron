/**
 * The nonprofit that runs the initiative, for legal facts, donation receipts and the mailing address.
 * Copied from packages/site-kit/src/lib/nonprofit-identity.ts, keeping only what this site uses. Update both
 * when the organization's records change.
 */
export const NONPROFIT = {
  /** IRS-registered legal name. */
  legalName: "Accelerated Medicine Foundation Inc",
  /** The DBA registered in Wyoming. */
  registeredDba: "Institute for Accelerated Medicine",
  ein: "41-2555651",
  incorporatedIn: "Wyoming",
  mailingAddress: {
    line1: "150 E B St Lbby #1810",
    line2: "SMB#99818",
    city: "Casper",
    state: "WY",
    postalCode: "82601",
  },
}

/** "150 E B St Lbby #1810, SMB#99818, Casper, WY 82601". */
export function formatNonprofitAddress(): string {
  const { line1, line2, city, state, postalCode } = NONPROFIT.mailingAddress
  return [line1, line2, `${city}, ${state} ${postalCode}`].filter(Boolean).join(", ")
}
