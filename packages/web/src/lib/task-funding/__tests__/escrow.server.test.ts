import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommerceOrderStatus,
  TaskFundingPaymentSource,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  maybeChargeCallablePledges,
  refundDeadTargetFunding,
} from "../escrow.server";

const mocks = vi.hoisted(() => ({
  paymentIntentsCreate: vi.fn(),
  refundsCreate: vi.fn(),
  sendDeclineEmail: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    paymentIntents: { create: mocks.paymentIntentsCreate },
    refunds: { create: mocks.refundsCreate },
  }),
  isStripeConfigured: () => true,
}));

vi.mock("@/lib/email/task-funding-pledge-decline-email", () => ({
  sendPledgeDeclineRecoveryEmail: mocks.sendDeclineEmail,
}));

const TEST_PREFIX = "tf_escrow_";

/** Minimal shape maybeChargeCallablePledges reads off a confirmed intent. */
function succeededPaymentIntent(id: string) {
  return { id, latest_charge: `${id}_ch`, status: "succeeded" };
}

/** Off-session decline as the Stripe SDK throws it (StripeCardError). */
function cardDeclinedError() {
  return Object.assign(new Error("Your card was declined."), {
    code: "card_declined",
    decline_code: "generic_decline",
    payment_intent: { id: "pi_tf_escrow_declined" },
    type: "StripeCardError",
  });
}

async function cleanup() {
  // Charge-path CommerceOrders get cuid ids; find them through the payments
  // (taskId is prefixed) before the payment rows are deleted.
  const payments = await prisma.taskFundingPayment.findMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
    select: { commerceOrderId: true },
  });
  await prisma.taskFundingPayment.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingEvent.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPledge.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOrder.deleteMany({
    where: {
      OR: [
        { id: { startsWith: TEST_PREFIX } },
        { id: { in: payments.map((payment) => payment.commerceOrderId) } },
      ],
    },
  });
  await prisma.taskFundingTarget.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createFundedTask(
  suffix: string,
  targetAmountCents: bigint,
  status: TaskFundingTargetStatus = TaskFundingTargetStatus.OPEN,
) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_creator_${suffix}`,
      displayName: `Escrow Creator ${suffix}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_creator_${suffix}`,
      email: `${TEST_PREFIX}creator_${suffix}@example.test`,
      personId: person.id,
    },
  });
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: user.id,
      description: "A task with an assurance-escrow funding target.",
      title: `Escrow task ${suffix}`,
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${suffix}`,
      status,
      targetAmountCents,
      taskId: task.id,
    },
  });
  return { target, task };
}

async function createPledger(suffix: string) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_${suffix}`,
      displayName: `Escrow Pledger ${suffix}`,
    },
  });
  return prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${suffix}`,
      email: `${TEST_PREFIX}${suffix}@example.test`,
      personId: person.id,
      stripeCustomerId: `${TEST_PREFIX}cus_${suffix}`,
    },
  });
}

async function createPledge(input: {
  amountCents: bigint;
  cardBacked: boolean;
  suffix: string;
  targetId: string;
  userId: string;
}) {
  return prisma.taskFundingPledge.create({
    data: {
      id: `${TEST_PREFIX}pledge_${input.suffix}`,
      committedAmountCents: input.amountCents,
      conversionVersion: "test",
      pledgeActorKey: `person:${TEST_PREFIX}person_${input.suffix}`,
      pledgedByUserId: input.userId,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      status: TaskFundingPledgeStatus.ACTIVE,
      stripePaymentMethodId: input.cardBacked
        ? `${TEST_PREFIX}pm_${input.suffix}`
        : null,
      stripeSetupIntentId: input.cardBacked
        ? `${TEST_PREFIX}si_${input.suffix}`
        : null,
      targetId: input.targetId,
      unitKey: "usd",
      unitQuantity: (Number(input.amountCents) / 100).toString(),
    },
  });
}

async function createPaidCheckoutPayment(input: {
  amountCents: number;
  suffix: string;
  targetId: string;
  taskId: string;
}) {
  const order = await prisma.commerceOrder.create({
    data: {
      id: `${TEST_PREFIX}order_${input.suffix}`,
      currency: "usd",
      donationCents: input.amountCents,
      purposeKey: "task-funding",
      status: CommerceOrderStatus.PAID,
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
      paidAt: new Date(),
      status: TaskFundingPaymentStatus.PAID,
      stripeChargeId: `${TEST_PREFIX}ch_${input.suffix}`,
      stripeCheckoutSessionId: `${TEST_PREFIX}cs_${input.suffix}`,
      stripeTransferGroup: `task_funding_${input.taskId}`,
      targetId: input.targetId,
      taskId: input.taskId,
    },
  });
}

