/**
 * Inbound email reply → TaskComment processor.
 *
 * Wired by `/api/webhooks/resend-inbound` (or equivalent route). Decodes the
 * `reply+{taskId}@{REPLY_EMAIL_DOMAIN}` address back to a taskId, strips
 * quoted prior messages from the body, authenticates the sender by matching
 * email to a known user, Person, Organization, or endpoint on the task, and
 * creates a TaskComment + TaskCommunication record.
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
import { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { parseReplyAddress } from "@/lib/email/task-notification";
import { notifyTaskCommentRecipients } from "@/lib/tasks/task-comment-notifications.server";

export interface InboundEmailEvent {
  /// Sender as the provider parsed it. May be `Display Name <addr@host>`.
  from: string;
  /// Recipient — should match `reply+{taskId}@{REPLY_EMAIL_DOMAIN}`.
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

  const lines = text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"));
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
    return {
      status: "skipped",
      reason: "to-address did not match reply pattern",
    };
  }
  const taskId = parsed.taskId;

  // Idempotency check (fast path): bail if we already have a row for this
  // providerMessageId. The DB-enforced unique constraint on the column is
  // the source of truth — see the catch below for the race-condition case
  // where two concurrent webhooks both pass this check.
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
      createdByUserId: true,
      assigneePersonId: true,
      assigneeOrganizationId: true,
      createdByUser: { select: { id: true, email: true } },
      assigneePerson: { select: { id: true, email: true } },
      assigneeOrganization: { select: { id: true, contactEmail: true } },
      communicationEndpoints: {
        where: { deletedAt: null, email: { not: null } },
        select: { email: true },
      },
    },
  });
  if (!task) {
    return { status: "skipped", reason: "task not found" };
  }

  // Authenticate sender by email match.
  const senderEmail = extractEmailAddress(event.from);
  const senderDisplayName = extractDisplayName(event.from);
  let authorUserId: string | null = null;
  let authorPersonId: string | null = null;
  let authorOrganizationId: string | null = null;
  let authorNameSnapshot: string | null = null;
  let isAuthorizedSender = false;

  if (senderEmail) {
    const creatorEmail = task.createdByUser?.email?.toLowerCase() ?? null;
    if (creatorEmail === senderEmail) {
      authorUserId = task.createdByUser?.id ?? task.createdByUserId;
      isAuthorizedSender = true;
    } else if (
      task.assigneeOrganization?.contactEmail &&
      task.assigneeOrganization.contactEmail.toLowerCase() === senderEmail
    ) {
      authorOrganizationId = task.assigneeOrganization.id;
      isAuthorizedSender = true;
    } else if (
      task.assigneePerson?.email &&
      task.assigneePerson.email.toLowerCase() === senderEmail
    ) {
      authorPersonId = task.assigneePerson.id;
      isAuthorizedSender = true;
    } else if (
      task.communicationEndpoints.some(
        (endpoint) => endpoint.email?.toLowerCase() === senderEmail,
      )
    ) {
      authorNameSnapshot = senderDisplayName ?? senderEmail;
      isAuthorizedSender = true;
    }
  }

  if (!isAuthorizedSender) {
    return { status: "skipped", reason: "unauthorized sender" };
  }

  // Strip quoted text + clean body.
  const cleanBody = stripQuotedReply(event.text).trim();
  if (!cleanBody) {
    return { status: "skipped", reason: "empty body after quote-stripping" };
  }

  // Create the comment + communication atomically. The unique constraint on
  // TaskCommunication.providerMessageId is the actual idempotency guard:
  // if a concurrent webhook delivery slips past the fast-path findFirst
  // above and both reach this insert, exactly one wins and the loser's
  // transaction throws Prisma error code P2002, which we catch and turn
  // into a "skipped, duplicate" success.
  let created: { commentId: string; communicationId: string };
  try {
    created = await db.$transaction(async (tx) => {
      const comment = await tx.taskComment.create({
        data: {
          taskId,
          message: cleanBody,
          kind: TaskCommentKind.INBOUND_MESSAGE,
          source: TaskCommentSource.EMAIL_REPLY,
          authorUserId,
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
            authMatched: isAuthorizedSender,
          } as Prisma.InputJsonValue,
        },
      });

      return { commentId: comment.id, communicationId: communication.id };
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Race lost — another concurrent delivery committed first. Look up
      // the winner and return its IDs so the webhook caller still gets a
      // useful response payload.
      const winner = await db.taskCommunication.findFirst({
        where: { providerMessageId: event.providerMessageId, deletedAt: null },
        select: { id: true, taskCommentId: true },
      });
      return {
        status: "skipped",
        reason: "duplicate providerMessageId (concurrent race)",
        taskCommentId: winner?.taskCommentId ?? undefined,
        taskCommunicationId: winner?.id,
      };
    }
    throw e;
  }

  // Fan out to every watcher (creator + assignee + endpoints + admin monitors)
  // via the shared comment-notification helper, which already filters the
  // author out and applies cooldowns / rate-limits. Best-effort — failures
  // here don't block the inbound write.
  try {
    await notifyTaskCommentRecipients({
      authorOrganizationId,
      authorPersonId,
      authorUserId,
      authorNameOverride: authorNameSnapshot,
      commentId: created.commentId,
      message: cleanBody,
      taskId,
    });
  } catch (e) {
    console.error("[INBOUND REPLY] Watcher fan-out failed", taskId, e);
  }

  return {
    status: "created",
    taskCommentId: created.commentId,
    taskCommunicationId: created.communicationId,
  };
}
