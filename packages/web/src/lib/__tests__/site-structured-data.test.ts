import { describe, expect, it } from "vitest";
import { getSiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";

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
      name: "The Institute for Accelerated Medicine",
      url: "https://optimitron.com",
      email: "m@warondisease.org",
    });
    expect(website).toMatchObject({
      name: "1% Treaty",
      url: "https://1percenttreaty.org",
    });
    expect(website?.publisher).toEqual({ "@id": "https://optimitron.com#organization" });
  });
});
