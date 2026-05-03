import { describe, expect, it } from "vitest";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import {
  coalitionLink,
  endorseLink,
  legalLink,
  peopleLink,
  privacyLink,
  readTreatyLink,
  termsLink,
  trialEmbedLink,
  trialSurveyLink,
  treatyDashboardLink,
  treatyTasksLink,
  treatyVoteLink,
  whyLink,
} from "@/lib/routes";
import { getSiteConfig } from "@/lib/site";
import type { SiteKey } from "@/lib/site";

function labelsFor(siteKey: SiteKey) {
  return getSiteVariantUiConfig(siteKey).nav.sections.flatMap((section) =>
    section.items.map((item) => item.label),
  );
}

function chromeItemsFor(siteKey: SiteKey) {
  const config = getSiteVariantUiConfig(siteKey);

  return [
    ...config.nav.sections.flatMap((section) => section.items),
    ...config.footer.columns.flatMap((column) => column.items),
  ];
}

describe("site variant UI config", () => {
  it("reads variant chrome from the centralized site config", () => {
    expect(getSiteVariantUiConfig("onePercentTreaty")).toBe(
      getSiteConfig("onePercentTreaty").ui,
    );
    expect(getSiteVariantUiConfig("dfda")).toBe(
      getSiteConfig("dfda").ui,
    );
  });

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
    expect(labelsFor("optimitron")).toEqual(
      expect.arrayContaining(["Prize", "Tasks", "Dashboard"]),
    );
  });

  it("defines footer columns per variant", () => {
    const treatyFooter = getSiteVariantUiConfig("onePercentTreaty").footer;
    const warFooter = getSiteVariantUiConfig("warOnDisease").footer;

    expect(treatyFooter.columns.map((column) => column.title)).toEqual([
      "Campaign",
      "Proof",
    ]);
    expect(
      treatyFooter.columns.flatMap((column) =>
        column.items.map((item) => item.label),
      ),
    ).toContain("President Management System");

    expect(warFooter.columns.map((column) => column.title)).toEqual([
      "Campaign",
      "Reference",
    ]);
    expect(
      warFooter.columns.flatMap((column) =>
        column.items.map((item) => item.label),
      ),
    ).toEqual([
      "Vote",
      "Read the Treaty",
      "Dashboard",
      "People",
      "Organizational Signatories",
      "Sign as Organization",
      "Donate",
      "Why",
      "Legal",
      "Privacy",
      "Terms",
    ]);
  });

  it("defines restrained navigation for the neutral survey site", () => {
    const config = getSiteVariantUiConfig("trialAbundanceSurvey");

    expect(config.nav.brandLabel).toBe("Trial Abundance Survey");
    expect(config.nav.searchEnabled).toBe(false);
    expect(labelsFor("trialAbundanceSurvey")).toEqual(
      expect.arrayContaining(["Take Survey", "Embed Survey"]),
    );
    expect(labelsFor("trialAbundanceSurvey")).not.toContain(
      "President Management System",
    );
  });

  it("assembles campaign chrome from route-level nav items", () => {
    const treatyItems = chromeItemsFor("onePercentTreaty");
    const warOnDiseaseItems = chromeItemsFor("warOnDisease");
    const surveyItems = chromeItemsFor("trialAbundanceSurvey");

    for (const item of [
      treatyVoteLink,
      treatyDashboardLink,
      treatyTasksLink,
      readTreatyLink,
      whyLink,
      coalitionLink,
      endorseLink,
      legalLink,
    ]) {
      expect(treatyItems).toContain(item);
    }

    for (const item of [
      treatyVoteLink,
      treatyDashboardLink,
      peopleLink,
      readTreatyLink,
      coalitionLink,
      endorseLink,
      whyLink,
      legalLink,
      privacyLink,
      termsLink,
    ]) {
      expect(warOnDiseaseItems).toContain(item);
    }

    expect(surveyItems).toContain(trialSurveyLink);
    expect(surveyItems).toContain(trialEmbedLink);
  });

  it("defines medical navigation for the DFDA site", () => {
    const config = getSiteVariantUiConfig("dfda");

    expect(config.nav.brandLabel).toBe("DFDA");
    expect(labelsFor("dfda")).toEqual(
      expect.arrayContaining(["Conditions", "Treatments"]),
    );
  });

  it("separates War on Disease campaign navigation from the legal treaty site", () => {
    const config = getSiteVariantUiConfig("warOnDisease");

    expect(config.nav.brandLabel).toBe("War on Disease");
    expect(labelsFor("warOnDisease")).toEqual([
      "Vote",
      "Share",
      "People",
      "Read the Treaty",
      "Why",
    ]);
  });

  it("keeps partner and medical variant chrome free of internal architecture jargon", () => {
    const forbiddenTerms = [
      "campaign wrapper",
      "embed surface",
      "Optimitron OS program",
      "partner surface",
      "program graph",
    ];

    for (const siteKey of [
      "dfda",
      "dih",
      "warOnDisease",
      "trialAbundanceSurvey",
    ] satisfies SiteKey[]) {
      const config = getSiteVariantUiConfig(siteKey);
      const copy = [
        config.footer.brandDescription,
        config.footer.bottomText,
        ...config.footer.columns.flatMap((column) =>
          column.items.flatMap((item) => [
            item.description ?? "",
            item.tagline ?? "",
          ]),
        ),
        ...config.nav.sections.flatMap((section) =>
          section.items.flatMap((item) => [
            item.description ?? "",
            item.tagline ?? "",
          ]),
        ),
      ].join("\n");

      for (const term of forbiddenTerms) {
        expect(copy).not.toContain(term);
      }
    }
  });
});
