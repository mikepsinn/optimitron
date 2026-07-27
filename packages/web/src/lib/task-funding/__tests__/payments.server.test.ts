import {
  CommerceOrderStatus,
  TaskFundingPaymentStatus,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordTaskFundingCheckoutPaid } from "../payments.server";

const mocks = vi.hoisted(() => ({
  issueReceipt: vi.fn(),
  resolveReceiptBinding: vi.fn(),
  retrievePaymentIntent: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    paymentIntents: { retrieve: mocks.retrievePaymentIntent },
  }),
  isStripeConfigured: () => true,
}));

vi.mock("../contribution-receipts.server", () => ({
  issuePaidContributionReceiptInTransaction: mocks.issueReceipt,
  requireContributionReceiptBinding: vi.fn(),
  resolveContributionReceiptBinding: mocks.resolveReceiptBinding,
}));

function buildFixture() {
  const payment = {
    commerceOrderId: "order_1",
    donorEmail: null as string | null,
    donorName: null as string | null,
    id: "payment_1",
    paidAt: null as Date | null,
    status: TaskFundingPaymentStatus.PENDING as TaskFundingPaymentStatus,
    stripeChargeId: null as string | null,
    stripeCheckoutSessionId: "cs_1",
    stripePaymentIntentId: null as string | null,
    targetId: "target_1",
  };
  const order = {
    buyerEmail: null as string | null,
    buyerName: null as string | null,
    id: "order_1",
    paidAt: null as Date | null,
    status: CommerceOrderStatus.PENDING_PAYMENT as CommerceOrderStatus,
  };
  const target = {
    id: "target_1",
    status: TaskFundingTargetStatus.OPEN,
    targetAmountCents: 10_000n,
    thresholdMetAt: null,
  };

  const tx = {
    commerceOrder: {
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(order, data);
        return order;
      }),
    },
    taskFundingPayment: {
      aggregate: vi.fn(async () => ({
        _sum: {
          amountCents:
            payment.status === TaskFundingPaymentStatus.PAID ? 5_000 : 0,
        },
      })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(payment, data);
        return payment;
      }),
    },
    taskFundingPledge: {
      aggregate: vi.fn(async () => ({
        _sum: { committedAmountCents: 0n },
      })),
    },
    taskFundingTarget: {
      findUnique: vi.fn(async () => target),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(target, data);
        return target;
      }),
    },
  };
  const db = {
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => {
      const paymentBefore = { ...payment };
      const orderBefore = { ...order };
      const targetBefore = { ...target };
      try {
        return await callback(tx);
      } catch (error) {
        Object.assign(payment, paymentBefore);
        Object.assign(order, orderBefore);
        Object.assign(target, targetBefore);
        throw error;
      }
    },
    taskFundingPayment: {
      findFirst: vi.fn(async () => ({
        commerceOrderId: payment.commerceOrderId,
        id: payment.id,
        paidAt: payment.paidAt,
        status: payment.status,
        targetId: payment.targetId,
      })),
    },
  };
  const session = {
    customer: "cus_1",
    customer_details: {
      email: "Donor@Example.com",
      name: "Donor Name",
    },
    customer_email: null,
    id: "cs_1",
    metadata: {
      commerce_order_id: "order_1",
      task_funding_payment_id: "payment_1",
    },
    payment_intent: "pi_1",
  };
  return { db, order, payment, session, tx };
}

beforeEach(() => {
  mocks.issueReceipt.mockReset();
  mocks.issueReceipt.mockResolvedValue({ created: true });
  mocks.retrievePaymentIntent.mockReset();
  mocks.retrievePaymentIntent.mockResolvedValue({
    id: "pi_1",
    latest_charge: "ch_1",
  });
});

describe("recordTaskFundingCheckoutPaid", () => {
  it("creates the immutable receipt in the same transaction as PAID", async () => {
    const fixture = buildFixture();

    await recordTaskFundingCheckoutPaid(
      fixture.session as never,
      fixture.db as never,
    );

    expect(fixture.payment.status).toBe(TaskFundingPaymentStatus.PAID);
    expect(fixture.order.status).toBe(CommerceOrderStatus.PAID);
    expect(mocks.issueReceipt).toHaveBeenCalledWith("payment_1", fixture.tx, {
      now: expect.any(Date),
    });
  });

  it("rolls PAID and the order back when receipt creation fails", async () => {
    const fixture = buildFixture();
    mocks.issueReceipt.mockRejectedValueOnce(
      new Error("No valid adopted governing revision"),
    );

    await expect(
      recordTaskFundingCheckoutPaid(
        fixture.session as never,
        fixture.db as never,
      ),
    ).rejects.toThrow("No valid adopted governing revision");

    expect(fixture.payment.status).toBe(TaskFundingPaymentStatus.PENDING);
    expect(fixture.payment.paidAt).toBeNull();
    expect(fixture.order.status).toBe(CommerceOrderStatus.PENDING_PAYMENT);
    expect(fixture.order.paidAt).toBeNull();
  });

  it("preserves the original paid timestamp on webhook replay", async () => {
    const fixture = buildFixture();
    const originalPaidAt = new Date("2026-07-20T12:00:00.000Z");
    fixture.payment.status = TaskFundingPaymentStatus.PAID;
    fixture.payment.paidAt = originalPaidAt;
    fixture.order.status = CommerceOrderStatus.PAID;
    fixture.order.paidAt = originalPaidAt;

    await recordTaskFundingCheckoutPaid(
      fixture.session as never,
      fixture.db as never,
    );

    expect(fixture.payment.paidAt).toEqual(originalPaidAt);
    expect(mocks.issueReceipt).toHaveBeenCalledWith("payment_1", fixture.tx, {
      now: originalPaidAt,
    });
  });
});
