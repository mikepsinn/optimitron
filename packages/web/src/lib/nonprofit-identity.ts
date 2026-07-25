/**
 * Single source of truth for the U.S. nonprofit fiscal sponsor of this project.
 * Every donation page, tax-deduction copy, bequest text, and Stripe receipt
 * line should pull from here — never hardcode the legal name, EIN, or address.
 *
 * Source of truth for the underlying values: Notion IAM Brain workspace +
 * the Wyoming/IRS records under the IAM repo. Update both when org state
 * changes.
 */

export interface NonprofitIdentity {
  /** IRS-registered legal name. Used for all tax and legal copy (Stripe descriptions, bequests, QCD letters, stock-transfer instructions). */
  legalName: string;
  /** Currently-registered DBA on file with Wyoming. Used in donor-facing copy where a DBA is appropriate. */
  registeredDba: string;
  /** Public brand for this site (warondisease.org). May be in-progress as a registered DBA. Use for body copy / hero / nav, not for legal/tax forms until registered. */
  publicBrand: string;
  /** EIN ("XX-XXXXXXX"). */
  ein: string;
  status501c3: "pending" | "approved";
  /** ISO date the IRS determined 501(c)(3) status (used for "tax-deductible since…" copy). */
  status501c3DeterminedOn: string;
  /** State of incorporation (e.g. "Wyoming"). */
  incorporatedIn: string;
  mailingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  /** Public campaign inbox for general contact and grant conversations. */
  publicContactEmail: string;
  donationsEmail: string;
  /** Brokerage info for stock gifts. Empty firmName → stock card hides. */
  brokerage: {
    firmName: string;
    dtcNumber: string;
    accountNumber: string;
    accountName: string;
    contactPhone: string;
  };
  /**
   * Endaoment public org URL — gates the stock and crypto cards on the donate
   * page. Endaoment is a 501(c)(3) that operates a multi-asset donation
   * platform: cash, appreciated stock, crypto (50+ coins), and DAF assets all
   * land at the same URL, are auto-converted to USD, and they handle the IRS
   * Form 8283 receipt for the donor. Empty string hides both stock and crypto
   * cards.
   *
   * The org URL is shown to donors as a CTA link, NOT embedded as an iframe
   * — Endaoment has no widget product. Format: `https://app.endaoment.org/orgs/<EIN>`.
   *
   * Self-custody (MetaMask, multi-sig) intentionally NOT supported here:
   * single-key wallets are a governance failure for a nonprofit.
   */
  endaomentOrgUrl: string;
  /**
   * DAF Direct widget settings string (configured at https://www.dafdirect.org/
   * after registering the org). Format: `EIN_sizecode_uuid`, e.g.
   * `412555651_2111_80243cc6-…`. The script reads this verbatim into
   * `window._dafdirect_settings`. To re-customize widget options (size, fields)
   * regenerate via the DAF Direct portal and replace the whole string. Empty
   * hides the one-click DAF widget — we still show the manual DAF instructions
   * card with EIN + legal name.
   */
  dafDirectOrgId: string;
}

export const NONPROFIT: NonprofitIdentity = {
  legalName: "Accelerated Medicine Foundation Inc",
  registeredDba: "Institute for Accelerated Medicine",
  publicBrand: "International Campaign to End War and Disease",
  ein: "41-2555651",
  status501c3: "approved",
  status501c3DeterminedOn: "2026-03-25",
  incorporatedIn: "Wyoming",
  mailingAddress: {
    line1: "150 E B St Lbby #1810",
    city: "Casper",
    state: "WY",
    postalCode: "82601",
    country: "USA",
  },
  publicContactEmail: "hello@warondisease.org",
  donationsEmail: "donations@warondisease.org",
  brokerage: {
    // TODO: open a brokerage account that accepts stock gifts and fill in.
    firmName: "",
    dtcNumber: "",
    accountNumber: "",
    accountName: "",
    contactPhone: "",
  },
  // Public Endaoment page (auto-imported from IRS data; claim flow submitted
  // 2026-05-03, awaiting approval). Donors can give cash/stock/crypto/DAF here
  // immediately — funds accrue in Endaoment escrow until the claim is approved
  // and disbursements are unlocked.
  endaomentOrgUrl: "https://app.endaoment.org/orgs/41-2555651",
  // Registered at https://www.dafdirect.org/ on 2026-05-03.
  // Settings string format: `EIN_sizecode_uuid` — the JS reads it into
  // window._dafdirect_settings verbatim. Regenerate from the portal to change
  // widget size/options.
  dafDirectOrgId: "412555651_2111_80243cc6-06aa-462e-9f2e-c4b98a98967e",
};

/** "Accelerated Medicine Foundation Inc, dba Institute for Accelerated Medicine" — for tax/legal copy. */
export const NONPROFIT_FULL_LEGAL_NAME = `${NONPROFIT.legalName}, dba ${NONPROFIT.registeredDba}`;

/** "Accelerated Medicine Foundation Inc (EIN 41-2555651)" — for tax-receipt subtext. */
export const NONPROFIT_LEGAL_NAME_WITH_EIN = `${NONPROFIT.legalName} (EIN ${NONPROFIT.ein})`;

/** Single-line "addr1, city, ST 12345" or "" if address not set. */
export function formatNonprofitAddress(): string {
  const a = NONPROFIT.mailingAddress;
  if (!a.line1) return "";
  const parts = [
    a.line1,
    a.line2,
    `${a.city}, ${a.state} ${a.postalCode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

/** Multi-line address for letters / bequest forms. */
export function formatNonprofitAddressMultiLine(): string[] {
  const a = NONPROFIT.mailingAddress;
  if (!a.line1) return [];
  return [
    a.line1,
    ...(a.line2 ? [a.line2] : []),
    `${a.city}, ${a.state} ${a.postalCode}`,
  ];
}
