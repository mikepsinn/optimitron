import { describe, expect, it } from "vitest";

import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import { getAllSiteConfigs } from "@/lib/site";
import type { NavItem } from "@/lib/routes";

function expectValidChromeItem(item: NavItem) {
  expect(item.href.trim()).not.toBe("");
  expect(item.label.trim()).not.toBe("");
  expect(item.description.trim()).not.toBe("");
  expect(item.cta.trim()).not.toBe("");
  expect(item.emoji.trim()).not.toBe("");
}

function expectNoDuplicateHrefs(items: NavItem[]) {
  const hrefs = items.map((item) => item.href);
  expect(new Set(hrefs).size).toBe(hrefs.length);
}

describe("site variant UI config", () => {
  it("reads variant chrome from the centralized site config", () => {
    for (const site of getAllSiteConfigs()) {
      expect(getSiteVariantUiConfig(site.key)).toBe(site.ui);
    }
  });

  it("builds structurally valid nav and footer chrome for every variant", () => {
    for (const site of getAllSiteConfigs()) {
      const config = getSiteVariantUiConfig(site.key);

      expect(config.nav.brandHref.trim()).not.toBe("");
      expect(config.nav.brandLabel.trim()).not.toBe("");
      expect(config.nav.desktopBrandLabel.trim()).not.toBe("");
      expect(config.nav.menuTitle.trim()).not.toBe("");
      expect(config.nav.signInCallbackUrl.trim()).not.toBe("");
      expect(config.nav.sections.length).toBeGreaterThan(0);

      for (const section of config.nav.sections) {
        expect(section.id.trim()).not.toBe("");
        expect(section.label.trim()).not.toBe("");
        expect(section.items.length).toBeGreaterThan(0);
        expectNoDuplicateHrefs(section.items);

        for (const item of section.items) {
          expectValidChromeItem(item);
        }
      }

      if (config.nav.quickAction) {
        expectValidChromeItem(config.nav.quickAction);
      }

      expect(config.footer.brandHref.trim()).not.toBe("");
      expect(config.footer.brandLabel.trim()).not.toBe("");
      expect(config.footer.brandDescription.trim()).not.toBe("");

      for (const column of config.footer.columns) {
        expect(column.title.trim()).not.toBe("");
        expect(column.items.length).toBeGreaterThan(0);
        expectNoDuplicateHrefs(column.items);

        for (const item of column.items) {
          expectValidChromeItem(item);
        }
      }
    }
  });

  it("keeps partner and medical variant chrome free of internal architecture jargon", () => {
    const forbiddenTerms = [
      "campaign wrapper",
      "embed surface",
      "Optimitron OS program",
      "partner surface",
      "program graph",
    ];

    for (const site of getAllSiteConfigs()) {
      const config = getSiteVariantUiConfig(site.key);
      const copy = [
        config.footer.brandDescription,
        config.footer.bottomText,
        ...config.footer.columns.flatMap((column) =>
          column.items.flatMap((item) => [
            item.description,
            item.tagline ?? "",
          ]),
        ),
        ...config.nav.sections.flatMap((section) =>
          section.items.flatMap((item) => [
            item.description,
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
