import { describe, expect, it } from "vitest";

import {
  computeGrade,
  gradeAgency,
  US_AGENCY_PERFORMANCE,
  type AgencyPerformanceInput,
  type TimePoint,
} from "../../datasets/agency-performance";

function points(values: number[], startYear = 2000): TimePoint[] {
  return values.map((value, index) => ({ year: startYear + index * 2, value }));
}

function agency(
  spending: number[],
  outcome?: number[],
  outcomeStartYear = 2000,
): AgencyPerformanceInput {
  return {
    agencyId: "test",
    agencyName: "Test Agency",
    emoji: "🧪",
    countryCode: "US",
    mission: "Test",
    spendingTimeSeries: points(spending),
    spendingLabel: "Spending",
    outcomes: outcome
      ? [{ label: "Outcome", emoji: "📈", direction: "higher_is_better", data: points(outcome, outcomeStartYear) }]
      : [],
    gradeRationale: "",
    wishoniaQuote: "",
    sources: [],
  };
}

describe("gradeAgency", () => {
  const sixYears = [100, 110, 120, 130, 140, 150];

  it("does not grade an agency without an outcome series", () => {
    expect(gradeAgency(agency(sixYears))).toBeNull();
  });

  it("does not grade an outcome with too few points to average", () => {
    expect(gradeAgency(agency(sixYears, [1, 2, 3, 4, 5]))).toBeNull();
  });

  it("compares spending and outcome over the years both cover", () => {
    // Spending 2000–2020 rises, then stays flat from 2004; the outcome covers
    // 2010–2030 and stays flat until 2020. Over their shared 2010–2020 window
    // neither moves, so the grade is C, not the B the full arrays would give.
    const spending = [100, 200, 300, 300, 300, 300, 300, 300, 300, 300, 300];
    const outcome = [50, 50, 50, 50, 50, 50, 70, 80, 90, 100, 100];
    expect(computeGrade(points(spending), points(outcome, 2010), "higher_is_better").grade).toBe("B");
    expect(gradeAgency(agency(spending, outcome, 2010))).toBe("C");
  });

  it("grades from spending and the first outcome when both are long enough", () => {
    const outcome = [50, 50, 50, 80, 80, 80];
    expect(gradeAgency(agency(sixYears, outcome))).toBe(
      computeGrade(points(sixYears), points(outcome), "higher_is_better").grade,
    );
  });
});

describe("US_AGENCY_PERFORMANCE", () => {
  it("cites a source for every spending and outcome point", () => {
    const unsourced = US_AGENCY_PERFORMANCE.flatMap((entry) =>
      [
        ...entry.spendingTimeSeries.map((point) => ({ series: entry.spendingLabel, point })),
        ...entry.outcomes.flatMap((outcome) => outcome.data.map((point) => ({ series: outcome.label, point }))),
      ]
        .filter(({ point }) => !point.sourceUrl?.startsWith("https://"))
        .map(({ series, point }) => `${entry.agencyId} ${series} ${point.year}`),
    );
    expect(unsourced).toEqual([]);
  });
});
