import {
  ContentVisibility,
  TaskCommunicationChannel,
  type EmailLogStatus,
  type TaskCommunicationStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface AdminCommunicationFilters {
  email?: string | null;
  limit?: number | null;
  organizationId?: string | null;
  personId?: string | null;
  q?: string | null;
  taskId?: string | null;
  userId?: string | null;
}

function clean(value?: string | null) {
  return value?.trim() || null;
}

export function clampAdminLimit(
  value?: number | null,
  fallback = 50,
  max = 200,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(Math.floor(value), max));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getMetadataString(
  metadata: Prisma.JsonValue | null,
  key: "html" | "text" | "subject",
) {
  const value = asRecord(metadata)[key];
  return typeof value === "string" ? value : null;
}

function previewText(value: string | null, max = 280) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}...`;
}

const taskCommunicationSelect = {
  audience: true,
  channel: true,
  createdAt: true,
  direction: true,
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
  emailLogId: true,
  errorMessage: true,
  failedAt: true,
  id: true,
  metadataJson: true,
  purpose: true,
  receivedAt: true,
  recipientEmail: true,
  recipientNameSnapshot: true,
  recipientOrganization: {
    select: {
      contactEmail: true,
      id: true,
      name: true,
      slug: true,
    },
  },
  recipientPerson: {
    select: {
      displayName: true,
      email: true,
      handle: true,
      id: true,
    },
  },
  recipientUser: {
    select: {
      email: true,
      id: true,
      person: { select: { displayName: true, handle: true } },
    },
  },
  senderUser: {
    select: {
      email: true,
      id: true,
      person: { select: { displayName: true, handle: true } },
    },
  },
  sentAt: true,
  status: true,
  task: {
    select: {
      id: true,
      taskKey: true,
      title: true,
    },
  },
  taskId: true,
} satisfies Prisma.TaskCommunicationSelect;

type TaskCommunicationRow = Prisma.TaskCommunicationGetPayload<{
  select: typeof taskCommunicationSelect;
}>;

const emailLogSelect = {
  bouncedAt: true,
  createdAt: true,
  deliveredAt: true,
  errorMessage: true,
  id: true,
  openedAt: true,
  providerMessageId: true,
  sentAt: true,
  status: true,
  subject: true,
  taskCommunications: {
    select: {
      id: true,
      purpose: true,
      status: true,
      task: { select: { id: true, title: true } },
      taskId: true,
    },
    take: 5,
  },
  templateId: true,
  toAddress: true,
  user: {
    select: {
      email: true,
      id: true,
      person: { select: { displayName: true, handle: true } },
    },
  },
  userId: true,
} satisfies Prisma.EmailLogSelect;

type EmailLogRow = Prisma.EmailLogGetPayload<{ select: typeof emailLogSelect }>;

function buildCommunicationWhere(
  filters: AdminCommunicationFilters,
): Prisma.TaskCommunicationWhereInput {
  const q = clean(filters.q);
  const email = clean(filters.email)?.toLowerCase();
  const organizationId = clean(filters.organizationId);
  const personId = clean(filters.personId);
  const taskId = clean(filters.taskId);
  const userId = clean(filters.userId);
  const and: Prisma.TaskCommunicationWhereInput[] = [];
  const where: Prisma.TaskCommunicationWhereInput = {
    channel: TaskCommunicationChannel.EMAIL,
    ...(taskId ? { taskId } : {}),
    ...(userId ? { recipientUserId: userId } : {}),
    ...(personId ? { recipientPersonId: personId } : {}),
    ...(organizationId ? { recipientOrganizationId: organizationId } : {}),
  };

  if (email) {
    and.push({
      OR: [
        { recipientEmail: { equals: email, mode: "insensitive" } },
        { emailLog: { toAddress: { equals: email, mode: "insensitive" } } },
      ],
    });
  }

  if (q) {
    and.push({
      OR: [
        { recipientEmail: { contains: q, mode: "insensitive" } },
        { recipientNameSnapshot: { contains: q, mode: "insensitive" } },
        { task: { title: { contains: q, mode: "insensitive" } } },
        {
          recipientOrganization: {
            name: { contains: q, mode: "insensitive" },
          },
        },
        {
          recipientPerson: {
            displayName: { contains: q, mode: "insensitive" },
          },
        },
        { recipientUser: { email: { contains: q, mode: "insensitive" } } },
        { emailLog: { subject: { contains: q, mode: "insensitive" } } },
        { emailLog: { toAddress: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

function buildEmailLogWhere(
  filters: AdminCommunicationFilters,
): Prisma.EmailLogWhereInput {
  const q = clean(filters.q);
  const email = clean(filters.email)?.toLowerCase();
  const taskId = clean(filters.taskId);
  const personId = clean(filters.personId);
  const organizationId = clean(filters.organizationId);
  const and: Prisma.EmailLogWhereInput[] = [];
  const where: Prisma.EmailLogWhereInput = {
    ...(clean(filters.userId) ? { userId: clean(filters.userId)! } : {}),
    ...(email ? { toAddress: { equals: email, mode: "insensitive" } } : {}),
  };

  if (taskId) and.push({ taskCommunications: { some: { taskId } } });
  if (personId) {
    and.push({ taskCommunications: { some: { recipientPersonId: personId } } });
  }
  if (organizationId) {
    and.push({
      taskCommunications: {
        some: { recipientOrganizationId: organizationId },
      },
    });
  }

  if (q) {
    and.push({
      OR: [
        { toAddress: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { templateId: { contains: q, mode: "insensitive" } },
        { providerMessageId: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        {
          user: {
            person: { displayName: { contains: q, mode: "insensitive" } },
          },
        },
        {
          taskCommunications: {
            some: { task: { title: { contains: q, mode: "insensitive" } } },
          },
        },
      ],
    });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

export function serializeTaskCommunication(row: TaskCommunicationRow) {
  const metadataSubject = getMetadataString(row.metadataJson, "subject");
  const text = getMetadataString(row.metadataJson, "text");
  const html = getMetadataString(row.metadataJson, "html");
  return {
    audience: row.audience,
    channel: row.channel,
    createdAt: row.createdAt.toISOString(),
    direction: row.direction,
    emailLog: row.emailLog
      ? {
          bouncedAt: row.emailLog.bouncedAt?.toISOString() ?? null,
          deliveredAt: row.emailLog.deliveredAt?.toISOString() ?? null,
          errorMessage: row.emailLog.errorMessage,
          id: row.emailLog.id,
          openedAt: row.emailLog.openedAt?.toISOString() ?? null,
          providerMessageId: row.emailLog.providerMessageId,
          sentAt: row.emailLog.sentAt.toISOString(),
          status: row.emailLog.status as EmailLogStatus,
          subject: row.emailLog.subject,
          templateId: row.emailLog.templateId,
          toAddress: row.emailLog.toAddress,
        }
      : null,
    emailLogId: row.emailLogId,
    errorMessage: row.errorMessage,
    failedAt: row.failedAt?.toISOString() ?? null,
    id: row.id,
    messagePreview: previewText(text ?? html),
    purpose: row.purpose,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    recipient: {
      email: row.recipientEmail,
      name:
        row.recipientNameSnapshot ??
        row.recipientUser?.person?.displayName ??
        row.recipientPerson?.displayName ??
        row.recipientOrganization?.name ??
        null,
      organization: row.recipientOrganization,
      person: row.recipientPerson,
      user: row.recipientUser,
    },
    senderUser: row.senderUser,
    sentAt: row.sentAt?.toISOString() ?? null,
    status: row.status as TaskCommunicationStatus,
    subject: row.emailLog?.subject ?? metadataSubject,
    task: row.task,
    taskId: row.taskId,
    text,
  };
}

export function serializeEmailLog(row: EmailLogRow) {
  return {
    bouncedAt: row.bouncedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    errorMessage: row.errorMessage,
    id: row.id,
    openedAt: row.openedAt?.toISOString() ?? null,
    providerMessageId: row.providerMessageId,
    sentAt: row.sentAt.toISOString(),
    status: row.status as EmailLogStatus,
    subject: row.subject,
    taskCommunications: row.taskCommunications,
    templateId: row.templateId,
    toAddress: row.toAddress,
    user: row.user,
    userId: row.userId,
  };
}

export async function listAdminTaskEmailCommunications(
  filters: AdminCommunicationFilters,
) {
  const limit = clampAdminLimit(filters.limit);
  const where = buildCommunicationWhere(filters);
  const [communications, total] = await Promise.all([
    prisma.taskCommunication.findMany({
      where,
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      select: taskCommunicationSelect,
      take: limit,
    }),
    prisma.taskCommunication.count({ where }),
  ]);

  return {
    communications: communications.map(serializeTaskCommunication),
    limit,
    total,
  };
}

export async function listAdminEmailLogs(filters: AdminCommunicationFilters) {
  const limit = clampAdminLimit(filters.limit);
  const where = buildEmailLogWhere(filters);
  const [emailLogs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      select: emailLogSelect,
      take: limit,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return {
    emailLogs: emailLogs.map(serializeEmailLog),
    limit,
    total,
  };
}

export async function listAdminCommunicationDirectory(
  filters: Pick<AdminCommunicationFilters, "limit" | "q">,
) {
  const q = clean(filters.q);
  const limit = clampAdminLimit(filters.limit, 25, 100);
  const queryMode = "insensitive" as const;

  const [users, people, organizations] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: queryMode } },
                { person: { displayName: { contains: q, mode: queryMode } } },
                { person: { handle: { contains: q, mode: queryMode } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        _count: {
          select: {
            emailLogs: true,
            receivedTaskCommunications: true,
            sentTaskCommunications: true,
          },
        },
        createdAt: true,
        email: true,
        id: true,
        isAdmin: true,
        person: { select: { displayName: true, handle: true, id: true } },
      },
      take: limit,
    }),
    prisma.person.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: queryMode } },
                { handle: { contains: q, mode: queryMode } },
                { email: { contains: q, mode: queryMode } },
                { currentAffiliation: { contains: q, mode: queryMode } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        _count: {
          select: {
            receivedTaskCommunications: true,
            sentTaskCommunications: true,
          },
        },
        createdAt: true,
        currentAffiliation: true,
        displayName: true,
        email: true,
        handle: true,
        id: true,
        user: { select: { email: true, id: true } },
      },
      take: limit,
    }),
    prisma.organization.findMany({
      where: {
        deletedAt: null,
        visibility: ContentVisibility.PUBLIC,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: queryMode } },
                { slug: { contains: q, mode: queryMode } },
                { contactEmail: { contains: q, mode: queryMode } },
                { website: { contains: q, mode: queryMode } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        _count: {
          select: {
            assignedTasks: true,
            receivedTaskCommunications: true,
          },
        },
        contactEmail: true,
        createdAt: true,
        id: true,
        name: true,
        slug: true,
        status: true,
        type: true,
        website: true,
      },
      take: limit,
    }),
  ]);

  return {
    organizations: organizations.map((organization) => ({
      ...organization,
      createdAt: organization.createdAt.toISOString(),
    })),
    people: people.map((person) => ({
      ...person,
      createdAt: person.createdAt.toISOString(),
    })),
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  };
}
