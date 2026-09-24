import {
  CourtCaseItemStatus,
  FAMOUS_DISEASE_DEATH_EVIDENCE_TYPE,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface FamousDiseaseDeathCard {
  conditionName: string;
  deathYear: number | null;
  displayName: string;
  id: string;
  sourceUrl: string | null;
}

/**
 * Famous disease deaths attached to Humanity v Government as case evidence.
 * They are evidence of harm to the class, not registered plaintiffs.
 */
export async function getFamousDiseaseDeaths(): Promise<
  FamousDiseaseDeathCard[]
> {
  const rows = await prisma.courtCaseEvidence.findMany({
    where: {
      case: {
        deletedAt: null,
        isPublic: true,
        slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
      },
      deletedAt: null,
      evidenceType: FAMOUS_DISEASE_DEATH_EVIDENCE_TYPE,
      isPublic: true,
      personMemorial: { deletedAt: null, isPublic: true },
      reviewStatus: CourtCaseItemStatus.ACCEPTED,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      metadataJson: true,
      sourceUrl: true,
      personMemorial: {
        select: {
          person: { select: { deathDate: true, displayName: true } },
        },
      },
    },
  });

  return rows.flatMap((row) => {
    const person = row.personMemorial?.person;
    if (!person) return [];
    const conditionName = readConditionName(row.metadataJson);
    if (!conditionName) return [];
    return [
      {
        conditionName,
        deathYear: person.deathDate?.getUTCFullYear() ?? null,
        displayName: person.displayName,
        id: row.id,
        sourceUrl: row.sourceUrl,
      },
    ];
  });
}

function readConditionName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as { conditionName?: unknown }).conditionName;
  return typeof value === "string" && value.trim() ? value : null;
}
