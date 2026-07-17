import { describe, expect, it } from "vitest";
import { getSiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";

const INTERNATIONAL_CAMPAIGN_NAME =
  "International Campaign to End War and Disease";

describe("buildSiteStructuredData", () => {
  it("emits organization and website JSON-LD for the site variant", () => {
    const site = getSiteConfig("warOnDisease");
    const payload = buildSiteStructuredData(site);
    const graph = payload["@graph"];

    expect(payload["@context"]).toBe("https://schema.org");
    expect(graph).toHaveLength(2);

    const organization = graph.find((node) => node["@type"] === "Organization");
    const website = graph.find((node) => node["@type"] === "WebSite");

    expect(organization).toMatchObject({
      name: INTERNATIONAL_CAMPAIGN_NAME,
      legalName:
        "Accelerated Medicine Foundation Inc, dba International Campaign to End War and Disease",
      url: "https://warondisease.org",
      email: "hello@warondisease.org",
    });
    expect(website).toMatchObject({
      name: INTERNATIONAL_CAMPAIGN_NAME,
      url: "https://warondisease.org",
    });
    expect(website?.publisher).toEqual({
      "@id": "https://warondisease.org#organization",
    });
  });

  it("publishes the filed EOS identity without exposing tax identifiers", () => {
    const site = getSiteConfig("optimitron");
    const payload = buildSiteStructuredData(site);
    const organization = payload["@graph"].find(
      (node) => node["@type"] === "Organization",
    );

    expect(organization).toMatchObject({
      name: "Earth Optimization Services Inc.",
      legalName: "Earth Optimization Services Inc.",
      url: "https://optimitron.com",
      email: "wishonia@optimitron.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "150 E B St Lbby #1810, SMB #99818",
        addressLocality: "Casper",
        addressRegion: "WY",
        postalCode: "82601",
        addressCountry: "US",
      },
    });
    expect(JSON.stringify(organization)).not.toContain("LLC");
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