beforeEach(async () => {
  mocks.paymentIntentsCreate.mockReset();
  mocks.refundsCreate.mockReset();
  mocks.sendDeclineEmail.mockReset();
  mocks.sendDeclineEmail.mockResolvedValue({ status: "sent" });
  await cleanup();
});
afterAll(cleanup);

describe("maybeChargeCallablePledges", () => {
  it("does not count soft (no-card) pledges toward fully funded", async () => {
    const { target, task } = await createFundedTask("soft", 10_000n);
    await createPaidCheckoutPayment({
      amountCents: 4000,
      suffix: "soft",
      targetId: target.id,
      taskId: task.id,
    });
    const pledger = await createPledger("soft");
    await createPledge({
      amountCents: 6000n,
      cardBacked: false,
      suffix: "soft",
      targetId: target.id,
      userId: pledger.id,
    });

    const result = await maybeChargeCallablePledges(target.id);

    expect(result).toEqual({ charged: [], declined: [], fullyFunded: false });
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled();
    await expect(
      prisma.taskFundingPayment.count({
        where: {
          source: TaskFundingPaymentSource.PLEDGE_CALL,
          targetId: target.id,
        },
      }),
    ).resolves.toBe(0);
  });

  it("charges card-backed pledges once PAID payments + card pledges reach the target", async () => {
    const { target, task } = await createFundedTask("full", 10_000n);
    await createPaidCheckoutPayment({
      amountCents: 4000,
      suffix: "full",
      targetId: target.id,
      taskId: task.id,
    });
    const pledger = await createPledger("full");
    const pledge = await createPledge({
      amountCents: 6000n,
      cardBacked: true,
      suffix: "full",
      targetId: target.id,
      userId: pledger.id,
    });
    mocks.paymentIntentsCreate.mockResolvedValue(
      succeededPaymentIntent("pi_tf_escrow_full"),
    );

    const result = await maybeChargeCallablePledges(target.id);

    expect(result.fullyFunded).toBe(true);
    expect(result.declined).toEqual([]);
    expect(result.charged).toHaveLength(1);
    expect(result.charged[0]).toMatchObject({
      amountCents: 6000,
      pledgeId: pledge.id,
      targetId: target.id,
      taskId: task.id,
    });

    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 6000,
        confirm: true,
        customer: pledger.stripeCustomerId,
        off_session: true,
        payment_method: `${TEST_PREFIX}pm_full`,
      }),
      { idempotencyKey: `pledge-call:${pledge.id}:v1` },
    );

    const chargedPledge = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
      select: { calledAt: true, fulfilledAt: true, status: true },
    });
    expect(chargedPledge.status).toBe(TaskFundingPledgeStatus.FULFILLED);
    expect(chargedPledge.calledAt).not.toBeNull();
    expect(chargedPledge.fulfilledAt).not.toBeNull();

    const payment = await prisma.taskFundingPayment.findUniqueOrThrow({
      where: { pledgeId: pledge.id },
      select: {
        amountCents: true,
        commerceOrder: { select: { status: true } },
        source: true,
        status: true,
        stripePaymentIntentId: true,
      },
    });
    expect(payment).toMatchObject({
      amountCents: 6000,
      source: TaskFundingPaymentSource.PLEDGE_CALL,
      status: TaskFundingPaymentStatus.PAID,
      stripePaymentIntentId: "pi_tf_escrow_full",
    });
    expect(payment.commerceOrder.status).toBe(CommerceOrderStatus.PAID);
  });

  it("creates exactly one PLEDGE_CALL payment per pledge under concurrent runs", async () => {
    const { target } = await createFundedTask("race", 5000n);
    const pledger = await createPledger("race");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "race",
      targetId: target.id,
      userId: pledger.id,
    });
    mocks.paymentIntentsCreate.mockResolvedValue(
      succeededPaymentIntent("pi_tf_escrow_race"),
    );

    // Must not throw: the advisory lock serializes planning, so the second
    // run either re-confirms the same idempotent intent or skips a settled one.
    await Promise.all([
      maybeChargeCallablePledges(target.id),
      maybeChargeCallablePledges(target.id),
    ]);

    const payments = await prisma.taskFundingPayment.findMany({
      where: { pledgeId: pledge.id },
      select: { source: true, status: true },
    });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toEqual({
      source: TaskFundingPaymentSource.PLEDGE_CALL,
      status: TaskFundingPaymentStatus.PAID,
    });

    // Every Stripe confirm for this pledge reused the deterministic key.
    expect(mocks.paymentIntentsCreate.mock.calls.length).toBeGreaterThan(0);
    for (const call of mocks.paymentIntentsCreate.mock.calls) {
      expect(call[1]).toEqual({
        idempotencyKey: `pledge-call:${pledge.id}:v1`,
      });
    }

    await expect(
      prisma.taskFundingPledge.findUniqueOrThrow({
        where: { id: pledge.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskFundingPledgeStatus.FULFILLED });
  });

  it("marks a declined pledge DECLINED and still charges the remaining pledges", async () => {
    const { target } = await createFundedTask("decline", 10_000n);
    const pledgerA = await createPledger("decline_a");
    const pledgerB = await createPledger("decline_b");
    const pledgeA = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "decline_a",
      targetId: target.id,
      userId: pledgerA.id,
    });
    const pledgeB = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "decline_b",
      targetId: target.id,
      userId: pledgerB.id,
    });
    mocks.paymentIntentsCreate.mockImplementation(
      (params: { metadata?: { pledgeId?: string } }) => {
        if (params.metadata?.pledgeId === pledgeA.id) {
          throw cardDeclinedError();
        }
        return Promise.resolve(succeededPaymentIntent("pi_tf_escrow_ok"));
      },
    );

    const result = await maybeChargeCallablePledges(target.id);

    expect(result.fullyFunded).toBe(true);
    expect(result.declined).toHaveLength(1);
    expect(result.declined[0]).toMatchObject({
      declineCode: "generic_decline",
      pledgeId: pledgeA.id,
    });
    expect(result.charged).toHaveLength(1);
    expect(result.charged[0]).toMatchObject({ pledgeId: pledgeB.id });

    const declined = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledgeA.id },
      select: {
        declinedAt: true,
        payment: { select: { failedAt: true, status: true } },
        status: true,
      },
    });
    expect(declined.status).toBe(TaskFundingPledgeStatus.DECLINED);
    expect(declined.declinedAt).not.toBeNull();
    expect(declined.payment?.status).toBe(TaskFundingPaymentStatus.FAILED);
    expect(declined.payment?.failedAt).not.toBeNull();

    const fulfilled = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledgeB.id },
      select: {
        payment: { select: { status: true } },
        status: true,
      },
    });
    expect(fulfilled.status).toBe(TaskFundingPledgeStatus.FULFILLED);
    expect(fulfilled.payment?.status).toBe(TaskFundingPaymentStatus.PAID);

    expect(mocks.sendDeclineEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendDeclineEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        pledge: expect.objectContaining({ id: pledgeA.id }),
      }),
    );
  });
});

