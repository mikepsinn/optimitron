import type Stripe from "stripe";
import {
  CommerceFulfillmentKind,
  CommerceOrderStatus,
  Prisma,
  TaskFundingPaymentSource,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  TaskFundingTargetStatus,
  TaskStatus,
} from "@optimitron/db";
import { sendPledgeConfirmationEmail } from "@/lib/email/task-funding-pledge-confirmation-email";
import { sendPledgeDeclineRecoveryEmail } from "@/lib/email/task-funding-pledge-decline-email";
import { sendPledgeChargeReceiptEmail } from "@/lib/email/task-funding-pledge-receipt-email";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { withTaskFundingLock } from "@/lib/task-payouts.server";
import {
  chooseTargetAmountCents,
  getTaskFundingTransferGroup,
  normalizeTaskFundingAmountCents,
  refreshTaskFundingTargetStatus,
  TASK_FUNDING_ORDER_TYPE,
  TASK_FUNDING_PURPOSE_KEY,
} from "./payments.server";
import { createOrReplaceTaskFundingPledge } from "./pledges.server";

/**
 * Assurance-contract escrow for task funding.
 *
 * Pledge = card saved via a Stripe Checkout `mode:"setup"` session, $0 charged.
 * When a target fully funds (PAID payments + card-backed ACTIVE pledges >=
 * target), every card-backed pledge is charged off-session and becomes a
 * regular TaskFundingPayment (source PLEDGE_CALL), so the existing payout and
 * refund flows apply unchanged. Declines flip the pledge to DECLINED, send
 * the one-shot pay-now recovery email, and are returned to the caller.
 *
 * Locking mirrors task-payouts.server.ts: all funding math and status
 * transitions happen inside withTaskFundingLock(taskId); Stripe network calls
 * happen OUTSIDE the lock with deterministic idempotency keys so retries are
 * safe.
 */

export const TASK_FUNDING_PLEDGE_SETUP_KIND = "task-funding-pledge-setup";

const log = createLogger("task-funding-escrow");

/** TaskFundingPayment.amountCents is a Postgres INT4 column. */
const MAX_CHARGEABLE_AMOUNT_CENTS = 2_147_483_647;

const DEAD_TARGET_STATUSES = [
  TaskFundingTargetStatus.CANCELLED,
  TaskFundingTargetStatus.EXPIRED,
] as const;

function getStripeObjectId(
  value: string | { id?: string | null } | null | undefined,
) {
  if (typeof value === "string") return value;
  return value?.id ?? undefined;
}

function getLatestChargeId(paymentIntent: Stripe.PaymentIntent) {
  const latestCharge = paymentIntent.latest_charge;
  if (typeof latestCharge === "string") return latestCharge;
  return latestCharge?.id ?? undefined;
}

function truncateStripeName(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function clampLimit(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(100, Math.trunc(value)));
}

function toChargeableAmountCents(value: bigint): number | null {
  const numeric = Number(value);
  if (
    !Number.isSafeInteger(numeric) ||
    numeric <= 0 ||
    numeric > MAX_CHARGEABLE_AMOUNT_CENTS
  ) {
    return null;
  }
  return numeric;
}

interface StripeCardDeclineInfo {
  code: string | null;
  message: string | null;
  paymentIntentId: string | null;
}

/**
 * Off-session confirmation failures for saved cards surface as Stripe card
 * errors (card_declined, insufficient_funds, expired_card) or as
 * `authentication_required` when SCA blocks the charge. Both are terminal for
 * this pledge — the decline-recovery email with a pay-now link is the retry
 * path. Anything else (network, config) is transient and re-attempted by
 * retryCallableCharges.
 */
function getStripeCardDeclineInfo(error: unknown): StripeCardDeclineInfo | null {
  const stripeError = error as Partial<Stripe.errors.StripeCardError> & {
    raw?: { type?: string };
  };
  const isCardError =
    stripeError?.type === "StripeCardError" ||
    stripeError?.raw?.type === "card_error" ||
    stripeError?.code === "authentication_required";
  if (!isCardError) return null;
  return {
    code: stripeError.decline_code ?? stripeError.code ?? null,
    message: stripeError.message ?? null,
    paymentIntentId: getStripeObjectId(stripeError.payment_intent) ?? null,
  };
}

export interface CreatePledgeCardSetupSessionInput {
  amountCents: number;
  cancelUrl: string;
  publicDisplay?: boolean;
  successUrl: string;
  taskId: string;
  termsNote?: string;
  termsVersion?: string;
  userId: string;
}

export interface CreatePledgeCardSetupSessionResult {
  pledgeId: string;
  url: string;
}

/**
 * Save a card for a conditional pledge: get-or-create the user's durable
 * Stripe Customer, upsert the ACTIVE USD pledge row, and open a Stripe
 * Checkout session in mode "setup" (hosted redirect — no Elements). Nothing
 * is charged here; the card is charged off-session only when the target
 * fully funds.
 */
