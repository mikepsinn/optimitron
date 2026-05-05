import { TaskCommunicationEndpointKind } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export interface ResolvedTaskRecipient {
  email: string;
  endpointId?: string | null;
  isAdmin?: boolean;
  organizationId?: string | null;
  personId?: string | null;
  reason?: string | null;
  role?:
    | "admin_monitor"
    | "assignee_organization"
    | "assignee_person"
    | "assignee_user"
    | "creator"
    | "endpoint";
  userId?: string | null;
}

export interface ResolveTaskRecipientsOptions {
  includeAdminMonitors?: boolean;
  includeCreator?: boolean;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

export async function resolveTaskRecipient(
  taskId: string,
  options?: ResolveTaskRecipientsOptions,
): Promise<ResolvedTaskRecipient | null> {
  const [recipient] = await resolveTaskRecipients(taskId, options);
  return recipient ?? null;
}

export async function resolveTaskRecipients(
  taskId: string,
  options: ResolveTaskRecipientsOptions = {},
): Promise<ResolvedTaskRecipient[]> {
  const [task, adminUsers] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assigneeOrganization: {
          select: {
            contactEmail: true,
            deletedAt: true,
            id: true,
          },
        },
        assigneePerson: {
          select: {
            deletedAt: true,
            email: true,
            id: true,
            user: {
              select: {
                deletedAt: true,
                email: true,
                id: true,
              },
            },
          },
        },
        communicationEndpoints: {
          where: {
            deletedAt: null,
            kind: {
              in: [
                TaskCommunicationEndpointKind.EMAIL,
                TaskCommunicationEndpointKind.MAILTO,
              ],
            },
          },
          orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
          select: { email: true, id: true },
          take: 1,
        },
        createdByUser: {
          select: {
            deletedAt: true,
            email: true,
            id: true,
          },
        },
        deletedAt: true,
        id: true,
      },
    }),
    options.includeAdminMonitors
      ? prisma.user.findMany({
          where: {
            deletedAt: null,
            isAdmin: true,
            isSystem: false,
          },
          select: {
            email: true,
            id: true,
          },
          orderBy: {
            id: "asc",
          },
        })
      : Promise.resolve([]),
  ]);

  if (!task || task.deletedAt) {
    return [];
  }

  const recipients: ResolvedTaskRecipient[] = [];
  const seenEmails = new Set<string>();
  const addRecipient = (
    recipient: ResolvedTaskRecipient | null | undefined,
  ) => {
    if (!recipient) return;
    if (seenEmails.has(recipient.email)) return;
    seenEmails.add(recipient.email);
    recipients.push(recipient);
  };

  const userEmail =
    task.assigneePerson?.user && !task.assigneePerson.user.deletedAt
      ? normalizeEmail(task.assigneePerson.user.email)
      : null;
  if (userEmail) {
    addRecipient({
      email: userEmail,
      personId: task.assigneePerson?.id ?? null,
      reason: "You're getting this because this task is assigned to you.",
      role: "assignee_user",
      userId: task.assigneePerson?.user?.id ?? null,
    });
  }

  const personEmail =
    task.assigneePerson && !task.assigneePerson.deletedAt
      ? normalizeEmail(task.assigneePerson.email)
      : null;
  if (personEmail) {
    addRecipient({
      email: personEmail,
      personId: task.assigneePerson?.id ?? null,
      reason: "You're getting this because this task is assigned to you.",
      role: "assignee_person",
    });
  }

  const orgEmail =
    task.assigneeOrganization && !task.assigneeOrganization.deletedAt
      ? normalizeEmail(task.assigneeOrganization.contactEmail)
      : null;
  if (orgEmail) {
    addRecipient({
      email: orgEmail,
      organizationId: task.assigneeOrganization?.id ?? null,
      reason:
        "You're getting this because this task is assigned to your organization.",
      role: "assignee_organization",
    });
  }

  const endpoint = task.communicationEndpoints[0];
  const endpointEmail = endpoint ? normalizeEmail(endpoint.email) : null;
  if (endpoint && endpointEmail) {
    addRecipient({
      email: endpointEmail,
      endpointId: endpoint.id,
      reason:
        "You're getting this because this email address is listed as the task contact.",
      role: "endpoint",
    });
  }

  const creatorEmail =
    options.includeCreator &&
    task.createdByUser &&
    !task.createdByUser.deletedAt
      ? normalizeEmail(task.createdByUser.email)
      : null;
  if (creatorEmail && task.createdByUser?.id) {
    addRecipient({
      email: creatorEmail,
      reason: "You're getting this because you created this task.",
      role: "creator",
      userId: task.createdByUser.id,
    });
  }

  for (const adminUser of adminUsers) {
    const email = normalizeEmail(adminUser.email);
    if (!email) continue;
    addRecipient({
      email,
      isAdmin: true,
      reason:
        "You're getting this admin copy because task email monitoring is turned on.",
      role: "admin_monitor",
      userId: adminUser.id,
    });
  }

  return recipients;
}
