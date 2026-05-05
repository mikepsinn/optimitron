import { describe, expect, it } from "vitest";
import { getSiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";

const INTERNATIONAL_CAMPAIGN_NAME =
  "International Campaign to End War and Disease";

describe("buildSiteStructuredData", () => {
  it("emits organization and website JSON-LD for the site variant", () => {
    const site = getSiteConfig("onePercentTreaty");
    const payload = buildSiteStructuredData(site);
    const graph = payload["@graph"];

    expect(payload["@context"]).toBe("https://schema.org");
    expect(graph).toHaveLength(2);

    const organization = graph.find((node) => node["@type"] === "Organization");
    const website = graph.find((node) => node["@type"] === "WebSite");

    expect(organization).toMatchObject({
      // The 1% Treaty site shares the campaign brand with WoD; the legal
      // entity (Earth Optimization Services LLC) lives on legalEntityName.
      name: INTERNATIONAL_CAMPAIGN_NAME,
      url: "https://optimitron.com",
      email: "hello@warondisease.org",
    });
    expect(website).toMatchObject({
      name: "1% Treaty",
      url: "https://1percenttreaty.org",
    });
    expect(website?.publisher).toEqual({
      "@id": "https://optimitron.com#organization",
    });
  });

  it("uses the campaign name as the War on Disease website name", () => {
    const site = getSiteConfig("warOnDisease");
    const payload = buildSiteStructuredData(site);
    const graph = payload["@graph"];

    const organization = graph.find((node) => node["@type"] === "Organization");
    const website = graph.find((node) => node["@type"] === "WebSite");

    expect(organization).toMatchObject({
      name: INTERNATIONAL_CAMPAIGN_NAME,
    });
    expect(website).toMatchObject({
      name: INTERNATIONAL_CAMPAIGN_NAME,
      alternateName: expect.arrayContaining([
        "War on Disease",
        INTERNATIONAL_CAMPAIGN_NAME,
      ]),
      url: "https://warondisease.org",
    });
  });
});
