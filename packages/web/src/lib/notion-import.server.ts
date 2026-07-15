import { createHash } from "node:crypto";
import { Prisma } from "@optimitron/db";
import {
  ContentAccessLevel,
  OrgStatus,
  SourceArtifactType,
  SourceSystem,
  TaskClaimPolicy,
  TaskEdgeType,
  TaskStatus,
} from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import {
  createCollection,
  createCollectionRecord,
  getCollectionForViewer,
  getCollectionRecordForViewer,
  saveCollectionView,
  toCollectionDto,
  updateCollection,
  updateCollectionRecord,
  type CollectionFieldInput,
  type CollectionRecordDto,
  type CollectionRelationInput,
} from "@/lib/collections.server";
import {
  assertCollectionRecordAccess,
  assertDocumentAccess,
  assertCollectionAccess,
  lockContentResources,
} from "@/lib/content-access.server";
import {
  createDocument,
  getDocumentForViewer,
  updateDocument,
} from "@/lib/documents.server";
import {
  type NotionImportBundle,
  notionImportBundleSchema,
  type NotionImportCollection,
  type NotionImportRecord,
} from "@/lib/notion-import.schema";
import {
  deletePrivateObject,
  uploadPrivateObject,
} from "@/lib/object-storage.server";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { canUserViewTask } from "@/lib/tasks/task-visibility.server";
import {
  ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES,
  normalizeTaskCommentAttachmentContentType,
  sanitizeTaskCommentAttachmentFileName,
  taskCommentAttachmentBytesMatchContentType,
  TASK_COMMENT_ATTACHMENT_MAX_BYTES,
} from "@/lib/tasks/task-comment-attachment-policy";

type ImportAction = "create" | "error" | "preserve" | "unchanged" | "update";
const NOTION_IMPORT_EDGE_VERSION = "notion-import.v1";

export function importedDependencyEdgeAction(
  existing: {
    calculationVersion: string | null;
    deletedAt: Date | null;
  } | null,
): "conflict" | "create" | "preserve" | "restore" {
  if (!existing) return "create";
  if (!existing.deletedAt) return "preserve";
  return existing.calculationVersion === NOTION_IMPORT_EDGE_VERSION
    ? "restore"
    : "conflict";
}

export interface NotionImportItemResult {
  action: ImportAction;
  kind:
    | "attachment"
    | "collection"
    | "document"
    | "export"
    | "organization"
    | "person"
    | "preservedArtifact"
    | "record"
    | "task"
    | "view";
  message?: string;
  sourceId: string;
  targetId?: string;
}

interface PreparedArtifact {
  artifactType: SourceArtifactType;
  contentHash: string;
  externalKey: string;
  payloadJson: Prisma.InputJsonValue;
  sourceKey: string;
  sourceUrl: string | null;
  title: string | null;
}

interface PreparedAttachment {
  artifact: PreparedArtifact;
  bytes: Buffer;
  checksumSha256: string;
  contentType: string;
  fileName: string;
  storageKey: string;
}

interface CollectionState {
  artifact: PreparedArtifact;
  collection: NotionImportCollection;
  existed: boolean;
  needsSync: boolean;
  view: NonNullable<Awaited<ReturnType<typeof getCollectionForViewer>>>;
}

interface RecordState {
  action: Exclude<ImportAction, "error" | "preserve">;
  collection: NotionImportCollection;
  record: NotionImportRecord;
  result: CollectionRecordDto;
}

function cleanJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function sourceDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function stableSourceKey(
  workspaceId: string,
  kind: string,
  sourceId: string,
): string {
  return `notion:${sourceDigest(workspaceId)}:${kind}:${sourceDigest(sourceId)}`;
}

function preparedKey(kind: string, sourceId: string): string {
  return `${kind}:${sourceId}`;
}

async function prepareArtifact(input: {
  artifactType: SourceArtifactType;
  kind: string;
  normalized: unknown;
  raw?: unknown;
  sourceId: string;
  title?: string | null;
  url?: string | null;
  workspaceId: string;
}): Promise<PreparedArtifact> {
  const payload = cleanJson({
    normalized: input.normalized,
    raw: input.raw ?? null,
  });
  const contentHash = await sha256CanonicalJson(payload);
  return {
    artifactType: input.artifactType,
    contentHash,
    externalKey: stableSourceKey(input.workspaceId, input.kind, input.sourceId),
    payloadJson: payload,
    sourceKey: `${stableSourceKey(input.workspaceId, input.kind, input.sourceId)}:${contentHash}`,
    sourceUrl: input.url ?? null,
    title: input.title?.trim() || null,
  };
}

async function ensureArtifact(
  tx: Prisma.TransactionClient,
  artifact: PreparedArtifact,
) {
  return tx.sourceArtifact.upsert({
    where: { sourceKey: artifact.sourceKey },
    create: {
      artifactType: artifact.artifactType,
      contentHash: artifact.contentHash,
      externalKey: artifact.externalKey,
      payloadJson: artifact.payloadJson,
      sourceKey: artifact.sourceKey,
      sourceSystem: SourceSystem.NOTION,
      sourceUrl: artifact.sourceUrl,
      title: artifact.title,
      versionKey: artifact.contentHash,
    },
    update: { deletedAt: null },
  });
}

function decodeBase64(value: string): Buffer {
  const normalized = value.replace(/\s+/gu, "");
  const bytes = Buffer.from(normalized, "base64");
  if (
    !normalized ||
    bytes.length === 0 ||
    bytes.toString("base64").replace(/=+$/u, "") !==
      normalized.replace(/=+$/u, "")
  ) {
    throw new Error("Attachment data is not valid base64.");
  }
  return bytes;
}

async function prepareBundle(bundle: NotionImportBundle) {
  const artifacts = new Map<string, PreparedArtifact>();
  const attachments = new Map<string, PreparedAttachment>();
  const add = async (
    kind: string,
    artifactType: SourceArtifactType,
    item: {
      raw?: unknown;
      sourceId: string;
      title?: string | null;
      url?: string | null;
    },
    normalized: unknown = item,
  ) => {
    const artifact = await prepareArtifact({
      artifactType,
      kind,
      normalized,
      raw: item.raw,
      sourceId: item.sourceId,
      title: item.title,
      url: item.url,
      workspaceId: bundle.workspaceId,
    });
    artifacts.set(preparedKey(kind, item.sourceId), artifact);
    return artifact;
  };

  await Promise.all([
    ...bundle.people.map((item) =>
      add("person", SourceArtifactType.NOTION_PAGE, item),
    ),
    ...bundle.organizations.map((item) =>
      add("organization", SourceArtifactType.NOTION_PAGE, item),
    ),
    ...bundle.tasks.map((item) =>
      add("task", SourceArtifactType.NOTION_PAGE, item),
    ),
    ...bundle.documents.map((item) =>
      add("document", SourceArtifactType.NOTION_PAGE, item),
    ),
    ...bundle.collections.map((item) =>
      add("collection", SourceArtifactType.NOTION_DATABASE, item),
    ),
    ...bundle.collections.flatMap((collection) =>
      collection.records.map((item) =>
        add(
          `record:${collection.sourceId}`,
          SourceArtifactType.NOTION_PAGE,
          item,
        ),
      ),
    ),
    ...bundle.preservedArtifacts.map((item) =>
      add("preserved", item.artifactType, item),
    ),
    ...(bundle.export
      ? [add("export", SourceArtifactType.NOTION_EXPORT, bundle.export)]
      : []),
  ]);

  await Promise.all(
    bundle.attachments.map(async (item) => {
      const bytes = decodeBase64(item.base64);
      if (bytes.length > TASK_COMMENT_ATTACHMENT_MAX_BYTES) {
        throw new Error(
          `${item.fileName} exceeds the ${TASK_COMMENT_ATTACHMENT_MAX_BYTES}-byte file limit.`,
        );
      }
      const fileName = sanitizeTaskCommentAttachmentFileName(item.fileName);
      const contentType = normalizeTaskCommentAttachmentContentType(
        fileName,
        item.contentType,
      );
      if (!ALLOWED_TASK_COMMENT_ATTACHMENT_TYPES.has(contentType)) {
        throw new Error(`${fileName} has an unsupported file type.`);
      }
      if (!taskCommentAttachmentBytesMatchContentType(contentType, bytes)) {
        throw new Error(`${fileName} does not match its declared file type.`);
      }
      const bytesHash = createHash("sha256").update(bytes).digest("hex");
      const checksumSha256 = createHash("sha256")
        .update(bytes)
        .digest("base64");
      const artifact = await add(
        "attachment",
        SourceArtifactType.FILE_IMPORT,
        item,
        {
          collectionRecordSourceId: item.collectionRecordSourceId ?? null,
          collectionSourceId: item.collectionSourceId ?? null,
          contentHash: bytesHash,
          contentType,
          documentSourceId: item.documentSourceId ?? null,
          fileName,
          sizeBytes: bytes.length,
        },
      );
      attachments.set(item.sourceId, {
        artifact,
        bytes,
        checksumSha256,
        contentType,
        fileName,
        storageKey: `content-attachments/notion-${sourceDigest(
          `${bundle.workspaceId}:${item.sourceId}:${bytesHash}`,
        )}`,
      });
    }),
  );

  return { artifacts, attachments };
}

function getPreparedArtifact(
  prepared: Awaited<ReturnType<typeof prepareBundle>>,
  kind: string,
  sourceId: string,
): PreparedArtifact {
  const artifact = prepared.artifacts.get(preparedKey(kind, sourceId));
  if (!artifact)
    throw new Error(`Missing prepared artifact for ${kind}:${sourceId}`);
  return artifact;
}

