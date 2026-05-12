import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertSafeLocalTestDatabaseUrl } from "../db-cli.js";
import { syncManagedData } from "../managed-data/index.js";
import {
  PersonConditionStatus,
  PersonLifeStatus,
  OrgStatus,
  OrgType,
  PrismaClient,
  ReferendumKind,
  ReferendumVoteSource,
  SubjectType,
  TaskCommunicationAudience,
  TaskCommunicationPurpose,
  VotePosition,
} from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL
  ? assertSafeLocalTestDatabaseUrl(process.env.DATABASE_URL)
  : null;
const describeIfDatabase = databaseUrl ? describe : describe.skip;
const SEED_TEST_TIMEOUT_MS = 60_000;

async function readBaselineCounts(prisma: PrismaClient) {
  return {
    units: await prisma.unit.count(),
    variableCategories: await prisma.variableCategory.count(),
    globalVariables: await prisma.globalVariable.count(),
    jurisdictions: await prisma.jurisdiction.count(),
    wishocraticItems: await prisma.wishocraticItem.count(),
  };
}

describeIfDatabase("syncManagedData", () => {
  const adapter = new PrismaPg({ connectionString: databaseUrl! });
  const prisma = new PrismaClient({ adapter });

  beforeAll(async () => {
    await syncManagedData(prisma, { apply: true });
  }, SEED_TEST_TIMEOUT_MS);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("seeds baseline reference data", async () => {
    const firstCounts = await readBaselineCounts(prisma);

    expect(firstCounts.units).toBeGreaterThanOrEqual(40);
    expect(firstCounts.variableCategories).toBeGreaterThanOrEqual(35);
    expect(firstCounts.globalVariables).toBeGreaterThanOrEqual(119);
    expect(firstCounts.jurisdictions).toBeGreaterThanOrEqual(51);
    expect(firstCounts.wishocraticItems).toBeGreaterThanOrEqual(18);

    await expect(
      prisma.jurisdiction.findUnique({ where: { code: "US" } }),
    ).resolves.toMatchObject({ name: "United States" });
    await expect(
      prisma.unit.findUnique({ where: { name: "Milligrams" } }),
    ).resolves.toBeTruthy();
    await expect(
      prisma.wishocraticItem.findUnique({ where: { id: "PRAGMATIC_CLINICAL_TRIALS" } }),
    ).resolves.toMatchObject({
      name: "Pragmatic Clinical Trials",
      sourceUrl: "https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome",
    });
  });

  it("seeds Grandma Kay as a real represented person example", async () => {
    const grandmaKay = await prisma.person.findUnique({
      where: { sourceRef: "memorial-example:grandma-kay" },
      select: {
        displayName: true,
        handle: true,
        image: true,
        isPublic: true,
        lifeStatus: true,
        conditions: {
          where: { deletedAt: null },
          select: { conditionName: true, status: true },
        },
        referendumVotes: {
          where: {
            referendum: { slug: "one-percent-treaty" },
            deletedAt: null,
          },
          select: {
            answer: true,
            isPublic: true,
            publicComment: true,
            voteSource: true,
          },
        },
      },
    });

    expect(grandmaKay).toMatchObject({
      displayName: "Grandma Kay",
      handle: "grandma-kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
      conditions: [
        {
          conditionName: "Dementia",
          status: PersonConditionStatus.ACTIVE,
        },
      ],
      referendumVotes: [
        {
          answer: VotePosition.YES,
          isPublic: true,
          publicComment: "She would trade one apocalypse for dementia research.",
          voteSource: ReferendumVoteSource.REPRESENTED,
        },
      ],
    });
  }, 15000);

  it("seeds foundation grant accountability tasks", async () => {
    const foundationSlugs = [
      "survival-and-flourishing-fund",
      "open-philanthropy",
      "gates-foundation",
      "filecoin-foundation",
      "arnold-ventures",
      "wellcome-trust",
      "patrick-j-mcgovern-foundation",
      "schmidt-futures",
      "skoll-foundation",
      "omidyar-network",
    ];

    const organizations = await prisma.organization.findMany({
      where: { slug: { in: foundationSlugs }, deletedAt: null },
      select: { slug: true, status: true, type: true },
    });

    expect(organizations).toHaveLength(foundationSlugs.length);
    expect(organizations).toEqual(
      expect.arrayContaining(
        foundationSlugs.map((slug) =>
          expect.objectContaining({
            slug,
            status: OrgStatus.APPROVED,
            type: OrgType.FOUNDATION,
          }),
        ),
      ),
    );

    const grantTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        taskKey: { startsWith: "icewad:grant:" },
        assigneeOrganization: { slug: { in: foundationSlugs } },
      },
      select: {
        assigneeOrganization: { select: { slug: true } },
        category: true,
        description: true,
        difficulty: true,
        isPublic: true,
        status: true,
        taskKey: true,
        title: true,
      },
    });

    expect(grantTasks).toHaveLength(foundationSlugs.length);
    expect(grantTasks).toEqual(
      expect.arrayContaining(
        foundationSlugs.map((slug) =>
          expect.objectContaining({
            assigneeOrganization: { slug },
            category: "GOVERNANCE",
            difficulty: "TRIVIAL",
            isPublic: true,
            status: "ACTIVE",
            taskKey: `icewad:grant:${slug}`,
            title: "Fund the International Campaign to End War and Disease",
          }),
        ),
      ),
    );
    expect(grantTasks[0]?.description).toContain("Suggested grant: $1.");
  }, 15000);

  it("can run idempotently without duplicating baseline data", async () => {
    const firstCounts = await readBaselineCounts(prisma);

    await syncManagedData(prisma, { apply: true });

    const secondCounts = await readBaselineCounts(prisma);

    expect(secondCounts).toEqual(firstCounts);
  }, SEED_TEST_TIMEOUT_MS);

  it("restores seeded records when they drift before a re-run", async () => {
    const originalTask = await prisma.task.findUniqueOrThrow({
      where: { id: "1-pct-treaty" },
      select: { title: true, description: true },
    });
    const originalReferendum = await prisma.referendum.findUniqueOrThrow({
      where: { slug: "one-percent-treaty" },
      select: { title: true, description: true, status: true },
    });
    const originalOrganization = await prisma.organization.findUniqueOrThrow({
      where: { slug: "humanity" },
      select: { name: true, description: true, status: true },
    });

    await prisma.task.update({
      where: { id: "1-pct-treaty" },
      data: {
        title: "drifted task title",
        description: "drifted task description",
      },
    });
    await prisma.referendum.update({
      where: { slug: "one-percent-treaty" },
      data: {
        title: "drifted referendum title",
        description: "drifted referendum description",
      },
    });
    await prisma.organization.update({
      where: { slug: "humanity" },
      data: {
        name: "Drifted Humanity",
        description: "drifted organization description",
      },
    });

    await syncManagedData(prisma, { apply: true });

    await expect(
      prisma.task.findUnique({ where: { id: "1-pct-treaty" } }),
    ).resolves.toMatchObject(originalTask);
    await expect(
      prisma.referendum.findUnique({ where: { slug: "one-percent-treaty" } }),
    ).resolves.toMatchObject(originalReferendum);
    await expect(
      prisma.organization.findUnique({ where: { slug: "humanity" } }),
    ).resolves.toMatchObject(originalOrganization);
  }, SEED_TEST_TIMEOUT_MS);

  it("seeds canonical referendum ballot text and content metadata", async () => {
    const referendums = await prisma.referendum.findMany({
      where: {
        slug: {
          in: [
            "one-percent-treaty",
            "declaration-of-optimization",
            "court-of-humanity",
          ],
        },
        deletedAt: null,
      },
      select: {
        slug: true,
        title: true,
        question: true,
        kind: true,
        description: true,
        bodyMarkdown: true,
        publishedAt: true,
        lockedAt: true,
        contentHash: true,
      },
    });

    expect(referendums).toHaveLength(3);
    expect(referendums).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "one-percent-treaty",
          kind: ReferendumKind.TREATY,
          question: expect.stringContaining("redirect 1% of military spending"),
          bodyMarkdown: expect.stringContaining("Article I"),
          lockedAt: null,
          contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          slug: "declaration-of-optimization",
          kind: ReferendumKind.DECLARATION,
          question: "Do you endorse the Declaration of Optimization?",
          bodyMarkdown: expect.stringContaining("unanimous Declaration"),
          contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
        expect.objectContaining({
          slug: "court-of-humanity",
          kind: ReferendumKind.MEMBERSHIP,
          question: expect.stringContaining("same right to sue"),
          bodyMarkdown: expect.stringContaining("sovereign immunity"),
          contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      ]),
    );
    for (const referendum of referendums) {
      expect(referendum.publishedAt).toBeInstanceOf(Date);
    }
  }, SEED_TEST_TIMEOUT_MS);

  it("seeds task communication endpoint contracts for task-driven reminders", async () => {
    const signerTasksMissingContactContract = await prisma.task.count({
      where: {
        taskKey: { startsWith: "program:one-percent-treaty:signer:" },
        OR: [
          { assigneePersonId: null },
          { dueAt: null },
          { parentTaskId: null },
          {
            communicationEndpoints: {
              none: {
                deletedAt: null,
                isPrimary: true,
                label: { not: null },
                instructions: { not: null },
                url: { not: null },
              },
            },
          },
        ],
      },
    });

    expect(signerTasksMissingContactContract).toBe(0);

    const taskCommunicationTemplatesMissingEndpoint = await prisma.taskCommunicationTemplate.count({
      where: {
        audience: {
          in: [TaskCommunicationAudience.RECIPIENT, TaskCommunicationAudience.SENDER],
        },
        deletedAt: null,
        purpose: {
          in: [
            TaskCommunicationPurpose.INVITATION,
            TaskCommunicationPurpose.REMINDER,
            TaskCommunicationPurpose.SCORECARD,
            TaskCommunicationPurpose.RE_ENGAGEMENT,
            TaskCommunicationPurpose.VOTE_CONFIRMED,
            TaskCommunicationPurpose.RECIPIENT_VOTED,
          ],
        },
        task: {
          communicationEndpoints: {
            none: {
              deletedAt: null,
              isPrimary: true,
              label: { not: null },
              OR: [
                { url: { not: null } },
                { email: { not: null } },
              ],
            },
          },
        },
      },
    });

    expect(taskCommunicationTemplatesMissingEndpoint).toBe(0);
  }, 15000);

  it("stores canonical condition codes for memorial cause matching", async () => {
    const alzheimerVariable = await prisma.globalVariable.findUnique({
      where: { name: "Alzheimer's Disease" },
      select: {
        id: true,
        externalCodes: {
          where: { codeSystem: "ICD-10", code: { startsWith: "G30" }, deletedAt: null },
          select: { code: true },
        },
      },
    });

    expect(alzheimerVariable?.externalCodes.length).toBeGreaterThan(0);

    const person = await prisma.person.create({
      data: {
        displayName: "Coded Condition Test Person",
        isPublic: false,
        lifeStatus: PersonLifeStatus.DECEASED,
      },
    });

    await expect(
      prisma.personCondition.create({
        data: {
          conditionCode: "G30.9",
          conditionCodeSystem: "ICD-10",
          conditionName: "Alzheimer disease, unspecified",
          globalVariableId: alzheimerVariable?.id,
          personId: person.id,
          status: PersonConditionStatus.CAUSE_OF_DEATH,
        },
      }),
    ).resolves.toMatchObject({
      conditionCode: "G30.9",
      conditionCodeSystem: "ICD-10",
      globalVariableId: alzheimerVariable?.id,
    });
  }, 15000);

  it("seeds medical intervention rankings from the static dFDA catalog", async () => {
    const asthma = await prisma.globalVariable.findUnique({
      where: { name: "Asthma" },
      select: {
        id: true,
        interventionRankingRunsForCondition: {
          where: { status: "ACTIVE", deletedAt: null },
          select: {
            rankedInterventions: {
              orderBy: { rank: "asc" },
              take: 3,
              select: {
                rank: true,
                interventionGlobalVariable: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    expect(asthma?.interventionRankingRunsForCondition[0]?.rankedInterventions.length).toBeGreaterThan(0);
  }, 15000);

  it("supports person subjects and subject-owned measurements without user ownership", async () => {
    const person = await prisma.person.create({
      data: {
        displayName: "Measurement Subject Person",
        isPublic: false,
        lifeStatus: PersonLifeStatus.LIVING,
      },
      select: { id: true },
    });
    const subject = await prisma.subject.create({
      data: {
        displayName: "Measurement Subject Person",
        personId: person.id,
        subjectType: SubjectType.PERSON,
      },
      select: { id: true },
    });
    const variable = await prisma.globalVariable.findUniqueOrThrow({
      where: { name: "Happiness" },
      select: { id: true, defaultUnitId: true },
    });
    const nOf1Variable = await prisma.nOf1Variable.create({
      data: {
        globalVariableId: variable.id,
        subjectId: subject.id,
      },
      select: { id: true },
    });

    await expect(
      prisma.measurement.create({
        data: {
          globalVariableId: variable.id,
          nOf1VariableId: nOf1Variable.id,
          originalUnitId: variable.defaultUnitId,
          originalValue: 4,
          startTime: new Date("2026-05-02T00:00:00.000Z"),
          subjectId: subject.id,
          unitId: variable.defaultUnitId,
          value: 4,
        },
      }),
    ).resolves.toMatchObject({
      subjectId: subject.id,
    });
  }, 15000);

  it("rejects cross-person official votes and mismatched memorial evidence links", async () => {
    const referendum = await prisma.referendum.findUniqueOrThrow({
      where: { slug: "one-percent-treaty" },
      select: { id: true },
    });
    const casterPerson = await prisma.person.create({
      data: {
        displayName: "Official Vote Caster",
        isPublic: false,
        lifeStatus: PersonLifeStatus.LIVING,
      },
    });
    const targetPerson = await prisma.person.create({
      data: {
        displayName: "Not The Caster",
        isPublic: false,
        lifeStatus: PersonLifeStatus.LIVING,
      },
    });
    const user = await prisma.user.create({
      data: {
        email: `official-vote-invariant-${Date.now()}@example.com`,
        personId: casterPerson.id,
      },
    });

    await expect(
      prisma.referendumVote.create({
        data: {
          answer: VotePosition.YES,
          personId: targetPerson.id,
          referendumId: referendum.id,
          userId: user.id,
          voteSource: ReferendumVoteSource.SELF,
        },
      }),
    ).rejects.toThrow(/SELF referendum votes/);

    const memorialPerson = await prisma.person.create({
      data: {
        displayName: "Memorial Invariant Person",
        isPublic: false,
        lifeStatus: PersonLifeStatus.DECEASED,
      },
    });
    const otherPerson = await prisma.person.create({
      data: {
        displayName: "Other Memorial Person",
        isPublic: false,
        lifeStatus: PersonLifeStatus.DECEASED,
      },
    });
    const otherCondition = await prisma.personCondition.create({
      data: {
        conditionName: "Other condition",
        personId: otherPerson.id,
      },
      select: { id: true },
    });

    await expect(
      prisma.personMemorial.create({
        data: {
          personId: memorialPerson.id,
          primaryPersonConditionId: otherCondition.id,
        },
      }),
    ).rejects.toThrow(/primaryPersonConditionId/);

    const sourceMemorial = await prisma.personMemorial.create({
      data: { personId: otherPerson.id },
      select: { id: true },
    });
    const sourceSubmission = await prisma.personMemorialSubmission.create({
      data: {
        memorialId: sourceMemorial.id,
        submittedByUserId: user.id,
      },
      select: { id: true },
    });
    const targetMemorial = await prisma.personMemorial.create({
      data: { personId: memorialPerson.id },
      select: { id: true },
    });

    await expect(
      prisma.personMemorialEvidence.create({
        data: {
          memorialId: targetMemorial.id,
          submissionId: sourceSubmission.id,
        },
      }),
    ).rejects.toThrow(/submissionId/);
  }, 15000);
});
