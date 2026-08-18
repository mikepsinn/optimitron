import {
  AGI_CAP_APPRECIATED_ASSET,
  AGI_CAP_CASH,
  FEDERAL_INCOME_BRACKETS_2024,
  FEDERAL_LTCG_BRACKETS_2024,
  NIIT_AGI_THRESHOLD,
  NIIT_RATE,
  STATES,
  type FilingStatus,
  type StateInfo,
  getMarginalRate,
} from "./brackets";

export type AssetType = "cash" | "public-stock" | "crypto" | "private-stock";

export type HoldingPeriod = "long-term" | "short-term";

export interface TaxOptimizerInputs {
  giftFmvUsd: number;
  costBasisUsd: number;
  assetType: AssetType;
  holdingPeriod: HoldingPeriod;
  filingStatus: FilingStatus;
  annualAgiUsd: number;
  stateCode: string;
}

export interface StrategyOutcome {
  strategy: "sell-then-donate-cash" | "donate-asset-directly";
  charityReceivedUsd: number;
  capitalGainsTaxPaidUsd: number;
  federalIncomeTaxSavedUsd: number;
  stateIncomeTaxSavedUsd: number;
  totalTaxBenefitUsd: number;
  outOfPocketCostUsd: number;
  effectiveLeverage: number;
  carryForwardUsd: number;
  warnings: string[];
}

export interface ComparisonOutput {
  cashStrategy: StrategyOutcome;
  directStrategy: StrategyOutcome;
  extraDollarsToCharity: number;
  extraTaxSaved: number;
  extraOutOfPocket: number;
}

export function getStateInfo(code: string): StateInfo {
  return STATES.find((s) => s.code === code) ?? STATES[STATES.length - 1]!;
}

function effectiveLtcgRate(
  agi: number,
  filingStatus: FilingStatus,
  state: StateInfo,
): number {
  const fed = getMarginalRate(FEDERAL_LTCG_BRACKETS_2024[filingStatus], agi);
  const niit = agi > NIIT_AGI_THRESHOLD[filingStatus] ? NIIT_RATE : 0;
  return fed + niit + state.ltcgRate;
}

function federalIncomeMarginalRate(
  agi: number,
  filingStatus: FilingStatus,
): number {
  return getMarginalRate(FEDERAL_INCOME_BRACKETS_2024[filingStatus], agi);
}

// Compute the outcome of "sell asset for cash, then donate the cash."
// Cap gains tax is paid out of the proceeds; only the after-cap-gains net
// becomes the donation.
function computeCashStrategy(inputs: TaxOptimizerInputs): StrategyOutcome {
  const state = getStateInfo(inputs.stateCode);
  const isCash = inputs.assetType === "cash";
  const isLongTerm = inputs.holdingPeriod === "long-term";
  const gain = Math.max(0, inputs.giftFmvUsd - inputs.costBasisUsd);

  let capGainsTax = 0;
  if (!isCash && gain > 0) {
    if (isLongTerm) {
      const ltcg = effectiveLtcgRate(inputs.annualAgiUsd, inputs.filingStatus, state);
      capGainsTax = gain * ltcg;
    } else {
      // Short-term cap gains taxed as ordinary income (federal + state)
      const fed = federalIncomeMarginalRate(
        inputs.annualAgiUsd,
        inputs.filingStatus,
      );
      const niit =
        inputs.annualAgiUsd > NIIT_AGI_THRESHOLD[inputs.filingStatus]
          ? NIIT_RATE
          : 0;
      capGainsTax = gain * (fed + niit + state.incomeRate);
    }
  }

  const netCashAfterSale = inputs.giftFmvUsd - capGainsTax;
  const cashCapAgi = inputs.annualAgiUsd * AGI_CAP_CASH;
  const deductibleNow = Math.min(netCashAfterSale, cashCapAgi);
  const carryForward = Math.max(0, netCashAfterSale - cashCapAgi);

  const fedRate = federalIncomeMarginalRate(
    inputs.annualAgiUsd,
    inputs.filingStatus,
  );
  const fedTaxSaved = deductibleNow * fedRate;
  const stateTaxSaved = deductibleNow * state.incomeRate;
  const totalTaxBenefit = fedTaxSaved + stateTaxSaved;
  const outOfPocket = inputs.giftFmvUsd - totalTaxBenefit;

  const warnings: string[] = [];
  if (carryForward > 0) {
    warnings.push(
      `$${Math.round(carryForward).toLocaleString()} exceeds the 60% AGI cash cap and carries forward up to 5 years.`,
    );
  }
  if (!isLongTerm && !isCash) {
    warnings.push(
      "Short-term holdings: cap gains taxed as ordinary income. Direct donation deduction limited to cost basis (not modeled here).",
    );
  }

  return {
    strategy: "sell-then-donate-cash",
    charityReceivedUsd: netCashAfterSale,
    capitalGainsTaxPaidUsd: capGainsTax,
    federalIncomeTaxSavedUsd: fedTaxSaved,
    stateIncomeTaxSavedUsd: stateTaxSaved,
    totalTaxBenefitUsd: totalTaxBenefit,
    outOfPocketCostUsd: outOfPocket,
    effectiveLeverage:
      outOfPocket > 0 ? netCashAfterSale / outOfPocket : Infinity,
    carryForwardUsd: carryForward,
    warnings,
  };
}

