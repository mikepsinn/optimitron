/**
 * Communications audit reads for the MCP `listCommunications` and
 * `getCommunicationLog` tools.
 *
 * Unlike `admin-communications.server.ts` (admin-only, email-channel-only),
 * these queries are viewer-scoped: admins see every TaskCommunication;
 * everyone else sees only communications on tasks they created or are
 * assigned to (the same "personal" semantics as `getTaskVisibilityWhere`
 * in `tasks.server.ts`), with recipient emails masked.
 */

import type {
  TaskCommunicationChannel,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface CommunicationsViewer {
  isAdmin: boolean;
  personId: string | null;
  userId: string | null;
}

export interface ListCommunicationsFilters {
  channel?: TaskCommunicationChannel | null;
  limit?: number | null;
  organizationId?: string | null;
  personId?: string | null;
  since?: Date | null;
  status?: TaskCommunicationStatus | null;
  taskId?: string | null;
  until?: Date | null;
}

const LIST_LIMIT_DEFAULT = 50;
const LIST_LIMIT_MAX = 200;
const MESSAGE_PREVIEW_LENGTH = 140;

export function clampCommunicationsLimit(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return LIST_LIMIT_DEFAULT;
  }
  return Math.max(1, Math.min(Math.floor(value), LIST_LIMIT_MAX));
}

