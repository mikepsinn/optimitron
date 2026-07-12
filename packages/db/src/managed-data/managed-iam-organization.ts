import {
  buildOrganizationActivationTaskDescription,
  CAMPAIGN_NAME,
  getOrganizationActivationTaskKey,
  GLOBAL_SURVEY_NAME,
  ORGANIZATION_ACTIVATION_TASK_TITLE,
} from "@optimitron/data/campaign";
import { TREATY_REFERENDUM_SLUG } from "../constants.js";
import {
  OrgStatus,
  OrgType,
  OrganizationReferendumPositionStatus,
  PersonLifeStatus,
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
  VotePosition,
  type Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";

export const IAM_ORGANIZATION_SOURCE_REF =
  "managed-organization:institute-for-accelerated-medicine";
export const IAM_ORGANIZATION_SLUG = "institute-for-accelerated-medicine";
export const IAM_ORGANIZATION_NAME = "Institute for Accelerated Medicine";
export const MIKE_SINN_EMAIL = "m@thinkbynumbers.org";
export const MIKE_SINN_PERSON_SOURCE_REF = "managed-person:mike-sinn";

const CAMPAIGN_BASE_URL = "https://warondisease.org";
const IAM_WEBSITE_URL = "https://acceleratedmedicine.org";
const NONPROFIT_COALITION_STRATEGY_URL =
  "https://manual.warondisease.org/knowledge/strategy/nonprofit-coalition-strategy";

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
        {
          name: {
            equals: IAM_ORGANIZATION_NAME,
            mode: "insensitive",
          },
        },
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

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: "owner" },
    create: {
      organizationId: organization.id,
      role: "owner",
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

export function formatManagedIamOrganizationResult(
  result: { upserted: boolean; dryRun: boolean },
): string {
  if (result.dryRun) return `${IAM_ORGANIZATION_NAME}: would sync (dry-run)`;
  return result.upserted
    ? `${IAM_ORGANIZATION_NAME}: synced`
    : `${IAM_ORGANIZATION_NAME}: unchanged`;
}
