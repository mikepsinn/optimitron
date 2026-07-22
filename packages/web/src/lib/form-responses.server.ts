import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDeadlinePolicy,
  TaskExecutionMode,
  TaskStatus,
  TaskVerificationResult,
  type Prisma,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { createDocument, toDocumentDto } from "@/lib/documents.server";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { getSourceArtifactVisibilityWhere } from "@/lib/source-artifact-visibility.server";
import { proposeExternalAction } from "@/lib/tasks/external-action.server";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  type TaskAccessAction,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import {
  readTaskContext,
  type TaskContextFormResponseSet,
  type TaskContextReviewedAnswer,
} from "@/lib/tasks/task-context";

const MAX_QUESTIONS = 200;
const MAX_ANSWER_CANDIDATES = 500;
const PLACEHOLDER_PATTERN =
  /(?:\b(?:TODO|TBD|VERIFY|FILL(?:\s+ME)?|FIXME)\b|\?\?\?|\[(?:insert|replace|your|organization)[^\]]*\]|\{\{[^}]+\}\})/i;

const SubjectSchema = z
  .object({
    organizationId: z.string().trim().min(1).optional(),
    personId: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine(
    (subject) =>
      Number(Boolean(subject.organizationId)) +
        Number(Boolean(subject.personId)) ===
      1,
    "subject requires exactly one of organizationId or personId",
  );

const QuestionSchema = z
  .object({
    answerRevisionId: z.string().trim().min(1).optional(),
    contextTags: z.array(z.string().trim().min(1)).max(30).default([]),
    fieldKey: z.string().trim().min(1).max(200),
    knowledgeKey: z.string().trim().min(1).max(200).optional(),
    prompt: z.string().trim().min(1).max(20_000),
    proposedAnswer: z.string().trim().min(1).max(500_000).optional(),
    sensitivity: z
      .enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"])
      .default("INTERNAL"),
    sourceArtifactIds: z.array(z.string().trim().min(1)).max(100).default([]),
    validUntil: z.string().datetime().nullable().default(null),
  })
  .strict();

export const FindReviewedAnswersSchema = z
  .object({
    asOf: z.string().datetime().optional(),
    contextTags: z.array(z.string().trim().min(1)).max(30).default([]),
    knowledgeKey: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(100).default(10),
    question: z.string().trim().min(1).max(20_000),
    subject: SubjectSchema,
  })
  .strict();

export const PrepareFormResponsesSchema = z
  .object({
    formTaskId: z.string().trim().min(1),
    idempotencyKey: z.string().trim().min(8).max(500),
    questions: z.array(QuestionSchema).min(1).max(MAX_QUESTIONS),
    subject: SubjectSchema,
  })
  .strict();

export const ProposeFormSubmissionSchema = z
  .object({
    responses: z
      .array(
        z
          .object({
            answerRevisionId: z.string().trim().min(1),
            fieldKey: z.string().trim().min(1).max(200),
            prompt: z.string().trim().min(1).max(20_000),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_QUESTIONS),
    destination: z.string().trim().min(1).max(2_000),
    expiresAt: z.string().datetime().optional(),
    formTaskId: z.string().trim().min(1),
    idempotencyKey: z.string().trim().min(8).max(500),
    taskExecutionAttemptId: z.string().trim().min(1),
  })
  .strict();

type Subject = z.infer<typeof SubjectSchema>;
type FormResponseOptions = {
  clientAccessBoundary?: TaskClientAccessBoundary;
};

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeTokens(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token.length >= 3),
  );
}

function normalizeIdentity(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function overlapScore(left: string, right: string): number {
  const leftTokens = normalizeTokens(left);
  const rightTokens = normalizeTokens(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) shared += 1;
  }
  return shared / new Set([...leftTokens, ...rightTokens]).size;
}

function answerMatchesQuestion(
  answer: Awaited<ReturnType<typeof listApprovedAnswers>>[number],
  question: z.infer<typeof QuestionSchema>,
): boolean {
  const identityMatches = question.knowledgeKey
    ? answer.reviewedAnswer.knowledgeKey !== null &&
      normalizeIdentity(answer.reviewedAnswer.knowledgeKey) ===
        normalizeIdentity(question.knowledgeKey)
    : normalizeIdentity(answer.reviewedAnswer.canonicalQuestion) ===
      normalizeIdentity(question.prompt);
  return (
    identityMatches &&
    question.contextTags.every((requestedTag) =>
      answer.reviewedAnswer.contextTags.some(
        (answerTag) =>
          normalizeIdentity(answerTag) === normalizeIdentity(requestedTag),
      ),
    )
  );
}

function sameSubject(
  left: TaskContextReviewedAnswer["subject"],
  right: Subject,
): boolean {
  return (
    (left.organizationId ?? null) === (right.organizationId ?? null) &&
    (left.personId ?? null) === (right.personId ?? null)
  );
}

async function loadActor(actorUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
  if (!actor?.personId) throw new Error("Form task not found");
  return { personId: actor.personId };
}

function assertSubjectClientBoundary(
  subject: Subject,
  boundary?: TaskClientAccessBoundary,
) {
  if (!boundary) return;
  if (subject.personId && !boundary.allowPersonalPrivate) {
    throw new Error("Form task not found");
  }
  if (
    subject.organizationId &&
    boundary.organizationIds !== null &&
    !boundary.organizationIds.includes(subject.organizationId)
  ) {
    throw new Error("Form task not found");
  }
}

async function assertSubjectAccess(
  subject: Subject,
  actorUserId: string,
  options?: FormResponseOptions,
) {
  assertSubjectClientBoundary(subject, options?.clientAccessBoundary);
  const actor = await loadActor(actorUserId);
  if (subject.personId && subject.personId !== actor.personId) {
    throw new Error("Form task not found");
  }
  if (
    subject.organizationId &&
    !(await canManageOrganization(actorUserId, subject.organizationId))
  ) {
    throw new Error("Form task not found");
  }
  return actor;
}

async function loadFormTask(input: {
  action: TaskAccessAction;
  actorUserId: string;
  formTaskId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  subject?: Subject;
}) {
  const actor = await loadActor(input.actorUserId);
  const task = await prisma.task.findFirst({
    where: {
      AND: [
        getTaskAccessWhere({
          action: input.action,
          personId: actor.personId,
          userId: input.actorUserId,
        }),
        ...(input.clientAccessBoundary
          ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
          : []),
      ],
      deletedAt: null,
      id: input.formTaskId,
    },
    select: {
      contextJson: true,
      deadlinePolicy: true,
      dueAt: true,
      id: true,
      ownerOrganizationId: true,
      title: true,
    },
  });
  if (!task) throw new Error("Form task not found");
  if (
    input.subject &&
    (task.ownerOrganizationId ?? null) !==
      (input.subject.organizationId ?? null)
  ) {
    throw new Error("Form task does not belong to the supplied subject");
  }
  return { actor, task };
}

const approvedAnswerAttemptSelect = {
  completedAt: true,
  artifacts: {
    where: { deletedAt: null, documentRevisionId: { not: null } },
    orderBy: { createdAt: "desc" as const },
    select: {
      contentHash: true,
      documentRevision: {
        select: {
          body: true,
          contentHash: true,
          createdAt: true,
          documentId: true,
          id: true,
          title: true,
          version: true,
        },
      },
      id: true,
    },
  },
  id: true,
  verifications: {
    where: { deletedAt: null, result: TaskVerificationResult.ACCEPTED },
    orderBy: { completedAt: "desc" as const },
    select: { completedAt: true, id: true, reviewerUserId: true },
    take: 1,
  },
} satisfies Prisma.TaskExecutionAttemptSelect;

async function listApprovedAnswers(input: {
  actorUserId: string;
  asOf: Date;
  clientAccessBoundary?: TaskClientAccessBoundary;
  subject: Subject;
}) {
  const actor = await assertSubjectAccess(input.subject, input.actorUserId, {
    clientAccessBoundary: input.clientAccessBoundary,
  });
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: TaskStatus.VERIFIED,
      AND: [
        getTaskAccessWhere({
          action: "READ",
          personId: actor.personId,
          userId: input.actorUserId,
        }),
        ...(input.clientAccessBoundary
          ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
          : []),
        {
          contextJson: {
            path: [
              "reviewedAnswer",
              "subject",
              input.subject.organizationId ? "organizationId" : "personId",
            ],
            equals:
              input.subject.organizationId ?? input.subject.personId ?? "",
          },
        },
        {
          contextJson: {
            path: ["reviewedAnswer", "type"],
            equals: "REVIEWED_ANSWER",
          },
        },
      ],
    },
    orderBy: [{ verifiedAt: "desc" }, { id: "asc" }],
    select: {
      contextJson: true,
      executionAttempts: {
        where: {
          deletedAt: null,
          verifications: {
            some: {
              deletedAt: null,
              result: TaskVerificationResult.ACCEPTED,
            },
          },
        },
        orderBy: [{ completedAt: "desc" }, { id: "asc" }],
        select: approvedAnswerAttemptSelect,
      },
      id: true,
      title: true,
      verifiedAt: true,
    },
    take: MAX_ANSWER_CANDIDATES,
  });

  return tasks.flatMap((task) => {
    const reviewedAnswer = readTaskContext(task.contextJson).reviewedAnswer;
    if (
      !reviewedAnswer ||
      !sameSubject(reviewedAnswer.subject, input.subject)
    ) {
      return [];
    }
    if (
      reviewedAnswer.validUntil &&
      new Date(reviewedAnswer.validUntil) < input.asOf
    ) {
      return [];
    }
    const attempt = task.executionAttempts.find(
      (candidate) => candidate.verifications.length > 0,
    );
    const artifact =
      attempt?.artifacts.length === 1 ? attempt.artifacts[0] : null;
    if (!attempt || !artifact?.documentRevision) return [];
    return [
      {
        answer: artifact.documentRevision.body,
        answerDocumentId: artifact.documentRevision.documentId,
        answerRevisionId: artifact.documentRevision.id,
        answerVersion: artifact.documentRevision.version,
        reviewedAnswer,
        approvedAt:
          attempt.verifications[0]?.completedAt?.toISOString() ??
          task.verifiedAt?.toISOString() ??
          null,
        approvalId: attempt.verifications[0]?.id ?? null,
        contentHash:
          artifact.documentRevision.contentHash ?? artifact.contentHash,
        reviewTaskId: task.id,
        title: task.title,
      },
    ];
  });
}

