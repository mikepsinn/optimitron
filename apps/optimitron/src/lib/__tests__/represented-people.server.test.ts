import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  courtCaseFindUnique: vi.fn(),
  courtCasePartyCount: vi.fn(),
  courtCasePartyFindMany: vi.fn(),
  organizationPositionCount: vi.fn(),
  personFindFirst: vi.fn(),
  referendumFindUnique: vi.fn(),
  referendumVoteCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationReferendumPosition: {
      count: mocks.organizationPositionCount,
    },
    courtCase: {
      findUnique: mocks.courtCaseFindUnique,
    },
    courtCaseParty: {
      count: mocks.courtCasePartyCount,
      findMany: mocks.courtCasePartyFindMany,
    },
    referendum: {
      findUnique: mocks.referendumFindUnique,
    },
    referendumVote: {
      count: mocks.referendumVoteCount,
    },
    person: {
      findFirst: mocks.personFindFirst,
    },
  },
}));

import {
  getRepresentedPeopleGalleryData,
  getRepresentedPersonProfileData,
} from "@/lib/represented-people.server";

describe("represented-people.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.courtCaseFindUnique.mockResolvedValue({ id: "case_hvg" });
    mocks.courtCasePartyCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    mocks.courtCasePartyFindMany.mockResolvedValue([
      representedParty({
        displayName: "Grandma Kay",
        id: "party_1",
        image: "/img/grandma.jpg",
        lifeStatus: "LIVING",
        memorialMessage: "She taught everyone to fix broken things.",
      }),
    ]);
    mocks.referendumFindUnique.mockResolvedValue({ id: "ref_1" });
    mocks.organizationPositionCount.mockResolvedValue(2);
    mocks.referendumVoteCount.mockResolvedValue(10);
  });

  it("keeps official, represented, and dead-person counters separate", async () => {
    const data = await getRepresentedPeopleGalleryData("one-percent-treaty");

    expect(data).toMatchObject({
      officialVoteCount: 10,
      organizationCount: 2,
      representedHumanCount: 3,
      deadPersonVoteCount: 1,
      people: [
        {
          conditionName: null,
          displayName: "Grandma Kay",
          href: "/people/grandma-kay",
          lifeStatus: "LIVING",
          publicComment: "She taught everyone to fix broken things.",
          representedBy: "Mike",
        },
      ],
    });
    expect(mocks.referendumVoteCount).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        answer: "YES",
        referendumId: "ref_1",
        voteSource: "SELF",
        person: expect.objectContaining({ lifeStatus: "LIVING" }),
      }),
    });
    expect(mocks.courtCasePartyCount).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        caseId: "case_hvg",
        isPublic: true,
        role: "NAMED_PLAINTIFF",
        subject: expect.objectContaining({
          person: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                lifeStatus: { in: ["UNKNOWN", "LIVING"] },
              }),
            ]),
          }),
        }),
      }),
    });
    expect(mocks.courtCasePartyCount).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({
        caseId: "case_hvg",
        isPublic: true,
        role: "NAMED_PLAINTIFF",
        subject: expect.objectContaining({
          person: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                lifeStatus: "DECEASED",
              }),
            ]),
          }),
        }),
      }),
    });
    expect(mocks.courtCasePartyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          subject: expect.objectContaining({
            select: expect.objectContaining({
              person: expect.objectContaining({
                select: expect.objectContaining({
                  conditions: expect.objectContaining({
                    where: { deletedAt: null, isPublic: true },
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    );
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

  it("does not let condition filters infer private represented conditions", async () => {
    mocks.courtCasePartyFindMany.mockResolvedValue([]);

    await getRepresentedPeopleGalleryData("one-percent-treaty", {
      filters: { conditionGlobalVariableId: "gv_private_condition" },
    });

    expect(mocks.courtCasePartyCount).toHaveBeenLastCalledWith({
      where: expect.objectContaining({
        subject: expect.objectContaining({
          person: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                conditions: expect.objectContaining({
                  some: expect.objectContaining({
                    globalVariableId: "gv_private_condition",
                    isPublic: true,
                  }),
                }),
              }),
            ]),
          }),
        }),
      }),
    });
  });

  it("sorts closest-to-cure evidence without hiding represented people that lack lag evidence", async () => {
    mocks.referendumVoteCount.mockReset();
    mocks.referendumVoteCount.mockResolvedValue(10);
    mocks.courtCasePartyCount.mockReset();
    mocks.courtCasePartyCount.mockResolvedValue(3);
    mocks.courtCasePartyFindMany.mockResolvedValue([
      representedParty({
        displayName: "No lag evidence",
        id: "party_no_lag",
      }),
      representedParty({
        daysBeforeApproval: 20,
        displayName: "Twenty days",
        id: "party_20",
      }),
      representedParty({
        daysBeforeApproval: 2,
        displayName: "Two days",
        id: "party_2",
      }),
    ]);

    const firstPage = await getRepresentedPeopleGalleryData(
      "one-percent-treaty",
      {
        page: 1,
        pageSize: 2,
        sort: "died-closest-to-cure",
      },
    );
    const secondPage = await getRepresentedPeopleGalleryData(
      "one-percent-treaty",
      {
        page: 2,
        pageSize: 2,
        sort: "died-closest-to-cure",
      },
    );

    expect(firstPage?.people.map((person) => person.displayName)).toEqual([
      "Two days",
      "Twenty days",
    ]);
    expect(secondPage?.people.map((person) => person.displayName)).toEqual([
      "No lag evidence",
    ]);
    expect(firstPage?.filteredCount).toBe(3);
    expect(firstPage?.totalPages).toBe(2);
    expect(mocks.courtCasePartyFindMany).toHaveBeenCalledWith(
      expect.not.objectContaining({ take: 200 }),
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

function representedParty({
  daysBeforeApproval,
  displayName,
  id,
  image = null,
  lifeStatus = "DECEASED",
  memorialMessage = null,
}: {
  daysBeforeApproval?: number;
  displayName: string;
  id: string;
  image?: string | null;
  lifeStatus?: string;
  memorialMessage?: string | null;
}) {
  return {
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
    id,
    subject: {
      person: {
        bio: null,
        conditions: [],
        displayName,
        handle: displayName === "Grandma Kay" ? "grandma-kay" : null,
        id: `person_${id}`,
        image,
        lifeStatus,
        memorial: {
          efficacyLagEvidence:
            daysBeforeApproval === undefined
              ? []
              : [{ diedBeforeApprovalDays: daysBeforeApproval }],
          submissions: memorialMessage ? [{ memorialMessage }] : [],
        },
      },
    },
  };
}
