import { describe, expect, it } from "vitest";
import { compareDonationStrategies } from "./calculate";

// Reference scenario: California donor, $1M FMV stock, $200K cost basis,
// $5M AGI, married filing jointly. Top fed rates apply.
const caBillionaireBase = {
  giftFmvUsd: 1_000_000,
  costBasisUsd: 200_000,
  assetType: "public-stock" as const,
  holdingPeriod: "long-term" as const,
  filingStatus: "married" as const,
  annualAgiUsd: 5_000_000,
  stateCode: "CA",
};

describe("compareDonationStrategies", () => {
  it("direct donation beats sell-then-donate for appreciated stock", () => {
    const out = compareDonationStrategies(caBillionaireBase);
    expect(out.directStrategy.charityReceivedUsd).toBeGreaterThan(
      out.cashStrategy.charityReceivedUsd,
    );
    expect(out.extraDollarsToCharity).toBeGreaterThan(0);
    expect(out.extraTaxSaved).toBeGreaterThanOrEqual(0);
  });

  it("calculates capital gains correctly for sell-then-donate", () => {
    const out = compareDonationStrategies(caBillionaireBase);
    // Gain = $800K. CA top: fed LTCG 20% + NIIT 3.8% + CA 13.3% = 37.1%
    // Expected cap gains tax ≈ $800K × 0.371 = $296,800
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeGreaterThan(290_000);
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeLessThan(305_000);
  });

  it("zero capital gains tax on direct asset donation", () => {
    const out = compareDonationStrategies(caBillionaireBase);
    expect(out.directStrategy.capitalGainsTaxPaidUsd).toBe(0);
  });

  it("direct donation extra dollars equal cap gains avoided", () => {
    const out = compareDonationStrategies(caBillionaireBase);
    expect(out.extraDollarsToCharity).toBeCloseTo(
      out.cashStrategy.capitalGainsTaxPaidUsd,
      0,
    );
  });

  it("texas donor pays no state cap gains", () => {
    const txDonor = { ...caBillionaireBase, stateCode: "TX" };
    const out = compareDonationStrategies(txDonor);
    // Gain $800K × (20% + 3.8%) = $190,400
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeGreaterThan(185_000);
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeLessThan(195_000);
  });

  it("flags AGI carry-forward when gift exceeds 30% cap for direct stock", () => {
    const huge = {
      ...caBillionaireBase,
      giftFmvUsd: 5_000_000, // 100% of AGI; way over 30% cap
      annualAgiUsd: 5_000_000,
    };
    const out = compareDonationStrategies(huge);
    expect(out.directStrategy.carryForwardUsd).toBeGreaterThan(0);
    expect(out.directStrategy.warnings.some((w) => w.includes("carries forward"))).toBe(
      true,
    );
  });

  it("cash donation has no cap gains tax regardless of basis", () => {
    const cashDonor = {
      ...caBillionaireBase,
      assetType: "cash" as const,
      costBasisUsd: 0,
    };
    const out = compareDonationStrategies(cashDonor);
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBe(0);
    expect(out.directStrategy.capitalGainsTaxPaidUsd).toBe(0);
    // For cash both strategies are equivalent
    expect(out.extraDollarsToCharity).toBe(0);
  });

  it("zero-basis crypto is the maximum-leverage gift", () => {
    const zeroBasisCrypto = {
      ...caBillionaireBase,
      assetType: "crypto" as const,
      costBasisUsd: 0,
    };
    const out = compareDonationStrategies(zeroBasisCrypto);
    // 100% gain. CA: cap gains avoided ≈ $1M × 0.371 = $371K
    expect(out.extraDollarsToCharity).toBeGreaterThan(360_000);
    expect(out.extraDollarsToCharity).toBeLessThan(380_000);
  });

  it("direct donation has lower out-of-pocket cost than cash strategy", () => {
    const out = compareDonationStrategies(caBillionaireBase);
    expect(out.directStrategy.outOfPocketCostUsd).toBeLessThan(
      out.cashStrategy.outOfPocketCostUsd,
    );
    expect(out.extraOutOfPocket).toBeGreaterThan(0);
  });

  it("short-term holdings trigger ordinary-income cap gains rates", () => {
    const shortTerm = { ...caBillionaireBase, holdingPeriod: "short-term" as const };
    const out = compareDonationStrategies(shortTerm);
    // Ordinary income: 37% fed + 3.8% NIIT + 13.3% CA = 54.1% on $800K = ~$432,800
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeGreaterThan(420_000);
    expect(out.cashStrategy.capitalGainsTaxPaidUsd).toBeLessThan(445_000);
  });
});
