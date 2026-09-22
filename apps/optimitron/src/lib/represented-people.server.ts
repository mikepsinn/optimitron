import {
  CourtCasePartyRole,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  PersonConditionStatus as PersonConditionStatusEnum,
  PersonLifeStatus,
  type PersonConditionStatus,
  type PersonDeathCauseCategory,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

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
