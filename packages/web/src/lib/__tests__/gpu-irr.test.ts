import { describe, expect, it } from "vitest";
import {
  evaluateRig,
  HOURS_PER_MONTH,
  monthlyNetCash,
  solveMonthlyIrr,
  SYSTEM_POWER_OVERHEAD,
  type RigScenario,
} from "@/lib/gpu-irr";

const BASE: RigScenario = {
  cardCount: 4,
  pricePerCard: 8000,
  tdpWatts: 300,
  utilization: 0.5,
  rentalPerCardHour: 0.9,
  marketplaceFee: 0.2,
  electricityPerKwh: 0.17,
  residualAnnualGrowth: 0,
  horizonMonths: 36,
};

describe("monthlyNetCash", () => {
  it("charges power only for rented hours and applies the marketplace fee", () => {
    const rentedHours = HOURS_PER_MONTH * BASE.utilization;
    const expectedIncome =
      BASE.cardCount * BASE.rentalPerCardHour * rentedHours * (1 - BASE.marketplaceFee);
    const expectedPower =
      BASE.cardCount *
      ((BASE.tdpWatts * SYSTEM_POWER_OVERHEAD) / 1000) *
      rentedHours *
      BASE.electricityPerKwh;
    expect(monthlyNetCash(BASE)).toBeCloseTo(expectedIncome - expectedPower, 6);
  });

  it("returns zero at zero utilization", () => {
    expect(monthlyNetCash({ ...BASE, utilization: 0 })).toBe(0);
  });
});

describe("solveMonthlyIrr", () => {
  it("recovers the rate of a simple annuity", () => {
    // 1000 out, 12 x 100 back: known monthly IRR ~2.923%.
    const flows = [-1000, ...Array.from({ length: 12 }, () => 100)];
    const irr = solveMonthlyIrr(flows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(0.02923, 3);
  });

  it("returns null when the investment can never be recovered", () => {
    const flows = [-1000, -10, -10, -10];
    expect(solveMonthlyIrr(flows)).toBeNull();
  });
});

describe("evaluateRig", () => {
  it("break-even residual with zero net cash yields ~0% IRR", () => {
    const s: RigScenario = {
      ...BASE,
      utilization: 0,
      residualAnnualGrowth: 0,
      horizonMonths: 24,
    };
    const out = evaluateRig(s);
    expect(out.monthlyNet).toBe(0);
    expect(out.residualValue).toBeCloseTo(out.totalInvested, 6);
    expect(out.annualizedIrr).not.toBeNull();
    expect(Math.abs(out.annualizedIrr!)).toBeLessThan(0.001);
    expect(out.paybackMonths).toBeNull();
  });

  it("positive rental income produces a payback month and positive IRR", () => {
    const out = evaluateRig(BASE);
    expect(out.monthlyNet).toBeGreaterThan(0);
    expect(out.paybackMonths).toBeGreaterThan(0);
    expect(out.annualizedIrr).toBeGreaterThan(0);
  });

  it("depreciating residual with no income goes negative, not null", () => {
    const s: RigScenario = {
      ...BASE,
      utilization: 0,
      residualAnnualGrowth: -0.3,
      horizonMonths: 24,
    };
    const out = evaluateRig(s);
    expect(out.annualizedIrr).not.toBeNull();
    expect(out.annualizedIrr!).toBeCloseTo(-0.3, 1);
    expect(out.totalReturn).toBeLessThan(0);
  });

  it("payback beyond the horizon reports null", () => {
    const s: RigScenario = { ...BASE, rentalPerCardHour: 0.12, horizonMonths: 12 };
    const out = evaluateRig(s);
    expect(out.monthlyNet).toBeGreaterThan(0);
    expect(out.paybackMonths).toBeNull();
  });
});
