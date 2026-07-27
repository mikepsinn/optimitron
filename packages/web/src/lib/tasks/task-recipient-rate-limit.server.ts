import {
  EmailLogStatus,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { Prisma } from "@optimitron/db";
import type { PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export const RECIPIENT_DAILY_CAP = 1;
export const RECIPIENT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RECIPIENT_MONTHLY_CAP = 5;
export const RECIPIENT_MONTHLY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type RecipientRateLimitDb = Pick<PrismaClient, "taskCommunication">;

function normalizeRecipientEmail(recipientEmail: string) {
  return recipientEmail.trim().toLowerCase();
}

function recipientAttemptWhere(input: {
  cutoff: Date;
  excludeCommunicationId?: string;
  recipientEmail: string;
}): Prisma.TaskCommunicationWhereInput {
  return {
    deletedAt: null,
    ...(input.excludeCommunicationId
      ? { id: { not: input.excludeCommunicationId } }
      : {}),
    recipientEmail: {
      equals: normalizeRecipientEmail(input.recipientEmail),
      mode: "insensitive",
    },
    OR: [
      {
        sentAt: { gte: input.cutoff },
        status: TaskCommunicationStatus.SENT,
      },
      {
        emailLog: {
          is: {
            sentAt: { gte: input.cutoff },
            status: { not: EmailLogStatus.FAILED },
          },
        },
        status: TaskCommunicationStatus.DRAFT,
      },
    ],
  };
}

async function recipientWithinRateLimitsUsing(
  db: RecipientRateLimitDb,
  recipientEmail: string,
  now: Date,
  options?: { excludeCommunicationId?: string },
) {
  const dailyCutoff = new Date(now.getTime() - RECIPIENT_DAILY_WINDOW_MS);
  const dailyCount = await db.taskCommunication.count({
    where: recipientAttemptWhere({
      cutoff: dailyCutoff,
      excludeCommunicationId: options?.excludeCommunicationId,
      recipientEmail,
    }),
  });
  if (dailyCount >= RECIPIENT_DAILY_CAP) {
    return false;
  }

  const monthlyCutoff = new Date(now.getTime() - RECIPIENT_MONTHLY_WINDOW_MS);
  const monthlyCount = await db.taskCommunication.count({
    where: recipientAttemptWhere({
      cutoff: monthlyCutoff,
      excludeCommunicationId: options?.excludeCommunicationId,
      recipientEmail,
    }),
  });
  return monthlyCount < RECIPIENT_MONTHLY_CAP;
}

/**
 * Caps email sends to the same normalized address across all tasks. QUEUED
 * EmailLogs linked to drafts are in-flight reservations and count alongside
 * SENT communications until their rolling window expires.
 */
export async function recipientWithinRateLimits(
  recipientEmail: string,
  now: Date,
  options?: { excludeCommunicationId?: string },
): Promise<boolean> {
  return recipientWithinRateLimitsUsing(prisma, recipientEmail, now, options);
}

export type RecipientRateLimitReservationResult =
  | { status: "reserved" }
  | { status: "rate_limited" }
  | { status: "already_processed" }
  | { status: "conflict" };

/**
 * Atomically reserves one recipient quota slot before provider dispatch.
 *
 * The per-email advisory lock serializes the count + reservation write. The
 * reservation is the same QUEUED EmailLog that sendDraftTaskNotification will
 * claim, so the transaction commits before the provider network call and an
 * idempotent retry reuses the same slot and provider idempotency key.
 */
export async function reserveRecipientRateLimitSlot(input: {
  communicationId: string;
  emailLogId: string;
  now: Date;
  recipientEmail: string;
  recipientUserId: string | null;
  subject: string;
  taskId: string;
}): Promise<RecipientRateLimitReservationResult> {
  const recipientEmail = normalizeRecipientEmail(input.recipientEmail);
  if (!recipientEmail) return { status: "conflict" };

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('task-recipient-rate-limit'), hashtext(${recipientEmail}))`;

      const communication = await tx.taskCommunication.findFirst({
        where: {
          deletedAt: null,
          id: input.communicationId,
          taskId: input.taskId,
        },
        select: {
          emailLogId: true,
          id: true,
          purpose: true,
          recipientEmail: true,
          status: true,
          step: true,
          taskId: true,
          templateId: true,
        },
      });
      if (!communication) return { status: "conflict" };
      if (communication.status !== TaskCommunicationStatus.DRAFT) {
        return { status: "already_processed" };
      }
      if (
        normalizeRecipientEmail(communication.recipientEmail ?? "") !==
        recipientEmail
      ) {
        return { status: "conflict" };
      }
      if (
        communication.emailLogId &&
        communication.emailLogId !== input.emailLogId
      ) {
        return { status: "conflict" };
      }

      const existingEmailLog = await tx.emailLog.findUnique({
        where: { id: input.emailLogId },
        select: { id: true, toAddress: true },
      });
      if (
        existingEmailLog &&
        normalizeRecipientEmail(existingEmailLog.toAddress) !== recipientEmail
      ) {
        return { status: "conflict" };
      }

      // Recheck the live cap on every attempt, including a retry that already
      // owns a deterministic EmailLog. Excluding only this communication lets
      // it reuse its slot without bypassing sends that happened while held.
      if (
        !(await recipientWithinRateLimitsUsing(tx, recipientEmail, input.now, {
          excludeCommunicationId: communication.id,
        }))
      ) {
        return { status: "rate_limited" };
      }

      if (!existingEmailLog) {
        const templateId =
          communication.templateId ??
          `task_notification:${communication.purpose.toLowerCase()}:step_${communication.step}`;

        await tx.emailLog.create({
          data: {
            // EmailLog also has @@unique([userId, templateId]). Suffixing both
            // identities prevents an earlier invitation to the same signed-in
            // reviewer from colliding with this communication's reservation.
            dedupeKey: `task-notification:${communication.id}`,
            id: input.emailLogId,
            sendContext: {
              communicationId: communication.id,
              purpose: communication.purpose,
              step: communication.step,
              taskId: communication.taskId,
            } satisfies Prisma.InputJsonObject,
            sentAt: input.now,
            status: EmailLogStatus.QUEUED,
            subject: input.subject,
            templateId: `${templateId}:communication_${communication.id}`,
            toAddress: recipientEmail,
            userId: input.recipientUserId,
          },
        });
      }

      if (!communication.emailLogId) {
        const linked = await tx.taskCommunication.updateMany({
          where: {
            emailLogId: null,
            id: communication.id,
            status: TaskCommunicationStatus.DRAFT,
          },
          data: { emailLogId: input.emailLogId },
        });
        if (linked.count !== 1) {
          throw new Error("Recipient rate-limit reservation lost its draft");
        }
      }

      return { status: "reserved" };
    });
  } catch (error) {
    // A uniqueness conflict is fail-closed and terminal for this approval. It
    // must not bubble past the dispatcher and leave APPROVED/DRAFT wedged.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "conflict" };
    }
    throw error;
  }
}

/** Release a known-not-sent reservation while retaining its audit link. */
export async function releaseRecipientRateLimitSlot(input: {
  communicationId: string;
  emailLogId: string;
  reason: string;
}) {
  await prisma.emailLog.updateMany({
    where: {
      id: input.emailLogId,
      status: EmailLogStatus.QUEUED,
      taskCommunications: {
        some: {
          id: input.communicationId,
          status: { not: TaskCommunicationStatus.SENT },
        },
      },
    },
    data: {
      errorMessage: `send_aborted:${input.reason}`,
      status: EmailLogStatus.FAILED,
    },
  });
}
