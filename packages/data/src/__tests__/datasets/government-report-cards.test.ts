import { describe, expect, it } from "vitest";
import {
  getGovernmentMetrics,
  GOVERNMENTS,
} from "../../datasets/government-report-cards";
import {
  getGovernmentDeathLedgerEntries,
  getGovernmentDeathLedgerSummary,
} from "../../datasets/government-death-ledger";
import { getGovernmentIso3 } from "../../datasets/government-code-map";
import { MEDIAN_INCOME_HYDRATION } from "../../generated/median-income-hydration";

describe("government report cards", () => {
  it("hydrates military death totals from the sourced ledger", () => {
    for (const government of GOVERNMENTS) {
      const summary = getGovernmentDeathLedgerSummary(government.code);
      if (!summary) {
        continue;
      }

      expect(government.deathLedgerEntries).toEqual(
        getGovernmentDeathLedgerEntries(government.code),
      );
      expect(government.militaryDeathsCaused.value).toBe(summary.totalDeaths);
      expect(government.militaryDeathsCaused.period).toBe(
        `${summary.startYear}–${summary.endYear}`,
      );
      expect(government.militaryDeathsCaused.source).toContain("ledger");
    }
  });

  it("captures the major revised regime totals from the Rummel-backed ledger", () => {
    expect(getGovernmentMetrics("RU")?.militaryDeathsCaused.value).toBe(61_911_000);
    expect(getGovernmentMetrics("CN")?.militaryDeathsCaused.value).toBe(80_202_000);
    expect(getGovernmentMetrics("DE")?.militaryDeathsCaused.value).toBe(20_946_091);
    expect(getGovernmentMetrics("JP")?.militaryDeathsCaused.value).toBe(5_964_000);
    expect(getGovernmentMetrics("TR")?.militaryDeathsCaused.value).toBe(1_883_000);
    expect(getGovernmentMetrics("PK")?.militaryDeathsCaused.value).toBe(1_503_000);
  });

  it("preserves documented minimum rows for the zero and low-count countries", () => {
    expect(getGovernmentMetrics("SG")?.militaryDeathsCaused.value).toBe(0);
    expect(getGovernmentMetrics("SG")?.deathLedgerEntries?.[0]?.sourceUrl).toContain(
      "mindef.gov.sg",
    );

    expect(getGovernmentMetrics("KR")?.militaryDeathsCaused.value).toBe(9_000);
    expect(getGovernmentMetrics("KR")?.deathLedgerEntries?.[0]?.sourceUrl).toContain(
      "tuoitre.vn",
    );
  });

  describe("median income hydration", () => {
    // The hydration moved from a runtime loop over the 16 MB MEDIAN_INCOME_SERIES
    // dataset to a build-time pre-computed lookup table at
    // `src/generated/median-income-hydration.ts`. These tests catch:
    //   - the generator silently producing an empty/broken map
    //   - the hydration map and the runtime loop drifting out of sync
    //   - someone refreshing `MEDIAN_INCOME_SERIES` without re-running the
    //     hydration generator (now chained, but the test would catch a regression)
    //   - generated values landing wildly outside plausible PPP ranges

    it("populates medianIncome on every government that has a hydration entry", () => {
      for (const gov of GOVERNMENTS) {
        const iso3 = getGovernmentIso3(gov.code);
        if (!iso3) continue;
        const expected = MEDIAN_INCOME_HYDRATION[iso3];
        if (!expected) continue;
        expect(gov.medianIncome, `${gov.code} should have medianIncome`).toEqual(
          expected,
        );
      }
    });

    it("hydrates major economies with plausible PPP values", () => {
      // Sanity bounds: medianIncome should be a positive number under the
      // country's GDP per capita (median is always below mean) but not
      // implausibly small (< 5% of GDP/cap is the dataset's own filter).
      for (const code of ["US", "GB", "DE", "JP", "FR"]) {
        const gov = getGovernmentMetrics(code);
        expect(gov, `expected ${code} in GOVERNMENTS`).toBeDefined();
        const income = gov?.medianIncome;
        expect(income, `${code} should have medianIncome hydrated`).not.toBeNull();
        expect(income?.value).toBeGreaterThan(gov!.gdpPerCapita.value * 0.05);
        expect(income?.value).toBeLessThan(gov!.gdpPerCapita.value);
        expect(income?.source).toMatch(/PPP per capita/);
        expect(income?.url).toMatch(/^https?:/);
      }
    });

    it("USA hydration is non-empty (the most-used row in leaderboards)", () => {
      const usa = getGovernmentMetrics("US");
      expect(usa?.medianIncome?.value).toBeGreaterThan(15_000);
      expect(usa?.medianIncome?.source).toMatch(/OECD|World Bank|Eurostat/);
    });
  });
});
