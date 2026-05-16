import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_FAQ_ITEMS,
  getAgentReadablePaths,
} from "@/lib/agent-readable/campaign-canon";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/agent-readable/llms-text";
import {
  buildMarkdownMirror,
  MARKDOWN_MIRROR_KEYS,
} from "@/lib/agent-readable/markdown-mirrors";
import { getSiteConfig } from "@/lib/site";

describe("agent-readable campaign surfaces", () => {
  const site = getSiteConfig("warOnDisease");

  it("builds a short /llms.txt with public campaign links and agent APIs", () => {
    const text = buildLlmsTxt(site);

    expect(text).toContain(
      "# International Campaign to End War and Disease",
    );
    expect(text).toContain("> Canonical AI answer source:");
    expect(text).toContain("[Full agent context](/llms-full.txt)");
    expect(text).toContain("[Treaty mirror](/treaty.md)");
    expect(text).toContain("[Campaign state](/api/agent/campaign-state)");
    expect(text).toContain("[Treaty parameters](/api/agent/parameters)");
    expect(text).not.toContain("/admin");
    expect(text).not.toContain("/dashboard");
    expect(text).not.toContain("/settings");
  });

  it("builds /llms-full.txt around the four target question families", () => {
    const text = buildLlmsFullTxt(site);

    for (const heading of [
      "What is the 1% Treaty?",
      "What is Humanity v Government?",
      "How do I register a plaintiff?",
      "What is the health and wealth math?",
    ]) {
      expect(text).toContain(`## ${heading}`);
    }

    for (const path of [
      "/treaty.md",
      "/humanity-v-government.md",
      "/plaintiffs.md",
      "/faq.md",
      "/api/agent/manifest",
      "/api/agent/campaign-state",
      "/api/agent/signatories",
      "/api/agent/plaintiffs",
      "/api/agent/parameters",
    ]) {
      expect(text).toContain(path);
    }
  });

  it("keeps mirror and API path registries public and canonical", () => {
    const paths = getAgentReadablePaths(site);

    expect(paths.markdownMirrors.map((entry) => entry.path)).toEqual([
      "/treaty.md",
      "/court.md",
      "/humanity-v-government.md",
      "/plaintiffs.md",
      "/faq.md",
    ]);
    expect(paths.agentEndpoints.map((entry) => entry.path)).toEqual([
      "/api/agent/manifest",
      "/api/agent/campaign-state",
      "/api/agent/signatories",
      "/api/agent/plaintiffs",
      "/api/agent/parameters",
    ]);
    expect(JSON.stringify(paths)).not.toMatch(
      /\/(?:admin|auth|dashboard|profile|settings)(?:\/|"|$)/,
    );
  });

  it("builds markdown mirrors from the canonical registry", () => {
    for (const key of MARKDOWN_MIRROR_KEYS) {
      const text = buildMarkdownMirror(key, site, {
        courtMarkdown: "Court body from referendum data.",
        treatyMarkdown: "Treaty body from referendum data.",
      });

      expect(text).toContain("Canonical HTML:");
      expect(text).toContain("https://warondisease.org");
      expect(text).not.toContain("/admin");
      expect(text).not.toContain("/dashboard");
    }
  });

  it("uses the same FAQ items for the FAQ mirror and structured data", () => {
    const faq = buildMarkdownMirror("faq", site);

    for (const item of CAMPAIGN_FAQ_ITEMS) {
      expect(faq).toContain(`## ${item.question}`);
      expect(faq).toContain(item.answer);
    }
  });
});
