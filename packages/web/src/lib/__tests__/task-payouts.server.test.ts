import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  CommerceOrderStatus,
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
} from "../task-payouts.server";

const TEST_PREFIX = "task_payouts_";

async function cleanup() {
  await prisma.taskPayout.deleteMany({
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

  it("subtracts allocated payouts but not canceled payouts from available paid funds", async () => {
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
          status: TaskPayoutStatus.PENDING_CONNECT,
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

    await expect(getAvailableTaskFundingCents(task.id)).resolves.toBe(7000);
    await expect(
      getAvailableTaskFundingCents(task.id, {
        excludePayoutId: `${TEST_PREFIX}payout_allocated`,
      }),
    ).resolves.toBe(10_000);
  });
});
