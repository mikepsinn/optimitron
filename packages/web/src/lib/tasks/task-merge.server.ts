import { TaskStatus, type Prisma } from "@optimitron/db";
import { isReservedPlanningRootTask } from "@optimitron/db/task-keys";
import { prisma } from "@/lib/prisma";

/**
 * Admin-only duplicate-task merge.
 *
 * Folds a duplicate task into a canonical task by re-pointing every live
 * relation, then soft-deletes the duplicate. All deletes in this codebase are
 * soft (deletedAt), so Prisma onDelete never fires — every re-point below is
 * explicit and runs inside ONE transaction.
 *
 * Unique-constraint rules: unique indexes include soft-deleted rows, so
 * collision checks compare against ALL canonical-side rows, while only live
 * duplicate-side rows are moved. Colliding rows stay on the duplicate and are
 * counted in skippedCollisions.
 *
 * Shape precedent: mergeDuplicatePerson in person.server.ts.
 */

type DbClient = Prisma.TransactionClient | typeof prisma;
type TxClient = Prisma.TransactionClient;

const MAX_ANCESTOR_DEPTH = 200;

export interface MergeTaskInput {
  canonicalTaskId: string;
  duplicateTaskId: string;
  now?: Date;
}

export interface MergeTaskReport {
  canonicalTaskId: string;
  duplicateTaskId: string;
  /** Rows re-pointed to the canonical task, per relation. */
  movedCounts: Record<string, number>;
  /**
   * Rows left on the duplicate per relation: unique-constraint collisions,
   * plus comments/attachments pinned to a colliding application.
   */
  skippedCollisions: Record<string, number>;
  /** duplicate<->canonical edges soft-deleted instead of becoming self-edges. */
  droppedSelfEdges: number;
  /** Set when the merge was refused. No writes happened. */
  refused?: string;
}

interface MergeableTask {
  contextJson: Prisma.JsonValue | null;
  currentImpactEstimateSetId: string | null;
  id: string;
  parentTaskId: string | null;
  taskKey: string | null;
}

function asJsonObject(
  value: Prisma.JsonValue | null | undefined,
): Prisma.JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : {};
}

function splitOnCollision<T extends { id: string }>(
  duplicateRows: T[],
  occupiedKeys: ReadonlySet<string>,
  keyOf: (row: T) => string | null,
): { collidingIds: string[]; movableIds: string[] } {
  const movableIds: string[] = [];
  const collidingIds: string[] = [];
  for (const row of duplicateRows) {
    const key = keyOf(row);
    if (key !== null && occupiedKeys.has(key)) {
      collidingIds.push(row.id);
    } else {
      movableIds.push(row.id);
    }
  }
  return { collidingIds, movableIds };
}

async function loadMergeableTask(
  tx: TxClient,
  id: string,
): Promise<MergeableTask | null> {
  return tx.task.findFirst({
    where: { deletedAt: null, id },
    select: {
      contextJson: true,
      currentImpactEstimateSetId: true,
      id: true,
      parentTaskId: true,
      taskKey: true,
    },
  });
}

/**
 * Walks canonical's parentTaskId chain upward.
 * Returns "direct-child" when canonical.parentTaskId === duplicate.id (the
 * caller re-parents canonical first), "descendant" when duplicate appears
 * deeper in the chain (refuse), "cap-exceeded" when the chain is too deep to
 * prove safe (refuse), and "unrelated" otherwise.
 */
async function classifyHierarchy(
  tx: TxClient,
  canonical: MergeableTask,
  duplicateId: string,
): Promise<"cap-exceeded" | "descendant" | "direct-child" | "unrelated"> {
  if (canonical.parentTaskId === duplicateId) return "direct-child";
  const visited = new Set<string>([canonical.id]);
  let current = canonical.parentTaskId;
  let depth = 0;
  while (current) {
    if (depth >= MAX_ANCESTOR_DEPTH) return "cap-exceeded";
    if (current === duplicateId) return "descendant";
    if (visited.has(current)) break;
    visited.add(current);
    const parent = await tx.task.findUnique({
      where: { id: current },
      select: { parentTaskId: true },
    });
    current = parent?.parentTaskId ?? null;
    depth += 1;
  }
  return "unrelated";
}

