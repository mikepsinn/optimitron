import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth-utils", () => ({
  requireAuth: async () => ({ userId: "court-jury-http-voter" }),
}));
vi.mock("@/lib/referral.server", () => ({
  findUserByHandleOrReferralCode: async () => null,
}));
import { McpScope } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../../app/api/referendums/[slug]/vote/route";
import {
  openCourtCaseJuryVote,
  upsertCourtCase,
} from "../../lib/court-data.server";

const prefix = "court-jury-http-";
const voter = `${prefix}voter`;
const actor = {
  userId: `${prefix}creator`,
  isAdmin: false,
  scopes: [McpScope.EARTHDATA_WRITE],
};
async function cleanup() {
  await prisma.referendumVote.deleteMany({ where: { userId: voter } });
  await prisma.courtCase.deleteMany({
    where: { slug: { startsWith: prefix } },
  });
  await prisma.referendum.deleteMany({
    where: { slug: { startsWith: `court-${prefix}` } },
  });
  await prisma.person.deleteMany({
    where: { createdByUserId: { in: [voter, actor.userId] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [voter, actor.userId] } },
  });
}
beforeEach(async () => {
  await cleanup();
  for (const userId of [voter, actor.userId])
    await prisma.user.create({
      data: { id: userId, email: `${userId}@example.invalid` },
    });
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});
async function ballot() {
  const courtCase = await upsertCourtCase(
    { slug: `${prefix}case`, title: "Public jury case", isPublic: true },
    actor,
    prisma,
  );
  await openCourtCaseJuryVote({ caseIdOrSlug: courtCase.id }, actor, prisma);
  const linked = await prisma.courtCase.findUniqueOrThrow({
    where: { id: courtCase.id },
    include: { juryReferendum: true },
  });
  return { courtCase, referendum: linked.juryReferendum! };
}
function post(slug: string) {
  return POST(
    new Request(`https://courtofhumanity.org/api/referendums/${slug}/vote`, {
      method: "POST",
      body: JSON.stringify({
        answer: "YES",
        userId: actor.userId,
        personId: "spoofed",
        voteSource: "REPRESENTED",
        makePublic: false,
        displayName: "Must not rename the voter",
      }),
    }),
    { params: Promise.resolve({ slug }) },
  );
}
function get(slug: string) {
  return GET(
    new Request(`https://courtofhumanity.org/api/referendums/${slug}/vote`),
    { params: Promise.resolve({ slug }) },
  );
}
describe("Public generic Court jury HTTP voting", () => {
  it("accepts an MCP-created jury ballot for a different signed-in voter without Humanity enrollment", async () => {
    const { referendum } = await ballot();
    const person = await prisma.person.create({
      data: {
        displayName: "Public voter",
        isPublic: true,
        lifeStatus: "LIVING",
        createdByUserId: voter,
      },
    });
    await prisma.user.update({
      where: { id: voter },
      data: { personId: person.id },
    });
    expect((await post(referendum.slug)).status).toBe(200);
    const saved = await prisma.referendumVote.findFirstOrThrow({
      where: { referendumId: referendum.id },
    });
    expect(saved).toMatchObject({
      userId: voter,
      answer: "YES",
      voteSource: "SELF",
      isPublic: false,
    });
    expect(
      await prisma.person.findUniqueOrThrow({ where: { id: person.id } }),
    ).toMatchObject({ displayName: "Public voter", isPublic: true });
    const response = await get(referendum.slug);
    expect(response.status).toBe(200);
    expect((await response.json()).vote.answer).toBe("YES");
    expect(
      await prisma.courtCaseParty.count({ where: { createdByUserId: voter } }),
    ).toBe(0);
  });
  it("rejects both reads and writes for unpublished, deleted, unlinked, or private-case ballots", async () => {
    const { courtCase, referendum } = await ballot();
    const checkDenied = async () => {
      expect((await post(referendum.slug)).status).toBe(404);
      expect((await get(referendum.slug)).status).toBe(404);
    };
    await prisma.referendum.update({
      where: { id: referendum.id },
      data: { publishedAt: null },
    });
    await checkDenied();
    await prisma.referendum.update({
      where: { id: referendum.id },
      data: { publishedAt: new Date(), deletedAt: new Date() },
    });
    await checkDenied();
    await prisma.referendum.update({
      where: { id: referendum.id },
      data: { deletedAt: null },
    });
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { isPublic: false },
    });
    await checkDenied();
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { isPublic: true, deletedAt: new Date() },
    });
    await checkDenied();
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { deletedAt: null, juryReferendumId: null },
    });
    await checkDenied();
    expect(
      await prisma.referendumVote.count({
        where: { referendumId: referendum.id },
      }),
    ).toBe(0);
  });
  it("accepts public claim ballots only while both the claim and its case remain public", async () => {
    const { courtCase, referendum } = await ballot();
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { juryReferendumId: null },
    });
    const claim = await prisma.courtCaseClaim.create({
      data: {
        caseId: courtCase.id,
        title: "Claim jury",
        argumentMarkdown: "Public claim",
        juryReferendumId: referendum.id,
        isPublic: true,
        createdByUserId: actor.userId,
      },
    });
    expect((await post(referendum.slug)).status).toBe(200);
    for (const data of [
      { isPublic: false, deletedAt: null },
      { isPublic: true, deletedAt: new Date() },
    ]) {
      await prisma.courtCaseClaim.update({ where: { id: claim.id }, data });
      expect((await get(referendum.slug)).status).toBe(404);
      expect((await post(referendum.slug)).status).toBe(404);
    }
    await prisma.courtCaseClaim.update({
      where: { id: claim.id },
      data: { isPublic: true, deletedAt: null },
    });
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { isPublic: false },
    });
    expect((await get(referendum.slug)).status).toBe(404);
  });
  it("does not accept new votes on a closed public jury", async () => {
    const { referendum } = await ballot();
    await prisma.referendum.update({
      where: { id: referendum.id },
      data: { status: "CLOSED" },
    });
    expect((await post(referendum.slug)).status).toBe(400);
    expect(
      await prisma.referendumVote.count({
        where: { referendumId: referendum.id },
      }),
    ).toBe(0);
  });
});
