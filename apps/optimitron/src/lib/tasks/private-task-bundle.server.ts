import {
  SourceArtifactType,
  SourceSystem,
  OrganizationMemberRole,
  TaskCategory,
  TaskClaimPolicy,
  TaskEdgeType,
  TaskExecutionMode,
  TaskImpactFrameKey,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createDirectTaskImpactInTransaction } from "@/lib/parameters/task-impact-calculation.server";
import {
  canUserCommentOnTask,
  getTaskAccessWhere,
} from "@/lib/tasks/task-visibility.server";

const EstimateRangeSchema = z
  .object({
    base: z.number().finite(),
    high: z.number().finite(),
    low: z.number().finite(),
  })
  .refine((value) => value.low <= value.base && value.base <= value.high, {
    message: "Estimate ranges must satisfy low <= base <= high",
  });

const NonnegativeEstimateRangeSchema = EstimateRangeSchema.refine(
  (value) => value.low >= 0,
  { message: "Cost and duration estimates cannot be negative" },
);

const ProbabilityRangeSchema = EstimateRangeSchema.refine(
  (value) => value.low >= 0 && value.high <= 1,
  { message: "Probability estimates must be between 0 and 1" },
);

const PrivateSourceSelectionSchema = z
  .object({
    approvedExcerpts: z
      .array(
        z
          .object({
            anchor: z.string().min(1).max(500),
            excerpt: z.string().min(1).max(4_000),
            timestamp: z.string().datetime().nullable().optional(),
          })
          .strict(),
      )
      .max(100)
      .default([]),
    capturedAt: z.string().datetime().nullable().optional(),
    channel: z.enum([
      "DISCORD",
      "EMAIL",
      "GITHUB",
      "MEETING_NOTES",
      "NOTION",
      "SLACK",
      "TELEGRAM",
      "WHATSAPP",
      "OTHER",
    ]),
    messageAnchors: z.array(z.string().min(1).max(500)).min(1).max(500),
    participantAliases: z
      .array(z.string().min(1).max(200))
      .max(100)
      .default([]),
    selectionHash: z.string().min(16).max(256),
    selectionId: z.string().min(1).max(500),
    sourceUrl: z.string().url().nullable().optional(),
    title: z.string().min(1).max(500),
    userSelected: z.literal(true),
  })
  .strict();

const PrivateTaskCandidateSchema = z
  .object({
    acceptanceCriteria: z.array(z.string().min(1).max(2_000)).min(1).max(50),
    category: z.nativeEnum(TaskCategory).default(TaskCategory.OTHER),
    clarificationNeeded: z.string().min(1).max(2_000).nullable().optional(),
    dependencyRefs: z.array(z.string().min(1).max(500)).max(100).default([]),
    description: z.string().min(1).max(100_000),
    dueAt: z.string().datetime().nullable().optional(),
    eligibleExecutorTypes: z
      .array(z.enum(["AGENT", "HUMAN"]))
      .min(1)
      .max(2),
    estimatedCostUsd: NonnegativeEstimateRangeSchema,
    estimatedDurationSeconds: NonnegativeEstimateRangeSchema.refine(
      (value) => value.base > 0,
      { message: "Base duration must be greater than zero" },
    ),
    expectedDeliverable: z.string().min(1).max(10_000),
    expectedValueUsd: EstimateRangeSchema,
    groundedByAnchors: z.array(z.string().min(1).max(500)).min(1).max(100),
    objectiveServed: z.string().min(1).max(2_000),
    parentRef: z.string().min(1).max(500).nullable().optional(),
    privacyClassification: z.enum([
      "ORGANIZATION_CONFIDENTIAL",
      "PERSONAL_PRIVATE",
    ]),
    projectOrWorkflow: z.string().min(1).max(2_000),
    ref: z.string().min(1).max(500),
    requiredObligation: z.boolean().default(false),
    safetyGuardrail: z.boolean().default(false),
    successProbability: ProbabilityRangeSchema,
    title: z.string().min(1).max(500),
  })
  .strict();

export const PrivateTaskBundleSchema = z
  .object({
    candidates: z.array(PrivateTaskCandidateSchema).min(1).max(100),
    rootTaskId: z.string().min(1),
    source: PrivateSourceSelectionSchema,
  })
  .strict()
  .superRefine((bundle, context) => {
    const refs = new Set<string>();
    for (const [index, candidate] of bundle.candidates.entries()) {
      if (refs.has(candidate.ref)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate candidate ref: ${candidate.ref}`,
          path: ["candidates", index, "ref"],
        });
      }
      refs.add(candidate.ref);
      const sourceAnchors = new Set(bundle.source.messageAnchors);
      for (const anchor of candidate.groundedByAnchors) {
        if (!sourceAnchors.has(anchor)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Grounding anchor is outside the selected source batch: ${anchor}`,
            path: ["candidates", index, "groundedByAnchors"],
          });
        }
      }
    }
  });

