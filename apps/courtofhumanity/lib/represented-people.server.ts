import {
  CourtCasePartyRole,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  PersonLifeStatus,
  VotePosition,
  type PersonDeathCauseCategory,
  type Prisma,
} from "@optimitron/db";
import { DEMO_USER_EMAIL } from "@optimitron/data/campaign";
import { prisma } from "@/lib/prisma";
import { getPersonHref } from "@/lib/person-href";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";
import { buildApprovedOrganizationPositionWhere } from "@/lib/signatories.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

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
      where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG, deletedAt: null, isPublic: true },
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
    case: { deletedAt: null, isPublic: true },
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

  // Only the efficacy-lag aggregate requires hydration before pagination.
  const isInMemorySort = sort === "died-closest-to-cure";
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

  async function loadRecentParties() {
    // Match Boolean(image): empty strings belong with null images. Reuse the
    // same visibility and user filters for both groups and the boundary count.
    const withPhoto = plaintiffPartyWhere({
      AND: [
        visiblePersonWhere,
        { image: { not: null } },
        { image: { not: "" } },
      ],
    });
    const withoutPhoto = plaintiffPartyWhere({
      AND: [visiblePersonWhere, { OR: [{ image: null }, { image: "" }] }],
    });
    // Keep the split boundary and both slices on one snapshot if photos or
    // visibility change while this request is in flight.
    return prisma.$transaction(
      async (tx) => {
        const photoCount = await tx.courtCaseParty.count({ where: withPhoto });
        const photoTake = Math.min(
          pageSize,
          Math.max(0, photoCount - gallerySkip),
        );
        const recentOrder = [
          { createdAt: "desc" as const },
          { id: "desc" as const },
        ];
        const [photos, others] = await Promise.all([
          photoTake > 0
            ? tx.courtCaseParty.findMany({
                where: withPhoto,
                orderBy: recentOrder,
                skip: gallerySkip,
                take: photoTake,
                select: galleryPartySelect,
              })
            : [],
          photoTake < pageSize
            ? tx.courtCaseParty.findMany({
                where: withoutPhoto,
                orderBy: recentOrder,
                skip: Math.max(0, gallerySkip - photoCount),
                take: pageSize - photoTake,
                select: galleryPartySelect,
              })
            : [],
        ]);
        return [...photos, ...others];
      },
      { isolationLevel: "RepeatableRead" },
    );
  }

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
      ? sort === "recent"
        ? loadRecentParties()
        : prisma.courtCaseParty.findMany({
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
