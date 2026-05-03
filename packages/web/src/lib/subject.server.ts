import { SubjectType } from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";

type SubjectWriteClient = Pick<Prisma.TransactionClient, "person" | "subject">;

export async function ensureSubjectForUser(
  tx: SubjectWriteClient,
  user: { email: string | null; id: string; personId?: string | null },
) {
  const linkedPerson = user.personId
    ? await tx.person.findUnique({
        where: { id: user.personId },
        select: { displayName: true, id: true },
      })
    : await tx.person.findFirst({
        where: { user: { id: user.id } },
        select: { displayName: true, id: true },
      });
  const personId = user.personId ?? linkedPerson?.id ?? null;
  const displayName =
    linkedPerson?.displayName?.trim() || user.email || "Optimitron User";

  return tx.subject.upsert({
    where: { userId: user.id },
    update: {
      displayName,
      personId,
      subjectType: SubjectType.USER,
    },
    create: {
      displayName,
      personId,
      subjectType: SubjectType.USER,
      userId: user.id,
    },
  });
}

export async function ensureSubjectForPerson(
  tx: SubjectWriteClient,
  person: { displayName: string; id: string },
) {
  return tx.subject.upsert({
    where: { personId: person.id },
    update: {
      displayName: person.displayName,
    },
    create: {
      displayName: person.displayName,
      personId: person.id,
      subjectType: SubjectType.PERSON,
    },
  });
}

export async function ensureExternalPersonSubject(
  tx: SubjectWriteClient,
  input: { displayName?: string | null; externalId: string },
) {
  return tx.subject.upsert({
    where: {
      subjectType_externalId: {
        externalId: input.externalId,
        subjectType: SubjectType.PERSON,
      },
    },
    update: {
      displayName: input.displayName ?? "Anonymous Contributor",
    },
    create: {
      displayName: input.displayName ?? "Anonymous Contributor",
      externalId: input.externalId,
      subjectType: SubjectType.PERSON,
    },
  });
}