export type PrivateTaskBundle = z.infer<typeof PrivateTaskBundleSchema>;
type PrivateTaskCandidate = PrivateTaskBundle["candidates"][number];

interface ReviewAction {
  candidateRef: string;
  taskId?: string;
  taskKey: string;
  title: string;
}

export interface PrivateTaskBundleReview {
  create: ReviewAction[];
  duplicates: ReviewAction[];
  errors: Array<{ candidateRef?: string; message: string }>;
  normalizedBundle: PrivateTaskBundle | null;
  reviewHash: string | null;
  root: { id: string; title: string } | null;
  update: ReviewAction[];
}

function importedTaskKey(
  actorUserId: string,
  selectionId: string,
  candidateRef: string,
) {
  return `private-import:${actorUserId}:${selectionId}:${candidateRef}`;
}

function findReferenceCycles(bundle: PrivateTaskBundle) {
  const refs = new Set(bundle.candidates.map((candidate) => candidate.ref));
  const graph = new Map<string, string[]>();
  for (const candidate of bundle.candidates) {
    graph.set(candidate.ref, [
      ...(candidate.parentRef && refs.has(candidate.parentRef)
        ? [candidate.parentRef]
        : []),
      ...candidate.dependencyRefs.filter((ref) => refs.has(ref)),
    ]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cyclic = new Set<string>();
  function visit(ref: string) {
    if (visiting.has(ref)) {
      cyclic.add(ref);
      return;
    }
    if (visited.has(ref)) return;
    visiting.add(ref);
    for (const next of graph.get(ref) ?? []) {
      if (visiting.has(next)) {
        cyclic.add(ref);
        cyclic.add(next);
      } else {
        visit(next);
        if (cyclic.has(next)) cyclic.add(ref);
      }
    }
    visiting.delete(ref);
    visited.add(ref);
  }
  for (const ref of refs) visit(ref);
  return cyclic;
}

async function loadReviewRoot(actorUserId: string, rootTaskId: string) {
  if (!(await canUserCommentOnTask(rootTaskId, actorUserId))) return null;
  return prisma.task.findFirst({
    where: { deletedAt: null, id: rootTaskId, isPublic: false },
    select: {
      assigneePersonId: true,
      createdByUserId: true,
      id: true,
      ownerOrganizationId: true,
      title: true,
    },
  });
}

export async function reviewPrivateTaskBundle(
  rawInput: unknown,
  actorUserId: string,
): Promise<PrivateTaskBundleReview> {
  const parsed = PrivateTaskBundleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      create: [],
      duplicates: [],
      errors: parsed.error.issues.map((issue) => ({ message: issue.message })),
      normalizedBundle: null,
      reviewHash: null,
      root: null,
      update: [],
    };
  }

  const bundle = parsed.data;
  const root = await loadReviewRoot(actorUserId, bundle.rootTaskId);
  const errors: PrivateTaskBundleReview["errors"] = [];
  if (!root) {
    errors.push({ message: "Private root task not found" });
  }

  const cyclicRefs = findReferenceCycles(bundle);
  for (const candidateRef of cyclicRefs) {
    errors.push({
      candidateRef,
      message: "Candidate parent/dependency references contain a cycle",
    });
  }

  const candidateRefs = new Set(
    bundle.candidates.map((candidate) => candidate.ref),
  );
  const externalRefs = new Set<string>();
  for (const candidate of bundle.candidates) {
    if (candidate.parentRef && !candidateRefs.has(candidate.parentRef)) {
      externalRefs.add(candidate.parentRef);
    }
    for (const ref of candidate.dependencyRefs) {
      if (!candidateRefs.has(ref)) externalRefs.add(ref);
    }
  }

  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
  const externalTasks =
    externalRefs.size === 0
      ? []
      : await prisma.task.findMany({
          where: {
            deletedAt: null,
            id: { in: [...externalRefs] },
            ...getTaskAccessWhere({
              action: "READ",
              personId: actor?.personId ?? null,
              userId: actorUserId,
            }),
          },
          select: { id: true },
        });
  const foundExternalRefs = new Set(externalTasks.map((task) => task.id));
  for (const ref of externalRefs) {
    if (!foundExternalRefs.has(ref)) {
      errors.push({ message: "Referenced task not found or inaccessible" });
    }
  }

  const taskKeys = bundle.candidates.map((candidate) =>
    importedTaskKey(actorUserId, bundle.source.selectionId, candidate.ref),
  );
  const existingByKey = await prisma.task.findMany({
    where: { deletedAt: null, taskKey: { in: taskKeys } },
    select: { id: true, status: true, taskKey: true, title: true },
  });
  const existingKeyMap = new Map(
    existingByKey.flatMap((task) =>
      task.taskKey ? [[task.taskKey, task] as const] : [],
    ),
  );

  const exactTitleTasks = root
    ? await prisma.task.findMany({
        where: {
          deletedAt: null,
          ...(root.ownerOrganizationId
            ? { ownerOrganizationId: root.ownerOrganizationId }
            : { createdByUserId: actorUserId }),
          parentTaskId: root.id,
          title: {
            in: bundle.candidates.map((candidate) => candidate.title),
            mode: "insensitive",
          },
        },
        select: { id: true, status: true, taskKey: true, title: true },
      })
    : [];
  const titleMap = new Map(
    exactTitleTasks.map((task) => [task.title.trim().toLowerCase(), task]),
  );

  const create: ReviewAction[] = [];
  const update: ReviewAction[] = [];
  const duplicates: ReviewAction[] = [];
  for (const candidate of bundle.candidates) {
    const taskKey = importedTaskKey(
      actorUserId,
      bundle.source.selectionId,
      candidate.ref,
    );
    const existing = existingKeyMap.get(taskKey);
    const exactTitle = titleMap.get(candidate.title.trim().toLowerCase());
    const action = {
      candidateRef: candidate.ref,
      taskId: existing?.id ?? exactTitle?.id,
      taskKey,
      title: candidate.title,
    };
    if (existing && existing.status !== TaskStatus.VERIFIED)
      update.push(action);
    else if (existing || exactTitle) duplicates.push(action);
    else create.push(action);
  }

  const hashPayload = {
    actorUserId,
    bundle,
    plan: { create, duplicates, errors, update },
    root: root ? { id: root.id, title: root.title } : null,
    version: "private-task-bundle.v1",
  };
  const reviewHash = await sha256CanonicalJson(hashPayload);
  return {
    create,
    duplicates,
    errors,
    normalizedBundle: bundle,
    reviewHash,
    root: root ? { id: root.id, title: root.title } : null,
    update,
  };
}

