import {
  PersonLifeStatus,
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

const WISHONIA_EMAIL = "wishonia@gmail.com";
const WISHONIA_USERNAME = "wishonia";
const WISHONIA_DISPLAY_NAME = "Wishonia";
const WISHONIA_AFFILIATION =
  "World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation";
const WISHONIA_IMAGE = "/sprites/wishonia/smirk-smile.png";

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

export interface ManagedTaskClient {
  task: {
    findMany(args: unknown): Promise<ManagedTaskRow[]>;
    updateMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<ManagedTaskRow>;
  };
  taskCommunicationEndpoint: {
    create(args: unknown): Promise<unknown>;
    findFirst(args: unknown): Promise<{ id: string } | null>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
}

export interface ManagedIdentityClient {
  person: {
    upsert(args: unknown): Promise<{ id: string; handle: string | null }>;
  };
  user: {
    upsert(args: unknown): Promise<{ id: string }>;
  };
}

export interface SyncManagedTasksOptions {
  apply: boolean;
  collectionKey: string;
  createdByUserId: string;
  now?: Date;
  records: ManagedTaskRecord[];
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
) {
  const endpoint = input ? normalizePrimaryEndpoint(input) : null;

  if (!endpoint) {
    return client.taskCommunicationEndpoint.updateMany({
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
  }

  const existing = await client.taskCommunicationEndpoint.findFirst({
    where: {
      deletedAt: null,
      isPrimary: true,
      taskId,
    },
    select: { id: true },
  });

  if (existing) {
    return client.taskCommunicationEndpoint.update({
      where: { id: existing.id },
      data: endpoint,
    });
  }

  return client.taskCommunicationEndpoint.create({
    data: {
      ...endpoint,
      taskId,
    },
  });
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
  assertUniqueManagedTaskRecords(options.records);

  const ids = options.records.map((record) => record.id);
  const taskKeys = options.records.map((record) => record.taskKey);
  const existingRows = await client.task.findMany({
    where: {
      OR: [
        { id: { in: ids } },
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

  for (const record of options.records) {
    const existing = findExistingTask(existingRows, record);
    const label = `${record.id} (${record.taskKey})`;

    if (existing && existing.id !== record.id) {
      throw new Error(
        `Managed task key ${record.taskKey} already belongs to ${existing.id}; expected ${record.id}`,
      );
    }

    if (record.retired) {
      if (!existing) {
        result.missingRetired.push(label);
        continue;
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
        await client.taskCommunicationEndpoint.updateMany({
          where: {
            deletedAt: null,
            taskId: existing.id,
          },
          data: {
            deletedAt: now,
            isPrimary: false,
          },
        });
      }
      result.endpointRetired.push(label);
      continue;
    }

    if (!existing) {
      result.created.push(label);
    } else if (managedTaskNeedsUpdate(options.collectionKey, existing, record)) {
      result.updated.push(label);
    } else {
      result.unchanged.push(label);
    }

    if (record.primaryEndpoint !== undefined) {
      result.endpointUpdated.push(label);
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
        await upsertPrimaryEndpoint(
          client,
          record.id,
          record.primaryEndpoint ?? null,
        );
      }
    }
  }

  return result;
}

export async function ensureManagedDataSystemUser(
  client: ManagedIdentityClient,
  now = new Date(),
) {
  const sourceRef = "wishonia:system";
  const person = await client.person.upsert({
    where: { sourceRef },
    update: {
      deletedAt: null,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
    create: {
      sourceRef,
      handle: WISHONIA_USERNAME,
      displayName: WISHONIA_DISPLAY_NAME,
      image: WISHONIA_IMAGE,
      bio: "Voice of Optimitron. Alien governance AI. 4,237 years of practice.",
      currentAffiliation: WISHONIA_AFFILIATION,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.LIVING,
    },
  });

  const user = await client.user.upsert({
    where: { email: WISHONIA_EMAIL },
    update: {
      isSystem: true,
      person: { connect: { id: person.id } },
    },
    create: {
      email: WISHONIA_EMAIL,
      isSystem: true,
      emailVerified: now,
      person: { connect: { id: person.id } },
    },
  });

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
