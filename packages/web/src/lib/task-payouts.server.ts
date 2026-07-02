import type Stripe from "stripe";
import {
  Prisma,
  StripeConnectedAccountStatus,
  StripeTransferCapabilityStatus,
  TaskCompensationCadence,
  TaskCompensationKind,
  TaskFundingPaymentStatus,
  TaskPayoutStatus,
  type PrismaClient,
} from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import {
  getStripeConnectStatus,
  isUserStripeTransferReady,
  syncStripeConnectedAccount,
} from "@/lib/stripe-connect.server";
import { getTaskFundingTransferGroup } from "@/lib/task-funding/payments.server";

const log = createLogger("task-payouts");
const DEFAULT_RETRY_DELAY_MS = 15 * 60 * 1000;

type PayoutDb = Pick<
  PrismaClient,
  | "stripeConnectedAccount"
  | "taskClaim"
  | "taskFundingPayment"
  | "taskPayout"
>;

export interface FixedTaskPayoutInput {
  compensationCadence: TaskCompensationCadence | null;
  compensationCurrency: string | null;
  compensationKind: TaskCompensationKind;
  compensationMaxAmountMinorUnits: bigint | null;
  compensationPaymentRails: string[];
}

export function canUseStripeForTaskCompensation(
  task: Pick<FixedTaskPayoutInput, "compensationKind" | "compensationPaymentRails">,
) {
  if (
    task.compensationKind !== TaskCompensationKind.PAID &&
    task.compensationKind !== TaskCompensationKind.BOUNTY
  ) {
    return false;
  }

  if (task.compensationPaymentRails.length === 0) {
    return true;
  }

  return task.compensationPaymentRails.some((rail) => {
    const normalized = rail.trim().toLowerCase();
    return normalized === "stripe" || normalized === "stripe_connect";
  });
}

export function getFixedTaskPayoutAmountCents(
  task: FixedTaskPayoutInput,
): number | null {
  if (!canUseStripeForTaskCompensation(task)) return null;
  if (
    task.compensationCadence != null &&
    task.compensationCadence !== TaskCompensationCadence.FIXED
  ) {
    return null;
  }

  const currency = task.compensationCurrency?.trim().toLowerCase() ?? "usd";
  if (currency !== "usd") return null;

  if (task.compensationMaxAmountMinorUnits == null) return null;
  const amount = Number(task.compensationMaxAmountMinorUnits);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  return amount;
}

export async function getAvailableTaskFundingCents(
  taskId: string,
  options: { excludePayoutId?: string | null } = {},
  db: Pick<PrismaClient, "taskFundingPayment" | "taskPayout"> = prisma,
) {
  const [funding, allocated] = await Promise.all([
    db.taskFundingPayment.aggregate({
      where: {
        deletedAt: null,
        status: TaskFundingPaymentStatus.PAID,
        taskId,
      },
      _sum: { amountCents: true },
    }),
    db.taskPayout.aggregate({
      where: {
        deletedAt: null,
        id: options.excludePayoutId ? { not: options.excludePayoutId } : undefined,
        status: {
          in: [
            TaskPayoutStatus.PENDING_CONNECT,
            TaskPayoutStatus.PENDING_FUNDS,
            TaskPayoutStatus.READY,
            TaskPayoutStatus.PROCESSING,
            TaskPayoutStatus.TRANSFERRED,
            TaskPayoutStatus.FAILED,
          ],
        },
        taskId,
      },
      _sum: { amountCents: true },
    }),
  ]);

  return (funding._sum.amountCents ?? 0) - (allocated._sum.amountCents ?? 0);
}

function isConnectedAccountTransferReady(
  account:
    | {
        deletedAt: Date | null;
        status: StripeConnectedAccountStatus;
        transfersCapabilityStatus: StripeTransferCapabilityStatus;
      }
    | null
    | undefined,
) {
  return Boolean(
    account &&
      !account.deletedAt &&
      account.status === StripeConnectedAccountStatus.ONBOARDING_COMPLETE &&
      account.transfersCapabilityStatus === StripeTransferCapabilityStatus.ACTIVE,
  );
}

