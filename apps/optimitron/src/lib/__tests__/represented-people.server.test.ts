import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ personFindFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { person: { findFirst: mocks.personFindFirst } },
}));
import { getRepresentedPersonProfileData } from "@/lib/represented-people.server";

describe("represented person profiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("loads represented person profiles by handle or id in one query", async () => {
    mocks.personFindFirst.mockResolvedValue(null);

    await expect(
      getRepresentedPersonProfileData("person_1"),
    ).resolves.toBeNull();

    expect(mocks.personFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.personFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          conditions: expect.objectContaining({
            where: { deletedAt: null, isPublic: true },
          }),
        }),
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { OR: [{ handle: "person_1" }, { id: "person_1" }] },
          ]),
        }),
      }),
    );
  });

  it("requires public memorial consent before a deceased person profile is visible", async () => {
    mocks.personFindFirst.mockResolvedValue(null);

    await expect(
      getRepresentedPersonProfileData("grandma-kay"),
    ).resolves.toBeNull();

    const where = mocks.personFindFirst.mock.calls[0]?.[0]?.where;
    expect(where).toEqual(
      expect.objectContaining({
        AND: expect.arrayContaining([
          { OR: [{ handle: "grandma-kay" }, { id: "grandma-kay" }] },
        ]),
      }),
    );
    expect(where).toEqual(
      expect.objectContaining({
        AND: expect.arrayContaining([
          expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                lifeStatus: { in: ["UNKNOWN", "LIVING"] },
              }),
              expect.objectContaining({
                lifeStatus: "DECEASED",
                memorial: expect.objectContaining({
                  deletedAt: null,
                  isPublic: true,
                  submissions: {
                    some: expect.objectContaining({
                      consentPublicDisplay: true,
                      deletedAt: null,
                      isPublic: true,
                    }),
                  },
                }),
              }),
            ]),
          }),
        ]),
      }),
    );
  });

  it("exposes a deceased public memorial condition when public display was consented", async () => {
    mocks.personFindFirst.mockResolvedValue({
      bio: null,
      birthDate: null,
      conditions: [{ conditionName: "Cancer", status: "CAUSE_OF_DEATH" }],
      deathDate: new Date("2020-01-02T00:00:00.000Z"),
      displayName: "Aunt Jane",
      handle: "aunt-jane",
      id: "person_jane",
      image: null,
      lifeStatus: "DECEASED",
      memorial: {
        causeCategory: "DISEASE",
        deathCountryCode: "US",
        efficacyLagEvidence: [],
        id: "memorial_1",
        responsibleParties: [],
        submissions: [
          {
            consentCourtEvidence: true,
            consentPublicDisplay: true,
            isPublic: true,
            memorialMessage: "She taught everyone to fix broken things.",
          },
        ],
      },
      subject: {
        courtCaseParties: [
          {
            createdAt: new Date("2026-05-06T00:00:00.000Z"),
            createdBy: {
              email: "mike@example.com",
              id: "user_1",
              person: {
                displayName: "Mike",
                handle: "mike",
                id: "person_mike",
                image: null,
              },
            },
          },
        ],
      },
      relationshipsAsObject: [],
    });

    const data = await getRepresentedPersonProfileData("aunt-jane");

    expect(data?.memorial?.conditionLabel).toBe("Cancer");
    expect(data?.memorial?.memorialMessage).toBe(
      "She taught everyone to fix broken things.",
    );
  });
});
