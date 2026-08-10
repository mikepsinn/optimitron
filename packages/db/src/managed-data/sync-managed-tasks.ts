import {
  TaskCategory,
  TaskClaimPolicy,
  TaskCommunicationEndpointKind,
  TaskCommunicationEndpointVerificationStatus,
  TaskCompensationKind,
  TaskDeadlinePolicy,
  TaskEdgeType,
  TaskExecutionMode,
  TaskRemotePolicy,
  TaskStatus,
  type Prisma,
  type TaskEdgeType as TaskEdgeTypeValue,
  type TaskCategory as TaskCategoryValue,
  type TaskClaimPolicy as TaskClaimPolicyValue,
  type TaskCompensationCadence as TaskCompensationCadenceValue,
  type TaskCompensationKind as TaskCompensationKindValue,
  type TaskDeadlinePolicy as TaskDeadlinePolicyValue,
  type TaskExecutionMode as TaskExecutionModeValue,
  type TaskRemotePolicy as TaskRemotePolicyValue,
  type TaskStatus as TaskStatusValue,
} from "../generated/prisma/client.js";
import {
  MISSION_VALUE_HORIZON_YEARS,
  VALUE_IF_ACHIEVED_USD_METRIC_KEY,
} from "@optimitron/data/parameters";
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

/**
 * A causal edge owned by a managed collection.
 *
 * `parentTaskId` is the roll-up parent and there is only one; an edge is how a
 * task declares the other missions it serves without double-counting its value
 * into each of them. Declared here rather than created at runtime because an
 * edge carrying a probability delta is a quantified claim that belongs in a
 * pull request where a human can argue with the number.
 *
 * Leave the deltas null until they can be sourced. A null delta is an honest
 * structural claim; an invented one silently feeds the EV engine.
 */
export interface ManagedTaskEdgeRecord {
  /** Downstream task this one serves. Must exist in the DB or the same collection. */
  toTaskId: string;
  edgeType?: TaskEdgeTypeValue;
  probabilityDeltaBase?: number | null;
  timeDeltaDaysBase?: number | null;
  notes?: string | null;
}

