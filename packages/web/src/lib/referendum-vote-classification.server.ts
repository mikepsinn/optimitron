import {
  PersonLifeStatus,
  ReferendumVoteSource,
  type Prisma,
  type VotePosition,
} from "@optimitron/db";

type ReferendumIdFilter = string | string[];

function buildReferendumIdWhere(
  referendumId?: ReferendumIdFilter,
): Prisma.ReferendumVoteWhereInput {
  if (!referendumId) {
    return {};
  }
  return Array.isArray(referendumId)
    ? { referendumId: { in: referendumId } }
    : { referendumId };
}

export function buildOfficialReferendumVoteWhere(
  input: {
    answer?: VotePosition | `${VotePosition}`;
    publicOnly?: boolean;
    referendumId?: ReferendumIdFilter;
  } = {},
): Prisma.ReferendumVoteWhereInput {
  return {
    ...(input.answer ? { answer: input.answer as VotePosition } : {}),
    deletedAt: null,
    ...(input.publicOnly ? { isPublic: true } : {}),
    person: {
      deletedAt: null,
      ...(input.publicOnly ? { isPublic: true } : {}),
      lifeStatus: PersonLifeStatus.LIVING,
    },
    ...buildReferendumIdWhere(input.referendumId),
    voteSource: ReferendumVoteSource.SELF,
  };
}

export function buildRepresentedReferendumVoteWhere(
  input: {
    answer?: VotePosition | `${VotePosition}`;
    publicOnly?: boolean;
    referendumId?: ReferendumIdFilter;
  } = {},
): Prisma.ReferendumVoteWhereInput {
  return {
    ...(input.answer ? { answer: input.answer as VotePosition } : {}),
    deletedAt: null,
    ...(input.publicOnly ? { isPublic: true } : {}),
    person: {
      deletedAt: null,
      ...(input.publicOnly ? { isPublic: true } : {}),
      lifeStatus: { in: [PersonLifeStatus.UNKNOWN, PersonLifeStatus.LIVING] },
    },
    ...buildReferendumIdWhere(input.referendumId),
    voteSource: ReferendumVoteSource.REPRESENTED,
  };
}

export function buildMemorialReferendumVoteWhere(
  input: {
    answer?: VotePosition | `${VotePosition}`;
    publicOnly?: boolean;
    referendumId?: ReferendumIdFilter;
  } = {},
): Prisma.ReferendumVoteWhereInput {
  return {
    ...(input.answer ? { answer: input.answer as VotePosition } : {}),
    deletedAt: null,
    ...(input.publicOnly ? { isPublic: true } : {}),
    person: {
      deletedAt: null,
      ...(input.publicOnly ? { isPublic: true } : {}),
      lifeStatus: PersonLifeStatus.DECEASED,
      ...(input.publicOnly
        ? {
            memorial: {
              deletedAt: null,
              isPublic: true,
              submissions: {
                some: {
                  consentPublicDisplay: true,
                  deletedAt: null,
                  isPublic: true,
                },
              },
            },
          }
        : {}),
    },
    ...buildReferendumIdWhere(input.referendumId),
    voteSource: ReferendumVoteSource.REPRESENTED,
  };
}
