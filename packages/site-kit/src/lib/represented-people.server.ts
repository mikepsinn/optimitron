import {
  CourtCasePartyRole,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  PersonLifeStatus,
  VotePosition,
  type PersonDeathCauseCategory,
  type Prisma,
} from "@optimitron/db";
import { DEMO_USER_EMAIL } from "@optimitron/data/campaign";
import { prisma } from "./prisma";
import { getPersonHref } from "./person-href";
import { buildOfficialReferendumVoteWhere } from "./referendum-vote-classification.server";
import { buildApprovedOrganizationPositionWhere } from "./signatories.server";
import { TREATY_REFERENDUM_SLUG } from "./treaty";
import { getUserDisplayName, userDisplaySelect } from "./user-display";

export interface RepresentedPersonCard {
  conditionName: string | null;
  displayName: string;
  href: string;
  image: string | null;
  lifeStatus: PersonLifeStatus;
  personId: string;
  publicComment: string | null;
  representedBy: string;
  partyId: string;
}

export type RepresentedPeopleSortKey =
  | "recent"
  | "oldest"
  | "alphabetical"
  | "died-closest-to-cure";

export interface RepresentedPeopleFilters {
  causeCategory?: PersonDeathCauseCategory | null;
  conditionGlobalVariableId?: string | null;
  conflictId?: string | null;
  countryCode?: string | null;
  efficacyLagOnly?: boolean;
}

export interface RepresentedPeopleQueryOptions {
  filters?: RepresentedPeopleFilters;
  page?: number;
  pageSize?: number;
  sort?: RepresentedPeopleSortKey;
}

export const DEFAULT_REPRESENTED_PEOPLE_PAGE_SIZE = 48;

export interface RepresentedPeopleGalleryData {
  deadPersonVoteCount: number;
  filteredCount: number;
  officialVoteCount: number;
  organizationCount: number;
  page: number;
  pageSize: number;
  people: RepresentedPersonCard[];
  referendumId: string;
  representedHumanCount: number;
  sort: RepresentedPeopleSortKey;
  totalPages: number;
}

const publicMemorialSubmissionWhere = {
  consentPublicDisplay: true,
  deletedAt: null,
  isPublic: true,
} satisfies Prisma.PersonMemorialSubmissionWhereInput;

const publicDeceasedPersonVisibilityWhere = {
  lifeStatus: PersonLifeStatus.DECEASED,
  memorial: {
    isPublic: true,
    deletedAt: null,
    submissions: {
      some: publicMemorialSubmissionWhere,
    },
  },
} satisfies Prisma.PersonWhereInput;

const publicRepresentedPersonVisibilityWhere = {
  OR: [
    { lifeStatus: { in: [PersonLifeStatus.UNKNOWN, PersonLifeStatus.LIVING] } },
    publicDeceasedPersonVisibilityWhere,
  ],
} satisfies Prisma.PersonWhereInput;

function buildPersonFilterWhere(
  filters: RepresentedPeopleFilters,
): Prisma.PersonWhereInput | null {
  const clauses: Prisma.PersonWhereInput[] = [];

  if (filters.countryCode) {
    clauses.push({ memorial: { deathCountryCode: filters.countryCode } });
  }
  if (filters.causeCategory) {
    clauses.push({ memorial: { causeCategory: filters.causeCategory } });
  }
  if (filters.conflictId) {
    clauses.push({ memorial: { conflictId: filters.conflictId } });
  }
  if (filters.conditionGlobalVariableId) {
    clauses.push({
      conditions: {
        some: {
          deletedAt: null,
          globalVariableId: filters.conditionGlobalVariableId,
          isPublic: true,
        },
      },
    });
  }
  if (filters.efficacyLagOnly) {
    clauses.push({
      memorial: {
        efficacyLagEvidence: {
          some: { deletedAt: null },
        },
      },
    });
  }

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0]!;
  return { AND: clauses };
}

const galleryPartySelect = {
  createdAt: true,
  id: true,
  createdBy: { select: userDisplaySelect },
  subject: {
    select: {
      person: {
        select: {
          bio: true,
          conditions: {
            where: { deletedAt: null, isPublic: true },
            orderBy: { createdAt: "asc" as const },
            select: { conditionName: true },
            take: 1,
          },
          displayName: true,
          memorial: {
            select: {
              efficacyLagEvidence: {
                where: { deletedAt: null },
                orderBy: { diedBeforeApprovalDays: "asc" as const },
                select: { diedBeforeApprovalDays: true },
                take: 1,
              },
              submissions: {
                where: publicMemorialSubmissionWhere,
                orderBy: { createdAt: "asc" as const },
                select: {
                  memorialMessage: true,
                },
                take: 1,
              },
            },
          },
          handle: true,
          id: true,
          image: true,
          lifeStatus: true,
        },
      },
    },
  },
} satisfies Prisma.CourtCasePartySelect;

