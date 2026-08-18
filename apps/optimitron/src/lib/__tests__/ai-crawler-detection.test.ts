import { describe, expect, it } from "vitest";
import { classifyAiCrawler } from "@/lib/agent-readable/ai-crawler-detection";

describe("AI crawler detection", () => {
  it.each([
    [
      "Mozilla/5.0 AppleWebKit OAI-SearchBot/1.0",
      "openai",
      "search",
      "OAI-SearchBot",
    ],
    ["GPTBot/1.2", "openai", "training", "GPTBot"],
    ["ChatGPT-User/1.0", "openai", "user_fetch", "ChatGPT-User"],
    ["ClaudeBot/1.0", "anthropic", "training", "ClaudeBot"],
    ["Claude-SearchBot/1.0", "anthropic", "search", "Claude-SearchBot"],
    ["Claude-User/1.0", "anthropic", "user_fetch", "Claude-User"],
    ["PerplexityBot/1.0", "perplexity", "search", "PerplexityBot"],
    [
      "Mozilla/5.0 Perplexity-User/1.0",
      "perplexity",
      "user_fetch",
      "Perplexity-User",
    ],
    ["GoogleOther", "google", "search", "GoogleOther"],
    ["Google-CloudVertexBot", "google", "search", "Google-CloudVertexBot"],
  ])(
    "classifies %s",
    (userAgent, provider, purpose, token) => {
      expect(classifyAiCrawler(userAgent)).toMatchObject({
        isKnownAiCrawler: true,
        provider,
        purpose,
        token,
      });
    },
  );

  it("keeps unknown browser traffic out of AI crawler logs", () => {
    expect(
      classifyAiCrawler(
        "Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toMatchObject({
      isKnownAiCrawler: false,
      provider: null,
      purpose: "unknown",
      token: null,
    });
  });
});
