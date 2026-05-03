import { describe, expect, it } from "vitest";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getGovernmentDetailSections } from "../government-detail-stats";

function getLabels(code: string): string[] {
  const government = getGovernmentMetrics(code);
  if (!government) {
    throw new Error(`Missing government ${code}`);
  }

  const sections = getGovernmentDetailSections(government);

  return [
    ...sections.spendingProfile,
    ...sections.bodyCount,
    ...sections.justiceAndDomestic,
  ].map((stat) => stat.label);
}

describe("government detail stats", () => {
  it("keeps the removed overview-card metrics available on the country page", () => {
    expect(getLabels("US")).toEqual(
      expect.arrayContaining([
        "Body Count",
        "Civilian Deaths",
        "Countries Bombed",
        "Nuclear Warheads",
        "Military Spending/yr",
        "Drug Prisoners",
        "Incarceration /100K",
        "Murders Solved",
        "Life Expectancy",
        "Health Spending/capita",
        "Corporate Welfare/yr",
        "Fossil Fuel Subsidies/yr",
        "Farm Subsidies/yr",
      ]),
    );
  });

  it("omits optional cards when the government does not have that data", () => {
    const pakistanLabels = getLabels("PK");

    expect(pakistanLabels).toEqual(
      expect.arrayContaining([
        "Body Count",
        "Military Spending/yr",
        "Health Spending/capita",
        "Life Expectancy",
        "Incarceration /100K",
      ]),
    );
    expect(pakistanLabels).not.toContain("Farm Subsidies/yr");
    expect(pakistanLabels).not.toContain("Corporate Welfare/yr");
  });
});
