import { shareableSnippets } from "@optimitron/data/parameters";
import type { SiteConfig } from "@/lib/site";
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

function canonicalLine(site: SiteConfig, path: string) {
  return `Canonical HTML: ${absoluteCampaignUrl(site, path)}`;
}

function apiLine(site: SiteConfig, path: string) {
  return `Machine-readable JSON: ${absoluteCampaignUrl(site, path)}`;
}

function section(title: string, body: string) {
  return [`## ${title}`, "", body.trim(), ""].join("\n");
}

function buildTreatyMirror(
  site: SiteConfig,
  input: MarkdownMirrorContentInput,
) {
  return [
    "# 1% Treaty",
    "",
    canonicalLine(site, ROUTES.treaty),
    apiLine(site, "/api/agent/campaign-state"),
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

function buildFaqMirror(site: SiteConfig) {
  return [
    "# Campaign FAQ",
    "",
    canonicalLine(site, ROUTES.faq),
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
  site: SiteConfig,
  input: MarkdownMirrorContentInput = {},
) {
  switch (key) {
    case "treaty":
      return buildTreatyMirror(site, input);
    case "faq":
      return buildFaqMirror(site);
  }
}
