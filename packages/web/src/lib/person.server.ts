import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { createUniqueHandle } from "@/lib/user-identity.server";

type DbClient = Prisma.TransactionClient | typeof prisma;

interface UserPersonIdentity {
  countryCode: string | null;
  email: string;
  id: string;
  personId: string | null;
}

export interface EnsurePersonOptions {
  /** Display name for a freshly-created Person (from OAuth profile or signup form). */
  displayName?: string | null;
  /** Avatar image URL for a freshly-created Person (from OAuth profile). */
  image?: string | null;
}

interface PersonDraftInput {
  countryCode?: string | null;
  currentAffiliation?: string | null;
  displayName: string;
  email?: string | null;
  image?: string | null;
  isPublicFigure?: boolean;
  roleTitle?: string | null;
  sourceRef?: string | null;
  sourceUrl?: string | null;
}

interface MergeDuplicatePersonInput {
  canonicalPersonId: string;
  duplicatePersonId: string;
  now?: Date;
}

interface MergeablePerson {
  bio: string | null;
  countryCode: string | null;
  currentAffiliation: string | null;
  displayName: string;
  email: string | null;
  handle: string | null;
  id: string;
  image: string | null;
  isPublicFigure: boolean;
  links: Prisma.JsonValue | null;
  sourceRef: string | null;
  sourceUrl: string | null;
  user: { id: string } | null;
}

export interface MergeDuplicatePersonResult {
  canonicalPersonId: string;
  duplicatePersonId: string;
  reassignedReferralInvitations: number;
  reassignedTasks: number;
  reassignedUsers: number;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function derivePersonSourceRef(input: PersonDraftInput) {
  const explicitSourceRef = input.sourceRef?.trim();
  if (explicitSourceRef) {
    return explicitSourceRef;
  }

  const normalizedEmail = input.email?.trim().toLowerCase();
  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  if (!input.isPublicFigure) {
    return null;
  }

  const keyParts = [
    slugify(input.displayName),
    slugify(input.roleTitle ?? ""),
    slugify(input.currentAffiliation ?? ""),
    slugify(input.countryCode ?? ""),
  ].filter((part) => part.length > 0);

  return keyParts.length > 0 ? `public-figure:${keyParts.join(":")}` : null;
}

function defaultDisplayName(user: UserPersonIdentity, override?: string | null) {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) return trimmedOverride;
  if (user.email.trim()) return user.email.trim().toLowerCase();
  return `Person ${user.id.slice(0, 8)}`;
}

async function loadUserIdentity(db: DbClient, userId: string): Promise<UserPersonIdentity> {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      countryCode: true,
      email: true,
      id: true,
      personId: true,
    },
  });
}

async function loadMergeablePerson(db: DbClient, personId: string) {
  return db.person.findUnique({
    where: { id: personId },
    select: {
      bio: true,
      countryCode: true,
      currentAffiliation: true,
      displayName: true,
      email: true,
      handle: true,
      id: true,
      image: true,
      isPublicFigure: true,
      links: true,
      sourceRef: true,
      sourceUrl: true,
      user: {
        select: { id: true },
      },
    },
  }) as Promise<MergeablePerson | null>;
}

function mergePersonUpdateData(
  canonical: MergeablePerson,
  duplicate: MergeablePerson,
): Prisma.PersonUpdateInput {
  const links = canonical.links ?? duplicate.links;

  return {
    bio: canonical.bio ?? duplicate.bio,
    countryCode: canonical.countryCode ?? duplicate.countryCode,
    currentAffiliation: canonical.currentAffiliation ?? duplicate.currentAffiliation,
    displayName: canonical.displayName || duplicate.displayName,
    email: canonical.email ?? duplicate.email,
    handle: canonical.handle ?? duplicate.handle,
    image: canonical.image ?? duplicate.image,
    isPublicFigure: canonical.isPublicFigure || duplicate.isPublicFigure,
    ...(links === null ? {} : { links }),
    sourceRef: canonical.sourceRef ?? duplicate.sourceRef,
    sourceUrl: canonical.sourceUrl ?? duplicate.sourceUrl,
  };
}

async function mergeDuplicatePersonInClient(
  input: MergeDuplicatePersonInput,
  db: DbClient,
): Promise<MergeDuplicatePersonResult> {
  if (input.canonicalPersonId === input.duplicatePersonId) {
    throw new Error("canonicalPersonId and duplicatePersonId must be different");
  }

  const [canonical, duplicate] = await Promise.all([
    loadMergeablePerson(db, input.canonicalPersonId),
    loadMergeablePerson(db, input.duplicatePersonId),
  ]);

  if (!canonical) {
    throw new Error(`Canonical person not found: ${input.canonicalPersonId}`);
  }
  if (!duplicate) {
    throw new Error(`Duplicate person not found: ${input.duplicatePersonId}`);
  }

  if (canonical.user && duplicate.user && canonical.user.id !== duplicate.user.id) {
    throw new Error("Cannot merge two Person records that are linked to different users");
  }

  const now = input.now ?? new Date();
  const canonicalData = mergePersonUpdateData(canonical, duplicate);

  const [taskResult, invitationResult, userResult] = await Promise.all([
    db.task.updateMany({
      where: { assigneePersonId: duplicate.id },
      data: { assigneePersonId: canonical.id },
    }),
    db.referralInvitation.updateMany({
      where: { recipientPersonId: duplicate.id },
      data: { recipientPersonId: canonical.id },
    }),
    duplicate.user && !canonical.user
      ? db.user.updateMany({
          where: { personId: duplicate.id },
          data: { personId: canonical.id },
        })
      : Promise.resolve({ count: 0 }),
  ]);

  await db.person.update({
    where: { id: duplicate.id },
    data: {
      deletedAt: now,
      email: null,
      handle: null,
      sourceRef: null,
    },
  });

  await db.person.update({
    where: { id: canonical.id },
    data: canonicalData,
  });

  return {
    canonicalPersonId: canonical.id,
    duplicatePersonId: duplicate.id,
    reassignedReferralInvitations: invitationResult.count,
    reassignedTasks: taskResult.count,
    reassignedUsers: userResult.count,
  };
}

