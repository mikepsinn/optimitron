import type { Prisma } from "@optimitron/db";
import { HUMANITY_V_GOVERNMENT_CASE_SLUG } from "@optimitron/db";
import { CourtCasePartyRole, CourtCaseStatus } from "@optimitron/db/enums";

// Court enrollment integration. Call inside the host's transaction after
// authenticating the actor and verifying ownership of the represented person.
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

  const party = await tx.courtCaseParty.upsert({
    where: {
      // Include ownership in the atomic match: a conflicting unique party must
      // fail rather than transfer or expose somebody else's private submission.
      createdByUserId: input.createdByUserId,
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
  if (!party)
    throw new Error(
      "The existing plaintiff submission belongs to another account.",
    );
  return party;
}
