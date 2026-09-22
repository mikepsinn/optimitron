import type { Prisma } from "@optimitron/db";
import { McpScope, SubjectType } from "@optimitron/db/enums";

export interface CourtActor {
  userId: string;
  isAdmin: boolean;
  scopes: readonly McpScope[];
}

export class CourtAccessError extends Error {
  constructor(
    message: string,
    public readonly code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "CourtAccessError";
  }
}

export function isCourtModerator(actor: CourtActor) {
  return actor.isAdmin && actor.scopes.includes(McpScope.EARTHDATA_ADMIN);
}

export function requireCourtActor(actor: CourtActor) {
  if (!actor.userId || !actor.scopes.includes(McpScope.EARTHDATA_WRITE)) {
    throw new CourtAccessError(
      "Court access requires an authenticated Earth-data grant.",
    );
  }
}

export function courtChildVisibility(actor: CourtActor) {
  return {
    deletedAt: null,
    OR: [{ isPublic: true }, { createdByUserId: actor.userId }],
  };
}

export function courtSubjectVisibility(
  actor: CourtActor,
  publicOnly = false,
): Prisma.SubjectWhereInput {
  const publicPerson = { deletedAt: null, isPublic: true };
  return {
    deletedAt: null,
    OR: [
      { person: publicPerson },
      {
        subjectType: SubjectType.COHORT,
        personId: null,
        userId: null,
        organizationId: null,
        jurisdictionId: null,
      },
      {
        subjectType: SubjectType.JURISDICTION,
        jurisdiction: { deletedAt: null },
      },
      { organization: { deletedAt: null, visibility: "PUBLIC" } },
      ...(!publicOnly
        ? [
            { userId: actor.userId },
            {
              person: {
                deletedAt: null,
                OR: [
                  { createdByUserId: actor.userId },
                  { user: { id: actor.userId } },
                ],
              },
            },
          ]
        : []),
    ],
  };
}

export async function requireCourtCase(
  db: Prisma.TransactionClient,
  lookup: string,
  actor: CourtActor,
  write = false,
) {
  requireCourtActor(actor);
  const identity = await db.courtCase.findFirst({
    where: { deletedAt: null, OR: [{ id: lookup }, { slug: lookup }] },
    select: { id: true },
  });
  if (!identity)
    throw new CourtAccessError(
      "Court case not found or access denied.",
      "NOT_FOUND",
    );
  if (write)
    await db.$queryRawUnsafe(
      'SELECT id FROM "CourtCase" WHERE id = $1 FOR UPDATE',
      identity.id,
    );
  const row = await db.courtCase.findUnique({ where: { id: identity.id } });
  if (
    !row ||
    row.deletedAt ||
    (!row.isPublic && row.createdByUserId !== actor.userId)
  ) {
    throw new CourtAccessError(
      "Court case not found or access denied.",
      "NOT_FOUND",
    );
  }
  if (
    write &&
    row.createdByUserId !== actor.userId &&
    !(row.isPublic && isCourtModerator(actor))
  ) {
    throw new CourtAccessError(
      "Only the case creator or a public-case moderator may change this case.",
    );
  }
  return row;
}

export async function requireCourtSubject(
  db: Prisma.TransactionClient,
  id: string | null,
  actor: CourtActor,
  publicOnly = false,
) {
  if (!id) return;
  if (
    !(await db.subject.findFirst({
      where: { id, ...courtSubjectVisibility(actor, publicOnly) },
      select: { id: true },
    }))
  ) {
    throw new CourtAccessError(
      "Subject not found or unavailable for this visibility.",
    );
  }
}

export async function requireCourtTask(
  db: Prisma.TransactionClient,
  id: string | null,
  actor: CourtActor,
  publicOnly = false,
) {
  if (!id) return;
  if (
    !(await db.task.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { isPublic: true },
          ...(!publicOnly
            ? [{ createdByUserId: actor.userId, ownerOrganizationId: null }]
            : []),
        ],
      },
      select: { id: true },
    }))
  ) {
    throw new CourtAccessError(
      "Task not found or unavailable for this visibility.",
    );
  }
}

export async function requireCourtReferendum(
  db: Prisma.TransactionClient,
  id: string | null,
  actor: CourtActor,
  caseId?: string,
  publicOnly = false,
) {
  if (!id) return;
  const row = await db.referendum.findFirst({
    where: { id, deletedAt: null, kind: "COURT_CASE" },
    select: { id: true, createdByUserId: true, publishedAt: true },
  });
  if (!row || (publicOnly && !row.publishedAt))
    throw new CourtAccessError("Court referendum not found or unavailable.");
  const linked = await db.courtCase.findMany({
    where: { juryReferendumId: id, deletedAt: null },
    select: { id: true },
  });
  const linkedClaims = await db.courtCaseClaim.findMany({
    where: { juryReferendumId: id, deletedAt: null },
    select: { caseId: true },
  });
  if (
    linked.some((item) => item.id !== caseId) ||
    linkedClaims.some((item) => item.caseId !== caseId)
  )
    throw new CourtAccessError("Referendum belongs to another case.");
  if (
    row.createdByUserId !== actor.userId &&
    !(
      caseId &&
      isCourtModerator(actor) &&
      (linked.length || linkedClaims.length)
    )
  ) {
    throw new CourtAccessError(
      "Referendum is not controlled by this actor or case.",
    );
  }
}

export async function requireCourtChild(
  db: Prisma.TransactionClient,
  kind: "claim" | "harm" | "party",
  id: string | null,
  caseId: string,
  actor: CourtActor,
  publicOnly = false,
) {
  if (!id) return;
  const where = {
    id,
    caseId,
    ...courtChildVisibility(actor),
    ...(publicOnly ? { isPublic: true } : {}),
  };
  const found =
    kind === "claim"
      ? await db.courtCaseClaim.findFirst({ where, select: { id: true } })
      : kind === "harm"
        ? await db.courtCaseHarm.findFirst({ where, select: { id: true } })
        : await db.courtCaseParty.findFirst({
            where: {
              ...where,
              subject: courtSubjectVisibility(actor, publicOnly),
            },
            select: { id: true },
          });
  if (!found)
    throw new CourtAccessError(
      `Court ${kind} is unavailable or belongs to another case.`,
    );
}

export async function requirePublicCourtSources(
  db: Prisma.TransactionClient,
  input: {
    sourceArtifactId?: string | null;
    personMemorialId?: string | null;
    globalVariableId?: string | null;
  },
) {
  if (
    input.sourceArtifactId &&
    !(await db.sourceArtifact.findFirst({
      where: { id: input.sourceArtifactId, deletedAt: null, isPublic: true },
      select: { id: true },
    }))
  )
    throw new CourtAccessError(
      "Evidence source must be public and not deleted.",
    );
  if (
    input.personMemorialId &&
    !(await db.personMemorial.findFirst({
      where: {
        id: input.personMemorialId,
        deletedAt: null,
        isPublic: true,
        person: { deletedAt: null, isPublic: true },
      },
      select: { id: true },
    }))
  )
    throw new CourtAccessError(
      "Evidence memorial and person must be public and not deleted.",
    );
  if (
    input.globalVariableId &&
    !(await db.globalVariable.findFirst({
      where: { id: input.globalVariableId, deletedAt: null },
      select: { id: true },
    }))
  )
    throw new CourtAccessError(
      "Evidence variable must exist and not be deleted.",
    );
}