export async function assertUserCanClaimPaidTask(
  task: FixedTaskPayoutInput,
  userId: string,
  db: Pick<PrismaClient, "stripeConnectedAccount"> = prisma,
) {
  if (!canUseStripeForTaskCompensation(task)) return;
  const payoutAmountCents = getFixedTaskPayoutAmountCents(task);
  if (payoutAmountCents == null) return;

  const ready = await isUserStripeTransferReady(userId, db);
  if (!ready) {
    throw new Error("Set up Stripe payouts before claiming paid tasks.");
  }
}

async function getPayoutReadiness(input: {
  amountCents: number;
  connectedAccount:
    | {
        deletedAt: Date | null;
        id: string;
        status: StripeConnectedAccountStatus;
        transfersCapabilityStatus: StripeTransferCapabilityStatus;
      }
    | null
    | undefined;
  excludePayoutId?: string | null;
  taskId: string;
}) {
  if (!isConnectedAccountTransferReady(input.connectedAccount)) {
    return {
      status: TaskPayoutStatus.PENDING_CONNECT,
      availableFundingCents: await getAvailableTaskFundingCents(input.taskId, {
        excludePayoutId: input.excludePayoutId,
      }),
    };
  }

  const availableFundingCents = await getAvailableTaskFundingCents(input.taskId, {
    excludePayoutId: input.excludePayoutId,
  });

  return {
    availableFundingCents,
    status:
      availableFundingCents >= input.amountCents
        ? TaskPayoutStatus.READY
        : TaskPayoutStatus.PENDING_FUNDS,
  };
}

function getStripeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Stripe transfer failed.";
}

function isInsufficientStripeBalance(error: unknown) {
  const stripeError = error as Partial<Stripe.errors.StripeError>;
  return (
    stripeError?.code === "balance_insufficient" ||
    /insufficient.*balance/i.test(getStripeErrorMessage(error))
  );
}

function nextRetryAt(delayMs = DEFAULT_RETRY_DELAY_MS) {
  return new Date(Date.now() + delayMs);
}

export async function executeTaskPayout(
  payoutId: string,
  db: PayoutDb = prisma,
) {
  const payout = await db.taskPayout.findFirst({
    where: {
      deletedAt: null,
      id: payoutId,
    },
    include: {
      stripeConnectedAccount: true,
    },
  });
  if (!payout) {
    throw new Error("Task payout not found.");
  }

  if (
    payout.status === TaskPayoutStatus.TRANSFERRED ||
    payout.status === TaskPayoutStatus.CANCELED
  ) {
    return payout;
  }

  if (!payout.stripeConnectedAccount) {
    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        nextAttemptAt: nextRetryAt(),
        status: TaskPayoutStatus.PENDING_CONNECT,
      },
    });
  }

  if (!isConnectedAccountTransferReady(payout.stripeConnectedAccount)) {
    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        nextAttemptAt: nextRetryAt(),
        status: TaskPayoutStatus.PENDING_CONNECT,
      },
    });
  }

  const availableFundingCents = await getAvailableTaskFundingCents(
    payout.taskId,
    { excludePayoutId: payout.id },
    db,
  );
  if (availableFundingCents < payout.amountCents) {
    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        lastError: null,
        nextAttemptAt: nextRetryAt(),
        status: TaskPayoutStatus.PENDING_FUNDS,
      },
    });
  }

  if (!isStripeConfigured()) {
    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        failedAt: new Date(),
        lastError: "Stripe is not configured.",
        nextAttemptAt: nextRetryAt(),
        status: TaskPayoutStatus.FAILED,
      },
    });
  }

  const transferGroup =
    payout.stripeTransferGroup ?? getTaskFundingTransferGroup(payout.taskId);
  await db.taskPayout.update({
    where: { id: payout.id },
    data: {
      attemptCount: { increment: 1 },
      lastError: null,
      processingAt: new Date(),
      status: TaskPayoutStatus.PROCESSING,
      stripeTransferGroup: transferGroup,
    },
  });

  try {
    const transfer = await getStripeClient().transfers.create(
      {
        amount: payout.amountCents,
        currency: payout.currency,
        destination: payout.stripeConnectedAccount.stripeAccountId,
        metadata: {
          task_claim_id: payout.taskClaimId ?? "",
          task_id: payout.taskId,
          task_payout_id: payout.id,
        },
        transfer_group: transferGroup,
      },
      {
        idempotencyKey: `task-payout:${payout.id}:transfer:v1`,
      },
    );

    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        failedAt: null,
        lastError: null,
        nextAttemptAt: null,
        status: TaskPayoutStatus.TRANSFERRED,
        stripeTransferId: transfer.id,
        transferredAt: new Date(),
      },
    });
  } catch (error) {
    const message = getStripeErrorMessage(error);
    const status = isInsufficientStripeBalance(error)
      ? TaskPayoutStatus.PENDING_FUNDS
      : TaskPayoutStatus.FAILED;

    log.error("Task payout transfer failed", {
      error,
      payoutId: payout.id,
      status,
    });

    return db.taskPayout.update({
      where: { id: payout.id },
      data: {
        failedAt: new Date(),
        lastError: message,
        nextAttemptAt: nextRetryAt(),
        status,
      },
    });
  }
}