function taskExecutionMode(candidate: PrivateTaskCandidate) {
  const agent = candidate.eligibleExecutorTypes.includes("AGENT");
  const human = candidate.eligibleExecutorTypes.includes("HUMAN");
  if (agent && human) return TaskExecutionMode.HUMAN_OR_AGENT;
  return agent ? TaskExecutionMode.AGENT_ONLY : TaskExecutionMode.HUMAN_ONLY;
}

function taskContext(
  candidate: PrivateTaskCandidate,
  bundle: PrivateTaskBundle,
  owner: { organizationId: string | null; userId: string | null },
) {
  return {
    acceptanceCriteria: candidate.acceptanceCriteria,
    expectedDeliverable: candidate.expectedDeliverable,
    executor_type:
      candidate.eligibleExecutorTypes.length === 1 &&
      candidate.eligibleExecutorTypes[0] === "AGENT"
        ? "AI Agent"
        : "Self",
    privateWorkV1: {
      eligibleExecutorTypes: candidate.eligibleExecutorTypes,
      estimatedCostUsd: candidate.estimatedCostUsd,
      estimatedDurationSeconds: candidate.estimatedDurationSeconds,
      expectedValueUsd: candidate.expectedValueUsd,
      groundedByAnchors: candidate.groundedByAnchors,
      objectiveServed: candidate.objectiveServed,
      owner,
      privacyClassification: candidate.privacyClassification,
      projectOrWorkflow: candidate.projectOrWorkflow,
      requiredObligation: candidate.requiredObligation,
      safetyGuardrail: candidate.safetyGuardrail,
      sourceChannel: bundle.source.channel,
      sourceSelectionHash: bundle.source.selectionHash,
      successProbability: candidate.successProbability,
    },
  } satisfies Prisma.InputJsonObject;
}

