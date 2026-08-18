import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_ORGANIZATION_SLUG } from "@optimitron/data/campaign";
import { TREATY_REFERENDUM_SLUG } from "../src/constants.js";
import {
  OrganizationMemberRole,
  PrismaClient,
  ReferendumVoteSource,
  VotePosition,
} from "../src/generated/prisma/client.js";
import { DEMO_EMAIL } from "../src/managed-data/managed-demo-user.js";

function assertLocalVisualFixtureTarget(connectionString: string) {
  if (process.env.SITE_APP_VISUAL_FIXTURES !== "1") {
    throw new Error(
      "Refusing to write visual fixtures without SITE_APP_VISUAL_FIXTURES=1.",
    );
  }

  const hostname = new URL(connectionString).hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1", "postgres"].includes(hostname)) {
    throw new Error(
      `Refusing to write visual fixtures to non-local database host ${hostname}.`,
    );
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

assertLocalVisualFixtureTarget(connectionString);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const VISUAL_FIXTURE_CREATED_AT = new Date("2026-01-15T12:00:00.000Z");

try {
  const [user, referendum] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { email: DEMO_EMAIL },
      select: {
        id: true,
        organizationMemberships: {
          where: {
            organization: { slug: DEMO_ORGANIZATION_SLUG },
            role: OrganizationMemberRole.OWNER,
          },
          select: { id: true },
        },
        personId: true,
      },
    }),
    prisma.referendum.findUniqueOrThrow({
      where: { slug: TREATY_REFERENDUM_SLUG },
      select: { id: true },
    }),
  ]);

  if (!user.personId) {
    throw new Error("Managed demo user must have a Person before visual capture.");
  }
  if (user.organizationMemberships.length !== 1) {
    throw new Error(
      "Managed demo user must own the demo organization before visual capture.",
    );
  }

  await prisma.$transaction([
    prisma.organization.updateMany({
      where: { deletedAt: null },
      data: { createdAt: VISUAL_FIXTURE_CREATED_AT },
    }),
    prisma.user.updateMany({
      where: { deletedAt: null },
      data: { createdAt: VISUAL_FIXTURE_CREATED_AT },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    }),
    prisma.referendumVote.upsert({
      where: {
        referendumId_personId: {
          referendumId: referendum.id,
          personId: user.personId,
        },
      },
      update: {
        answer: VotePosition.YES,
        deletedAt: null,
        isPublic: false,
        voteSource: ReferendumVoteSource.SELF,
      },
      create: {
        answer: VotePosition.YES,
        isPublic: false,
        originUrl: "http://127.0.0.1/site-app-visual-fixture",
        personId: user.personId,
        referendumId: referendum.id,
        userId: user.id,
        voteSource: ReferendumVoteSource.SELF,
      },
    }),
  ]);

  console.log("Prepared local authenticated site-app visual fixtures.");
} finally {
  await prisma.$disconnect();
}
