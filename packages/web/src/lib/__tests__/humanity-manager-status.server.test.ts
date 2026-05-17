import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    referralInvitation: {
      count: vi.fn(),
      findMany: vi.fn(),
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

import { loadHumanityManagerStatus } from "../humanity-manager-status.server";

describe("loadHumanityManagerStatus", () => {
  beforeEach(() => {
    mocks.prisma.referralInvitation.count.mockReset();
    mocks.prisma.referralInvitation.findMany.mockReset();
    mocks.prisma.$queryRaw.mockReset();
    mocks.prisma.task.count.mockReset();
    mocks.prisma.task.findMany.mockReset();
  });

  it("uses cached downstream User columns while direct referral rows stay live", async () => {
    mocks.prisma.referralInvitation.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
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
