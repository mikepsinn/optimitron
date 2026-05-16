import {
  TaskCategory,
  TaskClaimPolicy,
  TaskCommunicationEndpointKind,
  TaskCommunicationEndpointVerificationStatus,
  TaskDeadlinePolicy,
  TaskDifficulty,
  TaskStatus,
  type Prisma,
  type TaskCategory as TaskCategoryValue,
  type TaskClaimPolicy as TaskClaimPolicyValue,
  type TaskDeadlinePolicy as TaskDeadlinePolicyValue,
  type TaskDifficulty as TaskDifficultyValue,
  type TaskStatus as TaskStatusValue,
} from "../generated/prisma/client.js";
import {
  upsertWishoniaUser,
  type WishoniaUserClient,
} from "../system-users.js";
import {
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
} from "../task-keys.js";

export interface ManagedTaskPrimaryEndpoint {
  email?: string | null;
  instructions?: string | null;
  label?: string | null;
  sourceUrl?: string | null;
  url?: string | null;
}

export interface ManagedTaskRecord {
  id: string;
  taskKey: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  impactStatement?: string | null;
  category?: TaskCategoryValue;
  difficulty?: TaskDifficultyValue;
  estimatedEffortHours?: number | null;
  skillTags?: string[];
  interestTags?: string[];
  contextJson?: Prisma.InputJsonValue;
  claimPolicy?: TaskClaimPolicyValue;
  maxClaims?: number | null;
  status?: TaskStatusValue;
  isPublic?: boolean;
  availableAt?: Date | null;
  dueAt?: Date | null;
  deadlinePolicy?: TaskDeadlinePolicyValue;
  sortOrder?: number;
  primaryEndpoint?: ManagedTaskPrimaryEndpoint | null;
  /**
   * Explicit soft-delete flag for rows owned by this managed collection.
   * Removing a record from the array is not deletion and must not affect the DB.
   */
  retired?: boolean;
}

interface ManagedTaskRow {
  id: string;
  taskKey: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  impactStatement: string | null;
  category: TaskCategoryValue;
  difficulty: TaskDifficultyValue;
  estimatedEffortHours: number | null;
  skillTags: string[];
  interestTags: string[];
  contextJson: Prisma.JsonValue | null;
  claimPolicy: TaskClaimPolicyValue;
  maxClaims: number | null;
  status: TaskStatusValue;
  isPublic: boolean;
  availableAt: Date | null;
  dueAt: Date | null;
  deadlinePolicy: TaskDeadlinePolicyValue;
  sortOrder: number;
  deletedAt: Date | null;
}

interface ManagedEndpointRow {
  id: string;
  email: string | null;
  instructions: string | null;
  isPrimary: boolean;
  kind: typeof TaskCommunicationEndpointKind[keyof typeof TaskCommunicationEndpointKind];
  label: string | null;
  priority: number;
  sourceUrl: string | null;
  url: string | null;
  verificationStatus: typeof TaskCommunicationEndpointVerificationStatus[keyof typeof TaskCommunicationEndpointVerificationStatus];
}

