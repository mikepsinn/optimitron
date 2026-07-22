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
  type TaskContextApplicationKnowledge,
  type TaskContextApplicationPreparation,
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
    key: z.string().trim().min(1).max(200),
    prompt: z.string().trim().min(1).max(20_000),
    proposedAnswer: z.string().trim().min(1).max(500_000).optional(),
    sensitivity: z
      .enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"])
      .default("INTERNAL"),
    sourceArtifactIds: z.array(z.string().trim().min(1)).max(100).default([]),
    validUntil: z.string().datetime().nullable().default(null),
  })
  .strict();

export const FindReusableAnswersSchema = z
  .object({
    asOf: z.string().datetime().optional(),
    contextTags: z.array(z.string().trim().min(1)).max(30).default([]),
    limit: z.number().int().min(1).max(100).default(10),
    question: z.string().trim().min(1).max(20_000),
    subject: SubjectSchema,
  })
  .strict();

export const PrepareApplicationQuestionsSchema = z
  .object({
    applicationTaskId: z.string().trim().min(1),
    idempotencyKey: z.string().trim().min(8).max(500),
    questions: z.array(QuestionSchema).min(1).max(MAX_QUESTIONS),
    subject: SubjectSchema,
  })
  .strict();

export const ProposeApplicationSubmissionSchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            answerRevisionId: z.string().trim().min(1),
            key: z.string().trim().min(1).max(200),
            prompt: z.string().trim().min(1).max(20_000),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_QUESTIONS),
    applicationTaskId: z.string().trim().min(1),
    destination: z.string().trim().min(1).max(2_000),
    expiresAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(8).max(500),
  })
  .strict();

type Subject = z.infer<typeof SubjectSchema>;
type ApplicationKnowledgeOptions = {
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
  return (
    answer.applicationKnowledge.question.trim().toLocaleLowerCase() ===
      question.prompt.trim().toLocaleLowerCase() &&
    question.contextTags.every((requestedTag) =>
      answer.applicationKnowledge.contextTags.some(
        (answerTag) =>
          answerTag.toLocaleLowerCase() === requestedTag.toLocaleLowerCase(),
      ),
    )
  );
}

function sameSubject(
  left: TaskContextApplicationKnowledge["subject"],
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
  if (!actor?.personId) throw new Error("Application task not found");
  return { personId: actor.personId };
}

function assertSubjectClientBoundary(
  subject: Subject,
  boundary?: TaskClientAccessBoundary,
) {
  if (!boundary) return;
  if (subject.personId && !boundary.allowPersonalPrivate) {
    throw new Error("Application task not found");
  }
  if (
    subject.organizationId &&
    boundary.organizationIds !== null &&
    !boundary.organizationIds.includes(subject.organizationId)
  ) {
    throw new Error("Application task not found");
  }
}

async function assertSubjectAccess(
  subject: Subject,
  actorUserId: string,
  options?: ApplicationKnowledgeOptions,
) {
  assertSubjectClientBoundary(subject, options?.clientAccessBoundary);
  const actor = await loadActor(actorUserId);
  if (subject.personId && subject.personId !== actor.personId) {
    throw new Error("Application task not found");
  }
  if (
    subject.organizationId &&
    !(await canManageOrganization(actorUserId, subject.organizationId))
  ) {
    throw new Error("Application task not found");
  }
  return actor;
}

