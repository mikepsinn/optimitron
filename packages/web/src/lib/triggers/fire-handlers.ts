import {
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationStatus,
  TaskDeadlinePolicy,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import {
  getReplyAddress,
  sendTaskNotificationEmail,
} from "@/lib/email/task-notification";
import { upsertPrimaryTaskCommunicationEndpoint } from "@/lib/tasks/task-communication-endpoints.server";
import {
  gateEvidenceTemplate,
  gateInputScope,
  isGateMet,
  type GateChild,
} from "./completion-gate";
import {
  resolveAssigneeOrganizationId,
  resolveAssigneePersonId,
  resolveParentTaskId,
  resolveTaskCreatorUserId,
  type ParentResolution,
} from "./resolvers";
import { render } from "./template";
import {
  finished,
  type FireDb,
  type FireResult,
  type LoadedTrigger,
  type SpawnedSpec,
} from "./fire-types";

export async function fireSpawnTasks(
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

  const ordered = [...specs].sort((a, b) => {
    if (a.isParent !== b.isParent) return a.isParent ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  for (const spec of ordered) {
    const taskKey = spec.isParent
      ? idempotencyKey
      : `${idempotencyKey}:${spec.kind}`;

    const preExisting = await tx.task.findUnique({
      where: { taskKey },
      select: { deletedAt: true, id: true },
    });
    const wasCreated = !preExisting;

    const createdByUserId = await resolveTaskCreatorUserId(
      spec.creatorResolver,
      {
        db: tx,
        context,
        actorUserId,
      },
    );
    const assigneePersonId = await resolveAssigneePersonId(
      spec.assigneePersonResolver,
      {
        db: tx,
        context,
        actorUserId,
      },
    );
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
    const parentRes: ParentResolution = await resolveParentTaskId(
      effectiveParentResolver,
      {
        db: tx,
        context,
        actorUserId,
        parentSpecTaskId: parentTaskId,
      },
    );

    const title = render(spec.titleTemplate, context).rendered;
    const description = render(spec.descriptionTemplate, context).rendered;
    const impactStatement = spec.impactStatementTemplate
      ? render(spec.impactStatementTemplate, context).rendered || null
      : null;
    const roleTitle = spec.roleTitleTemplate
      ? render(spec.roleTitleTemplate, context).rendered || null
      : null;

    const now = new Date();
    const dueAt =
      spec.dueDays != null
        ? new Date(now.getTime() + spec.dueDays * 86_400_000)
        : null;
    const availableAt =
      spec.availableInDays != null
        ? new Date(now.getTime() + spec.availableInDays * 86_400_000)
        : null;

    const skillTags = spec.skillTagTemplates
      .map((t) => render(t, context).rendered)
      .filter(Boolean);
    const interestTags = spec.interestTagTemplates
      .map((t) => render(t, context).rendered)
      .filter(Boolean);

    const baseUpdate = {
      title,
      description,
      impactStatement,
      roleTitle,
      category: spec.category,
      estimatedEffortHours: spec.estimatedEffortHours,
      dueAt,
      availableAt,
      deadlinePolicy: mapDeadlinePolicy(spec.deadlinePolicy),
      claimPolicy: spec.claimPolicy,
      isPublic: spec.isPublic,
      skillTags,
      interestTags,
      assigneePersonId,
      assigneeOrganizationId,
      parentTaskId: parentRes.parentTaskId,
      // Persist the spec's sortOrder so dashboards can sort sibling tasks by
      // intended order (e.g. signTreatyPersonally=0 -> completeTraining=50).
      // Prior to 2026-04-30 this field was omitted, so every spawned task had
      // sortOrder=null and the dashboard sort was a no-op; primary task fell
      // back to updatedAt order, which surfaced assignSecondHuman (the
      // second-to-last spawned) instead of signTreatyPersonally for fresh users.
      sortOrder: spec.sortOrder,
    };

    const baseCreate = {
      ...baseUpdate,
      createdByUserId,
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
          tx as unknown as Parameters<
            typeof upsertPrimaryTaskCommunicationEndpoint
          >[0],
          task.id,
          { url, label, instructions },
        );
      }
    }
  }

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

export async function fireVerifyTask(
  tx: FireDb,
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  actorUserId: string | null,
): Promise<FireResult> {
  const parentTask = await tx.task.findFirst({
    where: { taskKey: idempotencyKey, deletedAt: null },
    select: { createdByUserId: true, id: true, status: true },
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
  const verified = await maybeVerifyByGate(
    tx,
    trigger,
    parentTask.id,
    context,
    actorUserId,
  );
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
  const inputParentId = scope === "siblings" ? target.parentTaskId : target.id;
  if (scope === "siblings" && !inputParentId) return false;

  const inputs = await tx.task.findMany({
    where: { parentTaskId: inputParentId, deletedAt: null },
    select: { id: true, taskKey: true, status: true },
  });

  const prefixSourceTaskId = scope === "siblings" ? inputParentId : target.id;
  const prefixSource = await tx.task.findUnique({
    where: { id: prefixSourceTaskId! },
    select: { taskKey: true },
  });
  const prefix = prefixSource?.taskKey ? `${prefixSource.taskKey}:` : "";
  const gateInputs: GateChild[] = inputs.map((c) => ({
    spawnKind: c.taskKey?.startsWith(prefix)
      ? c.taskKey.slice(prefix.length)
      : (c.taskKey ?? ""),
    status: c.status,
  }));
  if (!isGateMet(trigger.completionGate, gateInputs)) return false;

  const evidenceTpl = gateEvidenceTemplate(trigger.completionGate);
  const evidence = evidenceTpl
    ? render(evidenceTpl, context).rendered
    : "Completion gate met.";
  const now = new Date();
  const updated = await tx.task.updateMany({
    where: {
      id: verifyTargetId,
      deletedAt: null,
      status: { not: TaskStatus.VERIFIED },
    },
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

// SCOPE: creates a TaskComment + a TaskCommunication row, then attempts to
// send the email via Resend. The TaskCommunication is written before the
// provider call so the attempt remains auditable if the send/update fails.
//
// Recipients are resolved from (in priority order):
//   1. The task's primary EMAIL/MAILTO `TaskCommunicationEndpoint`
//   2. The assignee Organization's `contactEmail`
//   3. The assignee Person's `email`
// If none resolve, status=FAILED with reason "no recipient email".
export async function fireSpawnCommunication(
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
  const taskIdValue = lookup(context, "task.id");
  if (typeof taskIdValue !== "string") {
    return finished("failed", trigger.triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      error: "spawnCommunication requires context.task.id",
    });
  }
  const taskId = taskIdValue;
  let attemptedSendCount = 0;
  let sentCount = 0;
  const unsentReasons: string[] = [];

  const priorSendCount = await tx.taskCommunication.count({
    where: {
      taskId,
      deletedAt: null,
      direction: "OUTBOUND",
      status: TaskCommunicationStatus.SENT,
      sentAt: { not: null },
      metadataJson: {
        path: ["triggerId"],
        equals: trigger.id,
      },
    },
  });

  for (const spec of specs) {
    const dedupeKey = render(spec.dedupeKeyTemplate, context).rendered;
    if (!dedupeKey) continue;

    if (priorSendCount < spec.minSendCount) continue;
    if (spec.maxSendCount != null && priorSendCount > spec.maxSendCount)
      continue;

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
              direction: "OUTBOUND",
              status: TaskCommunicationStatus.SENT,
              sentAt: { gte: window },
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
    const bodyHtml = spec.bodyHtmlTemplate
      ? render(spec.bodyHtmlTemplate, context).rendered
      : null;
    const commentMessage = spec.commentTemplate
      ? render(spec.commentTemplate, context).rendered
      : subject;

    const comment = await tx.taskComment.create({
      data: {
        taskId,
        authorUserId: actorUserId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message: commentMessage,
        source: TaskCommentSource.WEB,
      },
    });

    const resolved = await resolveTaskRecipientEmail(tx, taskId);
    const replyTo = getReplyAddress(taskId);

    const communication = await tx.taskCommunication.create({
      data: {
        taskId,
        taskCommentId: comment.id,
        direction: "OUTBOUND",
        recipientEmail: resolved.email,
        failedAt: resolved.email ? null : new Date(),
        status: resolved.email
          ? TaskCommunicationStatus.DRAFT
          : TaskCommunicationStatus.FAILED,
        errorMessage: resolved.email === null ? resolved.reason : null,
        metadataJson: {
          triggerId: trigger.id,
          triggerKey: trigger.triggerKey,
          specKind: spec.kind,
          subject,
          bodyText,
          bodyHtml,
          dedupeKey,
          replyTo,
        } as Prisma.InputJsonValue,
        audience: "ASSIGNEE",
        purpose: "REMINDER",
      },
    });
    attemptedSendCount++;

    if (resolved.email === null) {
      unsentReasons.push(`${spec.kind}: ${resolved.reason}`);
      continue;
    }
    const recipient = resolved.email;

    const sendResult = await sendTaskNotificationEmail({
      taskId,
      recipientEmail: recipient,
      subject,
      text: bodyText,
      html: bodyHtml ?? undefined,
    });

    const sentAt = sendResult.status === "sent" ? new Date() : null;
    const failedAt = sendResult.status === "failed" ? new Date() : null;
    const status =
      sendResult.status === "sent"
        ? TaskCommunicationStatus.SENT
        : sendResult.status === "failed"
          ? TaskCommunicationStatus.FAILED
          : TaskCommunicationStatus.DRAFT; // disabled (no email infra) -> leave DRAFT

    await tx.taskCommunication.update({
      where: { id: communication.id },
      data: {
        sentAt,
        failedAt,
        status,
        errorMessage: sendResult.errorMessage ?? null,
        providerMessageId: sendResult.providerMessageId ?? null,
      },
    });

    if (sendResult.status === "sent") {
      sentCount++;
    } else {
      unsentReasons.push(
        `${spec.kind}: ${sendResult.status}${
          sendResult.errorMessage ? ` (${sendResult.errorMessage})` : ""
        }`,
      );
    }
  }
  if (attemptedSendCount > 0 && sentCount === 0) {
    return {
      result: "failed",
      triggerId: trigger.id,
      triggerKey: trigger.triggerKey,
      idempotencyKey,
      spawnedSpecs: [],
      spawnedTaskIds: [taskId],
      spawnedTaskKeys: [],
      error: unsentReasons.join("; ") || "no communication sent",
    };
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

type ResolvedTriggerRecipient =
  | { email: string }
  | { email: null; reason: string };

/**
 * Resolve the email address for a task notification.
 *
 * Priority: primary EMAIL/MAILTO TaskCommunicationEndpoint, then the assignee
 * organization's contactEmail, then the assignee person's email.
 *
 * PRIVATE/DRAFT guard: non-public or draft tasks must not email external
 * parties (endpoint emails, org contact addresses, bare person emails) —
 * only an assignee backed by a User account may be contacted. When nothing
 * resolves, the caller marks the TaskCommunication row FAILED with the
 * returned reason so the omission is visible in audit reads.
 */
async function resolveTaskRecipientEmail(
  tx: FireDb,
  taskId: string,
): Promise<ResolvedTriggerRecipient> {
  const task = await tx.task.findUnique({
    where: { id: taskId },
    select: {
      isPublic: true,
      status: true,
      assigneeOrganization: { select: { contactEmail: true } },
      assigneePerson: {
        select: {
          email: true,
          user: { select: { deletedAt: true, email: true } },
        },
      },
    },
  });
  if (!task) {
    return { email: null, reason: "no recipient email resolved" };
  }

  const restricted = !task.isPublic || task.status === TaskStatus.DRAFT;
  if (restricted) {
    const userEmail =
      task.assigneePerson?.user && !task.assigneePerson.user.deletedAt
        ? task.assigneePerson.user.email
        : null;
    if (userEmail) return { email: userEmail };
    return { email: null, reason: "private_task_external_recipient_blocked" };
  }

  // 1) Primary email-capable endpoint takes precedence (operator-set contact method).
  const endpoint = await tx.taskCommunicationEndpoint.findFirst({
    where: {
      taskId,
      kind: { in: ["EMAIL", "MAILTO"] },
      isPrimary: true,
      deletedAt: null,
      email: { not: null },
    },
    select: { email: true },
  });
  if (endpoint?.email) return { email: endpoint.email };

  // 2) Assignee org contactEmail
  if (task.assigneeOrganization?.contactEmail) {
    return { email: task.assigneeOrganization.contactEmail };
  }
  // 3) Assignee person email
  if (task.assigneePerson?.email) {
    return { email: task.assigneePerson.email };
  }
  return { email: null, reason: "no recipient email resolved" };
}

export async function dryRunFire(
  trigger: LoadedTrigger,
  context: unknown,
  idempotencyKey: string,
  _actorUserId: string | null,
): Promise<FireResult> {
  const taskKeys: string[] = [];
  if (trigger.triggerKind === "spawnTasks") {
    for (const spec of trigger.spawnSpecs) {
      taskKeys.push(
        spec.isParent ? idempotencyKey : `${idempotencyKey}:${spec.kind}`,
      );
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

function mapDeadlinePolicy(
  value: string | null | undefined,
): TaskDeadlinePolicy {
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
