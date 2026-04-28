import { TaskCommunicationEndpointKind } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";

export interface ResolvedTaskRecipient {
  email: string;
  endpointId?: string | null;
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
  const task = await prisma.task.findUnique({
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
          kind: TaskCommunicationEndpointKind.EMAIL,
        },
        orderBy: [{ isPrimary: "desc" }, { priority: "asc" }],
        select: { email: true, id: true },
        take: 1,
      },
      deletedAt: true,
      id: true,
    },
  });

  if (!task || task.deletedAt) {
    return null;
  }

  const userEmail =
    task.assigneePerson?.user && !task.assigneePerson.user.deletedAt
      ? normalizeEmail(task.assigneePerson.user.email)
      : null;
  if (userEmail) {
    return {
      email: userEmail,
      personId: task.assigneePerson?.id ?? null,
      userId: task.assigneePerson?.user?.id ?? null,
    };
  }

  const personEmail =
    task.assigneePerson && !task.assigneePerson.deletedAt
      ? normalizeEmail(task.assigneePerson.email)
      : null;
  if (personEmail) {
    return {
      email: personEmail,
      personId: task.assigneePerson?.id ?? null,
    };
  }

  const orgEmail =
    task.assigneeOrganization && !task.assigneeOrganization.deletedAt
      ? normalizeEmail(task.assigneeOrganization.contactEmail)
      : null;
  if (orgEmail) {
    return {
      email: orgEmail,
      organizationId: task.assigneeOrganization?.id ?? null,
    };
  }

  const endpoint = task.communicationEndpoints[0];
  const endpointEmail = endpoint ? normalizeEmail(endpoint.email) : null;
  if (endpoint && endpointEmail) {
    return {
      email: endpointEmail,
      endpointId: endpoint.id,
    };
  }

  return null;
}
