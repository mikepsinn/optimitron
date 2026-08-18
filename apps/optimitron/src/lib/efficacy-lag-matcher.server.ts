import {
  EfficacyLagEvidenceStatus,
  PersonConditionStatus,
  type Prisma,
} from "@optimitron/db";

type MatcherClient = Pick<
  Prisma.TransactionClient,
  | "personMemorial"
  | "personCondition"
  | "interventionApprovalTimeline"
  | "personEfficacyLagEvidence"
>;

export interface EfficacyLagMatch {
  approvalDate: Date;
  approvalDescription: string | null;
  brandName: string | null;
  daysBeforeApproval: number;
  efficacyLagDays: number | null;
  estimatedDeathsDuringLag: number | null;
  explanation: string;
  firstEvidenceDate: Date;
  interventionName: string;
  timelineId: string;
}

const ONE_DAY = 1000 * 60 * 60 * 24;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(days: number): string {
  const absDays = Math.abs(days);
  if (absDays >= 365) {
    const years = Math.round((absDays / 365) * 10) / 10;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  if (absDays >= 60) {
    const months = Math.round(absDays / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  return `${absDays} day${absDays === 1 ? "" : "s"}`;
}

/**
 * For a given memorial, find every InterventionApprovalTimeline whose approval
 * window covered the person's death date and whose condition matches one of
 * the memorial's CAUSE_OF_DEATH conditions. Writes one
 * PersonEfficacyLagEvidence row per match (idempotent on the unique index
 * (memorialId, interventionApprovalTimelineId)) and returns a summary array
 * for the API response. PRD: TODO.md:1252-1294.
 */
export async function matchEfficacyLagForMemorial(
  tx: MatcherClient,
  memorialId: string,
): Promise<EfficacyLagMatch[]> {
  const memorial = await tx.personMemorial.findUnique({
    where: { id: memorialId },
    select: {
      id: true,
      person: {
        select: {
          deathDate: true,
          displayName: true,
        },
      },
    },
  });
  if (!memorial?.person?.deathDate) return [];
  const deathDate = memorial.person.deathDate;

  // Pull the cause-of-death conditions for the memorialized person.
  const memorialPersonConditions = await tx.personCondition.findMany({
    where: {
      deletedAt: null,
      person: { memorial: { id: memorialId } },
      status: PersonConditionStatus.CAUSE_OF_DEATH,
    },
    select: {
      conditionName: true,
      globalVariableId: true,
      id: true,
    },
  });
  if (memorialPersonConditions.length === 0) return [];

  const conditionGlobalVariableIds = memorialPersonConditions
    .map((c) => c.globalVariableId)
    .filter((id): id is string => id !== null);
  const conditionNames = memorialPersonConditions
    .map((c) => c.conditionName.trim())
    .filter((name) => name.length > 0);

  // Find timelines where (a) death falls in the approval window AND (b) the
  // condition matches either by canonical FK or by name contains.
  const candidateTimelines = await tx.interventionApprovalTimeline.findMany({
    where: {
      deletedAt: null,
      firstEvidenceDate: { lte: deathDate },
      approvalDate: { gte: deathDate },
      OR: [
        ...(conditionGlobalVariableIds.length > 0
          ? [{ conditionGlobalVariableId: { in: conditionGlobalVariableIds } }]
          : []),
        ...conditionNames.map((name) => ({
          conditionName: { contains: name, mode: "insensitive" as const },
        })),
      ],
    },
    select: {
      id: true,
      interventionName: true,
      brandName: true,
      conditionName: true,
      conditionGlobalVariableId: true,
      firstEvidenceDate: true,
      approvalDate: true,
      approvalDescription: true,
      efficacyLagDays: true,
      estimatedDeathsDuringLag: true,
    },
  });

  const matches: EfficacyLagMatch[] = [];
  for (const timeline of candidateTimelines) {
    if (!timeline.firstEvidenceDate || !timeline.approvalDate) continue;

    // Pick the personCondition that backs this match (FK preferred, else name).
    const matchingCondition =
      memorialPersonConditions.find(
        (c) => c.globalVariableId && c.globalVariableId === timeline.conditionGlobalVariableId,
      ) ??
      memorialPersonConditions.find((c) =>
        timeline.conditionName.toLowerCase().includes(c.conditionName.toLowerCase()),
      ) ??
      memorialPersonConditions[0]!;

    const confidenceScore =
      matchingCondition.globalVariableId &&
      matchingCondition.globalVariableId === timeline.conditionGlobalVariableId
        ? 1
        : 0.6;

    const daysBeforeApproval = Math.round(
      (timeline.approvalDate.getTime() - deathDate.getTime()) / ONE_DAY,
    );

    const personDisplayName = memorial.person.displayName || "They";
    const drugLabel = timeline.brandName
      ? `${timeline.interventionName} (${timeline.brandName})`
      : timeline.interventionName;
    const conditionLabel = matchingCondition.conditionName || timeline.conditionName;
    const lagText = timeline.efficacyLagDays
      ? formatDuration(timeline.efficacyLagDays)
      : formatDuration(
          Math.round(
            (timeline.approvalDate.getTime() - timeline.firstEvidenceDate.getTime()) / ONE_DAY,
          ),
        );
    const beforeApprovalText = formatDuration(daysBeforeApproval);
    const estimatedDeathsText =
      typeof timeline.estimatedDeathsDuringLag === "number" &&
      timeline.estimatedDeathsDuringLag >= 1
        ? `an estimated ${Math.round(timeline.estimatedDeathsDuringLag).toLocaleString()} people`
        : "many people";

    // PRD TODO.md:1292 — Wishonia voice, hardcoded copy.
    const explanation = [
      `${personDisplayName} died of ${conditionLabel} on ${formatDate(deathDate)}.`,
      `${drugLabel} was approved for ${conditionLabel} on ${formatDate(timeline.approvalDate)}, ${lagText} after evidence showed it worked.`,
      `${personDisplayName} died ${beforeApprovalText} before it became available.`,
      `They are one of ${estimatedDeathsText} who died during this delay.`,
      `This record has been flagged as efficacy lag evidence.`,
    ].join(" ");

    await tx.personEfficacyLagEvidence.upsert({
      where: {
        memorialId_interventionApprovalTimelineId: {
          interventionApprovalTimelineId: timeline.id,
          memorialId,
        },
      },
      update: {
        confidenceScore,
        diedBeforeApprovalDays: daysBeforeApproval,
        explanation,
        personConditionId: matchingCondition.id,
        status: EfficacyLagEvidenceStatus.CANDIDATE,
      },
      create: {
        confidenceScore,
        diedBeforeApprovalDays: daysBeforeApproval,
        explanation,
        interventionApprovalTimelineId: timeline.id,
        memorialId,
        personConditionId: matchingCondition.id,
        status: EfficacyLagEvidenceStatus.CANDIDATE,
      },
    });

    matches.push({
      approvalDate: timeline.approvalDate,
      approvalDescription: timeline.approvalDescription,
      brandName: timeline.brandName,
      daysBeforeApproval,
      efficacyLagDays: timeline.efficacyLagDays,
      estimatedDeathsDuringLag: timeline.estimatedDeathsDuringLag,
      explanation,
      firstEvidenceDate: timeline.firstEvidenceDate,
      interventionName: timeline.interventionName,
      timelineId: timeline.id,
    });
  }

  return matches;
}
