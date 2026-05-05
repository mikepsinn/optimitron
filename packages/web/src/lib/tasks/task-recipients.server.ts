import { TaskCommunicationEndpointKind } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export interface ResolvedTaskRecipient {
  email: string;
  endpointId?: string | null;
  isAdmin?: boolean;
  organizationId?: string | null;
  personId?: string | null;
  userId?: string | null;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

export async function resolveTaskRecipient(
  taskId: string,
): Promise<ResolvedTaskRecipient | null> {
  const [recipient] = await resolveTaskRecipients(taskId);
  return recipient ?? null;
}

export async function resolveTaskRecipients(
  taskId: string,
): Promise<ResolvedTaskRecipient[]> {
  const [task, adminUsers] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        createdByUser: {
          select: {
            deletedAt: true,
            email: true,
            id: true,
          },
        },
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
            kind: TaskCommunicationEndpointKind.EMAIL,
          },
          orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
          select: { email: true, id: true },
          take: 1,
        },
        deletedAt: true,
        id: true,
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        isAdmin: true,
        isSystem: false,
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  if (!task || task.deletedAt) {
    return [];
  }

  const recipients: ResolvedTaskRecipient[] = [];
  const seenEmails = new Set<string>();
  const addRecipient = (recipient: ResolvedTaskRecipient | null | undefined) => {
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
    });
  }

  const creatorEmail =
    task.createdByUser && !task.createdByUser.deletedAt
      ? normalizeEmail(task.createdByUser.email)
      : null;
  if (creatorEmail) {
    if (task.createdByUser?.id) {
      addRecipient({
        email: creatorEmail,
        userId: task.createdByUser.id,
      });
    }
  }

  const endpoint = task.communicationEndpoints[0];
  const endpointEmail = endpoint ? normalizeEmail(endpoint.email) : null;
  if (endpoint && endpointEmail) {
    addRecipient({
      email: endpointEmail,
      endpointId: endpoint.id,
    });
  }

  for (const adminUser of adminUsers) {
    const email = normalizeEmail(adminUser.email);
    if (!email) continue;
    addRecipient({
      email,
      isAdmin: true,
      userId: adminUser.id,
    });
  }

  return recipients;
}
