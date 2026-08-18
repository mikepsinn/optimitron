import { serverEnv } from "@/lib/env";
import webPush from "web-push";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("push-sender");

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = serverEnv.VAPID_PUBLIC_KEY;
  const privateKey = serverEnv.VAPID_PRIVATE_KEY;
  const subject = serverEnv.VAPID_SUBJECT ?? "mailto:mike@warondisease.org";

  if (!publicKey || !privateKey) {
    logger.warn("VAPID keys not configured — push notifications disabled");
    return false;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendPushNotification(
  subscriptionId: string,
  payload: PushNotificationPayload,
): Promise<boolean> {
  if (!ensureVapidConfigured()) return false;

  const subscription = await prisma.webPushSubscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription || subscription.expired) return false;

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );

    await prisma.webPushSubscription.update({
      where: { id: subscriptionId },
      data: { lastSentAt: new Date() },
    });

    return true;
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    if (statusCode === 410 || statusCode === 404) {
      logger.info(`Subscription ${subscriptionId} expired (${statusCode}), marking as expired`);
      await prisma.webPushSubscription.update({
        where: { id: subscriptionId },
        data: { expired: true },
      });
    } else {
      logger.error(`Failed to send push to ${subscriptionId}:`, error);
    }

    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
): Promise<number> {
  const subscriptions = await prisma.webPushSubscription.findMany({
    where: { userId, expired: false },
    select: { id: true },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    const success = await sendPushNotification(sub.id, payload);
    if (success) sent++;
  }

  return sent;
}
