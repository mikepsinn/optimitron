import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth-utils", () => ({
  requireAuth: async () => ({ userId: "court-gallery-test-" }),
}));
vi.mock("@/lib/referral.server", () => ({
  findUserByHandleOrReferralCode: async () => null,
}));
import { POST } from "../../app/api/referendums/[slug]/vote/route";
import { prisma } from "@/lib/prisma";
import { getRepresentedPeopleGalleryData } from "@/lib/represented-people.server";
import {
  getHumanityVGovernmentPlaintiffCount,
  getHumanityVGovernmentVerdictStats,
} from "../../lib/humanity-v-government-case.server";
import {
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
} from "@optimitron/db";

const PREFIX = "court-gallery-test-";
let caseId: string;
let personId: string;
let originalCase: { isPublic: boolean; deletedAt: Date | null } | null;
let createdVerdict = false;
let originalVerdict: {
  publishedAt: Date | null;
  deletedAt: Date | null;
} | null;

beforeAll(async () => {
  originalCase = await prisma.courtCase.findUnique({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    select: { isPublic: true, deletedAt: true },
  });
  const court = await prisma.courtCase.upsert({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    create: {
      slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
      title: "Test court",
      isPublic: true,
    },
    update: { isPublic: true, deletedAt: null },
  });
  caseId = court.id;
  await prisma.user.create({
    data: { id: PREFIX, email: `${PREFIX}@example.invalid` },
  });
  const person = await prisma.person.create({
    data: {
      displayName: PREFIX,
      createdByUserId: PREFIX,
      isPublic: true,
      lifeStatus: "LIVING",
    },
  });
  personId = person.id;
  await prisma.user.update({ where: { id: PREFIX }, data: { personId } });
  const subject = await prisma.subject.create({
    data: { subjectType: "PERSON", personId, displayName: PREFIX },
  });
  await prisma.courtCaseParty.create({
    data: {
      caseId,
      subjectId: subject.id,
      role: "NAMED_PLAINTIFF",
      isPublic: true,
      createdByUserId: PREFIX,
    },
  });
});
afterAll(async () => {
  await prisma.referendumVote.deleteMany({ where: { personId } });
  await prisma.courtCaseParty.deleteMany({
    where: { createdByUserId: PREFIX },
  });
  await prisma.subject.deleteMany({ where: { personId } });
  await prisma.person.deleteMany({ where: { id: personId } });
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
  if (originalCase)
    await prisma.courtCase.update({
      where: { id: caseId },
      data: originalCase,
    });
  else await prisma.courtCase.delete({ where: { id: caseId } });
  if (createdVerdict)
    await prisma.referendum.delete({
      where: { slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
    });
  else if (originalVerdict)
    await prisma.referendum.update({
      where: { slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
      data: originalVerdict,
    });
  await prisma.$disconnect();
});

describe("Public Court gallery privacy", () => {
  it("hides all rows and counts when the case is private or deleted", async () => {
    expect(
      (await getRepresentedPeopleGalleryData())!.people.some(
        (row) => row.personId === personId,
      ),
    ).toBe(true);
    for (const data of [
      { isPublic: false, deletedAt: null },
      { isPublic: true, deletedAt: new Date() },
    ]) {
      await prisma.courtCase.update({ where: { id: caseId }, data });
      const gallery = (await getRepresentedPeopleGalleryData())!;
      expect(gallery.people).toEqual([]);
      expect(gallery.filteredCount).toBe(0);
      expect(gallery.representedHumanCount).toBe(0);
      expect(await getHumanityVGovernmentPlaintiffCount()).toBe(0);
    }
    await prisma.courtCase.update({
      where: { id: caseId },
      data: { isPublic: true, deletedAt: null },
    });
  });
  it("excludes stale public parties whose person became private or deleted", async () => {
    const publicCount = await getHumanityVGovernmentPlaintiffCount();
    for (const data of [
      { isPublic: false, deletedAt: null },
      { isPublic: true, deletedAt: new Date() },
    ]) {
      await prisma.person.update({ where: { id: personId }, data });
      expect(
        (await getRepresentedPeopleGalleryData())!.people.some(
          (row) => row.personId === personId,
        ),
      ).toBe(false);
      expect(await getHumanityVGovernmentPlaintiffCount()).toBe(
        publicCount - 1,
      );
    }
    await prisma.person.update({
      where: { id: personId },
      data: { isPublic: true, deletedAt: null },
    });
  });
  it("excludes private votes and unpublished verdicts from public aggregates", async () => {
    originalVerdict = await prisma.referendum.findUnique({
      where: { slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
      select: { publishedAt: true, deletedAt: true },
    });
    createdVerdict = !originalVerdict;
    const referendum = await prisma.referendum.upsert({
      where: { slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
      create: {
        slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
        title: "Verdict",
        question: "Verdict?",
        publishedAt: new Date(),
        status: "ACTIVE",
      },
      update: { publishedAt: new Date(), deletedAt: null },
    });
    const baseline = await getHumanityVGovernmentVerdictStats();
    const vote = await prisma.referendumVote.create({
      data: {
        referendumId: referendum.id,
        personId,
        userId: PREFIX,
        answer: "YES",
        isPublic: false,
      },
    });
    expect((await getHumanityVGovernmentVerdictStats()).yesCount).toBe(
      baseline.yesCount,
    );
    await prisma.referendumVote.update({
      where: { id: vote.id },
      data: { isPublic: true },
    });
    expect((await getHumanityVGovernmentVerdictStats()).yesCount).toBe(
      baseline.yesCount + 1,
    );
    await prisma.referendum.update({
      where: { id: referendum.id },
      data: { publishedAt: null },
    });
    expect((await getHumanityVGovernmentVerdictStats()).yesCount).toBe(0);
  });
  it("rolls back HTTP verdict and profile writes when private enrollment belongs to another actor", async () => {
    await prisma.referendum.update({
      where: { slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG },
      data: { publishedAt: new Date() },
    });
    await prisma.user.create({
      data: { id: `${PREFIX}other`, email: `${PREFIX}other@example.invalid` },
    });
    await prisma.courtCaseParty.updateMany({
      where: { createdByUserId: PREFIX },
      data: { createdByUserId: `${PREFIX}other`, isPublic: false },
    });
    await prisma.referendumVote.deleteMany({ where: { personId } });
    const response = await POST(
      new Request("https://courtofhumanity.org/api/referendums/verdict/vote", {
        method: "POST",
        body: JSON.stringify({
          answer: "YES",
          makePublic: true,
          displayName: "Must roll back",
        }),
      }),
      {
        params: Promise.resolve({
          slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
        }),
      },
    );
    expect(response.status).toBe(500);
    expect(await prisma.referendumVote.count({ where: { personId } })).toBe(0);
    expect(
      (await prisma.person.findUniqueOrThrow({ where: { id: personId } }))
        .displayName,
    ).toBe(PREFIX);
    const party = await prisma.courtCaseParty.findFirstOrThrow({
      where: { createdByUserId: `${PREFIX}other` },
    });
    expect(party.isPublic).toBe(false);
    await prisma.courtCaseParty.delete({ where: { id: party.id } });
  });
});