export async function getRepresentedPeopleGalleryData(
  referendumSlug = TREATY_REFERENDUM_SLUG,
  options: RepresentedPeopleQueryOptions = {},
): Promise<RepresentedPeopleGalleryData | null> {
  const filters = options.filters ?? {};
  const sort: RepresentedPeopleSortKey = options.sort ?? "recent";
  const pageSize = Math.min(
    Math.max(options.pageSize ?? DEFAULT_REPRESENTED_PEOPLE_PAGE_SIZE, 1),
    96,
  );
  const page = Math.max(options.page ?? 1, 1);

  const [referendum, courtCase] = await Promise.all([
    prisma.referendum.findUnique({
      where: { slug: referendumSlug, deletedAt: null },
      select: { id: true },
    }),
    prisma.courtCase.findUnique({
      where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
      select: { id: true },
    }),
  ]);

  const personFilterWhere = buildPersonFilterWhere(filters);
  const visiblePersonWhere: Prisma.PersonWhereInput = {
    AND: [
      { deletedAt: null, isPublic: true },
      publicRepresentedPersonVisibilityWhere,
      ...(personFilterWhere ? [personFilterWhere] : []),
    ],
  };
  // Hide parties registered via the demo account from the public gallery.
  // Screenshot tooling logs in as `demo@thinkbynumbers.org` and creates
  // throwaway plaintiffs ("CROP VIEWPORT HUMAN 1778...") that would otherwise
  // pollute every public list with `ADDED BY DEMO USER` rows. Real users are
  // unaffected.
  const plaintiffPartyWhere = (
    personWhere: Prisma.PersonWhereInput = visiblePersonWhere,
  ): Prisma.CourtCasePartyWhereInput => ({
    caseId: courtCase?.id ?? "__missing_humanity_v_government_case__",
    deletedAt: null,
    isPublic: true,
    role: CourtCasePartyRole.NAMED_PLAINTIFF,
    NOT: { createdBy: { is: { email: DEMO_USER_EMAIL } } },
    subject: {
      deletedAt: null,
      person: personWhere,
    },
  });
  const filteredPartyWhere = plaintiffPartyWhere();
  const publicRepresentedPersonPartyWhere = plaintiffPartyWhere({
    AND: [
      { deletedAt: null, isPublic: true },
      {
        lifeStatus: { in: [PersonLifeStatus.UNKNOWN, PersonLifeStatus.LIVING] },
      },
      ...(personFilterWhere ? [personFilterWhere] : []),
    ],
  });
  const publicDeadPersonPartyWhere = plaintiffPartyWhere({
    AND: [
      { deletedAt: null, isPublic: true },
      publicDeceasedPersonVisibilityWhere,
      ...(personFilterWhere ? [personFilterWhere] : []),
    ],
  });

  // Sort handling. Prisma can't express the efficacy-lag aggregation or a
  // relation-field nulls-last order, so those sorts hydrate the filtered rows,
  // sort in-memory, and then paginate.
  const isInMemorySort = sort === "died-closest-to-cure" || sort === "recent";
  const orderBy = (() => {
    switch (sort) {
      case "alphabetical":
        return { subject: { person: { displayName: "asc" as const } } };
      case "oldest":
        return { createdAt: "asc" as const };
      case "recent":
        return { createdAt: "desc" as const };
      case "died-closest-to-cure":
        return { createdAt: "desc" as const }; // overridden by in-memory sort
    }
  })();
  const gallerySkip = (page - 1) * pageSize;

  const [
    officialVoteCount,
    organizationCount,
    representedHumanCount,
    deadPersonVoteCount,
    filteredCount,
    rawParties,
  ] = await Promise.all([
    referendum
      ? prisma.referendumVote.count({
          where: buildOfficialReferendumVoteWhere({
            answer: VotePosition.YES,
            referendumId: referendum.id,
          }),
        })
      : 0,
    referendum
      ? prisma.organizationReferendumPosition.count({
          where: buildApprovedOrganizationPositionWhere(referendum.id),
        })
      : 0,
    courtCase
      ? prisma.courtCaseParty.count({
          where: publicRepresentedPersonPartyWhere,
        })
      : 0,
    courtCase
      ? prisma.courtCaseParty.count({ where: publicDeadPersonPartyWhere })
      : 0,
    courtCase ? prisma.courtCaseParty.count({ where: filteredPartyWhere }) : 0,
    courtCase
      ? prisma.courtCaseParty.findMany({
          where: filteredPartyWhere,
          orderBy,
          ...(isInMemorySort ? {} : { skip: gallerySkip, take: pageSize }),
          select: galleryPartySelect,
        })
      : [],
  ]);

  const sortedParties = isInMemorySort
    ? [...rawParties]
        .sort((a, b) => {
          const aPerson = a.subject.person;
          const bPerson = b.subject.person;
          if (!aPerson || !bPerson) return 0;
          if (sort === "recent") {
            const imagePresence =
              Number(Boolean(bPerson.image)) - Number(Boolean(aPerson.image));
            if (imagePresence !== 0) return imagePresence;
            return b.createdAt.getTime() - a.createdAt.getTime();
          }
          const aDays =
            aPerson.memorial?.efficacyLagEvidence[0]?.diedBeforeApprovalDays ??
            Number.POSITIVE_INFINITY;
          const bDays =
            bPerson.memorial?.efficacyLagEvidence[0]?.diedBeforeApprovalDays ??
            Number.POSITIVE_INFINITY;
          if (aDays === bDays) return 0;
          return aDays < bDays ? -1 : 1;
        })
        .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    : rawParties;

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  return {
    deadPersonVoteCount,
    filteredCount,
    officialVoteCount,
    organizationCount,
    page,
    pageSize,
    people: sortedParties.flatMap((party) => {
      const person = party.subject.person;
      if (!person) return [];
      return [
        {
          conditionName: person.conditions[0]?.conditionName ?? null,
          displayName: person.displayName,
          href: getPersonHref(person),
          image: person.image,
          lifeStatus: person.lifeStatus,
          personId: person.id,
          publicComment:
            person.memorial?.submissions[0]?.memorialMessage ?? person.bio,
          representedBy: getUserDisplayName(party.createdBy),
          partyId: party.id,
        },
      ];
    }),
    referendumId: referendum?.id ?? "",
    representedHumanCount,
    sort,
    totalPages,
  };
}

