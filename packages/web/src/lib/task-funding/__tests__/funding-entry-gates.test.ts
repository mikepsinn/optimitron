import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrReplaceTaskFundingPledge: vi.fn(),
  getStripeClient: vi.fn(),
  resolveContributionReceiptBinding: vi.fn(),
  stripeConfigured: vi.fn(() => true),
  taskFindFirst: vi.fn(),
  taskFundingTargetUpsert: vi.fn(),
  userFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findFirst: mocks.taskFindFirst },
    taskFundingTarget: { upsert: mocks.taskFundingTargetUpsert },
    user: {
      findFirst: mocks.userFindFirst,
      findUnique: mocks.userFindUnique,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: mocks.getStripeClient,
  isStripeConfigured: mocks.stripeConfigured,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("@/lib/routes", () => ({
  getTaskPath: (taskId: string) => `/tasks/${taskId}`,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.test",
}));

vi.mock("../contribution-receipts.server", () => ({
  issuePaidContributionReceiptInTransaction: vi.fn(),
  requireContributionReceiptBinding: vi.fn(),
  resolveContributionReceiptBinding: mocks.resolveContributionReceiptBinding,
}));

vi.mock("../pledges.server", () => ({
  createOrReplaceTaskFundingPledge: mocks.createOrReplaceTaskFundingPledge,
}));

vi.mock("@/lib/task-payouts.server", () => ({
  withTaskFundingLock: vi.fn(),
}));

vi.mock("@/lib/email/task-funding-pledge-confirmation-email", () => ({
  sendPledgeConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/email/task-funding-pledge-decline-email", () => ({
  sendPledgeDeclineRecoveryEmail: vi.fn(),
}));

vi.mock("@/lib/email/task-funding-pledge-receipt-email", () => ({
  sendPledgeChargeReceiptEmail: vi.fn(),
}));

import { createPledgeCardSetupSession } from "../escrow.server";
import { createTaskFundingCheckoutSession } from "../payments.server";

const UNBOUND_TASK = {
  compensationCurrency: "usd",
  compensationMaxAmountMinorUnits: 10_000n,
  contextJson: {},
  currentImpactEstimateSet: null,
  fundingTarget: null,
  id: "task_unbound",
  title: "Fund a concrete work package",
};

describe("funding entry gates", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      if (typeof mock === "function" && "mockReset" in mock) mock.mockReset();
    }
    mocks.stripeConfigured.mockReturnValue(true);
    mocks.resolveContributionReceiptBinding.mockImplementation(() => {
      throw new Error(
        "Task funding requires adopted terms and governing document revisions before payment",
      );
    });
    mocks.taskFindFirst.mockResolvedValue(UNBOUND_TASK);
  });

  it("rejects checkout before transaction or Stripe writes when adopted receipt terms are absent", async () => {
    const db = {
      $transaction: vi.fn(),
      task: { findFirst: vi.fn().mockResolvedValue(UNBOUND_TASK) },
    };

    await expect(
      createTaskFundingCheckoutSession(
        { amountCents: 5_000, taskId: UNBOUND_TASK.id },
        db as never,
      ),
    ).rejects.toThrow(
      "Task funding requires adopted terms and governing document revisions before payment",
    );

    expect(mocks.resolveContributionReceiptBinding).toHaveBeenCalledWith(
      undefined,
      {},
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(mocks.getStripeClient).not.toHaveBeenCalled();
  });

  it("rejects pledge setup before funding, user, pledge, or Stripe writes when adopted terms are absent", async () => {
    await expect(
      createPledgeCardSetupSession({
        amountCents: 5_000,
        cancelUrl: "https://optimitron.test/tasks/task_unbound",
        successUrl: "https://optimitron.test/tasks/task_unbound?pledged=1",
        taskId: UNBOUND_TASK.id,
        userId: "user_1",
      }),
    ).rejects.toThrow(
      "Task funding requires adopted terms and governing document revisions before payment",
    );

    expect(mocks.resolveContributionReceiptBinding).toHaveBeenCalledWith(
      undefined,
      {},
    );
    expect(mocks.taskFundingTargetUpsert).not.toHaveBeenCalled();
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
    expect(mocks.createOrReplaceTaskFundingPledge).not.toHaveBeenCalled();
    expect(mocks.getStripeClient).not.toHaveBeenCalled();
  });
});
