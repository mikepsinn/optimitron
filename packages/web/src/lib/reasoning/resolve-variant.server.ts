/**
 * Resolve visitor context into a variant-set selection plus exact arm ids for
 * the current reasoning runtime. Assignment rules choose the variant set;
 * allocator decisions choose among concurrent arms within each slotKey.
 */

import { prisma } from "@/lib/prisma";
import {
  allocate,
  resolveHoldoutForSlot,
  type AllocatorContext,
  type RequestHoldoutDecision,
} from "./allocator.server";
import { parseArmContent } from "./arm-content";
import type {
  ChainNodeContent,
  HandoffContent,
  InevitabilityContent,
  ObjectionNodeContent,
  ReplicationCtaContent,
} from "./arm-content";
import {
  DEFAULT_HANDOFF_CHANNEL,
  REQUIRED_SELECTION_SLOT_KEYS,
  slotForSlotKey,
} from "./selection";
import type {
  NodeId,
  RelationshipBucket,
  Surface,
  VariantArmSelectionMap,
  VariantSlot,
} from "./types";

export type ResolveVariantInput = {
  hostKey: string;
  organizationId: string | null;
  localeKey: string;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  device: string | null;
  chainDepth: "90s" | "deep";
  surface: Surface;
  audienceTag: string | null;
};

export type ResolvedVariantSet = {
  canonicalSetId: string;
  variantSetId: string;
  variantSetName: string;
  matchedRuleId: string | null;
  matchedRuleWasPin: boolean;
};

export type ResolvedVariantSelection = {
  variantSetId: string;
  variantSetName: string;
  variantArmIds: VariantArmSelectionMap;
  isControlHoldout: boolean;
  holdoutResolutionLevel: RequestHoldoutDecision["holdoutResolutionLevel"];
  holdoutRate: number;
};

export type ReasoningArmsByNode = {
  claims: Record<NodeId, ChainNodeContent | null>;
  objections: Record<NodeId, ObjectionNodeContent | null>;
  inevitability: InevitabilityContent | null;
  replication: ReplicationCtaContent | null;
  handoffs: Record<RelationshipBucket, HandoffContent>;
};

export async function resolveVariantSetForVisitor(
  input: ResolveVariantInput,
): Promise<ResolvedVariantSet | null> {
  const canonicalSet = await prisma.reasoningVariantSet.findFirst({
    where: { isCanonical: true, status: "ACTIVE" },
    select: { id: true, name: true },
  });
  if (!canonicalSet) return null;

  const matchedRule = await matchAssignmentRule(input);
  if (!matchedRule) {
    return {
      canonicalSetId: canonicalSet.id,
      variantSetId: canonicalSet.id,
      variantSetName: canonicalSet.name,
      matchedRuleId: null,
      matchedRuleWasPin: false,
    };
  }

  const matchedSet = await prisma.reasoningVariantSet.findUnique({
    where: { id: matchedRule.variantSetId },
    select: { id: true, name: true, status: true },
  });

  if (!matchedSet || matchedSet.status !== "ACTIVE") {
    return {
      canonicalSetId: canonicalSet.id,
      variantSetId: canonicalSet.id,
      variantSetName: canonicalSet.name,
      matchedRuleId: matchedRule.id,
      matchedRuleWasPin: matchedRule.isPin,
    };
  }

  return {
    canonicalSetId: canonicalSet.id,
    variantSetId: matchedSet.id,
    variantSetName: matchedSet.name,
    matchedRuleId: matchedRule.id,
    matchedRuleWasPin: matchedRule.isPin,
  };
}

