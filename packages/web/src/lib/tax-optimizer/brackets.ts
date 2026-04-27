// 2024 federal tax brackets and state cap-gains/income tax rates.
// Hardcoded for the calculator. Approximations only — not tax advice.
// Update annually when IRS publishes new brackets.

export type FilingStatus = "single" | "married";

interface Bracket {
  upTo: number; // upper bound of bracket; Infinity for top
  rate: number; // marginal rate (decimal, e.g. 0.37 for 37%)
}

// 2024 federal income tax brackets (ordinary income)
export const FEDERAL_INCOME_BRACKETS_2024: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 11_600, rate: 0.1 },
    { upTo: 47_150, rate: 0.12 },
    { upTo: 100_525, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_725, rate: 0.32 },
    { upTo: 609_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married: [
    { upTo: 23_200, rate: 0.1 },
    { upTo: 94_300, rate: 0.12 },
    { upTo: 201_050, rate: 0.22 },
    { upTo: 383_900, rate: 0.24 },
    { upTo: 487_450, rate: 0.32 },
    { upTo: 731_200, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

// 2024 federal long-term capital-gains brackets (>1yr holding)
export const FEDERAL_LTCG_BRACKETS_2024: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 47_025, rate: 0 },
    { upTo: 518_900, rate: 0.15 },
    { upTo: Infinity, rate: 0.2 },
  ],
  married: [
    { upTo: 94_050, rate: 0 },
    { upTo: 583_750, rate: 0.15 },
    { upTo: Infinity, rate: 0.2 },
  ],
};

// Net Investment Income Tax thresholds (additional 3.8% on investment income)
export const NIIT_RATE = 0.038;
export const NIIT_AGI_THRESHOLD: Record<FilingStatus, number> = {
  single: 200_000,
  married: 250_000,
};

// AGI-based deduction caps for itemized charitable contributions
export const AGI_CAP_CASH = 0.6;
export const AGI_CAP_APPRECIATED_ASSET = 0.3;

// 2024 standard deduction
export const STANDARD_DEDUCTION_2024: Record<FilingStatus, number> = {
  single: 14_600,
  married: 29_200,
};

// Top-15 states by donor concentration / tax salience.
// Rates are top-bracket combined (income tax applied to LTCG since most
// states tax LTCG as ordinary income; WA is the exception). All decimal.
export interface StateInfo {
  code: string;
  name: string;
  ltcgRate: number; // applied to capital gains
  incomeRate: number; // applied to ordinary deduction value
  notes?: string;
}

export const STATES: StateInfo[] = [
  { code: "CA", name: "California", ltcgRate: 0.133, incomeRate: 0.133 },
  { code: "NY", name: "New York", ltcgRate: 0.109, incomeRate: 0.109 },
  { code: "NJ", name: "New Jersey", ltcgRate: 0.1075, incomeRate: 0.1075 },
  { code: "HI", name: "Hawaii", ltcgRate: 0.0725, incomeRate: 0.11 },
  { code: "OR", name: "Oregon", ltcgRate: 0.099, incomeRate: 0.099 },
  { code: "MN", name: "Minnesota", ltcgRate: 0.0985, incomeRate: 0.0985 },
  { code: "DC", name: "Washington DC", ltcgRate: 0.1075, incomeRate: 0.1075 },
  {
    code: "MA",
    name: "Massachusetts",
    ltcgRate: 0.09,
    incomeRate: 0.09,
    notes: "Includes 4% surtax on income >$1M",
  },
  { code: "VT", name: "Vermont", ltcgRate: 0.0875, incomeRate: 0.0875 },
  { code: "ME", name: "Maine", ltcgRate: 0.0715, incomeRate: 0.0715 },
  { code: "CT", name: "Connecticut", ltcgRate: 0.0699, incomeRate: 0.0699 },
  {
    code: "WA",
    name: "Washington",
    ltcgRate: 0.07,
    incomeRate: 0,
    notes: "7% LTCG only above $262K; no broad income tax",
  },
  { code: "WI", name: "Wisconsin", ltcgRate: 0.0765, incomeRate: 0.0765 },
  { code: "IL", name: "Illinois", ltcgRate: 0.0495, incomeRate: 0.0495 },
  { code: "MD", name: "Maryland", ltcgRate: 0.0575, incomeRate: 0.0575 },
  { code: "TX", name: "Texas", ltcgRate: 0, incomeRate: 0 },
  { code: "FL", name: "Florida", ltcgRate: 0, incomeRate: 0 },
  { code: "NV", name: "Nevada", ltcgRate: 0, incomeRate: 0 },
  { code: "TN", name: "Tennessee", ltcgRate: 0, incomeRate: 0 },
  { code: "WY", name: "Wyoming", ltcgRate: 0, incomeRate: 0 },
  { code: "SD", name: "South Dakota", ltcgRate: 0, incomeRate: 0 },
  { code: "AK", name: "Alaska", ltcgRate: 0, incomeRate: 0 },
  { code: "NH", name: "New Hampshire", ltcgRate: 0, incomeRate: 0 },
  {
    code: "OTHER",
    name: "Other (~5% average)",
    ltcgRate: 0.05,
    incomeRate: 0.05,
  },
];

export function getMarginalRate(
  brackets: Bracket[],
  taxableIncome: number,
): number {
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.upTo) return bracket.rate;
  }
  return brackets[brackets.length - 1]!.rate;
}