function assertUniqueSourceIds(bundle: NotionImportBundle): void {
  const check = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) throw new Error(`Duplicate ${label} sourceId: ${id}`);
      seen.add(id);
    }
  };
  check(
    "person",
    bundle.people.map((item) => item.sourceId),
  );
  check(
    "organization",
    bundle.organizations.map((item) => item.sourceId),
  );
  check(
    "task",
    bundle.tasks.map((item) => item.sourceId),
  );
  check(
    "document",
    bundle.documents.map((item) => item.sourceId),
  );
  check(
    "collection",
    bundle.collections.map((item) => item.sourceId),
  );
  check(
    "attachment",
    bundle.attachments.map((item) => item.sourceId),
  );
  for (const collection of bundle.collections) {
    check(
      `record in ${collection.sourceId}`,
      collection.records.map((item) => item.sourceId),
    );
  }
}

function orderDocuments(bundle: NotionImportBundle) {
  const byId = new Map(
    bundle.documents.map((document) => [document.sourceId, document]),
  );
  const visited = new Set<string>();
  const active = new Set<string>();
  const ordered: typeof bundle.documents = [];
  const visit = (sourceId: string) => {
    if (visited.has(sourceId)) return;
    if (active.has(sourceId)) {
      throw new Error(`Document parent cycle includes ${sourceId}.`);
    }
    const document = byId.get(sourceId);
    if (!document) return;
    active.add(sourceId);
    if (document.parentSourceId && byId.has(document.parentSourceId)) {
      visit(document.parentSourceId);
    }
    active.delete(sourceId);
    visited.add(sourceId);
    ordered.push(document);
  };
  for (const document of bundle.documents) visit(document.sourceId);
  return ordered;
}

function assertAcyclicSourceGraph(input: {
  edges: Array<{ from: string; to: string }>;
  label: string;
}): void {
  const outgoing = new Map<string, string[]>();
  for (const edge of input.edges) {
    const targets = outgoing.get(edge.from) ?? [];
    targets.push(edge.to);
    outgoing.set(edge.from, targets);
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (sourceId: string) => {
    if (active.has(sourceId)) {
      throw new Error(`${input.label} cycle includes ${sourceId}.`);
    }
    if (visited.has(sourceId)) return;
    active.add(sourceId);
    for (const target of outgoing.get(sourceId) ?? []) visit(target);
    active.delete(sourceId);
    visited.add(sourceId);
  };
  for (const sourceId of outgoing.keys()) visit(sourceId);
}

function assertTaskSourceGraphs(bundle: NotionImportBundle): void {
  const sourceIds = new Set(bundle.tasks.map((task) => task.sourceId));
  assertAcyclicSourceGraph({
    label: "Task parent",
    edges: bundle.tasks.flatMap((task) =>
      task.parentSourceId && sourceIds.has(task.parentSourceId)
        ? [{ from: task.sourceId, to: task.parentSourceId }]
        : [],
    ),
  });
  assertAcyclicSourceGraph({
    label: "Task dependency",
    edges: bundle.tasks.flatMap((task) =>
      task.dependencySourceIds
        .filter((sourceId) => sourceIds.has(sourceId))
        .map((sourceId) => ({ from: sourceId, to: task.sourceId })),
    ),
  });
}

async function assertTaskImportGraph(
  bundle: NotionImportBundle,
  actorUserId: string,
): Promise<void> {
  if (!bundle.tasks.length) return;
  const localSourceIds = new Set(bundle.tasks.map((task) => task.sourceId));
  const referencedSourceIds = new Set(
    bundle.tasks.flatMap((task) => [
      task.sourceId,
      ...(task.parentSourceId ? [task.parentSourceId] : []),
      ...task.dependencySourceIds,
    ]),
  );
  const [referencedTasks, taskParents, dependencyEdges] = await Promise.all([
    prisma.task.findMany({
      where: {
        taskKey: {
          in: [...referencedSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "task", sourceId),
          ),
        },
      },
      select: {
        createdByUserId: true,
        id: true,
        status: true,
        taskKey: true,
      },
    }),
    prisma.task.findMany({
      where: { deletedAt: null },
      select: { id: true, parentTaskId: true },
    }),
    prisma.taskEdge.findMany({
      where: {
        deletedAt: null,
        edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
      },
      select: {
        calculationVersion: true,
        edgeType: true,
        fromTaskId: true,
        toTaskId: true,
      },
    }),
  ]);
  const sourceIdByTaskKey = new Map(
    [...referencedSourceIds].map((sourceId) => [
      stableSourceKey(bundle.workspaceId, "task", sourceId),
      sourceId,
    ]),
  );
  const taskBySourceId = new Map(
    referencedTasks.flatMap((task) => {
      const sourceId = task.taskKey
        ? sourceIdByTaskKey.get(task.taskKey)
        : undefined;
      return sourceId ? [[sourceId, task] as const] : [];
    }),
  );
  const nodeId = (sourceId: string): string => {
    const existing = taskBySourceId.get(sourceId);
    if (existing) return existing.id;
    if (!localSourceIds.has(sourceId)) {
      throw new Error(`Task source ${sourceId} was not found.`);
    }
    return `notion-import-new:${sourceDigest(
      `${bundle.workspaceId}:${sourceId}`,
    )}`;
  };

  for (const task of bundle.tasks) {
    const existing = taskBySourceId.get(task.sourceId);
    if (
      existing &&
      (existing.createdByUserId !== actorUserId ||
        existing.status !== TaskStatus.DRAFT)
    ) {
      throw new Error(
        "The imported task was already promoted or is owned by another user.",
      );
    }
    for (const relatedSourceId of [
      task.parentSourceId,
      ...task.dependencySourceIds,
    ].filter((value): value is string => Boolean(value))) {
      const related = taskBySourceId.get(relatedSourceId);
      if (related && !(await canUserViewTask(related.id, actorUserId))) {
        throw new Error("A related task is not accessible.");
      }
      nodeId(relatedSourceId);
    }
  }

  const importedNodeIds = new Set(
    bundle.tasks.map((task) => nodeId(task.sourceId)),
  );
  const proposedParentByTask = new Map(
    bundle.tasks.map((task) => [
      nodeId(task.sourceId),
      task.parentSourceId ? nodeId(task.parentSourceId) : null,
    ]),
  );
  assertAcyclicSourceGraph({
    label: "Task parent",
    edges: [
      ...taskParents.flatMap((task) => {
        const parentTaskId = proposedParentByTask.has(task.id)
          ? proposedParentByTask.get(task.id)
          : task.parentTaskId;
        return parentTaskId ? [{ from: task.id, to: parentTaskId }] : [];
      }),
      ...[...proposedParentByTask].flatMap(([taskId, parentTaskId]) =>
        taskParents.some((task) => task.id === taskId) || !parentTaskId
          ? []
          : [{ from: taskId, to: parentTaskId }],
      ),
    ],
  });
  const retainedDependencyEdges = dependencyEdges.filter(
    (edge) =>
      !(
        importedNodeIds.has(edge.toTaskId) &&
        edge.edgeType === TaskEdgeType.BLOCKS &&
        edge.calculationVersion === NOTION_IMPORT_EDGE_VERSION
      ),
  );
  assertAcyclicSourceGraph({
    label: "Task dependency",
    edges: [
      ...retainedDependencyEdges.map((edge) => ({
        from: edge.fromTaskId,
        to: edge.toTaskId,
      })),
      ...bundle.tasks.flatMap((task) =>
        task.dependencySourceIds.map((dependencySourceId) => ({
          from: nodeId(dependencySourceId),
          to: nodeId(task.sourceId),
        })),
      ),
    ],
  });
}

function taskDescription(task: NotionImportBundle["tasks"][number]): string {
  const description = task.description?.trim() || "";
  if (!task.acceptanceCriteria.length) return description;
  const criteria = task.acceptanceCriteria
    .map((item) => `- ${item.trim()}`)
    .join("\n");
  return [description, "## Acceptance criteria", criteria]
    .filter(Boolean)
    .join("\n\n");
}

function relationSignature(relations: Array<Record<string, unknown>>): string {
  return JSON.stringify(
    relations
      .map((relation) => ({
        fieldKey: relation.fieldKey,
        position: relation.position ?? 0,
        targetDocumentId: relation.targetDocumentId ?? null,
        targetOrganizationId: relation.targetOrganizationId ?? null,
        targetPersonId: relation.targetPersonId ?? null,
        targetRecordId: relation.targetRecordId ?? null,
        targetTaskId: relation.targetTaskId ?? null,
      }))
      .sort((left, right) =>
        `${left.fieldKey}:${left.position}:${JSON.stringify(left)}`.localeCompare(
          `${right.fieldKey}:${right.position}:${JSON.stringify(right)}`,
        ),
      ),
  );
}

function summarize(items: NotionImportItemResult[]) {
  const summary: Record<ImportAction, number> = {
    create: 0,
    error: 0,
    preserve: 0,
    unchanged: 0,
    update: 0,
  };
  for (const item of items) summary[item.action] += 1;
  return summary;
}

