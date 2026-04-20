/**
 * Typed content schemas per VariantSlot.
 *
 * `VariantArm.content` is JSON in the DB. Each slot has its own typed
 * shape enforced at write time via Zod, and at render time via TS types.
 *
 * Keeping per-slot schemas here (not in call-script.ts) lets the
 * Validator and render layer share one source of truth for content shape.
 */

import { z } from "zod";
import type { ParameterName } from "@optimitron/data/parameters";
import { isKnownParameterName } from "./parameter-tokens";
import type { RelationshipBucket, VariantSlot } from "./types";

/* ================================================================
 * Shared sub-schemas
 * ================================================================ */

export const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  paramName: z
    .custom<ParameterName>(
      (value) => typeof value === "string" && isKnownParameterName(value),
      "Unknown parameter name",
    )
    .optional(),
  manualChapter: z.string().optional(),
  h2ewdSection: z.string().optional(),
  adversarial: z.boolean().optional(),
});

export type SourceContent = z.infer<typeof sourceSchema>;

/* ================================================================
 * HANDOFF slot — outbound relationship-tuned message
 * ================================================================ */

export const handoffBucketSchema = z.enum([
  "family-partner",
  "close-friend",
  "professional",
  "weak-tie",
]);

export const handoffChannelSchema = z.enum([
  "sms",
  "email",
  "whatsapp",
  "slack",
  "twitter",
  "telegram",
]);

export const handoffContentSchema = z.object({
  bucket: handoffBucketSchema,
  channel: handoffChannelSchema,
  /** Body with `{url}` placeholder — rendered with the actual URL at compose time. */
  template: z.string().min(1),
  /** Length ceiling; SMS ≤ 160, email/slack/whatsapp/telegram higher. */
  maxLen: z.number().int().positive(),
});

export type HandoffContent = z.infer<typeof handoffContentSchema>;

/* ================================================================
 * CHAIN_NODE slot — a claim's headline + body copy
 * ================================================================ */

export const chainNodeContentSchema = z.object({
  nodeId: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  /** Optional distinct copy rendered only on untagged cold landings. */
  coldOpenerBody: z.string().optional(),
  sources: z.array(sourceSchema).default([]),
});

export type ChainNodeContent = z.infer<typeof chainNodeContentSchema>;

/* ================================================================
 * OBJECTION_NODE slot — steelman + rebuttal + sources
 * ================================================================ */

export const objectionNodeContentSchema = z.object({
  nodeId: z.string().min(1),
  /** Charitable framing of the listener's No — must precede the rebuttal. */
  steelman: z.string().min(1),
  rebuttal: z.string().min(1),
  sources: z.array(sourceSchema).default([]),
  reAnswerCta: z.string().default("OK, re-answer"),
  stillDisagreeCta: z.string().default("I still disagree"),
});

export type ObjectionNodeContent = z.infer<typeof objectionNodeContentSchema>;

/* ================================================================
 * INEVITABILITY slot — the recap node's closing copy
 * ================================================================ */

export const inevitabilityContentSchema = z.object({
  body: z.string().min(1),
  /** Copy on the "which premise do you reject?" selector. */
  rejectSelectorLabel: z.string().default("Which premise do you reject?"),
  /** Copy on the "proceed" button. */
  proceedCtaLabel: z.string().default("None, proceed"),
});

export type InevitabilityContent = z.infer<typeof inevitabilityContentSchema>;

/* ================================================================
 * REPLICATION_CTA slot — the post-vote send screen
 * ================================================================ */

export const replicationCtaContentSchema = z.object({
  primaryCta: z.string().min(1),
  secondaryCta: z.string().min(1),
  urgencyCopy: z.string().min(1),
  expansionCopy: z.string().min(1),
  buckets: z.array(handoffBucketSchema).min(1),
});

export type ReplicationCtaContent = z.infer<typeof replicationCtaContentSchema>;

/* ================================================================
 * DEEP_CHAIN_NODE slot — expanded-chain copy for the 5-7min deep version
 * ================================================================ */

export const deepChainNodeContentSchema = z.object({
  nodeId: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  expandedRebuttal: z.string().optional(),
  adversarialCitations: z.array(sourceSchema).default([]),
  sources: z.array(sourceSchema).default([]),
});

export type DeepChainNodeContent = z.infer<typeof deepChainNodeContentSchema>;

/* ================================================================
 * TOPOLOGY slot — constrained grammar patches
 * ================================================================ */

export const topologyContentSchema = z.object({
  description: z.string().min(1),
  /** JSON-patchable grammar ops within the allowed grammar. */
  grammarPatch: z.record(z.unknown()),
});

export type TopologyContent = z.infer<typeof topologyContentSchema>;

/* ================================================================
 * Dispatch: slot → schema + inferred type
 * ================================================================ */

export const contentSchemaBySlot = {
  HANDOFF: handoffContentSchema,
  CHAIN_NODE: chainNodeContentSchema,
  OBJECTION_NODE: objectionNodeContentSchema,
  INEVITABILITY: inevitabilityContentSchema,
  REPLICATION_CTA: replicationCtaContentSchema,
  DEEP_CHAIN_NODE: deepChainNodeContentSchema,
  TOPOLOGY: topologyContentSchema,
} as const satisfies Record<VariantSlot, z.ZodTypeAny>;

export type ArmContentBySlot = {
  HANDOFF: HandoffContent;
  CHAIN_NODE: ChainNodeContent;
  OBJECTION_NODE: ObjectionNodeContent;
  INEVITABILITY: InevitabilityContent;
  REPLICATION_CTA: ReplicationCtaContent;
  DEEP_CHAIN_NODE: DeepChainNodeContent;
  TOPOLOGY: TopologyContent;
};

export function parseArmContent<S extends VariantSlot>(
  slot: S,
  content: unknown,
): ArmContentBySlot[S] {
  const schema = contentSchemaBySlot[slot];
  return schema.parse(content) as ArmContentBySlot[S];
}

export function safeParseArmContent<S extends VariantSlot>(
  slot: S,
  content: unknown,
): { success: true; data: ArmContentBySlot[S] } | { success: false; issues: string[] } {
  const schema = contentSchemaBySlot[slot];
  const result = schema.safeParse(content);
  if (result.success) {
    return { success: true, data: result.data as ArmContentBySlot[S] };
  }
  return {
    success: false,
    issues: result.error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
    ),
  };
}

/* ================================================================
 * Handoff-template channel length ceilings
 * ================================================================ */

export const HANDOFF_CHANNEL_MAX_LEN: Record<
  z.infer<typeof handoffChannelSchema>,
  number
> = {
  sms: 160,
  whatsapp: 600,
  telegram: 600,
  slack: 800,
  twitter: 280,
  email: 2000,
};

export type HandoffBucket = RelationshipBucket;
