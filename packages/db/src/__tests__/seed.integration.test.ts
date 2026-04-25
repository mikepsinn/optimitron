import { afterAll, describe, expect, it } from "vitest";
import {
  PrismaClient,
  TaskCommunicationAudience,
  TaskCommunicationPurpose,
} from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { disconnectSeedClient, seedDatabase } from "../../prisma/seed.ts";
import { assertSafeLocalTestDatabaseUrl } from "../db-cli.js";

const databaseUrl = process.env.DATABASE_URL
  ? assertSafeLocalTestDatabaseUrl(process.env.DATABASE_URL)
  : null;
const describeIfDatabase = databaseUrl ? describe : describe.skip;

describeIfDatabase("seedDatabase", () => {
  const adapter = new PrismaPg({ connectionString: databaseUrl! });
  const prisma = new PrismaClient({ adapter });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectSeedClient();
  });

  it("seeds baseline reference data idempotently", async () => {
    await seedDatabase();

    const firstCounts = {
      units: await prisma.unit.count(),
      variableCategories: await prisma.variableCategory.count(),
      globalVariables: await prisma.globalVariable.count(),
      jurisdictions: await prisma.jurisdiction.count(),
      wishocraticItems: await prisma.wishocraticItem.count(),
    };

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

    await seedDatabase();

    const secondCounts = {
      units: await prisma.unit.count(),
      variableCategories: await prisma.variableCategory.count(),
      globalVariables: await prisma.globalVariable.count(),
      jurisdictions: await prisma.jurisdiction.count(),
      wishocraticItems: await prisma.wishocraticItem.count(),
    };

    expect(secondCounts).toEqual(firstCounts);
  }, 15000);

  it("restores seeded records when they drift before a re-run", async () => {
    await seedDatabase();

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

    await seedDatabase();

    await expect(
      prisma.task.findUnique({ where: { id: "1-pct-treaty" } }),
    ).resolves.toMatchObject(originalTask);
    await expect(
      prisma.referendum.findUnique({ where: { slug: "one-percent-treaty" } }),
    ).resolves.toMatchObject(originalReferendum);
    await expect(
      prisma.organization.findUnique({ where: { slug: "humanity" } }),
    ).resolves.toMatchObject(originalOrganization);
  }, 15000);

  it("seeds task communication endpoint contracts for task-driven reminders", async () => {
    await seedDatabase();

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
});