export async function createPledgeCardSetupSession(
  input: CreatePledgeCardSetupSessionInput,
): Promise<CreatePledgeCardSetupSessionResult> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const amountCents = normalizeTaskFundingAmountCents(input.amountCents);

  const task = await prisma.task.findFirst({
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
      id: true,
      title: true,
    },
  });
  if (!task) {
    throw new Error("Task not found.");
  }

  const currency = task.compensationCurrency?.trim().toLowerCase() || "usd";
  if (currency !== "usd") {
    throw new Error("Task funding pledges currently support USD tasks only.");
  }

  const targetAmountCentsValue = chooseTargetAmountCents({
    compensationMaxAmountMinorUnits: task.compensationMaxAmountMinorUnits,
    estimatedCashCostUsdBase:
      task.currentImpactEstimateSet?.frames[0]?.estimatedCashCostUsdBase,
  });
  if (targetAmountCentsValue == null) {
    throw new Error("Task has no funding target yet.");
  }

  await prisma.taskFundingTarget.upsert({
    where: { taskId: task.id },
    create: {
      currency,
      metadata: {
        createdBy: TASK_FUNDING_PLEDGE_SETUP_KIND,
      } satisfies Prisma.InputJsonValue,
      status: TaskFundingTargetStatus.OPEN,
      targetAmountCents: BigInt(targetAmountCentsValue),
      taskId: task.id,
    },
    update: {
      deletedAt: null,
    },
    select: { id: true },
  });

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, id: input.userId },
    select: {
      email: true,
      id: true,
      person: { select: { displayName: true } },
      stripeCustomerId: true,
    },
  });
  if (!user) {
    throw new Error("Pledging user not found.");
  }

  const stripe = getStripeClient();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
      name: user.person?.displayName ?? undefined,
    });
    // Only claim the slot if it is still empty so a concurrent request's
    // customer is never clobbered; if we lost the race, use the winner's.
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, stripeCustomerId: null },
      data: { stripeCustomerId: customer.id },
    });
    if (claimed.count === 1) {
      customerId = customer.id;
    } else {
      const fresh = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true },
      });
      customerId = fresh?.stripeCustomerId ?? customer.id;
    }
  }

  const { pledge } = await createOrReplaceTaskFundingPledge({
    conversionInput: { amountCents: String(amountCents), unitKind: "USD" },
    mode: "replace",
    pledgedByUserId: user.id,
    pledgerKind: "PERSON",
    publicDisplay: input.publicDisplay ?? false,
    taskId: task.id,
    termsNote: input.termsNote,
    termsVersion: input.termsVersion,
  });

  const setupMetadata = {
    kind: TASK_FUNDING_PLEDGE_SETUP_KIND,
    pledgeId: pledge.id,
    target_id: pledge.targetId,
    task_id: task.id,
  };
  const session = await stripe.checkout.sessions.create({
    cancel_url: input.cancelUrl,
    customer: customerId,
    metadata: setupMetadata,
    mode: "setup",
    payment_method_types: ["card"],
    setup_intent_data: {
      metadata: setupMetadata,
    },
    success_url: input.successUrl,
  });
  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  const setupIntentId = getStripeObjectId(session.setup_intent);
  if (setupIntentId) {
    await prisma.taskFundingPledge.update({
      where: { id: pledge.id },
      data: { stripeSetupIntentId: setupIntentId },
    });
  }

  log.info("Pledge card setup session created", {
    pledgeId: pledge.id,
    stripeCheckoutSessionId: session.id,
    taskId: task.id,
  });

  return { pledgeId: pledge.id, url: session.url };
}

export interface PledgeChargeRecord {
  amountCents: number;
  donorEmail: string | null;
  paymentId: string;
  pledgeId: string;
  pledgedByUserId: string | null;
  targetId: string;
  taskId: string;
}

export interface DeclinedPledgeCharge extends PledgeChargeRecord {
  declineCode: string | null;
  declineMessage: string | null;
}

export interface MaybeChargeCallablePledgesResult {
  charged: PledgeChargeRecord[];
  declined: DeclinedPledgeCharge[];
  fullyFunded: boolean;
}

/** The row ids settlement bookkeeping needs — a subset of a full charge plan. */
interface PledgeChargeRefs {
  commerceOrderId: string;
  paymentId: string;
  pledgeId: string;
  targetId: string;
}

interface PledgeChargePlan extends PledgeChargeRecord {
  commerceOrderId: string;
  currency: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
}

function toChargeRecord(plan: PledgeChargePlan): PledgeChargeRecord {
  return {
    amountCents: plan.amountCents,
    donorEmail: plan.donorEmail,
    paymentId: plan.paymentId,
    pledgeId: plan.pledgeId,
    pledgedByUserId: plan.pledgedByUserId,
    targetId: plan.targetId,
    taskId: plan.taskId,
  };
}

