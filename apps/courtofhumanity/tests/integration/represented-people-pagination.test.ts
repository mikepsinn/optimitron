import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CourtCasePartyRole,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  PersonLifeStatus,
  SubjectType,
  type PrismaClient,
} from "@optimitron/db";
import { DEMO_USER_EMAIL } from "@optimitron/data/campaign";
import { prisma } from "@/lib/prisma";
import { getRepresentedPeopleGalleryData } from "@/lib/represented-people.server";

// Court owns these regressions; this suite runs only against a local test database.
// A reserved country filter isolates these rows from managed-data fixtures.
const prefix = "gallery-pagination-test-";
const filters = { countryCode: "ZZ" };
const expected = ["photo-c", "photo-b", "photo-a", "empty", "null-b", "null-a"];
let caseId: string;
let createdCase = false;
let createdDemo = false;
let previousCaseVisibility: {
  isPublic: boolean;
  deletedAt: Date | null;
} | null = null;

beforeAll(async () => {
  const existing = await prisma.courtCase.findUnique({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
  });
  createdCase = !existing;
  previousCaseVisibility = existing
    ? { isPublic: existing.isPublic, deletedAt: existing.deletedAt }
    : null;
  // The schema defaults cases to private. Establish this suite's public-case
  // precondition explicitly, including when another fixture already exists.
  caseId = (
    await prisma.courtCase.upsert({
      where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
      create: {
        slug: HUMANITY_V_GOVERNMENT_CASE_SLUG,
        title: "Pagination fixture",
        isPublic: true,
      },
      update: { isPublic: true, deletedAt: null },
    })
  ).id;
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });
  createdDemo = !demo;
  const demoId = (
    demo ?? (await prisma.user.create({ data: { email: DEMO_USER_EMAIL } }))
  ).id;
  await prisma.interventionApprovalTimeline.create({
    data: {
      id: prefix + "timeline",
      interventionName: "Fixture",
      conditionName: "Fixture",
    },
  });

  const fixtures = [
    { name: "photo-a", image: "https://example.invalid/z.jpg", day: 1 },
    { name: "photo-b", image: "https://example.invalid/a.jpg", day: 2 },
    { name: "photo-c", image: "https://example.invalid/b.jpg", day: 2 },
    { name: "null-a", image: null, day: 3 },
    { name: "null-b", image: null, day: 3 },
    { name: "empty", image: "", day: 4 },
    { name: "private-photo", image: "photo", day: 5, privatePerson: true },
    { name: "deleted-photo", image: "photo", day: 5, deleted: true },
    { name: "private-party", image: "photo", day: 5, privateParty: true },
    { name: "other-country", image: "photo", day: 5, country: "ZY" },
    { name: "deceased-no-consent", image: "photo", day: 5, deceased: true },
    { name: "demo-photo", image: "photo", day: 5, demo: true },
  ];
  for (const fixture of fixtures) {
    const id = prefix + fixture.name;
    await prisma.person.create({
      data: {
        id,
        displayName: fixture.name,
        image: fixture.image,
        isPublic: !fixture.privatePerson,
        deletedAt: fixture.deleted ? new Date("2026-01-01") : null,
        lifeStatus: fixture.deceased
          ? PersonLifeStatus.DECEASED
          : PersonLifeStatus.LIVING,
        memorial: {
          create: { deathCountryCode: fixture.country ?? "ZZ", isPublic: true },
        },
      },
    });
    await prisma.subject.create({
      data: { id, personId: id, subjectType: SubjectType.PERSON },
    });
    await prisma.courtCaseParty.create({
      data: {
        id,
        caseId,
        subjectId: id,
        role: CourtCasePartyRole.NAMED_PLAINTIFF,
        isPublic: !fixture.privateParty,
        createdByUserId: fixture.demo ? demoId : null,
        createdAt: new Date(`2026-01-0${fixture.day}T00:00:00Z`),
      },
    });
    if (fixture.name === "photo-a" || fixture.name === "null-a") {
      await prisma.personMemorial.update({
        where: { personId: id },
        data: {
          efficacyLagEvidence: {
            create: {
              interventionApprovalTimelineId: prefix + "timeline",
              diedBeforeApprovalDays: fixture.name === "photo-a" ? 10 : 1,
            },
          },
        },
      });
    }
  }
});

