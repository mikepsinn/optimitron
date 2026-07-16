import {
  DEMO_ORGANIZATION_NAME,
  DEMO_ORGANIZATION_SLUG,
  DEMO_ORGANIZATION_SOURCE_REF,
  DEMO_PERSON_SOURCE_REF,
  DEMO_USER_EMAIL,
} from "@optimitron/data/campaign";
import {
  OrgStatus,
  OrgType,
  OrganizationMemberRole,
  OrganizationReferendumPositionStatus,
  PersonLifeStatus,
  type Prisma,
  type PrismaClient,
  VotePosition,
} from "../generated/prisma/client.js";
import { TREATY_REFERENDUM_SLUG } from "../constants.js";

// Demo user — product-facing tour/onboarding account.
// Synced on every `pnpm db:sync:managed-data --apply`.
// The legacy email migration (demo@optimitron.org → demo@thinkbynumbers.org)
// and the raw-SQL "upsert failed" fallback from the old seed version are
// intentionally dropped — legacy email is long migrated, and raw-SQL inside
// a catch is the kind of error-swallowing this codebase bans (see
// feedback_dont_swallow_errors).

export const DEMO_EMAIL = DEMO_USER_EMAIL;

// Pre-hashed bcrypt(12) of "demo1234". Hardcoded so the demo password
// stays stable across environments without us shipping the plaintext.
const DEMO_PASSWORD_HASH =
  "$2b$12$Hy27qJOTykSezth61xRCJ..sMPVvzWxs9wZEEsEsYn9o3GaUYkGCa";

export async function syncManagedDemoUser(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ upserted: boolean; dryRun: boolean }> {
  if (!options.apply) return { upserted: false, dryRun: true };

  const referendum = await prisma.referendum.findUniqueOrThrow({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      password: DEMO_PASSWORD_HASH,
      emailVerified: new Date(),
    },
    create: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD_HASH,
      emailVerified: new Date(),
      referralCode: "DEMO",
    },
  });

  // Person owns the public-display fields (handle / displayName / image).
  const person = await prisma.person.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      deletedAt: null,
      displayName: "Demo User",
      handle: "demo",
      isPublic: false,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: DEMO_PERSON_SOURCE_REF,
    },
    create: {
      displayName: "Demo User",
      email: DEMO_EMAIL,
      handle: "demo",
      isPublic: false,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: DEMO_PERSON_SOURCE_REF,
    },
  });

  if (user.personId !== person.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { personId: person.id },
    });
  }

  const organizationSeed = {
    contactEmail: DEMO_EMAIL,
    creatorId: user.id,
    deletedAt: null,
    description:
      "A sandbox organization for trying campaign survey links, embeds, and outreach tools.",
    donationUrl: null,
    name: DEMO_ORGANIZATION_NAME,
    slug: DEMO_ORGANIZATION_SLUG,
    sourceRef: DEMO_ORGANIZATION_SOURCE_REF,
    sourceUrl: null,
    squareLogoUrl: null,
    status: OrgStatus.APPROVED,
    type: OrgType.NONPROFIT,
    website: "https://example.org",
    wordmarkLogoUrl: null,
  } satisfies Prisma.OrganizationUncheckedCreateInput;

  const existingOrganization = await prisma.organization.findFirst({
    where: {
      OR: [
        { sourceRef: DEMO_ORGANIZATION_SOURCE_REF },
        { slug: DEMO_ORGANIZATION_SLUG },
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
      statement:
        "Demo organization supports the 1% Treaty so humans can test campaign survey links, embeds, and outreach tools.",
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: user.id,
    },
    create: {
      approvedByUserId: user.id,
      organizationId: organization.id,
      position: VotePosition.YES,
      referendumId: referendum.id,
      statement:
        "Demo organization supports the 1% Treaty so humans can test campaign survey links, embeds, and outreach tools.",
      status: OrganizationReferendumPositionStatus.APPROVED,
      submittedByUserId: user.id,
    },
  });

  return { upserted: true, dryRun: false };
}

export function formatManagedDemoUserResult(
  result: { upserted: boolean; dryRun: boolean },
): string {
  if (result.dryRun) return "Demo user: would sync (dry-run)";
  return result.upserted ? "Demo user: synced" : "Demo user: unchanged";
}
