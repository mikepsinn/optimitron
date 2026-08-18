import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-sender.server";
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";

const logger = createLogger("push-cron");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = parseInt(serverEnv.PUSH_BATCH_SIZE ?? "50", 10);

function isWithinActiveHours(
  reminderStartTime: string,
  quietHoursStart: string,
  timeZone: string | null,
): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone ?? "UTC",
  });
  const currentTime = formatter.format(now);

  // Simple string comparison for HH:MM format
  if (reminderStartTime <= quietHoursStart) {
    return currentTime >= reminderStartTime && currentTime < quietHoursStart;
  }
  // Wrap-around (e.g., start=21:00, quiet=09:00)
  return currentTime >= reminderStartTime || currentTime < quietHoursStart;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find users who:
    // 1. Have push enabled
    // 2. Haven't been sent a push recently (respecting their frequency)
    // 3. Haven't checked in today
    const preferences = await prisma.userPreference.findMany({
      where: {
        pushEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            timeZone: true,
            webPushSubscriptions: {
              where: { expired: false },
              select: { id: true },
              take: 5,
            },
          },
        },
      },
      take: BATCH_SIZE,
    });

    let sent = 0;
    let skipped = 0;

    for (const pref of preferences) {
      // Skip if no active subscriptions
      if (pref.user.webPushSubscriptions.length === 0) {
        skipped++;
        continue;
      }

      // Skip if last push was too recent
      if (pref.lastPushSentAt) {
        const minutesSinceLastPush = (now.getTime() - pref.lastPushSentAt.getTime()) / 60000;
        if (minutesSinceLastPush < pref.reminderFrequencyMinutes) {
          skipped++;
          continue;
        }
      }

      // Skip if already checked in today
      if (pref.lastCheckInAt) {
        const today = now.toISOString().slice(0, 10);
        const lastCheckIn = pref.lastCheckInAt.toISOString().slice(0, 10);
        if (lastCheckIn === today) {
          skipped++;
          continue;
        }
      }

      // Skip if outside active hours
      if (!isWithinActiveHours(pref.reminderStartTime, pref.quietHoursStart, pref.user.timeZone)) {
        skipped++;
        continue;
      }

      // Send to all active subscriptions for this user
      for (const sub of pref.user.webPushSubscriptions) {
        const success = await sendPushNotification(sub.id, {
          title: "How are you feeling?",
          body: "Take a moment to rate your health and happiness today.",
          tag: "daily-checkin",
          url: ROUTES.census,
          actions: [
            { action: "rate", title: "Rate Now" },
            { action: "chat", title: "Open Chat" },
          ],
        });
        if (success) sent++;
      }

      // Update last push sent
      await prisma.userPreference.update({
        where: { id: pref.id },
        data: { lastPushSentAt: now },
      });
    }

    logger.info(`Push cron: sent=${sent}, skipped=${skipped}`);
    return NextResponse.json({ sent, skipped });
  } catch (error) {
    logger.error("Push cron error:", error);
    return NextResponse.json({ error: "Failed to process push notifications." }, { status: 500 });
  }
}
