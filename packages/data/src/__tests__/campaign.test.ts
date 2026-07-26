import { describe, expect, it } from "vitest";

import { buildOrganizationActivationTaskDescription } from "../campaign";

describe("buildOrganizationActivationTaskDescription", () => {
  it("builds a markdown organization activation task with copy-paste snippets", () => {
    const description = buildOrganizationActivationTaskDescription({
      baseUrl: "https://warondisease.org",
      coalitionStrategyUrl: "https://warondisease.org/coalition-strategy",
      legalUrl: "https://warondisease.org/legal-notes",
      organizationName: "Meridian Research Foundation",
      organizationToolsUrl:
        "https://warondisease.org/organizations/org_meridian",
      surveyUrl: "https://warondisease.org/survey/meridian",
    });

    expect(typeof description).toBe("string");
    expect(description).toContain("## Do this");
    expect(description).toContain("## Member survey URL");
    expect(description).toContain("## Iframe embed code");
    expect(description).toContain("## Website button HTML");
    expect(description).toContain("## Starter email subject");
    expect(description).toContain("## Starter email body");
    expect(description).toContain("## Full tools page");
    expect(description).toContain("## Done when");
    expect(description).toContain("## References");
    expect(description).toContain(
      '<iframe src="https://warondisease.org/survey/meridian"',
    );
    expect(description).toContain(
      '<a href="https://warondisease.org/survey/meridian" style="display:inline-block;border:1px solid #000;padding:12px 16px;color:#000;text-decoration:none;font-weight:700;">Take the Global Survey to End War and Disease</a>',
    );
    expect(description).toContain(
      "Please take 30 seconds to end war and disease",
    );
    expect(description).toContain(
      "Meridian Research Foundation has joined the International Campaign to End War and Disease",
    );
    expect(description).toContain(
      "https://warondisease.org/survey/meridian",
    );
  });
});