async function loadApplicationTask(input: {
  action: TaskAccessAction;
  actorUserId: string;
  applicationTaskId: string;
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
      id: input.applicationTaskId,
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
  if (!task) throw new Error("Application task not found");
  if (
    input.subject &&
    (task.ownerOrganizationId ?? null) !==
      (input.subject.organizationId ?? null)
  ) {
    throw new Error("Application task does not belong to the supplied subject");
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
      ],
      contextJson: {
        path: ["applicationKnowledge", "schemaVersion"],
        equals: 1,
      },
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
    const knowledge = readTaskContext(task.contextJson).applicationKnowledge;
    if (!knowledge || !sameSubject(knowledge.subject, input.subject)) return [];
    if (knowledge.validUntil && new Date(knowledge.validUntil) < input.asOf) {
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
        applicationKnowledge: knowledge,
        approvedAt:
          attempt.verifications[0]?.completedAt?.toISOString() ??
          task.verifiedAt?.toISOString() ??
          null,
        approvalId: attempt.verifications[0]?.id ?? null,
        contentHash:
          artifact.documentRevision.contentHash ?? artifact.contentHash,
        questionTaskId: task.id,
        title: task.title,
      },
    ];
  });
}

export async function findReusableAnswers(
  rawInput: unknown,
  actorUserId: string,
  options?: ApplicationKnowledgeOptions,
) {
  const input = FindReusableAnswersSchema.parse(rawInput);
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
        const matchingContextTags =
          answer.applicationKnowledge.contextTags.filter((tag) =>
            requestedTags.has(tag.toLowerCase()),
          );
        return {
          ...answer,
          matchingContextTags,
          score:
            overlapScore(input.question, answer.applicationKnowledge.question) +
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
    exactMatchRequiredForAutomaticReuse: true,
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

async function saveApplicationPreparation(input: {
  actorPersonId: string;
  actorUserId: string;
  applicationTaskId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  questionSetHash: string;
  questions: Array<{
    contextTags: string[];
    key: string;
    prompt: string;
  }>;
  resolvedAnswers?: Map<string, string>;
  subject: Subject;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Task" WHERE "id" = ${input.applicationTaskId} FOR UPDATE
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
        id: input.applicationTaskId,
      },
      select: { contextJson: true, id: true, ownerOrganizationId: true },
    });
    if (
      !task ||
      (task.ownerOrganizationId ?? null) !==
        (input.subject.organizationId ?? null)
    ) {
      throw new Error("Application task not found");
    }

    const existing = readTaskContext(task.contextJson).applicationPreparation;
    if (
      existing &&
      (existing.questionSetHash !== input.questionSetHash ||
        !sameSubject(existing.subject, input.subject))
    ) {
      throw new Error(
        "Application question set changed after preparation; create a new application task",
      );
    }
    const existingAnswers = new Map(
      existing?.questions.flatMap((question) =>
        question.answerRevisionId
          ? [[question.key, question.answerRevisionId] as const]
          : [],
      ) ?? [],
    );
    const preparation: TaskContextApplicationPreparation = {
      questionSetHash: input.questionSetHash,
      questions: input.questions.map((question) => ({
        ...question,
        answerRevisionId:
          input.resolvedAnswers?.get(question.key) ??
          existingAnswers.get(question.key) ??
          null,
      })),
      schemaVersion: 1,
      subject: input.subject,
    };
    await tx.task.update({
      where: { id: task.id },
      data: {
        contextJson: jsonValue({
          ...asJsonObject(task.contextJson),
          applicationPreparation: preparation,
        }),
      },
    });
    return preparation;
  });
}