async function attachImpactEstimate(
  tx: Prisma.TransactionClient,
  taskId: string,
  candidate: PrivateTaskCandidate,
  actorUserId: string,
) {
  const secondsPerHour = 3_600;
  await createDirectTaskImpactInTransaction(
    {
      assumptions: [
        "Reviewed private import estimate",
        ...(!candidate.requiredObligation && !candidate.safetyGuardrail
          ? []
          : ["Required obligation or safety guardrail"]),
      ],
      calculationVersion: "private-task-bundle.v1",
      counterfactualKey: "task-not-completed",
      estimateNotes: "User-reviewed conversation-to-work import",
      frame: {
        estimatedCashCostUsdBase: candidate.estimatedCostUsd.base,
        estimatedCashCostUsdHigh: candidate.estimatedCostUsd.high,
        estimatedCashCostUsdLow: candidate.estimatedCostUsd.low,
        estimatedEffortHoursBase:
          candidate.estimatedDurationSeconds.base / secondsPerHour,
        estimatedEffortHoursHigh:
          candidate.estimatedDurationSeconds.high / secondsPerHour,
        estimatedEffortHoursLow:
          candidate.estimatedDurationSeconds.low / secondsPerHour,
        expectedEconomicValueUsdBase: candidate.expectedValueUsd.base,
        expectedEconomicValueUsdHigh: candidate.expectedValueUsd.high,
        expectedEconomicValueUsdLow: candidate.expectedValueUsd.low,
        successProbabilityBase: candidate.successProbability.base,
        successProbabilityHigh: candidate.successProbability.high,
        successProbabilityLow: candidate.successProbability.low,
      },
      frameKey: TaskImpactFrameKey.FIVE_YEAR,
      methodologyKey: "reviewed-private-import",
      taskId,
    },
    { isAdmin: false, userId: actorUserId },
    { publish: false },
    tx,
  );
}

