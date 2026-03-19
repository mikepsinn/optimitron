import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { disconnectSeedClient, seedDatabase } from "../../prisma/seed.ts";

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase("seedDatabase", () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
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
      items: await prisma.wishocraticItem.count(),
    };

    expect(firstCounts.units).toBeGreaterThanOrEqual(40);
    expect(firstCounts.variableCategories).toBeGreaterThanOrEqual(35);
    expect(firstCounts.globalVariables).toBeGreaterThanOrEqual(119);
    expect(firstCounts.jurisdictions).toBeGreaterThanOrEqual(51);
    expect(firstCounts.items).toBeGreaterThanOrEqual(20);

    await expect(
      prisma.jurisdiction.findUnique({ where: { code: "US" } }),
    ).resolves.toMatchObject({ name: "United States" });
    await expect(
      prisma.unit.findUnique({ where: { name: "Milligrams" } }),
    ).resolves.toBeTruthy();
    await expect(
      prisma.wishocraticItem.findUnique({ where: { id: "budget-national-defense" } }),
    ).resolves.toMatchObject({ name: "National Defense" });

    await seedDatabase();

    const secondCounts = {
      units: await prisma.unit.count(),
      variableCategories: await prisma.variableCategory.count(),
      globalVariables: await prisma.globalVariable.count(),
      jurisdictions: await prisma.jurisdiction.count(),
      items: await prisma.wishocraticItem.count(),
    };

    expect(secondCounts).toEqual(firstCounts);
  });
});
