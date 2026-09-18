import { createHash } from "node:crypto";
import {
  buildTreatyParameterExport,
  getTreatyParameterSetHash,
} from "@/lib/tasks/treaty-parameter-export";
import { courtUrl } from "@optimitron/site-kit/lib/court-links";
import {
  getReferendumSiteHomeData,
  type PublicSignatoryEntry,
} from "@/lib/referendum-site.server";
import {
  AGENT_CACHE_SECONDS,
  TARGET_QUESTIONS,
  absoluteCampaignUrl,
  getAgentReadablePaths,
  getCampaignSummary,
  getCanonicalAgentReadableSite,
} from "./campaign-canon";
import { ROUTES } from "@/lib/routes";
import type { SiteConfig } from "@/lib/site";
import {
  getUserDisplayAvatar,
  getUserDisplayHref,
  getUserDisplayLabel,
} from "@/lib/user-display";

function normalizeForHash(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value.map((entry) => normalizeForHash(entry));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeForHash(entry)]),
    );
  }
  return value;
}

function stableHash(value: unknown) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(normalizeForHash(value)))
    .digest("hex")}`;
}

function withMetadata<T extends Record<string, unknown>>(
  payload: T,
  generatedAt = new Date(),
) {
  const body = {
    ...payload,
    cacheSeconds: AGENT_CACHE_SECONDS,
    generatedAt: generatedAt.toISOString(),
  };
  return {
    ...body,
    contentHash: stableHash({ ...body, generatedAt: null }),
  };
}

function publicHumanName(
  entry: Extract<PublicSignatoryEntry, { kind: "human" }>,
) {
  return getUserDisplayLabel(entry.user);
}

function publicProfileUrl(site: SiteConfig, entry: PublicSignatoryEntry) {
  if (entry.kind !== "human" || !entry.user.person) return null;
  const href = getUserDisplayHref(entry.user);
  return href ? absoluteCampaignUrl(site, href) : null;
}

function safePublicUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function summarizeSignatory(site: SiteConfig, entry: PublicSignatoryEntry) {
  const base = {
    kind: entry.kind,
    rank: entry.rank,
    totalSignatureCount: entry.totalSignatureCount,
    referredYesCount: entry.referredYesCount,
    livesSaved: entry.livesSaved,
    hoursPrevented: entry.hoursPrevented,
    signedAt: entry.createdAt.toISOString(),
  };

  if (entry.kind === "organization") {
    return {
      ...base,
      name: entry.organization.name,
      description: entry.organization.description,
      logoUrl: safePublicUrl(entry.organization.squareLogoUrl),
      statement: entry.statement,
      website: safePublicUrl(entry.organization.website),
      donationUrl: safePublicUrl(entry.organization.donationUrl),
    };
  }

  return {
    ...base,
    name: publicHumanName(entry),
    profileUrl: publicProfileUrl(site, entry),
    avatarUrl: safePublicUrl(getUserDisplayAvatar(entry.user)),
  };
}

export async function buildAgentManifest(site: SiteConfig) {
  const campaignSite = getCanonicalAgentReadableSite(site);
  const paths = getAgentReadablePaths(campaignSite);
  return withMetadata({
    name: "War on Disease agent manifest",
    canonicalOrigin: absoluteCampaignUrl(campaignSite, "/").replace(/\/$/, ""),
    summary: getCampaignSummary(),
    targetQuestions: TARGET_QUESTIONS,
    sourceUrls: paths.pages.map((entry) => entry.url),
    markdownMirrors: paths.markdownMirrors,
    agentEndpoints: paths.agentEndpoints,
  });
}

export async function buildAgentCampaignState(site: SiteConfig) {
  const campaignSite = getCanonicalAgentReadableSite(site);
  const homeData = await getReferendumSiteHomeData(campaignSite);

  return withMetadata({
    name: "War on Disease campaign state",
    canonicalOrigin: absoluteCampaignUrl(campaignSite, "/").replace(/\/$/, ""),
    summary: getCampaignSummary(),
    sourceUrls: [
      absoluteCampaignUrl(campaignSite, ROUTES.vote),
      absoluteCampaignUrl(campaignSite, ROUTES.signatories),
      courtUrl("/humanity-v-government"),
      courtUrl("/plaintiffs"),
    ],
    counts: {
      individualVotes: homeData?.individualCount ?? 0,
      representedHumanVotes: homeData?.representedHumanCount ?? 0,
      memorialVotes: homeData?.memorialVoteCount ?? 0,
      approvedOrganizations: homeData?.organizationCount ?? 0,
      publicSignatories: homeData?.publicSignatories.totalCount ?? 0,
    },
    links: {
      vote: absoluteCampaignUrl(campaignSite, ROUTES.vote),
      treaty: absoluteCampaignUrl(campaignSite, ROUTES.treaty),
      signatories: absoluteCampaignUrl(campaignSite, ROUTES.signatories),
      plaintiffs: courtUrl("/plaintiffs"),
      courtState: courtUrl("/api/agent/plaintiffs"),
      parameters: absoluteCampaignUrl(campaignSite, "/api/agent/parameters"),
    },
  });
}

export async function buildAgentSignatories(site: SiteConfig) {
  const campaignSite = getCanonicalAgentReadableSite(site);
  const homeData = await getReferendumSiteHomeData(campaignSite);
  const page = homeData?.publicSignatories;

  return withMetadata({
    name: "War on Disease public signatories",
    sourceUrls: [absoluteCampaignUrl(campaignSite, ROUTES.signatories)],
    page: page?.page ?? 1,
    pageSize: page?.pageSize ?? 0,
    totalCount: page?.totalCount ?? 0,
    totalPages: page?.totalPages ?? 1,
    signatories: (page?.signatories ?? []).map((entry) =>
      summarizeSignatory(campaignSite, entry),
    ),
  });
}

export async function buildAgentParameters(site: SiteConfig) {
  const campaignSite = getCanonicalAgentReadableSite(site);
  const parameterExport = buildTreatyParameterExport();
  const parameterSetHash = getTreatyParameterSetHash();
  return {
    ...withMetadata({
      name: "1% Treaty parameter export",
      sourceUrls: [
        absoluteCampaignUrl(campaignSite, ROUTES.treaty),
        "https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations.html",
      ],
      parameterSetHash,
      parameterExport,
    }),
    contentHash: parameterSetHash,
  };
}

export function buildAgentDiscoveryManifest(site: SiteConfig) {
  const campaignSite = getCanonicalAgentReadableSite(site);
  return {
    llmsTxt: absoluteCampaignUrl(campaignSite, "/llms.txt"),
    llmsFullTxt: absoluteCampaignUrl(campaignSite, "/llms-full.txt"),
    markdownMirrors: getAgentReadablePaths(campaignSite).markdownMirrors,
    agentEndpoints: getAgentReadablePaths(campaignSite).agentEndpoints,
  };
}
