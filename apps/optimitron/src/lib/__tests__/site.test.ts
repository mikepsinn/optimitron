import { describe, expect, it } from "vitest";
import { buildOrganizationSurveyUrl, getRequestSiteOrigin } from "@/lib/site";

describe("site registry", () => {
  it("uses local http origins for .local hosts", () => {
    expect(
      getRequestSiteOrigin({
        host: "optimitron.local:3001",
      }),
    ).toBe("http://optimitron.local:3001");
  });

  it("prefers forwarded host and proto when present", () => {
    expect(
      getRequestSiteOrigin({
        host: "localhost:3001",
        forwardedHost: "optimitron.com",
        forwardedProto: "https",
      }),
    ).toBe("https://optimitron.com");
  });

  it("builds partner survey URLs on the War on Disease domain", () => {
    expect(buildOrganizationSurveyUrl("trial-partner")).toBe(
      "https://warondisease.org/survey/trial-partner",
    );
    expect(
      buildOrganizationSurveyUrl("trial-partner", {
        referralCode: "mike psinn",
      }),
    ).toBe("https://warondisease.org/survey/trial-partner?ref=mike+psinn");
  });
});
