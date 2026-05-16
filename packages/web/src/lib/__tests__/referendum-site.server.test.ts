import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  VotePosition,
} from "@optimitron/db";
import { VOTER_LIVES_SAVED } from "@optimitron/data/parameters";

const mocks = vi.hoisted(() => ({
  getTaskDetailData: vi.fn(),
  referendumFindMany: vi.fn(),
  referendumFindUnique: vi.fn(),
  referendumVoteCount: vi.fn(),
  referendumVoteFindMany: vi.fn(),
  referendumVoteGroupBy: vi.fn(),
  organizationPositionCount: vi.fn(),
  organizationPositionFindMany: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: {
      findMany: mocks.referendumFindMany,
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
    user: {
      findUnique: mocks.userFindUnique,
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
  type PublicSignatoriesPage,
} from "@/lib/referendum-site.server";
import { getSiteConfig } from "@/lib/site";

describe("referendum-site.server", () => {
  beforeEach(() => {
    mocks.getTaskDetailData.mockReset();
    mocks.referendumFindMany.mockReset();
    mocks.referendumFindUnique.mockReset();
    mocks.referendumVoteCount.mockReset();
    mocks.referendumVoteFindMany.mockReset();
    mocks.referendumVoteGroupBy.mockReset();
    mocks.organizationPositionCount.mockReset();
    mocks.organizationPositionFindMany.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.getTaskDetailData.mockResolvedValue(null);
    mocks.referendumFindMany.mockResolvedValue([]);
    mocks.referendumVoteFindMany.mockResolvedValue([]);
    mocks.referendumVoteGroupBy.mockResolvedValue([]);
    mocks.organizationPositionFindMany.mockResolvedValue([]);
    mocks.userFindUnique.mockResolvedValue(null);
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

    const data = await getReferendumSiteHomeData(getSiteConfig("warOnDisease"));

    expect(data?.individualCount).toBe(12);
    expect(data?.organizationCount).toBe(3);
    expect(mocks.referendumVoteCount).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        answer: VotePosition.YES,
        deletedAt: null,
        referendumId: "ref_1",
      }),
    });
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

    await getReferendumSiteSupportersData(getSiteConfig("warOnDisease"));

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
        userId: "referred_1",
        _count: { userId: 1 },
      },
      {
        referredByUserId: "user_b",
        userId: "referred_2",
        _count: { userId: 1 },
      },
      {
        referredByUserId: "user_a",
        userId: "referred_3",
        _count: { userId: 1 },
      },
    ]);
    mocks.userFindUnique.mockResolvedValue({
      person: { isPublic: true },
      referendumVotes: [{ id: "vote_c" }],
    });

    const data = await getReferendumSiteHomeData(
      getSiteConfig("warOnDisease"),
      {
        currentUserId: "user_c",
      },
    );
    const publicSignatories = (
      data as { publicSignatories?: PublicSignatoriesPage } | null
    )?.publicSignatories;

    expect(publicSignatories?.currentUserSigner).toMatchObject({
      user: { id: "user_c" },
      rank: 3,
    });
    expect(publicSignatories?.currentUserStatus).toMatchObject({
      hasYesVote: true,
      isPublic: true,
      listed: true,
      rank: 3,
      referredYesCount: 0,
    });
    expect(
      publicSignatories?.signatories
        .filter((entry) => entry.kind === "human")
        .map((entry) => entry.user.id),
    ).toEqual(["user_b", "user_a", "user_c"]);
  });

  it("queries public signatories across treaty and declaration referendum signatures", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_treaty",
      title: "1% Treaty",
      description: "desc",
    });
    mocks.referendumFindMany.mockResolvedValue([
      { id: "ref_treaty", slug: "one-percent-treaty" },
      { id: "ref_declaration", slug: "declaration-of-optimization" },
    ]);
    mocks.referendumVoteCount.mockResolvedValue(2);
    mocks.organizationPositionCount.mockResolvedValue(0);
    mocks.referendumVoteFindMany.mockResolvedValue([
      {
        id: "vote_treaty",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        userId: "user_treaty",
        user: {
          id: "user_treaty",
          name: "Treaty Signer",
          username: "treaty",
          image: null,
          email: "treaty@example.com",
          person: null,
        },
      },
      {
        id: "vote_declaration",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        userId: "user_declaration",
        user: {
          id: "user_declaration",
          name: "Declaration Signer",
          username: "declaration",
          image: null,
          email: "declaration@example.com",
          person: null,
        },
      },
    ]);

    const data = await getReferendumSiteHomeData(getSiteConfig("warOnDisease"));

    expect(mocks.referendumFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        slug: { in: ["one-percent-treaty", "declaration-of-optimization"] },
      },
      select: { id: true, slug: true },
    });
    expect(mocks.referendumVoteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          referendumId: { in: ["ref_treaty", "ref_declaration"] },
        }),
      }),
    );
    expect(
      data?.publicSignatories.signatories
        .filter((entry) => entry.kind === "human")
        .map((entry) => entry.user.id),
    ).toEqual(["user_treaty", "user_declaration"]);
  });

  it("ranks signatories by total attributable signatures", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_4",
      title: "1% Treaty",
      description: "desc",
    });
    mocks.referendumVoteCount.mockResolvedValue(4);
    mocks.organizationPositionCount.mockResolvedValue(1);
    mocks.referendumVoteFindMany.mockResolvedValue([
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
    mocks.referendumVoteGroupBy
      .mockResolvedValueOnce([
        {
          referredByUserId: "user_a",
          userId: "referred_a",
          _count: { userId: 1 },
        },
      ])
      .mockResolvedValueOnce([
        {
          organizationId: "org_b",
          _count: { organizationId: 3 },
        },
      ]);
    mocks.organizationPositionFindMany.mockResolvedValue([
      {
        id: "position_b",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        organizationId: "org_b",
        statement: "We signed.",
        organization: {
          id: "org_b",
          name: "B Org",
          slug: "b-org",
          website: "https://b.example",
          squareLogoUrl: null,
          description: "B org description",
        },
      },
    ]);

    const data = await getReferendumSiteHomeData(getSiteConfig("warOnDisease"));
    const publicSignatories = (
      data as { publicSignatories?: PublicSignatoriesPage } | null
    )?.publicSignatories;

    expect(
      publicSignatories?.signatories.map((entry) =>
        entry.kind === "organization" ? entry.organization.id : entry.user.id,
      ),
    ).toEqual(["org_b", "user_a"]);
    expect(publicSignatories?.totalCount).toBe(2);
    expect(publicSignatories?.signatories[0]).toMatchObject({
      kind: "organization",
      totalSignatureCount: 3,
      referredYesCount: 3,
      livesSaved: VOTER_LIVES_SAVED.value * 3,
    });
    expect(publicSignatories?.signatories[1]).toMatchObject({
      kind: "human",
      totalSignatureCount: 2,
      referredYesCount: 1,
      livesSaved: VOTER_LIVES_SAVED.value * 2,
    });
  });
});
