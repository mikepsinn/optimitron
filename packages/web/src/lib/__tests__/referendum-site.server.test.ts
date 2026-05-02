import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  VotePosition,
} from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  getTaskDetailData: vi.fn(),
  referendumFindUnique: vi.fn(),
  referendumVoteCount: vi.fn(),
  referendumVoteFindMany: vi.fn(),
  referendumVoteGroupBy: vi.fn(),
  organizationPositionCount: vi.fn(),
  organizationPositionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: {
      findUnique: mocks.referendumFindUnique,
    },
    referendumVote: {
      count: mocks.referendumVoteCount,
      findMany: mocks.referendumVoteFindMany,
      groupBy: mocks.referendumVoteGroupBy,
    },
    organizationReferendumPosition: {
      count: mocks.organizationPositionCount,
      findMany: mocks.organizationPositionFindMany,
    },
  },
}));

vi.mock("@/lib/tasks.server", () => ({
  getTaskDetailData: mocks.getTaskDetailData,
}));

import {
  buildApprovedOrganizationPositionWhere,
  getReferendumSiteHomeData,
  getReferendumSiteSupportersData,
} from "@/lib/referendum-site.server";
import { getSiteConfig } from "@/lib/site";

describe("referendum-site.server", () => {
  beforeEach(() => {
    mocks.getTaskDetailData.mockReset();
    mocks.referendumFindUnique.mockReset();
    mocks.referendumVoteCount.mockReset();
    mocks.referendumVoteFindMany.mockReset();
    mocks.referendumVoteGroupBy.mockReset();
    mocks.organizationPositionCount.mockReset();
    mocks.organizationPositionFindMany.mockReset();
    mocks.getTaskDetailData.mockResolvedValue(null);
    mocks.referendumVoteFindMany.mockResolvedValue([]);
    mocks.referendumVoteGroupBy.mockResolvedValue([]);
  });

  it("requires approved orgs and approved YES positions in signatory queries", () => {
    expect(buildApprovedOrganizationPositionWhere("ref_1")).toEqual({
      referendumId: "ref_1",
      position: VotePosition.YES,
      status: OrganizationReferendumPositionStatus.APPROVED,
      deletedAt: null,
      organization: {
        status: OrgStatus.APPROVED,
        deletedAt: null,
      },
    });
  });

  it("uses approved signatory filters for homepage counters", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_1",
      title: "1% Treaty",
      description: "desc",
    });
    mocks.referendumVoteCount.mockResolvedValue(12);
    mocks.organizationPositionCount.mockResolvedValue(3);

    const data = await getReferendumSiteHomeData(getSiteConfig("onePercentTreaty"));

    expect(data?.individualCount).toBe(12);
    expect(data?.organizationCount).toBe(3);
    expect(mocks.organizationPositionCount).toHaveBeenCalledWith({
      where: buildApprovedOrganizationPositionWhere("ref_1"),
    });
  });

  it("uses the same approved filters for organizational signatory lists", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_2",
      title: "1% Treaty",
      description: "desc",
    });
    mocks.organizationPositionFindMany.mockResolvedValue([]);

    await getReferendumSiteSupportersData(getSiteConfig("onePercentTreaty"));

    expect(mocks.organizationPositionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: buildApprovedOrganizationPositionWhere("ref_2"),
      }),
    );
  });

  it("surfaces the signed-in user's signer row separately with its global rank", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_3",
      title: "1% Treaty",
      description: "desc",
    });
    mocks.referendumVoteCount.mockResolvedValue(3);
    mocks.organizationPositionCount.mockResolvedValue(0);
    mocks.referendumVoteFindMany.mockResolvedValue([
      {
        id: "vote_c",
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        userId: "user_c",
        user: {
          id: "user_c",
          name: "C",
          username: "c",
          image: null,
          email: "c@example.com",
          person: null,
        },
      },
      {
        id: "vote_b",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        userId: "user_b",
        user: {
          id: "user_b",
          name: "B",
          username: "b",
          image: null,
          email: "b@example.com",
          person: null,
        },
      },
      {
        id: "vote_a",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        userId: "user_a",
        user: {
          id: "user_a",
          name: "A",
          username: "a",
          image: null,
          email: "a@example.com",
          person: null,
        },
      },
    ]);
    mocks.referendumVoteGroupBy.mockResolvedValue([
      {
        referredByUserId: "user_b",
        _count: { referredByUserId: 2 },
      },
      {
        referredByUserId: "user_a",
        _count: { referredByUserId: 1 },
      },
    ]);

    const data = await getReferendumSiteHomeData(getSiteConfig("onePercentTreaty"), {
      currentUserId: "user_c",
    });

    expect(data?.publicSigners.currentUserSigner).toMatchObject({
      user: { id: "user_c" },
      rank: 3,
    });
    expect(data?.publicSigners.signers.map((entry) => entry.user.id)).toEqual([
      "user_b",
      "user_a",
      "user_c",
    ]);
  });
});