export async function findReviewedAnswers(
  rawInput: unknown,
  actorUserId: string,
  options?: FormResponseOptions,
) {
  const input = FindReviewedAnswersSchema.parse(rawInput);
  const asOf = input.asOf ? new Date(input.asOf) : new Date();
  const answers = await listApprovedAnswers({
    actorUserId,
    asOf,
    clientAccessBoundary: options?.clientAccessBoundary,
    subject: input.subject,
  });
  const requestedTags = new Set(
    input.contextTags.map((tag) => tag.toLowerCase()),
  );
  return {
    answers: answers
      .map((answer) => {
        const matchingContextTags = answer.reviewedAnswer.contextTags.filter(
          (tag) => requestedTags.has(tag.toLowerCase()),
        );
        const knowledgeKeyMatches =
          Boolean(input.knowledgeKey) &&
          Boolean(answer.reviewedAnswer.knowledgeKey) &&
          normalizeIdentity(input.knowledgeKey ?? "") ===
            normalizeIdentity(answer.reviewedAnswer.knowledgeKey ?? "");
        return {
          ...answer,
          knowledgeKeyMatches,
          matchingContextTags,
          score:
            (knowledgeKeyMatches ? 2 : 0) +
            overlapScore(
              input.question,
              answer.reviewedAnswer.canonicalQuestion,
            ) +
            matchingContextTags.length * 0.1,
        };
      })
      .filter((answer) => answer.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          (right.approvedAt ?? "").localeCompare(left.approvedAt ?? "") ||
          left.answerRevisionId.localeCompare(right.answerRevisionId),
      )
      .slice(0, input.limit),
    asOf: asOf.toISOString(),
    automaticReuseRequiresStableKnowledgeKeyOrExactPrompt: true,
  };
}

