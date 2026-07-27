import {
  CommerceOrderStatus,
  TaskFundingPaymentStatus,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordTaskFundingChargeRefunded,
  recordTaskFundingCheckoutPaid,
} from "../payments.server";

const mocks = vi.hoisted(() => ({
  issueReceipt: vi.fn(),
  resolveReceiptBinding: vi.fn(),
  retrievePaymentIntent: vi.fn(),
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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
  upsertTaskFundingTargetWithReceiptBindingInTransaction: vi.fn(),
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
    $queryRaw: vi.fn(async () => [{ id: payment.id }]),
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
      updateMany: vi.fn(
        async ({ data }: { data: Record<string, unknown> }) => {
          if (
            payment.paidAt !== null ||
            payment.status === TaskFundingPaymentStatus.REFUNDED ||
            payment.status === TaskFundingPaymentStatus.DISPUTED
          ) {
            return { count: 0 };
          }
          Object.assign(payment, data);
          return { count: 1 };
        },
      ),
      findUnique: vi.fn(async () => ({ ...payment })),
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

  it("does not let a stale concurrent checkout settlement overwrite the first paid facts", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const fixture = buildFixture();
      const stalePayment = {
        commerceOrderId: fixture.payment.commerceOrderId,
        id: fixture.payment.id,
        paidAt: null,
        status: TaskFundingPaymentStatus.PENDING,
        targetId: fixture.payment.targetId,
      };
      fixture.db.taskFundingPayment.findFirst.mockResolvedValue(stalePayment);
      mocks.retrievePaymentIntent.mockImplementation(
        async (paymentIntentId: string) => ({
          id: paymentIntentId,
          latest_charge: `ch_${paymentIntentId}`,
        }),
      );
      const firstPaidAt = new Date("2026-07-20T12:00:00.000Z");
      vi.setSystemTime(firstPaidAt);
      await recordTaskFundingCheckoutPaid(
        {
          ...fixture.session,
          customer_details: {
            email: "first@example.com",
            name: "First Writer",
          },
          id: "cs_first",
          payment_intent: "pi_first",
        } as never,
        fixture.db as never,
      );

      vi.setSystemTime(new Date("2026-07-20T13:00:00.000Z"));
      await recordTaskFundingCheckoutPaid(
        {
          ...fixture.session,
          customer_details: {
            email: "second@example.com",
            name: "Stale Writer",
          },
          id: "cs_second",
          payment_intent: "pi_second",
        } as never,
        fixture.db as never,
      );

      expect(fixture.payment).toMatchObject({
        donorEmail: "first@example.com",
        donorName: "First Writer",
        paidAt: firstPaidAt,
        stripeChargeId: "ch_pi_first",
        stripeCheckoutSessionId: "cs_first",
        stripePaymentIntentId: "pi_first",
      });
      expect(fixture.tx.taskFundingPayment.updateMany).toHaveBeenCalledTimes(2);
      expect(mocks.issueReceipt).toHaveBeenCalledTimes(2);
      for (const call of mocks.issueReceipt.mock.calls) {
        expect(call[2]).toEqual({ now: firstPaidAt });
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not let a paid replay overwrite a concurrent refund on the order", async () => {
    const fixture = buildFixture();
    const originalPaidAt = new Date("2026-07-20T12:00:00.000Z");
    fixture.payment.status = TaskFundingPaymentStatus.PAID;
    fixture.payment.paidAt = originalPaidAt;
    fixture.payment.stripeChargeId = "ch_1";
    fixture.payment.stripePaymentIntentId = "pi_1";
    fixture.order.status = CommerceOrderStatus.PAID;
    fixture.order.paidAt = originalPaidAt;

    const replayRead = deferred();
    const releaseReplayRead = deferred();
    fixture.tx.taskFundingPayment.findUnique.mockImplementationOnce(
      async () => {
        const snapshot = { ...fixture.payment };
        replayRead.resolve();
        await releaseReplayRead.promise;
        return snapshot;
      },
    );

    let lockTail = Promise.resolve();
    fixture.db.$transaction = async <T>(
      callback: (client: typeof fixture.tx) => Promise<T>,
    ) => {
      let releaseLock: (() => void) | undefined;
      const client = {
        ...fixture.tx,
        $queryRaw: vi.fn(async () => {
          if (!releaseLock) {
            const previous = lockTail;
            lockTail = new Promise<void>((resolve) => {
              releaseLock = resolve;
            });
            await previous;
          }
          return [{ id: fixture.payment.id }];
        }),
      };
      try {
        return await callback(client);
      } finally {
        releaseLock?.();
      }
    };

    const replay = recordTaskFundingCheckoutPaid(
      fixture.session as never,
      fixture.db as never,
    );
    await replayRead.promise;
    const refund = recordTaskFundingChargeRefunded(
      { id: "ch_1", payment_intent: "pi_1" } as never,
      fixture.db as never,
    );
    releaseReplayRead.resolve();
    await Promise.all([replay, refund]);

    expect(fixture.payment.status).toBe(TaskFundingPaymentStatus.REFUNDED);
    expect(fixture.order.status).toBe(CommerceOrderStatus.REFUNDED);
    expect(mocks.issueReceipt).toHaveBeenCalledTimes(1);
  });
});
