import {
  PersonLifeStatus,
  ReferendumVoteSource,
  type Prisma,
  type VotePosition,
} from "@optimitron/db";

export function buildOfficialReferendumVoteWhere(input: {
  answer?: VotePosition | `${VotePosition}`;
  publicOnly?: boolean;
  referendumId?: string;
} = {}): Prisma.ReferendumVoteWhereInput {
  return {
    ...(input.answer ? { answer: input.answer as VotePosition } : {}),
    deletedAt: null,
    ...(input.publicOnly ? { isPublic: true } : {}),
    person: {
      deletedAt: null,
      ...(input.publicOnly ? { isPublic: true } : {}),
      lifeStatus: PersonLifeStatus.LIVING,
    },
    ...(input.referendumId ? { referendumId: input.referendumId } : {}),
    voteSource: ReferendumVoteSource.SELF,
  };
}

export function buildRepresentedReferendumVoteWhere(input: {
  answer?: VotePosition | `${VotePosition}`;
  publicOnly?: boolean;
  referendumId?: string;
} = {}): Prisma.ReferendumVoteWhereInput {
  return {
    ...(input.answer ? { answer: input.answer as VotePosition } : {}),
    deletedAt: null,
    ...(input.publicOnly ? { isPublic: true } : {}),
    person: {
      deletedAt: null,
      ...(input.publicOnly ? { isPublic: true } : {}),
      lifeStatus: { in: [PersonLifeStatus.UNKNOWN, PersonLifeStatus.LIVING] },
    },
    ...(input.referendumId ? { referendumId: input.referendumId } : {}),
    voteSource: ReferendumVoteSource.REPRESENTED,
  };
}

export function buildMemorialReferendumVoteWhere(input: {
  answer?: VotePosition | `${VotePosition}`;
  publicOnly?: boolean;
  referendumId?: string;
} = {}): Prisma.ReferendumVoteWhereInput {
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
    ...(input.referendumId ? { referendumId: input.referendumId } : {}),
    voteSource: ReferendumVoteSource.REPRESENTED,
  };
}