describe("refundDeadTargetFunding", () => {
  it("refunds PAID payments with a deterministic key and cancels un-charged card pledges", async () => {
    const { target, task } = await createFundedTask(
      "refund",
      10_000n,
      TaskFundingTargetStatus.EXPIRED,
    );
    const payment = await createPaidCheckoutPayment({
      amountCents: 4000,
      suffix: "refund",
      targetId: target.id,
      taskId: task.id,
    });
    const pledger = await createPledger("refund");
    const pledge = await createPledge({
      amountCents: 6000n,
      cardBacked: true,
      suffix: "refund",
      targetId: target.id,
      userId: pledger.id,
    });
    mocks.refundsCreate.mockResolvedValue({ id: "re_tf_escrow" });

    await refundDeadTargetFunding({ limit: 100 });

    expect(mocks.refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ charge: `${TEST_PREFIX}ch_refund` }),
      { idempotencyKey: `funding-refund:${payment.id}:v1` },
    );

    const cancelled = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
      select: { cancellationReason: true, cancelledAt: true, status: true },
    });
    expect(cancelled.status).toBe(TaskFundingPledgeStatus.CANCELLED);
    expect(cancelled.cancelledAt).not.toBeNull();
    expect(cancelled.cancellationReason).toBeTruthy();

    // The sweep only requests the refund; the charge.refunded webhook flips
    // the payment status, so locally it must stay PAID (idempotent sweep).
    await expect(
      prisma.taskFundingPayment.findUniqueOrThrow({
        where: { id: payment.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskFundingPaymentStatus.PAID });
  });
});