async function approvedAnswerByRevision(input: {
  actorUserId: string;
  answerRevisionId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  subject: Subject;
}) {
  const answers = await listApprovedAnswers({
    actorUserId: input.actorUserId,
    asOf: new Date(),
    clientAccessBoundary: input.clientAccessBoundary,
    subject: input.subject,
  });
  return (
    answers.find(
      (answer) => answer.answerRevisionId === input.answerRevisionId,
    ) ?? null
  );
}

function asJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function saveFormResponseSet(input: {
  actorPersonId: string;
  actorUserId: string;
  formHash: string;
  formTaskId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  items: Array<{
    contextTags: string[];
    fieldKey: string;
    knowledgeKey: string | null;
    prompt: string;
  }>;
  resolvedAnswers?: Map<string, string>;
  subject: Subject;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Task" WHERE "id" = ${input.formTaskId} FOR UPDATE
    `;
    const task = await tx.task.findFirst({
      where: {
        AND: [
          getTaskAccessWhere({
            action: "MANAGE",
            personId: input.actorPersonId,
            userId: input.actorUserId,
          }),
          ...(input.clientAccessBoundary
            ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
            : []),
        ],
        deletedAt: null,
        id: input.formTaskId,
      },
      select: { contextJson: true, id: true, ownerOrganizationId: true },
    });
    if (
      !task ||
      (task.ownerOrganizationId ?? null) !==
        (input.subject.organizationId ?? null)
    ) {
      throw new Error("Form task not found");
    }

    const existing = readTaskContext(task.contextJson).formResponseSet;
    if (
      existing &&
      (existing.formHash !== input.formHash ||
        !sameSubject(existing.subject, input.subject))
    ) {
      throw new Error(
        "Form fields changed after preparation; create a new form task",
      );
    }
    const existingAnswers = new Map(
      existing?.items.flatMap((item) =>
        item.answerRevisionId
          ? [[item.fieldKey, item.answerRevisionId] as const]
          : [],
      ) ?? [],
    );
    const responseSet: TaskContextFormResponseSet = {
      formHash: input.formHash,
      items: input.items.map((item) => ({
        ...item,
        answerRevisionId:
          input.resolvedAnswers?.get(item.fieldKey) ??
          existingAnswers.get(item.fieldKey) ??
          null,
      })),
      subject: input.subject,
    };
    await tx.task.update({
      where: { id: task.id },
      data: {
        contextJson: jsonValue({
          ...asJsonObject(task.contextJson),
          formResponseSet: responseSet,
        }),
      },
    });
    return responseSet;
  });
}

export async function prepareFormResponses(
  rawInput: unknown,
  actorUserId: string,
  options?: FormResponseOptions,
) {
  const input = PrepareFormResponsesSchema.parse(rawInput);
  const uniqueKeys = new Set(
    input.questions.map((question) => question.fieldKey),
  );
  if (uniqueKeys.size !== input.questions.length) {
    throw new Error("Form field keys must be unique");
  }
  for (const question of input.questions) {
    if (
      question.proposedAnswer &&
      PLACEHOLDER_PATTERN.test(question.proposedAnswer)
    ) {
      throw new Error(
        `Proposed answer for ${question.fieldKey} contains unresolved placeholder text`,
      );
    }
  }
  await assertSubjectAccess(input.subject, actorUserId, options);
  const sourceArtifactIds = [
    ...new Set(
      input.questions.flatMap((question) => question.sourceArtifactIds),
    ),
  ];
  if (sourceArtifactIds.length > 0) {
    const visibleSourceCount = await prisma.sourceArtifact.count({
      where: {
        deletedAt: null,
        id: { in: sourceArtifactIds },
        ...getSourceArtifactVisibilityWhere(
          actorUserId,
          options?.clientAccessBoundary,
        ),
      },
    });
    if (visibleSourceCount !== sourceArtifactIds.length) {
      throw new Error("Source artifact not found");
    }
  }
  const { actor, task: formTask } = await loadFormTask({
    action: "MANAGE",
    actorUserId,
    formTaskId: input.formTaskId,
    clientAccessBoundary: options?.clientAccessBoundary,
    subject: input.subject,
  });
  const preparedItems = input.questions.map((question) => ({
    contextTags: question.contextTags,
    fieldKey: question.fieldKey,
    knowledgeKey: question.knowledgeKey ?? null,
    prompt: question.prompt,
  }));
  const formHash = await sha256CanonicalJson({
    items: preparedItems,
    subject: input.subject,
  });
  await saveFormResponseSet({
    actorPersonId: actor.personId,
    actorUserId,
    clientAccessBoundary: options?.clientAccessBoundary,
    formHash,
    formTaskId: formTask.id,
    items: preparedItems,
    subject: input.subject,
  });
  const existingAnswers = await listApprovedAnswers({
    actorUserId,
    asOf: new Date(),
    clientAccessBoundary: options?.clientAccessBoundary,
    subject: input.subject,
  });

  const resolved = [];
  const unresolved = [];
  for (const question of input.questions) {
    const matchingAnswers = existingAnswers.filter((answer) =>
      answerMatchesQuestion(answer, question),
    );
    const automaticCandidates = matchingAnswers.filter(
      (answer) =>
        !["CONFIDENTIAL", "RESTRICTED"].includes(
          answer.reviewedAnswer.sensitivity,
        ),
    );
    const approvedAnswer = question.answerRevisionId
      ? (matchingAnswers.find(
          (answer) => answer.answerRevisionId === question.answerRevisionId,
        ) ?? null)
      : automaticCandidates.length === 1
        ? automaticCandidates[0]!
        : null;
    if (approvedAnswer) {
      resolved.push({
        answerRevisionId: approvedAnswer.answerRevisionId,
        fieldKey: question.fieldKey,
        reviewTaskId: approvedAnswer.reviewTaskId,
      });
      continue;
    }

    const questionHash = await sha256CanonicalJson({
      fieldKey: question.fieldKey,
      formTaskId: input.formTaskId,
      subject: input.subject,
    });
    const taskKey = `reviewed-answer:${questionHash}`;
    const context: TaskContextReviewedAnswer = {
      canonicalQuestion: question.prompt,
      contextTags: question.contextTags,
      knowledgeKey: question.knowledgeKey ?? null,
      originTaskId: input.formTaskId,
      sensitivity: question.sensitivity,
      sourceArtifactIds: question.sourceArtifactIds,
      subject: input.subject,
      type: "REVIEWED_ANSWER",
      validUntil: question.validUntil,
    };
    const questionTask = await prisma.task.upsert({
      where: { taskKey },
      create: {
        assigneePersonId: actor.personId,
        category: TaskCategory.COMMUNICATION,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        contextJson: jsonValue({
          acceptanceCriteria: [
            "The answer is factually accurate and appropriate for reuse in this context.",
            "An immutable answer document revision is attached and accepted by a human reviewer.",
          ],
          reviewedAnswer: context,
          expectedDeliverable: "An approved reusable answer revision",
        }),
        createdByUserId: actorUserId,
        deadlinePolicy:
          formTask.deadlinePolicy === TaskDeadlinePolicy.NONE
            ? TaskDeadlinePolicy.SOFT
            : formTask.deadlinePolicy,
        description: [
          question.prompt,
          "",
          "Review the proposed answer and correct any unsupported, stale, private, or awkward claims. Accept only the exact document revision that should be reused.",
        ].join("\n"),
        dueAt: formTask.dueAt,
        estimatedEffortHours: 0.05,
        executionMode: TaskExecutionMode.HUMAN_OR_AGENT,
        isPublic: false,
        ownerOrganizationId: input.subject.organizationId ?? null,
        parentTaskId: input.formTaskId,
        status: TaskStatus.ACTIVE,
        taskKey,
        title: `Verify answer: ${question.prompt.slice(0, 140)}`,
      },
      update: {},
      select: {
        contextJson: true,
        id: true,
        status: true,
        taskKey: true,
        title: true,
      },
    });
    const storedAnswer = readTaskContext(
      questionTask.contextJson,
    ).reviewedAnswer;
    if (
      !storedAnswer ||
      JSON.stringify(storedAnswer) !== JSON.stringify(context)
    ) {
      throw new Error(
        `Form field ${question.fieldKey} conflicts with an existing reviewed-answer task`,
      );
    }
    for (const [
      index,
      sourceArtifactId,
    ] of question.sourceArtifactIds.entries()) {
      await prisma.taskSourceArtifact.upsert({
        where: {
          taskId_sourceArtifactId: {
            sourceArtifactId,
            taskId: questionTask.id,
          },
        },
        create: {
          isPrimary: index === 0,
          sourceArtifactId,
          taskId: questionTask.id,
        },
        update: { deletedAt: null, isPrimary: index === 0 },
      });
    }

    let draftDocument = null;
    if (question.proposedAnswer) {
      const document = await createDocument({
        body: question.proposedAnswer,
        createdByUserId: actorUserId,
        idempotencyKey: `${input.idempotencyKey}:answer:${question.fieldKey}`,
        organizationId: input.subject.organizationId ?? null,
        sourceArtifactId: question.sourceArtifactIds[0] ?? null,
        taskId: questionTask.id,
        title: question.prompt,
        visibility: null,
      });
      draftDocument = toDocumentDto(document);
    }
    unresolved.push({
      draftDocument,
      fieldKey: question.fieldKey,
      reason: question.answerRevisionId
        ? "The supplied answer revision is not an approved answer for this question and subject."
        : automaticCandidates.length > 1
          ? "Multiple approved answers match this field; choose the exact revision to use."
          : "No approved answer revision was supplied.",
      task: {
        id: questionTask.id,
        status: questionTask.status,
        taskKey: questionTask.taskKey,
        title: questionTask.title,
      },
    });
  }

  await saveFormResponseSet({
    actorPersonId: actor.personId,
    actorUserId,
    clientAccessBoundary: options?.clientAccessBoundary,
    formHash,
    formTaskId: formTask.id,
    items: preparedItems,
    resolvedAnswers: new Map(
      resolved.map((answer) => [answer.fieldKey, answer.answerRevisionId]),
    ),
    subject: input.subject,
  });

  return {
    formTaskId: formTask.id,
    readyForSubmission: unresolved.length === 0,
    resolved,
    unresolved,
  };
}

export async function proposeFormSubmission(
  rawInput: unknown,
  actorUserId: string,
  options?: FormResponseOptions,
) {
  const input = ProposeFormSubmissionSchema.parse(rawInput);
  const uniqueKeys = new Set(
    input.responses.map((response) => response.fieldKey),
  );
  if (uniqueKeys.size !== input.responses.length) {
    throw new Error("Form field keys must be unique");
  }
  const { task } = await loadFormTask({
    action: "EXECUTE",
    actorUserId,
    formTaskId: input.formTaskId,
    clientAccessBoundary: options?.clientAccessBoundary,
  });
  const activeQuestionCount = await prisma.task.count({
    where: {
      deletedAt: null,
      parentTaskId: input.formTaskId,
      status: { in: [TaskStatus.ACTIVE, TaskStatus.DRAFT] },
      contextJson: {
        path: ["reviewedAnswer", "type"],
        equals: "REVIEWED_ANSWER",
      },
    },
  });
  if (activeQuestionCount > 0) {
    throw new Error(
      `Form has ${activeQuestionCount} unresolved answer verification task(s)`,
    );
  }

  const subject: Subject = task.ownerOrganizationId
    ? { organizationId: task.ownerOrganizationId }
    : { personId: (await loadActor(actorUserId)).personId };
  const responseSet = readTaskContext(task.contextJson).formResponseSet;
  if (!responseSet || !sameSubject(responseSet.subject, subject)) {
    throw new Error("Form responses must be prepared before submission");
  }
  if (input.responses.length !== responseSet.items.length) {
    throw new Error("Form submission does not include every prepared field");
  }
  const approvedAnswers = [];
  for (const preparedItem of responseSet.items) {
    const response = input.responses.find(
      (candidate) => candidate.fieldKey === preparedItem.fieldKey,
    );
    if (
      !response ||
      response.prompt !== preparedItem.prompt ||
      !preparedItem.answerRevisionId ||
      response.answerRevisionId !== preparedItem.answerRevisionId
    ) {
      throw new Error(
        `Response ${preparedItem.fieldKey} does not match the prepared form`,
      );
    }
    const approved = await approvedAnswerByRevision({
      actorUserId,
      answerRevisionId: response.answerRevisionId,
      clientAccessBoundary: options?.clientAccessBoundary,
      subject,
    });
    if (!approved) {
      throw new Error(
        `Response ${response.fieldKey} is not an approved reusable answer`,
      );
    }
    if (PLACEHOLDER_PATTERN.test(approved.answer)) {
      throw new Error(
        `Response ${response.fieldKey} contains unresolved placeholder text`,
      );
    }
    approvedAnswers.push({
      answer: approved.answer,
      answerContentHash: approved.contentHash,
      answerRevisionId: approved.answerRevisionId,
      approvalId: approved.approvalId,
      approvedAt: approved.approvedAt,
      reviewTaskId: approved.reviewTaskId,
      fieldKey: response.fieldKey,
      knowledgeKey: preparedItem.knowledgeKey,
      prompt: response.prompt,
    });
  }

  const payload = {
    formHash: responseSet.formHash,
    formTaskId: input.formTaskId,
    responses: approvedAnswers,
    schemaVersion: "form-submission.v1",
  };
  const request = await proposeExternalAction(
    {
      destination: input.destination,
      expiresAt: input.expiresAt,
      idempotencyKey: input.idempotencyKey,
      operation: "SUBMIT_FORM",
      payload,
      taskExecutionAttemptId: input.taskExecutionAttemptId,
      taskId: input.formTaskId,
    },
    actorUserId,
    { clientAccessBoundary: options?.clientAccessBoundary },
  );
  return {
    approvalRequired: true,
    formTaskId: input.formTaskId,
    externalActionRequest: request,
    payload,
  };
}