afterAll(async () => {
  await prisma.courtCaseParty.deleteMany({
    where: { id: { startsWith: prefix } },
  });
  await prisma.subject.deleteMany({ where: { id: { startsWith: prefix } } });
  await prisma.person.deleteMany({ where: { id: { startsWith: prefix } } });
  await prisma.interventionApprovalTimeline.deleteMany({
    where: { id: prefix + "timeline" },
  });
  if (createdCase) await prisma.courtCase.delete({ where: { id: caseId } });
  else if (previousCaseVisibility)
    await prisma.courtCase.update({
      where: { id: caseId },
      data: previousCaseVisibility,
    });
  if (createdDemo)
    await prisma.user.delete({ where: { email: DEMO_USER_EMAIL } });
  await prisma.$disconnect();
});

describe("public plaintiff recent pagination with PostgreSQL", () => {
  it.each([1, 2, 3, 4, 8])(
    "preserves photo-first order and boundaries at page size %i",
    async (pageSize) => {
      const names: string[] = [];
      for (
        let page = 1;
        page <= Math.ceil(expected.length / pageSize) + 1;
        page++
      ) {
        const result = await getRepresentedPeopleGalleryData(undefined, {
          filters,
          page,
          pageSize,
        });
        expect(result?.filteredCount).toBe(expected.length);
        expect(result?.totalPages).toBe(Math.ceil(expected.length / pageSize));
        expect(result?.people.map((person) => person.displayName)).toEqual(
          expected.slice((page - 1) * pageSize, page * pageSize),
        );
        names.push(...result!.people.map((person) => person.displayName));
      }
      expect(names).toEqual(expected);
    },
  );

  it("hydrates at most one page across the photo boundary", async () => {
    const globalClient = globalThis as unknown as { prisma: PrismaClient };
    const original = globalClient.prisma;
    const limits: (number | undefined)[] = [];
    globalClient.prisma = original.$extends({
      query: {
        courtCaseParty: {
          findMany({ args, query }) {
            limits.push(args.take);
            return query(args);
          },
        },
      },
    }) as PrismaClient;
    try {
      const result = await getRepresentedPeopleGalleryData(undefined, {
        filters,
        page: 2,
        pageSize: 2,
      });
      expect(result?.people.map((person) => person.displayName)).toEqual([
        "photo-a",
        "empty",
      ]);
      expect(limits.length).toBeGreaterThan(0);
      expect(limits.every((take) => typeof take === "number" && take > 0)).toBe(
        true,
      );
      expect(
        limits.reduce((sum, take) => sum + (take ?? 0), 0),
      ).toBeLessThanOrEqual(2);
    } finally {
      globalClient.prisma = original;
    }
  });

  it("keeps the page boundary stable when a photo changes after the count", async () => {
    const globalClient = globalThis as unknown as { prisma: PrismaClient };
    const original = globalClient.prisma;
    let changed = false;
    globalClient.prisma = original.$extends({
      query: {
        courtCaseParty: {
          async count({ args, query }) {
            const result = await query(args);
            if (JSON.stringify(args).includes('"image":{"not":null}')) {
              await original.person.update({
                where: { id: prefix + "photo-a" },
                data: { image: null },
              });
              changed = true;
            }
            return result;
          },
        },
      },
    }) as PrismaClient;
    try {
      const result = await getRepresentedPeopleGalleryData(undefined, {
        filters,
        page: 2,
        pageSize: 2,
      });
      expect(changed).toBe(true);
      expect(result?.people.map((person) => person.displayName)).toEqual([
        "photo-a",
        "empty",
      ]);
    } finally {
      globalClient.prisma = original;
      await original.person.update({
        where: { id: prefix + "photo-a" },
        data: { image: "https://example.invalid/z.jpg" },
      });
    }
  });

  it("returns an empty filtered page without private or unrelated people", async () => {
    const result = await getRepresentedPeopleGalleryData(undefined, {
      filters: { countryCode: "ZX" },
    });
    expect(result?.people).toEqual([]);
    expect(result?.filteredCount).toBe(0);
    expect(result?.totalPages).toBe(1);
  });

  it("retains efficacy-lag ordering and filtering", async () => {
    const result = await getRepresentedPeopleGalleryData(undefined, {
      filters: { ...filters, efficacyLagOnly: true },
      sort: "died-closest-to-cure",
      pageSize: 1,
    });
    expect(result?.filteredCount).toBe(2);
    expect(result?.people.map((person) => person.displayName)).toEqual([
      "null-a",
    ]);
    const second = await getRepresentedPeopleGalleryData(undefined, {
      filters: { ...filters, efficacyLagOnly: true },
      sort: "died-closest-to-cure",
      pageSize: 1,
      page: 2,
    });
    expect(second?.people.map((person) => person.displayName)).toEqual([
      "photo-a",
    ]);
  });
});