async function recordPledgeChargeSucceeded(
  plan: PledgeChargeRefs,
  paymentIntent: Stripe.PaymentIntent,
) {
  const paidAt = new Date();
  const chargeId = getLatestChargeId(paymentIntent);
  await prisma.$transaction(async (tx) => {
    await tx.taskFundingPayment.update({
      where: { id: plan.paymentId },
      data: {
        failedAt: null,
        paidAt,
        status: TaskFundingPaymentStatus.PAID,
        stripeChargeId: chargeId,
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    await tx.commerceOrder.update({
      where: { id: plan.commerceOrderId },
      data: {
        lastError: null,
        paidAt,
        status: CommerceOrderStatus.PAID,
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    await tx.taskFundingPledge.update({
      where: { id: plan.pledgeId },
      data: {
        fulfilledAt: paidAt,
        status: TaskFundingPledgeStatus.FULFILLED,
      },
    });
    await refreshTaskFundingTargetStatus(plan.targetId, tx);
  });
  await notifyPledgeChargeReceipt(plan);
}

async function recordPledgeChargeDeclined(
  plan: PledgeChargeRefs,
  decline: StripeCardDeclineInfo,
) {
  const declinedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.taskFundingPayment.update({
      where: { id: plan.paymentId },
      data: {
        failedAt: declinedAt,
        status: TaskFundingPaymentStatus.FAILED,
        stripePaymentIntentId: decline.paymentIntentId ?? undefined,
      },
    });
    await tx.commerceOrder.update({
      where: { id: plan.commerceOrderId },
      data: {
        lastError: decline.message ?? "Saved card was declined.",
        status: CommerceOrderStatus.FAILED,
        stripePaymentIntentId: decline.paymentIntentId ?? undefined,
      },
    });
    await tx.taskFundingPledge.update({
      where: { id: plan.pledgeId },
      data: {
        declinedAt,
        status: TaskFundingPledgeStatus.DECLINED,
      },
    });
    // A decline can drop the committed total below the target; flip the
    // target back to OPEN so new pledges can re-trigger the threshold.
    await refreshTaskFundingTargetStatus(plan.targetId, tx);
  });
  await notifyPledgeDeclined(plan, declinedAt);
}

/**
 * Best-effort decline-recovery email. Lives at the single state transition
 * every decline path funnels through (sync confirm, webhook settlement, cron
 * retry), so no call site can forget it. Deduped on `{pledgeId}:{declinedAt}`
 * in the shared EmailLog, so a double-wired caller or a replayed run sends at
 * most one email per decline. Never throws — a mail failure must not fail
 * the charge bookkeeping that already committed.
 */
async function notifyPledgeDeclined(refs: PledgeChargeRefs, declinedAt: Date) {
  try {
    const payment = await prisma.taskFundingPayment.findFirst({
      where: { deletedAt: null, id: refs.paymentId },
      select: {
        amountCents: true,
        donorEmail: true,
        pledge: {
          select: {
            cardBrand: true,
            cardLast4: true,
            id: true,
            pledgedByUser: { select: { email: true } },
            pledgedByUserId: true,
          },
        },
        task: { select: { id: true, title: true } },
      },
    });
    const pledge = payment?.pledge;
    // A missing email is a real state (org/soft pledges), not a swallowed
    // error — the guard below logs and skips the send.
    const toEmail = payment?.donorEmail ?? pledge?.pledgedByUser?.email;
    if (!payment || !pledge || !toEmail) {
      log.warn("Declined pledge has no recipient for the recovery email", {
        pledgeId: refs.pledgeId,
        targetId: refs.targetId,
      });
      return;
    }

    const result = await sendPledgeDeclineRecoveryEmail({
      amountCents: payment.amountCents,
      pledge: {
        cardBrand: pledge.cardBrand,
        cardLast4: pledge.cardLast4,
        declinedAt,
        id: pledge.id,
        pledgedByUserId: pledge.pledgedByUserId,
      },
      task: { id: payment.task.id, title: payment.task.title },
      toEmail,
    });
    log.info("Pledge decline recovery email", {
      pledgeId: refs.pledgeId,
      status: result.status,
      targetId: refs.targetId,
    });
  } catch (error) {
    log.error("Failed to send pledge decline recovery email", {
      error,
      pledgeId: refs.pledgeId,
      targetId: refs.targetId,
    });
  }
}

/**
 * The descriptor the pledger's bank statement will actually show. No
 * `statement_descriptor` is configured anywhere in this codebase, so Stripe
 * applies the account default; `calculated_statement_descriptor` on the
 * charge is that final computed string. Best-effort — on lookup failure the
 * receipt copy states the account-default fact instead of quoting it.
 */
async function getChargeStatementDescriptor(
  chargeId: string | null | undefined,
): Promise<string | null> {
  if (!chargeId || !isStripeConfigured()) return null;
  try {
    const charge = await getStripeClient().charges.retrieve(chargeId);
    return charge.calculated_statement_descriptor ?? null;
  } catch (error) {
    log.warn("Could not resolve the statement descriptor for a receipt", {
      chargeId,
      error,
    });
    return null;
  }
}

/**
 * Best-effort charge-receipt email. Lives at the single success transition
 * every pledge-charge path funnels through (sync confirm in
 * maybeChargeCallablePledges, webhook settlement in
 * settlePledgeCallPaymentIntent), so no call site can forget it. Deduped on
 * `pledge-receipt:{pledgeId}` in the shared EmailLog — a pledge fulfills at
 * most once, so at most one receipt ever, even when the sync path and a
 * replayed webhook both settle the same intent. Never throws — a mail
 * failure must not fail the charge bookkeeping that already committed.
 */
async function notifyPledgeChargeReceipt(refs: PledgeChargeRefs) {
  try {
    const payment = await prisma.taskFundingPayment.findFirst({
      where: { deletedAt: null, id: refs.paymentId },
      select: {
        amountCents: true,
        donorEmail: true,
        pledge: {
          select: {
            cardBrand: true,
            cardLast4: true,
            id: true,
            pledgedByUser: { select: { email: true } },
            pledgedByUserId: true,
          },
        },
        stripeChargeId: true,
        task: { select: { id: true, title: true } },
      },
    });
    const pledge = payment?.pledge;
    // A missing email is a real state (org/soft pledges), not a swallowed
    // error — the guard below logs and skips the send.
    const toEmail = payment?.donorEmail ?? pledge?.pledgedByUser?.email;
    if (!payment || !pledge || !toEmail) {
      log.warn("Charged pledge has no recipient for the receipt email", {
        pledgeId: refs.pledgeId,
        targetId: refs.targetId,
      });
      return;
    }

    const statementDescriptor = await getChargeStatementDescriptor(
      payment.stripeChargeId,
    );
    const result = await sendPledgeChargeReceiptEmail({
      amountCents: payment.amountCents,
      pledge: {
        cardBrand: pledge.cardBrand,
        cardLast4: pledge.cardLast4,
        id: pledge.id,
        pledgedByUserId: pledge.pledgedByUserId,
      },
      statementDescriptor,
      task: { id: payment.task.id, title: payment.task.title },
      toEmail,
    });
    log.info("Pledge charge receipt email", {
      pledgeId: refs.pledgeId,
      status: result.status,
      targetId: refs.targetId,
    });
  } catch (error) {
    log.error("Failed to send pledge charge receipt email", {
      error,
      pledgeId: refs.pledgeId,
      targetId: refs.targetId,
    });
  }
}

/**
 * Charge every card-backed ACTIVE pledge on a target once it is fully funded
 * FOR CHARGING: sum(PAID payments) + sum(card-backed ACTIVE pledges'
 * committedAmountCents) >= targetAmountCents. Card-backed means a saved
 * payment method exists. Charging over target is fine — extra money funds the
 * same task.
 *
 * Order/payment rows and calledAt are written inside the per-task advisory
 * lock; the off-session PaymentIntent confirmations run outside the lock with
 * deterministic idempotency keys (`pledge-call:{pledgeId}:v1`), so a crash
 * between the two phases is recovered by retryCallableCharges re-confirming
 * the same intent.
 */
export async function maybeChargeCallablePledges(
  targetId: string,
): Promise<MaybeChargeCallablePledgesResult> {
  const empty: MaybeChargeCallablePledgesResult = {
    charged: [],
    declined: [],
    fullyFunded: false,
  };

  if (!isStripeConfigured()) {
    log.warn("Stripe is not configured; skipping pledge calls", { targetId });
    return empty;
  }

  const target = await prisma.taskFundingTarget.findFirst({
    where: { deletedAt: null, id: targetId },
    select: {
      currency: true,
      id: true,
      status: true,
      task: { select: { deletedAt: true, id: true, title: true } },
      taskId: true,
    },
  });
  if (
    !target ||
    target.task.deletedAt ||
    DEAD_TARGET_STATUSES.some((status) => status === target.status)
  ) {
    return empty;
  }

  const transferGroup = getTaskFundingTransferGroup(target.taskId);
  const calledAt = new Date();

  const planning = await withTaskFundingLock(target.taskId, async (tx) => {
    const current = await tx.taskFundingTarget.findFirst({
      where: { deletedAt: null, id: targetId },
      select: { status: true, targetAmountCents: true },
    });
    if (
      !current ||
      DEAD_TARGET_STATUSES.some((status) => status === current.status)
    ) {
      return { fullyFunded: false, plans: [] as PledgeChargePlan[] };
    }

    const [paidAggregate, cardPledges] = await Promise.all([
      tx.taskFundingPayment.aggregate({
        where: {
          deletedAt: null,
          status: TaskFundingPaymentStatus.PAID,
          targetId,
        },
        _sum: { amountCents: true },
      }),
      tx.taskFundingPledge.findMany({
        where: {
          deletedAt: null,
          status: TaskFundingPledgeStatus.ACTIVE,
          stripePaymentMethodId: { not: null },
          targetId,
        },
        orderBy: { createdAt: "asc" },
        select: {
          calledAt: true,
          committedAmountCents: true,
          id: true,
          payment: {
            select: {
              amountCents: true,
              commerceOrderId: true,
              id: true,
              status: true,
            },
          },
          pledgedByUser: {
            select: { email: true, id: true, stripeCustomerId: true },
          },
          pledgedByUserId: true,
          pledgerOrganizationId: true,
          publicDisplay: true,
          publicNameSnapshot: true,
          stripePaymentMethodId: true,
        },
      }),
    ]);

    const paidCents = BigInt(paidAggregate._sum.amountCents ?? 0);
    const cardPledgedCents = cardPledges.reduce(
      (sum, pledge) => sum + pledge.committedAmountCents,
      0n,
    );
    if (paidCents + cardPledgedCents < current.targetAmountCents) {
      return { fullyFunded: false, plans: [] as PledgeChargePlan[] };
    }

    const plans: PledgeChargePlan[] = [];
    for (const pledge of cardPledges) {
      const customerId = pledge.pledgedByUser?.stripeCustomerId;
      const paymentMethodId = pledge.stripePaymentMethodId;
      if (!customerId || !paymentMethodId) {
        log.error("Card-backed pledge has no chargeable Stripe customer", {
          pledgeId: pledge.id,
          targetId,
        });
        continue;
      }

      const base = {
        currency: target.currency,
        donorEmail: pledge.pledgedByUser?.email ?? null,
        pledgeId: pledge.id,
        pledgedByUserId: pledge.pledgedByUserId,
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethodId,
        targetId,
        taskId: target.taskId,
      };

      if (pledge.payment) {
        // Recovery path: a previous run created the payment but crashed
        // before the Stripe outcome was persisted. The deterministic
        // idempotency key makes re-confirming safe. Charge the frozen
        // payment amount, not the (possibly re-pledged) committed amount,
        // so the replayed Stripe params match the original call.
        if (pledge.payment.status !== TaskFundingPaymentStatus.PENDING) {
          continue;
        }
        if (pledge.calledAt === null) {
          await tx.taskFundingPledge.update({
            where: { id: pledge.id },
            data: { calledAt },
          });
        }
        plans.push({
          ...base,
          amountCents: pledge.payment.amountCents,
          commerceOrderId: pledge.payment.commerceOrderId,
          paymentId: pledge.payment.id,
        });
        continue;
      }

      const amountCents = toChargeableAmountCents(pledge.committedAmountCents);
      if (amountCents == null) {
        log.error("Pledge amount is not chargeable as integer cents", {
          committedAmountCents: pledge.committedAmountCents.toString(),
          pledgeId: pledge.id,
          targetId,
        });
        continue;
      }

      const order = await tx.commerceOrder.create({
        data: {
          buyerEmail: base.donorEmail,
          buyerName: pledge.publicNameSnapshot,
          buyerUserId: pledge.pledgedByUserId,
          currency: target.currency,
          donationCents: amountCents,
          fmvCents: 0,
          metadata: {
            pledgeId: pledge.id,
            source: TaskFundingPaymentSource.PLEDGE_CALL,
            targetId,
            taskId: target.taskId,
          } satisfies Prisma.InputJsonValue,
          paymentProvider: "STRIPE",
          purposeKey: TASK_FUNDING_PURPOSE_KEY,
          status: CommerceOrderStatus.PENDING_PAYMENT,
          stripeCustomerId: customerId,
          subtotalCents: amountCents,
          totalCents: amountCents,
          items: {
            create: {
              currency: target.currency,
              fulfillmentKind: CommerceFulfillmentKind.NONE,
              metadata: {
                pledgeId: pledge.id,
                targetId,
                taskId: target.taskId,
              } satisfies Prisma.InputJsonValue,
              offerKey: TASK_FUNDING_PURPOSE_KEY,
              quantity: 1,
              title: truncateStripeName(`Fund: ${target.task.title}`),
              totalAmountCents: amountCents,
              totalDonationCents: amountCents,
              totalFmvCents: 0,
              unitAmountCents: amountCents,
              unitDonationCents: amountCents,
              unitFmvCents: 0,
            },
          },
        },
        select: { id: true },
      });

      const payment = await tx.taskFundingPayment.create({
        data: {
          amountCents,
          commerceOrderId: order.id,
          currency: target.currency,
          donorEmail: base.donorEmail,
          donorName: pledge.publicNameSnapshot,
          donorOrganizationId: pledge.pledgerOrganizationId,
          donorUserId: pledge.pledgedByUserId,
          metadata: {
            pledgeId: pledge.id,
            source: TaskFundingPaymentSource.PLEDGE_CALL,
          } satisfies Prisma.InputJsonValue,
          pledgeId: pledge.id,
          publicDisplay: pledge.publicDisplay,
          publicNameSnapshot: pledge.publicDisplay
            ? pledge.publicNameSnapshot
            : null,
          source: TaskFundingPaymentSource.PLEDGE_CALL,
          status: TaskFundingPaymentStatus.PENDING,
          stripeTransferGroup: transferGroup,
          targetId,
          taskId: target.taskId,
        },
        select: { id: true },
      });

      await tx.taskFundingPledge.update({
        where: { id: pledge.id },
        data: { calledAt },
      });

      plans.push({
        ...base,
        amountCents,
        commerceOrderId: order.id,
        paymentId: payment.id,
      });
    }

    return { fullyFunded: true, plans };
  });

  if (!planning.fullyFunded) {
    return empty;
  }

  const stripe = getStripeClient();
  const charged: PledgeChargeRecord[] = [];
  const declined: DeclinedPledgeCharge[] = [];

  for (const plan of planning.plans) {
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: plan.amountCents,
          confirm: true,
          currency: plan.currency,
          customer: plan.stripeCustomerId,
          metadata: {
            commerce_order_id: plan.commerceOrderId,
            order_type: TASK_FUNDING_ORDER_TYPE,
            pledgeId: plan.pledgeId,
            task_funding_payment_id: plan.paymentId,
            task_id: plan.taskId,
            target_id: plan.targetId,
          },
          off_session: true,
          payment_method: plan.stripePaymentMethodId,
          transfer_group: transferGroup,
        },
        { idempotencyKey: `pledge-call:${plan.pledgeId}:v1` },
      );

      if (paymentIntent.status === "succeeded") {
        await recordPledgeChargeSucceeded(plan, paymentIntent);
        charged.push(toChargeRecord(plan));
        log.info("Pledge charged at threshold", {
          amountCents: plan.amountCents,
          pledgeId: plan.pledgeId,
          targetId: plan.targetId,
        });
      } else if (paymentIntent.status === "processing") {
        // Async settlement: persist the intent id and let the webhook or the
        // next retryCallableCharges pass finish the bookkeeping.
        await prisma.$transaction([
          prisma.taskFundingPayment.update({
            where: { id: plan.paymentId },
            data: { stripePaymentIntentId: paymentIntent.id },
          }),
          prisma.commerceOrder.update({
            where: { id: plan.commerceOrderId },
            data: { stripePaymentIntentId: paymentIntent.id },
          }),
        ]);
      } else {
        const decline: StripeCardDeclineInfo = {
          code:
            paymentIntent.status === "requires_action"
              ? "authentication_required"
              : paymentIntent.status,
          message: `Off-session PaymentIntent ended in status ${paymentIntent.status}.`,
          paymentIntentId: paymentIntent.id,
        };
        await recordPledgeChargeDeclined(plan, decline);
        declined.push({
          ...toChargeRecord(plan),
          declineCode: decline.code,
          declineMessage: decline.message,
        });
      }
    } catch (error) {
      const decline = getStripeCardDeclineInfo(error);
      if (decline) {
        await recordPledgeChargeDeclined(plan, decline);
        declined.push({
          ...toChargeRecord(plan),
          declineCode: decline.code,
          declineMessage: decline.message,
        });
        log.info("Pledge charge declined", {
          declineCode: decline.code,
          pledgeId: plan.pledgeId,
          targetId: plan.targetId,
        });
      } else {
        // Transient (network/config) failure: payment stays PENDING and the
        // pledge stays ACTIVE with calledAt set, so retryCallableCharges
        // re-confirms the same idempotent PaymentIntent later.
        log.error("Pledge charge failed transiently; will retry", {
          error,
          pledgeId: plan.pledgeId,
          targetId: plan.targetId,
        });
      }
    }
  }

  return { charged, declined, fullyFunded: true };
}

export type CancelPledgeAsPledgerResult =
  | { outcome: "cancelled" | "unavailable"; taskId: string }
  | { outcome: "not_found" };

/**
 * Cancel a pledge on the pledger's own say-so (the signed cancel link in the
 * confirmation email). Only an ACTIVE pledge whose charge has not started
 * (`calledAt` null) is cancellable; the status check and the flip run inside
 * withTaskFundingLock so a cancel can never race maybeChargeCallablePledges'
 * planning phase — whichever takes the lock first wins, and the loser sees
 * the other's committed state. The saved payment method is detached from the
 * Stripe customer afterwards (outside the lock; already-detached is fine) so
 * nothing keeps a card the pledger asked us to forget.
 */
export async function cancelPledgeAsPledger(
  pledgeId: string,
): Promise<CancelPledgeAsPledgerResult> {
  const pledge = await prisma.taskFundingPledge.findFirst({
    where: { deletedAt: null, id: pledgeId },
    select: { id: true, target: { select: { id: true, taskId: true } } },
  });
  if (!pledge) return { outcome: "not_found" };
  const { taskId } = pledge.target;

  const locked = await withTaskFundingLock(taskId, async (tx) => {
    const current = await tx.taskFundingPledge.findFirst({
      where: { deletedAt: null, id: pledgeId },
      select: {
        calledAt: true,
        pledgedByUserId: true,
        status: true,
        stripePaymentMethodId: true,
      },
    });
    if (
      !current ||
      current.status !== TaskFundingPledgeStatus.ACTIVE ||
      current.calledAt !== null
    ) {
      return { cancelled: false as const, paymentMethodId: null };
    }

    await tx.taskFundingPledge.update({
      where: { id: pledgeId },
      data: {
        cancellationReason: "Cancelled by pledger",
        cancelledAt: new Date(),
        cancelledByUserId: current.pledgedByUserId,
        // Clear the card refs so a later re-pledge on this row can never
        // point at the payment method we are about to detach.
        cardBrand: null,
        cardLast4: null,
        status: TaskFundingPledgeStatus.CANCELLED,
        stripePaymentMethodId: null,
      },
    });
    // Cancelling committed money can drop the total below the target; flip
    // THRESHOLD_MET back to OPEN so later pledges re-trigger the charge.
    await refreshTaskFundingTargetStatus(pledge.target.id, tx);
    return {
      cancelled: true as const,
      paymentMethodId: current.stripePaymentMethodId,
    };
  });

  if (!locked.cancelled) return { outcome: "unavailable", taskId };

  if (locked.paymentMethodId && isStripeConfigured()) {
    try {
      await getStripeClient().paymentMethods.detach(locked.paymentMethodId);
    } catch (error) {
      // Already-detached (or otherwise gone) payment methods are fine — the
      // pledge row no longer references it and nothing will charge it.
      log.warn("Could not detach payment method for cancelled pledge", {
        error,
        pledgeId,
      });
    }
  }

  log.info("Pledge cancelled by pledger", { pledgeId, taskId });
  return { outcome: "cancelled", taskId };
}

/**
 * Best-effort pledge-confirmation email. Lives at the single choke point
 * every successful card save funnels through (the setup-session webhook), and
 * runs BEFORE maybeChargeCallablePledges so the pledger hears "card saved,
 * nothing charged" even when their card immediately completes the threshold
 * and the pledge leaves ACTIVE moments later. Deduped on
 * `pledge-confirm:{pledgeId}` in the shared EmailLog, so replayed webhook
 * deliveries send at most one confirmation per pledge. Never throws — a mail
 * failure must not fail the card bookkeeping that already committed.
 */
async function notifyPledgeConfirmed(pledgeId: string) {
  try {
    const pledge = await prisma.taskFundingPledge.findFirst({
      where: { deletedAt: null, id: pledgeId },
      select: {
        cardBrand: true,
        cardLast4: true,
        committedAmountCents: true,
        id: true,
        pledgedByUser: { select: { email: true } },
        pledgedByUserId: true,
        status: true,
        target: {
          select: {
            expiresAt: true,
            task: { select: { id: true, title: true } },
          },
        },
      },
    });
    // A missing email is a real state (org/soft pledges), not a swallowed
    // error — the guard below logs and skips the send.
    const toEmail = pledge?.pledgedByUser?.email;
    if (!pledge || !toEmail) {
      log.warn("Confirmed pledge has no recipient for the confirmation email", {
        pledgeId,
      });
      return;
    }
    if (pledge.status !== TaskFundingPledgeStatus.ACTIVE) {
      // Cancelled/voided between the Checkout redirect and this webhook —
      // "your card is saved" would be false, so say nothing.
      log.info("Pledge left ACTIVE before confirmation email; skipping", {
        pledgeId,
        status: pledge.status,
      });
      return;
    }

    const amountCents = toChargeableAmountCents(pledge.committedAmountCents);
    if (amountCents == null) {
      log.warn("Pledge amount is not representable for confirmation email", {
        committedAmountCents: pledge.committedAmountCents.toString(),
        pledgeId,
      });
      return;
    }

    const result = await sendPledgeConfirmationEmail({
      amountCents,
      pledge: {
        cardBrand: pledge.cardBrand,
        cardLast4: pledge.cardLast4,
        id: pledge.id,
        pledgedByUserId: pledge.pledgedByUserId,
      },
      target: { expiresAt: pledge.target.expiresAt },
      task: { id: pledge.target.task.id, title: pledge.target.task.title },
      toEmail,
    });
    log.info("Pledge confirmation email", { pledgeId, status: result.status });
  } catch (error) {
    log.error("Failed to send pledge confirmation email", { error, pledgeId });
  }
}

export interface PledgeSetupCompletionResult {
  chargeResult: MaybeChargeCallablePledgesResult;
  pledgeId: string;
  targetId: string;
}

/**
 * Handle `checkout.session.completed` for mode:"setup" sessions created by
 * createPledgeCardSetupSession: resolve the SetupIntent, persist the saved
 * payment method + card brand/last4 on the pledge, then attempt to charge
 * callable pledges on the target (the new card may complete the threshold).
 */
export async function handlePledgeSetupSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<PledgeSetupCompletionResult | null> {
  if (session.mode !== "setup") return null;
  if (session.metadata?.kind !== TASK_FUNDING_PLEDGE_SETUP_KIND) return null;

  const pledgeId = session.metadata?.pledgeId;
  if (!pledgeId) {
    log.error("Pledge setup session has no pledgeId metadata", {
      stripeCheckoutSessionId: session.id,
    });
    return null;
  }

  const setupIntentId = getStripeObjectId(session.setup_intent);
  if (!setupIntentId) {
    log.error("Pledge setup session has no SetupIntent", {
      pledgeId,
      stripeCheckoutSessionId: session.id,
    });
    return null;
  }

  const pledge = await prisma.taskFundingPledge.findFirst({
    where: { deletedAt: null, id: pledgeId },
    select: { id: true, targetId: true },
  });
  if (!pledge) {
    throw new Error(
      `Missing task funding pledge ${pledgeId} for setup session ${session.id}.`,
    );
  }

  const stripe = getStripeClient();
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
    expand: ["payment_method"],
  });
  const paymentMethod =
    typeof setupIntent.payment_method === "string"
      ? await stripe.paymentMethods.retrieve(setupIntent.payment_method)
      : setupIntent.payment_method;
  if (!paymentMethod) {
    log.error("Pledge SetupIntent has no payment method", {
      pledgeId,
      stripeSetupIntentId: setupIntentId,
    });
    return null;
  }

  await prisma.taskFundingPledge.update({
    where: { id: pledge.id },
    data: {
      cardBrand: paymentMethod.card?.brand ?? null,
      cardLast4: paymentMethod.card?.last4 ?? null,
      stripePaymentMethodId: paymentMethod.id,
      stripeSetupIntentId: setupIntentId,
    },
  });

  log.info("Pledge card saved", {
    pledgeId: pledge.id,
    targetId: pledge.targetId,
  });

  await notifyPledgeConfirmed(pledge.id);

  const chargeResult = await maybeChargeCallablePledges(pledge.targetId);
  return { chargeResult, pledgeId: pledge.id, targetId: pledge.targetId };
}