async function buildDryRun(input: {
  actorUserId: string;
  bundle: NotionImportBundle;
  prepared: Awaited<ReturnType<typeof prepareBundle>>;
}): Promise<NotionImportItemResult[]> {
  const { bundle, prepared } = input;
  const referencedTaskSourceIds = new Set(
    bundle.tasks.flatMap((task) => [
      task.sourceId,
      ...(task.parentSourceId ? [task.parentSourceId] : []),
      ...task.dependencySourceIds,
    ]),
  );
  const referencedDocumentSourceIds = new Set(
    bundle.documents.flatMap((document) => [
      document.sourceId,
      ...(document.parentSourceId ? [document.parentSourceId] : []),
    ]),
  );
  const referencedOrganizationSourceIds = new Set(
    bundle.organizations.map((organization) => organization.sourceId),
  );
  const referencedPersonSourceIds = new Set(
    bundle.people.map((person) => person.sourceId),
  );
  const referencedCollectionSourceIds = new Set(
    bundle.collections.map((collection) => collection.sourceId),
  );
  const referencedRecordSourceIds = new Set(
    bundle.collections.flatMap((collection) =>
      collection.records.map((record) => record.sourceId),
    ),
  );
  for (const document of bundle.documents) {
    if (document.organizationSourceId)
      referencedOrganizationSourceIds.add(document.organizationSourceId);
    if (document.taskSourceId)
      referencedTaskSourceIds.add(document.taskSourceId);
  }
  for (const collection of bundle.collections) {
    if (collection.organizationSourceId)
      referencedOrganizationSourceIds.add(collection.organizationSourceId);
    for (const field of collection.fields) {
      if (field.targetCollectionSourceId)
        referencedCollectionSourceIds.add(field.targetCollectionSourceId);
    }
    for (const record of collection.records) {
      if (record.documentSourceId)
        referencedDocumentSourceIds.add(record.documentSourceId);
      if (record.organizationSourceId)
        referencedOrganizationSourceIds.add(record.organizationSourceId);
      if (record.personSourceId)
        referencedPersonSourceIds.add(record.personSourceId);
      if (record.taskSourceId) referencedTaskSourceIds.add(record.taskSourceId);
      for (const relation of record.relations) {
        if (relation.targetCollectionSourceId)
          referencedCollectionSourceIds.add(relation.targetCollectionSourceId);
        if (relation.targetRecordSourceId)
          referencedRecordSourceIds.add(relation.targetRecordSourceId);
        if (relation.targetDocumentSourceId)
          referencedDocumentSourceIds.add(relation.targetDocumentSourceId);
        if (relation.targetOrganizationSourceId)
          referencedOrganizationSourceIds.add(
            relation.targetOrganizationSourceId,
          );
        if (relation.targetPersonSourceId)
          referencedPersonSourceIds.add(relation.targetPersonSourceId);
        if (relation.targetTaskSourceId)
          referencedTaskSourceIds.add(relation.targetTaskSourceId);
      }
    }
  }
  const [
    documents,
    collections,
    records,
    attachments,
    tasks,
    people,
    organizations,
    artifacts,
  ] = await Promise.all([
    prisma.document.findMany({
      where: {
        sourceKey: {
          in: [...referencedDocumentSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "document", sourceId),
          ),
        },
      },
      select: { id: true, requestHash: true, sourceKey: true },
    }),
    prisma.collection.findMany({
      where: {
        sourceKey: {
          in: [...referencedCollectionSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "collection", sourceId),
          ),
        },
      },
      select: {
        fields: {
          where: { deletedAt: null },
          select: { id: true, key: true },
        },
        id: true,
        requestHash: true,
        sourceKey: true,
        views: {
          where: { deletedAt: null },
          select: {
            filterJson: true,
            id: true,
            isDefault: true,
            name: true,
            sortJson: true,
            visibleFieldIds: true,
          },
        },
      },
    }),
    prisma.collectionRecord.findMany({
      where: {
        collection: {
          sourceKey: {
            in: [...referencedCollectionSourceIds].map((sourceId) =>
              stableSourceKey(bundle.workspaceId, "collection", sourceId),
            ),
          },
        },
        sourceKey: {
          in: [...referencedRecordSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "record", sourceId),
          ),
        },
      },
      select: {
        collection: { select: { sourceKey: true } },
        id: true,
        requestHash: true,
        sourceKey: true,
      },
    }),
    prisma.contentAttachment.findMany({
      where: {
        storageKey: {
          in: [...prepared.attachments.values()].map((item) => item.storageKey),
        },
      },
      select: {
        collectionRecordId: true,
        deletedAt: true,
        documentId: true,
        id: true,
        storageKey: true,
        uploadedAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        taskKey: {
          in: [...referencedTaskSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "task", sourceId),
          ),
        },
      },
      select: {
        contextJson: true,
        createdByUserId: true,
        id: true,
        status: true,
        taskKey: true,
      },
    }),
    prisma.person.findMany({
      where: {
        sourceRef: {
          in: [...referencedPersonSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "person", sourceId),
          ),
        },
      },
      select: { createdByUserId: true, id: true, sourceRef: true },
    }),
    prisma.organization.findMany({
      where: {
        sourceRef: {
          in: [...referencedOrganizationSourceIds].map((sourceId) =>
            stableSourceKey(bundle.workspaceId, "organization", sourceId),
          ),
        },
      },
      select: { creatorId: true, id: true, sourceRef: true },
    }),
    prisma.sourceArtifact.findMany({
      where: {
        sourceKey: {
          in: [...prepared.artifacts.values()].map((item) => item.sourceKey),
        },
        deletedAt: null,
      },
      select: { sourceKey: true },
    }),
  ]);
  const artifactKeys = new Set(artifacts.map((item) => item.sourceKey));
  const documentByKey = new Map(
    documents.map((item) => [item.sourceKey, item]),
  );
  const collectionByKey = new Map(
    collections.map((item) => [item.sourceKey, item]),
  );
  const recordByKey = new Map(
    records.map((item) => [
      `${item.collection.sourceKey}:${item.sourceKey}`,
      item,
    ]),
  );
  const attachmentByStorageKey = new Map(
    attachments.map((item) => [item.storageKey, item]),
  );
  const taskByKey = new Map(tasks.map((item) => [item.taskKey, item]));
  const personByKey = new Map(people.map((item) => [item.sourceRef, item]));
  const organizationByKey = new Map(
    organizations.map((item) => [item.sourceRef, item]),
  );
  const items: NotionImportItemResult[] = [];

  for (const person of bundle.people) {
    const artifact = getPreparedArtifact(prepared, "person", person.sourceId);
    const existing = personByKey.get(
      stableSourceKey(bundle.workspaceId, "person", person.sourceId),
    );
    items.push(
      existing && existing.createdByUserId !== input.actorUserId
        ? resultError(
            "person",
            person.sourceId,
            new Error(
              "An existing Person with this source is owned elsewhere.",
            ),
          )
        : {
            action: !existing
              ? "create"
              : artifactKeys.has(artifact.sourceKey)
                ? "unchanged"
                : "update",
            kind: "person",
            sourceId: person.sourceId,
            targetId: existing?.id,
          },
    );
  }
  for (const organization of bundle.organizations) {
    const artifact = getPreparedArtifact(
      prepared,
      "organization",
      organization.sourceId,
    );
    const existing = organizationByKey.get(
      stableSourceKey(
        bundle.workspaceId,
        "organization",
        organization.sourceId,
      ),
    );
    const canManageExisting = existing
      ? existing.creatorId === input.actorUserId ||
        (await canManageOrganization(input.actorUserId, existing.id))
      : true;
    items.push(
      canManageExisting
        ? {
            action: !existing
              ? "create"
              : artifactKeys.has(artifact.sourceKey)
                ? "unchanged"
                : "update",
            kind: "organization",
            sourceId: organization.sourceId,
            targetId: existing?.id,
          }
        : resultError(
            "organization",
            organization.sourceId,
            new Error(
              "An existing Organization with this source is owned elsewhere.",
            ),
          ),
    );
  }
  for (const task of bundle.tasks) {
    const artifact = getPreparedArtifact(prepared, "task", task.sourceId);
    const existing = taskByKey.get(
      stableSourceKey(bundle.workspaceId, "task", task.sourceId),
    );
    const importedHash =
      existing?.contextJson && typeof existing.contextJson === "object"
        ? (existing.contextJson as { notionImport?: { contentHash?: unknown } })
            .notionImport?.contentHash
        : null;
    items.push(
      existing &&
        (existing.createdByUserId !== input.actorUserId ||
          existing.status !== TaskStatus.DRAFT)
        ? resultError(
            "task",
            task.sourceId,
            new Error(
              "The imported task was already promoted or is owned by another user.",
            ),
          )
        : {
            action: !existing
              ? "create"
              : importedHash === artifact.contentHash
                ? "unchanged"
                : "update",
            kind: "task",
            sourceId: task.sourceId,
            targetId: existing?.id,
          },
    );
  }
  for (const document of bundle.documents) {
    const artifact = getPreparedArtifact(
      prepared,
      "document",
      document.sourceId,
    );
    const existing = documentByKey.get(
      stableSourceKey(bundle.workspaceId, "document", document.sourceId),
    );
    const canManageExisting = existing
      ? await assertDocumentAccess(
          existing.id,
          input.actorUserId,
          ContentAccessLevel.FULL_ACCESS,
        ).then(
          () => true,
          () => false,
        )
      : true;
    items.push(
      canManageExisting
        ? {
            action: !existing
              ? "create"
              : existing.requestHash === artifact.contentHash
                ? "unchanged"
                : "update",
            kind: "document",
            sourceId: document.sourceId,
            targetId: existing?.id,
          }
        : resultError(
            "document",
            document.sourceId,
            new Error(
              "An existing Document with this source is owned elsewhere.",
            ),
          ),
    );
  }
  for (const collection of bundle.collections) {
    const artifact = getPreparedArtifact(
      prepared,
      "collection",
      collection.sourceId,
    );
    const existing = collectionByKey.get(
      stableSourceKey(bundle.workspaceId, "collection", collection.sourceId),
    );
    const canManageExisting = existing
      ? await assertCollectionAccess(
          existing.id,
          input.actorUserId,
          ContentAccessLevel.FULL_ACCESS,
        ).then(
          () => true,
          () => false,
        )
      : true;
    items.push(
      canManageExisting
        ? {
            action: !existing
              ? "create"
              : existing.requestHash === artifact.contentHash
                ? "unchanged"
                : "update",
            kind: "collection",
            sourceId: collection.sourceId,
            targetId: existing?.id,
          }
        : resultError(
            "collection",
            collection.sourceId,
            new Error(
              "An existing Collection with this source is owned elsewhere.",
            ),
          ),
    );
    if (!canManageExisting) {
      for (const record of collection.records) {
        items.push(
          resultError(
            "record",
            `${collection.sourceId}:${record.sourceId}`,
            new Error("The source Collection is owned elsewhere."),
          ),
        );
      }
      for (const view of collection.views) {
        items.push(
          resultError(
            "view",
            `${collection.sourceId}:${view.name}`,
            new Error("The source Collection is owned elsewhere."),
          ),
        );
      }
      continue;
    }
    for (const record of collection.records) {
      const recordArtifact = getPreparedArtifact(
        prepared,
        `record:${collection.sourceId}`,
        record.sourceId,
      );
      const existingRecord = recordByKey.get(
        `${stableSourceKey(bundle.workspaceId, "collection", collection.sourceId)}:${stableSourceKey(
          bundle.workspaceId,
          "record",
          record.sourceId,
        )}`,
      );
      items.push({
        action: !existingRecord
          ? "create"
          : existingRecord.requestHash === recordArtifact.contentHash
            ? "unchanged"
            : "update",
        kind: "record",
        sourceId: `${collection.sourceId}:${record.sourceId}`,
        targetId: existingRecord?.id,
      });
    }
    for (const view of collection.views) {
      const existingView = existing?.views.find(
        (candidate) => candidate.name === view.name,
      );
      let action: NotionImportItemResult["action"] = existingView
        ? "update"
        : "create";
      if (existingView && existing) {
        const fieldByKey = new Map(
          existing.fields.map((field) => [field.key, field.id]),
        );
        const visibleFieldIds = view.visibleFieldKeys.flatMap((key) => {
          const fieldId = fieldByKey.get(key);
          return fieldId ? [fieldId] : [];
        });
        if (visibleFieldIds.length === view.visibleFieldKeys.length) {
          const [desiredHash, existingHash] = await Promise.all([
            sha256CanonicalJson({
              filter: view.filters,
              isDefault: view.isDefault,
              sort: view.sorts,
              visibleFieldIds,
            }),
            sha256CanonicalJson({
              filter: existingView.filterJson,
              isDefault: existingView.isDefault,
              sort: existingView.sortJson,
              visibleFieldIds: existingView.visibleFieldIds,
            }),
          ]);
          if (desiredHash === existingHash) action = "unchanged";
        }
      }
      items.push({
        action,
        kind: "view",
        sourceId: `${collection.sourceId}:${view.name}`,
        targetId: existingView?.id,
      });
    }
  }
  for (const attachment of bundle.attachments) {
    const preparedAttachment = prepared.attachments.get(attachment.sourceId);
    if (!preparedAttachment) throw new Error("Attachment was not prepared.");
    const existingAttachment = attachmentByStorageKey.get(
      preparedAttachment.storageKey,
    );
    const desiredDocumentId = attachment.documentSourceId
      ? (documentByKey.get(
          stableSourceKey(
            bundle.workspaceId,
            "document",
            attachment.documentSourceId,
          ),
        )?.id ?? null)
      : null;
    const desiredRecordId =
      attachment.collectionSourceId && attachment.collectionRecordSourceId
        ? (recordByKey.get(
            `${stableSourceKey(bundle.workspaceId, "collection", attachment.collectionSourceId)}:${stableSourceKey(
              bundle.workspaceId,
              "record",
              attachment.collectionRecordSourceId,
            )}`,
          )?.id ?? null)
        : null;
    const ownerMatches =
      existingAttachment?.documentId === desiredDocumentId &&
      existingAttachment?.collectionRecordId === desiredRecordId;
    const canMoveExisting =
      !existingAttachment ||
      ownerMatches ||
      (existingAttachment.documentId
        ? await assertDocumentAccess(
            existingAttachment.documentId,
            input.actorUserId,
            ContentAccessLevel.EDIT_CONTENT,
          ).then(
            () => true,
            () => false,
          )
        : existingAttachment.collectionRecordId
          ? await assertCollectionRecordAccess(
              existingAttachment.collectionRecordId,
              input.actorUserId,
              ContentAccessLevel.EDIT_CONTENT,
            ).then(
              () => true,
              () => false,
            )
          : false);
    if (!canMoveExisting) {
      items.push(
        resultError(
          "attachment",
          attachment.sourceId,
          new Error("The existing attachment is not accessible."),
        ),
      );
      continue;
    }
    items.push({
      action:
        existingAttachment?.uploadedAt &&
        !existingAttachment.deletedAt &&
        ownerMatches
          ? "unchanged"
          : existingAttachment
            ? "update"
            : "create",
      kind: "attachment",
      sourceId: attachment.sourceId,
      targetId: existingAttachment?.id,
    });
  }
  for (const artifact of bundle.preservedArtifacts) {
    const preparedArtifact = getPreparedArtifact(
      prepared,
      "preserved",
      artifact.sourceId,
    );
    items.push({
      action: artifactKeys.has(preparedArtifact.sourceKey)
        ? "unchanged"
        : "preserve",
      kind: "preservedArtifact",
      sourceId: artifact.sourceId,
    });
  }
  if (bundle.export) {
    const artifact = getPreparedArtifact(
      prepared,
      "export",
      bundle.export.sourceId,
    );
    items.push({
      action: artifactKeys.has(artifact.sourceKey) ? "unchanged" : "preserve",
      kind: "export",
      sourceId: bundle.export.sourceId,
    });
  }
  const localTaskSourceIds = new Set(bundle.tasks.map((task) => task.sourceId));
  const localDocumentSourceIds = new Set(
    bundle.documents.map((document) => document.sourceId),
  );
  const localOrganizationSourceIds = new Set(
    bundle.organizations.map((organization) => organization.sourceId),
  );
  const localPersonSourceIds = new Set(
    bundle.people.map((person) => person.sourceId),
  );
  const localCollectionSourceIds = new Set(
    bundle.collections.map((collection) => collection.sourceId),
  );
  const localRecordSources = new Set(
    bundle.collections.flatMap((collection) =>
      collection.records.map(
        (record) => `${collection.sourceId}:${record.sourceId}`,
      ),
    ),
  );
  const sourceExists = (
    kind: "collection" | "document" | "organization" | "person" | "task",
    sourceId: string,
  ) => {
    if (kind === "task")
      return (
        localTaskSourceIds.has(sourceId) ||
        taskByKey.has(stableSourceKey(bundle.workspaceId, "task", sourceId))
      );
    if (kind === "document")
      return (
        localDocumentSourceIds.has(sourceId) ||
        documentByKey.has(
          stableSourceKey(bundle.workspaceId, "document", sourceId),
        )
      );
    if (kind === "organization")
      return (
        localOrganizationSourceIds.has(sourceId) ||
        organizationByKey.has(
          stableSourceKey(bundle.workspaceId, "organization", sourceId),
        )
      );
    if (kind === "person")
      return (
        localPersonSourceIds.has(sourceId) ||
        personByKey.has(stableSourceKey(bundle.workspaceId, "person", sourceId))
      );
    return (
      localCollectionSourceIds.has(sourceId) ||
      collectionByKey.has(
        stableSourceKey(bundle.workspaceId, "collection", sourceId),
      )
    );
  };
  const recordSourceExists = (
    collectionSourceId: string,
    recordSourceId: string,
  ) =>
    localRecordSources.has(`${collectionSourceId}:${recordSourceId}`) ||
    recordByKey.has(
      `${stableSourceKey(bundle.workspaceId, "collection", collectionSourceId)}:${stableSourceKey(
        bundle.workspaceId,
        "record",
        recordSourceId,
      )}`,
    );
  const markError = (
    kind: NotionImportItemResult["kind"],
    sourceId: string,
    message: string,
  ) => {
    const item = items.find(
      (candidate) => candidate.kind === kind && candidate.sourceId === sourceId,
    );
    if (!item) {
      items.push(resultError(kind, sourceId, new Error(message)));
    } else if (item.action !== "error") {
      Object.assign(item, resultError(kind, sourceId, new Error(message)));
    }
  };
  const requireSource = (
    ownerKind: NotionImportItemResult["kind"],
    ownerSourceId: string,
    targetKind: "collection" | "document" | "organization" | "person" | "task",
    targetSourceId: string | null | undefined,
  ) => {
    if (targetSourceId && !sourceExists(targetKind, targetSourceId)) {
      markError(
        ownerKind,
        ownerSourceId,
        `${targetKind} source ${targetSourceId} was not found.`,
      );
    }
  };

  for (const task of bundle.tasks) {
    requireSource("task", task.sourceId, "task", task.parentSourceId);
    for (const dependencySourceId of task.dependencySourceIds) {
      requireSource("task", task.sourceId, "task", dependencySourceId);
    }
  }
  for (const document of bundle.documents) {
    requireSource(
      "document",
      document.sourceId,
      "document",
      document.parentSourceId,
    );
    requireSource(
      "document",
      document.sourceId,
      "organization",
      document.organizationSourceId,
    );
    requireSource("document", document.sourceId, "task", document.taskSourceId);
  }
  for (const collection of bundle.collections) {
    requireSource(
      "collection",
      collection.sourceId,
      "organization",
      collection.organizationSourceId,
    );
    const fieldKeys = new Set(collection.fields.map((field) => field.key));
    for (const field of collection.fields) {
      requireSource(
        "collection",
        collection.sourceId,
        "collection",
        field.targetCollectionSourceId,
      );
    }
    for (const view of collection.views) {
      const sourceId = `${collection.sourceId}:${view.name}`;
      const referencedKeys = [
        ...view.visibleFieldKeys,
        ...view.filters.map((filter) => filter.fieldKey),
        ...view.sorts.map((sort) => sort.fieldKey),
      ];
      if (referencedKeys.some((key) => !fieldKeys.has(key))) {
        markError("view", sourceId, "View references an unknown field key.");
      }
    }
    for (const record of collection.records) {
      const sourceId = `${collection.sourceId}:${record.sourceId}`;
      requireSource("record", sourceId, "document", record.documentSourceId);
      requireSource(
        "record",
        sourceId,
        "organization",
        record.organizationSourceId,
      );
      requireSource("record", sourceId, "person", record.personSourceId);
      requireSource("record", sourceId, "task", record.taskSourceId);
      for (const relation of record.relations) {
        requireSource(
          "record",
          sourceId,
          "document",
          relation.targetDocumentSourceId,
        );
        requireSource(
          "record",
          sourceId,
          "organization",
          relation.targetOrganizationSourceId,
        );
        requireSource(
          "record",
          sourceId,
          "person",
          relation.targetPersonSourceId,
        );
        requireSource("record", sourceId, "task", relation.targetTaskSourceId);
        if (
          relation.targetCollectionSourceId &&
          relation.targetRecordSourceId &&
          !recordSourceExists(
            relation.targetCollectionSourceId,
            relation.targetRecordSourceId,
          )
        ) {
          markError(
            "record",
            sourceId,
            `record source ${relation.targetRecordSourceId} was not found.`,
          );
        }
      }
    }
  }
  for (const attachment of bundle.attachments) {
    if (attachment.documentSourceId) {
      requireSource(
        "attachment",
        attachment.sourceId,
        "document",
        attachment.documentSourceId,
      );
    } else if (
      attachment.collectionSourceId &&
      attachment.collectionRecordSourceId &&
      !recordSourceExists(
        attachment.collectionSourceId,
        attachment.collectionRecordSourceId,
      )
    ) {
      markError(
        "attachment",
        attachment.sourceId,
        `record source ${attachment.collectionRecordSourceId} was not found.`,
      );
    }
  }
  return items;
}