export async function prepareApplicationQuestions(
  rawInput: unknown,
  actorUserId: string,
  options?: ApplicationKnowledgeOptions,
) {
  const input = PrepareApplicationQuestionsSchema.parse(rawInput);
  const uniqueKeys = new Set(input.questions.map((question) => question.key));
  if (uniqueKeys.size !== input.questions.length) {
    throw new Error("Application question keys must be unique");
  }
  for (const question of input.questions) {
    if (
      question.proposedAnswer &&
      PLACEHOLDER_PATTERN.test(question.proposedAnswer)
    ) {
      throw new Error(
        `Proposed answer for ${question.key} contains unresolved placeholder text`,
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
  const { actor, task: applicationTask } = await loadApplicationTask({
    action: "MANAGE",
    actorUserId,
    applicationTaskId: input.applicationTaskId,
    clientAccessBoundary: options?.clientAccessBoundary,
    subject: input.subject,
  });
  const preparedQuestions = input.questions.map((question) => ({
    contextTags: question.contextTags,
    key: question.key,
    prompt: question.prompt,
  }));
  const questionSetHash = await sha256CanonicalJson({
    questions: preparedQuestions,
    subject: input.subject,
  });
  await saveApplicationPreparation({
    actorPersonId: actor.personId,
    actorUserId,
    applicationTaskId: applicationTask.id,
    clientAccessBoundary: options?.clientAccessBoundary,
    questionSetHash,
    questions: preparedQuestions,
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
    const approvedAnswer = question.answerRevisionId
      ? (existingAnswers.find(
          (answer) =>
            answer.answerRevisionId === question.answerRevisionId &&
            answerMatchesQuestion(answer, question),
        ) ?? null)
      : (existingAnswers.find(
          (answer) =>
            answerMatchesQuestion(answer, question) &&
            !["CONFIDENTIAL", "RESTRICTED"].includes(
              answer.applicationKnowledge.sensitivity,
            ),
        ) ?? null);
    if (approvedAnswer) {
      resolved.push({
        answerRevisionId: approvedAnswer.answerRevisionId,
        key: question.key,
        questionTaskId: approvedAnswer.questionTaskId,
      });
      continue;
    }

    const questionHash = await sha256CanonicalJson({
      applicationTaskId: input.applicationTaskId,
      key: question.key,
      subject: input.subject,
    });
    const taskKey = `application-question:${questionHash}`;
    const context: TaskContextApplicationKnowledge = {
      applicationTaskId: input.applicationTaskId,
      contextTags: question.contextTags,
      question: question.prompt,
      questionKey: question.key,
      schemaVersion: 1,
      sensitivity: question.sensitivity,
      sourceArtifactIds: question.sourceArtifactIds,
      subject: input.subject,
      type: "REUSABLE_ANSWER",
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
          applicationKnowledge: context,
          expectedDeliverable: "An approved reusable answer revision",
        }),
        createdByUserId: actorUserId,
        deadlinePolicy:
          applicationTask.deadlinePolicy === TaskDeadlinePolicy.NONE
            ? TaskDeadlinePolicy.SOFT
            : applicationTask.deadlinePolicy,
        description: [
          question.prompt,
          "",
          "Review the proposed answer and correct any unsupported, stale, private, or awkward claims. Accept only the exact document revision that should be reused.",
        ].join("\n"),
        dueAt: applicationTask.dueAt,
        estimatedEffortHours: 0.05,
        executionMode: TaskExecutionMode.HUMAN_OR_AGENT,
        isPublic: false,
        ownerOrganizationId: input.subject.organizationId ?? null,
        parentTaskId: input.applicationTaskId,
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
    const storedKnowledge = readTaskContext(
      questionTask.contextJson,
    ).applicationKnowledge;
    if (
      !storedKnowledge ||
      JSON.stringify(storedKnowledge) !== JSON.stringify(context)
    ) {
      throw new Error(
        `Application question ${question.key} conflicts with an existing question`,
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
        idempotencyKey: `${input.idempotencyKey}:answer:${question.key}`,
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
      key: question.key,
      reason: question.answerRevisionId
        ? "The supplied answer revision is not an approved answer for this question and subject."
        : "No approved answer revision was supplied.",
      task: {
        id: questionTask.id,
        status: questionTask.status,
        taskKey: questionTask.taskKey,
        title: questionTask.title,
      },
    });
  }

  await saveApplicationPreparation({
    actorPersonId: actor.personId,
    actorUserId,
    applicationTaskId: applicationTask.id,
    clientAccessBoundary: options?.clientAccessBoundary,
    questionSetHash,
    questions: preparedQuestions,
    resolvedAnswers: new Map(
      resolved.map((answer) => [answer.key, answer.answerRevisionId]),
    ),
    subject: input.subject,
  });

  return {
    applicationTaskId: applicationTask.id,
    readyForSubmission: unresolved.length === 0,
    resolved,
    unresolved,
  };
}

export async function proposeApplicationSubmission(
  rawInput: unknown,
  actorUserId: string,
  options?: ApplicationKnowledgeOptions,
) {
  const input = ProposeApplicationSubmissionSchema.parse(rawInput);
  const uniqueKeys = new Set(input.answers.map((answer) => answer.key));
  if (uniqueKeys.size !== input.answers.length) {
    throw new Error("Application answer keys must be unique");
  }
  const { task } = await loadApplicationTask({
    action: "EXECUTE",
    actorUserId,
    applicationTaskId: input.applicationTaskId,
    clientAccessBoundary: options?.clientAccessBoundary,
  });
  const activeQuestionCount = await prisma.task.count({
    where: {
      deletedAt: null,
      parentTaskId: input.applicationTaskId,
      status: { in: [TaskStatus.ACTIVE, TaskStatus.DRAFT] },
      contextJson: {
        path: ["applicationKnowledge", "schemaVersion"],
        equals: 1,
      },
    },
  });
  if (activeQuestionCount > 0) {
    throw new Error(
      `Application has ${activeQuestionCount} unresolved answer verification task(s)`,
    );
  }

  const subject: Subject = task.ownerOrganizationId
    ? { organizationId: task.ownerOrganizationId }
    : { personId: (await loadActor(actorUserId)).personId };
  const preparation = readTaskContext(task.contextJson).applicationPreparation;
  if (!preparation || !sameSubject(preparation.subject, subject)) {
    throw new Error("Application must be prepared before submission");
  }
  if (input.answers.length !== preparation.questions.length) {
    throw new Error(
      "Application submission does not include every prepared question",
    );
  }
  const approvedAnswers = [];
  for (const preparedQuestion of preparation.questions) {
    const answer = input.answers.find(
      (candidate) => candidate.key === preparedQuestion.key,
    );
    if (
      !answer ||
      answer.prompt !== preparedQuestion.prompt ||
      !preparedQuestion.answerRevisionId ||
      answer.answerRevisionId !== preparedQuestion.answerRevisionId
    ) {
      throw new Error(
        `Answer ${preparedQuestion.key} does not match the prepared application`,
      );
    }
    const approved = await approvedAnswerByRevision({
      actorUserId,
      answerRevisionId: answer.answerRevisionId,
      clientAccessBoundary: options?.clientAccessBoundary,
      subject,
    });
    if (!approved) {
      throw new Error(
        `Answer ${answer.key} is not an approved reusable answer`,
      );
    }
    if (PLACEHOLDER_PATTERN.test(approved.answer)) {
      throw new Error(
        `Answer ${answer.key} contains unresolved placeholder text`,
      );
    }
    approvedAnswers.push({
      answer: approved.answer,
      answerContentHash: approved.contentHash,
      answerRevisionId: approved.answerRevisionId,
      answerTaskId: approved.questionTaskId,
      key: answer.key,
      prompt: answer.prompt,
    });
  }

  const payload = {
    answers: approvedAnswers,
    applicationTaskId: input.applicationTaskId,
    schemaVersion: "application-submission.v1",
  };
  const request = await proposeExternalAction(
    {
      destination: input.destination,
      expiresAt: input.expiresAt,
      idempotencyKey: input.idempotencyKey,
      operation: "SUBMIT_APPLICATION",
      payload,
      taskId: input.applicationTaskId,
    },
    actorUserId,
    { clientAccessBoundary: options?.clientAccessBoundary },
  );
  return {
    approvalRequired: true,
    applicationTaskId: input.applicationTaskId,
    externalActionRequest: request,
    payload,
  };
}