export interface PledgeCallSettlement {
  outcome: "declined" | "succeeded";
  paymentId: string;
  pledgeId: string;
  targetId: string;
}

/**
 * Webhook settlement for off-session pledge-call PaymentIntents that the
 * synchronous confirm path in maybeChargeCallablePledges could not settle —
 * an intent that ended in "processing", or a crash between the Stripe call
 * and the bookkeeping. Resolves the PLEDGE_CALL payment row by the intent's
 * metadata payment id or by stripePaymentIntentId, and no-ops when the
 * payment already left PENDING, so replayed webhook deliveries are safe.
 */
export async function settlePledgeCallPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): Promise<PledgeCallSettlement | null> {
  const predicates: Prisma.TaskFundingPaymentWhereInput[] = [
    { stripePaymentIntentId: paymentIntent.id },
  ];
  const metadataPaymentId = paymentIntent.metadata?.task_funding_payment_id;
  if (metadataPaymentId) predicates.unshift({ id: metadataPaymentId });

  const payment = await prisma.taskFundingPayment.findFirst({
    where: {
      deletedAt: null,
      OR: predicates,
      source: TaskFundingPaymentSource.PLEDGE_CALL,
    },
    select: {
      commerceOrderId: true,
      id: true,
      pledgeId: true,
      status: true,
      targetId: true,
    },
  });
  if (!payment?.pledgeId) return null;
  if (payment.status !== TaskFundingPaymentStatus.PENDING) return null;

  const refs: PledgeChargeRefs = {
    commerceOrderId: payment.commerceOrderId,
    paymentId: payment.id,
    pledgeId: payment.pledgeId,
    targetId: payment.targetId,
  };
  const settlement = {
    paymentId: refs.paymentId,
    pledgeId: refs.pledgeId,
    targetId: refs.targetId,
  };

  if (paymentIntent.status === "succeeded") {
    await recordPledgeChargeSucceeded(refs, paymentIntent);
    log.info("Pledge charge settled by webhook", settlement);
    return { outcome: "succeeded", ...settlement };
  }

  if (
    paymentIntent.status === "requires_payment_method" ||
    paymentIntent.status === "canceled"
  ) {
    const lastError = paymentIntent.last_payment_error;
    const decline: StripeCardDeclineInfo = {
      code: lastError?.decline_code ?? lastError?.code ?? paymentIntent.status,
      message:
        lastError?.message ??
        `Off-session PaymentIntent ended in status ${paymentIntent.status}.`,
      paymentIntentId: paymentIntent.id,
    };
    await recordPledgeChargeDeclined(refs, decline);
    log.info("Pledge charge declined by webhook", {
      declineCode: decline.code,
      ...settlement,
    });
    return { outcome: "declined", ...settlement };
  }

  // Still in flight (e.g. "processing"): leave the payment PENDING for a
  // later payment_intent event.
  return null;
}

