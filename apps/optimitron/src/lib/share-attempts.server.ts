import type { Prisma, ShareSource } from "@optimitron/db";
import { sha256Hex } from "@/lib/crypto.server";

export interface RecordShareAttemptInput {
  id: string;
  userId: string;
  source: ShareSource;
  surface: string;
  channel: string;
  taskId: string | null;
  templateId: string;
  templateBody: string;
  renderedMessage: string;
  wasEdited: boolean;
  context: Prisma.InputJsonObject;
}

export async function recordShareAttempt(
  tx: Prisma.TransactionClient,
  input: RecordShareAttemptInput,
): Promise<void> {
  await tx.shareAttempt.create({
    data: {
      id: input.id,
      userId: input.userId,
      source: input.source,
      surface: input.surface,
      channel: input.channel,
      taskId: input.taskId,
      templateId: input.templateId,
      templateHash: sha256Hex(input.templateBody),
      templateBody: input.templateBody,
      renderedMessage: input.renderedMessage,
      renderedHash: sha256Hex(input.renderedMessage),
      wasEdited: input.wasEdited,
      context: input.context,
    },
  });
}
