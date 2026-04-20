/**
 * Generator — human + AI variant-arm authoring.
 *
 * Single write path for all new arms. Tracks full lineage (parentArmId,
 * generatorKind, generationRequestId, aiModel, aiPrompt). Validator is
 * run on every output — failed candidates are persisted with violations
 * but marked status=DRAFT + shadowGatePassed=false so Promoter won't launch.
 */

import { prisma } from "@/lib/prisma";
import { validateArm, VALIDATOR_VERSION } from "./validator";
import { computeNoveltyScore } from "./novelty.server";
import type { VariantFamily, VariantSlot } from "./types";
import type {
  VariantSlot as PrismaVariantSlot,
  VariantFamily as PrismaVariantFamily,
} from "@/lib/reasoning/types";

export type AuthorArmInput = {
  variantSetId: string;
  slot: VariantSlot;
  slotKey: string;
  channel?: string | null;
  localeKey: string;
  armKey: string;
  family: VariantFamily;
  content: unknown;
  riskTier?: "T1" | "T2" | "T3";
  parentArmId?: string | null;
  generatorKind?: "HUMAN" | "AI" | "SYSTEM";
  generationRequestId?: string | null;
  localeConfig?: { localeKey: string; bannedPhrases: string[] };
  blacklistPatterns?: string[];
  fraudLineageFlagged?: boolean;
};

export type AuthorArmResult = {
  armId: string;
  status: "DRAFT" | "ACTIVE";
  validatorPassed: boolean;
  violations: string[];
};

export async function authorArm(input: AuthorArmInput): Promise<AuthorArmResult> {
  const validation = validateArm({
    slot: input.slot,
    slotKey: input.slotKey,
    localeKey: input.localeKey,
    content: input.content,
    localeConfig: input.localeConfig,
    blacklistPatterns: input.blacklistPatterns,
    fraudLineageFlagged: input.fraudLineageFlagged,
  });

  const noveltyScore = await computeNoveltyForArm({
    variantSetId: input.variantSetId,
    slot: input.slot,
    slotKey: input.slotKey,
    family: input.family,
    content: input.content,
  });

  const created = await prisma.reasoningVariantArm.create({
    data: {
      variantSetId: input.variantSetId,
      slot: input.slot as PrismaVariantSlot,
      slotKey: input.slotKey,
      channel: input.channel ?? "default",
      localeKey: input.localeKey,
      armKey: input.armKey,
      family: input.family as PrismaVariantFamily,
      riskTier: input.riskTier ?? "T1",
      content: input.content as object,
      status: validation.pass ? "DRAFT" : "DRAFT",
      parentArmId: input.parentArmId ?? null,
      generatorKind: input.generatorKind ?? "HUMAN",
      generationRequestId: input.generationRequestId ?? null,
      noveltyScore,
      lastValidatedAt: new Date(),
      validatorVersion: VALIDATOR_VERSION,
      validatorViolations: validation.pass ? undefined : (validation.violations as unknown as object),
      shadowGatePassed: validation.pass ? null : false,
      fraudLineageFlagged: input.fraudLineageFlagged ?? false,
    },
  });

  return {
    armId: created.id,
    status: created.status as "DRAFT" | "ACTIVE",
    validatorPassed: validation.pass,
    violations: validation.violations,
  };
}

async function computeNoveltyForArm(params: {
  variantSetId: string;
  slot: VariantSlot;
  slotKey: string;
  family: VariantFamily;
  content: unknown;
}): Promise<number | null> {
  const existing = await prisma.reasoningVariantArm.findMany({
    where: {
      variantSetId: params.variantSetId,
      slot: params.slot as PrismaVariantSlot,
      slotKey: params.slotKey,
      family: params.family as PrismaVariantFamily,
      status: "ACTIVE",
    },
    select: { content: true },
    take: 20,
  });
  if (existing.length === 0) return null;
  const candidateText = JSON.stringify(params.content);
  const exemplarTexts = existing.map((e) => JSON.stringify(e.content));
  return computeNoveltyScore({ candidateText, exemplarTexts });
}
