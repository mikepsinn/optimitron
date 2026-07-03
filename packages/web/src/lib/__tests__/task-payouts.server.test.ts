import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommerceOrderStatus,
  StripeConnectedAccountStatus,
  StripeTransferCapabilityStatus,
  TaskClaimStatus,
  TaskCompensationCadence,
  TaskCompensationKind,
  TaskFundingPaymentStatus,
  TaskPayoutStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  canUseStripeForTaskCompensation,
  getAvailableTaskFundingCents,
  getFixedTaskPayoutAmountCents,
  queueTaskPayoutForVerifiedClaim,
} from "../task-payouts.server";

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    transfers: {
      create: async () => ({ id: "tr_test_concurrency" }),
    },
  }),
  isStripeConfigured: () => true,
}));

const TEST_PREFIX = "task_payouts_";

async function cleanup() {
  await prisma.taskPayout.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskClaim.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.stripeConnectedAccount.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPayment.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOrder.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingTarget.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createUser(suffix: string) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_${suffix}`,
      displayName: `Payout Person ${suffix}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${suffix}`,
      email: `${TEST_PREFIX}${suffix}@example.test`,
      personId: person.id,
    },
  });

  return { person, user };
}

async function createPaidFunding(input: {
  amountCents: number;
  status?: TaskFundingPaymentStatus;
  suffix: string;
  targetId: string;
  taskId: string;
}) {
  const paymentStatus = input.status ?? TaskFundingPaymentStatus.PAID;
  const order = await prisma.commerceOrder.create({
    data: {
      id: `${TEST_PREFIX}order_${input.suffix}`,
      currency: "usd",
      donationCents: input.amountCents,
      purposeKey: "task-funding",
      status:
        paymentStatus === TaskFundingPaymentStatus.PAID
          ? CommerceOrderStatus.PAID
          : CommerceOrderStatus.FAILED,
      subtotalCents: input.amountCents,
      totalCents: input.amountCents,
    },
  });

  return prisma.taskFundingPayment.create({
    data: {
      id: `${TEST_PREFIX}payment_${input.suffix}`,
      amountCents: input.amountCents,
      commerceOrderId: order.id,
      currency: "usd",
      status: paymentStatus,
      stripeCheckoutSessionId: `${TEST_PREFIX}cs_${input.suffix}`,
      stripeTransferGroup: `${TEST_PREFIX}transfer_group`,
      targetId: input.targetId,
      taskId: input.taskId,
    },
  });
}

async function createReadyConnectedAccount(userId: string, suffix: string) {
  return prisma.stripeConnectedAccount.create({
    data: {
      id: `${TEST_PREFIX}connect_${suffix}`,
      status: StripeConnectedAccountStatus.ONBOARDING_COMPLETE,
      stripeAccountId: `${TEST_PREFIX}acct_${suffix}`,
      transfersCapabilityStatus: StripeTransferCapabilityStatus.ACTIVE,
      userId,
    },
  });
}

async function createVerifiedClaim(input: {
  suffix: string;
  taskId: string;
  userId: string;
}) {
  return prisma.taskClaim.create({
    data: {
      id: `${TEST_PREFIX}claim_${input.suffix}`,
      status: TaskClaimStatus.VERIFIED,
      taskId: input.taskId,
      userId: input.userId,
      verifiedAt: new Date(),
    },
  });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("task payout calculations", () => {
  it("uses fixed paid Stripe compensation as the payout cap", () => {
    const task = {
      compensationCadence: TaskCompensationCadence.FIXED,
      compensationCurrency: "usd",
      compensationKind: TaskCompensationKind.BOUNTY,
      compensationMaxAmountMinorUnits: 12_500n,
      compensationPaymentRails: ["stripe"],
    };

    expect(canUseStripeForTaskCompensation(task)).toBe(true);
    expect(getFixedTaskPayoutAmountCents(task)).toBe(12_500);
    expect(
      getFixedTaskPayoutAmountCents({
        ...task,
        compensationCadence: TaskCompensationCadence.HOURLY,
      }),
    ).toBeNull();
    expect(
      getFixedTaskPayoutAmountCents({
        ...task,
        compensationPaymentRails: ["ach"],
      }),
    ).toBeNull();
  });

  it("reserves only committed payouts, not pending or canceled, from available paid funds", async () => {
    const creator = await createUser("creator");
    const worker = await createUser("worker");
    const task = await prisma.task.create({
      data: {
        id: `${TEST_PREFIX}task_available`,
        compensationCadence: TaskCompensationCadence.FIXED,
        compensationKind: TaskCompensationKind.BOUNTY,
        compensationMaxAmountMinorUnits: 5000n,
        compensationPaymentRails: ["stripe"],
        createdByUserId: creator.user.id,
        description: "A paid task with funded payouts.",
        title: "Funded payout task",
      },
    });
    const target = await prisma.taskFundingTarget.create({
      data: {
        id: `${TEST_PREFIX}target_available`,
        targetAmountCents: 10_000n,
        taskId: task.id,
      },
    });

    await createPaidFunding({
      amountCents: 10_000,
      suffix: "paid",
      targetId: target.id,
      taskId: task.id,
    });
    await createPaidFunding({
      amountCents: 9000,
      status: TaskFundingPaymentStatus.FAILED,
      suffix: "failed",
      targetId: target.id,
      taskId: task.id,
    });
    await prisma.taskPayout.createMany({
      data: [
        {
          id: `${TEST_PREFIX}payout_allocated`,
          amountCents: 3000,
          payeeUserId: worker.user.id,
          status: TaskPayoutStatus.TRANSFERRED,
          taskId: task.id,
        },
        {
          // PENDING_FUNDS is waiting, not committed — it must NOT reserve funds,
          // otherwise two competing claims on one task block each other forever.
          id: `${TEST_PREFIX}payout_pending`,
          amountCents: 4000,
          payeeUserId: worker.user.id,
          status: TaskPayoutStatus.PENDING_FUNDS,
          taskId: task.id,
        },
        {
          id: `${TEST_PREFIX}payout_canceled`,
          amountCents: 2000,
          canceledAt: new Date(),
          payeeUserId: worker.user.id,
          status: TaskPayoutStatus.CANCELED,
          taskId: task.id,
        },
      ],
    });

    // 10_000 funded - 3_000 committed (TRANSFERRED). Pending + canceled ignored.
    await expect(getAvailableTaskFundingCents(task.id)).resolves.toBe(7000);
    await expect(
      getAvailableTaskFundingCents(task.id, {
        excludePayoutId: `${TEST_PREFIX}payout_allocated`,
      }),
    ).resolves.toBe(10_000);
  });

  it("does not double-allocate one task's funding across concurrent claim verifications", async () => {
    const creator = await createUser("cc_creator");
    const workerA = await createUser("cc_a");
    const workerB = await createUser("cc_b");
    await createReadyConnectedAccount(workerA.user.id, "cc_a");
    await createReadyConnectedAccount(workerB.user.id, "cc_b");

    const task = await prisma.task.create({
      data: {
        id: `${TEST_PREFIX}task_race`,
        compensationCadence: TaskCompensationCadence.FIXED,
        compensationKind: TaskCompensationKind.BOUNTY,
        compensationMaxAmountMinorUnits: 10_000n,
        compensationPaymentRails: ["stripe"],
        createdByUserId: creator.user.id,
        description: "A paid task with only enough funding for one worker.",
        title: "Single-funded race task",
      },
    });
    const target = await prisma.taskFundingTarget.create({
      data: {
        id: `${TEST_PREFIX}target_race`,
        targetAmountCents: 10_000n,
        taskId: task.id,
      },
    });
    // Funds exactly one $100 payout.
    await createPaidFunding({
      amountCents: 10_000,
      suffix: "race",
      targetId: target.id,
      taskId: task.id,
    });

    const claimA = await createVerifiedClaim({
      suffix: "cc_a",
      taskId: task.id,
      userId: workerA.user.id,
    });
    const claimB = await createVerifiedClaim({
      suffix: "cc_b",
      taskId: task.id,
      userId: workerB.user.id,
    });

    await Promise.all([
      queueTaskPayoutForVerifiedClaim({ claimId: claimA.id, taskId: task.id }),
      queueTaskPayoutForVerifiedClaim({ claimId: claimB.id, taskId: task.id }),
    ]);

    const payouts = await prisma.taskPayout.findMany({
      where: { deletedAt: null, taskId: task.id },
      select: { amountCents: true, status: true },
    });

    expect(payouts).toHaveLength(2);
    const committedStatuses: TaskPayoutStatus[] = [
      TaskPayoutStatus.READY,
      TaskPayoutStatus.PROCESSING,
      TaskPayoutStatus.TRANSFERRED,
    ];
    const committedCents = payouts
      .filter((p) => committedStatuses.includes(p.status))
      .reduce((sum, p) => sum + p.amountCents, 0);
    // Never allocate more than the task was funded for.
    expect(committedCents).toBeLessThanOrEqual(10_000);
    // Exactly one worker is paid; the other waits on more funding.
    expect(
      payouts.filter((p) => p.status === TaskPayoutStatus.TRANSFERRED),
    ).toHaveLength(1);
    expect(
      payouts.filter((p) => p.status === TaskPayoutStatus.PENDING_FUNDS),
    ).toHaveLength(1);
  });
});
