/**
 * Fraud + quality detection.
 *
 * Pure functions + thin DB adapters. Each `detect*` returns a finding
 * with severity ∈ [0, 1]; Evaluator subtracts the sum as penalty.
 */

import { prisma } from "@/lib/prisma";

export type DedupFinding = {
  kind: "dedup";
  severity: number;
  matchCount: number;
};

export type VelocityFinding = {
  kind: "velocity";
  severity: number;
  eventsPerHour: number;
};

export type CycleFinding = {
  kind: "cycle";
  severity: number;
  cycleDepth: number;
};

export type SessionFinding = {
  kind: "session-multivote";
  severity: number;
  accountCount: number;
};

export type PatternFinding = {
  kind: "pattern-match";
  severity: number;
  patternId: string;
  action: string;
};

export type FraudFinding =
  | DedupFinding
  | VelocityFinding
  | CycleFinding
  | SessionFinding
  | PatternFinding;

/* ================================================================
 * Dedup — same email/phone/IP hash produces >N signatures
 * ================================================================ */

export async function detectDedup(params: {
  emailHash: string | null;
  phoneHash: string | null;
  ipHash: string | null;
  windowStart: Date;
  threshold?: number;
}): Promise<DedupFinding | null> {
  const threshold = params.threshold ?? 3;
  const hashes = [params.emailHash, params.phoneHash, params.ipHash].filter(
    (h): h is string => Boolean(h),
  );
  if (hashes.length === 0) return null;

  // Count FraudFinding rows in the window where details contain any of these hashes.
  // (Actual hash storage + index strategy is set up in the write path.)
  const matchCount = await prisma.reasoningFraudFinding.count({
    where: {
      findingKind: "dedup-candidate",
      detectedAt: { gte: params.windowStart },
      OR: hashes.map((h) => ({
        details: { path: ["hash"], equals: h } as Record<string, unknown>,
      })),
    },
  });

  if (matchCount < threshold) return null;

  return {
    kind: "dedup",
    severity: Math.min(1, matchCount / 10),
    matchCount,
  };
}

/* ================================================================
 * Velocity — user referring > K verified votes per hour
 * ================================================================ */

export async function detectVelocityAnomaly(params: {
  userId: string;
  windowHours: number;
  ceilingPerHour?: number;
}): Promise<VelocityFinding | null> {
  const ceilingPerHour = params.ceilingPerHour ?? 10;
  const windowStart = new Date(Date.now() - params.windowHours * 3600 * 1000);
  const eventCount = await prisma.reasoningOutcomeRecord.count({
    where: {
      referredByUserId: params.userId,
      outcomeKind: "DOWNSTREAM_VOTE",
      recordedAt: { gte: windowStart },
    },
  });
  const eventsPerHour = eventCount / Math.max(1, params.windowHours);
  if (eventsPerHour < ceilingPerHour) return null;
  return {
    kind: "velocity",
    severity: Math.min(1, eventsPerHour / (ceilingPerHour * 5)),
    eventsPerHour,
  };
}

/* ================================================================
 * Referral graph cycle — A refers B refers A (any cycle ≤ maxDepth)
 * ================================================================ */

export async function detectReferralCycle(params: {
  userId: string;
  maxDepth: number;
}): Promise<CycleFinding | null> {
  let current = params.userId;
  const seen = new Set<string>([current]);
  for (let depth = 1; depth <= params.maxDepth; depth++) {
    const refs = await prisma.reasoningOutcomeRecord.findMany({
      where: { userId: current, outcomeKind: "VOTE" },
      take: 1,
      orderBy: { recordedAt: "desc" },
      select: { referredByUserId: true },
    });
    const next = refs[0]?.referredByUserId ?? null;
    if (!next) return null;
    if (seen.has(next)) {
      return {
        kind: "cycle",
        severity: 1.0,
        cycleDepth: depth,
      };
    }
    seen.add(next);
    current = next;
  }
  return null;
}

/* ================================================================
 * Session multi-vote — one browser session → multiple accounts + votes
 * ================================================================ */

export async function detectSessionMultivote(params: {
  sessionId: string;
}): Promise<SessionFinding | null> {
  const rows = await prisma.reasoningOutcomeRecord.findMany({
    where: { sessionId: params.sessionId, outcomeKind: "VOTE" },
    select: { userId: true },
  });
  const accountIds = new Set(rows.map((r) => r.userId).filter(Boolean) as string[]);
  if (accountIds.size < 2) return null;
  return {
    kind: "session-multivote",
    severity: Math.min(1, accountIds.size / 5),
    accountCount: accountIds.size,
  };
}

/* ================================================================
 * Explicit FraudPattern match (admin-managed table)
 * ================================================================ */

export async function matchFraudPatterns(params: {
  exposureText: string;
}): Promise<PatternFinding[]> {
  const patterns = await prisma.reasoningFraudPattern.findMany({
    where: { approved: true },
  });
  const findings: PatternFinding[] = [];
  for (const p of patterns) {
    if (p.patternKind === "regex") {
      const patternObj = p.pattern as { pattern?: string };
      if (!patternObj?.pattern) continue;
      try {
        const re = new RegExp(patternObj.pattern, "i");
        if (re.test(params.exposureText)) {
          findings.push({
            kind: "pattern-match",
            severity: 1.0,
            patternId: p.id,
            action: p.action,
          });
        }
      } catch {
        // ignore malformed regex — defense in depth
      }
    }
  }
  return findings;
}

/* ================================================================
 * Sum-up helper used by Evaluator
 * ================================================================ */

export function sumFraudPenalty(findings: readonly FraudFinding[]): number {
  let sum = 0;
  for (const f of findings) {
    sum += Math.max(0, Math.min(1, f.severity));
  }
  return sum;
}
