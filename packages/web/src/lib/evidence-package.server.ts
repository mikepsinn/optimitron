import {
  PersonConditionStatus,
  PersonMemorialEvidenceKind,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface EvidencePackage {
  caseTitle: string;
  decedent: {
    name: string;
    birthDate: string | null;
    deathDate: string | null;
    ageYears: number | null;
    civilianStatus: string;
    wasChild: boolean | null;
  };
  location: {
    countryCode: string | null;
    description: string | null;
  };
  conflict: {
    name: string | null;
    slug: string | null;
  } | null;
  causeCategory: string;
  primaryCondition: {
    name: string;
    code: string | null;
    codeSystem: string | null;
  } | null;
  efficacyLag: {
    interventionName: string;
    approvalDate: string;
    daysBeforeApproval: number | null;
  } | null;
  responsibleParties: Array<{
    jurisdictionCode: string | null;
    jurisdictionName: string | null;
    name: string | null;
    role: string | null;
    isPrimary: boolean;
  }>;
  circumstances: string | null;
  submitters: Array<{
    name: string;
    relationship: string | null;
    submittedAt: string;
    consentCourtEvidence: boolean;
    consentCourtEvidenceAt: string | null;
    memorialMessage: string | null;
  }>;
  witnesses: Array<{
    title: string | null;
    description: string | null;
    sourceUrl: string;
  }>;
  supportingDocuments: Array<{
    kind: string;
    title: string | null;
    description: string | null;
    sourceUrl: string;
    containsSensitiveData: boolean;
  }>;
  packageGeneratedAt: string;
  packageVersion: 1;
}

export class EvidencePackageNotConsentedError extends Error {
  constructor() {
    super("No submitter has consented to court-evidence use of this memorial.");
    this.name = "EvidencePackageNotConsentedError";
  }
}

export class MemorialNotFoundError extends Error {
  constructor() {
    super("Memorial not found.");
    this.name = "MemorialNotFoundError";
  }
}

const memorialInclude = {
  person: {
    select: {
      birthDate: true,
      conditions: {
        where: {
          deletedAt: null,
          isPublic: true,
          status: PersonConditionStatus.CAUSE_OF_DEATH,
        },
        orderBy: { createdAt: "asc" as const },
        select: {
          conditionCode: true,
          conditionCodeSystem: true,
          conditionName: true,
        },
        take: 1,
      },
      deathDate: true,
      displayName: true,
      relationshipsAsObject: {
        where: { deletedAt: null, isPublic: true },
        orderBy: { createdAt: "asc" as const },
        select: {
          createdByUserId: true,
          relationshipType: true,
        },
      },
    },
  },
  conflict: { select: { name: true, slug: true } },
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
  responsibleParties: {
    where: { deletedAt: null, isPublic: true },
    orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
    select: {
      isPrimary: true,
      jurisdiction: { select: { code: true, name: true } },
      name: true,
      roleSlug: true,
    },
  },
  evidence: {
    where: { containsSensitiveData: false, deletedAt: null, isPublic: true },
    orderBy: { createdAt: "asc" as const },
    select: {
      containsSensitiveData: true,
      description: true,
      evidenceKind: true,
      isPublic: true,
      sourceUrl: true,
      title: true,
    },
  },
  submissions: {
    where: {
      consentCourtEvidence: true,
      consentPublicDisplay: true,
      deletedAt: null,
      isPublic: true,
    },
    orderBy: { createdAt: "asc" as const },
    select: {
      consentCourtEvidence: true,
      consentCourtEvidenceAt: true,
      consentPublicDisplay: true,
      createdAt: true,
      isPublic: true,
      memorialMessage: true,
      submittedByUser: {
        select: {
          id: true,
          person: {
            select: {
              displayName: true,
              id: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PersonMemorialInclude;

function calculateAgeYears(
  birth: Date | null,
  death: Date | null,
): number | null {
  if (!birth || !death) return null;
  const years =
    (death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(years) || years < 0) return null;
  return Math.floor(years);
}

function formatRelationship(slug: string | null): string | null {
  if (!slug) return null;
  return slug.replace(/-/g, " ");
}

/**
 * Build a structured evidence package for a memorial. Gated on at least one
 * submitter having consented to court-evidence use. Pulls from PersonMemorial,
 * PersonMemorialSubmission, PersonMemorialResponsibleParty, PersonMemorialEvidence,
 * PersonRelationship. Witnesses are PersonMemorialEvidence rows with
 * evidenceKind = WITNESS_STATEMENT. PRD: TODO.md:1312-1329.
 */
export async function buildEvidencePackage(
  memorialId: string,
): Promise<EvidencePackage> {
  const memorial = await prisma.personMemorial.findUnique({
    where: { id: memorialId, deletedAt: null },
    include: memorialInclude,
  });
  if (!memorial) {
    throw new MemorialNotFoundError();
  }

  const consentingSubmissions = memorial.submissions.filter(
    (submission) =>
      submission.consentCourtEvidence &&
      submission.consentPublicDisplay &&
      submission.isPublic,
  );
  if (consentingSubmissions.length === 0) {
    throw new EvidencePackageNotConsentedError();
  }

  const primaryParty = memorial.responsibleParties[0];
  const partyLabel =
    primaryParty?.jurisdiction?.name ?? primaryParty?.name ?? "Unattributed";

  const relationshipByUserId = new Map<string, string | null>();
  for (const rel of memorial.person.relationshipsAsObject) {
    if (rel.createdByUserId) {
      relationshipByUserId.set(
        rel.createdByUserId,
        formatRelationship(rel.relationshipType),
      );
    }
  }

  const submitters = consentingSubmissions.map((submission) => {
    const userPerson = submission.submittedByUser?.person ?? null;
    const submitterUserId = submission.submittedByUser?.id ?? null;
    return {
      name: userPerson?.displayName ?? "Submitter",
      relationship: submitterUserId
        ? (relationshipByUserId.get(submitterUserId) ?? null)
        : null,
      submittedAt: submission.createdAt.toISOString(),
      consentCourtEvidence: submission.consentCourtEvidence,
      consentCourtEvidenceAt: submission.consentCourtEvidenceAt
        ? submission.consentCourtEvidenceAt.toISOString()
        : null,
      memorialMessage: submission.memorialMessage,
    };
  });

  const primarySubmitterName = submitters[0]?.name ?? "Submitter";
  const decedentName = memorial.person.displayName;
  const civilianStatusLabel = memorial.civilianStatus.toLowerCase();

  const witnesses = memorial.evidence
    .filter(
      (row) =>
        row.evidenceKind === PersonMemorialEvidenceKind.WITNESS_STATEMENT &&
        row.isPublic &&
        !row.containsSensitiveData,
    )
    .map((row) => ({
      title: row.title,
      description: row.description,
      sourceUrl: row.sourceUrl ?? "",
    }))
    .filter((row) => row.sourceUrl);

  const supportingDocuments = memorial.evidence
    .filter(
      (row) =>
        row.evidenceKind !== PersonMemorialEvidenceKind.WITNESS_STATEMENT &&
        row.isPublic &&
        !row.containsSensitiveData,
    )
    .map((row) => ({
      kind: row.evidenceKind,
      title: row.title,
      description: row.description,
      sourceUrl: row.sourceUrl ?? "",
      containsSensitiveData: row.containsSensitiveData,
    }))
    .filter((row) => row.sourceUrl);

  const primaryCondition = memorial.person.conditions[0] ?? null;
  const lag = memorial.efficacyLagEvidence[0];
  const lagTimeline = lag?.interventionApprovalTimeline ?? null;

  return {
    caseTitle: `${primarySubmitterName} v. ${partyLabel}`,
    decedent: {
      name: decedentName,
      birthDate: memorial.person.birthDate?.toISOString() ?? null,
      deathDate: memorial.person.deathDate?.toISOString() ?? null,
      ageYears: calculateAgeYears(
        memorial.person.birthDate,
        memorial.person.deathDate,
      ),
      civilianStatus: civilianStatusLabel,
      wasChild: memorial.wasChild,
    },
    location: {
      countryCode: memorial.deathCountryCode,
      description: memorial.deathLocation,
    },
    conflict: memorial.conflict
      ? { name: memorial.conflict.name, slug: memorial.conflict.slug }
      : null,
    causeCategory: memorial.causeCategory,
    primaryCondition: primaryCondition
      ? {
          name: primaryCondition.conditionName,
          code: primaryCondition.conditionCode,
          codeSystem: primaryCondition.conditionCodeSystem,
        }
      : null,
    efficacyLag:
      lag && lagTimeline?.approvalDate
        ? {
            interventionName: lagTimeline.brandName
              ? `${lagTimeline.interventionName} (${lagTimeline.brandName})`
              : lagTimeline.interventionName,
            approvalDate: lagTimeline.approvalDate.toISOString(),
            daysBeforeApproval: lag.diedBeforeApprovalDays,
          }
        : null,
    responsibleParties: memorial.responsibleParties.map((party) => ({
      jurisdictionCode: party.jurisdiction?.code ?? null,
      jurisdictionName: party.jurisdiction?.name ?? null,
      name: party.name,
      role: party.roleSlug,
      isPrimary: party.isPrimary,
    })),
    circumstances: memorial.circumstances,
    submitters,
    witnesses,
    supportingDocuments,
    packageGeneratedAt: new Date().toISOString(),
    packageVersion: 1,
  };
}
