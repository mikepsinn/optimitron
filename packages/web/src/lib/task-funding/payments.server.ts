import type Stripe from "stripe";
import {
  CommerceFulfillmentKind,
  CommerceOrderStatus,
  Prisma,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  TaskFundingTargetStatus,
  TaskStatus,
  type PrismaClient,
} from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getTaskPath } from "@/lib/routes";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/url";
import {
  issuePaidContributionReceiptInTransaction,
  resolveContributionReceiptBinding,
} from "./contribution-receipts.server";

export const TASK_FUNDING_PURPOSE_KEY = "task-funding";
export const TASK_FUNDING_ORDER_TYPE = "task_funding";
export const TASK_FUNDING_UNIT_KEY = "usd";
export const MIN_TASK_FUNDING_AMOUNT_CENTS = 100;
export const MAX_TASK_FUNDING_AMOUNT_CENTS = 1_000_000_00;

const log = createLogger("task-funding-payments");

type TaskFundingPaymentDb = Pick<
  PrismaClient,
  | "$transaction"
  | "commerceOrder"
  | "task"
  | "taskFundingPayment"
  | "taskFundingPledge"
  | "taskFundingTarget"
>;

interface CreateTaskFundingCheckoutInput {
  amountCents: number;
  donorEmail?: string | null;
  donorName?: string | null;
  donorUserId?: string | null;
  publicDisplay?: boolean;
  publicName?: string | null;
  sourceReferrer?: string | null;
  sourceUrl?: string | null;
  taskId: string;
}

export interface CreateTaskFundingCheckoutResult {
  checkoutSessionId: string;
  commerceOrderId: string;
  taskFundingPaymentId: string;
  url: string;
}

function trimToNull(value: string | null | undefined, maxLength = 500) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeEmail(value: string | null | undefined) {
  return trimToNull(value, 320)?.toLowerCase() ?? null;
}

function normalizeCurrency(value: string | null | undefined) {
  const currency = value?.trim().toLowerCase();
  return currency && /^[a-z]{3}$/u.test(currency) ? currency : "usd";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function truncateMetadata(value: string | null | undefined) {
  return trimToNull(value, 500) ?? "";
}

function truncateStripeName(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function toPositiveSafeInt(value: bigint | number | null | undefined) {
  if (value == null) return null;
  const numeric = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isSafeInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

function decimalDollarsToCents(
  value: Prisma.Decimal | number | null | undefined,
) {
  if (value == null) return null;
  const numeric = value instanceof Prisma.Decimal ? value.toNumber() : value;
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric * 100);
}

export function normalizeTaskFundingAmountCents(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Funding amount is required.");
  }
  const amountCents = Math.trunc(value);
  if (amountCents < MIN_TASK_FUNDING_AMOUNT_CENTS) {
    throw new Error("Task funding amount must be at least $1.");
  }
  if (amountCents > MAX_TASK_FUNDING_AMOUNT_CENTS) {
    throw new Error("Task funding amount is too large for one checkout.");
  }
  return amountCents;
}

export function getTaskFundingTransferGroup(taskId: string) {
  const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/gu, "_").slice(0, 160);
  return `task_funding_${safeTaskId}`;
}

export function chooseTargetAmountCents(input: {
  compensationMaxAmountMinorUnits: bigint | null;
  estimatedCashCostUsdBase: Prisma.Decimal | number | null | undefined;
}) {
  // Derive the target only from real task cost data. Falling back to the current
  // donation amount would let the first donor permanently pin the funding target
  // (a $5 test donation would set a $5 target the page then reports as "100%
  // funded"), because taskFundingTarget.upsert only writes targetAmountCents on
  // create.
  return (
    toPositiveSafeInt(input.compensationMaxAmountMinorUnits) ??
    decimalDollarsToCents(input.estimatedCashCostUsdBase)
  );
}

function getStripeObjectId(
  value: string | { id?: string | null } | null | undefined,
) {
  if (typeof value === "string") return value;
  return value?.id ?? undefined;
}

function getLatestChargeId(paymentIntent: Stripe.PaymentIntent | null) {
  const latestCharge = paymentIntent?.latest_charge;
  if (typeof latestCharge === "string") return latestCharge;
  return latestCharge?.id ?? undefined;
}

