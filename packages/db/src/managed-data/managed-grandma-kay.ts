import { TREATY_REFERENDUM_SLUG } from "../constants.js";
import {
  PersonConditionStatus,
  PersonLifeStatus,
  ReferendumVoteSource,
  VotePosition,
  type PrismaClient,
} from "../generated/prisma/client.js";
import { upsertWishoniaUser } from "../system-users.js";

// "Grandma Kay" — product-facing represented-vote narrative fixture
// (young person voting on behalf of grandmother with dementia). Belongs
// in production; synced on every `pnpm db:sync:managed-data --apply`.
// Depends on the Wishonia user and the treaty referendum existing first.

export const GRANDMA_KAY_SOURCE_REF = "memorial-example:grandma-kay";
export const GRANDMA_KAY_PERSON_CONDITION_ID =
  "person-condition-grandma-kay-dementia";

export async function syncManagedGrandmaKay(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ upserted: boolean; dryRun: boolean }> {
  if (!options.apply) return { upserted: false, dryRun: true };

  const { user } = await upsertWishoniaUser(prisma);
  const referendum = await prisma.referendum.findUniqueOrThrow({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  });

  const person = await prisma.person.upsert({
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

  await prisma.personCondition.upsert({
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

  await prisma.referendumVote.upsert({
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

  return { upserted: true, dryRun: false };
}

export function formatManagedGrandmaKayResult(
  result: { upserted: boolean; dryRun: boolean },
): string {
  if (result.dryRun) return "Grandma Kay: would sync (dry-run)";
  return result.upserted ? "Grandma Kay: synced" : "Grandma Kay: unchanged";
}