export async function queueTaskPayoutForVerifiedClaim(input: {
  approvedByUserId?: string | null;
  claimId: string;
  taskId: string;
}) {
  const claim = await prisma.taskClaim.findFirst({
    where: {
      deletedAt: null,
      id: input.claimId,
      taskId: input.taskId,
    },
    select: {
      id: true,
      status: true,
      taskId: true,
      user: {
        select: {
          id: true,
          personId: true,
        },
      },
      task: {
        select: {
          compensationCadence: true,
          compensationCurrency: true,
          compensationKind: true,
          compensationMaxAmountMinorUnits: true,
          compensationPaymentRails: true,
          id: true,
        },
      },
    },
  });
  if (!claim) {
    throw new Error("Task claim not found.");
  }

  const amountCents = getFixedTaskPayoutAmountCents(claim.task);
  if (amountCents == null) {
    return null;
  }

  const connectedAccount = await prisma.stripeConnectedAccount.findUnique({
    where: { userId: claim.user.id },
    select: {
      deletedAt: true,
      id: true,
      status: true,
      transfersCapabilityStatus: true,
    },
  });
  const existing = await prisma.taskPayout.findUnique({
    where: { taskClaimId: claim.id },
    select: { id: true },
  });
  const readiness = await getPayoutReadiness({
    amountCents,
    connectedAccount,
    excludePayoutId: existing?.id,
    taskId: claim.taskId,
  });
  const transferGroup = getTaskFundingTransferGroup(claim.taskId);
  const queuedAt = new Date();

  const payout = await prisma.taskPayout.upsert({
    where: { taskClaimId: claim.id },
    create: {
      amountCents,
      approvedAt: queuedAt,
      approvedByUserId: input.approvedByUserId ?? null,
      currency: "usd",
      metadata: {
        availableFundingCents: readiness.availableFundingCents,
        queuedBy: "claim-verification",
      } satisfies Prisma.InputJsonValue,
      nextAttemptAt:
        readiness.status === TaskPayoutStatus.READY ? null : nextRetryAt(),
      payeePersonId: claim.user.personId,
      payeeUserId: claim.user.id,
      queuedAt,
      status: readiness.status,
      stripeConnectedAccountId: connectedAccount?.id ?? null,
      stripeTransferGroup: transferGroup,
      taskClaimId: claim.id,
      taskId: claim.taskId,
    },
    update: {
      amountCents,
      approvedAt: queuedAt,
      approvedByUserId: input.approvedByUserId ?? null,
      lastError: null,
      metadata: {
        availableFundingCents: readiness.availableFundingCents,
        queuedBy: "claim-verification",
      } satisfies Prisma.InputJsonValue,
      nextAttemptAt:
        readiness.status === TaskPayoutStatus.READY ? null : nextRetryAt(),
      payeePersonId: claim.user.personId,
      payeeUserId: claim.user.id,
      queuedAt,
      status: readiness.status,
      stripeConnectedAccountId: connectedAccount?.id ?? null,
      stripeTransferGroup: transferGroup,
      taskId: claim.taskId,
    },
  });

  if (payout.status === TaskPayoutStatus.READY) {
    return executeTaskPayout(payout.id);
  }

  return payout;
}

