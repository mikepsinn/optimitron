import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrReplaceTaskFundingPledge: vi.fn(),
  prismaTransaction: vi.fn(),
  taskFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prismaTransaction,
    task: { findFirst: mocks.taskFindFirst },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: vi.fn(),
  isStripeConfigured: () => true,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

vi.mock("@/lib/routes", () => ({
  getTaskPath: (taskId: string) => `/tasks/${taskId}`,
}));

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.test",
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

const staleBinding = {
  governingDocumentRevisionIds: ["revision_stale_terms"],
  issuerUserId: "issuer_stale",
  schema: "optimitron.contribution-receipt-binding.v1" as const,
  termsDocumentRevisionId: "revision_stale_terms",
};

const frozenBinding = {
  governingDocumentRevisionIds: ["revision_frozen_terms"],
  issuerUserId: "issuer_frozen",
  schema: "optimitron.contribution-receipt-binding.v1" as const,
  termsDocumentRevisionId: "revision_frozen_terms",
};

const staleTask = {
  compensationCurrency: "usd",
  compensationMaxAmountMinorUnits: 10_000n,
  contextJson: { contributionReceipt: staleBinding },
  currentImpactEstimateSet: null,
  fundingTarget: null,
  id: "task_binding_race",
  title: "Fund a concrete work package",
};

function buildTransactionWithConcurrentWinner() {
  return {
    $executeRaw: vi.fn(async () => 1),
    commerceOrder: { create: vi.fn() },
    taskFundingPayment: { create: vi.fn() },
    taskFundingTarget: {
      create: vi.fn(),
      findUnique: vi.fn(async () => ({
        id: "target_binding_race",
        metadata: {
          contributionReceipt: frozenBinding,
          createdBy: "concurrent-winner",
        },
        targetAmountCents: 10_000n,
      })),
      update: vi.fn(),
    },
  };
}

function buildTransactionWithConcurrentContext(currentBinding: typeof frozenBinding) {
  return {
    $executeRaw: vi.fn(async () => 1),
    commerceOrder: { create: vi.fn() },
    task: {
      findFirst: vi.fn(async () => ({
        contextJson: { contributionReceipt: currentBinding },
      })),
    },
    taskFundingPayment: { create: vi.fn() },
    taskFundingTarget: {
      create: vi.fn(),
      findUnique: vi.fn(async () => null),
      update: vi.fn(),
    },
  };
}

function buildTransactionWithPaidLegacyTarget() {
  return {
    $executeRaw: vi.fn(async () => 1),
    commerceOrder: { create: vi.fn() },
    task: {
      findFirst: vi.fn(async () => ({
        contextJson: { contributionReceipt: staleBinding },
      })),
    },
    taskFundingPayment: {
      create: vi.fn(),
      findFirst: vi.fn(async () => ({ id: "payment_legacy" })),
    },
    taskFundingTarget: {
      create: vi.fn(),
      findUnique: vi.fn(async () => ({
        id: "target_legacy",
        metadata: { createdBy: "legacy" },
        targetAmountCents: 10_000n,
      })),
      update: vi.fn(),
    },
  };
}

describe("funding target binding races", () => {
  beforeEach(() => {
    mocks.prismaTransaction.mockReset();
    mocks.taskFindFirst.mockReset();
    mocks.taskFindFirst.mockResolvedValue(staleTask);
    mocks.createOrReplaceTaskFundingPledge.mockReset();
  });

  it("rejects checkout when a different binding won after the task pre-read", async () => {
    const tx = buildTransactionWithConcurrentWinner();
    const db = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      task: { findFirst: vi.fn(async () => staleTask) },
    };

    await expect(
      createTaskFundingCheckoutSession(
        { amountCents: 5_000, taskId: staleTask.id },
        db as never,
      ),
    ).rejects.toThrow(
      "existing funding round is already bound to different adopted terms",
    );

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.taskFundingTarget.update).not.toHaveBeenCalled();
    expect(tx.commerceOrder.create).not.toHaveBeenCalled();
  });

  it("rejects checkout when task context changed before a no-target first write", async () => {
    const tx = buildTransactionWithConcurrentContext(frozenBinding);
    const db = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      task: { findFirst: vi.fn(async () => staleTask) },
    };

    await expect(
      createTaskFundingCheckoutSession(
        { amountCents: 5_000, taskId: staleTask.id },
        db as never,
      ),
    ).rejects.toThrow("adopted receipt binding changed before funding started");

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.task.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.taskFundingTarget.create).not.toHaveBeenCalled();
    expect(tx.commerceOrder.create).not.toHaveBeenCalled();
  });

  it("does not retroactively bind an unbound legacy target after a payment exists", async () => {
    const tx = buildTransactionWithPaidLegacyTarget();
    const db = {
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      task: { findFirst: vi.fn(async () => staleTask) },
    };

    await expect(
      createTaskFundingCheckoutSession(
        { amountCents: 5_000, taskId: staleTask.id },
        db as never,
      ),
    ).rejects.toThrow(
      "target with existing payments cannot receive its first receipt binding",
    );

    expect(tx.taskFundingPayment.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.taskFundingTarget.update).not.toHaveBeenCalled();
    expect(tx.commerceOrder.create).not.toHaveBeenCalled();
  });

  it("rejects pledge setup when a different binding won after the task pre-read", async () => {
    const tx = buildTransactionWithConcurrentWinner();
    mocks.prismaTransaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      createPledgeCardSetupSession({
        amountCents: 5_000,
        cancelUrl: "https://optimitron.test/tasks/task_binding_race",
        successUrl:
          "https://optimitron.test/tasks/task_binding_race?pledged=1",
        taskId: staleTask.id,
        userId: "user_1",
      }),
    ).rejects.toThrow(
      "existing funding round is already bound to different adopted terms",
    );

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.taskFundingTarget.update).not.toHaveBeenCalled();
    expect(mocks.createOrReplaceTaskFundingPledge).not.toHaveBeenCalled();
  });
});