export interface ManagedTaskClient {
  task: {
    findMany(args: unknown): Promise<ManagedTaskRow[]>;
    updateMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<ManagedTaskRow>;
  };
  taskCommunicationEndpoint: {
    create(args: unknown): Promise<unknown>;
    findFirst(args: unknown): Promise<ManagedEndpointRow | null>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
}

export type ManagedIdentityClient = WishoniaUserClient;

export interface ManagedTransactionOptions {
  maxWait?: number;
  timeout?: number;
}

export interface ManagedTransactionClient extends ManagedTaskClient {
  $transaction<T>(
    callback: (client: ManagedTaskClient) => Promise<T>,
    options?: ManagedTransactionOptions,
  ): Promise<T>;
}

export interface SyncManagedTasksOptions {
  apply: boolean;
  collectionKey: string;
  createdByUserId: string;
  now?: Date;
  records: ManagedTaskRecord[];
  useTransaction?: boolean;
}

export interface SyncManagedTasksResult {
  collectionKey: string;
  mode: "apply" | "dry-run";
  created: string[];
  updated: string[];
  unchanged: string[];
  retired: string[];
  missingRetired: string[];
  endpointUpdated: string[];
  endpointRetired: string[];
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function normalizeManagedTaskEndpointUrl(value?: string | null) {
  const url = clean(value);
  if (!url) {
    return null;
  }

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function inferEndpointKind(input: { email: string | null; url: string | null }) {
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

function normalizePrimaryEndpoint(input: ManagedTaskPrimaryEndpoint) {
  const url = normalizeManagedTaskEndpointUrl(input.url);
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
    isPrimary: true,
    kind: inferEndpointKind({ email, url }),
    label,
    priority: 0,
    sourceUrl,
    url,
    verificationStatus: TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
  };
}

async function upsertPrimaryEndpoint(
  client: ManagedTaskClient,
  taskId: string,
  input: ManagedTaskPrimaryEndpoint | null,
  now: Date,
) {
  const endpoint = input ? normalizePrimaryEndpoint(input) : null;

  if (!endpoint) {
    const result = await client.taskCommunicationEndpoint.updateMany({
      where: {
        deletedAt: null,
        isPrimary: true,
        taskId,
      },
      data: {
        deletedAt: now,
        isPrimary: false,
      },
    });
    return result.count > 0 ? "cleared" : "unchanged";
  }

  const existing = await client.taskCommunicationEndpoint.findFirst({
    where: {
      deletedAt: null,
      isPrimary: true,
      taskId,
    },
    select: {
      id: true,
      email: true,
      instructions: true,
      isPrimary: true,
      kind: true,
      label: true,
      priority: true,
      sourceUrl: true,
      url: true,
      verificationStatus: true,
    },
  });

  if (existing) {
    if (sameJson(existing, { id: existing.id, ...endpoint })) {
      return "unchanged";
    }

    await client.taskCommunicationEndpoint.update({
      where: { id: existing.id },
      data: endpoint,
    });
    return "updated";
  }

  await client.taskCommunicationEndpoint.create({
    data: {
      ...endpoint,
      taskId,
    },
  });
  return "created";
}

function assertUniqueManagedTaskRecords(records: ManagedTaskRecord[]) {
  const ids = new Set<string>();
  const keys = new Set<string>();

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate managed task id: ${record.id}`);
    }
    if (keys.has(record.taskKey)) {
      throw new Error(`Duplicate managed task key: ${record.taskKey}`);
    }
    ids.add(record.id);
    keys.add(record.taskKey);
  }
}

function buildManagedContext(
  collectionKey: string,
  record: ManagedTaskRecord,
): Prisma.InputJsonValue {
  const base: Prisma.InputJsonObject =
    record.contextJson &&
    typeof record.contextJson === "object" &&
    !Array.isArray(record.contextJson)
      ? (record.contextJson as Prisma.InputJsonObject)
      : {};

  return {
    ...base,
    managedData: {
      collectionKey,
      recordId: record.id,
      source: "packages/db/src/managed-data",
    },
  } satisfies Prisma.InputJsonObject;
}

function buildTaskScalars(collectionKey: string, record: ManagedTaskRecord) {
  return {
    taskKey: record.taskKey,
    title: record.title,
    description: record.description,
    impactStatement: record.impactStatement ?? null,
    category: record.category ?? TaskCategory.GOVERNANCE,
    difficulty: record.difficulty ?? TaskDifficulty.INTERMEDIATE,
    estimatedEffortHours: record.estimatedEffortHours ?? null,
    skillTags: record.skillTags ?? [],
    interestTags: record.interestTags ?? [],
    contextJson: buildManagedContext(collectionKey, record),
    claimPolicy: record.claimPolicy ?? TaskClaimPolicy.OPEN_MANY,
    maxClaims: record.maxClaims ?? null,
    status: record.status ?? TaskStatus.ACTIVE,
    isPublic: record.isPublic ?? true,
    availableAt: record.availableAt ?? null,
    dueAt: record.dueAt ?? null,
    deadlinePolicy: record.deadlinePolicy ?? TaskDeadlinePolicy.NONE,
    sortOrder: record.sortOrder ?? 0,
    deletedAt: null,
  };
}

function buildTaskCreateData(
  collectionKey: string,
  record: ManagedTaskRecord,
  createdByUserId: string,
) {
  return {
    id: record.id,
    ...buildTaskScalars(collectionKey, record),
    createdByUser: { connect: { id: createdByUserId } },
    ...(record.parentTaskId
      ? { parentTask: { connect: { id: record.parentTaskId } } }
      : {}),
  };
}

function sortManagedTaskRecords(records: ManagedTaskRecord[]) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const sorted: ManagedTaskRecord[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(record: ManagedTaskRecord) {
    if (visited.has(record.id)) return;
    if (visiting.has(record.id)) {
      throw new Error(`Managed task parent cycle detected at ${record.id}`);
    }

    visiting.add(record.id);
    const parentRecord = record.parentTaskId
      ? byId.get(record.parentTaskId)
      : undefined;
    if (parentRecord) {
      visit(parentRecord);
    }
    visiting.delete(record.id);
    visited.add(record.id);
    sorted.push(record);
  }

  for (const record of records) {
    visit(record);
  }

  return sorted;
}

function validateManagedTaskTree(
  records: ManagedTaskRecord[],
  existingRows: ManagedTaskRow[],
) {
  const activeRecords = records.filter((record) => !record.retired);
  if (activeRecords.length === 0) {
    return;
  }

  const rootRecords = activeRecords.filter((record) => record.parentTaskId === null);
  if (rootRecords.length !== 1) {
    throw new Error(
      `Managed task tree must have exactly one active root: ${OPTIMIZE_EARTH_ROOT_TASK_ID} (${OPTIMIZE_EARTH_ROOT_TASK_KEY})`,
    );
  }

  const root = rootRecords[0];
  if (!root) {
    throw new Error(
      `Managed task tree must have exactly one active root: ${OPTIMIZE_EARTH_ROOT_TASK_ID} (${OPTIMIZE_EARTH_ROOT_TASK_KEY})`,
    );
  }
  if (
    root.id !== OPTIMIZE_EARTH_ROOT_TASK_ID ||
    root.taskKey !== OPTIMIZE_EARTH_ROOT_TASK_KEY
  ) {
    throw new Error(
      `Managed task tree root must be ${OPTIMIZE_EARTH_ROOT_TASK_ID} (${OPTIMIZE_EARTH_ROOT_TASK_KEY}); got ${root.id} (${root.taskKey})`,
    );
  }

  const activeRecordIds = new Set(activeRecords.map((record) => record.id));
  const activeExistingIds = new Set(
    existingRows
      .filter((row) => row.deletedAt === null)
      .map((row) => row.id),
  );

  for (const record of activeRecords) {
    if (
      record.parentTaskId &&
      !activeRecordIds.has(record.parentTaskId) &&
      !activeExistingIds.has(record.parentTaskId)
    ) {
      throw new Error(
        `Managed task ${record.id} (${record.taskKey}) references missing parentTaskId ${record.parentTaskId}`,
      );
    }
  }
}

function buildTaskUpdateData(collectionKey: string, record: ManagedTaskRecord) {
  return {
    ...buildTaskScalars(collectionKey, record),
    ...(record.parentTaskId
      ? { parentTask: { connect: { id: record.parentTaskId } } }
      : { parentTask: { disconnect: true } }),
  };
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJson);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(
      entries.map(([key, nested]) => [key, stableJson(nested)]),
    );
  }

  return value ?? null;
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(stableJson(a)) === JSON.stringify(stableJson(b));
}

function sameTime(a: Date | null | undefined, b: Date | null | undefined) {
  return (a?.toISOString() ?? null) === (b?.toISOString() ?? null);
}

function managedTaskNeedsUpdate(
  collectionKey: string,
  existing: ManagedTaskRow,
  record: ManagedTaskRecord,
) {
  const scalars = buildTaskScalars(collectionKey, record);

  return (
    existing.taskKey !== scalars.taskKey ||
    existing.parentTaskId !== record.parentTaskId ||
    existing.title !== scalars.title ||
    existing.description !== scalars.description ||
    existing.impactStatement !== scalars.impactStatement ||
    existing.category !== scalars.category ||
    existing.difficulty !== scalars.difficulty ||
    existing.estimatedEffortHours !== scalars.estimatedEffortHours ||
    !sameJson(existing.skillTags, scalars.skillTags) ||
    !sameJson(existing.interestTags, scalars.interestTags) ||
    !sameJson(existing.contextJson, scalars.contextJson) ||
    existing.claimPolicy !== scalars.claimPolicy ||
    existing.maxClaims !== scalars.maxClaims ||
    existing.status !== scalars.status ||
    existing.isPublic !== scalars.isPublic ||
    !sameTime(existing.availableAt, scalars.availableAt) ||
    !sameTime(existing.dueAt, scalars.dueAt) ||
    existing.deadlinePolicy !== scalars.deadlinePolicy ||
    existing.sortOrder !== scalars.sortOrder ||
    existing.deletedAt !== null
  );
}

function findExistingTask(
  rows: ManagedTaskRow[],
  record: ManagedTaskRecord,
) {
  const byId = rows.find((row) => row.id === record.id);
  if (byId) return byId;
  return rows.find((row) => row.taskKey === record.taskKey) ?? null;
}

export async function syncManagedTasks(
  client: ManagedTaskClient,
  options: SyncManagedTasksOptions,
): Promise<SyncManagedTasksResult> {
  const shouldUseTransaction =
    options.apply &&
    options.useTransaction !== false &&
    "$transaction" in client &&
    typeof (client as ManagedTransactionClient).$transaction === "function";

  if (shouldUseTransaction) {
    return (client as ManagedTransactionClient).$transaction(
      (transactionClient) =>
        syncManagedTasks(transactionClient, {
          ...options,
          useTransaction: false,
        }),
      // Default Prisma interactive-transaction timeout is 5s. The masked
      // preview branch has prod-fork volume (~5k tasks + triggers +
      // communications), and the sync ran 5272ms over the 5000ms limit.
      // CI sync is one-shot per deploy, not a hot path; 60s + a longer
      // maxWait keep this in one atomic tx instead of fanning out per-row.
      { timeout: 60_000, maxWait: 10_000 },
    );
  }

  assertUniqueManagedTaskRecords(options.records);
  const records = sortManagedTaskRecords(options.records);

  const ids = records.map((record) => record.id);
  const taskKeys = records.map((record) => record.taskKey);
  const parentTaskIds = records.flatMap((record) =>
    record.parentTaskId ? [record.parentTaskId] : [],
  );
  const lookupIds = [...new Set([...ids, ...parentTaskIds])];
  const existingRows = await client.task.findMany({
    where: {
      OR: [
        { id: { in: lookupIds } },
        { taskKey: { in: taskKeys } },
      ],
    },
    select: {
      id: true,
      taskKey: true,
      parentTaskId: true,
      title: true,
      description: true,
      impactStatement: true,
      category: true,
      difficulty: true,
      estimatedEffortHours: true,
      skillTags: true,
      interestTags: true,
      contextJson: true,
      claimPolicy: true,
      maxClaims: true,
      status: true,
      isPublic: true,
      availableAt: true,
      dueAt: true,
      deadlinePolicy: true,
      sortOrder: true,
      deletedAt: true,
    },
  });
  validateManagedTaskTree(records, existingRows);

  const result: SyncManagedTasksResult = {
    collectionKey: options.collectionKey,
    mode: options.apply ? "apply" : "dry-run",
    created: [],
    updated: [],
    unchanged: [],
    retired: [],
    missingRetired: [],
    endpointUpdated: [],
    endpointRetired: [],
  };
  const now = options.now ?? new Date();

  for (const record of records) {
    const conflictingKeyOwner = existingRows.find(
      (row) => row.taskKey === record.taskKey && row.id !== record.id,
    );
    if (conflictingKeyOwner) {
      throw new Error(
        `Managed task key ${record.taskKey} already belongs to ${conflictingKeyOwner.id}; expected ${record.id}`,
      );
    }

    const existing = findExistingTask(existingRows, record);
    const label = `${record.id} (${record.taskKey})`;

    if (record.retired) {
      if (!existing) {
        result.missingRetired.push(label);
        continue;
      }

      if (options.apply) {
        const retiredEndpoints = await client.taskCommunicationEndpoint.updateMany({
          where: {
            deletedAt: null,
            taskId: existing.id,
          },
          data: {
            deletedAt: now,
            isPrimary: false,
          },
        });
        if (retiredEndpoints.count > 0) {
          result.endpointRetired.push(label);
        }
      } else {
        const activeEndpoint = await client.taskCommunicationEndpoint.findFirst({
          where: {
            deletedAt: null,
            taskId: existing.id,
          },
          select: {
            id: true,
            email: true,
            instructions: true,
            isPrimary: true,
            kind: true,
            label: true,
            priority: true,
            sourceUrl: true,
            url: true,
            verificationStatus: true,
          },
        });
        if (activeEndpoint) {
          result.endpointRetired.push(label);
        }
      }

      if (existing.deletedAt) {
        result.unchanged.push(label);
        continue;
      }

      result.retired.push(label);
      if (options.apply) {
        await client.task.updateMany({
          where: {
            deletedAt: null,
            OR: [
              { id: record.id },
              { taskKey: record.taskKey },
            ],
          },
          data: {
            deletedAt: now,
            status: TaskStatus.STALE,
          },
        });
      }
      continue;
    }

    if (!existing) {
      result.created.push(label);
    } else if (managedTaskNeedsUpdate(options.collectionKey, existing, record)) {
      result.updated.push(label);
    } else {
      result.unchanged.push(label);
    }

    if (options.apply) {
      await client.task.upsert({
        where: { id: record.id },
        create: buildTaskCreateData(
          options.collectionKey,
          record,
          options.createdByUserId,
        ),
        update: buildTaskUpdateData(options.collectionKey, record),
      });

      if (record.primaryEndpoint !== undefined) {
        const endpointAction = await upsertPrimaryEndpoint(
          client,
          record.id,
          record.primaryEndpoint ?? null,
          now,
        );
        if (endpointAction === "cleared") {
          result.endpointRetired.push(label);
        } else if (endpointAction !== "unchanged") {
          result.endpointUpdated.push(label);
        }
      }
    } else if (record.primaryEndpoint !== undefined) {
      const existingEndpoint = await client.taskCommunicationEndpoint.findFirst({
        where: {
          deletedAt: null,
          isPrimary: true,
          taskId: record.id,
        },
        select: {
          id: true,
          email: true,
          instructions: true,
          isPrimary: true,
          kind: true,
          label: true,
          priority: true,
          sourceUrl: true,
          url: true,
          verificationStatus: true,
        },
      });
      const normalized = record.primaryEndpoint
        ? normalizePrimaryEndpoint(record.primaryEndpoint)
        : null;
      const wouldChange =
        normalized === null
          ? existingEndpoint !== null
          : !existingEndpoint ||
            !sameJson(existingEndpoint, { id: existingEndpoint.id, ...normalized });
      if (wouldChange) {
        if (normalized === null) {
          result.endpointRetired.push(label);
        } else {
          result.endpointUpdated.push(label);
        }
      }
    }
  }

  return result;
}

export async function ensureManagedDataSystemUser(
  client: ManagedIdentityClient,
  now = new Date(),
) {
  const { user } = await upsertWishoniaUser(client, now);
  return user;
}

export function formatManagedTasksResult(result: SyncManagedTasksResult) {
  const lines = [
    `${result.collectionKey} (${result.mode})`,
    `  created: ${result.created.length}`,
    `  updated: ${result.updated.length}`,
    `  unchanged: ${result.unchanged.length}`,
    `  retired: ${result.retired.length}`,
    `  missing retired: ${result.missingRetired.length}`,
    `  endpoint updates: ${result.endpointUpdated.length}`,
    `  endpoint retired: ${result.endpointRetired.length}`,
  ];

  for (const [label, values] of [
    ["created", result.created],
    ["updated", result.updated],
    ["retired", result.retired],
    ["missing retired", result.missingRetired],
  ] as const) {
    if (values.length > 0) {
      lines.push(`  ${label} rows:`);
      lines.push(...values.map((value) => `    - ${value}`));
    }
  }

  return lines.join("\n");
}
