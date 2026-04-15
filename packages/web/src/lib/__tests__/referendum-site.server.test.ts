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
    mocks.organizationPositionCount.mockReset();
    mocks.organizationPositionFindMany.mockReset();
    mocks.getTaskDetailData.mockResolvedValue(null);
  });

  it("requires both approved orgs and approved YES positions in supporter queries", () => {
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

  it("uses dual-approval filters for homepage counters", async () => {
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

  it("uses the same dual-approval filters for supporters lists", async () => {
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
});
