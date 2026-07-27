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
  cancelPledgeAsPledger,
  maybeChargeCallablePledges,
  refundDeadTargetFunding,
  resetStalePledgeCallState,
} from "../escrow.server";

const mocks = vi.hoisted(() => ({
  chargesRetrieve: vi.fn(),
  paymentIntentsCreate: vi.fn(),
  paymentMethodsDetach: vi.fn(),
  receiptIssue: vi.fn(),
  requireReceiptBinding: vi.fn(),
  resolveReceiptBinding: vi.fn(),
  refundsCreate: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  sendDeclineEmail: vi.fn(),
  sendReceiptEmail: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    charges: { retrieve: mocks.chargesRetrieve },
    paymentIntents: { create: mocks.paymentIntentsCreate },
    paymentMethods: { detach: mocks.paymentMethodsDetach },
    refunds: { create: mocks.refundsCreate },
  }),
  isStripeConfigured: () => true,
}));

vi.mock("@/lib/email/task-funding-pledge-confirmation-email", () => ({
  sendPledgeConfirmationEmail: mocks.sendConfirmationEmail,
}));

vi.mock("@/lib/email/task-funding-pledge-decline-email", () => ({
  sendPledgeDeclineRecoveryEmail: mocks.sendDeclineEmail,
}));

vi.mock("@/lib/email/task-funding-pledge-receipt-email", () => ({
  sendPledgeChargeReceiptEmail: mocks.sendReceiptEmail,
}));