export async function mergeDuplicatePerson(
  input: MergeDuplicatePersonInput,
  db: DbClient = prisma,
): Promise<MergeDuplicatePersonResult> {
  if ("$transaction" in db) {
    return db.$transaction((tx) => mergeDuplicatePersonInClient(input, tx));
  }

  return mergeDuplicatePersonInClient(input, db);
}

/**
 * Ensure the User has a linked canonical Person row. Idempotent.
 *
 * Person owns every public-display field, so this helper does NOT pull
 * displayName / image / bio off User (those columns no longer exist).
 * Callers that have fresh display data — OAuth signup, credentials signup —
 * pass it through `options`. Callers that don't (re-sync paths) leave it
 * undefined; in that case the Person keeps its existing values, and brand
 * new Persons get an email-or-id derived placeholder displayName.
 *
 * On create, also seeds Person.handle via `createUniqueHandle()`.
 */
export async function ensurePersonForUser(
  userId: string,
  options: EnsurePersonOptions = {},
  db: DbClient = prisma,
) {
  const user = await loadUserIdentity(db, userId);

  // Account-level fields that genuinely belong on the Person too. Display
  // fields (displayName / image) only flow on Person create — see below.
  const accountSyncData = {
    countryCode: user.countryCode,
    email: user.email,
  };

  if (user.personId) {
    return db.person.update({
      where: { id: user.personId },
      data: accountSyncData,
    });
  }

  const existingPerson = await db.person.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      handle: true,
      user: {
        select: { id: true },
      },
    },
  });

  let person;
  if (existingPerson && (!existingPerson.user || existingPerson.user.id === user.id)) {
    // Linking an existing Person to this User. Don't overwrite display data
    // the Person may already own. Backfill handle if it's missing.
    person = await db.person.update({
      where: { id: existingPerson.id },
      data: existingPerson.handle
        ? accountSyncData
        : { ...accountSyncData, handle: await createUniqueHandle() },
    });
  } else {
    person = await db.person.create({
      data: {
        ...accountSyncData,
        displayName: defaultDisplayName(user, options.displayName),
        image: options.image ?? null,
        handle: await createUniqueHandle(),
      },
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      personId: person.id,
    },
  });

  return person;
}

export async function findOrCreatePerson(
  input: PersonDraftInput,
  db: DbClient = prisma,
) {
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("displayName is required");
  }

  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  const normalizedSourceRef = derivePersonSourceRef({
    ...input,
    displayName,
    email: normalizedEmail,
  });

  if (normalizedEmail) {
    const existingByEmail = await db.person.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingByEmail) {
      return db.person.update({
        where: { id: existingByEmail.id },
        data: {
          countryCode: input.countryCode ?? existingByEmail.countryCode,
          currentAffiliation: input.currentAffiliation ?? existingByEmail.currentAffiliation,
          displayName,
          image: input.image ?? existingByEmail.image,
          isPublicFigure: input.isPublicFigure ?? existingByEmail.isPublicFigure,
          sourceRef: normalizedSourceRef ?? existingByEmail.sourceRef,
          sourceUrl: input.sourceUrl ?? existingByEmail.sourceUrl,
        },
      });
    }
  }

  if (normalizedSourceRef) {
    const existingBySourceRef = await db.person.findUnique({
      where: {
        sourceRef: normalizedSourceRef,
      },
    });

    if (existingBySourceRef && existingBySourceRef.deletedAt == null) {
      return db.person.update({
        where: { id: existingBySourceRef.id },
        data: {
          countryCode: input.countryCode ?? existingBySourceRef.countryCode,
          currentAffiliation: input.currentAffiliation ?? existingBySourceRef.currentAffiliation,
          displayName,
          email: normalizedEmail ?? existingBySourceRef.email,
          image: input.image ?? existingBySourceRef.image,
          isPublicFigure: input.isPublicFigure ?? existingBySourceRef.isPublicFigure,
          sourceRef: normalizedSourceRef,
          sourceUrl: input.sourceUrl ?? existingBySourceRef.sourceUrl,
        },
      });
    }
  }

  if (input.isPublicFigure) {
    const existingByPublicSignature = await db.person.findFirst({
      where: {
        currentAffiliation: input.currentAffiliation ?? null,
        deletedAt: null,
        displayName,
        isPublicFigure: true,
      },
    });

    if (existingByPublicSignature) {
      return db.person.update({
        where: { id: existingByPublicSignature.id },
        data: {
          countryCode: input.countryCode ?? existingByPublicSignature.countryCode,
          currentAffiliation:
            input.currentAffiliation ?? existingByPublicSignature.currentAffiliation,
          displayName,
          email: normalizedEmail ?? existingByPublicSignature.email,
          image: input.image ?? existingByPublicSignature.image,
          isPublicFigure: true,
          sourceRef: normalizedSourceRef ?? existingByPublicSignature.sourceRef,
          sourceUrl: input.sourceUrl ?? existingByPublicSignature.sourceUrl,
        },
      });
    }
  }

  return db.person.create({
    data: {
      countryCode: input.countryCode ?? null,
      currentAffiliation: input.currentAffiliation ?? null,
      displayName,
      email: normalizedEmail,
      image: input.image ?? null,
      isPublicFigure: input.isPublicFigure ?? false,
      sourceRef: normalizedSourceRef,
      sourceUrl: input.sourceUrl ?? null,
    },
  });
}
