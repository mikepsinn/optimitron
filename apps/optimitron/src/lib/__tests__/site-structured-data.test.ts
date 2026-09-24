import { describe, expect, it } from "vitest";
import { getSiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";

describe("buildSiteStructuredData", () => {
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
});
