/**
 * Health insurance claim denials — the system is designed to deny care.
 * Source: KFF, state insurance commission reports, AMA surveys
 */

import type { TimePoint } from "./agency-performance.js";

export interface InsurerDenialRate {
  insurer: string;
  denialRate: number; // percentage
  claimsProcessed: number; // annual
  claimsDenied: number; // annual
  source: string;
  sourceUrl: string;
}

export const INSURER_DENIAL_RATES: InsurerDenialRate[] = [
  {
    insurer: "UnitedHealthcare",
    denialRate: 32,
    claimsProcessed: 115_000_000,
    claimsDenied: 36_800_000,
    source: "KFF ACA Marketplace Denial Data 2023",
    sourceUrl:
      "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
  },
  {
    insurer: "Anthem / Elevance",
    denialRate: 23,
    claimsProcessed: 80_000_000,
    claimsDenied: 18_400_000,
    source: "KFF 2023",
    sourceUrl:
      "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
  },
  {
    insurer: "Aetna / CVS Health",
    denialRate: 19,
    claimsProcessed: 45_000_000,
    claimsDenied: 8_550_000,
    source: "KFF 2023",
    sourceUrl:
      "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
  },
  {
    insurer: "Cigna",
    denialRate: 17,
    claimsProcessed: 35_000_000,
    claimsDenied: 5_950_000,
    source: "KFF 2023",
    sourceUrl:
      "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
  },
  {
    insurer: "Humana",
    denialRate: 14,
    claimsProcessed: 20_000_000,
    claimsDenied: 2_800_000,
    source: "KFF 2023",
    sourceUrl:
      "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
  },
];

export const DENIAL_SYSTEM_STATS = {
  totalClaimsDeniedPerYear: 300_000_000,
  appealsFiledPct: 0.2, // Only 0.2% of denied claims are appealed
  appealsSuccessRate: 45, // 45% of appeals succeed — proving initial denials were wrong
  priorAuthDelayPct: 35, // 35% of prior authorizations delayed or denied
  aiDenialsPct: 50, // ~50% of denials now made by algorithms, not doctors
  ceoCompensation: {
    unitedhealth: 20_900_000,
    elevance: 17_700_000,
    cigna: 20_400_000,
    source: "SEC proxy filings 2023",
    sourceUrl:
      "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany",
  },
  source:
    "KFF, AMA Prior Authorization Survey 2023, ProPublica",
  sourceUrl:
    "https://www.kff.org/private-insurance/issue-brief/claims-denials-and-appeals-in-aca-marketplace-plans/",
};
