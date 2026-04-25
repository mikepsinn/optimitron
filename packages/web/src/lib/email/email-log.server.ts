import { EmailLogStatus, Prisma } from "@optimitron/db";
import type { PrismaClient } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export type EmailLogDeliveryStatus = (typeof EmailLogStatus)[keyof typeof EmailLogStatus];

type EmailLogClient = Pick<PrismaClient, "emailLog">;

export interface CreateEmailLogInput {
  bodyTemplateId?: string | null;
  dedupeKey?: string | null;
  id: string;
  now: Date;
  sendContext?: Prisma.InputJsonValue;
  subject: string;
  subjectTemplate?: string | null;
  subjectVariantId?: string | null;
  templateId?: string | null;
  toAddress: string;
  userId?: string | null;
}

export function isEmailLogDuplicateError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createEmailLog(client: EmailLogClient, input: CreateEmailLogInput) {
  return client.emailLog.create({
    data: {
      id: input.id,
      bodyTemplateId: input.bodyTemplateId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      sendContext: input.sendContext,
      sentAt: input.now,
      status: EmailLogStatus.QUEUED,
      subject: input.subject,
      subjectTemplate: input.subjectTemplate ?? null,
      subjectVariantId: input.subjectVariantId ?? null,
      templateId: input.templateId ?? null,
      toAddress: input.toAddress,
      userId: input.userId ?? null,
    },
  });
}

export async function claimEmailLog(input: CreateEmailLogInput) {
  try {
    await createEmailLog(prisma, input);
    return { duplicate: false as const, emailLogId: input.id };
  } catch (error) {
    if (isEmailLogDuplicateError(error)) {
      return { duplicate: true as const, emailLogId: null };
    }
    throw error;
  }
}

export async function markEmailLogStatus(input: {
  emailLogId: string;
  errorMessage?: string | null;
  providerMessageId?: string | null;
  status: EmailLogDeliveryStatus;
}) {
  await prisma.emailLog.update({
    where: { id: input.emailLogId },
    data: {
      errorMessage: input.errorMessage ?? null,
      status: input.status,
      ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    },
  });
}

export async function markQueuedEmailLogsFailed(input: {
  errorMessage: string;
  templateId: string;
  userId?: string | null;
}) {
  await prisma.emailLog.updateMany({
    where: {
      status: EmailLogStatus.QUEUED,
      templateId: input.templateId,
      userId: input.userId ?? null,
    },
    data: {
      errorMessage: input.errorMessage,
      status: EmailLogStatus.FAILED,
    },
  });
}
