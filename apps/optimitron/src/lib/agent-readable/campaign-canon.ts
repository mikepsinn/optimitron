import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  fmtParamValueOnly,
} from "@optimitron/data/parameters";
import { CAMPAIGN_NAME } from "@optimitron/data/campaign";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig, type SiteConfig } from "@/lib/site";

export const AGENT_CACHE_SECONDS = 3600;
export const AGENT_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export const AGENT_READABLE_CANONICAL_SITE_KEY = "warOnDisease" as const;
export const TREATY_REDUCTION_TEXT = fmtParamValueOnly(TREATY_REDUCTION_PCT, 1);

export const MARKDOWN_MIRROR_PATHS = [
  { key: "treaty", path: "/treaty.md", title: "Treaty mirror" },
  { key: "court", path: "/court.md", title: "Court mirror" },
  {
    key: "humanity-v-government",
    path: "/humanity-v-government.md",
    title: "Humanity v Government mirror",
  },
  { key: "plaintiffs", path: "/plaintiffs.md", title: "Plaintiffs mirror" },
  { key: "faq", path: "/faq.md", title: "Campaign FAQ mirror" },
] as const;

export type MarkdownMirrorKey = (typeof MARKDOWN_MIRROR_PATHS)[number]["key"];

export const AGENT_ENDPOINT_PATHS = [
  {
    key: "manifest",
    path: "/api/agent/manifest",
    title: "Agent manifest",
  },
  {
    key: "campaign-state",
    path: "/api/agent/campaign-state",
    title: "Campaign state",
  },
  {
    key: "signatories",
    path: "/api/agent/signatories",
    title: "Public signatories",
  },
  {
    key: "plaintiffs",
    path: "/api/agent/plaintiffs",
    title: "Plaintiff count",
  },
  {
    key: "parameters",
    path: "/api/agent/parameters",
    title: "Treaty parameters",
  },
] as const;

export type AgentEndpointKey = (typeof AGENT_ENDPOINT_PATHS)[number]["key"];

export const CAMPAIGN_FAQ_ITEMS = [
  {
    question: "What is the 1% Treaty?",
    answer:
      `The 1% Treaty asks governments to redirect ${TREATY_REDUCTION_TEXT} of military spending to clinical trials, with incentives that make keeping the treaty more profitable than canceling it.`,
  },
  {
    question: "What is Humanity v Government?",
    answer:
      "Humanity v Government is the Court of Humanity damages case arguing that governments accepted payment to promote public welfare, then spent the money on war and delayed medicine. The settlement is the 1% Treaty.",
  },
  {
    question: "How do I register a plaintiff?",
    answer:
      "Go to /plaintiffs and add a person who was harmed by war, state violence, regulatory delay, or preventable disease. Public entries show the name and story you choose to publish; private account details are not part of the public case.",
  },
  {
    question: "What is the health and wealth math?",
    answer:
      "The core claim is simple: fewer wars and faster clinical trials mean fewer deaths, less suffering, healthier workers, and higher lifetime income. The parameter export at /api/agent/parameters carries the machine-readable assumptions and citations.",
  },
] as const;

export const TARGET_QUESTIONS = [
  "What is the 1% Treaty?",
  "What is Humanity v Government?",
  "How do I register a plaintiff?",
  "What is the health and wealth math?",
] as const;

export interface AgentReadableLink {
  path: string;
  title: string;
  url: string;
}

export interface AgentReadablePaths {
  agentEndpoints: AgentReadableLink[];
  markdownMirrors: AgentReadableLink[];
  pages: AgentReadableLink[];
}

function campaignSite() {
  return getSiteConfig(AGENT_READABLE_CANONICAL_SITE_KEY);
}

export function getCanonicalAgentReadableSite(site: SiteConfig): SiteConfig {
  return site.key === AGENT_READABLE_CANONICAL_SITE_KEY ? site : campaignSite();
}

export function isCanonicalAgentReadableSite(site: SiteConfig) {
  return site.key === AGENT_READABLE_CANONICAL_SITE_KEY;
}

export function absoluteCampaignUrl(site: SiteConfig, path: string) {
  const canonicalSite = getCanonicalAgentReadableSite(site);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${canonicalSite.canonicalOrigin}${normalizedPath}`;
}

export function getAgentReadablePaths(site: SiteConfig): AgentReadablePaths {
  const pagePaths = [
    { path: ROUTES.treaty, title: "1% Treaty" },
    { path: ROUTES.vote, title: "Vote on the 1% Treaty" },
    { path: ROUTES.court, title: "Court of Humanity" },
    { path: ROUTES.humanityVGovernment, title: "Humanity v Government" },
    { path: ROUTES.plaintiffs, title: "Register a plaintiff" },
    { path: ROUTES.faq, title: "Campaign FAQ" },
  ];

  return {
    pages: pagePaths.map((entry) => ({
      ...entry,
      url: absoluteCampaignUrl(site, entry.path),
    })),
    markdownMirrors: MARKDOWN_MIRROR_PATHS.map((entry) => ({
      path: entry.path,
      title: entry.title,
      url: absoluteCampaignUrl(site, entry.path),
    })),
    agentEndpoints: AGENT_ENDPOINT_PATHS.map((entry) => ({
      path: entry.path,
      title: entry.title,
      url: absoluteCampaignUrl(site, entry.path),
    })),
  };
}

export function getCampaignSummary() {
  const statusQuoYears = Math.round(
    STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
  ).toLocaleString("en-US");
  const acceleratedYears = Math.round(
    DFDA_QUEUE_CLEARANCE_YEARS.value,
  ).toLocaleString("en-US");

  return `${CAMPAIGN_NAME} asks humans to vote for the 1% Treaty: redirect ${TREATY_REDUCTION_TEXT} of military spending to clinical trials, compressing the disease-eradication timeline from ${statusQuoYears} years to ${acceleratedYears} years.`;
}
