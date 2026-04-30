import { Prisma, TaskCategory, TaskClaimPolicy, TaskDifficulty } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  validateAssigneeOrganizationResolver,
  validateAssigneePersonResolver,
  validateAudienceResolver,
  validateOwnerResolver,
  validateParentResolver,
} from "./resolvers";
import { validateTemplate } from "./template";

/**
 * CRUD helpers backing the create/update/disable/list/get TaskTrigger MCP
 * tools. Validates resolver keys and template tokens at write-time so
 * misconfigurations surface here instead of at fire-time.
 */

export interface SpawnSpecInput {
  kind: string;
  isParent?: boolean;
  sortOrder?: number;
  titleTemplate: string;
  descriptionTemplate: string;
  impactStatementTemplate?: string;
  roleTitleTemplate?: string;
  category?: keyof typeof TaskCategory;
  difficulty?: keyof typeof TaskDifficulty;
  estimatedEffortHours?: number;
  dueDays?: number;
  availableInDays?: number;
  deadlinePolicy?: "NONE" | "SOFT" | "EXPIRES" | "REQUIRED";
  claimPolicy?: keyof typeof TaskClaimPolicy;
  isPublic?: boolean;
  skillTagTemplates?: string[];
  interestTagTemplates?: string[];
  actionLinkUrlTemplate?: string;
  actionLinkLabelTemplate?: string;
  actionLinkInstructionsTemplate?: string;
  ownerResolver?: string;
  assigneePersonResolver?: string;
  assigneeOrganizationResolver?: string;
  parentResolver?: string;
  contributesToGate?: boolean;
  metadata?: unknown;
}

export interface CommunicationSpawnSpecInput {
  kind: string;
  sortOrder?: number;
  subjectTemplate: string;
  bodyTextTemplate: string;
  bodyHtmlTemplate?: string;
  commentTemplate?: string;
  channel?: string;
  audienceResolver?: string;
  purpose?: string;
  emailScope?: string;
  dedupeKeyTemplate: string;
  minHoursBetweenSends?: number;
  maxSendsPerTask?: number;
  /// Inclusive lower bound on prior-send count at which this spec is active.
  /// Lets one trigger carry escalating-tone variants. Default 0.
  minSendCount?: number;
  /// Inclusive upper bound; null = open-ended.
  maxSendCount?: number | null;
  metadata?: unknown;
}

export interface CreateTaskTriggerInput {
  triggerKey: string;
  eventName: string;
  triggerKind?: "spawnTasks" | "verifyTask" | "spawnCommunication";
  idempotencyKeyTemplate: string;
  eventFilter?: unknown;
  completionGate?: unknown;
  jurisdictionId?: string;
  notes?: string;
  enabled?: boolean;
  /// Cron expression (e.g. "30 * * * *"). When set, /api/cron/run-due-triggers
  /// fires this trigger when the schedule is due since the last successful fire.
  schedule?: string;
  /// Iteration-source resolver key (e.g. "overdue-tasks", "none"). The cron
  /// handler looks this up in iteration-sources.ts.
  iterationSource?: string;
  spawnSpecs?: SpawnSpecInput[];
  communicationSpawnSpecs?: CommunicationSpawnSpecInput[];
  metadata?: unknown;
}

export interface UpdateTaskTriggerInput extends Partial<CreateTaskTriggerInput> {
  triggerKey: string;
}

export interface AdminContext {
  actorUserId: string | null;
}

/// Wider-than-Prisma.TransactionClient type that also accepts a top-level
/// PrismaClient (which exposes `$transaction`). The seed script passes a
/// bare PrismaClient that doesn't go through @/lib/env validation, so the
/// admin functions stay reachable from contexts that don't need NEXTAUTH_SECRET.
type AdminDb = {
  $transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
};

