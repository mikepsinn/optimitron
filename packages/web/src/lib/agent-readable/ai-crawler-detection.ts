export type AiCrawlerProvider =
  | "openai"
  | "anthropic"
  | "perplexity"
  | "google";
export type AiCrawlerPurpose = "search" | "training" | "user_fetch" | "unknown";

export interface AiCrawlerClassification {
  isKnownAiCrawler: boolean;
  provider: AiCrawlerProvider | null;
  purpose: AiCrawlerPurpose;
  token: string | null;
}

interface AiCrawlerRule {
  provider: AiCrawlerProvider;
  purpose: AiCrawlerPurpose;
  token: string;
}

const AI_CRAWLER_RULES: readonly AiCrawlerRule[] = [
  { token: "OAI-SearchBot", provider: "openai", purpose: "search" },
  { token: "ChatGPT-User", provider: "openai", purpose: "user_fetch" },
  { token: "GPTBot", provider: "openai", purpose: "training" },
  { token: "Claude-SearchBot", provider: "anthropic", purpose: "search" },
  { token: "Claude-User", provider: "anthropic", purpose: "user_fetch" },
  { token: "ClaudeBot", provider: "anthropic", purpose: "training" },
  { token: "Perplexity-User", provider: "perplexity", purpose: "user_fetch" },
  { token: "PerplexityUser", provider: "perplexity", purpose: "user_fetch" },
  { token: "PerplexityBot", provider: "perplexity", purpose: "search" },
  { token: "Google-CloudVertexBot", provider: "google", purpose: "search" },
  { token: "GoogleOther", provider: "google", purpose: "search" },
  { token: "Googlebot", provider: "google", purpose: "search" },
  { token: "Google-Extended", provider: "google", purpose: "training" },
];

export const AI_CRAWLER_USER_AGENTS = AI_CRAWLER_RULES.map(
  (rule) => rule.token,
);

const FALLBACK_RULES: readonly AiCrawlerRule[] = [
  { token: "OpenAI", provider: "openai", purpose: "unknown" },
  { token: "Anthropic", provider: "anthropic", purpose: "unknown" },
];

function matchRule(
  userAgent: string,
  rules: readonly AiCrawlerRule[],
): AiCrawlerRule | null {
  const lower = userAgent.toLowerCase();
  return (
    rules.find((rule) => lower.includes(rule.token.toLowerCase())) ?? null
  );
}

export function classifyAiCrawler(
  userAgent: string | null | undefined,
): AiCrawlerClassification {
  const value = userAgent?.trim();
  if (!value) {
    return {
      isKnownAiCrawler: false,
      provider: null,
      purpose: "unknown",
      token: null,
    };
  }

  const match = matchRule(value, AI_CRAWLER_RULES) ?? matchRule(value, FALLBACK_RULES);
  if (!match) {
    return {
      isKnownAiCrawler: false,
      provider: null,
      purpose: "unknown",
      token: null,
    };
  }

  return {
    isKnownAiCrawler: true,
    provider: match.provider,
    purpose: match.purpose,
    token: match.token,
  };
}