export async function refreshTaskFundingTargetStatus(
  targetId: string,
  db: Pick<
    Prisma.TransactionClient,
    "taskFundingPayment" | "taskFundingPledge" | "taskFundingTarget"
  >,
) {
  const target = await db.taskFundingTarget.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      status: true,
      targetAmountCents: true,
      thresholdMetAt: true,
    },
  });
  if (!target) return;

  const [pledges, payments] = await Promise.all([
    db.taskFundingPledge.aggregate({
      where: {
        deletedAt: null,
        status: TaskFundingPledgeStatus.ACTIVE,
        targetId,
      },
      _sum: { committedAmountCents: true },
    }),
    db.taskFundingPayment.aggregate({
      where: {
        deletedAt: null,
        status: TaskFundingPaymentStatus.PAID,
        targetId,
      },
      _sum: { amountCents: true },
    }),
  ]);

  const committed =
    (pledges._sum.committedAmountCents ?? 0n) +
    BigInt(payments._sum.amountCents ?? 0);
  const thresholdMet = committed >= target.targetAmountCents;

  if (
    thresholdMet &&
    target.status === TaskFundingTargetStatus.OPEN &&
    target.thresholdMetAt === null
  ) {
    await db.taskFundingTarget.update({
      where: { id: target.id },
      data: {
        status: TaskFundingTargetStatus.THRESHOLD_MET,
        thresholdMetAt: new Date(),
      },
    });
    return;
  }

  if (
    !thresholdMet &&
    target.status === TaskFundingTargetStatus.THRESHOLD_MET
  ) {
    await db.taskFundingTarget.update({
      where: { id: target.id },
      data: {
        status: TaskFundingTargetStatus.OPEN,
        thresholdMetAt: null,
        thresholdMetByPledgeId: null,
      },
    });
  }
}