function resultError(
  kind: NotionImportItemResult["kind"],
  sourceId: string,
  error: unknown,
): NotionImportItemResult {
  return {
    action: "error",
    kind,
    message: error instanceof Error ? error.message : "Import failed.",
    sourceId,
  };
}

export async function importNotionBundle(input: {
  actorUserId: string;
  bundle: unknown;
  dryRun?: boolean;
}) {
  const bundle = notionImportBundleSchema.parse(input.bundle);
  assertUniqueSourceIds(bundle);
  orderDocuments(bundle);
  assertTaskSourceGraphs(bundle);
  const actor = await prisma.user.findFirst({
    where: { deletedAt: null, id: input.actorUserId },
    select: { id: true, personId: true },
  });
  if (!actor) throw new Error("Unauthorized");
  const prepared = await prepareBundle(bundle);
  const reviewItems = await buildDryRun({
    actorUserId: actor.id,
    bundle,
    prepared,
  });
  const reviewSummary = summarize(reviewItems);
  if (input.dryRun !== false || reviewSummary.error > 0) {
    return {
      dryRun: input.dryRun !== false,
      hasErrors: reviewSummary.error > 0,
      items: reviewItems,
      summary: reviewSummary,
      workspaceId: bundle.workspaceId,
    };
  }
  try {
    await assertTaskImportGraph(bundle, actor.id);
  } catch (error) {
    const items = reviewItems.map((item) =>
      item.kind === "task" ? resultError("task", item.sourceId, error) : item,
    );
    return {
      dryRun: false,
      hasErrors: true,
      items,
      summary: summarize(items),
      workspaceId: bundle.workspaceId,
    };
  }

  const items: NotionImportItemResult[] = [];
  const personIds = new Map<string, string>();
  const organizationIds = new Map<string, string>();
  const taskIds = new Map<string, string>();
  const taskItems = new Map<string, NotionImportItemResult>();
  const documentIds = new Map<string, string>();
  const collectionStates = new Map<string, CollectionState>();
  const recordStates = new Map<string, RecordState>();

  for (const person of bundle.people) {
    try {
      const artifact = getPreparedArtifact(prepared, "person", person.sourceId);
      const imported = await prisma.$transaction(async (tx) => {
        const sourceRef = stableSourceKey(
          bundle.workspaceId,
          "person",
          person.sourceId,
        );
        const [existing, existingArtifact] = await Promise.all([
          tx.person.findUnique({ where: { sourceRef } }),
          tx.sourceArtifact.findUnique({
            where: { sourceKey: artifact.sourceKey },
          }),
        ]);
        if (existing && existing.createdByUserId !== actor.id) {
          throw new Error(
            "An existing Person with this source is owned elsewhere.",
          );
        }
        await ensureArtifact(tx, artifact);
        if (existing && existingArtifact) {
          return { action: "unchanged" as const, id: existing.id };
        }
        const row = existing
          ? await tx.person.update({
              where: { id: existing.id },
              data: {
                bio: person.bio ?? null,
                deletedAt: null,
                displayName: person.displayName,
                email: person.email ?? null,
                sourceUrl: person.url ?? null,
              },
            })
          : await tx.person.create({
              data: {
                bio: person.bio ?? null,
                createdByUserId: actor.id,
                displayName: person.displayName,
                email: person.email ?? null,
                isPublic: false,
                sourceRef,
                sourceUrl: person.url ?? null,
              },
            });
        return {
          action: existing ? ("update" as const) : ("create" as const),
          id: row.id,
        };
      });
      personIds.set(person.sourceId, imported.id);
      items.push({
        action: imported.action,
        kind: "person",
        sourceId: person.sourceId,
        targetId: imported.id,
      });
    } catch (error) {
      items.push(resultError("person", person.sourceId, error));
    }
  }

  for (const organization of bundle.organizations) {
    try {
      const artifact = getPreparedArtifact(
        prepared,
        "organization",
        organization.sourceId,
      );
      const imported = await prisma.$transaction(async (tx) => {
        const sourceRef = stableSourceKey(
          bundle.workspaceId,
          "organization",
          organization.sourceId,
        );
        const [existing, existingArtifact] = await Promise.all([
          tx.organization.findUnique({ where: { sourceRef } }),
          tx.sourceArtifact.findUnique({
            where: { sourceKey: artifact.sourceKey },
          }),
        ]);
        if (
          existing &&
          existing.creatorId !== actor.id &&
          !(await canManageOrganization(actor.id, existing.id, tx))
        ) {
          throw new Error(
            "An existing Organization with this source is owned elsewhere.",
          );
        }
        await ensureArtifact(tx, artifact);
        if (existing && existingArtifact) {
          return { action: "unchanged" as const, id: existing.id };
        }
        if (existing) {
          const row = await tx.organization.update({
            where: { id: existing.id },
            data: {
              contactEmail: organization.contactEmail ?? null,
              deletedAt: null,
              description: organization.description ?? null,
              name: organization.name,
              sourceUrl: organization.url ?? null,
              type: organization.type,
              website: organization.website ?? null,
            },
          });
          return { action: "update" as const, id: row.id };
        }
        const requestedSlug = slugify(organization.slug ?? organization.name);
        const baseSlug =
          requestedSlug ||
          `organization-${sourceDigest(organization.sourceId).slice(0, 8)}`;
        const occupied = await tx.organization.findUnique({
          where: { slug: baseSlug },
        });
        const slug = occupied
          ? `${baseSlug}-${sourceDigest(organization.sourceId).slice(0, 8)}`
          : baseSlug;
        const row = await tx.organization.create({
          data: {
            contactEmail: organization.contactEmail ?? null,
            creatorId: actor.id,
            description: organization.description ?? null,
            name: organization.name,
            slug,
            sourceRef,
            sourceUrl: organization.url ?? null,
            status: OrgStatus.PENDING,
            type: organization.type,
            website: organization.website ?? null,
            members: { create: { role: "owner", userId: actor.id } },
          },
        });
        return { action: "create" as const, id: row.id };
      });
      organizationIds.set(organization.sourceId, imported.id);
      items.push({
        action: imported.action,
        kind: "organization",
        sourceId: organization.sourceId,
        targetId: imported.id,
      });
    } catch (error) {
      items.push(resultError("organization", organization.sourceId, error));
    }
  }

  for (const task of bundle.tasks) {
    try {
      const artifact = getPreparedArtifact(prepared, "task", task.sourceId);
      const imported = await prisma.$transaction(async (tx) => {
        const taskKey = stableSourceKey(
          bundle.workspaceId,
          "task",
          task.sourceId,
        );
        const existing = await tx.task.findUnique({ where: { taskKey } });
        if (
          existing &&
          (existing.createdByUserId !== actor.id ||
            existing.status !== TaskStatus.DRAFT)
        ) {
          throw new Error(
            "The imported task was already promoted or is owned by another user.",
          );
        }
        const sourceArtifact = await ensureArtifact(tx, artifact);
        const existingHash =
          existing?.contextJson && typeof existing.contextJson === "object"
            ? (
                existing.contextJson as {
                  notionImport?: { contentHash?: unknown };
                }
              ).notionImport?.contentHash
            : null;
        const contextJson = cleanJson({
          notionImport: {
            contentHash: artifact.contentHash,
            dependencySourceIds: task.dependencySourceIds,
            parentSourceId: task.parentSourceId ?? null,
            sourceArtifactKey: artifact.sourceKey,
            sourceId: task.sourceId,
          },
        });
        const row =
          existing && existingHash === artifact.contentHash
            ? existing
            : existing
              ? await tx.task.update({
                  where: { id: existing.id },
                  data: {
                    assigneePersonId: actor.personId,
                    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
                    contextJson,
                    deletedAt: null,
                    description: taskDescription(task),
                    dueAt: task.dueAt ? new Date(task.dueAt) : null,
                    estimatedEffortHours: task.estimatedEffortHours ?? null,
                    isPublic: false,
                    title: task.title,
                  },
                })
              : await tx.task.create({
                  data: {
                    assigneePersonId: actor.personId,
                    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
                    contextJson,
                    createdByUserId: actor.id,
                    description: taskDescription(task),
                    dueAt: task.dueAt ? new Date(task.dueAt) : null,
                    estimatedEffortHours: task.estimatedEffortHours ?? null,
                    isPublic: false,
                    parentTaskId: null,
                    status: TaskStatus.DRAFT,
                    taskKey,
                    title: task.title,
                  },
                });
        await tx.taskSourceArtifact.updateMany({
          where: { deletedAt: null, isPrimary: true, taskId: row.id },
          data: { isPrimary: false },
        });
        await tx.taskSourceArtifact.upsert({
          where: {
            taskId_sourceArtifactId: {
              sourceArtifactId: sourceArtifact.id,
              taskId: row.id,
            },
          },
          create: {
            isPrimary: true,
            sourceArtifactId: sourceArtifact.id,
            taskId: row.id,
          },
          update: { deletedAt: null, isPrimary: true },
        });
        return {
          action: !existing
            ? ("create" as const)
            : existingHash === artifact.contentHash
              ? ("unchanged" as const)
              : ("update" as const),
          id: row.id,
        };
      });
      taskIds.set(task.sourceId, imported.id);
      const item: NotionImportItemResult = {
        action: imported.action,
        kind: "task",
        sourceId: task.sourceId,
        targetId: imported.id,
      };
      items.push(item);
      taskItems.set(task.sourceId, item);
    } catch (error) {
      items.push(resultError("task", task.sourceId, error));
    }
  }

  const resolveMappedId = async (input: {
    directId?: string | null;
    kind: "collection" | "document" | "organization" | "person" | "task";
    map: Map<string, string>;
    sourceId?: string | null;
  }): Promise<string | null> => {
    if (input.directId && input.sourceId) {
      throw new Error(
        `Specify a direct ${input.kind} ID or source ID, not both.`,
      );
    }
    if (input.directId) return input.directId;
    if (!input.sourceId) return null;
    const mapped = input.map.get(input.sourceId);
    if (mapped) return mapped;
    const key = stableSourceKey(bundle.workspaceId, input.kind, input.sourceId);
    if (input.kind === "collection") {
      return (
        (await prisma.collection.findUnique({ where: { sourceKey: key } }))
          ?.id ?? null
      );
    }
    if (input.kind === "document") {
      return (
        (await prisma.document.findUnique({ where: { sourceKey: key } }))?.id ??
        null
      );
    }
    if (input.kind === "organization") {
      return (
        (await prisma.organization.findUnique({ where: { sourceRef: key } }))
          ?.id ?? null
      );
    }
    if (input.kind === "person") {
      return (
        (await prisma.person.findUnique({ where: { sourceRef: key } }))?.id ??
        null
      );
    }
    return (
      (await prisma.task.findUnique({ where: { taskKey: key } }))?.id ?? null
    );
  };
  const resolveRecordMappedId = async (input: {
    collectionSourceId: string;
    recordSourceId: string;
  }): Promise<string | null> => {
    const imported = recordStates.get(
      `${input.collectionSourceId}:${input.recordSourceId}`,
    )?.result.id;
    if (imported) return imported;
    const collectionId = await resolveMappedId({
      kind: "collection",
      map: new Map(
        [...collectionStates].map(([sourceId, state]) => [
          sourceId,
          state.view.collection.id,
        ]),
      ),
      sourceId: input.collectionSourceId,
    });
    if (!collectionId) return null;
    return (
      (
        await prisma.collectionRecord.findUnique({
          where: {
            collectionId_sourceKey: {
              collectionId,
              sourceKey: stableSourceKey(
                bundle.workspaceId,
                "record",
                input.recordSourceId,
              ),
            },
          },
          select: { id: true },
        })
      )?.id ?? null
    );
  };

  const resolvedTaskLinks: Array<{
    dependencyTaskIds: string[];
    parentTaskId: string | null;
    sourceId: string;
    taskId: string;
  }> = [];
  for (const task of bundle.tasks) {
    const taskId = taskIds.get(task.sourceId);
    if (!taskId) continue;
    try {
      const parentTaskId = await resolveMappedId({
        kind: "task",
        map: taskIds,
        sourceId: task.parentSourceId,
      });
      if (task.parentSourceId && !parentTaskId) {
        throw new Error(`Parent task ${task.parentSourceId} was not imported.`);
      }
      const dependencyTaskIds = [
        ...new Set(
          await Promise.all(
            task.dependencySourceIds.map(async (sourceId) => {
              const dependencyTaskId = await resolveMappedId({
                kind: "task",
                map: taskIds,
                sourceId,
              });
              if (!dependencyTaskId) {
                throw new Error(
                  `Dependency task ${sourceId} was not imported.`,
                );
              }
              return dependencyTaskId;
            }),
          ),
        ),
      ];
      for (const relatedTaskId of [parentTaskId, ...dependencyTaskIds].filter(
        (value): value is string => Boolean(value),
      )) {
        if (!(await canUserViewTask(relatedTaskId, actor.id))) {
          throw new Error("A related task is not accessible.");
        }
      }
      resolvedTaskLinks.push({
        dependencyTaskIds,
        parentTaskId,
        sourceId: task.sourceId,
        taskId,
      });
    } catch (error) {
      const item = taskItems.get(task.sourceId);
      if (item) Object.assign(item, resultError("task", task.sourceId, error));
    }
  }

  if (resolvedTaskLinks.length) {
    const importedTaskIds = new Set(
      resolvedTaskLinks.map((task) => task.taskId),
    );
    const [taskParents, dependencyEdges] = await Promise.all([
      prisma.task.findMany({
        where: { deletedAt: null },
        select: { id: true, parentTaskId: true },
      }),
      prisma.taskEdge.findMany({
        where: {
          deletedAt: null,
          edgeType: { in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON] },
        },
        select: {
          calculationVersion: true,
          edgeType: true,
          fromTaskId: true,
          toTaskId: true,
        },
      }),
    ]);
    const proposedParentByTask = new Map(
      resolvedTaskLinks.map((task) => [task.taskId, task.parentTaskId]),
    );
    assertAcyclicSourceGraph({
      label: "Task parent",
      edges: taskParents.flatMap((task) => {
        const parentTaskId = proposedParentByTask.has(task.id)
          ? proposedParentByTask.get(task.id)
          : task.parentTaskId;
        return parentTaskId ? [{ from: task.id, to: parentTaskId }] : [];
      }),
    });
    const retainedDependencyEdges = dependencyEdges.filter(
      (edge) =>
        !(
          importedTaskIds.has(edge.toTaskId) &&
          edge.edgeType === TaskEdgeType.BLOCKS &&
          edge.calculationVersion === NOTION_IMPORT_EDGE_VERSION
        ),
    );
    assertAcyclicSourceGraph({
      label: "Task dependency",
      edges: [
        ...retainedDependencyEdges.map((edge) => ({
          from: edge.fromTaskId,
          to: edge.toTaskId,
        })),
        ...resolvedTaskLinks.flatMap((task) =>
          task.dependencyTaskIds.map((dependencyTaskId) => ({
            from: dependencyTaskId,
            to: task.taskId,
          })),
        ),
      ],
    });

    await prisma.$transaction(async (tx) => {
      for (const task of resolvedTaskLinks) {
        const current = await tx.task.findFirst({
          where: {
            createdByUserId: actor.id,
            deletedAt: null,
            id: task.taskId,
            status: TaskStatus.DRAFT,
          },
          select: { id: true, parentTaskId: true },
        });
        if (!current) {
          throw new Error("An imported task changed before links were saved.");
        }
        if (current.parentTaskId !== task.parentTaskId) {
          await tx.task.update({
            where: { id: current.id },
            data: { parentTaskId: task.parentTaskId },
          });
          const item = taskItems.get(task.sourceId);
          if (item?.action === "unchanged") item.action = "update";
        }
        const existingEdges = await tx.taskEdge.findMany({
          where: {
            edgeType: TaskEdgeType.BLOCKS,
            toTaskId: current.id,
          },
          select: {
            calculationVersion: true,
            deletedAt: true,
            fromTaskId: true,
          },
        });
        const desiredDependencies = new Set(task.dependencyTaskIds);
        const activeDependencies = new Set(
          existingEdges
            .filter((edge) => !edge.deletedAt)
            .map((edge) => edge.fromTaskId),
        );
        const activeImportedDependencies = new Set(
          existingEdges
            .filter(
              (edge) =>
                !edge.deletedAt &&
                edge.calculationVersion === NOTION_IMPORT_EDGE_VERSION,
            )
            .map((edge) => edge.fromTaskId),
        );
        const edgesChanged =
          [...desiredDependencies].some(
            (dependencyTaskId) => !activeDependencies.has(dependencyTaskId),
          ) ||
          [...activeImportedDependencies].some(
            (dependencyTaskId) => !desiredDependencies.has(dependencyTaskId),
          );
        await tx.taskEdge.updateMany({
          where: {
            calculationVersion: NOTION_IMPORT_EDGE_VERSION,
            edgeType: TaskEdgeType.BLOCKS,
            toTaskId: current.id,
            ...(task.dependencyTaskIds.length
              ? { fromTaskId: { notIn: task.dependencyTaskIds } }
              : {}),
          },
          data: { deletedAt: new Date() },
        });
        for (const dependencyTaskId of task.dependencyTaskIds) {
          const key = {
            edgeType: TaskEdgeType.BLOCKS,
            fromTaskId: dependencyTaskId,
            toTaskId: current.id,
          };
          const existing = await tx.taskEdge.findUnique({
            where: { fromTaskId_toTaskId_edgeType: key },
          });
          if (existing) {
            const action = importedDependencyEdgeAction(existing);
            if (action === "preserve") continue;
            if (action === "conflict") {
              throw new Error(
                "A deleted non-Notion dependency occupies this task edge.",
              );
            }
            await tx.taskEdge.update({
              where: { id: existing.id },
              data: { deletedAt: null },
            });
          } else {
            await tx.taskEdge.create({
              data: { ...key, calculationVersion: NOTION_IMPORT_EDGE_VERSION },
            });
          }
        }
        if (edgesChanged) {
          const item = taskItems.get(task.sourceId);
          if (item?.action === "unchanged") item.action = "update";
        }
      }
    });
  }

  for (const document of orderDocuments(bundle)) {
    try {
      const artifact = getPreparedArtifact(
        prepared,
        "document",
        document.sourceId,
      );
      const parentDocumentId = await resolveMappedId({
        kind: "document",
        map: documentIds,
        sourceId: document.parentSourceId,
      });
      if (document.parentSourceId && !parentDocumentId) {
        throw new Error(
          `Parent document ${document.parentSourceId} was not imported.`,
        );
      }
      const organizationId = await resolveMappedId({
        directId: document.organizationId,
        kind: "organization",
        map: organizationIds,
        sourceId: document.organizationSourceId,
      });
      const taskId = await resolveMappedId({
        directId: document.taskId,
        kind: "task",
        map: taskIds,
        sourceId: document.taskSourceId,
      });
      const sourceArtifact = await prisma.$transaction((tx) =>
        ensureArtifact(tx, artifact),
      );
      const sourceKey = stableSourceKey(
        bundle.workspaceId,
        "document",
        document.sourceId,
      );
      const existing = await prisma.document.findUnique({
        where: { sourceKey },
      });
      const view = !existing
        ? await createDocument({
            body: document.markdown,
            createdByUserId: actor.id,
            organizationId,
            parentDocumentId,
            requestHash: artifact.contentHash,
            sourceArtifactId: sourceArtifact.id,
            sourceKey,
            sourceUrl: document.url,
            taskId,
            title: document.title,
            visibility: document.visibility,
          })
        : existing.requestHash === artifact.contentHash
          ? await getDocumentForViewer(existing.id, actor.id)
          : await updateDocument({
              body: document.markdown,
              documentId: existing.id,
              editorUserId: actor.id,
              expectedVersion: existing.version,
              organizationId,
              parentDocumentId,
              requestHash: artifact.contentHash,
              sourceArtifactId: sourceArtifact.id,
              sourceUrl: document.url,
              taskId,
              title: document.title,
              visibility: document.visibility,
            });
      if (!view) throw new Error("Imported document is not accessible.");
      documentIds.set(document.sourceId, view.document.id);
      items.push({
        action: !existing
          ? "create"
          : existing.requestHash === artifact.contentHash
            ? "unchanged"
            : "update",
        kind: "document",
        sourceId: document.sourceId,
        targetId: view.document.id,
      });
    } catch (error) {
      items.push(resultError("document", document.sourceId, error));
    }
  }

  for (const collection of bundle.collections) {
    try {
      const artifact = getPreparedArtifact(
        prepared,
        "collection",
        collection.sourceId,
      );
      const organizationId = await resolveMappedId({
        directId: collection.organizationId,
        kind: "organization",
        map: organizationIds,
        sourceId: collection.organizationSourceId,
      });
      const sourceArtifact = await prisma.$transaction((tx) =>
        ensureArtifact(tx, artifact),
      );
      const sourceKey = stableSourceKey(
        bundle.workspaceId,
        "collection",
        collection.sourceId,
      );
      const existing = await prisma.collection.findUnique({
        where: { sourceKey },
      });
      const view = existing
        ? await getCollectionForViewer(existing.id, actor.id)
        : await createCollection({
            createdByUserId: actor.id,
            description: collection.description,
            fields: [],
            organizationId,
            sourceArtifactId: sourceArtifact.id,
            sourceKey,
            sourceUrl: collection.url,
            visibility: collection.visibility,
            name: collection.name,
          });
      if (!view) throw new Error("Imported collection is not accessible.");
      collectionStates.set(collection.sourceId, {
        artifact,
        collection,
        existed: Boolean(existing),
        needsSync: !existing || existing.requestHash !== artifact.contentHash,
        view,
      });
    } catch (error) {
      items.push(resultError("collection", collection.sourceId, error));
    }
  }

  for (const [sourceId, state] of collectionStates) {
    try {
      let view = state.view;
      if (state.needsSync) {
        const sourceArtifact = await prisma.sourceArtifact.findUniqueOrThrow({
          where: { sourceKey: state.artifact.sourceKey },
        });
        const fields: CollectionFieldInput[] = [];
        for (const field of state.collection.fields) {
          const targetCollectionId = await resolveMappedId({
            directId: field.targetCollectionId,
            kind: "collection",
            map: new Map(
              [...collectionStates].map(([key, value]) => [
                key,
                value.view.collection.id,
              ]),
            ),
            sourceId: field.targetCollectionSourceId,
          });
          if (field.targetCollectionSourceId && !targetCollectionId) {
            throw new Error(
              `Target collection ${field.targetCollectionSourceId} was not imported.`,
            );
          }
          fields.push({
            key: field.key,
            name: field.name,
            optionsJson: field.optionsJson,
            position: field.position,
            required: field.required,
            targetCollectionId,
            type: field.type,
          });
        }
        view = await updateCollection({
          collectionId: view.collection.id,
          description: state.collection.description,
          editorUserId: actor.id,
          expectedVersion: view.collection.version,
          fields,
          name: state.collection.name,
          organizationId: view.collection.organizationId,
          requestHash: state.artifact.contentHash,
          sourceArtifactId: sourceArtifact.id,
          sourceUrl: state.collection.url,
          visibility: state.collection.visibility,
        });
        state.view = view;
      }
      items.push({
        action: state.existed
          ? state.needsSync
            ? "update"
            : "unchanged"
          : "create",
        kind: "collection",
        sourceId,
        targetId: view.collection.id,
      });
    } catch (error) {
      items.push(resultError("collection", sourceId, error));
      collectionStates.delete(sourceId);
    }
  }

  for (const [collectionSourceId, state] of collectionStates) {
    for (const record of state.collection.records) {
      const recordKey = `${collectionSourceId}:${record.sourceId}`;
      try {
        const artifact = getPreparedArtifact(
          prepared,
          `record:${collectionSourceId}`,
          record.sourceId,
        );
        const sourceArtifact = await prisma.$transaction((tx) =>
          ensureArtifact(tx, artifact),
        );
        const sourceKey = stableSourceKey(
          bundle.workspaceId,
          "record",
          record.sourceId,
        );
        const existing = await prisma.collectionRecord.findUnique({
          where: {
            collectionId_sourceKey: {
              collectionId: state.view.collection.id,
              sourceKey,
            },
          },
        });
        const canonical = {
          documentId: await resolveMappedId({
            directId: record.documentId,
            kind: "document",
            map: documentIds,
            sourceId: record.documentSourceId,
          }),
          organizationId: await resolveMappedId({
            directId: record.organizationId,
            kind: "organization",
            map: organizationIds,
            sourceId: record.organizationSourceId,
          }),
          personId: await resolveMappedId({
            directId: record.personId,
            kind: "person",
            map: personIds,
            sourceId: record.personSourceId,
          }),
          taskId: await resolveMappedId({
            directId: record.taskId,
            kind: "task",
            map: taskIds,
            sourceId: record.taskSourceId,
          }),
        };
        const result = !existing
          ? await createCollectionRecord({
              allowImportedComputedValues: true,
              ...canonical,
              collectionId: state.view.collection.id,
              createdByUserId: actor.id,
              requestHash: artifact.contentHash,
              sourceArtifactId: sourceArtifact.id,
              sourceKey,
              sourceUrl: record.url,
              values: record.values,
            })
          : existing.requestHash === artifact.contentHash
            ? await getCollectionRecordForViewer(existing.id, actor.id)
            : await updateCollectionRecord({
                allowImportedComputedValues: true,
                ...canonical,
                editorUserId: actor.id,
                expectedVersion: existing.version,
                recordId: existing.id,
                requestHash: artifact.contentHash,
                sourceArtifactId: sourceArtifact.id,
                sourceUrl: record.url,
                values: record.values,
              });
        if (!result) throw new Error("Imported record is not accessible.");
        recordStates.set(recordKey, {
          action: !existing
            ? "create"
            : existing.requestHash === artifact.contentHash
              ? "unchanged"
              : "update",
          collection: state.collection,
          record,
          result,
        });
      } catch (error) {
        items.push(resultError("record", recordKey, error));
      }
    }
  }

  for (const [recordKey, state] of recordStates) {
    try {
      const desired: CollectionRelationInput[] = [];
      for (const relation of state.record.relations) {
        const targetRecordId = relation.targetRecordSourceId
          ? await resolveRecordMappedId({
              collectionSourceId: relation.targetCollectionSourceId as string,
              recordSourceId: relation.targetRecordSourceId,
            })
          : (relation.targetRecordId ?? null);
        if (relation.targetRecordSourceId && !targetRecordId) {
          throw new Error(
            `Target record ${relation.targetRecordSourceId} was not imported.`,
          );
        }
        desired.push({
          fieldKey: relation.fieldKey,
          position: relation.position,
          targetDocumentId:
            (await resolveMappedId({
              directId: relation.targetDocumentId,
              kind: "document",
              map: documentIds,
              sourceId: relation.targetDocumentSourceId,
            })) ?? undefined,
          targetOrganizationId:
            (await resolveMappedId({
              directId: relation.targetOrganizationId,
              kind: "organization",
              map: organizationIds,
              sourceId: relation.targetOrganizationSourceId,
            })) ?? undefined,
          targetPersonId:
            (await resolveMappedId({
              directId: relation.targetPersonId,
              kind: "person",
              map: personIds,
              sourceId: relation.targetPersonSourceId,
            })) ?? undefined,
          targetRecordId: targetRecordId ?? undefined,
          targetTaskId:
            (await resolveMappedId({
              directId: relation.targetTaskId,
              kind: "task",
              map: taskIds,
              sourceId: relation.targetTaskSourceId,
            })) ?? undefined,
        });
      }
      if (
        relationSignature(state.result.relations) !==
        relationSignature(desired as unknown as Array<Record<string, unknown>>)
      ) {
        state.result = await updateCollectionRecord({
          editorUserId: actor.id,
          expectedVersion: state.result.version,
          recordId: state.result.id,
          relations: desired,
        });
        if (state.action === "unchanged") state.action = "update";
      }
      items.push({
        action: state.action,
        kind: "record",
        sourceId: recordKey,
        targetId: state.result.id,
      });
    } catch (error) {
      items.push(resultError("record", recordKey, error));
    }
  }

  for (const [collectionSourceId, state] of collectionStates) {
    const dto = toCollectionDto(state.view);
    const fieldByKey = new Map(
      dto.fields.map((field) => [field.key, field.id]),
    );
    for (const importedView of state.collection.views) {
      const sourceId = `${collectionSourceId}:${importedView.name}`;
      try {
        const visibleFieldIds = importedView.visibleFieldKeys.map((key) => {
          const fieldId = fieldByKey.get(key);
          if (!fieldId) throw new Error(`Unknown visible field key: ${key}`);
          return fieldId;
        });
        const existing = dto.views.find(
          (view) => view.name === importedView.name,
        );
        const desiredHash = await sha256CanonicalJson({
          filter: importedView.filters,
          isDefault: importedView.isDefault,
          sort: importedView.sorts,
          visibleFieldIds,
        });
        const existingHash = existing
          ? await sha256CanonicalJson({
              filter: existing.filter ?? [],
              isDefault: existing.isDefault,
              sort: existing.sort ?? [],
              visibleFieldIds: existing.visibleFieldIds,
            })
          : null;
        if (existingHash === desiredHash) {
          items.push({
            action: "unchanged",
            kind: "view",
            sourceId,
            targetId: existing?.id,
          });
          continue;
        }
        const saved = await saveCollectionView({
          collectionId: state.view.collection.id,
          editorUserId: actor.id,
          expectedVersion: existing?.version,
          filters: importedView.filters,
          isDefault: importedView.isDefault,
          name: importedView.name,
          sorts: importedView.sorts,
          viewId: existing?.id,
          visibleFieldIds,
        });
        items.push({
          action: existing ? "update" : "create",
          kind: "view",
          sourceId,
          targetId: saved.id,
        });
      } catch (error) {
        items.push(resultError("view", sourceId, error));
      }
    }
  }

  for (const attachment of bundle.attachments) {
    try {
      const preparedAttachment = prepared.attachments.get(attachment.sourceId);
      if (!preparedAttachment) throw new Error("Attachment was not prepared.");
      const documentId = attachment.documentSourceId
        ? (documentIds.get(attachment.documentSourceId) ??
          (await resolveMappedId({
            kind: "document",
            map: documentIds,
            sourceId: attachment.documentSourceId,
          })))
        : null;
      const collectionRecordId =
        attachment.collectionSourceId && attachment.collectionRecordSourceId
          ? await resolveRecordMappedId({
              collectionSourceId: attachment.collectionSourceId,
              recordSourceId: attachment.collectionRecordSourceId,
            })
          : null;
      if (!documentId && !collectionRecordId) {
        throw new Error("Attachment target was not imported.");
      }
      if (documentId) {
        await assertDocumentAccess(
          documentId,
          actor.id,
          ContentAccessLevel.EDIT_CONTENT,
        );
      } else {
        await assertCollectionRecordAccess(
          collectionRecordId as string,
          actor.id,
          ContentAccessLevel.EDIT_CONTENT,
        );
      }
      const existing = await prisma.contentAttachment.findUnique({
        where: { storageKey: preparedAttachment.storageKey },
      });
      const ownerMatches = documentId
        ? existing?.documentId === documentId && !existing.collectionRecordId
        : existing?.collectionRecordId === collectionRecordId &&
          !existing.documentId;
      if (existing && !ownerMatches) {
        if (existing.documentId) {
          await assertDocumentAccess(
            existing.documentId,
            actor.id,
            ContentAccessLevel.EDIT_CONTENT,
          );
        } else if (existing.collectionRecordId) {
          await assertCollectionRecordAccess(
            existing.collectionRecordId,
            actor.id,
            ContentAccessLevel.EDIT_CONTENT,
          );
        } else {
          throw new Error("The existing attachment is not accessible.");
        }
      }
      if (existing?.uploadedAt && !existing.deletedAt && ownerMatches) {
        items.push({
          action: "unchanged",
          kind: "attachment",
          sourceId: attachment.sourceId,
          targetId: existing.id,
        });
        continue;
      }
      if (!existing?.uploadedAt || existing.deletedAt) {
        await uploadPrivateObject({
          body: preparedAttachment.bytes,
          contentLength: preparedAttachment.bytes.length,
          contentType: preparedAttachment.contentType,
          key: preparedAttachment.storageKey,
        });
      }
      const persisted = await prisma.$transaction(async (tx) => {
        const resource = documentId
          ? { documentId, collectionRecordId: null }
          : { documentId: null, collectionRecordId };
        if (documentId) {
          await lockContentResources(tx, [
            { type: "document", id: documentId },
          ]);
          await assertDocumentAccess(
            documentId,
            actor.id,
            ContentAccessLevel.EDIT_CONTENT,
            tx,
          );
        } else {
          const record = await tx.collectionRecord.findFirstOrThrow({
            where: { deletedAt: null, id: collectionRecordId as string },
            select: { collectionId: true, id: true },
          });
          await lockContentResources(tx, [
            { type: "collection", id: record.collectionId },
          ]);
          await assertCollectionRecordAccess(
            record.id,
            actor.id,
            ContentAccessLevel.EDIT_CONTENT,
            tx,
          );
        }
        const sourceArtifact = await ensureArtifact(
          tx,
          preparedAttachment.artifact,
        );
        const stale = await tx.contentAttachment.findMany({
          where: {
            ...resource,
            deletedAt: null,
            NOT: { storageKey: preparedAttachment.storageKey },
            sourceArtifact: {
              externalKey: preparedAttachment.artifact.externalKey,
              sourceSystem: SourceSystem.NOTION,
            },
          },
          select: { id: true, storageKey: true },
        });
        if (stale.length) {
          await tx.contentAttachment.updateMany({
            where: { id: { in: stale.map((item) => item.id) } },
            data: { deletedAt: new Date() },
          });
        }
        const uploadedAt = new Date();
        const row = await tx.contentAttachment.upsert({
          where: { storageKey: preparedAttachment.storageKey },
          create: {
            ...resource,
            checksumSha256: preparedAttachment.checksumSha256,
            contentType: preparedAttachment.contentType,
            fileName: preparedAttachment.fileName,
            sizeBytes: preparedAttachment.bytes.length,
            sourceArtifactId: sourceArtifact.id,
            storageKey: preparedAttachment.storageKey,
            uploadedAt,
            uploadedByUserId: actor.id,
          },
          update: {
            ...resource,
            checksumSha256: preparedAttachment.checksumSha256,
            contentType: preparedAttachment.contentType,
            deletedAt: null,
            expiresAt: null,
            fileName: preparedAttachment.fileName,
            sizeBytes: preparedAttachment.bytes.length,
            sourceArtifactId: sourceArtifact.id,
            uploadedAt,
            uploadedByUserId: actor.id,
          },
        });
        return {
          rowId: row.id,
          staleStorageKeys: stale.map((item) => item.storageKey),
        };
      });
      items.push({
        action: existing ? "update" : "create",
        kind: "attachment",
        sourceId: attachment.sourceId,
        targetId: persisted.rowId,
      });
      await Promise.all(
        persisted.staleStorageKeys.map((key) =>
          deletePrivateObject(key).catch((error) =>
            console.error("[NOTION_IMPORT] Failed to delete stale object:", {
              error,
              key,
            }),
          ),
        ),
      );
    } catch (error) {
      items.push(resultError("attachment", attachment.sourceId, error));
    }
  }

  for (const artifactInput of bundle.preservedArtifacts) {
    try {
      const artifact = getPreparedArtifact(
        prepared,
        "preserved",
        artifactInput.sourceId,
      );
      const existing = await prisma.sourceArtifact.findUnique({
        where: { sourceKey: artifact.sourceKey },
      });
      const row = await prisma.$transaction((tx) =>
        ensureArtifact(tx, artifact),
      );
      items.push({
        action: existing ? "unchanged" : "preserve",
        kind: "preservedArtifact",
        sourceId: artifactInput.sourceId,
        targetId: row.id,
      });
    } catch (error) {
      items.push(
        resultError("preservedArtifact", artifactInput.sourceId, error),
      );
    }
  }
  if (bundle.export) {
    try {
      const artifact = getPreparedArtifact(
        prepared,
        "export",
        bundle.export.sourceId,
      );
      const existing = await prisma.sourceArtifact.findUnique({
        where: { sourceKey: artifact.sourceKey },
      });
      const row = await prisma.$transaction((tx) =>
        ensureArtifact(tx, artifact),
      );
      items.push({
        action: existing ? "unchanged" : "preserve",
        kind: "export",
        sourceId: bundle.export.sourceId,
        targetId: row.id,
      });
    } catch (error) {
      items.push(resultError("export", bundle.export.sourceId, error));
    }
  }

  const summary = summarize(items);
  return {
    dryRun: false,
    hasErrors: summary.error > 0,
    items,
    summary,
    workspaceId: bundle.workspaceId,
  };
}
