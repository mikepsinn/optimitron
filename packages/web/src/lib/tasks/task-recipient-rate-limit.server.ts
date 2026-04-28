import { TaskCommunicationStatus } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export const RECIPIENT_DAILY_CAP = 1;
export const RECIPIENT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RECIPIENT_MONTHLY_CAP = 5;
export const RECIPIENT_MONTHLY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Caps email sends to the same address across all tasks. Even if 100 users invite
 * the same person, the recipient gets at most 1 email per 24h and 5 per 30d.
 */
export async function recipientWithinRateLimits(
  recipientEmail: string,
  now: Date,
): Promise<boolean> {
  const dailyCutoff = new Date(now.getTime() - RECIPIENT_DAILY_WINDOW_MS);
  const dailyCount = await prisma.taskCommunication.count({
    where: {
      deletedAt: null,
      recipientEmail,
      sentAt: { gte: dailyCutoff },
      status: TaskCommunicationStatus.SENT,
    },
  });
  if (dailyCount >= RECIPIENT_DAILY_CAP) {
    return false;
  }

  const monthlyCutoff = new Date(now.getTime() - RECIPIENT_MONTHLY_WINDOW_MS);
  const monthlyCount = await prisma.taskCommunication.count({
    where: {
      deletedAt: null,
      recipientEmail,
      sentAt: { gte: monthlyCutoff },
      status: TaskCommunicationStatus.SENT,
    },
  });
  return monthlyCount < RECIPIENT_MONTHLY_CAP;
}
