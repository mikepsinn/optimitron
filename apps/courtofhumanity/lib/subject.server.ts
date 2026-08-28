import { SubjectType } from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";

type SubjectWriteClient = Pick<Prisma.TransactionClient, "person" | "subject">;

/**
 * Ensure a Subject row exists for a Person (required by CourtCaseParty).
 *
 * Faithful copy of `ensureSubjectForPerson` from
 * `@optimitron/tracking/subject` — inlined here so this app does not take
 * the whole tracking package as a dependency for one 15-line upsert. Keep
 * the semantics in sync with that module.
 */
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
