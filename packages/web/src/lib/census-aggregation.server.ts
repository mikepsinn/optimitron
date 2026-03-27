import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import {
  HEALTH_VARIABLE_NAME,
  HAPPINESS_VARIABLE_NAME,
} from "@/lib/profile";

const logger = createLogger("census-aggregation");

/** Minimum number of users per jurisdiction to publish (basic k-anonymity). */
const MIN_K = 5;

export interface JurisdictionWelfareSummary {
  jurisdictionId: string;
  countryCode: string;
  regionCode: string | null;
  participantCount: number;
  verifiedParticipantCount: number;
  medianIncomeUsd: number | null;
  avgHealthRating: number | null;
  avgHappinessRating: number | null;
}

export interface CensusAggregationResult {
  jurisdictions: JurisdictionWelfareSummary[];
  totalParticipants: number;
  totalVerified: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Aggregate welfare metrics per jurisdiction from census profile data and
 * daily check-in measurements. Only includes jurisdictions with at least
 * MIN_K users for basic k-anonymity.
 */
export async function aggregateCensusData(): Promise<CensusAggregationResult> {
  // Fetch users with census data, grouped by country
  const [users, verifiedUserIds, recentMeasurements] = await Promise.all([
    prisma.user.findMany({
      where: {
        countryCode: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        countryCode: true,
        regionCode: true,
        annualHouseholdIncomeUsd: true,
      },
    }),
    prisma.personhoodVerification
      .findMany({
        where: { status: "VERIFIED", deletedAt: null },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows) => new Set(rows.map((r) => r.userId))),
    // Get last 30 days of health/happiness ratings
    prisma.measurement.findMany({
      where: {
        startTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        deletedAt: null,
        globalVariable: {
          name: { in: [HEALTH_VARIABLE_NAME, HAPPINESS_VARIABLE_NAME] },
        },
      },
      select: {
        userId: true,
        value: true,
        globalVariable: { select: { name: true } },
      },
    }),
  ]);

  // Build per-user measurement averages
  const userHealth = new Map<string, number[]>();
  const userHappiness = new Map<string, number[]>();
  for (const m of recentMeasurements) {
    const map =
      m.globalVariable.name === HEALTH_VARIABLE_NAME ? userHealth : userHappiness;
    const existing = map.get(m.userId) ?? [];
    existing.push(m.value);
    map.set(m.userId, existing);
  }

  // Group users by jurisdiction (countryCode, or countryCode+regionCode)
  const byJurisdiction = new Map<
    string,
    {
      countryCode: string;
      regionCode: string | null;
      incomes: number[];
      healthRatings: number[];
      happinessRatings: number[];
      total: number;
      verified: number;
    }
  >();

  for (const user of users) {
    if (!user.countryCode) continue;

    const key = user.regionCode
      ? `${user.countryCode}-${user.regionCode}`
      : user.countryCode;

    let group = byJurisdiction.get(key);
    if (!group) {
      group = {
        countryCode: user.countryCode,
        regionCode: user.regionCode,
        incomes: [],
        healthRatings: [],
        happinessRatings: [],
        total: 0,
        verified: 0,
      };
      byJurisdiction.set(key, group);
    }

    group.total++;
    if (verifiedUserIds.has(user.id)) group.verified++;
    if (user.annualHouseholdIncomeUsd != null) {
      group.incomes.push(user.annualHouseholdIncomeUsd);
    }

    const healthValues = userHealth.get(user.id);
    if (healthValues?.length) {
      const avg = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
      group.healthRatings.push(avg);
    }

    const happinessValues = userHappiness.get(user.id);
    if (happinessValues?.length) {
      const avg =
        happinessValues.reduce((a, b) => a + b, 0) / happinessValues.length;
      group.happinessRatings.push(avg);
    }
  }

  // Filter by k-anonymity and build results
  const jurisdictions: JurisdictionWelfareSummary[] = [];
  let totalParticipants = 0;
  let totalVerified = 0;

  for (const [key, group] of byJurisdiction) {
    if (group.total < MIN_K) {
      logger.info(
        `Skipping jurisdiction ${key}: ${group.total} users < ${MIN_K} minimum`,
      );
      continue;
    }

    totalParticipants += group.total;
    totalVerified += group.verified;

    jurisdictions.push({
      jurisdictionId: key.toLowerCase(),
      countryCode: group.countryCode,
      regionCode: group.regionCode,
      participantCount: group.total,
      verifiedParticipantCount: group.verified,
      medianIncomeUsd: median(group.incomes),
      avgHealthRating: group.healthRatings.length
        ? Number(
            (
              group.healthRatings.reduce((a, b) => a + b, 0) /
              group.healthRatings.length
            ).toFixed(2),
          )
        : null,
      avgHappinessRating: group.happinessRatings.length
        ? Number(
            (
              group.happinessRatings.reduce((a, b) => a + b, 0) /
              group.happinessRatings.length
            ).toFixed(2),
          )
        : null,
    });
  }

  return { jurisdictions, totalParticipants, totalVerified };
}
