import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  organizationPositionCount: vi.fn(),
  personFindFirst: vi.fn(),
  referendumFindUnique: vi.fn(),
  referendumVoteCount: vi.fn(),
  referendumVoteFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationReferendumPosition: {
      count: mocks.organizationPositionCount,
    },
    referendum: {
      findUnique: mocks.referendumFindUnique,
    },
    referendumVote: {
      count: mocks.referendumVoteCount,
      findMany: mocks.referendumVoteFindMany,
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
    mocks.referendumFindUnique.mockResolvedValue({ id: "ref_1" });
    mocks.organizationPositionCount.mockResolvedValue(2);
    mocks.referendumVoteCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    mocks.referendumVoteFindMany.mockResolvedValue([
      {
        id: "vote_1",
        publicComment: "She would trade one apocalypse for dementia research.",
        person: {
          conditions: [{ conditionName: "Dementia" }],
          displayName: "Grandma Kay",
          handle: "grandma-kay",
          id: "person_1",
          image: "/img/grandma.jpg",
          lifeStatus: "LIVING",
          memorial: {
            submissions: [
              {
                memorialMessage: "She taught everyone to fix broken things.",
              },
            ],
          },
        },
        user: {
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
    ]);
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
          conditionName: "Dementia",
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
    expect(mocks.referendumVoteCount).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({
        answer: "YES",
        isPublic: true,
        referendumId: "ref_1",
        voteSource: "REPRESENTED",
        person: expect.objectContaining({
          isPublic: true,
          lifeStatus: { in: ["UNKNOWN", "LIVING"] },
        }),
      }),
    });
    expect(mocks.referendumVoteCount).toHaveBeenNthCalledWith(3, {
      where: expect.objectContaining({
        answer: "YES",
        isPublic: true,
        referendumId: "ref_1",
        voteSource: "REPRESENTED",
        person: expect.objectContaining({
          isPublic: true,
          lifeStatus: "DECEASED",
        }),
      }),
    });
  });

  it("loads represented person profiles by handle or id in one query", async () => {
    mocks.personFindFirst.mockResolvedValue(null);

    await expect(getRepresentedPersonProfileData("person_1")).resolves.toBeNull();

    expect(mocks.personFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.personFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { OR: [{ handle: "person_1" }, { id: "person_1" }] },
          ]),
        }),
      }),
    );
  });

  it("sorts closest-to-cure evidence without hiding represented people that lack lag evidence", async () => {
    mocks.referendumVoteCount.mockReset();
    mocks.referendumVoteCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);
    mocks.referendumVoteFindMany.mockResolvedValue([
      representedVote({
        displayName: "No lag evidence",
        id: "vote_no_lag",
      }),
      representedVote({
        daysBeforeApproval: 20,
        displayName: "Twenty days",
        id: "vote_20",
      }),
      representedVote({
        daysBeforeApproval: 2,
        displayName: "Two days",
        id: "vote_2",
      }),
    ]);

    const firstPage = await getRepresentedPeopleGalleryData("one-percent-treaty", {
      page: 1,
      pageSize: 2,
      sort: "died-closest-to-cure",
    });
    const secondPage = await getRepresentedPeopleGalleryData("one-percent-treaty", {
      page: 2,
      pageSize: 2,
      sort: "died-closest-to-cure",
    });

    expect(firstPage?.people.map((person) => person.displayName)).toEqual([
      "Two days",
      "Twenty days",
    ]);
    expect(secondPage?.people.map((person) => person.displayName)).toEqual([
      "No lag evidence",
    ]);
    expect(firstPage?.filteredCount).toBe(3);
    expect(firstPage?.totalPages).toBe(2);
    expect(mocks.referendumVoteFindMany).toHaveBeenCalledWith(
      expect.not.objectContaining({ take: 200 }),
    );
  });

  it("requires public memorial consent before a deceased person profile is visible", async () => {
    mocks.personFindFirst.mockResolvedValue(null);

    await expect(getRepresentedPersonProfileData("grandma-kay")).resolves.toBeNull();

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
});

function representedVote({
  daysBeforeApproval,
  displayName,
  id,
}: {
  daysBeforeApproval?: number;
  displayName: string;
  id: string;
}) {
  return {
    id,
    publicComment: null,
    person: {
      conditions: [],
      displayName,
      handle: null,
      id: `person_${id}`,
      image: null,
      lifeStatus: "DECEASED",
      memorial: {
        efficacyLagEvidence:
          daysBeforeApproval === undefined
            ? []
            : [{ diedBeforeApprovalDays: daysBeforeApproval }],
        submissions: [],
      },
    },
    user: {
      email: "mike@example.com",
      id: "user_1",
      person: null,
    },
  };
}