export async function applyPrivateTaskBundle(
  rawInput: unknown,
  reviewHash: string,
  actorUserId: string,
) {
  const review = await reviewPrivateTaskBundle(rawInput, actorUserId);
  if (!review.reviewHash || review.reviewHash !== reviewHash) {
    throw new Error(
      "Private task bundle changed after review; review it again",
    );
  }
  if (!review.normalizedBundle || !review.root || review.errors.length > 0) {
    throw new Error("Private task bundle contains review errors");
  }

  const bundle = review.normalizedBundle;
  const result = await prisma.$transaction(
    async (tx) => {
      const root = await tx.task.findFirst({
        where: {
          deletedAt: null,
          id: bundle.rootTaskId,
          isPublic: false,
          OR: [
            { createdByUserId: actorUserId },
            {
              ownerOrganization: {
                members: {
                  some: {
                    role: {
                      in: [
                        OrganizationMemberRole.OWNER,
                        OrganizationMemberRole.ADMIN,
                        OrganizationMemberRole.MEMBER,
                      ],
                    },
                    userId: actorUserId,
                  },
                },
              },
            },
          ],
        },
        select: {
          assigneePersonId: true,
          createdByUserId: true,
          id: true,
          ownerOrganizationId: true,
        },
      });
      if (!root) throw new Error("Private root task not found");
      const owner = {
        organizationId: root.ownerOrganizationId,
        userId: root.ownerOrganizationId ? null : actorUserId,
      };
      const ownerScope = root.ownerOrganizationId
        ? `organization:${root.ownerOrganizationId}`
        : `user:${actorUserId}`;
      const sourceScopeHash = await sha256CanonicalJson({
        ownerScope,
        selectionId: bundle.source.selectionId,
      });
      const sourceKey = `private-selection:${sourceScopeHash}:${bundle.source.selectionHash}`;
      const sourceArtifact = await tx.sourceArtifact.upsert({
        where: { sourceKey },
        create: {
          artifactType: SourceArtifactType.EXTERNAL_SOURCE,
          contentHash: bundle.source.selectionHash,
          externalKey: bundle.source.selectionId,
          isPublic: false,
          ownerOrganizationId: root.ownerOrganizationId,
          ownerUserId: root.ownerOrganizationId ? null : actorUserId,
          payloadJson: {
            approvedExcerpts: bundle.source.approvedExcerpts.map((item) => ({
              anchor: item.anchor,
              excerpt: item.excerpt,
              timestamp: item.timestamp ?? null,
            })),
            capturedAt: bundle.source.capturedAt ?? null,
            channel: bundle.source.channel,
            messageAnchors: bundle.source.messageAnchors,
            participantAliases: bundle.source.participantAliases,
            userSelected: true,
          },
          sourceKey,
          sourceRef: bundle.source.selectionId,
          sourceSystem: SourceSystem.EXTERNAL,
          sourceUrl: bundle.source.sourceUrl ?? null,
          title: bundle.source.title,
        },
        update: { deletedAt: null },
      });

      const created: ReviewAction[] = [];
      const updated: ReviewAction[] = [];
      const linked: ReviewAction[] = [];
      const taskIdByRef = new Map<string, string>();
      const createRefs = new Set(
        review.create.map((item) => item.candidateRef),
      );
      const updateByRef = new Map(
        review.update.map((item) => [item.candidateRef, item]),
      );
      const duplicateByRef = new Map(
        review.duplicates.map((item) => [item.candidateRef, item]),
      );

      for (const candidate of bundle.candidates) {
        const taskKey = importedTaskKey(
          actorUserId,
          bundle.source.selectionId,
          candidate.ref,
        );
        const data = {
          assigneePersonId: root.assigneePersonId,
          category: candidate.category,
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          contextJson: taskContext(candidate, bundle, owner),
          description: candidate.clarificationNeeded
            ? `${candidate.description}\n\nClarification needed: ${candidate.clarificationNeeded}`
            : candidate.description,
          dueAt: candidate.dueAt ? new Date(candidate.dueAt) : null,
          estimatedEffortHours: candidate.estimatedDurationSeconds.base / 3_600,
          executionMode: taskExecutionMode(candidate),
          impactStatement: candidate.objectiveServed,
          isPublic: false,
          ownerOrganizationId: root.ownerOrganizationId,
          parentTaskId: root.id,
          status: TaskStatus.ACTIVE,
          taskKey,
          title: candidate.clarificationNeeded
            ? `Clarify: ${candidate.title}`
            : candidate.title,
        };

        let taskId: string;
        if (createRefs.has(candidate.ref)) {
          const task = await tx.task.create({
            data: { ...data, createdByUserId: actorUserId },
            select: { id: true },
          });
          taskId = task.id;
          created.push({
            candidateRef: candidate.ref,
            taskId,
            taskKey,
            title: data.title,
          });
          await attachImpactEstimate(tx, taskId, candidate, actorUserId);
        } else if (updateByRef.has(candidate.ref)) {
          const taskIdToUpdate = updateByRef.get(candidate.ref)?.taskId;
          if (!taskIdToUpdate)
            throw new Error("Reviewed update lost its task ID");
          const task = await tx.task.update({
            where: { id: taskIdToUpdate },
            data,
            select: { id: true },
          });
          taskId = task.id;
          updated.push({
            candidateRef: candidate.ref,
            taskId,
            taskKey,
            title: data.title,
          });
          await attachImpactEstimate(tx, taskId, candidate, actorUserId);
        } else {
          const duplicate = duplicateByRef.get(candidate.ref);
          if (!duplicate?.taskId) {
            throw new Error("Reviewed duplicate lost its task ID");
          }
          taskId = duplicate.taskId;
          linked.push({ ...duplicate, taskId });
        }
        taskIdByRef.set(candidate.ref, taskId);
        await tx.taskSourceArtifact.updateMany({
          where: { deletedAt: null, taskId },
          data: { isPrimary: false },
        });
        await tx.taskSourceArtifact.upsert({
          where: {
            taskId_sourceArtifactId: {
              sourceArtifactId: sourceArtifact.id,
              taskId,
            },
          },
          create: {
            isPrimary: true,
            sourceArtifactId: sourceArtifact.id,
            taskId,
          },
          update: { deletedAt: null },
        });
      }

      for (const candidate of bundle.candidates) {
        const taskId = taskIdByRef.get(candidate.ref);
        if (!taskId) continue;
        const parentTaskId = candidate.parentRef
          ? (taskIdByRef.get(candidate.parentRef) ?? candidate.parentRef)
          : root.id;
        if (!duplicateByRef.has(candidate.ref)) {
          await tx.task.update({
            where: { id: taskId },
            data: { parentTaskId },
          });
        }
        for (const dependencyRef of candidate.dependencyRefs) {
          const blockerTaskId = taskIdByRef.get(dependencyRef) ?? dependencyRef;
          await tx.taskEdge.upsert({
            where: {
              fromTaskId_toTaskId_edgeType: {
                edgeType: TaskEdgeType.BLOCKS,
                fromTaskId: blockerTaskId,
                toTaskId: taskId,
              },
            },
            create: {
              edgeType: TaskEdgeType.BLOCKS,
              fromTaskId: blockerTaskId,
              toTaskId: taskId,
            },
            update: { deletedAt: null },
          });
        }
      }

      return {
        created,
        linked,
        sourceArtifactId: sourceArtifact.id,
        updated,
      };
    },
    { maxWait: 10_000, timeout: 120_000 },
  );

  return { ...result, reviewHash };
}