vi.mock("../contribution-receipts.server", () => ({
  issuePaidContributionReceiptInTransaction: mocks.receiptIssue,
  requireContributionReceiptBinding: mocks.requireReceiptBinding,
  resolveContributionReceiptBinding: mocks.resolveReceiptBinding,
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
  mocks.chargesRetrieve.mockReset();
  mocks.chargesRetrieve.mockResolvedValue({
    calculated_statement_descriptor: "TF ESCROW TEST",
  });
  mocks.paymentIntentsCreate.mockReset();
  mocks.paymentMethodsDetach.mockReset();
  mocks.paymentMethodsDetach.mockResolvedValue({ id: "pm_detached" });
  mocks.receiptIssue.mockReset();
  mocks.receiptIssue.mockResolvedValue({ created: true });
  mocks.requireReceiptBinding.mockReset();
  mocks.requireReceiptBinding.mockReturnValue({
    governingDocumentRevisionIds: ["revision_terms"],
    issuerUserId: "issuer_1",
    schema: "optimitron.contribution-receipt-binding.v1",
    termsDocumentRevisionId: "revision_terms",
  });
  mocks.refundsCreate.mockReset();
  mocks.sendConfirmationEmail.mockReset();
  mocks.sendConfirmationEmail.mockResolvedValue({ status: "sent" });
  mocks.sendDeclineEmail.mockReset();
  mocks.sendDeclineEmail.mockResolvedValue({ status: "sent" });
  mocks.sendReceiptEmail.mockReset();
  mocks.sendReceiptEmail.mockResolvedValue({ status: "sent" });
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
        id: true,
        source: true,
        status: true,
        stripePaymentIntentId: true,
      },
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
      // Payment-scoped, not pledge-scoped: a re-pledge after a decline gets a
      // fresh key instead of replaying the declined attempt within Stripe's
      // idempotency window.
      { idempotencyKey: `pledge-call:${payment.id}:v1` },
    );
    expect(payment).toMatchObject({
      amountCents: 6000,
      source: TaskFundingPaymentSource.PLEDGE_CALL,
      status: TaskFundingPaymentStatus.PAID,
      stripePaymentIntentId: "pi_tf_escrow_full",
    });
    expect(payment.commerceOrder.status).toBe(CommerceOrderStatus.PAID);
    expect(mocks.receiptIssue).toHaveBeenCalledWith(
      payment.id,
      expect.anything(),
      { now: expect.any(Date) },
    );

    // Boundary: Stripe charge -> receipt email input (amount, card owner,
    // and the calculated statement descriptor looked up from the charge).
    expect(mocks.chargesRetrieve).toHaveBeenCalledWith("pi_tf_escrow_full_ch");
    expect(mocks.sendReceiptEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 6000,
        pledge: expect.objectContaining({ id: pledge.id }),
        statementDescriptor: "TF ESCROW TEST",
        toEmail: pledger.email,
      }),
    );
  });

  it("keeps a succeeded Stripe charge locally pending when its receipt cannot be created", async () => {
    const { target } = await createFundedTask("receipt_fail", 5000n);
    const pledger = await createPledger("receipt_fail");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "receipt_fail",
      targetId: target.id,
      userId: pledger.id,
    });
    mocks.paymentIntentsCreate.mockResolvedValue(
      succeededPaymentIntent("pi_tf_escrow_receipt_fail"),
    );
    mocks.receiptIssue.mockRejectedValueOnce(
      new Error("Receipt provenance is incomplete"),
    );

    const result = await maybeChargeCallablePledges(target.id);

    expect(result.charged).toEqual([]);
    const unsettled = await prisma.taskFundingPayment.findUniqueOrThrow({
      where: { pledgeId: pledge.id },
      select: {
        commerceOrder: { select: { status: true } },
        status: true,
      },
    });
    expect(unsettled.status).toBe(TaskFundingPaymentStatus.PENDING);
    expect(unsettled.commerceOrder.status).toBe(
      CommerceOrderStatus.PENDING_PAYMENT,
    );
    await expect(
      prisma.taskFundingPledge.findUniqueOrThrow({
        where: { id: pledge.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskFundingPledgeStatus.ACTIVE });
    expect(mocks.sendReceiptEmail).not.toHaveBeenCalled();
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
      select: { id: true, source: true, status: true },
    });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      source: TaskFundingPaymentSource.PLEDGE_CALL,
      status: TaskFundingPaymentStatus.PAID,
    });

    // Every Stripe confirm re-confirmed the single payment's deterministic key.
    expect(mocks.paymentIntentsCreate.mock.calls.length).toBeGreaterThan(0);
    for (const call of mocks.paymentIntentsCreate.mock.calls) {
      expect(call[1]).toEqual({
        idempotencyKey: `pledge-call:${payments[0]?.id}:v1`,
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

    // The receipt goes to the charged pledger only — never the declined one.
    expect(mocks.sendReceiptEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        pledge: expect.objectContaining({ id: pledgeB.id }),
      }),
    );
  });
});