export async function selectVariantArmsForSession(params: {
  resolvedSet: ResolvedVariantSet;
  localeKey: string;
  allocatorContext: AllocatorContext;
  policyDecisionId: string;
}): Promise<ResolvedVariantSelection> {
  const { resolvedSet, localeKey, allocatorContext, policyDecisionId } = params;
  const requestHoldout = await resolveHoldoutForSlot({
    slot: "CHAIN_NODE",
    ctx: allocatorContext,
    policyDecisionId,
  });

  const localePriority = await loadLocalePriority(localeKey);
  const rows = await prisma.reasoningVariantArm.findMany({
    where: {
      variantSetId: { in: uniqueStrings([resolvedSet.variantSetId, resolvedSet.canonicalSetId]) },
      status: "ACTIVE",
      localeKey: { in: localePriority },
      slotKey: { in: [...REQUIRED_SELECTION_SLOT_KEYS] },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const bySetAndKey = new Map<string, Array<typeof rows[number]>>();
  for (const row of rows) {
    const mapKey = `${row.variantSetId}::${row.slotKey}`;
    const list = bySetAndKey.get(mapKey) ?? [];
    list.push(row);
    bySetAndKey.set(mapKey, list);
  }

  const variantArmIds: VariantArmSelectionMap = {};
  for (const slotKey of REQUIRED_SELECTION_SLOT_KEYS) {
    const canonicalCandidates = pickCandidates(
      bySetAndKey.get(`${resolvedSet.canonicalSetId}::${slotKey}`) ?? [],
      localePriority,
    );
    const canonicalArm = canonicalCandidates[0] ?? null;
    if (!canonicalArm) {
      throw new Error(`Missing canonical reasoning arm for slotKey "${slotKey}"`);
    }

    const targetSetId = requestHoldout.isControlHoldout
      ? resolvedSet.canonicalSetId
      : resolvedSet.variantSetId;
    const targetCandidates = pickCandidates(
      bySetAndKey.get(`${targetSetId}::${slotKey}`) ?? [],
      localePriority,
    );
    const activeArmIds =
      targetCandidates.length > 0
        ? targetCandidates.map((row) => row.id)
        : [canonicalArm.id];

    const decision = await allocate({
      slot: slotForSlotKey(slotKey),
      ctx: allocatorContext,
      activeArmIds,
      canonicalArmId: canonicalArm.id,
      policyDecisionId,
      requestHoldout,
    });

    variantArmIds[slotKey] = decision.armId;
  }

  return {
    variantSetId: requestHoldout.isControlHoldout
      ? resolvedSet.canonicalSetId
      : resolvedSet.variantSetId,
    variantSetName: requestHoldout.isControlHoldout
      ? "canonical"
      : resolvedSet.variantSetName,
    variantArmIds,
    isControlHoldout: requestHoldout.isControlHoldout,
    holdoutResolutionLevel: requestHoldout.holdoutResolutionLevel,
    holdoutRate: requestHoldout.holdoutRate,
  };
}

export async function loadArmsBySelectedIds(
  variantArmIds: VariantArmSelectionMap,
): Promise<ReasoningArmsByNode> {
  const selectedIds = uniqueStrings(Object.values(variantArmIds));
  const rows = selectedIds.length
    ? await prisma.reasoningVariantArm.findMany({
        where: { id: { in: selectedIds } },
      })
    : [];

  const claims: Record<NodeId, ChainNodeContent | null> = {};
  const objections: Record<NodeId, ObjectionNodeContent | null> = {};
  let inevitability: InevitabilityContent | null = null;
  let replication: ReplicationCtaContent | null = null;
  const handoffs: Partial<Record<RelationshipBucket, HandoffContent>> = {};

  for (const row of rows) {
    try {
      if (row.slot === "CHAIN_NODE") {
        const content = parseArmContent("CHAIN_NODE", row.content);
        claims[content.nodeId] = content;
      } else if (row.slot === "OBJECTION_NODE") {
        const content = parseArmContent("OBJECTION_NODE", row.content);
        objections[content.nodeId] = content;
      } else if (row.slot === "INEVITABILITY") {
        inevitability = parseArmContent("INEVITABILITY", row.content);
      } else if (row.slot === "REPLICATION_CTA") {
        replication = parseArmContent("REPLICATION_CTA", row.content);
      } else if (
        row.slot === "HANDOFF" &&
        row.channel === DEFAULT_HANDOFF_CHANNEL
      ) {
        const content = parseArmContent("HANDOFF", row.content);
        handoffs[content.bucket] = content;
      }
    } catch {
      // Malformed content is skipped here; validator/admin surfaces the issue.
    }
  }

  return {
    claims,
    objections,
    inevitability,
    replication,
    handoffs: {
      "family-partner":
        handoffs["family-partner"] ?? fallbackHandoff("family-partner"),
      "close-friend":
        handoffs["close-friend"] ?? fallbackHandoff("close-friend"),
      professional: handoffs.professional ?? fallbackHandoff("professional"),
      "weak-tie": handoffs["weak-tie"] ?? fallbackHandoff("weak-tie"),
    },
  };
}

async function matchAssignmentRule(
  input: ResolveVariantInput,
): Promise<{ id: string; variantSetId: string; isPin: boolean } | null> {
  const rules = await prisma.reasoningAssignmentRule.findMany({
    where: { active: true },
    orderBy: { priority: "asc" },
    select: { id: true, variantSetId: true, isPin: true, hostKey: true, organizationId: true, localeKey: true, relationshipBucket: true, referralSource: true, device: true, chainDepth: true, surface: true, audienceTag: true },
  });
  for (const rule of rules) {
    if (rule.hostKey && rule.hostKey !== input.hostKey) continue;
    if (rule.organizationId && rule.organizationId !== input.organizationId) continue;
    if (rule.localeKey && rule.localeKey !== input.localeKey) continue;
    if (rule.relationshipBucket && rule.relationshipBucket !== input.relationshipBucket) continue;
    if (rule.referralSource && rule.referralSource !== input.referralSource) continue;
    if (rule.device && rule.device !== input.device) continue;
    if (rule.chainDepth && rule.chainDepth !== input.chainDepth) continue;
    if (rule.surface && rule.surface !== input.surface) continue;
    if (rule.audienceTag && rule.audienceTag !== input.audienceTag) continue;
    return rule;
  }
  return null;
}

async function loadLocalePriority(localeKey: string): Promise<string[]> {
  const config = await prisma.reasoningLocaleConfig.findUnique({
    where: { localeKey },
    select: { fallbackChain: true },
  });
  return uniqueStrings([localeKey, ...(config?.fallbackChain ?? [])]);
}

function pickCandidates<T extends { localeKey: string }>(
  rows: readonly T[],
  localePriority: readonly string[],
): T[] {
  for (const localeKey of localePriority) {
    const matches = rows.filter((row) => row.localeKey === localeKey);
    if (matches.length > 0) return matches;
  }
  return [];
}

function fallbackHandoff(bucket: RelationshipBucket): HandoffContent {
  return {
    bucket,
    channel: DEFAULT_HANDOFF_CHANNEL,
    template: "Take a minute — tell me if this is obviously wrong: {url}",
    maxLen: 160,
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
