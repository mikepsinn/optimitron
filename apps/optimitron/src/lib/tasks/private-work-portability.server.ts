import { z } from "zod";
import { getDocumentForViewer, toDocumentDto } from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";
import {
  assertUserCanManagePrivateSourceArtifact,
  getSourceArtifactVisibilityWhere,
} from "@/lib/source-artifact-visibility.server";
import { getTaskAccessWhere } from "@/lib/tasks/task-visibility.server";

const MAX_EXPORTED_TASKS = 5_000;
const MAX_TREE_DEPTH = 100;

export const ExportPrivateWorkSchema = z
  .object({ rootTaskId: z.string().trim().min(1) })
  .strict();

export const DeletePrivateSourceSelectionSchema = z
  .object({ sourceArtifactId: z.string().trim().min(1) })
  .strict();

async function actorIdentity(actorUserId: string) {
  return prisma.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
}

async function collectPrivateTaskTree(input: {
  actorUserId: string;
  personId: string | null;
  rootTaskId: string;
}) {
  const accessWhere = getTaskAccessWhere({
    action: "READ_INTERNAL",
    personId: input.personId,
    userId: input.actorUserId,
  });
  const ids: string[] = [input.rootTaskId];
  let frontier = [input.rootTaskId];
  let depth = 0;

  while (frontier.length > 0) {
    if (depth >= MAX_TREE_DEPTH) {
      throw new Error("Private task tree exceeds the export depth limit");
    }
    const children = await prisma.task.findMany({
      where: {
        deletedAt: null,
        isPublic: false,
        parentTaskId: { in: frontier },
        ...accessWhere,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    frontier = children.map((task) => task.id);
    ids.push(...frontier);
    if (ids.length > MAX_EXPORTED_TASKS) {
      throw new Error(
        `Private work export is limited to ${MAX_EXPORTED_TASKS} tasks`,
      );
    }
    depth += 1;
  }
  return ids;
}

export async function exportPrivateWork(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = ExportPrivateWorkSchema.parse(rawInput);
  const actor = await actorIdentity(actorUserId);
  if (!actor) throw new Error("Task not found");

  const root = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      id: input.rootTaskId,
      isPublic: false,
      ...getTaskAccessWhere({
        action: "MANAGE",
        personId: actor.personId,
        userId: actorUserId,
      }),
    },
    select: { id: true, taskKey: true, title: true },
  });
  if (!root) throw new Error("Task not found");

  const taskIds = await collectPrivateTaskTree({
    actorUserId,
    personId: actor.personId,
    rootTaskId: root.id,
  });
  const taskIdSet = new Set(taskIds);
  const tasks = await prisma.task.findMany({
    where: { deletedAt: null, id: { in: taskIds }, isPublic: false },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      claims: {
        where: { deletedAt: null },
        orderBy: { claimedAt: "asc" },
      },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          attachments: {
            where: { deletedAt: null },
            select: {
              checksumSha256: true,
              contentType: true,
              fileName: true,
              id: true,
              sizeBytes: true,
              uploadedAt: true,
            },
          },
        },
      },
      executionAttempts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          artifacts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
          verifications: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      externalActionRequests: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      linkedCollectionRecords: {
        where: { deletedAt: null },
        include: {
          collection: {
            select: {
              description: true,
              id: true,
              name: true,
              organizationId: true,
              visibility: true,
            },
          },
        },
      },
      sourceArtifacts: {
        where: {
          deletedAt: null,
          sourceArtifact: {
            deletedAt: null,
            ...getSourceArtifactVisibilityWhere(actorUserId),
          },
        },
        orderBy: { createdAt: "asc" },
        include: { sourceArtifact: true },
      },
    },
  });

  const edges = await prisma.taskEdge.findMany({
    where: {
      deletedAt: null,
      fromTaskId: { in: taskIds },
      toTaskId: { in: taskIds },
    },
    orderBy: { createdAt: "asc" },
  });

  const documentIds = await prisma.document.findMany({
    where: { deletedAt: null, taskId: { in: taskIds } },
    select: { id: true },
  });
  const documentViews = await Promise.all(
    documentIds.map(({ id }) => getDocumentForViewer(id, actorUserId)),
  );
  const documents = documentViews.flatMap((view) =>
    view ? [toDocumentDto(view)] : [],
  );

  return {
    documents,
    edges: edges.filter(
      (edge) => taskIdSet.has(edge.fromTaskId) && taskIdSet.has(edge.toTaskId),
    ),
    exportedAt: new Date().toISOString(),
    root,
    schemaVersion: "private-work-export.v1",
    tasks,
  };
}

export async function deletePrivateSourceSelection(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = DeletePrivateSourceSelectionSchema.parse(rawInput);
  await assertUserCanManagePrivateSourceArtifact(
    input.sourceArtifactId,
    actorUserId,
  );

  return prisma.$transaction(async (tx) => {
    const source = await tx.sourceArtifact.findFirst({
      where: {
        deletedAt: null,
        id: input.sourceArtifactId,
        isPublic: false,
        sourceKey: { startsWith: "private-selection:" },
      },
      select: {
        id: true,
        taskLinks: {
          where: { deletedAt: null },
          select: { taskId: true },
        },
      },
    });
    if (!source) throw new Error("Source artifact not found");

    const deletedAt = new Date();
    await tx.taskSourceArtifact.updateMany({
      where: { deletedAt: null, sourceArtifactId: source.id },
      data: { deletedAt },
    });
    await tx.sourceArtifact.update({
      where: { id: source.id },
      data: {
        deletedAt,
        externalKey: null,
        payloadJson: { deleted: true, deletedAt: deletedAt.toISOString() },
        sourceRef: null,
        sourceUrl: null,
        title: "Deleted private source selection",
      },
    });

    return {
      deletedAt,
      sourceArtifactId: source.id,
      unlinkedTaskIds: source.taskLinks.map((link) => link.taskId),
    };
  });
}
