import { TREATY_REFERENDUM_SLUG } from "../constants.js";
import {
  PersonConditionStatus,
  PersonLifeStatus,
  ReferendumVoteSource,
  VotePosition,
} from "../generated/prisma/client.js";
import { upsertWishoniaUser } from "../system-users.js";

// "Grandma Kay" is a product-facing canonical narrative fixture:
// demonstrates Optimitron's represented-vote feature — a young person
// voting on behalf of their grandmother who has dementia. Surfaces on
// /signatories and /people/grandma-kay. Belongs in production.
//
// Previously seeded only via `seedBootstrapData()` in `prisma/seed.ts`,
// which never runs in production. Migrating to managed-data so the
// `pnpm db:sync:managed-data --apply` deploy step keeps the record
// current and shipped.
//
// Depends on:
//   - Wishonia user (seeded via `upsertWishoniaUser`)
//   - Treaty referendum (synced by `managed-referendums.ts` — must run before this)

export const GRANDMA_KAY_SOURCE_REF = "memorial-example:grandma-kay";
export const GRANDMA_KAY_PERSON_CONDITION_ID =
  "person-condition-grandma-kay-dementia";

export interface ManagedGrandmaKayClient {
  user: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    upsert(args: unknown): Promise<{ id: string; personId: string | null }>;
    update(args: unknown): Promise<{ id: string }>;
  };
  person: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    upsert(args: unknown): Promise<{ id: string; handle: string | null }>;
  };
  personCondition: {
    upsert(args: unknown): Promise<{ id: string }>;
  };
  referendum: {
    findUniqueOrThrow(args: {
      where: { slug: string };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
  referendumVote: {
    upsert(args: unknown): Promise<{ id: string }>;
  };
}

export interface SyncManagedGrandmaKayOptions {
  apply: boolean;
}

export interface SyncManagedGrandmaKayResult {
  upserted: boolean;
  skipped?: string;
}

export async function syncManagedGrandmaKay(
  client: ManagedGrandmaKayClient & Parameters<typeof upsertWishoniaUser>[0],
  options: SyncManagedGrandmaKayOptions,
): Promise<SyncManagedGrandmaKayResult> {
  if (!options.apply) {
    return { upserted: true };
  }

  const { user } = await upsertWishoniaUser(client);

  const referendum = await client.referendum.findUniqueOrThrow({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  });

  const person = await client.person.upsert({
    where: { sourceRef: GRANDMA_KAY_SOURCE_REF },
    update: {
      displayName: "Grandma Kay",
      handle: "grandma-kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
    create: {
      createdByUserId: user.id,
      displayName: "Grandma Kay",
      handle: "grandma-kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: GRANDMA_KAY_SOURCE_REF,
    },
  });

  await client.personCondition.upsert({
    where: { id: GRANDMA_KAY_PERSON_CONDITION_ID },
    update: {
      conditionName: "Dementia",
      deletedAt: null,
      isPublic: true,
      personId: person.id,
      reportedByUserId: user.id,
      status: PersonConditionStatus.ACTIVE,
    },
    create: {
      id: GRANDMA_KAY_PERSON_CONDITION_ID,
      conditionName: "Dementia",
      isPublic: true,
      personId: person.id,
      reportedByUserId: user.id,
      status: PersonConditionStatus.ACTIVE,
    },
  });

  await client.referendumVote.upsert({
    where: {
      referendumId_personId: {
        referendumId: referendum.id,
        personId: person.id,
      },
    },
    update: {
      answer: VotePosition.YES,
      deletedAt: null,
      isPublic: true,
      publicComment: "She would trade one apocalypse for dementia research.",
      userId: user.id,
      voteSource: ReferendumVoteSource.REPRESENTED,
    },
    create: {
      answer: VotePosition.YES,
      isPublic: true,
      personId: person.id,
      publicComment: "She would trade one apocalypse for dementia research.",
      referendumId: referendum.id,
      userId: user.id,
      voteSource: ReferendumVoteSource.REPRESENTED,
    },
  });

  return { upserted: true };
}

export function formatManagedGrandmaKayResult(
  result: SyncManagedGrandmaKayResult,
): string {
  if (result.skipped) return `Grandma Kay: skipped (${result.skipped})`;
  return result.upserted ? "Grandma Kay: synced" : "Grandma Kay: unchanged";
}
