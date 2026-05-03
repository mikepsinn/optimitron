/**
 * Inbound email reply → TaskComment processor.
 *
 * Wired by `/api/webhooks/resend-inbound` (or equivalent route). Decodes the
 * `reply+{taskId}@reply.warondisease.org` address back to a taskId, strips
 * quoted prior messages from the body, authenticates the sender by matching
 * email to a known Person/Organization on the task, and creates a
 * TaskComment + TaskCommunication record.
 *
 * Idempotent on `providerMessageId` — safe for webhook retries.
 *
 * The notify-task-owner step at the end fires a follow-up email to the task
 * owner so they see new replies without polling the dashboard.
 */
import {
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { sendTaskNotificationEmail } from "@/lib/email/task-notification";
import { parseReplyAddress } from "@/lib/email/task-notification";

export interface InboundEmailEvent {
  /// Sender as the provider parsed it. May be `Display Name <addr@host>`.
  from: string;
  /// Recipient — should match `reply+{taskId}@reply.warondisease.org`.
  to: string;
  subject: string;
  /// Plain-text body (preferred). Quoted prior messages are stripped here.
  text: string;
  /// Optional HTML body (currently ignored — first version stores text only).
  html?: string | null;
  /// Provider's unique ID for the inbound message; used for idempotency.
  providerMessageId: string;
  /// Optional: the Message-ID of the email being replied to (RFC-5322).
  inReplyTo?: string | null;
}

export interface ProcessInboundReplyResult {
  status: "created" | "skipped";
  reason?: string;
  taskCommentId?: string;
  taskCommunicationId?: string;
}

/**
 * Strip quoted prior messages and email-client signature noise from the
 * body. Lightweight regex-based heuristics that cover Gmail, Apple Mail,
 * Outlook desktop, and most mobile clients.
 *
 * Drops, in order:
 *   - Lines starting with `>` (standard quote marker)
 *   - Gmail/Apple Mail "On <date>, <name> wrote:" header (and everything below)
 *   - Outlook "-----Original Message-----" divider (and below)
 *   - Outlook "From: ... Sent: ... To: ..." header block (and below)
 *   - `--` signature delimiter (and below)
 *   - Trailing whitespace
 *
 * Not perfect — non-English clients and edge-case formats may leak some
 * quoted text. Acceptable for v1; swap for `email-reply-parser` if needed.
 */
export function stripQuotedReply(body: string): string {
  if (!body) return "";

  let text = body.replace(/\r\n/g, "\n");

  const cutPatterns = [
    /\n[\s>]*On .+ wrote:\s*\n/i,
    /\n-----\s*Original Message\s*-----/i,
    /\nFrom:\s.+\nSent:\s.+\nTo:\s/i,
    /\n--\s*\n/,
  ];
  for (const re of cutPatterns) {
    const m = re.exec(text);
    if (m && typeof m.index === "number") {
      text = text.slice(0, m.index);
    }
  }

  const lines = text.split("\n").filter((line) => !line.trimStart().startsWith(">"));
  return lines.join("\n").trimEnd();
}

/** Extract `addr@host` from `Display Name <addr@host>` or a bare address. */
function extractEmailAddress(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  if (angle?.[1]) return angle[1].trim().toLowerCase();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return null;
}

/** Extract `Display Name` from `Display Name <addr@host>`, or null. */
function extractDisplayName(raw: string): string | null {
  if (!raw) return null;
  const angle = raw.trim().match(/^([^<]+?)\s*</);
  return angle?.[1]?.trim() || null;
}

export async function processInboundReply(
  event: InboundEmailEvent,
  db: typeof prisma = prisma,
): Promise<ProcessInboundReplyResult> {
  const parsed = parseReplyAddress(event.to);
  if (!parsed) {
    return { status: "skipped", reason: "to-address did not match reply pattern" };
  }
  const taskId = parsed.taskId;

  // Idempotency: bail if we've already recorded this provider message.
  const existing = await db.taskCommunication.findFirst({
    where: { providerMessageId: event.providerMessageId, deletedAt: null },
    select: { id: true, taskCommentId: true },
  });
  if (existing) {
    return {
      status: "skipped",
      reason: "duplicate providerMessageId",
      taskCommentId: existing.taskCommentId ?? undefined,
      taskCommunicationId: existing.id,
    };
  }

  // Verify task exists. Pull assignees so we can match the sender.
  const task = await db.task.findUnique({
    where: { id: taskId, deletedAt: null },
    select: {
      id: true,
      title: true,
      ownerUserId: true,
      assigneePersonId: true,
      assigneeOrganizationId: true,
      assigneePerson: { select: { id: true, email: true } },
      assigneeOrganization: { select: { id: true, contactEmail: true } },
    },
  });
  if (!task) {
    return { status: "skipped", reason: "task not found" };
  }

  // Authenticate sender by email match.
  const senderEmail = extractEmailAddress(event.from);
  const senderDisplayName = extractDisplayName(event.from);
  let authorPersonId: string | null = null;
  let authorOrganizationId: string | null = null;
  let authorNameSnapshot: string | null = null;

  if (senderEmail) {
    if (
      task.assigneeOrganization?.contactEmail &&
      task.assigneeOrganization.contactEmail.toLowerCase() === senderEmail
    ) {
      authorOrganizationId = task.assigneeOrganization.id;
    } else if (
      task.assigneePerson?.email &&
      task.assigneePerson.email.toLowerCase() === senderEmail
    ) {
      authorPersonId = task.assigneePerson.id;
    } else {
      // Sender doesn't match the assigned org/person. Look for any Person
      // with this email so delegates (chief of staff, foundation program
      // officer) can also reply naturally.
      const person = await db.person.findUnique({
        where: { email: senderEmail },
        select: { id: true },
      });
      if (person) {
        authorPersonId = person.id;
      } else {
        authorNameSnapshot = senderDisplayName ?? senderEmail;
      }
    }
  } else {
    authorNameSnapshot = senderDisplayName ?? "(unknown sender)";
  }

  // Strip quoted text + clean body.
  const cleanBody = stripQuotedReply(event.text).trim();
  if (!cleanBody) {
    return { status: "skipped", reason: "empty body after quote-stripping" };
  }

  // Create the comment + communication atomically.
  const created = await db.$transaction(async (tx) => {
    const comment = await tx.taskComment.create({
      data: {
        taskId,
        message: cleanBody,
        kind: TaskCommentKind.INBOUND_MESSAGE,
        source: TaskCommentSource.EMAIL_REPLY,
        authorPersonId,
        authorOrganizationId,
        authorNameSnapshot,
      },
    });

    const communication = await tx.taskCommunication.create({
      data: {
        taskId,
        taskCommentId: comment.id,
        direction: "INBOUND",
        channel: "EMAIL",
        status: TaskCommunicationStatus.RECEIVED,
        recipientEmail: event.to,
        senderNameSnapshot: senderDisplayName,
        providerMessageId: event.providerMessageId,
        receivedAt: new Date(),
        audience: "ASSIGNEE",
        purpose: "REMINDER",
        metadataJson: {
          inboundFrom: event.from,
          inboundSubject: event.subject,
          inReplyTo: event.inReplyTo ?? null,
          authMatched: Boolean(authorPersonId || authorOrganizationId),
        } as Prisma.InputJsonValue,
      },
    });

    return { commentId: comment.id, communicationId: communication.id };
  });

  // Notify the task owner so they don't have to poll the dashboard. Best-
  // effort — failures here don't block the inbound write.
  if (task.ownerUserId) {
    try {
      const ownerEmail = await resolveOwnerEmail(task.ownerUserId, db);
      if (ownerEmail) {
        await sendTaskNotificationEmail({
          taskId,
          recipientEmail: ownerEmail,
          subject: `New reply on task: ${task.title ?? taskId}`,
          text:
            `${senderDisplayName ?? senderEmail ?? "Someone"} replied:\n\n${cleanBody}` +
            `\n\n---\nView the task: https://warondisease.org/tasks/${taskId}`,
        });
      }
    } catch (e) {
      // Swallow — the inbound write already succeeded; owner notification
      // is a nice-to-have. Log so the failure is visible.
      console.error("[INBOUND REPLY] Owner notification failed", taskId, e);
    }
  }

  return {
    status: "created",
    taskCommentId: created.commentId,
    taskCommunicationId: created.communicationId,
  };
}

async function resolveOwnerEmail(
  userId: string,
  db: typeof prisma,
): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}