/** `m@thinkbynumbers.org` → `m***@thinkbynumbers.org`. Null-safe. */
export function maskEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim();
  if (!normalized) return null;
  const at = normalized.indexOf("@");
  // Missing/leading "@" → nothing safely displayable; mask everything.
  if (at <= 0) return "***";
  return `${normalized[0]}***${normalized.slice(at)}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function metadataString(metadata: unknown, key: string): string | null {
  const value = asRecord(metadata)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function previewText(value: string | null, max = MESSAGE_PREVIEW_LENGTH) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

/**
 * Suppressed sends are recorded as FAILED/CANCELLED with the reason inside
 * `errorMessage` (e.g. `send_aborted:suppressed:outbound_mode_off`). Surface
 * that reason as a first-class field so audit consumers don't parse strings.
 */
function suppressionReason(errorMessage: string | null): string | null {
  if (!errorMessage) return null;
  const match = errorMessage.match(/suppressed[:\s]+([a-z_]+)/i);
  if (!match || !match[1]) {
    // Not a suppression-shaped error message — plain failures carry no reason.
    return null;
  }
  return match[1];
}

// Non-admin callers see only communications on tasks they created or are
// assigned to — mirrors getTaskVisibilityWhere("personal") in tasks.server.ts.
function viewerScopeWhere(
  viewer: CommunicationsViewer,
): Prisma.TaskCommunicationWhereInput {
  if (viewer.isAdmin) return {};
  const ors: Prisma.TaskWhereInput[] = [];
  if (viewer.userId) ors.push({ createdByUserId: viewer.userId });
  if (viewer.personId) ors.push({ assigneePersonId: viewer.personId });
  if (ors.length === 0) {
    // Anonymous non-admin viewer: match nothing rather than everything.
    return { id: "__no_viewer__" };
  }
  return { task: { deletedAt: null, OR: ors } };
}

const listSelect = {
  channel: true,
  createdAt: true,
  direction: true,
  errorMessage: true,
  id: true,
  metadataJson: true,
  recipientEmail: true,
  recipientNameSnapshot: true,
  recipientOrganization: { select: { id: true, name: true } },
  recipientPerson: { select: { displayName: true, id: true } },
  recipientUser: {
    select: { id: true, person: { select: { displayName: true } } },
  },
  sentAt: true,
  status: true,
  task: { select: { id: true, title: true } },
  taskCommentId: true,
  taskComment: { select: { id: true, message: true } },
  taskId: true,
} satisfies Prisma.TaskCommunicationSelect;

type ListRow = Prisma.TaskCommunicationGetPayload<{
  select: typeof listSelect;
}>;

const detailSelect = {
  ...listSelect,
  audience: true,
  cancelledAt: true,
  emailLog: {
    select: {
      bouncedAt: true,
      deliveredAt: true,
      errorMessage: true,
      id: true,
      openedAt: true,
      providerMessageId: true,
      sentAt: true,
      status: true,
      subject: true,
      templateId: true,
      toAddress: true,
    },
  },
  endpointId: true,
  externalUrl: true,
  failedAt: true,
  format: true,
  providerMessageId: true,
  purpose: true,
  receivedAt: true,
  step: true,
  taskComment: {
    select: { createdAt: true, id: true, kind: true, message: true },
  },
} satisfies Prisma.TaskCommunicationSelect;

type DetailRow = Prisma.TaskCommunicationGetPayload<{
  select: typeof detailSelect;
}>;

function recipientDisplayName(row: ListRow): string | null {
  return (
    row.recipientNameSnapshot ??
    row.recipientUser?.person?.displayName ??
    row.recipientPerson?.displayName ??
    row.recipientOrganization?.name ??
    null
  );
}

function serializeListRow(row: ListRow, viewer: CommunicationsViewer) {
  return {
    channel: row.channel,
    createdAt: row.createdAt.toISOString(),
    direction: row.direction,
    errorMessage: row.errorMessage,
    id: row.id,
    messagePreview: previewText(
      metadataString(row.metadataJson, "text") ??
        row.taskComment?.message ??
        metadataString(row.metadataJson, "subject"),
    ),
    recipient: {
      email: viewer.isAdmin
        ? row.recipientEmail
        : maskEmail(row.recipientEmail),
      name: recipientDisplayName(row),
    },
    sentAt: row.sentAt?.toISOString() ?? null,
    status: row.status,
    suppressionReason: suppressionReason(row.errorMessage),
    task: row.task,
    taskCommentId: row.taskCommentId,
    taskId: row.taskId,
  };
}

export async function listCommunicationsForViewer(
  viewer: CommunicationsViewer,
  filters: ListCommunicationsFilters,
) {
  const limit = clampCommunicationsLimit(filters.limit);
  const createdAt: Prisma.DateTimeFilter = {
    ...(filters.since ? { gte: filters.since } : {}),
    ...(filters.until ? { lte: filters.until } : {}),
  };

  const where: Prisma.TaskCommunicationWhereInput = {
    deletedAt: null,
    ...(filters.taskId ? { taskId: filters.taskId } : {}),
    ...(filters.organizationId
      ? { recipientOrganizationId: filters.organizationId }
      : {}),
    ...(filters.personId ? { recipientPersonId: filters.personId } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.since || filters.until ? { createdAt } : {}),
    ...viewerScopeWhere(viewer),
  };

  const [rows, total] = await Promise.all([
    prisma.taskCommunication.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: listSelect,
      take: limit,
    }),
    prisma.taskCommunication.count({ where }),
  ]);

  return {
    communications: rows.map((row) => serializeListRow(row, viewer)),
    limit,
    total,
  };
}

export async function getCommunicationLogForViewer(
  viewer: CommunicationsViewer,
  id: string,
) {
  const row: DetailRow | null = await prisma.taskCommunication.findFirst({
    where: { deletedAt: null, id, ...viewerScopeWhere(viewer) },
    select: detailSelect,
  });
  if (!row) return null;

  return {
    ...serializeListRow(row, viewer),
    body: {
      comment: row.taskComment
        ? {
            createdAt: row.taskComment.createdAt.toISOString(),
            id: row.taskComment.id,
            kind: row.taskComment.kind,
            message: row.taskComment.message,
          }
        : null,
      subject:
        metadataString(row.metadataJson, "subject") ??
        row.emailLog?.subject ??
        null,
      text: metadataString(row.metadataJson, "text"),
      // The rendered HTML often embeds per-recipient unsubscribe URLs —
      // admin eyes only.
      html: viewer.isAdmin ? metadataString(row.metadataJson, "html") : null,
    },
    delivery: row.emailLog
      ? {
          bouncedAt: row.emailLog.bouncedAt?.toISOString() ?? null,
          deliveredAt: row.emailLog.deliveredAt?.toISOString() ?? null,
          emailLogId: row.emailLog.id,
          errorMessage: row.emailLog.errorMessage,
          openedAt: row.emailLog.openedAt?.toISOString() ?? null,
          providerMessageId: row.emailLog.providerMessageId,
          sentAt: row.emailLog.sentAt.toISOString(),
          status: row.emailLog.status,
          subject: row.emailLog.subject,
          templateId: row.emailLog.templateId,
          toAddress: viewer.isAdmin
            ? row.emailLog.toAddress
            : maskEmail(row.emailLog.toAddress),
        }
      : null,
    envelope: {
      audience: row.audience,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      channel: row.channel,
      direction: row.direction,
      endpointId: row.endpointId,
      // externalUrl carries raw `mailto:<address>` targets — admin only.
      externalUrl: viewer.isAdmin ? row.externalUrl : null,
      failedAt: row.failedAt?.toISOString() ?? null,
      format: row.format,
      providerMessageId: row.providerMessageId,
      purpose: row.purpose,
      receivedAt: row.receivedAt?.toISOString() ?? null,
      step: row.step,
    },
    trigger: {
      dedupeKey: metadataString(row.metadataJson, "dedupeKey"),
      messageId: metadataString(row.metadataJson, "messageId"),
      notificationKind: metadataString(row.metadataJson, "notificationKind"),
      triggerId: metadataString(row.metadataJson, "triggerId"),
      triggerKey: metadataString(row.metadataJson, "triggerKey"),
    },
    // Raw metadata can hold BCC lists and unsubscribe capability URLs —
    // admin eyes only.
    ...(viewer.isAdmin ? { metadataJson: row.metadataJson } : {}),
  };
}
