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

// Campaign pages live on warondisease.org, but only this app serves the
// agent-readable files, so their links must point at optimitron.com.
describe("agent-readable campaign surfaces", () => {
  it("builds a short /llms.txt with public campaign links and agent APIs", () => {
    const text = buildLlmsTxt();

    expect(text).toContain(
      "# International Campaign to End War and Disease",
    );
    expect(text).toContain("> Canonical AI answer source:");
    expect(text).toContain("[1% Treaty](https://warondisease.org/treaty)");
    expect(text).toContain(
      "[Full agent context](https://optimitron.com/llms-full.txt)",
    );
    expect(text).toContain(
      "[Treaty mirror](https://optimitron.com/treaty.md)",
    );
    expect(text).toContain(
      "[Campaign state](https://optimitron.com/api/agent/campaign-state)",
    );
    expect(text).toContain(
      "[Treaty parameters](https://optimitron.com/api/agent/parameters)",
    );
    expect(text).not.toContain("/admin");
    expect(text).not.toContain("/dashboard");
    expect(text).not.toContain("/settings");
  });

  it("builds /llms-full.txt around the four target question families", () => {
    const text = buildLlmsFullTxt();

    for (const heading of [
      "What is the 1% Treaty?",
      "What is Humanity v Government?",
      "How do I register a plaintiff?",
      "What is the health and wealth math?",
    ]) {
      expect(text).toContain(`## ${heading}`);
    }

    for (const path of [
      "https://warondisease.org/treaty",
      "https://optimitron.com/treaty.md",
      "https://courtofhumanity.org/humanity-v-government.md",
      "https://courtofhumanity.org/plaintiffs.md",
      "https://optimitron.com/faq.md",
      "https://optimitron.com/api/agent/manifest",
      "https://optimitron.com/api/agent/campaign-state",
      "https://optimitron.com/api/agent/signatories",
      "https://courtofhumanity.org/api/agent/plaintiffs",
      "https://optimitron.com/api/agent/parameters",
    ]) {
      expect(text).toContain(path);
    }
  });

  it("keeps mirror and API path registries public and canonical", () => {
    const paths = getAgentReadablePaths();

    expect(paths.markdownMirrors.map((entry) => entry.path)).toEqual([
      "/treaty.md",
      "/faq.md",
      "/court.md",
      "/humanity-v-government.md",
      "/plaintiffs.md",
    ]);
    expect(paths.agentEndpoints.map((entry) => entry.path)).toEqual([
      "/api/agent/manifest",
      "/api/agent/campaign-state",
      "/api/agent/signatories",
      "/api/agent/parameters",
      "/api/agent/plaintiffs",
    ]);
    expect(JSON.stringify(paths)).not.toMatch(
      /\/(?:admin|auth|dashboard|profile|settings)(?:\/|"|$)/,
    );
  });

  it("builds markdown mirrors from the canonical registry", () => {
    for (const key of MARKDOWN_MIRROR_KEYS) {
      const text = buildMarkdownMirror(key, {
        treatyMarkdown: "Treaty body from referendum data.",
      });

      expect(text).toContain("Canonical HTML: https://warondisease.org/");
      expect(text).not.toContain("/admin");
      expect(text).not.toContain("/dashboard");
    }
  });

  it("uses the same FAQ items for the FAQ mirror and structured data", () => {
    const faq = buildMarkdownMirror("faq");

    for (const item of CAMPAIGN_FAQ_ITEMS) {
      expect(faq).toContain(`## ${item.question}`);
      expect(faq).toContain(item.answer);
    }
  });
});
