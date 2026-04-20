/**
 * Shared types for the /reasoning autonomous persuasion optimizer.
 *
 * Runtime-safe: no Prisma imports, no server-only dependencies.
 * These types cross the client/server boundary freely.
 */

import type { ParameterName } from "@optimitron/data/parameters";

export type NodeId = string;

export type ChainDepth = "90s" | "deep";

export type ReturningVsFirst = "returning" | "first";

export type RelationshipBucket =
  | "family-partner"
  | "close-friend"
  | "professional"
  | "weak-tie";

export type VariantSlot =
  | "HANDOFF"
  | "CHAIN_NODE"
  | "OBJECTION_NODE"
  | "INEVITABILITY"
  | "REPLICATION_CTA"
  | "DEEP_CHAIN_NODE"
  | "TOPOLOGY";

export type VariantFamily =
  | "DRY_DATA"
  | "EMOTIONAL_APPEAL"
  | "CURIOSITY_MYSTERY"
  | "SOCIAL_PROOF"
  | "SELF_INTEREST_ROI"
  | "MORAL_DUTY"
  | "ABSURDIST_COMEDY"
  | "DIRECT_IMPERATIVE";

export type RiskTier = "T1" | "T2" | "T3";

export type VariantStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "RETIRED" | "FROZEN";

export type GeneratorKind = "HUMAN" | "AI" | "SYSTEM";

export type BanditLevel =
  | "GLOBAL"
  | "LOCALE"
  | "HOST"
  | "ORG"
  | "BUCKET"
  | "SEGMENT";

export type Surface =
  | "hosted"
  | "embed"
  | "direct-share"
  | "system-generated-share";

export type OutcomeKind =
  | "SURVEY_STARTED"
  | "HANDOFF_CLICKED"
  | "NODE_ADVANCED"
  | "NODE_EXITED"
  | "OBJECTION_SHOWN"
  | "OBJECTION_RESOLVED"
  | "PROBABILITY_CHANGED"
  | "VOTE"
  | "FIRST_SEND_INITIATED"
  | "FIRST_SEND_CONFIRMED"
  | "DOWNSTREAM_VOTE"
  | "DOWNSTREAM_SEND"
  | "WALK_AWAY";

export type VariantArmSelectionMap = Record<string, string>;

/**
 * A citation attached to a claim or rebuttal. Resolves `paramName` to a live
 * Parameter at render time (keeps this module runtime-safe — no import-time
 * Parameter coupling).
 */
export type Source = {
  label: string;
  url?: string;
  /** Name of a Parameter in `@optimitron/data/parameters`; resolved at render. */
  paramName?: ParameterName;
  /** Anchor on manual.WarOnDisease.org. */
  manualChapter?: string;
  /** Anchor in docs/h2ewd.md. */
  h2ewdSection?: string;
  /** Tags this source as a critical-view / steelman. Anti-cult UX signal. */
  adversarial?: boolean;
};

/**
 * Full context the client holds per session. Persisted in localStorage,
 * mirrored in URL where resumable.
 */
export type ReasoningState = {
  sessionId: string;
  currentNodeId: NodeId;
  chainDepth: ChainDepth;
  claimAnswers: Record<NodeId, "yes" | "no">;
  claimProbabilities: Record<NodeId, number>;
  conversionP: number;
  firstSendConfirmed: boolean;
  sendCount: number;
  startedAt: string;
  // attribution
  policyDecisionId: string;
  variantSetId: string;
  variantArmIds: VariantArmSelectionMap;
  organizationId: string | null;
  orgContextVerified: boolean;
  orgContextToken: string | null;
  surface: Surface;
  localeKey: string;
  hostKey: string;
  device: string | null;
  returningVsFirst: ReturningVsFirst;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  referredByUserId: string | null;
  shareAttemptId: string | null;
  isControlHoldout: boolean;
  holdoutResolutionLevel: BanditLevel | null;
  audienceTag: string | null;
};

/**
 * Context passed to every analytics event. Kept tight so call sites don't
 * reassemble it — `ReasoningFlow` resolves it once and threads through.
 */
export type TelemetryContext = {
  sessionId: string;
  policyDecisionId: string;
  variantSetId: string;
  variantArmIds: VariantArmSelectionMap;
  organizationId: string | null;
  hostKey: string;
  localeKey: string;
  surface: Surface;
  device: string | null;
  returningVsFirst: ReturningVsFirst;
  audienceTag: string | null;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  referredByUserId: string | null;
  shareAttemptId: string | null;
  chainDepth: ChainDepth;
  isControlHoldout: boolean;
  holdoutResolutionLevel: BanditLevel | null;
};