async function mergeTaskInClient(
  input: MergeTaskInput,
  tx: TxClient,
): Promise<MergeTaskReport> {
  const { canonicalTaskId, duplicateTaskId } = input;
  const movedCounts: Record<string, number> = {};
  const skippedCollisions: Record<string, number> = {};
  let droppedSelfEdges = 0;
  const refuse = (refused: string): MergeTaskReport => ({
    canonicalTaskId,
    droppedSelfEdges: 0,
    duplicateTaskId,
    movedCounts: {},
    refused,
    skippedCollisions: {},
  });

  // ── Invariants ────────────────────────────────────────────────────────
  if (duplicateTaskId === canonicalTaskId) {
    return refuse("duplicateTaskId and canonicalTaskId must be different.");
  }

  const [duplicate, canonical] = await Promise.all([
    loadMergeableTask(tx, duplicateTaskId),
    loadMergeableTask(tx, canonicalTaskId),
  ]);
  if (!duplicate) {
    return refuse(`Duplicate task not found or already deleted: ${duplicateTaskId}`);
  }
  if (!canonical) {
    return refuse(`Canonical task not found or already deleted: ${canonicalTaskId}`);
  }

  for (const task of [duplicate, canonical]) {
    if (isReservedPlanningRootTask(task)) {
      return refuse(
        `Task ${task.id} is a reserved planning root task and cannot be merged.`,
      );
    }
  }

  // A taskKey means the row is owned by managed sync or a task trigger (user
  // tasks have none). Soft-deleting a keyed duplicate would make its owner
  // resurrect or recreate it, silently undoing the merge — and adopting a
  // managed key under the canonical's id crashes the next managed sync. Refuse
  // rather than fold away a system-owned task; pick the keyed row as canonical.
  if (duplicate.taskKey !== null) {
    return refuse(
      `Duplicate task ${duplicate.id} has a managed/trigger taskKey (${duplicate.taskKey}) and cannot be merged away; make it the canonical task instead.`,
    );
  }

  // Serialize against concurrent merges touching the same rows: lock both task
  // rows FOR UPDATE so a racing merge (e.g. the daily duplicate-sweep agent and
  // a human admin on the same pair) blocks until this transaction commits, then
  // sees the soft-delete instead of re-pointing onto an already-merged task.
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Task"
    WHERE "id" IN (${duplicate.id}, ${canonical.id}) AND "deletedAt" IS NULL
    FOR UPDATE`;
  if (locked.length !== 2) {
    return refuse(
      "One of the tasks was deleted or merged by a concurrent operation; retry.",
    );
  }

  // 1:1 unique back-relations: refuse when both sides occupy the slot.
  // Unique indexes include soft-deleted rows, so a soft-deleted canonical-side
  // row still blocks the move.
  const duplicateFundingTarget = await tx.taskFundingTarget.findUnique({
    where: { taskId: duplicate.id },
    select: { deletedAt: true, id: true },
  });
  const liveDuplicateFundingTarget =
    duplicateFundingTarget && duplicateFundingTarget.deletedAt === null
      ? duplicateFundingTarget
      : null;
  if (liveDuplicateFundingTarget) {
    const canonicalFundingTarget = await tx.taskFundingTarget.findUnique({
      where: { taskId: canonical.id },
      select: { id: true },
    });
    if (canonicalFundingTarget) {
      return refuse(
        "Both tasks have a TaskFundingTarget; resolve funding manually before merging.",
      );
    }
  }

  const duplicateRootCase = await tx.courtCase.findUnique({
    where: { rootTaskId: duplicate.id },
    select: { deletedAt: true, id: true },
  });
  const liveDuplicateRootCase =
    duplicateRootCase && duplicateRootCase.deletedAt === null
      ? duplicateRootCase
      : null;
  if (liveDuplicateRootCase) {
    const canonicalRootCase = await tx.courtCase.findUnique({
      where: { rootTaskId: canonical.id },
      select: { id: true },
    });
    if (canonicalRootCase) {
      return refuse(
        "Both tasks are the root task of a CourtCase; resolve the cases manually before merging.",
      );
    }
  }

  const hierarchy = await classifyHierarchy(tx, canonical, duplicate.id);
  if (hierarchy === "descendant") {
    return refuse(
      "Canonical task is a descendant of the duplicate task; merging would create a hierarchy cycle.",
    );
  }
  if (hierarchy === "cap-exceeded") {
    return refuse(
      "Canonical task's ancestor chain is too deep to prove it is not a descendant of the duplicate; refusing to avoid a possible hierarchy cycle.",
    );
  }

  const now = input.now ?? new Date();

  // ── Hierarchy ─────────────────────────────────────────────────────────
  if (hierarchy === "direct-child") {
    await tx.task.update({
      where: { id: canonical.id },
      data: {
        parentTaskId:
          duplicate.parentTaskId === canonical.id ? null : duplicate.parentTaskId,
      },
    });
  }
  movedCounts.childTasks = (
    await tx.task.updateMany({
      where: {
        deletedAt: null,
        id: { not: canonical.id },
        parentTaskId: duplicate.id,
      },
      data: { parentTaskId: canonical.id },
    })
  ).count;

  // ── Unique-constrained relations (skip on collision) ──────────────────

  // claims — @@unique(taskId, userId). Track which claims stayed behind so a
  // TaskPayout referencing a left-behind claim stays with it (below).
  const collidedClaimIds: string[] = [];
  {
    const canonicalRows = await tx.taskClaim.findMany({
      where: { taskId: canonical.id },
      select: { userId: true },
    });
    const occupied = new Set(canonicalRows.map((row) => row.userId));
    const duplicateRows = await tx.taskClaim.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { id: true, userId: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => row.userId,
    );
    if (movableIds.length > 0) {
      await tx.taskClaim.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    collidedClaimIds.push(...collidingIds);
    movedCounts.claims = movableIds.length;
    skippedCollisions.claims = collidingIds.length;
  }

  // applications — @@unique(taskId, applicantUserId) + (taskId, applicantPersonId).
  // TaskComment carries a compound FK [taskApplicationId, taskId] →
  // TaskApplication[id, taskId] (NoAction, checked per statement), so
  // application-linked comments move via a null → move → restore dance in the
  // same transaction, and stay behind when their application collides.
  const applicationCollidingIds: string[] = [];
  {
    const canonicalRows = await tx.taskApplication.findMany({
      where: { taskId: canonical.id },
      select: { applicantPersonId: true, applicantUserId: true },
    });
    const occupiedUserIds = new Set(
      canonicalRows
        .map((row) => row.applicantUserId)
        .filter((value): value is string => value !== null),
    );
    const occupiedPersonIds = new Set(
      canonicalRows
        .map((row) => row.applicantPersonId)
        .filter((value): value is string => value !== null),
    );
    const duplicateRows = await tx.taskApplication.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { applicantPersonId: true, applicantUserId: true, id: true },
    });
    const movableIds: string[] = [];
    for (const row of duplicateRows) {
      const collides =
        (row.applicantUserId !== null &&
          occupiedUserIds.has(row.applicantUserId)) ||
        (row.applicantPersonId !== null &&
          occupiedPersonIds.has(row.applicantPersonId));
      if (collides) {
        applicationCollidingIds.push(row.id);
      } else {
        movableIds.push(row.id);
      }
    }

    // The compound FK binds every linked comment row — soft-deleted included —
    // so all comments of a moving application move with it.
    const linkedComments =
      movableIds.length > 0
        ? await tx.taskComment.findMany({
            where: {
              taskApplicationId: { in: movableIds },
              taskId: duplicate.id,
            },
            select: { id: true, taskApplicationId: true },
          })
        : [];
    if (linkedComments.length > 0) {
      await tx.taskComment.updateMany({
        where: { id: { in: linkedComments.map((row) => row.id) } },
        data: { taskApplicationId: null },
      });
    }
    if (movableIds.length > 0) {
      await tx.taskApplication.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    const commentIdsByApplication = new Map<string, string[]>();
    for (const comment of linkedComments) {
      if (!comment.taskApplicationId) continue;
      const list = commentIdsByApplication.get(comment.taskApplicationId) ?? [];
      list.push(comment.id);
      commentIdsByApplication.set(comment.taskApplicationId, list);
    }
    for (const [applicationId, commentIds] of commentIdsByApplication) {
      await tx.taskComment.updateMany({
        where: { id: { in: commentIds } },
        data: { taskApplicationId: applicationId, taskId: canonical.id },
      });
    }
    movedCounts.applications = movableIds.length;
    skippedCollisions.applications = applicationCollidingIds.length;
    movedCounts.comments = linkedComments.length;
  }

  // candidateMatches — @@unique(taskId, candidateKey, scoreVersion)
  {
    const canonicalRows = await tx.taskCandidateMatch.findMany({
      where: { taskId: canonical.id },
      select: { candidateKey: true, scoreVersion: true },
    });
    const occupied = new Set(
      canonicalRows.map((row) =>
        JSON.stringify([row.candidateKey, row.scoreVersion]),
      ),
    );
    const duplicateRows = await tx.taskCandidateMatch.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { candidateKey: true, id: true, scoreVersion: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => JSON.stringify([row.candidateKey, row.scoreVersion]),
    );
    if (movableIds.length > 0) {
      await tx.taskCandidateMatch.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.candidateMatches = movableIds.length;
    skippedCollisions.candidateMatches = collidingIds.length;
  }

  // ── Simple re-points (no unique constraint on taskId) ─────────────────
  movedCounts.executionAttempts = (
    await tx.taskExecutionAttempt.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.marketplaceListings = (
    await tx.taskMarketplaceListing.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.distributionAttempts = (
    await tx.taskDistributionAttempt.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  // managers — @@unique(taskId, userId)
  {
    const canonicalRows = await tx.taskManager.findMany({
      where: { taskId: canonical.id },
      select: { userId: true },
    });
    const occupied = new Set(canonicalRows.map((row) => row.userId));
    const duplicateRows = await tx.taskManager.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { id: true, userId: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => row.userId,
    );
    if (movableIds.length > 0) {
      await tx.taskManager.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.managers = movableIds.length;
    skippedCollisions.managers = collidingIds.length;
  }

  // Comments not linked to an application move freely; application-linked
  // ones were handled with their applications above.
  movedCounts.comments =
    (movedCounts.comments ?? 0) +
    (
      await tx.taskComment.updateMany({
        where: {
          deletedAt: null,
          taskApplicationId: null,
          taskId: duplicate.id,
        },
        data: { taskId: canonical.id },
      })
    ).count;
  if (applicationCollidingIds.length > 0) {
    // Count only live comments stranded on a colliding application, so the
    // report reflects content that actually stayed behind.
    skippedCollisions.comments = await tx.taskComment.count({
      where: {
        deletedAt: null,
        taskApplicationId: { in: applicationCollidingIds },
        taskId: duplicate.id,
      },
    });
  } else {
    skippedCollisions.comments = 0;
  }

  // Attachments follow their comment: an attachment whose comment stayed on
  // the duplicate (colliding application) keeps its taskId so download auth
  // still resolves against the comment's task.
  movedCounts.commentAttachments = (
    await tx.taskCommentAttachment.updateMany({
      where: {
        deletedAt: null,
        taskId: duplicate.id,
        OR: [{ commentId: null }, { comment: { taskId: canonical.id } }],
      },
      data: { taskId: canonical.id },
    })
  ).count;

  // sourceArtifacts — @@unique(taskId, sourceArtifactId)
  {
    const canonicalRows = await tx.taskSourceArtifact.findMany({
      where: { taskId: canonical.id },
      select: { sourceArtifactId: true },
    });
    const occupied = new Set(canonicalRows.map((row) => row.sourceArtifactId));
    const duplicateRows = await tx.taskSourceArtifact.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { id: true, sourceArtifactId: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => row.sourceArtifactId,
    );
    if (movableIds.length > 0) {
      await tx.taskSourceArtifact.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.sourceArtifacts = movableIds.length;
    skippedCollisions.sourceArtifacts = collidingIds.length;
  }

  // edges — @@unique(fromTaskId, toTaskId, edgeType); duplicate<->canonical
  // edges would become self-edges, so they are soft-deleted instead.
  {
    const canonicalOutgoing = await tx.taskEdge.findMany({
      where: { fromTaskId: canonical.id },
      select: { edgeType: true, toTaskId: true },
    });
    const occupied = new Set(
      canonicalOutgoing.map((row) => JSON.stringify([row.toTaskId, row.edgeType])),
    );
    const duplicateRows = await tx.taskEdge.findMany({
      where: { deletedAt: null, fromTaskId: duplicate.id },
      select: { edgeType: true, id: true, toTaskId: true },
    });
    const selfEdgeIds = duplicateRows
      .filter((row) => row.toTaskId === canonical.id)
      .map((row) => row.id);
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows.filter((row) => row.toTaskId !== canonical.id),
      occupied,
      (row) => JSON.stringify([row.toTaskId, row.edgeType]),
    );
    if (selfEdgeIds.length > 0) {
      await tx.taskEdge.updateMany({
        where: { id: { in: selfEdgeIds } },
        data: { deletedAt: now },
      });
    }
    if (movableIds.length > 0) {
      await tx.taskEdge.updateMany({
        where: { id: { in: movableIds } },
        data: { fromTaskId: canonical.id },
      });
    }
    droppedSelfEdges += selfEdgeIds.length;
    movedCounts.outgoingEdges = movableIds.length;
    skippedCollisions.outgoingEdges = collidingIds.length;
  }
  {
    const canonicalIncoming = await tx.taskEdge.findMany({
      where: { toTaskId: canonical.id },
      select: { edgeType: true, fromTaskId: true },
    });
    const occupied = new Set(
      canonicalIncoming.map((row) =>
        JSON.stringify([row.fromTaskId, row.edgeType]),
      ),
    );
    const duplicateRows = await tx.taskEdge.findMany({
      where: { deletedAt: null, toTaskId: duplicate.id },
      select: { edgeType: true, fromTaskId: true, id: true },
    });
    const selfEdgeIds = duplicateRows
      .filter((row) => row.fromTaskId === canonical.id)
      .map((row) => row.id);
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows.filter((row) => row.fromTaskId !== canonical.id),
      occupied,
      (row) => JSON.stringify([row.fromTaskId, row.edgeType]),
    );
    if (selfEdgeIds.length > 0) {
      await tx.taskEdge.updateMany({
        where: { id: { in: selfEdgeIds } },
        data: { deletedAt: now },
      });
    }
    if (movableIds.length > 0) {
      await tx.taskEdge.updateMany({
        where: { id: { in: movableIds } },
        data: { toTaskId: canonical.id },
      });
    }
    droppedSelfEdges += selfEdgeIds.length;
    movedCounts.incomingEdges = movableIds.length;
    skippedCollisions.incomingEdges = collidingIds.length;
  }

  // agentLeases — @@unique(taskId, agentId), no deletedAt column
  {
    const canonicalRows = await tx.agentTaskLease.findMany({
      where: { taskId: canonical.id },
      select: { agentId: true },
    });
    const occupied = new Set(canonicalRows.map((row) => row.agentId));
    const duplicateRows = await tx.agentTaskLease.findMany({
      where: { taskId: duplicate.id },
      select: { agentId: true, id: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => row.agentId,
    );
    if (movableIds.length > 0) {
      await tx.agentTaskLease.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.agentLeases = movableIds.length;
    skippedCollisions.agentLeases = collidingIds.length;
  }

  // shareAttempts — nullable taskId, no deletedAt column
  movedCounts.shareAttempts = (
    await tx.shareAttempt.updateMany({
      where: { taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.referralInvitations = (
    await tx.referralInvitation.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.datingDatePlans = (
    await tx.datingDatePlan.updateMany({
      where: { campaignTaskId: duplicate.id, deletedAt: null },
      data: { campaignTaskId: canonical.id },
    })
  ).count;

  // communicationEndpoints — demote the duplicate's primary endpoint when the
  // canonical already has one, so the canonical keeps a single primary.
  {
    const canonicalPrimary = await tx.taskCommunicationEndpoint.findFirst({
      where: { deletedAt: null, isPrimary: true, taskId: canonical.id },
      select: { id: true },
    });
    if (canonicalPrimary) {
      await tx.taskCommunicationEndpoint.updateMany({
        where: { deletedAt: null, isPrimary: true, taskId: duplicate.id },
        data: { isPrimary: false },
      });
    }
    movedCounts.communicationEndpoints = (
      await tx.taskCommunicationEndpoint.updateMany({
        where: { deletedAt: null, taskId: duplicate.id },
        data: { taskId: canonical.id },
      })
    ).count;
  }

  // communicationTemplates — @@unique(taskId, audience, purpose)
  {
    const canonicalRows = await tx.taskCommunicationTemplate.findMany({
      where: { taskId: canonical.id },
      select: { audience: true, purpose: true },
    });
    const occupied = new Set(
      canonicalRows.map((row) => JSON.stringify([row.audience, row.purpose])),
    );
    const duplicateRows = await tx.taskCommunicationTemplate.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: { audience: true, id: true, purpose: true },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      (row) => JSON.stringify([row.audience, row.purpose]),
    );
    if (movableIds.length > 0) {
      await tx.taskCommunicationTemplate.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.communicationTemplates = movableIds.length;
    skippedCollisions.communicationTemplates = collidingIds.length;
  }

  movedCounts.communications = (
    await tx.taskCommunication.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.courtCaseRemediesEnforced = (
    await tx.courtCaseRemedy.updateMany({
      where: { deletedAt: null, enforcementTaskId: duplicate.id },
      data: { enforcementTaskId: canonical.id },
    })
  ).count;

  movedCounts.fundingPayments = (
    await tx.taskFundingPayment.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  // payouts — a payout references a TaskClaim. A payout whose claim collided
  // and stayed on the duplicate must stay too, or it would point at a claim on
  // a different task. Move only payouts with a moved claim (or no claim).
  {
    const stayWhere =
      collidedClaimIds.length > 0
        ? {
            deletedAt: null,
            taskId: duplicate.id,
            taskClaimId: { in: collidedClaimIds },
          }
        : null;
    const moveWhere: Prisma.TaskPayoutWhereInput = {
      deletedAt: null,
      taskId: duplicate.id,
      ...(collidedClaimIds.length > 0
        ? { NOT: { taskClaimId: { in: collidedClaimIds } } }
        : {}),
    };
    movedCounts.payouts = (
      await tx.taskPayout.updateMany({
        where: moveWhere,
        data: { taskId: canonical.id },
      })
    ).count;
    skippedCollisions.payouts = stayWhere
      ? await tx.taskPayout.count({ where: stayWhere })
      : 0;
  }

  movedCounts.documents = (
    await tx.document.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.linkedCollectionRecords = (
    await tx.collectionRecord.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  movedCounts.targetedCollectionRelations = (
    await tx.collectionRelation.updateMany({
      where: { deletedAt: null, targetTaskId: duplicate.id },
      data: { targetTaskId: canonical.id },
    })
  ).count;

  movedCounts.externalActionRequests = (
    await tx.externalActionRequest.updateMany({
      where: { deletedAt: null, taskId: duplicate.id },
      data: { taskId: canonical.id },
    })
  ).count;

  // impactEstimateSets — 7-column compound unique. Clear the duplicate's
  // @unique currentImpactEstimateSetId back-pointer first; the canonical
  // adopts the duplicate's current set only when it has none of its own and
  // the set actually moved.
  {
    if (duplicate.currentImpactEstimateSetId) {
      await tx.task.update({
        where: { id: duplicate.id },
        data: { currentImpactEstimateSetId: null },
      });
    }
    const canonicalRows = await tx.taskImpactEstimateSet.findMany({
      where: { taskId: canonical.id },
      select: {
        calculationVersion: true,
        counterfactualKey: true,
        estimateKind: true,
        methodologyKey: true,
        parameterSetHash: true,
        sourceSystem: true,
      },
    });
    const keyOf = (row: {
      calculationVersion: string;
      counterfactualKey: string;
      estimateKind: string;
      methodologyKey: string;
      parameterSetHash: string;
      sourceSystem: string;
    }) =>
      JSON.stringify([
        row.estimateKind,
        row.sourceSystem,
        row.calculationVersion,
        row.methodologyKey,
        row.parameterSetHash,
        row.counterfactualKey,
      ]);
    const occupied = new Set(canonicalRows.map(keyOf));
    const duplicateRows = await tx.taskImpactEstimateSet.findMany({
      where: { deletedAt: null, taskId: duplicate.id },
      select: {
        calculationVersion: true,
        counterfactualKey: true,
        estimateKind: true,
        id: true,
        methodologyKey: true,
        parameterSetHash: true,
        sourceSystem: true,
      },
    });
    const { collidingIds, movableIds } = splitOnCollision(
      duplicateRows,
      occupied,
      keyOf,
    );
    if (movableIds.length > 0) {
      await tx.taskImpactEstimateSet.updateMany({
        where: { id: { in: movableIds } },
        data: { taskId: canonical.id },
      });
    }
    movedCounts.impactEstimateSets = movableIds.length;
    skippedCollisions.impactEstimateSets = collidingIds.length;

    const duplicateCurrentId = duplicate.currentImpactEstimateSetId;
    if (duplicateCurrentId) {
      const canonicalAdopts =
        canonical.currentImpactEstimateSetId === null &&
        movableIds.includes(duplicateCurrentId);
      if (canonicalAdopts) {
        await tx.task.update({
          where: { id: canonical.id },
          data: { currentImpactEstimateSetId: duplicateCurrentId },
        });
      } else {
        // No longer current anywhere — keep the denormalized flag in sync.
        await tx.taskImpactEstimateSet.updateMany({
          where: { id: duplicateCurrentId },
          data: { isCurrent: false },
        });
      }
    }
  }

  // fundingTarget — 1:1 @unique(taskId); the both-sides case refused above.
  if (liveDuplicateFundingTarget) {
    movedCounts.fundingTarget = (
      await tx.taskFundingTarget.updateMany({
        where: { id: liveDuplicateFundingTarget.id },
        data: { taskId: canonical.id },
      })
    ).count;
  } else {
    movedCounts.fundingTarget = 0;
  }

  // courtCaseRootFor — CourtCase.rootTaskId @unique; both-sides case refused above.
  if (liveDuplicateRootCase) {
    movedCounts.courtCaseRootFor = (
      await tx.courtCase.updateMany({
        where: { id: liveDuplicateRootCase.id },
        data: { rootTaskId: canonical.id },
      })
    ).count;
  } else {
    movedCounts.courtCaseRootFor = 0;
  }

  // ── provenance, soft delete ───────────────────────────────────────────
  // The duplicate has no taskKey (keyed rows are refused above), so there is
  // nothing to transfer and no unique-index contention on the canonical.
  const duplicateContext = {
    ...asJsonObject(duplicate.contextJson),
    mergedIntoTaskId: canonical.id,
  };
  const canonicalContext = asJsonObject(canonical.contextJson);
  const priorMergedFrom = Array.isArray(canonicalContext.mergedFromTaskIds)
    ? canonicalContext.mergedFromTaskIds.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const mergedFromTaskIds = priorMergedFrom.includes(duplicate.id)
    ? priorMergedFrom
    : [...priorMergedFrom, duplicate.id];

  // Guarded soft-delete: the FOR UPDATE lock above already serialized racing
  // merges, but re-assert liveness so a merge can never soft-delete a row a
  // concurrent commit already deleted (belt-and-suspenders; aborts the tx).
  const deleted = await tx.task.updateMany({
    where: { deletedAt: null, id: duplicate.id },
    data: {
      contextJson: duplicateContext,
      deletedAt: now,
      status: TaskStatus.STALE,
    },
  });
  if (deleted.count !== 1) {
    throw new Error(
      `mergeTask: duplicate task ${duplicate.id} was concurrently modified; transaction rolled back.`,
    );
  }
  await tx.task.update({
    where: { id: canonical.id },
    data: { contextJson: { ...canonicalContext, mergedFromTaskIds } },
  });

  return {
    canonicalTaskId,
    droppedSelfEdges,
    duplicateTaskId,
    movedCounts,
    skippedCollisions,
  };
}

/**
 * Merge a duplicate task into a canonical task inside one transaction.
 * Refusals (same id, missing/deleted task, reserved planning root, hierarchy
 * cycle, both-sides 1:1 conflicts) return `refused` with no writes performed.
 * The canonical task's status, completion, and actuals are never changed.
 */
export async function mergeTask(
  input: MergeTaskInput,
  db: DbClient = prisma,
): Promise<MergeTaskReport> {
  if ("$transaction" in db) {
    return db.$transaction((tx) => mergeTaskInClient(input, tx), {
      maxWait: 10_000,
      timeout: 60_000,
    });
  }
  return mergeTaskInClient(input, db);
}
