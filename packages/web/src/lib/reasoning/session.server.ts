import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import type { ReasoningState, RelationshipBucket, Surface } from "./types";
import { isReturningSession, slotForSlotKey } from "./selection";
import {
  loadArmsBySelectedIds,
  resolveVariantSetForVisitor,
  selectVariantArmsForSession,
  type ReasoningArmsByNode,
} from "./resolve-variant.server";
import type { AllocatorContext } from "./allocator.server";

const createId = () => nanoid();

export type PrepareReasoningSessionInput = {
  hostRaw: string | null;
  organizationId: string | null;
  orgContextVerified: boolean;
  orgContextToken: string | null;
  localeKey: string;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  surface: Surface;
  audienceTag: string | null;
  initialNodeId: string;
  shareAttemptId: string | null;
  referredByUserId: string | null;
  userAgent: string | null;
};

export type PreparedReasoningSession = {
  session: ReasoningState;
  arms: ReasoningArmsByNode;
  signatureCount: number;
};

export async function prepareReasoningSession(
  input: PrepareReasoningSessionInput,
): Promise<PreparedReasoningSession | null> {
  const hostKey = normalizeHost(input.hostRaw);
  const sessionId = createId();
  const policyDecisionId = createId();
  const device = detectDevice(input.userAgent);
  const returningVsFirst = isReturningSession(input.initialNodeId)
    ? "returning"
    : "first";

  const variantSet = await resolveVariantSetForVisitor({
    hostKey,
    organizationId: input.organizationId,
    localeKey: input.localeKey,
    relationshipBucket: input.relationshipBucket,
    referralSource: input.referralSource,
    device,
    chainDepth: "90s",
    surface: input.surface,
    audienceTag: input.audienceTag,
  });
  if (!variantSet) return null;

  const allocatorContext: AllocatorContext = {
    hostKey,
    localeKey: input.localeKey,
    organizationId: input.organizationId,
    relationshipBucket: input.relationshipBucket,
    referralSource: input.referralSource,
    device,
    chainDepth: "90s",
    returningVsFirst,
    surface: input.surface,
    audienceTag: input.audienceTag,
    sessionId,
  };

  const selection = await selectVariantArmsForSession({
    resolvedSet: variantSet,
    localeKey: input.localeKey,
    allocatorContext,
    policyDecisionId,
  });
  const arms = await loadArmsBySelectedIds(selection.variantArmIds);

  await createInitialExposures({
    sessionId,
    policyDecisionId,
    variantSetId: selection.variantSetId,
    variantArmIds: selection.variantArmIds,
    localeKey: input.localeKey,
    hostKey,
    organizationId: input.organizationId,
    relationshipBucket: input.relationshipBucket,
    referralSource: input.referralSource,
    device,
    chainDepth: "90s",
    returningVsFirst,
    surface: input.surface,
    orgContextVerified: input.orgContextVerified,
    shareAttemptId: input.shareAttemptId,
    referredByUserId: input.referredByUserId,
    isControlHoldout: selection.isControlHoldout,
    holdoutResolutionLevel: selection.holdoutResolutionLevel,
  });

  const signatureCount = await loadSignatureCount();

  return {
    session: {
      sessionId,
      currentNodeId: input.initialNodeId,
      chainDepth: "90s",
      claimAnswers: {},
      claimProbabilities: {},
      conversionP: 0.1,
      firstSendConfirmed: false,
      sendCount: 0,
      startedAt: new Date().toISOString(),
      policyDecisionId,
      variantSetId: selection.variantSetId,
      variantArmIds: selection.variantArmIds,
      organizationId: input.organizationId,
      orgContextVerified: input.orgContextVerified,
      orgContextToken: input.orgContextToken,
      surface: input.surface,
      localeKey: input.localeKey,
      hostKey,
      device,
      returningVsFirst,
      relationshipBucket: input.relationshipBucket,
      referralSource: input.referralSource,
      referredByUserId: input.referredByUserId,
      shareAttemptId: input.shareAttemptId,
      isControlHoldout: selection.isControlHoldout,
      holdoutResolutionLevel: selection.holdoutResolutionLevel,
      audienceTag: input.audienceTag,
    },
    arms,
    signatureCount,
  };
}

async function createInitialExposures(input: {
  sessionId: string;
  policyDecisionId: string;
  variantSetId: string;
  variantArmIds: Record<string, string>;
  localeKey: string;
  hostKey: string;
  organizationId: string | null;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  device: string | null;
  chainDepth: "90s" | "deep";
  returningVsFirst: "returning" | "first";
  surface: Surface;
  orgContextVerified: boolean;
  shareAttemptId: string | null;
  referredByUserId: string | null;
  isControlHoldout: boolean;
  holdoutResolutionLevel: ReasoningState["holdoutResolutionLevel"];
}) {
  const rows = Object.entries(input.variantArmIds).map(([slotKey, variantArmId]) => ({
    sessionId: input.sessionId,
    policyDecisionId: input.policyDecisionId,
    variantSetId: input.variantSetId,
    variantArmId,
    slot: slotForSlotKey(slotKey),
    isControlHoldout: input.isControlHoldout,
    holdoutResolutionLevel: input.holdoutResolutionLevel,
    orgContextVerified: input.orgContextVerified,
    surface: input.surface,
    localeKey: input.localeKey,
    hostKey: input.hostKey,
    organizationId: input.organizationId,
    relationshipBucket: input.relationshipBucket,
    referralSource: input.referralSource,
    device: input.device,
    chainDepth: input.chainDepth,
    returningVsFirst: input.returningVsFirst,
    referredByUserId: input.referredByUserId,
    shareAttemptId: input.shareAttemptId,
  }));

  if (rows.length === 0) return;
  await prisma.reasoningVariantExposure.createMany({
    data: rows,
  });
}

async function loadSignatureCount(): Promise<number> {
  const rows = await prisma.reasoningOutcomeRecord.findMany({
    where: { outcomeKind: "VOTE" },
    select: { sessionId: true },
    distinct: ["sessionId"],
  });
  return rows.length;
}

function detectDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobi") || ua.includes("android")) return "mobile";
  return "desktop";
}

function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return "";
  return rawHost.toLowerCase().replace(/:\d+$/, "").trim();
}
