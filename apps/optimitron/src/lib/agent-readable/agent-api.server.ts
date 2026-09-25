import { createHash } from "node:crypto";
import {
  buildTreatyParameterExport,
  getTreatyParameterSetHash,
} from "@/lib/tasks/treaty-parameter-export";
import { courtUrl } from "@optimitron/site-kit/lib/court-links";
import {
  getReferendumSiteHomeData,
  withTreatyReferendum,
  type PublicSignatoryEntry,
} from "@/lib/referendum-site.server";
import {
  AGENT_CACHE_SECONDS,
  TARGET_QUESTIONS,
  absoluteCampaignUrl,
  getAgentReadablePaths,
  getCampaignSummary,
} from "./campaign-canon";
import { ROUTES } from "@/lib/routes";
import { absoluteCanonicalSiteUrl, type SiteConfig } from "@/lib/site";
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

// Profile pages live on optimitron.com, not on the campaign site.
function publicProfileUrl(entry: PublicSignatoryEntry) {
  if (entry.kind !== "human" || !entry.user.person) return null;
  const href = getUserDisplayHref(entry.user);
  return href ? absoluteCanonicalSiteUrl(href) : null;
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

function summarizeSignatory(entry: PublicSignatoryEntry) {
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
    profileUrl: publicProfileUrl(entry),
    avatarUrl: safePublicUrl(getUserDisplayAvatar(entry.user)),
  };
}

export async function buildAgentManifest() {
  const paths = getAgentReadablePaths();
  return withMetadata({
    name: "War on Disease agent manifest",
    canonicalOrigin: absoluteCampaignUrl("/").replace(/\/$/, ""),
    summary: getCampaignSummary(),
    targetQuestions: TARGET_QUESTIONS,
    sourceUrls: paths.pages.map((entry) => entry.url),
    markdownMirrors: paths.markdownMirrors,
    agentEndpoints: paths.agentEndpoints,
  });
}

export async function buildAgentCampaignState(site: SiteConfig) {
  const homeData = await getReferendumSiteHomeData(withTreatyReferendum(site));

  return withMetadata({
    name: "War on Disease campaign state",
    canonicalOrigin: absoluteCampaignUrl("/").replace(/\/$/, ""),
    summary: getCampaignSummary(),
    sourceUrls: [
      absoluteCampaignUrl(ROUTES.vote),
      absoluteCampaignUrl(ROUTES.signatories),
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
      vote: absoluteCampaignUrl(ROUTES.vote),
      treaty: absoluteCampaignUrl(ROUTES.treaty),
      signatories: absoluteCampaignUrl(ROUTES.signatories),
      plaintiffs: courtUrl("/plaintiffs"),
      courtState: courtUrl("/api/agent/plaintiffs"),
      parameters: absoluteCanonicalSiteUrl("/api/agent/parameters"),
    },
  });
}

export async function buildAgentSignatories(site: SiteConfig) {
  const homeData = await getReferendumSiteHomeData(withTreatyReferendum(site));
  const page = homeData?.publicSignatories;

  return withMetadata({
    name: "War on Disease public signatories",
    sourceUrls: [absoluteCampaignUrl(ROUTES.signatories)],
    page: page?.page ?? 1,
    pageSize: page?.pageSize ?? 0,
    totalCount: page?.totalCount ?? 0,
    totalPages: page?.totalPages ?? 1,
    signatories: (page?.signatories ?? []).map((entry) =>
      summarizeSignatory(entry),
    ),
  });
}

export async function buildAgentParameters() {
  const parameterExport = buildTreatyParameterExport();
  const parameterSetHash = getTreatyParameterSetHash();
  return {
    ...withMetadata({
      name: "1% Treaty parameter export",
      sourceUrls: [
        absoluteCampaignUrl(ROUTES.treaty),
        "https://manual.warondisease.org/knowledge/appendix/parameters-and-calculations.html",
      ],
      parameterSetHash,
      parameterExport,
    }),
    contentHash: parameterSetHash,
  };
}
