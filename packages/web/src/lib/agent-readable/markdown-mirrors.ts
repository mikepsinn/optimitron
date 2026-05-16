import {
  COURT_OF_HUMANITY_QUESTION,
} from "@optimitron/data/referendums";
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
  courtMarkdown?: string | null;
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
      "Vote yes, then give another human the same job. A treaty without humans clicking the button is just very polite paper.",
    ),
    section(
      "Treaty Body",
      input.treatyMarkdown || shareableSnippets.onePercentTreatyText.markdown,
    ),
  ].join("\n");
}

function buildCourtMirror(site: SiteConfig, input: MarkdownMirrorContentInput) {
  return [
    "# Court of Humanity",
    "",
    canonicalLine(site, ROUTES.court),
    "",
    section("Question", COURT_OF_HUMANITY_QUESTION),
    section(
      "Body",
      input.courtMarkdown ||
        "The Court of Humanity is the campaign's public venue for asking whether humans can hold governments accountable when those governments kill, injure, or ruin their families.",
    ),
  ].join("\n");
}

function buildHumanityVGovernmentMirror(site: SiteConfig) {
  return [
    "# Humanity v Government",
    "",
    canonicalLine(site, ROUTES.humanityVGovernment),
    apiLine(site, "/api/agent/plaintiffs"),
    "",
    section(
      "Caption",
      "Humanity v Government names humanity as the plaintiff and the governments of Earth as the collective defendants.",
    ),
    section(
      "Claim",
      "The case says governments accepted compulsory payment to promote public welfare, then spent public money on war, delayed medicine, and misallocated the cure budget.",
    ),
    section(
      "Settlement",
      "The 1% Treaty is the settlement: redirect 1% of military spending to clinical trials and make compliance more profitable than evasion.",
    ),
  ].join("\n");
}

function buildPlaintiffsMirror(site: SiteConfig) {
  return [
    "# Register a Plaintiff",
    "",
    canonicalLine(site, ROUTES.plaintiffs),
    apiLine(site, "/api/agent/plaintiffs"),
    "",
    section(
      "Who Belongs Here",
      "Register a person who was harmed by war, state violence, regulatory delay, or preventable disease and should be counted in Humanity v Government.",
    ),
    section(
      "Public Data",
      "Public plaintiff entries show only the details intentionally published for the case. The agent API reports aggregate campaign state, not private account data.",
    ),
    section(
      "Action",
      `Use ${absoluteCampaignUrl(site, ROUTES.plaintiffs)} to add a plaintiff.`,
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
    case "court":
      return buildCourtMirror(site, input);
    case "humanity-v-government":
      return buildHumanityVGovernmentMirror(site);
    case "plaintiffs":
      return buildPlaintiffsMirror(site);
    case "faq":
      return buildFaqMirror(site);
  }
}
