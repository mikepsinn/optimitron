import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationMemberRole,
  TaskApplicationEventType,
  TaskApplicationStatus,
} from "@optimitron/db/enums";

const mocks = vi.hoisted(() => ({
  prisma: {
    organizationMemberFindFirst: vi.fn(),
    organizationMemberFindUnique: vi.fn(),
    taskFindUnique: vi.fn(),
    taskManagerFindFirst: vi.fn(),
    transaction: vi.fn(),
    userFindUnique: vi.fn(),
  },
  tx: {
    taskApplicationEventCreate: vi.fn(),
    taskApplicationFindUnique: vi.fn(),
    taskApplicationUpdate: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    organizationMember: {
      findFirst: mocks.prisma.organizationMemberFindFirst,
      findUnique: mocks.prisma.organizationMemberFindUnique,
    },
    task: {
      findUnique: mocks.prisma.taskFindUnique,
    },
    taskManager: {
      findFirst: mocks.prisma.taskManagerFindFirst,
    },
    user: {
      findUnique: mocks.prisma.userFindUnique,
    },
  },
}));

import {
  canReviewTaskApplications,
  updateTaskApplication,
} from "../task-applications.server";

function createTransactionClient() {
  return {
    taskApplication: {
      findUnique: mocks.tx.taskApplicationFindUnique,
      update: mocks.tx.taskApplicationUpdate,
    },
    taskApplicationEvent: {
      create: mocks.tx.taskApplicationEventCreate,
    },
  };
}

beforeEach(() => {
  for (const mockFn of Object.values(mocks.prisma)) {
    mockFn.mockReset();
  }
  for (const mockFn of Object.values(mocks.tx)) {
    mockFn.mockReset();
  }

  mocks.prisma.transaction.mockImplementation(
    async (
      callback: (tx: ReturnType<typeof createTransactionClient>) => unknown,
    ) => callback(createTransactionClient()),
  );
});

describe("updateTaskApplication", () => {
  it("records an event when reviewer changes application status", async () => {
    mocks.tx.taskApplicationFindUnique.mockResolvedValue({
      acceptedAt: null,
      answersJson: null,
      deletedAt: null,
      jurisdictionId: "jurisdiction_1",
      offeredAt: null,
      rejectedAt: null,
      reviewNote: null,
      reviewScore: null,
      reviewedAt: null,
      status: TaskApplicationStatus.APPLIED,
      withdrawnAt: null,
    });
    mocks.tx.taskApplicationUpdate.mockResolvedValue({
      answersJson: null,
      reviewNote: "Screening started.",
      reviewScore: null,
      status: TaskApplicationStatus.UNDER_REVIEW,
    });

    await updateTaskApplication("application_1", {
      reviewerUserId: "reviewer_1",
      status: TaskApplicationStatus.UNDER_REVIEW,
      reviewNote: "Screening started.",
    });

    expect(mocks.tx.taskApplicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewerUser: { connect: { id: "reviewer_1" } },
          reviewedAt: expect.any(Date),
          reviewNote: "Screening started.",
          status: TaskApplicationStatus.UNDER_REVIEW,
        }),
        where: { id: "application_1" },
      }),
    );
    expect(mocks.tx.taskApplicationEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "reviewer_1",
        applicationId: "application_1",
        eventType: TaskApplicationEventType.STATUS_CHANGED,
        fromStatus: TaskApplicationStatus.APPLIED,
        jurisdictionId: "jurisdiction_1",
        note: "Screening started.",
        toStatus: TaskApplicationStatus.UNDER_REVIEW,
      }),
    });
  });
});

describe("canReviewTaskApplications", () => {
  it("allows owner-organization admins to review applications for unassigned openings", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({
      assigneeOrganizationId: null,
      createdByUserId: "creator_user",
      deletedAt: null,
      ownerOrganizationId: "org_owner",
    });
    mocks.prisma.userFindUnique.mockResolvedValue({ isAdmin: false });
    mocks.prisma.organizationMemberFindFirst.mockResolvedValue({
      role: "admin",
    });

    await expect(
      canReviewTaskApplications("reviewer_user", "task_1"),
    ).resolves.toBe(true);

    expect(mocks.prisma.organizationMemberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: { in: ["org_owner"] },
        role: {
          in: [
            OrganizationMemberRole.OWNER,
            OrganizationMemberRole.ADMIN,
          ],
        },
        userId: "reviewer_user",
      },
      select: { role: true },
    });
    expect(mocks.prisma.organizationMemberFindUnique).not.toHaveBeenCalled();
  });

  it("allows direct task managers to review applications", async () => {
    mocks.prisma.taskFindUnique.mockResolvedValue({
      assigneeOrganizationId: null,
      createdByUserId: "creator_user",
      deletedAt: null,
      ownerOrganizationId: null,
    });
    mocks.prisma.userFindUnique.mockResolvedValue({ isAdmin: false });
    mocks.prisma.taskManagerFindFirst.mockResolvedValue({
      role: "reviewer",
    });

    await expect(
      canReviewTaskApplications("reviewer_user", "task_1"),
    ).resolves.toBe(true);

    expect(mocks.prisma.taskManagerFindFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        role: { in: ["owner", "manager", "reviewer"] },
        taskId: "task_1",
        userId: "reviewer_user",
      },
      select: { role: true },
    });
  });
});