async function reconcileQueuedPayoutReadiness(payoutId: string) {
  const payout = await prisma.taskPayout.findFirst({
    where: {
      deletedAt: null,
      id: payoutId,
    },
    include: {
      stripeConnectedAccount: true,
    },
  });
  if (!payout) return null;
  if (
    payout.status === TaskPayoutStatus.TRANSFERRED ||
    payout.status === TaskPayoutStatus.CANCELED
  ) {
    return payout;
  }

  let connectedAccount = payout.stripeConnectedAccount;
  if (!connectedAccount) {
    connectedAccount = await prisma.stripeConnectedAccount.findUnique({
      where: { userId: payout.payeeUserId },
    });
  }

  if (connectedAccount) {
    const status = await getStripeConnectStatus(payout.payeeUserId, {
      sync: true,
    });
    if (status.connectedAccountId) {
      connectedAccount = await prisma.stripeConnectedAccount.findUnique({
        where: { id: status.connectedAccountId },
      });
    }
  }

  const readiness = await getPayoutReadiness({
    amountCents: payout.amountCents,
    connectedAccount,
    excludePayoutId: payout.id,
    taskId: payout.taskId,
  });

  return prisma.taskPayout.update({
    where: { id: payout.id },
    data: {
      lastError:
        readiness.status === TaskPayoutStatus.READY ? null : payout.lastError,
      nextAttemptAt:
        readiness.status === TaskPayoutStatus.READY ? null : nextRetryAt(),
      status: readiness.status,
      stripeConnectedAccountId: connectedAccount?.id ?? null,
    },
  });
}

export async function retryDueTaskPayouts(input: { limit?: number } = {}) {
  const now = new Date();
  const payouts = await prisma.taskPayout.findMany({
    where: {
      deletedAt: null,
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      status: {
        in: [
          TaskPayoutStatus.PENDING_CONNECT,
          TaskPayoutStatus.PENDING_FUNDS,
          TaskPayoutStatus.READY,
          TaskPayoutStatus.FAILED,
        ],
      },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
    take: Math.max(1, Math.min(100, Math.trunc(input.limit ?? 25))),
  });

  const results = {
    attempted: 0,
    failed: 0,
    queued: payouts.length,
    transferred: 0,
  };

  for (const payout of payouts) {
    try {
      const reconciled = await reconcileQueuedPayoutReadiness(payout.id);
      if (!reconciled) continue;
      if (reconciled.status !== TaskPayoutStatus.READY) continue;
      results.attempted += 1;
      const executed = await executeTaskPayout(reconciled.id);
      if (executed.status === TaskPayoutStatus.TRANSFERRED) {
        results.transferred += 1;
      } else if (executed.status === TaskPayoutStatus.FAILED) {
        results.failed += 1;
      }
    } catch (error) {
      results.failed += 1;
      log.error("Failed to retry task payout", {
        error,
        payoutId: payout.id,
      });
    }
  }

  return results;
}

export async function syncTaskPayoutConnectedAccount(userId: string) {
  const account = await prisma.stripeConnectedAccount.findUnique({
    where: { userId },
    select: { stripeAccountId: true },
  });
  if (!account) return null;
  return syncStripeConnectedAccount(account.stripeAccountId);
}
