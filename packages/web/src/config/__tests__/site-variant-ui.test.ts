import { describe, expect, it } from "vitest";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";

function labelsFor(siteKey: "optimitron" | "onePercentTreaty") {
  return getSiteVariantUiConfig(siteKey).nav.sections.flatMap((section) =>
    section.items.map((item) => item.label),
  );
}

describe("site variant UI config", () => {
  it("gives the treaty site campaign-specific navigation", () => {
    const config = getSiteVariantUiConfig("onePercentTreaty");

    expect(config.nav.brandLabel).toBe("1% Treaty");
    expect(config.nav.searchEnabled).toBe(false);
    expect(labelsFor("onePercentTreaty")).toEqual(
      expect.arrayContaining([
        "Vote",
        "Dashboard",
        "President Management System",
        "Read the Treaty",
      ]),
    );
  });

  it("keeps Optimitron on the full platform navigation", () => {
    const config = getSiteVariantUiConfig("optimitron");

    expect(config.nav.brandLabel).toBe("Optimitron");
    expect(config.nav.searchEnabled).toBe(true);
    expect(config.showGameScoreBar).toBe(true);
    expect(labelsFor("optimitron")).toEqual(
      expect.arrayContaining(["Prize", "Tasks", "Dashboard"]),
    );
  });

  it("defines footer columns per variant", () => {
    const treatyFooter = getSiteVariantUiConfig("onePercentTreaty").footer;

    expect(treatyFooter.columns.map((column) => column.title)).toEqual([
      "Campaign",
      "Proof",
    ]);
    expect(
      treatyFooter.columns.flatMap((column) =>
        column.items.map((item) => item.label),
      ),
    ).toContain("President Management System");
  });
});
