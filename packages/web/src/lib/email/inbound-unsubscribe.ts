import { DEFAULT_UNSUBSCRIBE_EMAIL, parseEmailFromHeader } from "@/lib/email/from-address";
import type { InboundEmailEvent } from "@/lib/email/inbound-reply";
import { parseReplyAddress } from "@/lib/email/task-notification";
import { applyUnsubscribe } from "@/lib/email/suppression.server";
import { prisma } from "@/lib/prisma";
import { unsubscribeTaskCommunicationByReply } from "@/lib/tasks/task-notifications.server";

export type InboundUnsubscribeResult =
  | { handled: false; status: "not_unsubscribe" }
  | {
      handled: true;
      reason?: string;
      scope?: "all" | "task_notifications";
      status: "skipped" | "unsubscribed";
      taskCommunicationId?: string;
      userId?: string;
    };

const unsubscribeCommands = new Set([
  "cancel",
  "opt out",
  "opt-out",
  "remove me",
  "stop",
  "stop sending",
  "unsub",
  "unsubscribe",
]);

function extractEmailAddress(raw: string) {
  const parsed = parseEmailFromHeader(raw);
  if (parsed) return parsed.address.toLowerCase();
  const trimmed = raw.trim().toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed) ? trimmed : null;
}

function normalizeCommand(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function firstNonEmptyLine(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
}

function hasExplicitUnsubscribeCommand(event: InboundEmailEvent) {
  return [event.subject, firstNonEmptyLine(event.text)]
    .map(normalizeCommand)
    .some((candidate) => unsubscribeCommands.has(candidate));
}

function isDefaultUnsubscribeAddress(raw: string) {
  return extractEmailAddress(raw) === DEFAULT_UNSUBSCRIBE_EMAIL;
}

export async function processInboundUnsubscribe(
  event: InboundEmailEvent,
): Promise<InboundUnsubscribeResult> {
  const toUnsubscribeAddress = isDefaultUnsubscribeAddress(event.to);
  const replyAddress = parseReplyAddress(event.to);
  const explicitCommand = hasExplicitUnsubscribeCommand(event);

  if (!toUnsubscribeAddress && !(replyAddress && explicitCommand)) {
    return { handled: false, status: "not_unsubscribe" };
  }

  const senderEmail = extractEmailAddress(event.from);
  if (!senderEmail) {
    return {
      handled: true,
      reason: "missing_sender_email",
      status: "skipped",
    };
  }

  const scope = replyAddress ? "task_notifications" : "all";
  const user = await prisma.user.findUnique({
    where: { email: senderEmail },
    select: { id: true },
  });

  if (user) {
    await applyUnsubscribe({
      userId: user.id,
      scope,
      via: "reply",
    });
    return {
      handled: true,
      scope,
      status: "unsubscribed",
      userId: user.id,
    };
  }

  const taskOptOut = await unsubscribeTaskCommunicationByReply({
    inReplyTo: event.inReplyTo,
    recipientEmail: senderEmail,
    taskId: replyAddress?.taskId ?? null,
  });

  if (taskOptOut.status === "unsubscribed") {
    return {
      handled: true,
      scope: "task_notifications",
      status: "unsubscribed",
      taskCommunicationId: taskOptOut.taskCommunicationId,
    };
  }

  return {
    handled: true,
    reason: taskOptOut.reason,
    status: "skipped",
  };
}
