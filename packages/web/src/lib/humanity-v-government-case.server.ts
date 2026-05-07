import { CourtCasePartyRole, CourtCaseStatus } from "@optimitron/db";
import type { Prisma } from "@optimitron/db";

export const HUMANITY_V_GOVERNMENT_CASE_SLUG = "humanity-v-government";
export const HUMANITY_V_GOVERNMENT_CASE_TITLE = "Humanity v Government";

type HumanityVGovernmentCaseClient = Pick<
  Prisma.TransactionClient,
  "courtCase" | "courtCaseParty"
>;

export async function ensureHumanityVGovernmentPlaintiffParty(
  tx: HumanityVGovernmentCaseClient,
  input: {
    createdByUserId: string;
    displayName: string;
    isPublic: boolean;
    subjectId: string;
  },
) {
  const courtCase = await tx.courtCase.upsert({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    update: {
      deletedAt: null,
      isPublic: true,
      title: HUMANITY_V_GOVERNMENT_CASE_TITLE,
    },
    create: {
      isPublic: true,
      slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
      status: CourtCaseStatus.OPEN,
      title: HUMANITY_V_GOVERNMENT_CASE_TITLE,
    },
    select: { id: true, slug: true },
  });

  return tx.courtCaseParty.upsert({
    where: {
      caseId_role_subjectId: {
        caseId: courtCase.id,
        role: CourtCasePartyRole.NAMED_PLAINTIFF,
        subjectId: input.subjectId,
      },
    },
    update: {
      deletedAt: null,
      displayNameSnapshot: input.displayName,
      isPublic: input.isPublic,
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
    },
    create: {
      caseId: courtCase.id,
      createdByUserId: input.createdByUserId,
      displayNameSnapshot: input.displayName,
      isPublic: input.isPublic,
      role: CourtCasePartyRole.NAMED_PLAINTIFF,
      subjectId: input.subjectId,
    },
    select: { id: true },
  });
}
