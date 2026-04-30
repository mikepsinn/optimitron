import {
  Prisma,
  TaskCommentKind,
  TaskCommentSource,
  TaskDeadlinePolicy,
  TaskStatus,
  type PrismaClient,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { upsertPrimaryTaskCommunicationEndpoint } from "@/lib/tasks/task-communication-endpoints.server";
import { matchesEventFilter } from "./event-filter";
import {
  gateEvidenceTemplate,
  gateInputScope,
  isGateMet,
  type GateChild,
} from "./completion-gate";
import {
  resolveAssigneeOrganizationId,
  resolveAssigneePersonId,
  resolveOwnerUserId,
  resolveParentTaskId,
  type ParentResolution,
} from "./resolvers";
import { render } from "./template";

/**
 * Fire a TaskTrigger by triggerKey with the given event context.
 *
 * Behavior depends on trigger.triggerKind:
 *   "spawnTasks"         → upsert one Task per TaskSpawnSpec, optionally with
 *                          parent + completion gate
 *   "verifyTask"         → if the trigger's completionGate is met for the
 *                          target task's children, mark the task VERIFIED
 *   "spawnCommunication" → create TaskComment + TaskCommunication per spec,
 *                          honoring rate-limit and dedup keys
 *
 * Idempotency: the trigger's idempotencyKeyTemplate is rendered against
 * context. If a prior TaskTriggerFire row exists with the same
 * (triggerId, idempotencyKey), this call returns its cached result without
 * re-executing. Result rows with result="failed" are NOT cached and will
 * be re-attempted.
 */
export interface SpawnedSpec {
  /// The TaskSpawnSpec.kind that produced this task (e.g. "shareReferralUrl").
  kind: string;
  /// Whether this spec was the parent (isParent=true).
  isParent: boolean;
  /// The resulting Task row id.
  taskId: string;
  /// The resulting Task row taskKey (always non-null for trigger-spawned tasks).
  taskKey: string;
  /// Current status of the task post-fire (mostly ACTIVE; VERIFIED if the
  /// trigger's completionGate fired during this same call).
  status: TaskStatus;
  /// True if this task was newly created on this fire; false if upsert.update
  /// hit an existing row. Lets callers detect "first spawn ever" without
  /// duplicating idempotency logic.
  wasCreated: boolean;
}

export interface FireResult {
  result:
    | "spawned"
    | "alreadyFired"
    | "filteredOut"
    | "verified"
    | "communicated"
    | "rateLimited"
    | "failed";
  triggerId?: string;
  triggerKey: string;
  idempotencyKey?: string;
  /// Per-spec details. Only populated for `spawnTasks` fires (with at least
  /// one spec). Empty for verifyTask / spawnCommunication / cached results.
  spawnedSpecs: SpawnedSpec[];
  spawnedTaskIds: string[];
  spawnedTaskKeys: string[];
  reason?: string;
  error?: string;
}

export interface FireOptions {
  dryRun?: boolean;
  actorUserId?: string | null;
  /// Optional caller-supplied transaction client. When provided, the trigger
  /// runs inside the caller's transaction (no nested $transaction). Use
  /// when the caller needs the trigger's spawned task IDs to satisfy other
  /// foreign keys in the same atomic write (e.g. ReferralInvitation.taskId).
  /// When omitted, fireTaskTrigger opens its own prisma.$transaction.
  db?: Prisma.TransactionClient | typeof prisma;
}

type FireDb = Prisma.TransactionClient | typeof prisma;

export async function fireTaskTrigger(
  triggerKey: string,
  context: unknown,
  options: FireOptions = {},
): Promise<FireResult> {
  const actorUserId = options.actorUserId ?? null;
  const callerDb = options.db ?? prisma;
  const trigger = await callerDb.taskTrigger.findUnique({
    where: { triggerKey },
    include: {
      spawnSpecs: { orderBy: { sortOrder: "asc" } },
      communicationSpawnSpecs: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!trigger || trigger.deletedAt) {
    return finished("filteredOut", triggerKey, { reason: `trigger not found: ${triggerKey}` });
  }
  if (!trigger.enabled) {
    return finished("filteredOut", triggerKey, {
      triggerId: trigger.id,
      reason: `disabled${trigger.disabledReason ? `: ${trigger.disabledReason}` : ""}`,
    });
  }
  if (!matchesEventFilter(trigger.eventFilter, context)) {
    return finished("filteredOut", triggerKey, {
      triggerId: trigger.id,
      reason: "eventFilter rejected",
    });
  }

  const idempRender = render(trigger.idempotencyKeyTemplate, context);
  const idempotencyKey = idempRender.rendered;
  if (!idempotencyKey || idempRender.missingPaths.length > 0) {
    return finished("failed", triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      error: `idempotencyKeyTemplate rendered empty or missing paths: ${idempRender.missingPaths.join(",")}`,
    });
  }

  if (!options.dryRun) {
    // Caching policy by triggerKind:
    //   spawnTasks         → ALWAYS re-execute. Task upsert is idempotent by
    //                        taskKey, and re-running lets us repair gaps when
    //                        new spawn specs are added to an existing trigger
    //                        (lazy backfill on next fire).
    //   verifyTask         → short-circuit only on prior "verified" result;
    //                        the gate must re-evaluate until it's met.
    //   spawnCommunication → short-circuit on any prior non-failed result
    //                        (re-firing would resend the message). EXCEPTION:
    //                        scheduled triggers (trigger.schedule != null)
    //                        rely on the schedule itself + per-spec dedupe +
    //                        rate-limit + sendCount range to gate repeats, so
    //                        we don't short-circuit them — that's how
    //                        escalating-tone variants over multiple ticks work.
    const shouldShortCircuit =
      trigger.triggerKind === "verifyTask" ||
      (trigger.triggerKind === "spawnCommunication" && !trigger.schedule);
    if (shouldShortCircuit) {
      const prior = await callerDb.taskTriggerFire.findFirst({
        where: {
          triggerId: trigger.id,
          idempotencyKey,
          ...(trigger.triggerKind === "verifyTask"
            ? { result: "verified" }
            : { result: { notIn: ["failed", "filteredOut", "rateLimited"] } }),
        },
        orderBy: { firedAt: "desc" },
      });
      if (prior) {
        return {
          result: "alreadyFired",
          triggerId: trigger.id,
          triggerKey,
          idempotencyKey,
          spawnedSpecs: [],
          spawnedTaskIds: prior.spawnedTaskIds,
          spawnedTaskKeys: prior.spawnedTaskKeys,
        };
      }
    }
  }

  try {
    if (options.dryRun) {
      return await dryRunFire(trigger, context, idempotencyKey, actorUserId);
    }
    // If caller passed a tx, run inline. Otherwise open our own.
    const runWith = async (tx: FireDb): Promise<FireResult> => {
      let res: FireResult;
      switch (trigger.triggerKind) {
        case "spawnTasks":
          res = await fireSpawnTasks(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        case "verifyTask":
          res = await fireVerifyTask(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        case "spawnCommunication":
          res = await fireSpawnCommunication(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        default:
          res = finished("failed", triggerKey, {
            triggerId: trigger.id,
            idempotencyKey,
            error: `unknown triggerKind: ${trigger.triggerKind}`,
          });
      }
      // Only write to the fire log when something material happened. Skip
      // filteredOut/rateLimited: those re-evaluate on subsequent fires and
      // would clash with the @@unique([triggerId, idempotencyKey]).
      if (res.result !== "filteredOut" && res.result !== "rateLimited") {
        await tx.taskTriggerFire.upsert({
          where: {
            triggerId_idempotencyKey: { triggerId: trigger.id, idempotencyKey },
          },
          create: {
            triggerId: trigger.id,
            idempotencyKey,
            actorUserId,
            context: context as Prisma.InputJsonValue,
            result: res.result,
            error: res.error ?? null,
            spawnedTaskKeys: res.spawnedTaskKeys,
            spawnedTaskIds: res.spawnedTaskIds,
          },
          update: {
            actorUserId,
            context: context as Prisma.InputJsonValue,
            result: res.result,
            error: res.error ?? null,
            spawnedTaskKeys: res.spawnedTaskKeys,
            spawnedTaskIds: res.spawnedTaskIds,
            firedAt: new Date(),
          },
        });
      }
      return res;
    };
    if (options.db) {
      return await runWith(options.db as FireDb);
    }
    return await prisma.$transaction((tx) => runWith(tx));
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.taskTriggerFire
      .upsert({
        where: {
          triggerId_idempotencyKey: { triggerId: trigger.id, idempotencyKey },
        },
        create: {
          triggerId: trigger.id,
          idempotencyKey,
          actorUserId,
          context: context as Prisma.InputJsonValue,
          result: "failed",
          error,
          spawnedTaskKeys: [],
          spawnedTaskIds: [],
        },
        update: {
          result: "failed",
          error,
          firedAt: new Date(),
        },
      })
      .catch(() => {
        /* swallow audit-log failure to surface the original */
      });
    return {
      result: "failed",
      triggerId: trigger.id,
      triggerKey,
      idempotencyKey,
      spawnedSpecs: [],
      spawnedTaskIds: [],
      spawnedTaskKeys: [],
      error,
    };
  }
}

/**
 * Fire all enabled triggers matching `eventName` with the given context.
 * Used at event sites: post-signin hook, MCP dispatcher, cron, etc.
 */
export async function fireTaskTriggersForEvent(
  eventName: string,
  context: unknown,
  options: FireOptions = {},
): Promise<FireResult[]> {
  const callerDb = options.db ?? prisma;
  const triggers = await callerDb.taskTrigger.findMany({
    where: { eventName, enabled: true, deletedAt: null },
    select: { triggerKey: true },
  });
  return Promise.all(triggers.map((t) => fireTaskTrigger(t.triggerKey, context, options)));
}

// ===========================================================================
// spawnTasks handler
// ===========================================================================

type LoadedTrigger = Prisma.TaskTriggerGetPayload<{
  include: { spawnSpecs: true; communicationSpawnSpecs: true };
}>;

async function fireSpawnTasks(
  tx: FireDb,
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  actorUserId: string | null,
): Promise<FireResult> {
  const specs = trigger.spawnSpecs;
  if (specs.length === 0) {
    return finished("spawned", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
    });
  }

  const taskIds: string[] = [];
  const taskKeys: string[] = [];
  const spawnedSpecs: SpawnedSpec[] = [];
  let parentTaskId: string | null = null;

  // Sort: parent first (if any), then by sortOrder.
  const ordered = [...specs].sort((a, b) => {
    if (a.isParent !== b.isParent) return a.isParent ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  for (const spec of ordered) {
    const taskKey = spec.isParent
      ? idempotencyKey
      : `${idempotencyKey}:${spec.kind}`;

    // Pre-query existence so we can report wasCreated accurately. Cheap
    // (taskKey is uniquely indexed) and lets callers reconstruct legacy
    // "first call ever" semantics without duplicating idempotency logic.
    const preExisting = await tx.task.findUnique({
      where: { taskKey },
      select: { deletedAt: true, id: true },
    });
    const wasCreated = !preExisting;

    const ownerUserId = await resolveOwnerUserId(spec.ownerResolver, {
      db: tx,
      context,
      actorUserId,
    });
    const assigneePersonId = await resolveAssigneePersonId(spec.assigneePersonResolver, {
      db: tx,
      context,
      actorUserId,
    });
    const assigneeOrganizationId = await resolveAssigneeOrganizationId(
      spec.assigneeOrganizationResolver,
      { db: tx, context, actorUserId },
    );
    // For the parent spec: parentResolver describes where THIS task attaches
    // (e.g. "fixed:program:one-percent-treaty:ratify" — the user's HMT root
    // hangs off the global treaty parent). For child specs: typically
    // "trigger.parentSpec" which resolves to the just-spawned parent.
    // For the parent spec itself, "trigger.parentSpec" is meaningless, so
    // we substitute "none" to avoid resolving to its own (still-undefined) id.
    const effectiveParentResolver =
      spec.isParent && spec.parentResolver === "trigger.parentSpec"
        ? "none"
        : spec.parentResolver;
    const parentRes: ParentResolution = await resolveParentTaskId(effectiveParentResolver, {
      db: tx,
      context,
      actorUserId,
      parentSpecTaskId: parentTaskId,
    });

    const title = render(spec.titleTemplate, context).rendered;
    const description = render(spec.descriptionTemplate, context).rendered;
    const impactStatement = spec.impactStatementTemplate
      ? render(spec.impactStatementTemplate, context).rendered || null
      : null;
    const roleTitle = spec.roleTitleTemplate
      ? render(spec.roleTitleTemplate, context).rendered || null
      : null;

    const now = new Date();
    const dueAt = spec.dueDays != null ? new Date(now.getTime() + spec.dueDays * 86_400_000) : null;
    const availableAt =
      spec.availableInDays != null ? new Date(now.getTime() + spec.availableInDays * 86_400_000) : null;

    const skillTags = spec.skillTagTemplates.map((t) => render(t, context).rendered).filter(Boolean);
    const interestTags = spec.interestTagTemplates
      .map((t) => render(t, context).rendered)
      .filter(Boolean);

    const baseUpdate = {
      title,
      description,
      impactStatement,
      roleTitle,
      category: spec.category,
      difficulty: spec.difficulty,
      estimatedEffortHours: spec.estimatedEffortHours,
      dueAt,
      availableAt,
      deadlinePolicy: mapDeadlinePolicy(spec.deadlinePolicy),
      claimPolicy: spec.claimPolicy,
      isPublic: spec.isPublic,
      skillTags,
      interestTags,
      ownerUserId,
      assigneePersonId,
      assigneeOrganizationId,
      parentTaskId: parentRes.parentTaskId,
    };

    const baseCreate = {
      ...baseUpdate,
      taskKey,
      status: TaskStatus.ACTIVE,
    };
    const updateData = {
      ...pruneNulls(baseUpdate),
      ...(preExisting?.deletedAt
        ? {
            completedAt: null,
            completionEvidence: null,
            deletedAt: null,
            status: TaskStatus.ACTIVE,
            verifiedAt: null,
            verifiedByUserId: null,
          }
        : {}),
    };

    const task = await tx.task.upsert({
      where: { taskKey },
      update: updateData,
      create: pruneNulls(baseCreate) as Prisma.TaskUncheckedCreateInput,
    });

    if (spec.isParent) parentTaskId = task.id;
    taskIds.push(task.id);
    taskKeys.push(task.taskKey ?? taskKey);
    spawnedSpecs.push({
      kind: spec.kind,
      isParent: spec.isParent,
      taskId: task.id,
      taskKey: task.taskKey ?? taskKey,
      status: task.status,
      wasCreated,
    });

    if (spec.actionLinkUrlTemplate) {
      const url = render(spec.actionLinkUrlTemplate, context).rendered;
      const label = spec.actionLinkLabelTemplate
        ? render(spec.actionLinkLabelTemplate, context).rendered
        : null;
      const instructions = spec.actionLinkInstructionsTemplate
        ? render(spec.actionLinkInstructionsTemplate, context).rendered
        : null;
      if (url) {
        await upsertPrimaryTaskCommunicationEndpoint(
          tx as unknown as Parameters<typeof upsertPrimaryTaskCommunicationEndpoint>[0],
          task.id,
          { url, label, instructions },
        );
      }
    }
  }

  // Optional completion gate evaluation (parent auto-VERIFY when spawning the
  // tree where children may already be VERIFIED — rare on first spawn, but
  // important for re-fires after children VERIFY in another path).
  if (trigger.completionGate && parentTaskId) {
    await maybeVerifyByGate(tx, trigger, parentTaskId, context, actorUserId);
  }

  return {
    result: "spawned",
    triggerId: trigger.id,
    triggerKey: trigger.triggerKey,
    idempotencyKey,
    spawnedSpecs,
    spawnedTaskIds: taskIds,
    spawnedTaskKeys: taskKeys,
  };
}

// ===========================================================================
// verifyTask handler — Pattern 6 (HMT auto-verify gate)
// ===========================================================================

async function fireVerifyTask(
  tx: FireDb,
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  actorUserId: string | null,
): Promise<FireResult> {
  // Target task is identified by the rendered idempotencyKey (which IS the
  // parent taskKey for trigger-managed parent tasks).
  const parentTask = await tx.task.findFirst({
    where: { taskKey: idempotencyKey, deletedAt: null },
    select: { id: true, status: true, ownerUserId: true },
  });
  if (!parentTask) {
    return finished("filteredOut", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      reason: `target task not found: ${idempotencyKey}`,
    });
  }
  if (parentTask.status === TaskStatus.VERIFIED) {
    return finished("alreadyFired", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      spawnedTaskIds: [parentTask.id],
      spawnedTaskKeys: [idempotencyKey],
    });
  }
  const verified = await maybeVerifyByGate(tx, trigger, parentTask.id, context, actorUserId);
  if (!verified) {
    return finished("filteredOut", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      reason: "completionGate not met",
    });
  }
  return {
    result: "verified",
    triggerId: trigger.id,
    triggerKey: trigger.triggerKey,
    idempotencyKey,
    spawnedSpecs: [],
    spawnedTaskIds: [parentTask.id],
    spawnedTaskKeys: [idempotencyKey],
  };
}

async function maybeVerifyByGate(
  tx: FireDb,
  trigger: LoadedTrigger,
  verifyTargetId: string,
  context: unknown,
  actorUserId: string | null,
): Promise<boolean> {
  const target = await tx.task.findUnique({
    where: { id: verifyTargetId },
    select: { id: true, taskKey: true, parentTaskId: true },
  });
  if (!target) return false;

  const scope = gateInputScope(trigger.completionGate);
  // Gate inputs:
  //   "children" → tasks parented to the verify target (target auto-VERIFIES
  //                when ITS children meet the gate)
  //   "siblings" → tasks parented to the same parent as the verify target
  //                (the target's peers — used for Pattern 6 HMT, where
  //                completeTraining auto-VERIFIES when share + invite1 +
  //                invite2 — its siblings — are VERIFIED)
  const inputParentId = scope === "siblings" ? target.parentTaskId : target.id;
  if (scope === "siblings" && !inputParentId) return false; // top-level target has no siblings via parent

  const inputs = await tx.task.findMany({
    where: { parentTaskId: inputParentId, deletedAt: null },
    select: { id: true, taskKey: true, status: true },
  });

  // Map task taskKey suffix back to spawn-spec kind. For trigger-spawned
  // tasks under a parent with taskKey P, children have taskKey "P:kind".
  // For sibling scope, the prefix is the COMMON parent's taskKey.
  const prefixSourceTaskId = scope === "siblings" ? inputParentId : target.id;
  const prefixSource = await tx.task.findUnique({
    where: { id: prefixSourceTaskId! },
    select: { taskKey: true },
  });
  const prefix = prefixSource?.taskKey ? `${prefixSource.taskKey}:` : "";
  const gateInputs: GateChild[] = inputs.map((c) => ({
    spawnKind: c.taskKey?.startsWith(prefix) ? c.taskKey.slice(prefix.length) : (c.taskKey ?? ""),
    status: c.status,
  }));
  if (!isGateMet(trigger.completionGate, gateInputs)) return false;

  const evidenceTpl = gateEvidenceTemplate(trigger.completionGate);
  const evidence = evidenceTpl ? render(evidenceTpl, context).rendered : "Completion gate met.";
  const now = new Date();
  const updated = await tx.task.updateMany({
    where: { id: verifyTargetId, deletedAt: null, status: { not: TaskStatus.VERIFIED } },
    data: {
      completedAt: now,
      verifiedAt: now,
      status: TaskStatus.VERIFIED,
      verifiedByUserId: actorUserId,
      completionEvidence: evidence,
    },
  });
  if (updated.count > 0) {
    await tx.taskComment.create({
      data: {
        taskId: verifyTargetId,
        authorUserId: actorUserId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message: evidence,
        source: TaskCommentSource.WEB,
      },
    });
  }
  return updated.count > 0;
}

// ===========================================================================
// spawnCommunication handler
// ===========================================================================
//
// CURRENT SCOPE: this handler creates a TaskComment + a TaskCommunication
// row. It does NOT invoke the existing email/notification dispatch pipeline.
// The TaskComment surfaces in the in-product task thread; the
// TaskCommunication row is a draft + audit record. Channel-specific dispatch
// (Resend / push / etc.) is the responsibility of the legacy notification
// pipeline downstream and is out of scope for the trigger framework today.
//
// The only seeded `spawnCommunication` trigger (`task:overdue-reminder`) is
// disabled by default and documented as a template, so no production traffic
// currently depends on this. When we wire a real spawnCommunication trigger
// that needs to actually email people, we'll plug the dispatch step in here.
async function fireSpawnCommunication(
  tx: FireDb,
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  actorUserId: string | null,
): Promise<FireResult> {
  const specs = trigger.communicationSpawnSpecs;
  if (specs.length === 0) {
    return finished("communicated", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      reason: "no communicationSpawnSpecs",
    });
  }
  // Communication spawns require a target task in context.
  const taskIdValue = lookup(context, "task.id");
  if (typeof taskIdValue !== "string") {
    return finished("failed", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      error: "spawnCommunication requires context.task.id",
    });
  }
  const taskId = taskIdValue;

  // priorSendCount is scoped to THIS trigger's prior sends on THIS task —
  // not all communications on the task. Counting all communications would
  // let unrelated triggers (or human-authored messages) bump our sendCount
  // and flip us into the wrong escalation variant. We tag every row we
  // create with metadataJson.triggerId and count by that.
  const priorSendCount = await tx.taskCommunication.count({
    where: {
      taskId,
      deletedAt: null,
      metadataJson: {
        path: ["triggerId"],
        equals: trigger.id,
      },
    },
  });

  for (const spec of specs) {
    const dedupeKey = render(spec.dedupeKeyTemplate, context).rendered;
    if (!dedupeKey) continue;

    // sendCount-range gate: pick the spec whose [minSendCount, maxSendCount]
    // window contains the current priorSendCount. Lets one trigger carry
    // escalating-tone variants — week-1 spec at minSendCount=0/maxSendCount=0,
    // week-2 spec at minSendCount=1/maxSendCount=1, etc.
    if (priorSendCount < spec.minSendCount) continue;
    if (spec.maxSendCount != null && priorSendCount > spec.maxSendCount) continue;

    if (spec.minHoursBetweenSends > 0 || spec.maxSendsPerTask > 0) {
      const window =
        spec.minHoursBetweenSends > 0
          ? new Date(Date.now() - spec.minHoursBetweenSends * 3_600_000)
          : null;
      const recentCount = window
        ? await tx.taskCommunication.count({
            where: {
              taskId,
              deletedAt: null,
              createdAt: { gte: window },
              metadataJson: { path: ["triggerId"], equals: trigger.id },
            },
          })
        : 0;
      if (window && recentCount > 0) {
        return finished("rateLimited", trigger.triggerKey, {
          triggerId: trigger.id,
          idempotencyKey,
          reason: "minHoursBetweenSends not elapsed",
        });
      }
      if (spec.maxSendsPerTask > 0 && priorSendCount >= spec.maxSendsPerTask) {
        return finished("rateLimited", trigger.triggerKey, {
          triggerId: trigger.id,
          idempotencyKey,
          reason: "maxSendsPerTask reached",
        });
      }
    }

    const subject = render(spec.subjectTemplate, context).rendered;
    const bodyText = render(spec.bodyTextTemplate, context).rendered;
    const bodyHtml = spec.bodyHtmlTemplate ? render(spec.bodyHtmlTemplate, context).rendered : null;
    const commentMessage = spec.commentTemplate
      ? render(spec.commentTemplate, context).rendered
      : subject;

    // Comment kind is STATUS_UPDATE because the trigger framework does NOT
    // dispatch the email itself — see header. OUTBOUND_MESSAGE would imply
    // an actual send happened. When dispatch lands, flip this to
    // OUTBOUND_MESSAGE on the post-send confirmation.
    const comment = await tx.taskComment.create({
      data: {
        taskId,
        authorUserId: actorUserId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message: commentMessage,
        source: TaskCommentSource.WEB,
      },
    });

    await tx.taskCommunication.create({
      data: {
        taskId,
        taskCommentId: comment.id,
        // Tag with triggerId so priorSendCount can scope counts to THIS
        // trigger only (not all communications on the task).
        metadataJson: {
          triggerId: trigger.id,
          triggerKey: trigger.triggerKey,
          specKind: spec.kind,
          subject,
          bodyText,
          bodyHtml,
          dedupeKey,
        } as Prisma.InputJsonValue,
        audience: "ASSIGNEE",
        purpose: "REMINDER",
      },
    });
  }
  return {
    result: "communicated",
    triggerId: trigger.id,
    triggerKey: trigger.triggerKey,
    idempotencyKey,
    spawnedSpecs: [],
    spawnedTaskIds: [taskId],
    spawnedTaskKeys: [],
  };
}

// ===========================================================================
// dryRun
// ===========================================================================

async function dryRunFire(
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  _actorUserId: string | null,
): Promise<FireResult> {
  const taskKeys: string[] = [];
  if (trigger.triggerKind === "spawnTasks") {
    for (const spec of trigger.spawnSpecs) {
      taskKeys.push(spec.isParent ? idempotencyKey : `${idempotencyKey}:${spec.kind}`);
    }
  }
  return {
    result: trigger.triggerKind === "verifyTask" ? "verified" : "spawned",
    triggerId: trigger.id,
    triggerKey: trigger.triggerKey,
    idempotencyKey,
    spawnedSpecs: [],
    spawnedTaskIds: [],
    spawnedTaskKeys: taskKeys,
    reason: "dryRun",
  };
}

// ===========================================================================
// helpers
// ===========================================================================

function finished(
  result: FireResult["result"],
  triggerKey: string,
  extras: Partial<FireResult> = {},
): FireResult {
  return {
    result,
    triggerKey,
    spawnedSpecs: extras.spawnedSpecs ?? [],
    spawnedTaskIds: extras.spawnedTaskIds ?? [],
    spawnedTaskKeys: extras.spawnedTaskKeys ?? [],
    ...extras,
  };
}

function mapDeadlinePolicy(value: string | null | undefined): TaskDeadlinePolicy {
  switch (value) {
    case "SOFT":
      return TaskDeadlinePolicy.SOFT;
    case "EXPIRES":
      return TaskDeadlinePolicy.EXPIRES;
    case "REQUIRED":
      return TaskDeadlinePolicy.REQUIRED;
    case "NONE":
    case null:
    case undefined:
    default:
      return TaskDeadlinePolicy.NONE;
  }
}

function pruneNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function lookup(root: unknown, path: string): unknown {
  if (root == null) return undefined;
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}
