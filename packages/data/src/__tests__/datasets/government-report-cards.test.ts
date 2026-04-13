import { describe, expect, it } from "vitest";
import {
  getGovernmentMetrics,
  GOVERNMENTS,
} from "../../datasets/government-report-cards";
import {
  getGovernmentDeathLedgerEntries,
  getGovernmentDeathLedgerSummary,
} from "../../datasets/government-death-ledger";

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
});
