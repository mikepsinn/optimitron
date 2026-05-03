import {
  PersonCivilianStatus,
  PersonConditionStatus,
  PersonDeathCauseCategory,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface MemorialAttributionSummary {
  /** Total memorial deaths attributed to this government (unique persons). */
  memorialDeaths: number;
  /** Memorials with at least one PersonEfficacyLagEvidence row. */
  efficacyLagDeaths: number;
  /** Conflict civilian deaths (ARMED_CONFLICT/STATE_VIOLENCE + civilianStatus=CIVILIAN). */
  conflictCivilianDeaths: number;
}

const ZERO: MemorialAttributionSummary = {
  memorialDeaths: 0,
  efficacyLagDeaths: 0,
  conflictCivilianDeaths: 0,
};

const CONFLICT_CAUSES: PersonDeathCauseCategory[] = [
  PersonDeathCauseCategory.ARMED_CONFLICT,
  PersonDeathCauseCategory.STATE_VIOLENCE,
  PersonDeathCauseCategory.TERRORISM,
];

/**
 * Per-government memorial attribution summary, keyed by ISO country code.
 *
 * A memorial counts toward a government if either:
 *   1. `PersonMemorial.deathCountryCode` matches the country, or
 *   2. A `PersonMemorialResponsibleParty` row attributes to the government's
 *      `Jurisdiction` row.
 *
 * Returns counts of unique memorials per government.
 */
export async function getMemorialAttributionsByGovernment(): Promise<
  Record<string, MemorialAttributionSummary>
> {
  // Pull every public memorial with the data we need to attribute it.
  const memorials = await prisma.personMemorial.findMany({
    where: { deletedAt: null, isPublic: true },
    select: {
      causeCategory: true,
      civilianStatus: true,
      deathCountryCode: true,
      id: true,
      efficacyLagEvidence: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
      responsibleParties: {
        where: { deletedAt: null },
        select: { jurisdiction: { select: { code: true } } },
      },
    },
  });

  const result: Record<string, MemorialAttributionSummary> = {};

  function ensure(code: string): MemorialAttributionSummary {
    if (!result[code]) result[code] = { ...ZERO };
    return result[code]!;
  }

  for (const memorial of memorials) {
    const attributedCodes = new Set<string>();
    if (memorial.deathCountryCode) attributedCodes.add(memorial.deathCountryCode);
    for (const party of memorial.responsibleParties) {
      if (party.jurisdiction?.code) attributedCodes.add(party.jurisdiction.code);
    }
    if (attributedCodes.size === 0) continue;

    const hasEfficacyLag = memorial.efficacyLagEvidence.length > 0;
    const isConflictCivilian =
      CONFLICT_CAUSES.includes(memorial.causeCategory) &&
      memorial.civilianStatus === PersonCivilianStatus.CIVILIAN;

    for (const code of attributedCodes) {
      const summary = ensure(code);
      summary.memorialDeaths += 1;
      if (hasEfficacyLag) summary.efficacyLagDeaths += 1;
      if (isConflictCivilian) summary.conflictCivilianDeaths += 1;
    }
  }

  return result;
}

export interface ConditionMemorialSummary {
  /** Memorials whose CAUSE_OF_DEATH PersonCondition links to this variable. */
  memorialCount: number;
  /** Of those, how many also have at least one efficacy-lag evidence row. */
  efficacyLagCount: number;
}

export async function getMemorialAttributionsForCondition(
  globalVariableId: string,
): Promise<ConditionMemorialSummary> {
  const memorials = await prisma.personMemorial.findMany({
    where: {
      deletedAt: null,
      isPublic: true,
      person: {
        deletedAt: null,
        conditions: {
          some: {
            deletedAt: null,
            globalVariableId,
            status: PersonConditionStatus.CAUSE_OF_DEATH,
          },
        },
      },
    },
    select: {
      id: true,
      efficacyLagEvidence: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  return {
    memorialCount: memorials.length,
    efficacyLagCount: memorials.filter((m) => m.efficacyLagEvidence.length > 0).length,
  };
}

/**
 * Detailed per-government breakdown for the /governments/[code] page. Pulls
 * the same data as the batch helper above but only for one country, and adds
 * the top conditions that caused efficacy-lag deaths attributed to it.
 */
export async function getMemorialAttributionsForGovernment(
  countryCode: string,
): Promise<MemorialAttributionSummary & {
  topEfficacyLagConditions: Array<{ conditionName: string; count: number }>;
  attributedMemorialIds: string[];
}> {
  const memorials = await prisma.personMemorial.findMany({
    where: {
      deletedAt: null,
      isPublic: true,
      OR: [
        { deathCountryCode: countryCode },
        {
          responsibleParties: {
            some: {
              deletedAt: null,
              jurisdiction: { code: countryCode },
            },
          },
        },
      ],
    },
    select: {
      causeCategory: true,
      civilianStatus: true,
      id: true,
      efficacyLagEvidence: {
        where: { deletedAt: null },
        select: {
          interventionApprovalTimeline: {
            select: { conditionName: true },
          },
        },
      },
    },
  });

  const conditionCounts = new Map<string, number>();
  let efficacyLagDeaths = 0;
  let conflictCivilianDeaths = 0;
  for (const memorial of memorials) {
    if (memorial.efficacyLagEvidence.length > 0) {
      efficacyLagDeaths += 1;
      for (const evidence of memorial.efficacyLagEvidence) {
        const name = evidence.interventionApprovalTimeline.conditionName;
        conditionCounts.set(name, (conditionCounts.get(name) ?? 0) + 1);
      }
    }
    if (
      CONFLICT_CAUSES.includes(memorial.causeCategory) &&
      memorial.civilianStatus === PersonCivilianStatus.CIVILIAN
    ) {
      conflictCivilianDeaths += 1;
    }
  }

  const topEfficacyLagConditions = Array.from(conditionCounts.entries())
    .map(([conditionName, count]) => ({ conditionName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    attributedMemorialIds: memorials.map((m) => m.id),
    conflictCivilianDeaths,
    efficacyLagDeaths,
    memorialDeaths: memorials.length,
    topEfficacyLagConditions,
  };
}