export interface ManagedTaskRecord {
  id: string;
  taskKey: string;
  parentTaskId: string | null;
  /** Causal edges from this task to other tasks it serves. */
  edges?: ManagedTaskEdgeRecord[];
  title: string;
  description: string;
  impactStatement?: string | null;
  ownerOrganizationId?: string | null;
  category?: TaskCategoryValue;
  estimatedEffortHours?: number | null;
  /** Gross conditional annual value (USD) if the task succeeds. Source from `@optimitron/data` parameters. */
  expectedEconomicValueUsdBase?: number | null;
  /** Probability 0-1 the task produces the stated value. Source from `@optimitron/data` parameters. */
  successProbabilityBase?: number | null;
  /** Probability-free mission outcome value. Set null to retire the managed value. Omit to preserve it. */
  valueIfAchievedUsdBase?: number | null;
  /** Another managed writer owns this task's impact estimate. */
  impactEstimateManagedExternally?: boolean;
  skillTags?: string[];
  preferredSkillTags?: string[];
  interestTags?: string[];
  requiredCredentialTags?: string[];
  preferredCredentialTags?: string[];
  requiredLanguageTags?: string[];
  preferredLanguageTags?: string[];
  requiredToolTags?: string[];
  preferredToolTags?: string[];
  requiredAccessTags?: string[];
  preferredAccessTags?: string[];
  contextJson?: Prisma.InputJsonValue;
  claimPolicy?: TaskClaimPolicyValue;
  compensationKind?: TaskCompensationKindValue;
  compensationCadence?: TaskCompensationCadenceValue | null;
  compensationCurrency?: string | null;
  compensationMinAmountMinorUnits?: bigint | number | null;
  compensationMaxAmountMinorUnits?: bigint | number | null;
  compensationPaymentRails?: string[];
  estimatedHoursPerWeekMin?: number | null;
  estimatedHoursPerWeekMax?: number | null;
  remotePolicy?: TaskRemotePolicyValue;
  locationText?: string | null;
  workLocationCountryCode?: string | null;
  workLocationRegionCode?: string | null;
  workLocationCity?: string | null;
  workLocationPostalCode?: string | null;
  workLocationLatitude?: number | null;
  workLocationLongitude?: number | null;
  workLocationRadiusKm?: number | null;
  workTimeZone?: string | null;
  applicationQuestionsJson?: Prisma.InputJsonValue | null;
  executionMode?: TaskExecutionModeValue;
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
  ownerOrganizationId: string | null;
  category: TaskCategoryValue;
  estimatedEffortHours: number | null;
  skillTags: string[];
  preferredSkillTags: string[];
  interestTags: string[];
  requiredCredentialTags: string[];
  preferredCredentialTags: string[];
  requiredLanguageTags: string[];
  preferredLanguageTags: string[];
  requiredToolTags: string[];
  preferredToolTags: string[];
  requiredAccessTags: string[];
  preferredAccessTags: string[];
  contextJson: Prisma.JsonValue | null;
  claimPolicy: TaskClaimPolicyValue;
  compensationKind: TaskCompensationKindValue;
  compensationCadence: TaskCompensationCadenceValue | null;
  compensationCurrency: string | null;
  compensationMinAmountMinorUnits: bigint | null;
  compensationMaxAmountMinorUnits: bigint | null;
  compensationPaymentRails: string[];
  estimatedHoursPerWeekMin: number | null;
  estimatedHoursPerWeekMax: number | null;
  remotePolicy: TaskRemotePolicyValue;
  locationText: string | null;
  workLocationCountryCode: string | null;
  workLocationRegionCode: string | null;
  workLocationCity: string | null;
  workLocationPostalCode: string | null;
  workLocationLatitude: number | null;
  workLocationLongitude: number | null;
  workLocationRadiusKm: number | null;
  workTimeZone: string | null;
  applicationQuestionsJson: Prisma.JsonValue | null;
  executionMode: TaskExecutionModeValue;
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

interface ManagedTaskImpactEstimateSetRow {
  id: string;
}

interface ManagedTaskImpactFrameRow {
  id: string;
}

interface ManagedTaskImpactMetricRow {
  id: string;
}

export interface ManagedTaskClient {
  task: {
    findMany(args: unknown): Promise<ManagedTaskRow[]>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<ManagedTaskRow>;
  };
  taskImpactEstimateSet: {
    updateMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<ManagedTaskImpactEstimateSetRow>;
  };
  taskImpactFrameEstimate: {
    updateMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<ManagedTaskImpactFrameRow>;
  };
  taskImpactMetric: {
    upsert(args: unknown): Promise<ManagedTaskImpactMetricRow>;
  };
  taskCommunicationEndpoint: {
    create(args: unknown): Promise<unknown>;
    findFirst(args: unknown): Promise<ManagedEndpointRow | null>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  taskEdge: {
    findMany(args: unknown): Promise<ManagedTaskEdgeRow[]>;
    upsert(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
}

interface ManagedTaskEdgeRow {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  edgeType: TaskEdgeTypeValue;
  probabilityDeltaBase: number | null;
  timeDeltaDaysBase: number | null;
  notes: string | null;
  deletedAt: Date | null;
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

const MANAGED_TASK_IMPACT_CALCULATION_VERSION = "managed-task-tree-v1";
/**
 * Stamped on every edge this sync owns. Edges created at runtime (MCP
 * addDependency, agent proposals) carry a different value or none, so
 * retirement only ever touches rows this collection declared.
 */
const MANAGED_TASK_EDGE_CALCULATION_VERSION = "managed-task-edges-v1";
const MANAGED_TASK_IMPACT_COUNTERFACTUAL_KEY = "status-quo";
const MANAGED_TASK_IMPACT_FRAME_SLUG = "one-year";
const MANAGED_TASK_IMPACT_FRAME_YEARS = 1;
const MANAGED_MISSION_VALUE_FRAME_SLUG = "lifetime";
const MANAGED_TASK_IMPACT_FRAME_SLUGS = [
  MANAGED_TASK_IMPACT_FRAME_SLUG,
  MANAGED_MISSION_VALUE_FRAME_SLUG,
] as const;

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
  edgeUpserted: string[];
  edgeRetired: string[];
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function toManagedBigInt(value: bigint | number | null | undefined) {
  return value === null || value === undefined ? null : BigInt(value);
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
    ownerOrganizationId: record.ownerOrganizationId ?? null,
    category: record.category ?? TaskCategory.GOVERNANCE,
    estimatedEffortHours: record.estimatedEffortHours ?? null,
    skillTags: record.skillTags ?? [],
    preferredSkillTags: record.preferredSkillTags ?? [],
    interestTags: record.interestTags ?? [],
    requiredCredentialTags: record.requiredCredentialTags ?? [],
    preferredCredentialTags: record.preferredCredentialTags ?? [],
    requiredLanguageTags: record.requiredLanguageTags ?? [],
    preferredLanguageTags: record.preferredLanguageTags ?? [],
    requiredToolTags: record.requiredToolTags ?? [],
    preferredToolTags: record.preferredToolTags ?? [],
    requiredAccessTags: record.requiredAccessTags ?? [],
    preferredAccessTags: record.preferredAccessTags ?? [],
    contextJson: buildManagedContext(collectionKey, record),
    claimPolicy: record.claimPolicy ?? TaskClaimPolicy.OPEN_MANY,
    compensationKind: record.compensationKind ?? TaskCompensationKind.UNSPECIFIED,
    compensationCadence: record.compensationCadence ?? null,
    compensationCurrency: record.compensationCurrency ?? null,
    compensationMinAmountMinorUnits: toManagedBigInt(
      record.compensationMinAmountMinorUnits,
    ),
    compensationMaxAmountMinorUnits: toManagedBigInt(
      record.compensationMaxAmountMinorUnits,
    ),
    compensationPaymentRails: record.compensationPaymentRails ?? [],
    estimatedHoursPerWeekMin: record.estimatedHoursPerWeekMin ?? null,
    estimatedHoursPerWeekMax: record.estimatedHoursPerWeekMax ?? null,
    remotePolicy: record.remotePolicy ?? TaskRemotePolicy.UNSPECIFIED,
    locationText: record.locationText ?? null,
    workLocationCountryCode: record.workLocationCountryCode ?? null,
    workLocationRegionCode: record.workLocationRegionCode ?? null,
    workLocationCity: record.workLocationCity ?? null,
    workLocationPostalCode: record.workLocationPostalCode ?? null,
    workLocationLatitude: record.workLocationLatitude ?? null,
    workLocationLongitude: record.workLocationLongitude ?? null,
    workLocationRadiusKm: record.workLocationRadiusKm ?? null,
    workTimeZone: record.workTimeZone ?? null,
    applicationQuestionsJson: record.applicationQuestionsJson ?? null,
    executionMode: record.executionMode ?? TaskExecutionMode.HUMAN_OR_AGENT,
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

function buildTaskWriteScalars(collectionKey: string, record: ManagedTaskRecord) {
  const { ownerOrganizationId: _ownerOrganizationId, ...scalars } =
    buildTaskScalars(collectionKey, record);
  return scalars;
}

function buildOwnerOrganizationCreate(record: ManagedTaskRecord) {
  return record.ownerOrganizationId
    ? { ownerOrganization: { connect: { id: record.ownerOrganizationId } } }
    : {};
}

function buildOwnerOrganizationUpdate(record: ManagedTaskRecord) {
  return record.ownerOrganizationId
    ? { ownerOrganization: { connect: { id: record.ownerOrganizationId } } }
    : { ownerOrganization: { disconnect: true } };
}

function buildTaskCreateData(
  collectionKey: string,
  record: ManagedTaskRecord,
  createdByUserId: string,
) {
  return {
    id: record.id,
    ...buildTaskWriteScalars(collectionKey, record),
    createdByUser: { connect: { id: createdByUserId } },
    ...buildOwnerOrganizationCreate(record),
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
    ...buildTaskWriteScalars(collectionKey, record),
    ...buildOwnerOrganizationUpdate(record),
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
    existing.ownerOrganizationId !== scalars.ownerOrganizationId ||
    existing.category !== scalars.category ||
    existing.estimatedEffortHours !== scalars.estimatedEffortHours ||
    !sameJson(existing.skillTags, scalars.skillTags) ||
    !sameJson(existing.preferredSkillTags, scalars.preferredSkillTags) ||
    !sameJson(existing.interestTags, scalars.interestTags) ||
    !sameJson(existing.requiredCredentialTags, scalars.requiredCredentialTags) ||
    !sameJson(existing.preferredCredentialTags, scalars.preferredCredentialTags) ||
    !sameJson(existing.requiredLanguageTags, scalars.requiredLanguageTags) ||
    !sameJson(existing.preferredLanguageTags, scalars.preferredLanguageTags) ||
    !sameJson(existing.requiredToolTags, scalars.requiredToolTags) ||
    !sameJson(existing.preferredToolTags, scalars.preferredToolTags) ||
    !sameJson(existing.requiredAccessTags, scalars.requiredAccessTags) ||
    !sameJson(existing.preferredAccessTags, scalars.preferredAccessTags) ||
    !sameJson(existing.contextJson, scalars.contextJson) ||
    existing.claimPolicy !== scalars.claimPolicy ||
    existing.compensationKind !== scalars.compensationKind ||
    existing.compensationCadence !== scalars.compensationCadence ||
    existing.compensationCurrency !== scalars.compensationCurrency ||
    existing.compensationMinAmountMinorUnits !== scalars.compensationMinAmountMinorUnits ||
    existing.compensationMaxAmountMinorUnits !== scalars.compensationMaxAmountMinorUnits ||
    !sameJson(existing.compensationPaymentRails, scalars.compensationPaymentRails) ||
    existing.estimatedHoursPerWeekMin !== scalars.estimatedHoursPerWeekMin ||
    existing.estimatedHoursPerWeekMax !== scalars.estimatedHoursPerWeekMax ||
    existing.remotePolicy !== scalars.remotePolicy ||
    existing.locationText !== scalars.locationText ||
    existing.workLocationCountryCode !== scalars.workLocationCountryCode ||
    existing.workLocationRegionCode !== scalars.workLocationRegionCode ||
    existing.workLocationCity !== scalars.workLocationCity ||
    existing.workLocationPostalCode !== scalars.workLocationPostalCode ||
    existing.workLocationLatitude !== scalars.workLocationLatitude ||
    existing.workLocationLongitude !== scalars.workLocationLongitude ||
    existing.workLocationRadiusKm !== scalars.workLocationRadiusKm ||
    existing.workTimeZone !== scalars.workTimeZone ||
    !sameJson(existing.applicationQuestionsJson, scalars.applicationQuestionsJson) ||
    existing.executionMode !== scalars.executionMode ||
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

/**
 * Omission leaves an existing managed estimate untouched. An explicit null
 * writes an empty replacement frame and retires the previous managed frame.
 */
function declaresManagedTaskImpact(record: ManagedTaskRecord) {
  if (record.impactEstimateManagedExternally) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(
      record,
      "expectedEconomicValueUsdBase",
    ) ||
    Object.prototype.hasOwnProperty.call(record, "successProbabilityBase") ||
    Object.prototype.hasOwnProperty.call(record, "valueIfAchievedUsdBase")
  );
}

function buildManagedTaskImpactData(
  collectionKey: string,
  record: ManagedTaskRecord,
) {
  const conditionalEconomicValueUsdBase =
    record.expectedEconomicValueUsdBase ?? null;
  const successProbabilityBase = record.successProbabilityBase ?? null;
  const valueIfAchievedUsdBase = record.valueIfAchievedUsdBase ?? null;

  if (
    valueIfAchievedUsdBase !== null &&
    (conditionalEconomicValueUsdBase !== null ||
      successProbabilityBase !== null)
  ) {
    throw new Error(
      `Managed task ${record.taskKey} cannot combine a probability-free outcome value with expected-value inputs.`,
    );
  }

  const expectedEconomicValueUsdBase =
    conditionalEconomicValueUsdBase === null
      ? null
      : successProbabilityBase === null
        ? conditionalEconomicValueUsdBase
        : conditionalEconomicValueUsdBase * successProbabilityBase;

  return {
    estimateSet: {
      assumptionsJson: {
        managedData: {
          collectionKey,
          recordId: record.id,
          source: "packages/db/src/managed-data/sync-managed-tasks",
        },
        conditionalEconomicValueUsdBase,
      } satisfies Prisma.InputJsonObject,
      calculationVersion: MANAGED_TASK_IMPACT_CALCULATION_VERSION,
      counterfactualKey: MANAGED_TASK_IMPACT_COUNTERFACTUAL_KEY,
      estimateKind: "FORECAST" as const,
      methodologyKey: collectionKey,
      parameterSetHash: `managed-${collectionKey}-${record.id}`,
      publicationStatus: "PUBLISHED" as const,
      sourceSystem: "PARAMETER_CATALOG" as const,
    },
    frame: {
      adoptionRampYears: 0,
      annualDiscountRate: 0,
      benefitDurationYears:
        valueIfAchievedUsdBase === null
          ? MANAGED_TASK_IMPACT_FRAME_YEARS
          : MISSION_VALUE_HORIZON_YEARS,
      estimatedEffortHoursBase: record.estimatedEffortHours ?? null,
      evaluationHorizonYears:
        valueIfAchievedUsdBase === null
          ? MANAGED_TASK_IMPACT_FRAME_YEARS
          : MISSION_VALUE_HORIZON_YEARS,
      expectedEconomicValueUsdBase,
      frameKey:
        valueIfAchievedUsdBase === null
          ? ("ONE_YEAR" as const)
          : ("LIFETIME" as const),
      frameSlug:
        valueIfAchievedUsdBase === null
          ? MANAGED_TASK_IMPACT_FRAME_SLUG
          : MANAGED_MISSION_VALUE_FRAME_SLUG,
      successProbabilityBase,
      timeToImpactStartDays: 0,
    },
    valueIfAchievedUsdBase,
  };
}

async function syncManagedTaskImpactEstimate(
  client: ManagedTaskClient,
  collectionKey: string,
  record: ManagedTaskRecord,
  now: Date,
) {
  if (!declaresManagedTaskImpact(record)) {
    return;
  }

  const impactData = buildManagedTaskImpactData(collectionKey, record);
  const estimateSet = await client.taskImpactEstimateSet.upsert({
    where: {
      taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey:
        {
          calculationVersion: impactData.estimateSet.calculationVersion,
          counterfactualKey: impactData.estimateSet.counterfactualKey,
          estimateKind: impactData.estimateSet.estimateKind,
          methodologyKey: impactData.estimateSet.methodologyKey,
          parameterSetHash: impactData.estimateSet.parameterSetHash,
          sourceSystem: impactData.estimateSet.sourceSystem,
          taskId: record.id,
        },
    } satisfies Prisma.TaskImpactEstimateSetWhereUniqueInput,
    create: {
      ...impactData.estimateSet,
      isCurrent: true,
      taskId: record.id,
    },
    update: {
      ...impactData.estimateSet,
      deletedAt: null,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  await client.taskImpactEstimateSet.updateMany({
    where: {
      deletedAt: null,
      isCurrent: true,
      taskId: record.id,
      NOT: {
        id: estimateSet.id,
      },
    },
    data: {
      isCurrent: false,
    },
  });

  await client.task.update({
    where: {
      id: record.id,
    },
    data: {
      currentImpactEstimateSetId: estimateSet.id,
    },
  });

  const frame = await client.taskImpactFrameEstimate.upsert({
    where: {
      taskImpactEstimateSetId_frameSlug: {
        frameSlug: impactData.frame.frameSlug,
        taskImpactEstimateSetId: estimateSet.id,
      },
    } satisfies Prisma.TaskImpactFrameEstimateWhereUniqueInput,
    create: {
      ...impactData.frame,
      taskImpactEstimateSetId: estimateSet.id,
    },
    update: {
      ...impactData.frame,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (impactData.valueIfAchievedUsdBase !== null) {
    await client.taskImpactMetric.upsert({
      where: {
        taskImpactFrameEstimateId_metricKey: {
          metricKey: VALUE_IF_ACHIEVED_USD_METRIC_KEY,
          taskImpactFrameEstimateId: frame.id,
        },
      } satisfies Prisma.TaskImpactMetricWhereUniqueInput,
      create: {
        baseValue: impactData.valueIfAchievedUsdBase,
        displayGroup: "outcome-value",
        metricKey: VALUE_IF_ACHIEVED_USD_METRIC_KEY,
        taskImpactFrameEstimateId: frame.id,
        unit: "USD",
      },
      update: {
        baseValue: impactData.valueIfAchievedUsdBase,
        deletedAt: null,
        displayGroup: "outcome-value",
        unit: "USD",
      },
      select: { id: true },
    });
  }

  // Retire only slugs this writer has declared. Other frames in the estimate
  // set can carry independent scenarios and belong to their own writers.
  const supersededFrameSlugs = MANAGED_TASK_IMPACT_FRAME_SLUGS.filter(
    (frameSlug) => frameSlug !== impactData.frame.frameSlug,
  );
  await client.taskImpactFrameEstimate.updateMany({
    where: {
      deletedAt: null,
      frameSlug: { in: supersededFrameSlugs },
      taskImpactEstimateSetId: estimateSet.id,
    },
    data: { deletedAt: now },
  });
}

function buildManagedEdgeKey(edge: {
  fromTaskId: string;
  toTaskId: string;
  edgeType: TaskEdgeTypeValue;
}) {
  return `${edge.fromTaskId}->${edge.toTaskId}:${edge.edgeType}`;
}

/**
 * Reconcile declared edges after every task upsert, so both endpoints exist.
 * Runs as a second pass rather than inline with each record because an edge
 * may point at a task declared later in the same collection.
 */
async function syncManagedTaskEdges(
  client: ManagedTaskClient,
  options: {
    apply: boolean;
    now: Date;
    records: ManagedTaskRecord[];
    result: SyncManagedTasksResult;
  },
) {
  const declared = new Map<
    string,
    {
      fromTaskId: string;
      toTaskId: string;
      edgeType: TaskEdgeTypeValue;
      probabilityDeltaBase: number | null;
      timeDeltaDaysBase: number | null;
      notes: string | null;
    }
  >();

  for (const record of options.records) {
    if (record.retired || !record.edges?.length) {
      continue;
    }
    for (const edge of record.edges) {
      const edgeType = edge.edgeType ?? TaskEdgeType.INCREASES_PROBABILITY_OF;
      if (edge.toTaskId === record.id) {
        throw new Error(
          `Managed task ${record.id} declares an edge to itself; edges must point at a different task.`,
        );
      }
      const key = buildManagedEdgeKey({
        edgeType,
        fromTaskId: record.id,
        toTaskId: edge.toTaskId,
      });
      if (declared.has(key)) {
        throw new Error(`Duplicate managed task edge: ${key}`);
      }
      declared.set(key, {
        edgeType,
        fromTaskId: record.id,
        notes: clean(edge.notes),
        probabilityDeltaBase: edge.probabilityDeltaBase ?? null,
        timeDeltaDaysBase: edge.timeDeltaDaysBase ?? null,
        toTaskId: edge.toTaskId,
      });
    }
  }

  const existing = await client.taskEdge.findMany({
    where: { calculationVersion: MANAGED_TASK_EDGE_CALCULATION_VERSION },
    select: {
      id: true,
      fromTaskId: true,
      toTaskId: true,
      edgeType: true,
      probabilityDeltaBase: true,
      timeDeltaDaysBase: true,
      notes: true,
      deletedAt: true,
    },
  });
  const existingByKey = new Map(
    existing.map((row) => [buildManagedEdgeKey(row), row]),
  );

  for (const [key, edge] of declared) {
    const current = existingByKey.get(key);
    const unchanged =
      current?.deletedAt === null &&
      current.probabilityDeltaBase === edge.probabilityDeltaBase &&
      current.timeDeltaDaysBase === edge.timeDeltaDaysBase &&
      current.notes === edge.notes;
    if (unchanged) {
      continue;
    }

    options.result.edgeUpserted.push(key);
    if (!options.apply) {
      continue;
    }

    await client.taskEdge.upsert({
      where: {
        fromTaskId_toTaskId_edgeType: {
          edgeType: edge.edgeType,
          fromTaskId: edge.fromTaskId,
          toTaskId: edge.toTaskId,
        },
      },
      create: {
        ...edge,
        calculationVersion: MANAGED_TASK_EDGE_CALCULATION_VERSION,
      },
      update: {
        calculationVersion: MANAGED_TASK_EDGE_CALCULATION_VERSION,
        deletedAt: null,
        notes: edge.notes,
        probabilityDeltaBase: edge.probabilityDeltaBase,
        timeDeltaDaysBase: edge.timeDeltaDaysBase,
      },
    });
  }

  // Removing an edge from the array is deletion here, unlike tasks, because an
  // undeclared managed edge is an assertion nobody is making any more.
  const staleIds = existing
    .filter((row) => row.deletedAt === null)
    .filter((row) => !declared.has(buildManagedEdgeKey(row)))
    .map((row) => row.id);

  if (staleIds.length > 0) {
    options.result.edgeRetired.push(...staleIds);
    if (options.apply) {
      await client.taskEdge.updateMany({
        where: { id: { in: staleIds } },
        data: { deletedAt: options.now },
      });
    }
  }
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
      ownerOrganizationId: true,
      category: true,
      estimatedEffortHours: true,
      skillTags: true,
      preferredSkillTags: true,
      interestTags: true,
      requiredCredentialTags: true,
      preferredCredentialTags: true,
      requiredLanguageTags: true,
      preferredLanguageTags: true,
      requiredToolTags: true,
      preferredToolTags: true,
      requiredAccessTags: true,
      preferredAccessTags: true,
      contextJson: true,
      claimPolicy: true,
      compensationKind: true,
      compensationCadence: true,
      compensationCurrency: true,
      compensationMinAmountMinorUnits: true,
      compensationMaxAmountMinorUnits: true,
      compensationPaymentRails: true,
      estimatedHoursPerWeekMin: true,
      estimatedHoursPerWeekMax: true,
      remotePolicy: true,
      locationText: true,
      workLocationCountryCode: true,
      workLocationRegionCode: true,
      workLocationCity: true,
      workLocationPostalCode: true,
      workLocationLatitude: true,
      workLocationLongitude: true,
      workLocationRadiusKm: true,
      workTimeZone: true,
      applicationQuestionsJson: true,
      executionMode: true,
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
    edgeUpserted: [],
    edgeRetired: [],
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

      await syncManagedTaskImpactEstimate(
        client,
        options.collectionKey,
        record,
        now,
      );

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

  await syncManagedTaskEdges(client, {
    apply: options.apply,
    now,
    records,
    result,
  });

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
    `  edges upserted: ${result.edgeUpserted.length}`,
    `  edges retired: ${result.edgeRetired.length}`,
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