describe("resetStalePledgeCallState", () => {
  /** A pledge-call payment row in the given state, linked to the pledge. */
  async function createPledgeCallPayment(input: {
    orderStatus: CommerceOrderStatus;
    pledgeId: string;
    status: TaskFundingPaymentStatus;
    suffix: string;
    targetId: string;
    taskId: string;
  }) {
    const order = await prisma.commerceOrder.create({
      data: {
        id: `${TEST_PREFIX}order_${input.suffix}`,
        currency: "usd",
        donationCents: 5000,
        purposeKey: "task-funding",
        status: input.orderStatus,
        subtotalCents: 5000,
        totalCents: 5000,
      },
    });
    return prisma.taskFundingPayment.create({
      data: {
        id: `${TEST_PREFIX}payment_${input.suffix}`,
        amountCents: 5000,
        commerceOrderId: order.id,
        currency: "usd",
        pledgeId: input.pledgeId,
        source: TaskFundingPaymentSource.PLEDGE_CALL,
        status: input.status,
        stripeTransferGroup: `task_funding_${input.taskId}`,
        targetId: input.targetId,
        taskId: input.taskId,
      },
    });
  }

  it("detaches the FAILED payment and clears call state so a re-pledge is chargeable again", async () => {
    const { target, task } = await createFundedTask("repledge", 5000n);
    const pledger = await createPledger("repledge");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "repledge",
      targetId: target.id,
      userId: pledger.id,
    });
    // Terminal decline state as recordPledgeChargeDeclined leaves it...
    const declinedAt = new Date();
    const failedPayment = await createPledgeCallPayment({
      orderStatus: CommerceOrderStatus.FAILED,
      pledgeId: pledge.id,
      status: TaskFundingPaymentStatus.FAILED,
      suffix: "repledge",
      targetId: target.id,
      taskId: task.id,
    });
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: {
        calledAt: declinedAt,
        cardBrand: "visa",
        cardLast4: "0341",
        declinedAt,
        status: TaskFundingPledgeStatus.DECLINED,
      },
    });
    // ...then reactivated by a re-pledge (createOrReplaceTaskFundingPledge).
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: { status: TaskFundingPledgeStatus.ACTIVE },
    });

    // Without the reset, the planner counts the pledge toward "fully funded"
    // but never charges it (non-PENDING payment).
    const skipped = await maybeChargeCallablePledges(target.id);
    expect(skipped.fullyFunded).toBe(true);
    expect(skipped.charged).toEqual([]);
    expect(skipped.declined).toEqual([]);

    await resetStalePledgeCallState(pledge.id);

    await expect(
      prisma.taskFundingPledge.findUniqueOrThrow({
        where: { id: pledge.id },
        select: {
          calledAt: true,
          cardBrand: true,
          cardLast4: true,
          declinedAt: true,
          status: true,
          stripePaymentMethodId: true,
          stripeSetupIntentId: true,
        },
      }),
    ).resolves.toEqual({
      calledAt: null,
      cardBrand: null,
      cardLast4: null,
      declinedAt: null,
      status: TaskFundingPledgeStatus.ACTIVE,
      stripePaymentMethodId: null,
      stripeSetupIntentId: null,
    });
    await expect(
      prisma.taskFundingPayment.findUniqueOrThrow({
        where: { id: failedPayment.id },
        select: { pledgeId: true },
      }),
    ).resolves.toEqual({ pledgeId: null });

    // New card saved by the setup webhook -> the planner charges a fresh
    // payment under a fresh (payment-scoped) idempotency key.
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: {
        stripePaymentMethodId: `${TEST_PREFIX}pm_repledge2`,
        stripeSetupIntentId: `${TEST_PREFIX}si_repledge2`,
      },
    });
    mocks.paymentIntentsCreate.mockResolvedValue(
      succeededPaymentIntent("pi_tf_escrow_repledge"),
    );

    const result = await maybeChargeCallablePledges(target.id);

    expect(result.charged).toHaveLength(1);
    const newPayment = await prisma.taskFundingPayment.findUniqueOrThrow({
      where: { pledgeId: pledge.id },
      select: { id: true, status: true },
    });
    expect(newPayment.id).not.toBe(failedPayment.id);
    expect(newPayment.status).toBe(TaskFundingPaymentStatus.PAID);
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledWith(expect.anything(), {
      idempotencyKey: `pledge-call:${newPayment.id}:v1`,
    });
  });

  it("leaves an in-flight PENDING pledge-call payment and the saved card alone", async () => {
    const { target, task } = await createFundedTask("inflight", 5000n);
    const pledger = await createPledger("inflight");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "inflight",
      targetId: target.id,
      userId: pledger.id,
    });
    const calledAt = new Date();
    await createPledgeCallPayment({
      orderStatus: CommerceOrderStatus.PENDING_PAYMENT,
      pledgeId: pledge.id,
      status: TaskFundingPaymentStatus.PENDING,
      suffix: "inflight",
      targetId: target.id,
      taskId: task.id,
    });
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: { calledAt },
    });

    await resetStalePledgeCallState(pledge.id);

    const untouched = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
      select: {
        calledAt: true,
        payment: { select: { id: true } },
        stripePaymentMethodId: true,
      },
    });
    expect(untouched.calledAt).not.toBeNull();
    expect(untouched.payment?.id).toBe(`${TEST_PREFIX}payment_inflight`);
    expect(untouched.stripePaymentMethodId).toBe(`${TEST_PREFIX}pm_inflight`);
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

