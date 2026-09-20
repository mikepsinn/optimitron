// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  buildCourtAgentManifest,
  buildCourtLlmsTxt,
  buildCourtMarkdownMirror,
} from "./court-agent-readable";

vi.mock("@/lib/humanity-v-government-case.server", () => ({
  getHumanityVGovernmentPlaintiffCount: async () => 7,
  getHumanityVGovernmentVerdictStats: async () => ({
    referendumSlug: "court-humanity-v-government-verdict",
    yesCount: 4,
    noCount: 2,
    abstainCount: 1,
    existingAnswer: "YES",
    userEmail: "private@example.test",
  }),
}));
import { GET } from "../app/api/agent/plaintiffs/route";

describe("Court agent ownership", () => {
  it.each(["court", "humanity-v-government", "plaintiffs"] as const)(
    "serves %s markdown with Court canonical URLs",
    (key) => {
      const text = buildCourtMarkdownMirror(key, {
        courtMarkdown: "Case evidence body",
      });
      expect(text).toContain(
        `Canonical HTML: https://courtofhumanity.org/${key === "humanity-v-government" ? "" : key}`,
      );
      expect(text).not.toContain("https://warondisease.org/");
      if (key === "court") expect(text).toContain("Case evidence body");
      else
        expect(text).toContain(
          "https://courtofhumanity.org/api/agent/plaintiffs",
        );
    },
  );

  it("advertises only Court-owned pages, mirrors and read APIs", () => {
    const manifest = buildCourtAgentManifest();
    expect(manifest.pages).toContain("https://courtofhumanity.org/");
    expect(manifest.pages).not.toContain("https://courtofhumanity.org/humanity-v-government");
    expect(manifest.markdownMirrors).toContain("https://courtofhumanity.org/humanity-v-government.md");
    const urls = [
      ...manifest.pages,
      ...manifest.markdownMirrors,
      ...manifest.agentEndpoints,
    ];
    expect(
      urls.every(
        (url) => new URL(url).origin === "https://courtofhumanity.org",
      ),
    ).toBe(true);
    for (const url of urls) expect(buildCourtLlmsTxt()).toContain(url);
    expect(buildCourtLlmsTxt()).not.toContain("/plaintiffs/manage");
    expect(manifest.mcpEndpoint).toBe("https://courtofhumanity.org/api/mcp");
    expect(buildCourtLlmsTxt()).toContain(manifest.mcpInstructions);
    expect(buildCourtLlmsTxt()).toContain("authorize");
  });

  it("returns aggregate case data without user-specific verdict or private fields", async () => {
    const response = await GET();
    const payload = await response.json();
    expect(payload.plaintiffCount).toBe(7);
    expect(payload.caseUrl).toBe("https://courtofhumanity.org/");
    expect(payload.sourceUrls).toEqual(["https://courtofhumanity.org/plaintiffs", "https://courtofhumanity.org/"]);
    expect(payload.humanityVGovernmentVerdict).toEqual({
      referendumSlug: "court-humanity-v-government-verdict",
      yesCount: 4,
      noCount: 2,
      abstainCount: 1,
    });
    expect(JSON.stringify(payload)).not.toContain("private@example.test");
    expect(JSON.stringify(payload)).not.toContain("existingAnswer");
    expect(payload.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
  });
});
