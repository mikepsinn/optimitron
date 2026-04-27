import type { Prisma, PrismaClient } from "@optimitron/db";
import {
  TaskCommunicationEndpointKind,
  TaskCommunicationEndpointVerificationStatus,
  type TaskCommunicationEndpointKind as TaskCommunicationEndpointKindValue,
} from "@optimitron/db/enums";

type EndpointDelegate = Pick<
  PrismaClient["taskCommunicationEndpoint"],
  "create" | "findFirst" | "update" | "updateMany"
>;

type EndpointClient = {
  taskCommunicationEndpoint: EndpointDelegate;
};

export interface PrimaryTaskCommunicationEndpointInput {
  email?: string | null;
  label?: string | null;
  sourceUrl?: string | null;
  instructions?: string | null;
  url?: string | null;
}

export interface NormalizedTaskCommunicationEndpoint {
  email: string | null;
  instructions: string | null;
  kind: TaskCommunicationEndpointKindValue;
  label: string | null;
  sourceUrl: string | null;
  url: string | null;
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function inferEndpointKind(input: {
  email: string | null;
  url: string | null;
}) {
  if (input.url?.toLowerCase().startsWith("mailto:")) {
    return TaskCommunicationEndpointKind.MAILTO;
  }

  if (input.email) {
    return TaskCommunicationEndpointKind.EMAIL;
  }

  if (input.url) {
    return TaskCommunicationEndpointKind.EXTERNAL_URL;
  }

  return TaskCommunicationEndpointKind.MANUAL;
}

export function normalizePrimaryTaskCommunicationEndpoint(
  input: PrimaryTaskCommunicationEndpointInput,
): NormalizedTaskCommunicationEndpoint | null {
  const url = clean(input.url);
  const emailFromMailto =
    url?.toLowerCase().startsWith("mailto:")
      ? clean(url.slice("mailto:".length).split("?")[0] ?? null)
      : null;
  const email = clean(input.email) ?? emailFromMailto;
  const label = clean(input.label);
  const instructions = clean(input.instructions);
  const sourceUrl = clean(input.sourceUrl);

  if (!url && !email && !label && !instructions) {
    return null;
  }

  return {
    email,
    instructions,
    kind: inferEndpointKind({ email, url }),
    label,
    sourceUrl,
    url,
  };
}

export function buildPrimaryTaskCommunicationEndpointCreateData(
  input: PrimaryTaskCommunicationEndpointInput,
): Prisma.TaskCommunicationEndpointCreateWithoutTaskInput | null {
  const endpoint = normalizePrimaryTaskCommunicationEndpoint(input);
  if (!endpoint) {
    return null;
  }

  return {
    email: endpoint.email,
    instructions: endpoint.instructions,
    isPrimary: true,
    kind: endpoint.kind,
    label: endpoint.label,
    priority: 0,
    sourceUrl: endpoint.sourceUrl,
    url: endpoint.url,
    verificationStatus: TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
  };
}

export async function upsertPrimaryTaskCommunicationEndpoint(
  client: EndpointClient,
  taskId: string,
  input: PrimaryTaskCommunicationEndpointInput,
) {
  const endpoint = normalizePrimaryTaskCommunicationEndpoint(input);

  if (!endpoint) {
    await client.taskCommunicationEndpoint.updateMany({
      where: {
        deletedAt: null,
        isPrimary: true,
        taskId,
      },
      data: {
        deletedAt: new Date(),
        isPrimary: false,
      },
    });
    return null;
  }

  const existing = await client.taskCommunicationEndpoint.findFirst({
    where: {
      deletedAt: null,
      isPrimary: true,
      taskId,
    },
    select: {
      id: true,
    },
  });

  const data = {
    email: endpoint.email,
    instructions: endpoint.instructions,
    isPrimary: true,
    kind: endpoint.kind,
    label: endpoint.label,
    priority: 0,
    sourceUrl: endpoint.sourceUrl,
    url: endpoint.url,
    verificationStatus: TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
  };

  if (existing) {
    return client.taskCommunicationEndpoint.update({
      where: {
        id: existing.id,
      },
      data,
    });
  }

  return client.taskCommunicationEndpoint.create({
    data: {
      ...data,
      taskId,
    },
  });
}