describe("cancelPledgeAsPledger", () => {
  it("cancels an uncharged pledge, detaches the card, and reopens the target", async () => {
    const { target } = await createFundedTask(
      "cancel",
      5000n,
      TaskFundingTargetStatus.THRESHOLD_MET,
    );
    const pledger = await createPledger("cancel");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "cancel",
      targetId: target.id,
      userId: pledger.id,
    });

    const result = await cancelPledgeAsPledger(pledge.id);

    expect(result).toEqual({ outcome: "cancelled", taskId: target.taskId });
    const cancelled = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
      select: {
        cancellationReason: true,
        cancelledAt: true,
        cancelledByUserId: true,
        status: true,
        stripePaymentMethodId: true,
      },
    });
    expect(cancelled).toMatchObject({
      cancellationReason: "Cancelled by pledger",
      cancelledByUserId: pledger.id,
      status: TaskFundingPledgeStatus.CANCELLED,
      stripePaymentMethodId: null,
    });
    expect(cancelled.cancelledAt).not.toBeNull();

    expect(mocks.paymentMethodsDetach).toHaveBeenCalledTimes(1);
    expect(mocks.paymentMethodsDetach).toHaveBeenCalledWith(
      `${TEST_PREFIX}pm_cancel`,
    );

    // The cancelled money no longer counts, so the target must reopen for
    // new pledges instead of staying stuck at THRESHOLD_MET.
    await expect(
      prisma.taskFundingTarget.findUniqueOrThrow({
        where: { id: target.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskFundingTargetStatus.OPEN });
  });

  it("refuses once charging has started (calledAt set) and cancels nothing", async () => {
    const { target } = await createFundedTask("cancel_late", 5000n);
    const pledger = await createPledger("cancel_late");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "cancel_late",
      targetId: target.id,
      userId: pledger.id,
    });
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: { calledAt: new Date() },
    });

    const result = await cancelPledgeAsPledger(pledge.id);

    expect(result).toEqual({ outcome: "unavailable", taskId: target.taskId });
    expect(mocks.paymentMethodsDetach).not.toHaveBeenCalled();
    await expect(
      prisma.taskFundingPledge.findUniqueOrThrow({
        where: { id: pledge.id },
        select: { status: true, stripePaymentMethodId: true },
      }),
    ).resolves.toEqual({
      status: TaskFundingPledgeStatus.ACTIVE,
      stripePaymentMethodId: `${TEST_PREFIX}pm_cancel_late`,
    });
  });

  it("still reports cancelled when the payment method is already detached", async () => {
    const { target } = await createFundedTask("cancel_detached", 5000n);
    const pledger = await createPledger("cancel_detached");
    const pledge = await createPledge({
      amountCents: 5000n,
      cardBacked: true,
      suffix: "cancel_detached",
      targetId: target.id,
      userId: pledger.id,
    });
    mocks.paymentMethodsDetach.mockRejectedValue(
      Object.assign(new Error("Payment method is not attached."), {
        code: "payment_method_not_attached",
      }),
    );

    const result = await cancelPledgeAsPledger(pledge.id);

    expect(result).toEqual({ outcome: "cancelled", taskId: target.taskId });
    await expect(
      prisma.taskFundingPledge.findUniqueOrThrow({
        where: { id: pledge.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskFundingPledgeStatus.CANCELLED });
  });

  it("reports not_found for an unknown pledge id", async () => {
    await expect(
      cancelPledgeAsPledger(`${TEST_PREFIX}pledge_missing`),
    ).resolves.toEqual({ outcome: "not_found" });
  });
});
