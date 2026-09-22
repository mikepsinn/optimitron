import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { McpScope } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";
import {
  addCourtCaseClaim,
  addCourtCaseEvidence,
  addCourtCaseHarm,
  addCourtCaseParty,
  addCourtCaseRemedy,
  getCourtCase,
  openCourtCaseJuryVote,
  upsertCourtCase,
  type CourtActor,
} from "../../lib/court-data.server";

const PREFIX = "court-domain-test-";
const owner: CourtActor = {
  userId: `${PREFIX}owner`,
  isAdmin: false,
  scopes: [McpScope.EARTHDATA_WRITE],
};
const other: CourtActor = {
  userId: `${PREFIX}other`,
  isAdmin: false,
  scopes: [McpScope.EARTHDATA_WRITE],
};
const moderator: CourtActor = {
  userId: `${PREFIX}moderator`,
  isAdmin: true,
  scopes: [McpScope.EARTHDATA_WRITE, McpScope.EARTHDATA_ADMIN],
};
const adminWithoutScope: CourtActor = {
  ...moderator,
  scopes: [McpScope.EARTHDATA_WRITE],
};

async function cleanup() {
  await prisma.courtCase.deleteMany({
    where: { slug: { startsWith: PREFIX } },
  });
  await prisma.referendum.deleteMany({
    where: { slug: { startsWith: `court-${PREFIX}` } },
  });
  await prisma.subject.deleteMany({
    where: { externalId: { startsWith: PREFIX } },
  });
  await prisma.task.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.sourceArtifact.deleteMany({
    where: { sourceKey: { startsWith: PREFIX } },
  });
  await prisma.person.deleteMany({ where: { id: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
}
async function makeCase(suffix: string, isPublic = true, actor = owner) {
  return upsertCourtCase(
    { title: `Case ${suffix}`, slug: `${PREFIX}${suffix}`, isPublic },
    actor,
    prisma,
  );
}
async function makeSubject(suffix: string, isPublic: boolean, actor = owner) {
  const person = await prisma.person.create({
    data: {
      id: `${PREFIX}${suffix}`,
      displayName: suffix,
      isPublic,
      createdByUserId: actor.userId,
    },
  });
  return prisma.subject.create({
    data: {
      externalId: `${PREFIX}${suffix}`,
      subjectType: "PERSON",
      personId: person.id,
      displayName: suffix,
    },
  });
}

beforeEach(async () => {
  await cleanup();
  for (const actor of [owner, other, moderator])
    await prisma.user.create({
      data: {
        id: actor.userId,
        email: `${actor.userId}@example.invalid`,
        isAdmin: actor.isAdmin,
      },
    });
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Court domain permissions against PostgreSQL", () => {
  it("denies every case mutation to an unrelated writer and rejects deleted cases", async () => {
    const courtCase = await makeCase("all-guards");
    const operations = [
      () =>
        upsertCourtCase(
          { id: courtCase.id, title: "Hijack", isPublic: true },
          other,
          prisma,
        ),
      () =>
        addCourtCaseParty(
          {
            caseId: courtCase.id,
            subjectExternalId: `${PREFIX}unwanted`,
            role: "RESPONDENT",
          },
          other,
          prisma,
        ),
      () =>
        addCourtCaseClaim(
          { caseId: courtCase.id, title: "Claim", argumentMarkdown: "Reason" },
          other,
          prisma,
        ),
      () =>
        addCourtCaseHarm(
          { caseId: courtCase.id, title: "Harm" },
          other,
          prisma,
        ),
      () =>
        addCourtCaseEvidence(
          {
            caseId: courtCase.id,
            title: "Evidence",
            sourceUrl: "https://example.org/evidence",
          },
          other,
          prisma,
        ),
      () =>
        addCourtCaseRemedy(
          { caseId: courtCase.id, title: "Remedy", bodyMarkdown: "Fix it" },
          other,
          prisma,
        ),
      () =>
        openCourtCaseJuryVote({ caseIdOrSlug: courtCase.id }, other, prisma),
    ];
    for (const operation of operations)
      await expect(operation()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await prisma.subject.count({
        where: { externalId: `${PREFIX}unwanted` },
      }),
    ).toBe(0);
    await expect(
      getCourtCase({ id: courtCase.id }, { ...owner, scopes: [] }, prisma),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await prisma.courtCase.update({
      where: { id: courtCase.id },
      data: { deletedAt: new Date("2026-01-01T00:00:00Z") },
    });
    await expect(
      getCourtCase({ id: courtCase.id }, owner, prisma),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      addCourtCaseHarm({ caseId: courtCase.id, title: "Harm" }, owner, prisma),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("keeps shared subject identity unchanged and rejects private or cross-case jury publication", async () => {
    const courtCase = await makeCase("shared-subject");
    const existing = await prisma.subject.create({
      data: {
        subjectType: "COHORT",
        externalId: `${PREFIX}shared`,
        displayName: "Original cohort",
      },
    });
    await addCourtCaseParty(
      {
        caseId: courtCase.id,
        subjectExternalId: existing.externalId,
        subjectDisplayName: "New label",
        role: "RESPONDENT",
      },
      owner,
      prisma,
    );
    expect(
      (await prisma.subject.findUniqueOrThrow({ where: { id: existing.id } }))
        .displayName,
    ).toBe("Original cohort");
    await expect(
      addCourtCaseParty(
        {
          caseId: courtCase.id,
          subjectExternalId: `${PREFIX}fake-person`,
          subjectType: "PERSON",
          role: "NAMED_PLAINTIFF",
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const privateCase = await makeCase("private-jury", false);
    await expect(
      openCourtCaseJuryVote({ caseIdOrSlug: privateCase.id }, owner, prisma),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const jury = await openCourtCaseJuryVote(
      { caseIdOrSlug: courtCase.id },
      owner,
      prisma,
    );
    const secondCase = await makeCase("other-jury");
    await expect(
      upsertCourtCase(
        {
          id: secondCase.id,
          slug: secondCase.slug,
          title: "Reuse",
          isPublic: true,
          juryReferendumId: jury.referendum.id,
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await prisma.referendum.update({
      where: { id: jury.referendum.id },
      data: { status: "CLOSED" },
    });
    await expect(
      openCourtCaseJuryVote({ caseIdOrSlug: courtCase.id }, owner, prisma),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (
        await prisma.referendum.findUniqueOrThrow({
          where: { id: jury.referendum.id },
        })
      ).status,
    ).toBe("CLOSED");
  });

  it("enforces creator ownership, public-only moderation, and trusted attribution", async () => {
    const privateCase = await upsertCourtCase(
      {
        title: "Private",
        slug: `${PREFIX}private`,
        createdByUserId: other.userId,
      },
      owner,
      prisma,
    );
    expect(privateCase.createdByUserId).toBe(owner.userId);
    await expect(
      getCourtCase({ id: privateCase.id }, other, prisma),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      getCourtCase({ id: privateCase.id }, moderator, prisma),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const publicCase = await makeCase("public");
    const input = {
      caseId: publicCase.id,
      title: "Claim",
      argumentMarkdown: "Reason",
      createdByUserId: other.userId,
    };
    await expect(addCourtCaseClaim(input, other, prisma)).rejects.toMatchObject(
      { code: "FORBIDDEN" },
    );
    await expect(
      addCourtCaseClaim(input, adminWithoutScope, prisma),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      addCourtCaseClaim(
        input,
        { ...other, scopes: [McpScope.EARTHDATA_ADMIN] },
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const claim = await addCourtCaseClaim(input, owner, prisma);
    expect(claim.createdByUserId).toBe(owner.userId);
    await addCourtCaseClaim(input, moderator, prisma);
    const updated = await upsertCourtCase(
      {
        id: publicCase.id,
        title: "Moderated",
        slug: publicCase.slug,
        isPublic: true,
        createdByUserId: moderator.userId,
      },
      moderator,
      prisma,
    );
    expect(updated.createdByUserId).toBe(owner.userId);
    await expect(
      upsertCourtCase(
        { id: publicCase.id, title: "Private takeover", slug: publicCase.slug },
        moderator,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      upsertCourtCase(
        { title: "Collision", slug: publicCase.slug, isPublic: true },
        other,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (await getCourtCase({ id: privateCase.id }, owner, prisma)).title,
    ).toBe("Private");
  });

  it("does not reveal or overwrite another plaintiff's private enrollment, even to the public case owner or moderator", async () => {
    const courtCase = await makeCase("privacy");
    const privateSubject = await makeSubject("private-person", false, other);
    const publicSubject = await makeSubject("public-person", true, other);
    const party = await prisma.courtCaseParty.create({
      data: {
        caseId: courtCase.id,
        subjectId: privateSubject.id,
        role: "NAMED_PLAINTIFF",
        isPublic: false,
        createdByUserId: other.userId,
        displayNameSnapshot: "Private testimony",
      },
    });
    // Simulate old data whose public party flag disagrees with private person visibility.
    await prisma.courtCaseParty.create({
      data: {
        caseId: courtCase.id,
        subjectId: privateSubject.id,
        role: "AMICUS",
        isPublic: true,
        createdByUserId: other.userId,
      },
    });
    await prisma.courtCaseParty.create({
      data: {
        caseId: courtCase.id,
        subjectId: publicSubject.id,
        role: "NAMED_PLAINTIFF",
        isPublic: true,
        createdByUserId: other.userId,
      },
    });
    await prisma.courtCaseClaim.create({
      data: {
        caseId: courtCase.id,
        title: "Private claim",
        argumentMarkdown: "Secret",
        isPublic: false,
        createdByUserId: other.userId,
      },
    });
    for (const actor of [owner, moderator]) {
      const aggregate = await getCourtCase({ id: courtCase.id }, actor, prisma);
      expect(aggregate.parties).toHaveLength(1);
      expect(aggregate.parties[0]?.subject.id).toBe(publicSubject.id);
      expect(aggregate.claims).toHaveLength(0);
      await expect(
        addCourtCaseParty(
          {
            caseId: courtCase.id,
            subjectId: privateSubject.id,
            role: "NAMED_PLAINTIFF",
            isPublic: false,
          },
          actor,
          prisma,
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    const own = await getCourtCase({ id: courtCase.id }, other, prisma);
    expect(own.parties.map((item) => item.id)).toContain(party.id);
    expect(own.claims).toHaveLength(1);
    expect(
      (
        await prisma.courtCaseParty.findUniqueOrThrow({
          where: { id: party.id },
        })
      ).displayNameSnapshot,
    ).toBe("Private testimony");
  });

  it("rejects cross-case child links and unauthorized shared references before any write", async () => {
    const first = await makeCase("first");
    const second = await makeCase("second");
    const claim = await addCourtCaseClaim(
      { caseId: second.id, title: "Claim", argumentMarkdown: "Reason" },
      owner,
      prisma,
    );
    const harm = await addCourtCaseHarm(
      { caseId: second.id, title: "Harm", claimId: claim.id },
      owner,
      prisma,
    );
    const party = await addCourtCaseParty(
      {
        caseId: second.id,
        subjectExternalId: `${PREFIX}cohort`,
        subjectDisplayName: "A cohort",
        role: "RESPONDENT",
      },
      owner,
      prisma,
    );
    await expect(
      addCourtCaseHarm(
        { caseId: first.id, title: "Wrong", claimId: claim.id },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      addCourtCaseEvidence(
        {
          caseId: first.id,
          title: "Wrong",
          harmId: harm.id,
          sourceUrl: "https://example.org/evidence",
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      addCourtCaseRemedy(
        {
          caseId: first.id,
          title: "Wrong",
          bodyMarkdown: "Do this",
          targetPartyId: party.id,
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      openCourtCaseJuryVote(
        { caseIdOrSlug: first.id, claimId: claim.id },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const privateTask = await prisma.task.create({
      data: {
        id: `${PREFIX}task`,
        title: "Private",
        description: "Private work",
        isPublic: false,
        createdByUserId: other.userId,
      },
    });
    await expect(
      addCourtCaseRemedy(
        {
          caseId: first.id,
          title: "Wrong",
          bodyMarkdown: "Do this",
          enforcementTaskId: privateTask.id,
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const foreignRef = await prisma.referendum.create({
      data: {
        slug: `court-${PREFIX}foreign`,
        title: "Another actor",
        question: "Question?",
        kind: "COURT_CASE",
        createdByUserId: other.userId,
      },
    });
    await expect(
      addCourtCaseClaim(
        {
          caseId: first.id,
          title: "Wrong",
          argumentMarkdown: "Reason",
          juryReferendumId: foreignRef.id,
        },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await prisma.courtCaseHarm.count({ where: { caseId: first.id } }),
    ).toBe(0);
    expect(
      await prisma.courtCaseEvidence.count({ where: { caseId: first.id } }),
    ).toBe(0);
    expect(
      await prisma.courtCaseRemedy.count({ where: { caseId: first.id } }),
    ).toBe(0);
  });

  it("requires public non-sensitive evidence and rechecks source visibility on reads", async () => {
    const courtCase = await makeCase("sources");
    const source = await prisma.sourceArtifact.create({
      data: {
        sourceSystem: "MANUAL",
        artifactType: "EXTERNAL_SOURCE",
        sourceKey: `${PREFIX}source`,
        isPublic: false,
        ownerUserId: other.userId,
      },
    });
    await expect(
      addCourtCaseEvidence(
        { caseId: courtCase.id, title: "Private", sourceArtifactId: source.id },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await prisma.sourceArtifact.update({
      where: { id: source.id },
      data: { isPublic: true, ownerUserId: null },
    });
    await expect(
      addCourtCaseEvidence(
        {
          caseId: courtCase.id,
          title: "Sensitive",
          sourceArtifactId: source.id,
          containsSensitiveData: true,
        },
        owner,
        prisma,
      ),
    ).rejects.toThrow("public non-sensitive");
    const evidence = await addCourtCaseEvidence(
      {
        caseId: courtCase.id,
        title: "Public",
        sourceArtifactId: source.id,
        createdByUserId: other.userId,
      },
      owner,
      prisma,
    );
    expect(evidence.createdByUserId).toBe(owner.userId);
    expect(
      (await getCourtCase({ id: courtCase.id }, other, prisma)).evidence,
    ).toHaveLength(1);
    await prisma.sourceArtifact.update({
      where: { id: source.id },
      data: { isPublic: false, ownerUserId: owner.userId },
    });
    expect(
      (await getCourtCase({ id: courtCase.id }, other, prisma)).evidence,
    ).toHaveLength(0);
  });

  it("serializes concurrent jury opens and preserves locked ballot content", async () => {
    const courtCase = await makeCase("jury");
    const claim = await addCourtCaseClaim(
      { caseId: courtCase.id, title: "Claim", argumentMarkdown: "Reason" },
      owner,
      prisma,
    );
    const input = {
      caseIdOrSlug: courtCase.id,
      claimId: claim.id,
      createdByUserId: other.userId,
    };
    const results = await Promise.all([
      openCourtCaseJuryVote(input, owner, prisma),
      openCourtCaseJuryVote(input, owner, prisma),
    ]);
    expect(results[0].referendum.id).toBe(results[1].referendum.id);
    expect(
      await prisma.referendum.count({
        where: { slug: results[0].referendum.slug },
      }),
    ).toBe(1);
    expect(
      (
        await prisma.referendum.findUniqueOrThrow({
          where: { id: results[0].referendum.id },
        })
      ).createdByUserId,
    ).toBe(owner.userId);
    expect(
      (
        await prisma.courtCaseClaim.findUniqueOrThrow({
          where: { id: claim.id },
        })
      ).juryReferendumId,
    ).toBe(results[0].referendum.id);
    await prisma.referendum.update({
      where: { id: results[0].referendum.id },
      data: { lockedAt: new Date("2026-01-01T00:00:00Z") },
    });
    await expect(
      openCourtCaseJuryVote(
        { ...input, questionTitle: "Different ballot?" },
        owner,
        prisma,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (await openCourtCaseJuryVote(input, owner, prisma)).referendum.id,
    ).toBe(results[0].referendum.id);
  });

  it("rolls back referendum creation and claim linkage if the case transition fails", async () => {
    const courtCase = await makeCase("rollback");
    const claim = await addCourtCaseClaim(
      { caseId: courtCase.id, title: "Claim", argumentMarkdown: "Reason" },
      owner,
      prisma,
    );
    await prisma.$executeRawUnsafe(
      `CREATE OR REPLACE FUNCTION court_test_reject_vote() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.slug = 'court-domain-test-rollback' AND NEW.status = 'VOTING' THEN RAISE EXCEPTION 'court test transition failure'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER court_test_reject_vote BEFORE UPDATE ON "CourtCase" FOR EACH ROW EXECUTE FUNCTION court_test_reject_vote()',
    );
    try {
      await expect(
        openCourtCaseJuryVote(
          { caseIdOrSlug: courtCase.id, claimId: claim.id },
          owner,
          prisma,
        ),
      ).rejects.toThrow();
      expect(
        await prisma.referendum.count({
          where: { slug: `court-${courtCase.slug}-verdict` },
        }),
      ).toBe(0);
      expect(
        (
          await prisma.courtCaseClaim.findUniqueOrThrow({
            where: { id: claim.id },
          })
        ).juryReferendumId,
      ).toBeNull();
      expect(
        (
          await prisma.courtCase.findUniqueOrThrow({
            where: { id: courtCase.id },
          })
        ).status,
      ).toBe("DRAFT");
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS court_test_reject_vote ON "CourtCase"',
      );
      await prisma.$executeRawUnsafe(
        "DROP FUNCTION IF EXISTS court_test_reject_vote()",
      );
    }
  });
});
