import {
  CourtCasePartyRole,
  PersonConditionStatus as PersonConditionStatusEnum,
  PersonLifeStatus,
  VotePosition,
  type PersonConditionStatus,
  type PersonDeathCauseCategory,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { getPersonHref } from "@/lib/person-href";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";
import { buildApprovedOrganizationPositionWhere } from "@/lib/referendum-site.server";
import { HUMANITY_V_GOVERNMENT_CASE_SLUG } from "@/lib/humanity-v-government-case.server";
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

export interface RepresentedPersonProfileData {
  conditions: Array<{
    conditionName: string;
    status: PersonConditionStatus;
  }>;
  person: {
    birthDate: Date | null;
    bio: string | null;
    displayName: string;
    handle: string | null;
    id: string;
    image: string | null;
    lifeStatus: PersonLifeStatus;
    deathDate: Date | null;
  };
  memorial: {
    causeCategory: PersonDeathCauseCategory;
    conditionLabel: string | null;
    deathCountryCode: string | null;
    /**
     * Top efficacy-lag match for this memorial (the cure they died waiting for).
     * Sorted by min(diedBeforeApprovalDays). PRD Feature 3 / Feature 6 OG card.
     */
    efficacyLag: {
      approvalDate: Date;
      daysBeforeApproval: number | null;
      interventionName: string;
    } | null;
    /**
     * True if at least one submitter has consented to court-evidence use.
     * Drives the evidence-package download button (PRD Feature 4 / PR9).
     */
    hasCourtEvidenceConsent: boolean;
    memorialId: string;
    memorialMessage: string | null;
    responsibleParties: Array<{ name: string | null }>;
  } | null;
  relationshipType: string | null;
  representedBy: string;
  filing: {
    createdAt: Date;
    publicComment: string | null;
  };
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
  const plaintiffPartyWhere = (
    personWhere: Prisma.PersonWhereInput = visiblePersonWhere,
  ): Prisma.CourtCasePartyWhereInput => ({
    caseId: courtCase?.id ?? "__missing_humanity_v_government_case__",
    deletedAt: null,
    isPublic: true,
    role: CourtCasePartyRole.NAMED_PLAINTIFF,
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

export async function getRepresentedPersonProfileData(
  handleOrId: string,
): Promise<RepresentedPersonProfileData | null> {
  const basePlaintiffPartyWhere = {
    case: {
      deletedAt: null,
      slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
    },
    deletedAt: null,
    isPublic: true,
    role: CourtCasePartyRole.NAMED_PLAINTIFF,
  };

  const person = await prisma.person.findFirst({
    where: {
      deletedAt: null,
      isPublic: true,
      AND: [
        { OR: [{ handle: handleOrId }, { id: handleOrId }] },
        publicRepresentedPersonVisibilityWhere,
        {
          subject: {
            courtCaseParties: {
              some: basePlaintiffPartyWhere,
            },
          },
        },
      ],
    },
    select: {
      bio: true,
      birthDate: true,
      conditions: {
        where: { deletedAt: null, isPublic: true },
        orderBy: [{ status: "desc" as const }, { createdAt: "asc" as const }],
        select: {
          conditionName: true,
          status: true,
        },
        take: 3,
      },
      displayName: true,
      deathDate: true,
      handle: true,
      id: true,
      image: true,
      relationshipsAsObject: {
        where: { deletedAt: null, isPublic: true },
        orderBy: { createdAt: "asc" as const },
        select: { createdByUserId: true, relationshipType: true },
        take: 10,
      },
      lifeStatus: true,
      memorial: {
        where: {
          deletedAt: null,
          isPublic: true,
        },
        select: {
          causeCategory: true,
          deathCountryCode: true,
          efficacyLagEvidence: {
            where: { deletedAt: null },
            orderBy: { diedBeforeApprovalDays: "asc" as const },
            select: {
              diedBeforeApprovalDays: true,
              interventionApprovalTimeline: {
                select: {
                  approvalDate: true,
                  brandName: true,
                  interventionName: true,
                },
              },
            },
            take: 1,
          },
          id: true,
          responsibleParties: {
            where: { deletedAt: null, isPublic: true },
            orderBy: [
              { isPrimary: "desc" as const },
              { createdAt: "asc" as const },
            ],
            select: { name: true },
            take: 3,
          },
          // Include both the public message AND the consent flag in one pass.
          // The PRD's evidence-package gate (PR9) only needs to know whether
          // any submitter consented; the message stays for the public profile.
          submissions: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" as const },
            select: {
              consentCourtEvidence: true,
              consentPublicDisplay: true,
              isPublic: true,
              memorialMessage: true,
            },
          },
        },
      },
      subject: {
        select: {
          courtCaseParties: {
            where: basePlaintiffPartyWhere,
            orderBy: { createdAt: "desc" as const },
            select: {
              createdAt: true,
              createdBy: { select: userDisplaySelect },
            },
            take: 1,
          },
        },
      },
    },
  });

  const party = person?.subject?.courtCaseParties[0];
  if (!person || !party) return null;
  const relationship =
    person.relationshipsAsObject.find(
      (candidate) => candidate.createdByUserId === party.createdBy?.id,
    ) ??
    person.relationshipsAsObject[0] ??
    null;

  return {
    conditions: person.conditions,
    person: {
      bio: person.bio,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      displayName: person.displayName,
      handle: person.handle,
      id: person.id,
      image: person.image,
      lifeStatus: person.lifeStatus,
    },
    memorial: person.memorial
      ? (() => {
          const topCondition =
            person.conditions.find(
              (c) => c.status === PersonConditionStatusEnum.CAUSE_OF_DEATH,
            )?.conditionName ??
            person.conditions[0]?.conditionName ??
            null;
          const lag = person.memorial.efficacyLagEvidence[0];
          const lagTimeline = lag?.interventionApprovalTimeline ?? null;
          const publicSubmission = person.memorial.submissions.find(
            (s) => s.consentPublicDisplay && s.isPublic,
          );
          const hasCourtEvidenceConsent = person.memorial.submissions.some(
            (s) =>
              s.consentCourtEvidence && s.consentPublicDisplay && s.isPublic,
          );
          return {
            causeCategory: person.memorial.causeCategory,
            conditionLabel: topCondition,
            deathCountryCode: person.memorial.deathCountryCode,
            efficacyLag:
              lag && lagTimeline?.approvalDate
                ? {
                    approvalDate: lagTimeline.approvalDate,
                    daysBeforeApproval: lag.diedBeforeApprovalDays ?? null,
                    interventionName: lagTimeline.brandName
                      ? `${lagTimeline.interventionName} (${lagTimeline.brandName})`
                      : lagTimeline.interventionName,
                  }
                : null,
            hasCourtEvidenceConsent,
            memorialId: person.memorial.id,
            memorialMessage: publicSubmission?.memorialMessage ?? null,
            responsibleParties: person.memorial.responsibleParties,
          };
        })()
      : null,
    relationshipType: relationship?.relationshipType ?? null,
    representedBy: getUserDisplayName(party.createdBy),
    filing: {
      createdAt: party.createdAt,
      publicComment: person.bio,
    },
  };
}
