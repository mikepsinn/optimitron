import { describe, expect, it } from "vitest";
import {
  buildCampaignFaqStructuredData,
  buildCourtStructuredData,
  buildHumanityVGovernmentStructuredData,
  buildTreatyStructuredData,
  buildVoteStructuredData,
  getStructuredDataTypes,
} from "@/lib/campaign-structured-data";
import {
  CAMPAIGN_FAQ_ITEMS,
} from "@/lib/agent-readable/campaign-canon";
import { getSiteConfig } from "@/lib/site";

describe("campaign structured data", () => {
  const site = getSiteConfig("warOnDisease");

  it("emits only schema.org-supported campaign graph types", () => {
    const types = new Set(
      [
        buildTreatyStructuredData(site),
        buildVoteStructuredData(site),
        buildCourtStructuredData(site),
        buildHumanityVGovernmentStructuredData(site),
        buildCampaignFaqStructuredData(site),
      ].flatMap((payload) => getStructuredDataTypes(payload)),
    );

    expect([...types]).toEqual(
      expect.arrayContaining([
        "WebPage",
        "Legislation",
        "VoteAction",
        "Claim",
        "FAQPage",
        "Question",
        "Answer",
      ]),
    );
    expect(types).not.toContain("Petition");
    expect(types).not.toContain("CourtCase");
    expect(types).not.toContain("LegalCase");
  });

  it("maps the FAQPage graph to the visible campaign FAQ registry", () => {
    const payload = buildCampaignFaqStructuredData(site);
    const faq = payload["@graph"].find((node) => node["@type"] === "FAQPage");

    expect(faq).toBeTruthy();
    expect(faq?.mainEntity).toHaveLength(CAMPAIGN_FAQ_ITEMS.length);
    for (const item of CAMPAIGN_FAQ_ITEMS) {
      expect(faq?.mainEntity).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: expect.objectContaining({
              "@type": "Answer",
              text: item.answer,
            }),
          }),
        ]),
      );
    }
  });

  it("links the treaty legislation and vote action to the canonical campaign URLs", () => {
    const payload = buildTreatyStructuredData(site);
    const graph = payload["@graph"];

    expect(graph).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Legislation",
          url: "https://warondisease.org/treaty",
        }),
        expect.objectContaining({
          "@type": "VoteAction",
          target: "https://warondisease.org/vote",
        }),
      ]),
    );
  });

  it("describes Humanity v Government as Claim nodes, not nonexistent legal case types", () => {
    const payload = buildHumanityVGovernmentStructuredData(site);
    const claimNodes = payload["@graph"].filter(
      (node) => node["@type"] === "Claim",
    );

    expect(claimNodes.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(payload)).toContain("Humanity v Government");
    expect(JSON.stringify(payload)).not.toContain("CourtCase");
    expect(JSON.stringify(payload)).not.toContain("LegalCase");
  });
});
