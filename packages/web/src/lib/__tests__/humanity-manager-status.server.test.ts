import { beforeEach, describe, expect, it, vi } from "vitest";
import { VotePosition } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    referralInvitation: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    referendumVote: {
      count: vi.fn(),
    },
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import {
  getKFactorForUser,
  loadHumanityManagerStatus,
} from "../humanity-manager-status.server";

describe("loadHumanityManagerStatus", () => {
  beforeEach(() => {
    mocks.prisma.referralInvitation.count.mockReset();
    mocks.prisma.referralInvitation.findMany.mockReset();
    mocks.prisma.referendumVote.count.mockReset();
    mocks.prisma.$queryRaw.mockReset();
    mocks.prisma.task.count.mockReset();
    mocks.prisma.task.findMany.mockReset();
  });

  it("uses cached downstream User columns while direct referral rows stay live", async () => {
    mocks.prisma.referralInvitation.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    mocks.prisma.referralInvitation.findMany
      .mockResolvedValueOnce([
        {
          convertedAt: new Date("2026-05-02T00:00:00.000Z"),
          convertedVote: {
            createdAt: new Date("2026-05-02T00:00:00.000Z"),
            person: { displayName: "Ada Lovelace" },
            userId: "user_ada",
            user: { person: { displayName: null } },
          },
          recipientName: "Ada",
        },
      ])
      .mockResolvedValueOnce([
        {
          inviteToken: "invite_1",
          recipientName: "Jake Smith",
        },
      ]);
    mocks.prisma.$queryRaw.mockResolvedValueOnce([
      {
        convertedUserId: "user_ada",
        downstreamConversionCount: 3n,
      },
    ]);
    mocks.prisma.task.count.mockResolvedValueOnce(1);
    mocks.prisma.task.findMany.mockResolvedValueOnce([
      {
        assigneeAffiliationSnapshot: "Example Republic",
        assigneePerson: {
          countryCode: "US",
          currentAffiliation: "Example Republic",
          displayName: "President Example",
          handle: "president-example",
        },
        contextJson: {
          assigneeProfile: {
            budgetUsdPerYear: 900_000_000_000,
            governmentBudgetUsdPerYear: 6_000_000_000_000,
          },
        },
        dueAt: new Date("2026-05-01T00:00:00.000Z"),
        id: "task_1",
        taskKey: "treaty-signer:example",
        title: "Sign the 1% Treaty",
      },
    ]);
    mocks.prisma.referendumVote.count.mockResolvedValueOnce(3);

    const result = await loadHumanityManagerStatus({
      baseUrl: "https://warondisease.org",
      now: new Date("2026-05-15T00:00:00.000Z"),
      user: {
        downstreamConversionCount: 7,
        handle: "mike",
        referralCode: "ref_123",
      },
      userId: "user_1",
    });

    expect(result.directConversionCount).toBe(2);
    expect(result.downstreamConversionCount).toBe(7);
    expect(result.kFactor30d).toBe(0.75);
    expect(result.completedEmployees[0]).toMatchObject({
      displayName: "Ada Lovelace",
      downstreamConversionCount: 3,
    });
    expect(result.overdueEmployees[0]).toMatchObject({
      displayName: "Jake Smith",
    });
    expect(result.reminders.map((reminder) => reminder.recipientMode)).toEqual([
      "one_human",
      "leader",
    ]);
    expect(result.reminders[0]?.message).toContain(
      "https://warondisease.org/vote/mike?invite=invite_1",
    );
    expect(result.reminders[1]?.message).toContain("President Example");
    expect(result.reminders[1]?.message).not.toMatch(/\{\w+\}/);
  });
});

describe("getKFactorForUser", () => {
  beforeEach(() => {
    mocks.prisma.referralInvitation.count.mockReset();
    mocks.prisma.referendumVote.count.mockReset();
  });

  it("counts 30-day treaty YES referral votes over invitations and returns 0 with no invitations", async () => {
    const now = new Date("2026-05-17T12:00:00.000Z");
    const since = new Date("2026-04-17T12:00:00.000Z");

    mocks.prisma.referendumVote.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5);
    mocks.prisma.referralInvitation.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0);

    await expect(getKFactorForUser("user_1", now)).resolves.toBe(0.5);
    await expect(getKFactorForUser("user_zero", now)).resolves.toBe(0);

    expect(mocks.prisma.referendumVote.count).toHaveBeenNthCalledWith(1, {
      where: {
        answer: VotePosition.YES,
        createdAt: { gte: since, lte: now },
        deletedAt: null,
        referredByUserId: "user_1",
        referendum: {
          deletedAt: null,
          slug: "one-percent-treaty",
        },
      },
    });
    expect(mocks.prisma.referralInvitation.count).toHaveBeenNthCalledWith(1, {
      where: {
        createdAt: { gte: since, lte: now },
        deletedAt: null,
        referrerUserId: "user_1",
      },
    });
  });
});