export async function createTaskTrigger(
  input: CreateTaskTriggerInput,
  ctx: AdminContext,
  db: AdminDb = prisma,
) {
  validateTriggerInput(input, { isCreate: true });
  return db.$transaction(async (tx) => {
    const trigger = await tx.taskTrigger.create({
      data: {
        triggerKey: input.triggerKey,
        eventName: input.eventName,
        triggerKind: input.triggerKind ?? "spawnTasks",
        idempotencyKeyTemplate: input.idempotencyKeyTemplate,
        eventFilter: input.eventFilter as Prisma.InputJsonValue,
        completionGate: input.completionGate as Prisma.InputJsonValue,
        jurisdictionId: input.jurisdictionId ?? null,
        notes: input.notes ?? null,
        schedule: input.schedule ?? null,
        iterationSource: input.iterationSource ?? null,
        // Default DISABLED for MCP-authored triggers — author should preview
        // via fireTaskTrigger(dryRun:true), then explicitly enable via
        // updateTaskTrigger({enabled:true}) once happy.
        enabled: input.enabled ?? false,
        metadata: input.metadata as Prisma.InputJsonValue,
        createdByUserId: ctx.actorUserId,
        updatedByUserId: ctx.actorUserId,
        spawnSpecs: input.spawnSpecs?.length
          ? { create: input.spawnSpecs.map(toSpawnSpecCreate) }
          : undefined,
        communicationSpawnSpecs: input.communicationSpawnSpecs?.length
          ? { create: input.communicationSpawnSpecs.map(toCommSpecCreate) }
          : undefined,
      },
      include: { spawnSpecs: true, communicationSpawnSpecs: true },
    });
    return trigger;
  });
}

export async function updateTaskTrigger(
  input: UpdateTaskTriggerInput,
  ctx: AdminContext,
  db: AdminDb = prisma,
) {
  validateTriggerInput(input, { isCreate: false });
  return db.$transaction(async (tx) => {
    const data: Prisma.TaskTriggerUpdateInput = {
      updatedByUserId: ctx.actorUserId,
    };
    if (input.eventName !== undefined) data.eventName = input.eventName;
    if (input.triggerKind !== undefined) data.triggerKind = input.triggerKind;
    if (input.idempotencyKeyTemplate !== undefined)
      data.idempotencyKeyTemplate = input.idempotencyKeyTemplate;
    if (input.eventFilter !== undefined)
      data.eventFilter = input.eventFilter as Prisma.InputJsonValue;
    if (input.completionGate !== undefined)
      data.completionGate = input.completionGate as Prisma.InputJsonValue;
    if (input.jurisdictionId !== undefined) {
      data.jurisdiction = input.jurisdictionId
        ? { connect: { id: input.jurisdictionId } }
        : { disconnect: true };
    }
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.enabled !== undefined) data.enabled = input.enabled;
    if (input.schedule !== undefined) data.schedule = input.schedule;
    if (input.iterationSource !== undefined) data.iterationSource = input.iterationSource;
    if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

    const updated = await tx.taskTrigger.update({
      where: { triggerKey: input.triggerKey },
      data,
    });

    if (input.spawnSpecs !== undefined) {
      await tx.taskSpawnSpec.deleteMany({ where: { triggerId: updated.id } });
      if (input.spawnSpecs.length > 0) {
        await tx.taskSpawnSpec.createMany({
          data: input.spawnSpecs.map((s) => ({ ...toSpawnSpecCreate(s), triggerId: updated.id })),
        });
      }
    }
    if (input.communicationSpawnSpecs !== undefined) {
      await tx.taskCommunicationSpawnSpec.deleteMany({ where: { triggerId: updated.id } });
      if (input.communicationSpawnSpecs.length > 0) {
        await tx.taskCommunicationSpawnSpec.createMany({
          data: input.communicationSpawnSpecs.map((s) => ({
            ...toCommSpecCreate(s),
            triggerId: updated.id,
          })),
        });
      }
    }

    return tx.taskTrigger.findUnique({
      where: { id: updated.id },
      include: { spawnSpecs: true, communicationSpawnSpecs: true },
    });
  });
}

export async function disableTaskTrigger(input: { triggerKey: string; disabledReason?: string }) {
  return prisma.taskTrigger.update({
    where: { triggerKey: input.triggerKey },
    data: { enabled: false, disabledReason: input.disabledReason ?? null },
  });
}