/** Flip OPEN targets past their expiresAt to EXPIRED. Returns the flip count. */
export async function markExpiredTargets(
  now: Date = new Date(),
): Promise<number> {
  const result = await prisma.taskFundingTarget.updateMany({
    where: {
      deletedAt: null,
      expiresAt: { lte: now },
      status: TaskFundingTargetStatus.OPEN,
    },
    data: { status: TaskFundingTargetStatus.EXPIRED },
  });
  if (result.count > 0) {
    log.info("Marked expired task funding targets", { count: result.count });
  }
  return result.count;
}

export interface RefundDeadTargetFundingResult {
  pledgesCancelled: number;
  refundsFailed: number;
  refundsRequested: number;
  targetsProcessed: number;
}

/**
 * Assurance-contract refund sweep. For targets that are EXPIRED/CANCELLED or
 * whose task was soft-deleted: request a Stripe refund for every PAID payment
 * (idempotency key `funding-refund:{paymentId}:v1`) and cancel un-charged
 * card-backed pledges. Payment status is NOT flipped locally — the
 * charge.refunded webhook already does that bookkeeping, so the sweep stays
 * idempotent until the webhook lands.
 */
export async function refundDeadTargetFunding(
  input: { limit?: number } = {},
): Promise<RefundDeadTargetFundingResult> {
  const result: RefundDeadTargetFundingResult = {
    pledgesCancelled: 0,
    refundsFailed: 0,
    refundsRequested: 0,
    targetsProcessed: 0,
  };

  const targets = await prisma.taskFundingTarget.findMany({
    where: {
      AND: [
        {
          OR: [
            { status: { in: [...DEAD_TARGET_STATUSES] } },
            { task: { deletedAt: { not: null } } },
          ],
        },
        {
          OR: [
            {
              payments: {
                some: {
                  deletedAt: null,
                  status: TaskFundingPaymentStatus.PAID,
                },
              },
            },
            {
              pledges: {
                some: {
                  deletedAt: null,
                  OR: [
                    { stripeSetupIntentId: { not: null } },
                    { stripePaymentMethodId: { not: null } },
                  ],
                  status: TaskFundingPledgeStatus.ACTIVE,
                },
              },
            },
          ],
        },
      ],
      deletedAt: null,
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true, taskId: true },
    take: clampLimit(input.limit, 25),
  });
  if (targets.length === 0) return result;

  if (!isStripeConfigured()) {
    log.warn("Stripe is not configured; skipping funding refund sweep", {
      targetCount: targets.length,
    });
    return result;
  }

  const stripe = getStripeClient();
  for (const target of targets) {
    result.targetsProcessed += 1;

    const payments = await prisma.taskFundingPayment.findMany({
      where: {
        deletedAt: null,
        status: TaskFundingPaymentStatus.PAID,
        targetId: target.id,
      },
      select: { id: true, stripeChargeId: true, stripePaymentIntentId: true },
    });

    for (const payment of payments) {
      const refundTarget = payment.stripeChargeId
        ? { charge: payment.stripeChargeId }
        : payment.stripePaymentIntentId
          ? { payment_intent: payment.stripePaymentIntentId }
          : null;
      if (!refundTarget) {
        result.refundsFailed += 1;
        log.error("PAID task funding payment has no Stripe charge to refund", {
          paymentId: payment.id,
          targetId: target.id,
        });
        continue;
      }

      try {
        await stripe.refunds.create(
          {
            ...refundTarget,
            metadata: {
              target_id: target.id,
              task_funding_payment_id: payment.id,
              task_id: target.taskId,
            },
          },
          { idempotencyKey: `funding-refund:${payment.id}:v1` },
        );
        result.refundsRequested += 1;
      } catch (error) {
        const code = (error as Partial<Stripe.errors.StripeError>)?.code;
        if (code === "charge_already_refunded") {
          // Refunded out-of-band; the webhook bookkeeping is simply behind.
          result.refundsRequested += 1;
          continue;
        }
        result.refundsFailed += 1;
        log.error("Task funding refund request failed", {
          error,
          paymentId: payment.id,
          targetId: target.id,
        });
      }
    }

    // Cancel card-backed pledges that were never charged (no payment row at
    // all — pledges with an in-flight PENDING payment are left for the
    // webhook/retry path to settle first).
    const cancelled = await prisma.taskFundingPledge.updateMany({
      where: {
        deletedAt: null,
        OR: [
          { stripeSetupIntentId: { not: null } },
          { stripePaymentMethodId: { not: null } },
        ],
        payment: { is: null },
        status: TaskFundingPledgeStatus.ACTIVE,
        targetId: target.id,
      },
      data: {
        cancellationReason:
          "Task funding target closed before the pledge was charged.",
        cancelledAt: new Date(),
        status: TaskFundingPledgeStatus.CANCELLED,
      },
    });
    result.pledgesCancelled += cancelled.count;
  }

  return result;
}

