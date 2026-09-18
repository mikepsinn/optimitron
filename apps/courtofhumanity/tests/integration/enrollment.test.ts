import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ensureHumanityVGovernmentPlaintiffParty } from "@/lib/court-enrollment.server";
import { upsertTreatyVote } from "@/lib/treaty-votes.server";
import { ensureSubjectForPerson } from "@/lib/subject.server";
import { TREATY_REFERENDUM_SLUG } from "@optimitron/db";

const PREFIX = "court-enrollment-test-";
const owner = `${PREFIX}owner`;
const other = `${PREFIX}other`;
let createdReferendum = false;

async function cleanup() {
  await prisma.courtCaseParty.deleteMany({
    where: { createdByUserId: { startsWith: PREFIX } },
  });
  await prisma.referendumVote.deleteMany({
    where: { userId: { startsWith: PREFIX } },
  });
  await prisma.subject.deleteMany({
    where: { person: { createdByUserId: { startsWith: PREFIX } } },
  });
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.person.deleteMany({ where: { email: { startsWith: PREFIX } } });
}

beforeAll(async () => {
  const existing = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
  });
  if (!existing) {
    await prisma.referendum.create({
      data: {
        slug: TREATY_REFERENDUM_SLUG,
        title: "Test treaty",
        question: "Support treaty?",
        status: "ACTIVE",
      },
    });
    createdReferendum = true;
  } else {
    expect(existing.status).toBe("ACTIVE");
  }
});
beforeEach(async () => {
  await cleanup();
  for (const id of [owner, other]) {
    await prisma.user.create({ data: { id, email: `${id}@example.invalid` } });
    const person = await prisma.person.create({
      data: {
        displayName: id,
        email: `${id}@example.invalid`,
        createdByUserId: id,
        isPublic: true,
        lifeStatus: "LIVING",
      },
    });
    await prisma.user.update({ where: { id }, data: { personId: person.id } });
  }
});
afterAll(async () => {
  await cleanup();
  if (createdReferendum)
    await prisma.referendum.delete({ where: { slug: TREATY_REFERENDUM_SLUG } });
  await prisma.$disconnect();
});

async function ownerSubject() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: owner },
    include: { person: true },
  });
  return ensureSubjectForPerson(prisma, user.person!);
}

describe("Shared Court enrollment against PostgreSQL", () => {
  it("reuses the same party and respects the owner's latest public consent", async () => {
    const subject = await ownerSubject();
    const input = {
      createdByUserId: owner,
      displayName: "Consenting plaintiff",
      isPublic: true,
      subjectId: subject.id,
    };
    const first = await prisma.$transaction((tx) =>
      ensureHumanityVGovernmentPlaintiffParty(tx, input),
    );
    const second = await prisma.$transaction((tx) =>
      ensureHumanityVGovernmentPlaintiffParty(tx, {
        ...input,
        isPublic: false,
      }),
    );
    expect(second.id).toBe(first.id);
    expect(
      await prisma.courtCaseParty.count({ where: { subjectId: subject.id } }),
    ).toBe(1);
    expect(
      await prisma.courtCaseParty.findUniqueOrThrow({
        where: { id: first.id },
      }),
    ).toMatchObject({ isPublic: false, createdByUserId: owner });
    await expect(
      prisma.$transaction((tx) =>
        ensureHumanityVGovernmentPlaintiffParty(tx, {
          ...input,
          createdByUserId: other,
        }),
      ),
    ).rejects.toThrow();
    expect(
      await prisma.courtCaseParty.findUniqueOrThrow({
        where: { id: first.id },
      }),
    ).toMatchObject({
      isPublic: false,
      createdByUserId: owner,
      displayNameSnapshot: input.displayName,
    });
  });

  it("enrolls only YES voters and keeps private vote and person consent private", async () => {
    await upsertTreatyVote({ userId: owner, answer: "NO" });
    expect(
      await prisma.courtCaseParty.count({ where: { createdByUserId: owner } }),
    ).toBe(0);
    await upsertTreatyVote({ userId: owner, answer: "YES", isPublic: false });
    await upsertTreatyVote({ userId: owner, answer: "YES" });
    const parties = await prisma.courtCaseParty.findMany({
      where: { createdByUserId: owner },
    });
    expect(parties).toHaveLength(1);
    expect(parties[0]).toMatchObject({ isPublic: false });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: other } });
    await prisma.person.update({
      where: { id: user.personId! },
      data: { isPublic: false },
    });
    await upsertTreatyVote({ userId: other, answer: "YES", isPublic: true });
    expect(
      await prisma.courtCaseParty.findFirstOrThrow({
        where: { createdByUserId: other },
      }),
    ).toMatchObject({ isPublic: false });
  });

  it("rolls back a treaty vote when enrollment would transfer somebody else's private party", async () => {
    await upsertTreatyVote({ userId: owner, answer: "NO" });
    const subject = await ownerSubject();
    const party = await prisma.$transaction((tx) =>
      ensureHumanityVGovernmentPlaintiffParty(tx, {
        createdByUserId: other,
        displayName: "Private representation",
        isPublic: false,
        subjectId: subject.id,
      }),
    );
    await expect(
      upsertTreatyVote({ userId: owner, answer: "YES", isPublic: true }),
    ).rejects.toThrow();
    expect(
      await prisma.referendumVote.findFirstOrThrow({
        where: { userId: owner },
      }),
    ).toMatchObject({ answer: "NO" });
    expect(
      await prisma.courtCaseParty.findUniqueOrThrow({
        where: { id: party.id },
      }),
    ).toMatchObject({
      createdByUserId: other,
      isPublic: false,
      displayNameSnapshot: "Private representation",
    });
  });
});