// Compute the outcome of "donate the asset directly."
// No cap gains realized. Deduction = FMV. Subject to 30% AGI cap for
// appreciated property, 60% for cash.
function computeDirectStrategy(inputs: TaxOptimizerInputs): StrategyOutcome {
  const state = getStateInfo(inputs.stateCode);
  const isCash = inputs.assetType === "cash";
  const isLongTerm = inputs.holdingPeriod === "long-term";
  const cap = isCash
    ? AGI_CAP_CASH
    : isLongTerm
      ? AGI_CAP_APPRECIATED_ASSET
      : AGI_CAP_CASH; // short-term direct donations also limited to basis but use 50% cap practically; using cash cap as approximation
  const agiCap = inputs.annualAgiUsd * cap;
  const deductibleNow = Math.min(inputs.giftFmvUsd, agiCap);
  const carryForward = Math.max(0, inputs.giftFmvUsd - agiCap);

  const fedRate = federalIncomeMarginalRate(
    inputs.annualAgiUsd,
    inputs.filingStatus,
  );
  const fedTaxSaved = deductibleNow * fedRate;
  const stateTaxSaved = deductibleNow * state.incomeRate;
  const totalTaxBenefit = fedTaxSaved + stateTaxSaved;
  const outOfPocket = inputs.giftFmvUsd - totalTaxBenefit;

  const warnings: string[] = [];
  if (carryForward > 0) {
    warnings.push(
      `$${Math.round(carryForward).toLocaleString()} exceeds the ${cap * 100}% AGI cap and carries forward up to 5 years.`,
    );
  }
  if (!isLongTerm && !isCash) {
    warnings.push(
      "Direct donation of short-term-held appreciated assets is limited to cost basis. Hold past 1 year for full FMV deduction.",
    );
  }
  if (inputs.assetType === "private-stock") {
    warnings.push(
      "Private stock requires a qualified appraisal (IRS Form 8283 Section B) for gifts >$10K. Add legal/appraisal cost.",
    );
  }

  return {
    strategy: "donate-asset-directly",
    charityReceivedUsd: inputs.giftFmvUsd,
    capitalGainsTaxPaidUsd: 0,
    federalIncomeTaxSavedUsd: fedTaxSaved,
    stateIncomeTaxSavedUsd: stateTaxSaved,
    totalTaxBenefitUsd: totalTaxBenefit,
    outOfPocketCostUsd: outOfPocket,
    effectiveLeverage:
      outOfPocket > 0 ? inputs.giftFmvUsd / outOfPocket : Infinity,
    carryForwardUsd: carryForward,
    warnings,
  };
}

export function compareDonationStrategies(
  inputs: TaxOptimizerInputs,
): ComparisonOutput {
  const cashStrategy = computeCashStrategy(inputs);
  const directStrategy = computeDirectStrategy(inputs);
  return {
    cashStrategy,
    directStrategy,
    extraDollarsToCharity:
      directStrategy.charityReceivedUsd - cashStrategy.charityReceivedUsd,
    extraTaxSaved:
      directStrategy.totalTaxBenefitUsd - cashStrategy.totalTaxBenefitUsd,
    extraOutOfPocket:
      cashStrategy.outOfPocketCostUsd - directStrategy.outOfPocketCostUsd,
  };
}