export async function listTaskTriggers(input: {
  eventName?: string;
  enabled?: boolean;
  jurisdictionId?: string;
  limit?: number;
}) {
  const limit = Math.min(input.limit ?? 100, 500);
  return prisma.taskTrigger.findMany({
    where: {
      deletedAt: null,
      ...(input.eventName ? { eventName: input.eventName } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.jurisdictionId ? { jurisdictionId: input.jurisdictionId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      triggerKey: true,
      eventName: true,
      triggerKind: true,
      enabled: true,
      disabledReason: true,
      jurisdictionId: true,
      updatedAt: true,
      _count: { select: { spawnSpecs: true, communicationSpawnSpecs: true, fires: true } },
    },
  });
}

export async function getTaskTrigger(input: { triggerKey: string; recentFires?: number }) {
  const recentFires = Math.min(input.recentFires ?? 10, 100);
  const trigger = await prisma.taskTrigger.findUnique({
    where: { triggerKey: input.triggerKey },
    include: {
      spawnSpecs: { orderBy: { sortOrder: "asc" } },
      communicationSpawnSpecs: { orderBy: { sortOrder: "asc" } },
      fires: { orderBy: { firedAt: "desc" }, take: recentFires },
    },
  });
  return trigger;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateTriggerInput(input: Partial<CreateTaskTriggerInput>, opts: { isCreate: boolean }) {
  if (opts.isCreate) {
    if (!input.triggerKey || !input.eventName || !input.idempotencyKeyTemplate) {
      throw new Error("triggerKey, eventName, and idempotencyKeyTemplate are required");
    }
  }
  if (input.idempotencyKeyTemplate !== undefined) {
    const v = validateTemplate(input.idempotencyKeyTemplate);
    if (!v.valid) throw new Error(`idempotencyKeyTemplate invalid: ${v.reason}`);
  }
  if (input.spawnSpecs) {
    for (const spec of input.spawnSpecs) {
      validateSpawnSpec(spec);
    }
  }
  if (input.communicationSpawnSpecs) {
    for (const spec of input.communicationSpawnSpecs) {
      validateCommSpec(spec);
    }
  }
}

function validateSpawnSpec(spec: SpawnSpecInput) {
  if (!spec.kind) throw new Error("spawnSpec.kind is required");
  for (const tpl of [
    spec.titleTemplate,
    spec.descriptionTemplate,
    spec.impactStatementTemplate,
    spec.roleTitleTemplate,
    spec.actionLinkUrlTemplate,
    spec.actionLinkLabelTemplate,
    spec.actionLinkInstructionsTemplate,
    ...(spec.skillTagTemplates ?? []),
    ...(spec.interestTagTemplates ?? []),
  ]) {
    if (typeof tpl === "string") {
      const v = validateTemplate(tpl);
      if (!v.valid) throw new Error(`spawnSpec(${spec.kind}) template invalid: ${v.reason}`);
    }
  }
  if (spec.ownerResolver && !validateOwnerResolver(spec.ownerResolver)) {
    throw new Error(`spawnSpec(${spec.kind}) ownerResolver unknown: ${spec.ownerResolver}`);
  }
  if (spec.assigneePersonResolver && !validateAssigneePersonResolver(spec.assigneePersonResolver)) {
    throw new Error(
      `spawnSpec(${spec.kind}) assigneePersonResolver unknown: ${spec.assigneePersonResolver}`,
    );
  }
  if (
    spec.assigneeOrganizationResolver &&
    !validateAssigneeOrganizationResolver(spec.assigneeOrganizationResolver)
  ) {
    throw new Error(
      `spawnSpec(${spec.kind}) assigneeOrganizationResolver unknown: ${spec.assigneeOrganizationResolver}`,
    );
  }
  if (spec.parentResolver && !validateParentResolver(spec.parentResolver)) {
    throw new Error(`spawnSpec(${spec.kind}) parentResolver unknown: ${spec.parentResolver}`);
  }
  if (spec.category && !(spec.category in TaskCategory)) {
    throw new Error(`spawnSpec(${spec.kind}) category invalid: ${spec.category}`);
  }
  if (spec.difficulty && !(spec.difficulty in TaskDifficulty)) {
    throw new Error(`spawnSpec(${spec.kind}) difficulty invalid: ${spec.difficulty}`);
  }
  if (spec.claimPolicy && !(spec.claimPolicy in TaskClaimPolicy)) {
    throw new Error(`spawnSpec(${spec.kind}) claimPolicy invalid: ${spec.claimPolicy}`);
  }
}

function validateCommSpec(spec: CommunicationSpawnSpecInput) {
  if (!spec.kind) throw new Error("communicationSpawnSpec.kind is required");
  for (const tpl of [
    spec.subjectTemplate,
    spec.bodyTextTemplate,
    spec.bodyHtmlTemplate,
    spec.commentTemplate,
    spec.dedupeKeyTemplate,
  ]) {
    if (typeof tpl === "string") {
      const v = validateTemplate(tpl);
      if (!v.valid) throw new Error(`communicationSpawnSpec(${spec.kind}) template invalid: ${v.reason}`);
    }
  }
  if (spec.audienceResolver && !validateAudienceResolver(spec.audienceResolver)) {
    throw new Error(
      `communicationSpawnSpec(${spec.kind}) audienceResolver unknown: ${spec.audienceResolver}`,
    );
  }
}

function toSpawnSpecCreate(spec: SpawnSpecInput): Prisma.TaskSpawnSpecCreateWithoutTriggerInput {
  return {
    kind: spec.kind,
    isParent: spec.isParent ?? false,
    sortOrder: spec.sortOrder ?? 0,
    titleTemplate: spec.titleTemplate,
    descriptionTemplate: spec.descriptionTemplate,
    impactStatementTemplate: spec.impactStatementTemplate ?? null,
    roleTitleTemplate: spec.roleTitleTemplate ?? null,
    category: spec.category ? TaskCategory[spec.category] : TaskCategory.OTHER,
    difficulty: spec.difficulty ? TaskDifficulty[spec.difficulty] : TaskDifficulty.TRIVIAL,
    estimatedEffortHours: spec.estimatedEffortHours ?? null,
    dueDays: spec.dueDays ?? null,
    availableInDays: spec.availableInDays ?? null,
    deadlinePolicy: spec.deadlinePolicy ?? null,
    claimPolicy: spec.claimPolicy ? TaskClaimPolicy[spec.claimPolicy] : TaskClaimPolicy.ASSIGNED_ONLY,
    isPublic: spec.isPublic ?? false,
    skillTagTemplates: spec.skillTagTemplates ?? [],
    interestTagTemplates: spec.interestTagTemplates ?? [],
    actionLinkUrlTemplate: spec.actionLinkUrlTemplate ?? null,
    actionLinkLabelTemplate: spec.actionLinkLabelTemplate ?? null,
    actionLinkInstructionsTemplate: spec.actionLinkInstructionsTemplate ?? null,
    ownerResolver: spec.ownerResolver ?? "actor",
    assigneePersonResolver: spec.assigneePersonResolver ?? "none",
    assigneeOrganizationResolver: spec.assigneeOrganizationResolver ?? "none",
    parentResolver: spec.parentResolver ?? "trigger.parentSpec",
    contributesToGate: spec.contributesToGate ?? false,
    metadata: spec.metadata as Prisma.InputJsonValue,
  };
}

function toCommSpecCreate(
  spec: CommunicationSpawnSpecInput,
): Prisma.TaskCommunicationSpawnSpecCreateWithoutTriggerInput {
  return {
    kind: spec.kind,
    sortOrder: spec.sortOrder ?? 0,
    subjectTemplate: spec.subjectTemplate,
    bodyTextTemplate: spec.bodyTextTemplate,
    bodyHtmlTemplate: spec.bodyHtmlTemplate ?? null,
    commentTemplate: spec.commentTemplate ?? null,
    channel: spec.channel ?? "EMAIL",
    audienceResolver: spec.audienceResolver ?? "ASSIGNEE",
    purpose: spec.purpose ?? "REMINDER",
    emailScope: spec.emailScope ?? null,
    dedupeKeyTemplate: spec.dedupeKeyTemplate,
    minHoursBetweenSends: spec.minHoursBetweenSends ?? 0,
    maxSendsPerTask: spec.maxSendsPerTask ?? 0,
    minSendCount: spec.minSendCount ?? 0,
    maxSendCount: spec.maxSendCount ?? null,
    metadata: spec.metadata as Prisma.InputJsonValue,
  };
}
