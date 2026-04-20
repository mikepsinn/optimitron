/**
 * DiversityGuard — anti-style-collapse.
 *
 * Monitors Shannon entropy of active-arm family distribution per slot ×
 * segment. Writes DiversitySnapshot rows; enforces last-viable-family
 * floor when Promoter attempts retirements.
 */

import { prisma } from "@/lib/prisma";
import type { VariantSlot, VariantFamily } from "./types";

export type DiversityConfig = {
  minFamiliesPerSlot: number;
  diversityMinThreshold: number;
};

export const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  minFamiliesPerSlot: 3,
  diversityMinThreshold: Math.log(2), // ≈ 0.69
};

export type DiversitySnapshot = {
  slot: VariantSlot;
  segmentKey: string;
  familyDistribution: Record<string, number>;
  shannonEntropy: number;
  activeFamilyCount: number;
  alertLevel: "OK" | "LOW_ENTROPY" | "BELOW_MIN_FAMILIES";
};

/**
 * Take a diversity snapshot per slot (global segment only for v1; extend
 * to per-segment when outcome volumes justify).
 */
export async function takeDiversitySnapshot(
  config: DiversityConfig = DEFAULT_DIVERSITY_CONFIG,
): Promise<DiversitySnapshot[]> {
  const slots: VariantSlot[] = [
    "HANDOFF",
    "CHAIN_NODE",
    "OBJECTION_NODE",
    "INEVITABILITY",
    "REPLICATION_CTA",
    "DEEP_CHAIN_NODE",
  ];

  const out: DiversitySnapshot[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  for (const slot of slots) {
    const exposures = await prisma.reasoningVariantExposure.findMany({
      where: { slot, exposedAt: { gte: sevenDaysAgo }, variantArmId: { not: null } },
      select: { variantArmId: true },
    });
    if (exposures.length === 0) continue;
    const armIds = Array.from(
      new Set(exposures.map((e) => e.variantArmId).filter((id): id is string => Boolean(id))),
    );
    const arms = await prisma.reasoningVariantArm.findMany({
      where: { id: { in: armIds } },
      select: { id: true, family: true, status: true },
    });
    const armFamily = new Map(arms.map((a) => [a.id, a.family]));
    const distribution: Record<string, number> = {};
    for (const e of exposures) {
      const fam = e.variantArmId ? armFamily.get(e.variantArmId) : null;
      if (!fam) continue;
      distribution[fam] = (distribution[fam] ?? 0) + 1;
    }
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    let entropy = 0;
    for (const count of Object.values(distribution)) {
      if (count <= 0) continue;
      const p = count / total;
      entropy -= p * Math.log(p);
    }
    const activeFamilyCount = arms.filter((a) => a.status === "ACTIVE")
      .reduce<Set<VariantFamily>>((set, a) => set.add(a.family as VariantFamily), new Set()).size;
    let alertLevel: DiversitySnapshot["alertLevel"] = "OK";
    if (activeFamilyCount < config.minFamiliesPerSlot) alertLevel = "BELOW_MIN_FAMILIES";
    else if (entropy < config.diversityMinThreshold) alertLevel = "LOW_ENTROPY";
    const snap: DiversitySnapshot = {
      slot,
      segmentKey: "GLOBAL",
      familyDistribution: distribution,
      shannonEntropy: entropy,
      activeFamilyCount,
      alertLevel,
    };
    await prisma.reasoningDiversitySnapshot.create({
      data: {
        slot: snap.slot,
        segmentKey: snap.segmentKey,
        familyDistribution: snap.familyDistribution,
        shannonEntropy: snap.shannonEntropy,
        activeFamilyCount: snap.activeFamilyCount,
        alertLevel: snap.alertLevel,
      },
    });
    out.push(snap);
  }

  return out;
}
