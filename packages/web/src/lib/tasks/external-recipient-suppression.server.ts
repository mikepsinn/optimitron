import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export type ExternalRecipientSuppressionReason =
  | "complaint"
  | "external_opt_out"
  | "hard_bounce"
  | "provider_suppressed";

const SUPPRESSION_METADATA_KEY = "externalRecipientSuppression";

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function asMetadataObject(value: unknown): Prisma.InputJsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Prisma.InputJsonObject;
}

function storedSuppressionReason(
  metadata: unknown,
): ExternalRecipientSuppressionReason | null {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const record = metadata as Record<string, unknown>;
  if (record.optOut === true) return "external_opt_out";
  const suppression = record[SUPPRESSION_METADATA_KEY];
  if (
    suppression === null ||
    typeof suppression !== "object" ||
    Array.isArray(suppression)
  ) {
    return null;
  }
  const reason = (suppression as Record<string, unknown>).reason;
  return reason === "complaint" ||
    reason === "hard_bounce" ||
    reason === "provider_suppressed"
    ? reason
    : null;
}

/**
 * Person-only recipients have no User preference row. Their durable stop state
 * lives on the communication ledger and is matched by Person id or normalized
 * address on every future task email.
 */
export async function findExternalRecipientSuppression(input: {
  recipientEmail: string;
  recipientPersonId?: string | null;
}): Promise<{
  communicationId: string;
  reason: ExternalRecipientSuppressionReason;
} | null> {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  if (!recipientEmail && !input.recipientPersonId) return null;

  const identityWhere: Prisma.TaskCommunicationWhereInput[] = [];
  if (recipientEmail) identityWhere.push({ recipientEmail });
  if (input.recipientPersonId) {
    identityWhere.push({ recipientPersonId: input.recipientPersonId });
  }

  const communication = await prisma.taskCommunication.findFirst({
    where: {
      AND: [
        { OR: identityWhere },
        {
          OR: [
            { metadataJson: { path: ["optOut"], equals: true } },
            {
              metadataJson: {
                path: [SUPPRESSION_METADATA_KEY, "active"],
                equals: true,
              },
            },
            { errorMessage: { contains: "unsubscribed", mode: "insensitive" } },
          ],
        },
      ],
      deletedAt: null,
    },
    orderBy: [{ cancelledAt: "desc" }, { updatedAt: "desc" }],
    select: { errorMessage: true, id: true, metadataJson: true },
  });
  if (!communication) return null;

  return {
    communicationId: communication.id,
    reason:
      storedSuppressionReason(communication.metadataJson) ?? "external_opt_out",
  };
}

/** Persist a provider stop signal even when EmailLog.userId is null. */
export async function persistExternalRecipientSuppressionForEmailLog(input: {
  emailLogId: string;
  now?: Date;
  reason: Exclude<ExternalRecipientSuppressionReason, "external_opt_out">;
}): Promise<number> {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const communications = await tx.taskCommunication.findMany({
      where: {
        deletedAt: null,
        emailLogId: input.emailLogId,
        OR: [
          { recipientPersonId: { not: null } },
          { recipientEmail: { not: null } },
        ],
      },
      select: { id: true, metadataJson: true },
    });

    for (const communication of communications) {
      await tx.taskCommunication.update({
        where: { id: communication.id },
        data: {
          metadataJson: {
            ...asMetadataObject(communication.metadataJson),
            [SUPPRESSION_METADATA_KEY]: {
              active: true,
              reason: input.reason,
              recordedAt: now.toISOString(),
              scope: "all",
            },
          } satisfies Prisma.InputJsonObject,
        },
      });
    }

    return communications.length;
  });
}
