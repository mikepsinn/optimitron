import {
  buildOrganizationActivationTaskDescription,
  getOrganizationActivationTaskKey,
  GLOBAL_SURVEY_NAME,
  ORGANIZATION_ACTIVATION_TASK_TITLE,
} from "@optimitron/data/campaign";
import { TREATY_REFERENDUM_SLUG } from "../constants.js";
import {
  OrgStatus,
  OrgType,
  OrganizationMemberRole,
  OrganizationNameKind,
  OrganizationReferendumPositionStatus,
  PersonLifeStatus,
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
  VotePosition,
  type Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";
import { normalizeOrganizationName } from "../organization-name.js";

export const IAM_ORGANIZATION_SOURCE_REF =
  "managed-organization:institute-for-accelerated-medicine";
export const IAM_ORGANIZATION_SLUG = "institute-for-accelerated-medicine";
export const IAM_ORGANIZATION_NAME = "Institute for Accelerated Medicine";
export const AMF_LEGAL_NAME = "Accelerated Medicine Foundation Inc";
export const IC2EWD_ORGANIZATION_NAME =
  "International Campaign to End War and Disease";
export const IAM_ORGANIZATION_NAMES_VERIFIED_AT_ISO =
  "2026-07-20T16:56:30.688Z";
export const MIKE_SINN_EMAIL = "m@thinkbynumbers.org";
export const MIKE_SINN_PERSON_SOURCE_REF = "managed-person:mike-sinn";

const CAMPAIGN_BASE_URL = "https://warondisease.org";
const IAM_WEBSITE_URL = "https://acceleratedmedicine.org";
const NONPROFIT_IDENTITY_SOURCE_URL = `${CAMPAIGN_BASE_URL}/terms`;
const NONPROFIT_COALITION_STRATEGY_URL =
  "https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy";

export const IAM_ORGANIZATION_NAMES = [
  {
    kind: OrganizationNameKind.LEGAL,
    name: AMF_LEGAL_NAME,
    sourceRef:
      "managed-organization-name:accelerated-medicine-foundation:legal",
    sourceUrl: NONPROFIT_IDENTITY_SOURCE_URL,
  },
  {
    kind: OrganizationNameKind.DBA,
    name: IAM_ORGANIZATION_NAME,
    sourceRef:
      "managed-organization-name:institute-for-accelerated-medicine:dba",
    sourceUrl: IAM_WEBSITE_URL,
  },
  {
    kind: OrganizationNameKind.DBA,
    name: IC2EWD_ORGANIZATION_NAME,
    sourceRef:
      "managed-organization-name:international-campaign-end-war-disease:dba",
    sourceUrl: NONPROFIT_IDENTITY_SOURCE_URL,
  },
  {
    kind: OrganizationNameKind.ACRONYM,
    name: "AMF",
    sourceRef: "managed-organization-name:accelerated-medicine-foundation:amf",
    sourceUrl: IAM_WEBSITE_URL,
  },
  {
    kind: OrganizationNameKind.ACRONYM,
    name: "IAM",
    sourceRef: "managed-organization-name:accelerated-medicine-foundation:iam",
    sourceUrl: IAM_WEBSITE_URL,
  },
  {
    kind: OrganizationNameKind.ACRONYM,
    name: "IC2EWD",
    sourceRef:
      "managed-organization-name:accelerated-medicine-foundation:ic2ewd",
    sourceUrl: CAMPAIGN_BASE_URL,
  },
] as const;

export async function syncManagedIamOrganization(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ upserted: boolean; dryRun: boolean }> {
  if (!options.apply) return { upserted: false, dryRun: true };

  const referendum = await prisma.referendum.findUniqueOrThrow({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  });

  const person = await prisma.person.upsert({
    where: { email: MIKE_SINN_EMAIL },
    update: {
      currentAffiliation: IAM_ORGANIZATION_NAME,
      deletedAt: null,
      displayName: "Mike Sinn",
      firstName: "Mike",
      handle: "mike",
      isPublic: true,
      lastName: "Sinn",
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: MIKE_SINN_PERSON_SOURCE_REF,
      website: CAMPAIGN_BASE_URL,
    },
    create: {
      currentAffiliation: IAM_ORGANIZATION_NAME,
      displayName: "Mike Sinn",
      email: MIKE_SINN_EMAIL,
      firstName: "Mike",
      handle: "mike",
      isPublic: true,
      lastName: "Sinn",
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: MIKE_SINN_PERSON_SOURCE_REF,
      website: CAMPAIGN_BASE_URL,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: MIKE_SINN_EMAIL },
    update: {
      deletedAt: null,
      emailVerified: new Date(),
      isAdmin: true,
      personId: person.id,
    },
    create: {
      email: MIKE_SINN_EMAIL,
      emailVerified: new Date(),
      isAdmin: true,
      personId: person.id,
      referralCode: "MIKE",
    },
  });

  const organizationSeed = {
    contactEmail: MIKE_SINN_EMAIL,
    creatorId: user.id,
    deletedAt: null,
    description:
      "Nonprofit accelerating clinical research to bring effective treatments to patients faster.",
    donationUrl: null,
    name: IAM_ORGANIZATION_NAME,
    slug: IAM_ORGANIZATION_SLUG,
    sourceRef: IAM_ORGANIZATION_SOURCE_REF,
    sourceUrl: IAM_WEBSITE_URL,
    squareLogoUrl: null,
    status: OrgStatus.APPROVED,
    type: OrgType.NONPROFIT,
    website: IAM_WEBSITE_URL,
    wordmarkLogoUrl: null,
  } satisfies Prisma.OrganizationUncheckedCreateInput;

  const existingOrganization = await prisma.organization.findFirst({
    where: {
      OR: [
        { sourceRef: IAM_ORGANIZATION_SOURCE_REF },
        { slug: IAM_ORGANIZATION_SLUG },
        ...IAM_ORGANIZATION_NAMES.filter(
          ({ kind }) => kind !== OrganizationNameKind.ACRONYM,
        ).map(({ name }) => ({
          name: {
            equals: name,
            mode: "insensitive" as const,
          },
        })),
      ],
    },
    select: { id: true },
  });

  const organization = existingOrganization
    ? await prisma.organization.update({
        where: { id: existingOrganization.id },
        data: organizationSeed,
      })
    : await prisma.organization.create({ data: organizationSeed });

  for (const organizationName of IAM_ORGANIZATION_NAMES) {
    const organizationNameSeed = {
      createdByUserId: user.id,
      deletedAt: null,
      kind: organizationName.kind,
      languageCode: "en",
      name: organizationName.name,
      normalizedName: normalizeOrganizationName(organizationName.name),
      organizationId: organization.id,
      sourceRef: organizationName.sourceRef,
      sourceUrl: organizationName.sourceUrl,
      verifiedAt: new Date(IAM_ORGANIZATION_NAMES_VERIFIED_AT_ISO),
      verifiedByUserId: user.id,
    } satisfies Prisma.OrganizationNameUncheckedCreateInput;

    const existingOrganizationName = await prisma.organizationName.findFirst({
      where: {
        OR: [
          { sourceRef: organizationName.sourceRef },
          {
            kind: organizationName.kind,
            normalizedName: organizationNameSeed.normalizedName,
            organizationId: organization.id,
          },
        ],
      },
      select: { id: true },
    });

    if (existingOrganizationName) {
      await prisma.organizationName.update({
        where: { id: existingOrganizationName.id },
        data: organizationNameSeed,
      });
    } else {
      await prisma.organizationName.create({ data: organizationNameSeed });
    }
  }

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: OrganizationMemberRole.OWNER },
    create: {
      organizationId: organization.id,
      role: OrganizationMemberRole.OWNER,
      userId: user.id,
    },
  });

  await prisma.organizationReferendumPosition.upsert({
    where: {
      organizationId_referendumId: {
        organizationId: organization.id,
        referendumId: referendum.id,
      },
    },
    update: {
      approvedByUserId: user.id,
      deletedAt: null,
      position: VotePosition.YES,
      statement: `${IAM_ORGANIZATION_NAME} supports the 1% Treaty and the ${GLOBAL_SURVEY_NAME}.`,
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: user.id,
    },
    create: {
      approvedByUserId: user.id,
      organizationId: organization.id,
      position: VotePosition.YES,
      referendumId: referendum.id,
      statement: `${IAM_ORGANIZATION_NAME} supports the 1% Treaty and the ${GLOBAL_SURVEY_NAME}.`,
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: user.id,
    },
  });

  const organizationToolsUrl = `${CAMPAIGN_BASE_URL}/organizations/${organization.id}`;
  const surveyUrl = `${CAMPAIGN_BASE_URL}/survey/${organization.slug}`;
  const contextJson = {
    organizationId: organization.id,
    organizationName: organization.name,
    organizationToolsUrl,
    surveyUrl,
  } satisfies Prisma.InputJsonValue;

  await prisma.task.upsert({
    where: { taskKey: getOrganizationActivationTaskKey(organization.id) },
    update: {
      assigneeOrganizationId: organization.id,
      contextJson,
      deletedAt: null,
      description: buildOrganizationActivationTaskDescription({
        baseUrl: CAMPAIGN_BASE_URL,
        coalitionStrategyUrl: NONPROFIT_COALITION_STRATEGY_URL,
        legalUrl: `${CAMPAIGN_BASE_URL}/join#organization-legal-notes`,
        organizationName: organization.name,
        organizationToolsUrl,
        surveyUrl,
      }),
      status: TaskStatus.ACTIVE,
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    },
    create: {
      assigneeOrganizationId: organization.id,
      category: TaskCategory.OUTREACH,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson,
      createdByUserId: user.id,
      description: buildOrganizationActivationTaskDescription({
        baseUrl: CAMPAIGN_BASE_URL,
        coalitionStrategyUrl: NONPROFIT_COALITION_STRATEGY_URL,
        legalUrl: `${CAMPAIGN_BASE_URL}/join#organization-legal-notes`,
        organizationName: organization.name,
        organizationToolsUrl,
        surveyUrl,
      }),
      estimatedEffortHours: 1,
      interestTags: ["1% Treaty", "organization", "member survey"],
      isPublic: true,
      roleTitle: "Organization supporter",
      skillTags: ["email", "website", "member outreach"],
      status: TaskStatus.ACTIVE,
      taskKey: getOrganizationActivationTaskKey(organization.id),
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    },
  });

  return { upserted: true, dryRun: false };
}

export function formatManagedIamOrganizationResult(result: {
  upserted: boolean;
  dryRun: boolean;
}): string {
  if (result.dryRun) return `${IAM_ORGANIZATION_NAME}: would sync (dry-run)`;
  return result.upserted
    ? `${IAM_ORGANIZATION_NAME}: synced`
    : `${IAM_ORGANIZATION_NAME}: unchanged`;
}
