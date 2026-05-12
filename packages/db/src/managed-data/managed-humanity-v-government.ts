import { CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA } from "@optimitron/data/parameters";
import {
  HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL,
  HUMANITY_V_GOVERNMENT_VERDICT_QUESTION,
  HUMANITY_V_GOVERNMENT_VERDICT_TEXT,
} from "@optimitron/data/referendums";
import {
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
} from "../constants.js";
import {
  CourtCaseStatus,
  ReferendumKind,
  ReferendumStatus,
  type Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";

export {
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
};

export { HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL };

export const MANAGED_HUMANITY_V_GOVERNMENT_VERDICT = {
  slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  title: "Humanity v Government verdict",
  question: HUMANITY_V_GOVERNMENT_VERDICT_QUESTION,
  kind: ReferendumKind.COURT_CASE,
  description:
    "The public jury vote for Humanity v Government. Yes means find for Humanity and record the full per-person damages demand.",
  bodyMarkdown: HUMANITY_V_GOVERNMENT_VERDICT_TEXT.markdown,
  status: ReferendumStatus.ACTIVE,
} as const;

export const MANAGED_HUMANITY_V_GOVERNMENT_CASE = {
  slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
  title: "Humanity v Government",
  summary:
    "A Court of Humanity damages case alleging that governments spent public money on war, delayed medicine, and underfunded clinical trials while preventable disease kept killing people.",
  status: CourtCaseStatus.VOTING,
  isPublic: true,
  juryReferendumSlug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
} as const;

export function getManagedHumanityVGovernmentMetadata(): Prisma.InputJsonValue {
  return {
    managedDataKey: "humanity-v-government",
    fullDamagesPerCapitaUsd:
      CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA.value,
    fullDamagesPerCapitaLabel:
      HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL,
  };
}

export async function syncManagedHumanityVGovernmentCase(
  prisma: PrismaClient,
  options: { apply: boolean; createdByUserId?: string },
): Promise<{ totalRecords: number; upserted: string[]; unchanged: string[] }> {
  const record = MANAGED_HUMANITY_V_GOVERNMENT_CASE;
  const referendum = await prisma.referendum.findUnique({
    where: { slug: record.juryReferendumSlug },
    select: { id: true },
  });

  const existing = await prisma.courtCase.findUnique({
    where: { slug: record.slug },
    select: {
      deletedAt: true,
      isPublic: true,
      juryReferendumId: true,
      slug: true,
      status: true,
      summary: true,
      title: true,
    },
  });

  const unchanged =
    existing &&
    !existing.deletedAt &&
    existing.title === record.title &&
    existing.summary === record.summary &&
    existing.status === record.status &&
    existing.isPublic === record.isPublic &&
    (!referendum || existing.juryReferendumId === referendum.id);

  if (unchanged) {
    return { totalRecords: 1, upserted: [], unchanged: [record.slug] };
  }

  if (!options.apply) {
    return { totalRecords: 1, upserted: [record.slug], unchanged: [] };
  }

  if (!referendum) {
    throw new Error(
      `Managed verdict referendum missing: ${record.juryReferendumSlug}`,
    );
  }

  const data = {
    deletedAt: null,
    isPublic: record.isPublic,
    juryReferendumId: referendum.id,
    metadataJson: getManagedHumanityVGovernmentMetadata(),
    slug: record.slug,
    status: record.status,
    summary: record.summary,
    title: record.title,
  };

  await prisma.courtCase.upsert({
    where: { slug: record.slug },
    update: data,
    create: {
      ...data,
      createdByUserId: options.createdByUserId,
    },
  });

  return { totalRecords: 1, upserted: [record.slug], unchanged: [] };
}

export function formatManagedHumanityVGovernmentCaseResult(result: {
  totalRecords: number;
  upserted: string[];
  unchanged: string[];
}): string {
  const parts = [
    `Humanity v Government case: ${result.upserted.length}/${result.totalRecords} upserted`,
  ];
  if (result.unchanged.length) parts.push(`${result.unchanged.length} unchanged`);
  return parts.join(", ");
}