export interface RetryCallableChargesResult {
  charged: PledgeChargeRecord[];
  declined: DeclinedPledgeCharge[];
  targetsProcessed: number;
}

/**
 * Cron entry point: find THRESHOLD_MET targets that still have card-backed
 * ACTIVE pledges either never called or stuck with a PENDING pledge-call
 * payment (crash recovery), and re-run maybeChargeCallablePledges — which
 * re-verifies the fully-funded-for-charging definition under the lock.
 */
export async function retryCallableCharges(
  limit = 10,
): Promise<RetryCallableChargesResult> {
  const targets = await prisma.taskFundingTarget.findMany({
    where: {
      deletedAt: null,
      pledges: {
        some: {
          deletedAt: null,
          OR: [
            { calledAt: null },
            {
              payment: {
                is: {
                  deletedAt: null,
                  status: TaskFundingPaymentStatus.PENDING,
                },
              },
            },
          ],
          status: TaskFundingPledgeStatus.ACTIVE,
          stripePaymentMethodId: { not: null },
        },
      },
      status: TaskFundingTargetStatus.THRESHOLD_MET,
      task: { deletedAt: null },
    },
    orderBy: [{ thresholdMetAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
    take: clampLimit(limit, 10),
  });

  const outcome: RetryCallableChargesResult = {
    charged: [],
    declined: [],
    targetsProcessed: 0,
  };

  for (const target of targets) {
    try {
      const result = await maybeChargeCallablePledges(target.id);
      outcome.targetsProcessed += 1;
      outcome.charged.push(...result.charged);
      outcome.declined.push(...result.declined);
    } catch (error) {
      log.error("Failed to charge callable pledges", {
        error,
        targetId: target.id,
      });
    }
  }

  return outcome;
}
