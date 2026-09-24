import { shareableSnippets } from "@optimitron/data/parameters";
import { absoluteCanonicalSiteUrl } from "@/lib/site";
import { ROUTES } from "@/lib/routes";
import {
  CAMPAIGN_FAQ_ITEMS,
  MARKDOWN_MIRROR_PATHS,
  absoluteCampaignUrl,
  getCampaignSummary,
  type MarkdownMirrorKey,
} from "./campaign-canon";

export const MARKDOWN_MIRROR_KEYS = MARKDOWN_MIRROR_PATHS.map(
  (entry) => entry.key,
);

interface MarkdownMirrorContentInput {
  treatyMarkdown?: string | null;
}

function canonicalLine(path: string) {
  return `Canonical HTML: ${absoluteCampaignUrl(path)}`;
}

function apiLine(path: string) {
  return `Machine-readable JSON: ${absoluteCanonicalSiteUrl(path)}`;
}

function section(title: string, body: string) {
  return [`## ${title}`, "", body.trim(), ""].join("\n");
}

function buildTreatyMirror(input: MarkdownMirrorContentInput) {
  return [
    "# 1% Treaty",
    "",
    canonicalLine(ROUTES.treaty),
    apiLine("/api/agent/campaign-state"),
    "",
    getCampaignSummary(),
    "",
    section(
      "What To Do",
      "Vote yes, then hire two more Humanity Managers to do the same. A treaty without humans clicking the button is just very polite paper.",
    ),
    section(
      "Treaty Body",
      input.treatyMarkdown || shareableSnippets.onePercentTreatyText.markdown,
    ),
  ].join("\n");
}

function buildFaqMirror() {
  return [
    "# Campaign FAQ",
    "",
    canonicalLine(ROUTES.faq),
    "",
    ...CAMPAIGN_FAQ_ITEMS.flatMap((item) => [
      `## ${item.question}`,
      "",
      item.answer,
      "",
    ]),
  ].join("\n");
}

export function buildMarkdownMirror(
  key: MarkdownMirrorKey,
  input: MarkdownMirrorContentInput = {},
) {
  switch (key) {
    case "treaty":
      return buildTreatyMirror(input);
    case "faq":
      return buildFaqMirror();
  }
}