export async function createTaskFundingCheckoutSession(
  input: CreateTaskFundingCheckoutInput,
  db: TaskFundingPaymentDb = prisma,
): Promise<CreateTaskFundingCheckoutResult> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const amountCents = normalizeTaskFundingAmountCents(input.amountCents);
  const donorEmail = normalizeEmail(input.donorEmail);
  const donorName = trimToNull(input.donorName, 200);
  const publicName = trimToNull(input.publicName, 200) ?? donorName;
  const publicDisplay = Boolean(input.publicDisplay && publicName);
  const sourceUrl = trimToNull(input.sourceUrl, 500);
  const sourceReferrer = trimToNull(input.sourceReferrer, 500);

  const task = await db.task.findFirst({
    where: {
      deletedAt: null,
      id: input.taskId,
      isPublic: true,
      status: TaskStatus.ACTIVE,
    },
    select: {
      compensationCurrency: true,
      compensationMaxAmountMinorUnits: true,
      currentImpactEstimateSet: {
        select: {
          frames: {
            where: { deletedAt: null },
            orderBy: [{ frameKey: "asc" }, { createdAt: "asc" }],
            select: { estimatedCashCostUsdBase: true },
            take: 1,
          },
        },
      },
      contextJson: true,
      fundingTarget: {
        select: {
          id: true,
          metadata: true,
          targetAmountCents: true,
        },
      },
      id: true,
      title: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }
  const receiptBinding = resolveContributionReceiptBinding(
    task.fundingTarget?.metadata,
    task.contextJson,
  );
  const existingTargetMetadata = asRecord(task.fundingTarget?.metadata);
  const fundingTargetMetadata = {
    ...existingTargetMetadata,
    contributionReceipt: receiptBinding,
    createdBy: existingTargetMetadata.createdBy ?? "task-funding-checkout",
  } satisfies Prisma.InputJsonValue;

  const currency = normalizeCurrency(task.compensationCurrency);
  if (currency !== "usd") {
    throw new Error("Task funding checkout currently supports USD tasks only.");
  }

  const targetAmountCentsValue = chooseTargetAmountCents({
    compensationMaxAmountMinorUnits: task.compensationMaxAmountMinorUnits,
    estimatedCashCostUsdBase:
      task.currentImpactEstimateSet?.frames[0]?.estimatedCashCostUsdBase,
  });
  if (targetAmountCentsValue == null) {
    throw new Error("Task has no funding target yet.");
  }
  const targetAmountCents = BigInt(targetAmountCentsValue);
  const transferGroup = getTaskFundingTransferGroup(task.id);

  const { commerceOrder, payment } = await db.$transaction(async (tx) => {
    const target = await tx.taskFundingTarget.upsert({
      where: { taskId: task.id },
      create: {
        currency,
        status: TaskFundingTargetStatus.OPEN,
        targetAmountCents,
        taskId: task.id,
        metadata: fundingTargetMetadata,
      },
      update: {
        deletedAt: null,
        metadata: fundingTargetMetadata,
      },
      select: {
        id: true,
        targetAmountCents: true,
      },
    });

    const order = await tx.commerceOrder.create({
      data: {
        buyerEmail: donorEmail,
        buyerName: donorName,
        buyerUserId: trimToNull(input.donorUserId, 200),
        currency,
        donationCents: amountCents,
        fmvCents: 0,
        metadata: {
          donorEmail,
          donorName,
          publicDisplay,
          publicName,
          sourceReferrer,
          sourceUrl,
          taskId: task.id,
          targetId: target.id,
        } satisfies Prisma.InputJsonValue,
        paymentProvider: "STRIPE",
        purposeKey: TASK_FUNDING_PURPOSE_KEY,
        status: CommerceOrderStatus.PENDING_PAYMENT,
        subtotalCents: amountCents,
        totalCents: amountCents,
        items: {
          create: {
            currency,
            fulfillmentKind: CommerceFulfillmentKind.NONE,
            metadata: {
              taskId: task.id,
              targetId: target.id,
            } satisfies Prisma.InputJsonValue,
            offerKey: TASK_FUNDING_PURPOSE_KEY,
            quantity: 1,
            title: truncateStripeName(`Fund: ${task.title}`),
            totalAmountCents: amountCents,
            totalDonationCents: amountCents,
            totalFmvCents: 0,
            unitAmountCents: amountCents,
            unitDonationCents: amountCents,
            unitFmvCents: 0,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const taskPayment = await tx.taskFundingPayment.create({
      data: {
        amountCents,
        commerceOrderId: order.id,
        currency,
        donorEmail,
        donorName,
        donorUserId: trimToNull(input.donorUserId, 200),
        metadata: {
          sourceReferrer,
          sourceUrl,
        } satisfies Prisma.InputJsonValue,
        publicDisplay,
        publicNameSnapshot: publicDisplay ? publicName : null,
        status: TaskFundingPaymentStatus.PENDING,
        stripeTransferGroup: transferGroup,
        targetId: target.id,
        taskId: task.id,
      },
      select: {
        id: true,
        targetId: true,
      },
    });

    return { commerceOrder: order, payment: taskPayment };
  });

  const baseUrl = getBaseUrl();
  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
      client_reference_id: input.donorUserId ?? undefined,
      customer_email: donorEmail ?? undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: truncateStripeName(`Fund: ${task.title}`),
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        amountCents: String(amountCents),
        commerce_order_id: commerceOrder.id,
        donorEmail: truncateMetadata(donorEmail),
        donorName: truncateMetadata(donorName),
        order_type: TASK_FUNDING_ORDER_TYPE,
        publicDisplay: publicDisplay ? "true" : "false",
        task_funding_payment_id: payment.id,
        task_id: task.id,
        target_id: payment.targetId,
      },
      mode: "payment",
      payment_intent_data: {
        metadata: {
          commerce_order_id: commerceOrder.id,
          order_type: TASK_FUNDING_ORDER_TYPE,
          task_funding_payment_id: payment.id,
          task_id: task.id,
          target_id: payment.targetId,
        },
        transfer_group: transferGroup,
      },
      success_url: `${baseUrl}${getTaskPath(task.id)}?funded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${getTaskPath(task.id)}?funding_canceled=1`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    await db.$transaction([
      db.commerceOrder.update({
        where: { id: commerceOrder.id },
        data: {
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: getStripeObjectId(session.customer),
          stripePaymentIntentId: getStripeObjectId(session.payment_intent),
        },
      }),
      db.taskFundingPayment.update({
        where: { id: payment.id },
        data: {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: getStripeObjectId(session.payment_intent),
        },
      }),
    ]);

    return {
      checkoutSessionId: session.id,
      commerceOrderId: commerceOrder.id,
      taskFundingPaymentId: payment.id,
      url: session.url,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe checkout failed.";
    await db.$transaction([
      db.commerceOrder.update({
        where: { id: commerceOrder.id },
        data: {
          lastError: message,
          status: CommerceOrderStatus.FAILED,
        },
      }),
      db.taskFundingPayment.update({
        where: { id: payment.id },
        data: {
          failedAt: new Date(),
          status: TaskFundingPaymentStatus.FAILED,
        },
      }),
    ]);
    throw error;
  }
}

function getSessionPaymentIntentId(session: Stripe.Checkout.Session) {
  return getStripeObjectId(session.payment_intent);
}

async function retrievePaymentIntent(
  paymentIntentId: string | undefined,
): Promise<Stripe.PaymentIntent | null> {
  if (!paymentIntentId) return null;
  return getStripeClient().paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
}

export async function recordTaskFundingCheckoutPaid(
  session: Stripe.Checkout.Session,
  db: TaskFundingPaymentDb = prisma,
) {
  const paymentId = session.metadata?.task_funding_payment_id;
  const commerceOrderId = session.metadata?.commerce_order_id;
  const paymentIntentId = getSessionPaymentIntentId(session);
  const paymentIntent = await retrievePaymentIntent(paymentIntentId);
  const chargeId = getLatestChargeId(paymentIntent);
  const customerEmail =
    normalizeEmail(
      session.metadata?.donorEmail ??
        session.customer_email ??
        session.customer_details?.email,
    ) ?? null;
  const customerName =
    trimToNull(
      session.metadata?.donorName ?? session.customer_details?.name,
      200,
    ) ?? null;
  const predicates: Prisma.TaskFundingPaymentWhereInput[] = [
    { stripeCheckoutSessionId: session.id },
  ];
  if (paymentId) predicates.unshift({ id: paymentId });
  if (paymentIntentId)
    predicates.push({ stripePaymentIntentId: paymentIntentId });
  if (commerceOrderId) predicates.push({ commerceOrderId });

  const payment = await db.taskFundingPayment.findFirst({
    where: {
      deletedAt: null,
      OR: predicates,
    },
    select: {
      commerceOrderId: true,
      id: true,
      paidAt: true,
      status: true,
      targetId: true,
    },
  });

  if (!payment) {
    throw new Error(
      `Missing task funding payment for Checkout session ${session.id}.`,
    );
  }

  if (
    payment.status === TaskFundingPaymentStatus.REFUNDED ||
    payment.status === TaskFundingPaymentStatus.DISPUTED
  ) {
    return payment;
  }

  const paidAt = payment.paidAt ?? new Date();
  await db.$transaction(async (tx) => {
    await tx.taskFundingPayment.update({
      where: { id: payment.id },
      data: {
        donorEmail: customerEmail,
        donorName: customerName,
        paidAt,
        status: TaskFundingPaymentStatus.PAID,
        stripeChargeId: chargeId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
      },
    });
    await tx.commerceOrder.update({
      where: { id: payment.commerceOrderId },
      data: {
        buyerEmail: customerEmail,
        buyerName: customerName,
        lastError: null,
        paidAt,
        status: CommerceOrderStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: getStripeObjectId(session.customer),
        stripePaymentIntentId: paymentIntentId,
      },
    });
    await issuePaidContributionReceiptInTransaction(payment.id, tx, {
      now: paidAt,
    });
    await refreshTaskFundingTargetStatus(payment.targetId, tx);
  });

  log.info("Task funding payment recorded", {
    paymentId: payment.id,
    stripeCheckoutSessionId: session.id,
  });

  return payment;
}

export async function recordTaskFundingCheckoutFailed(
  session: Stripe.Checkout.Session,
  status: TaskFundingPaymentStatus = TaskFundingPaymentStatus.FAILED,
  db: TaskFundingPaymentDb = prisma,
) {
  const paymentId = session.metadata?.task_funding_payment_id;
  const predicates: Prisma.TaskFundingPaymentWhereInput[] = [
    { stripeCheckoutSessionId: session.id },
  ];
  if (paymentId) predicates.unshift({ id: paymentId });
  const payment = await db.taskFundingPayment.findFirst({
    where: {
      deletedAt: null,
      OR: predicates,
    },
    select: {
      commerceOrderId: true,
      id: true,
      status: true,
    },
  });
  if (!payment) return null;

  if (
    payment.status === TaskFundingPaymentStatus.PAID ||
    payment.status === TaskFundingPaymentStatus.REFUNDED ||
    payment.status === TaskFundingPaymentStatus.DISPUTED
  ) {
    return payment;
  }

  const now = new Date();
  await db.$transaction([
    db.taskFundingPayment.update({
      where: { id: payment.id },
      data: {
        canceledAt:
          status === TaskFundingPaymentStatus.CANCELED ? now : undefined,
        failedAt: status === TaskFundingPaymentStatus.FAILED ? now : undefined,
        status,
      },
    }),
    db.commerceOrder.update({
      where: { id: payment.commerceOrderId },
      data: {
        canceledAt:
          status === TaskFundingPaymentStatus.CANCELED ? now : undefined,
        lastError:
          status === TaskFundingPaymentStatus.FAILED
            ? "Stripe Checkout payment failed."
            : null,
        status:
          status === TaskFundingPaymentStatus.CANCELED
            ? CommerceOrderStatus.CANCELED
            : CommerceOrderStatus.FAILED,
      },
    }),
  ]);

  return payment;
}

export async function recordTaskFundingChargeRefunded(
  charge: Stripe.Charge,
  db: TaskFundingPaymentDb = prisma,
) {
  const paymentIntentId = getStripeObjectId(charge.payment_intent);
  const predicates: Prisma.TaskFundingPaymentWhereInput[] = [
    { stripeChargeId: charge.id },
  ];
  if (paymentIntentId) {
    predicates.push({ stripePaymentIntentId: paymentIntentId });
  }
  const payment = await db.taskFundingPayment.findFirst({
    where: {
      deletedAt: null,
      OR: predicates,
    },
    select: {
      commerceOrderId: true,
      id: true,
      targetId: true,
    },
  });
  if (!payment) return null;

  await db.$transaction(async (tx) => {
    await tx.taskFundingPayment.update({
      where: { id: payment.id },
      data: {
        refundedAt: new Date(),
        status: TaskFundingPaymentStatus.REFUNDED,
        stripeChargeId: charge.id,
        stripePaymentIntentId: paymentIntentId,
      },
    });
    await tx.commerceOrder.update({
      where: { id: payment.commerceOrderId },
      data: {
        refundedAt: new Date(),
        status: CommerceOrderStatus.REFUNDED,
      },
    });
    await refreshTaskFundingTargetStatus(payment.targetId, tx);
  });

  return payment;
}

export async function recordTaskFundingChargeDisputed(
  dispute: Stripe.Dispute,
  db: TaskFundingPaymentDb = prisma,
) {
  const chargeId = getStripeObjectId(dispute.charge);
  if (!chargeId) return null;

  const payment = await db.taskFundingPayment.findFirst({
    where: {
      deletedAt: null,
      stripeChargeId: chargeId,
    },
    select: {
      commerceOrderId: true,
      id: true,
      targetId: true,
    },
  });
  if (!payment) return null;

  await db.$transaction(async (tx) => {
    await tx.taskFundingPayment.update({
      where: { id: payment.id },
      data: {
        disputedAt: new Date(),
        status: TaskFundingPaymentStatus.DISPUTED,
      },
    });
    await tx.commerceOrder.update({
      where: { id: payment.commerceOrderId },
      data: {
        lastError: `Stripe dispute ${dispute.id} is open for task funding charge ${chargeId}.`,
        status: CommerceOrderStatus.FAILED,
      },
    });
    await refreshTaskFundingTargetStatus(payment.targetId, tx);
  });

  return payment;
}
