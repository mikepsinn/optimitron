import {
  FormFieldType,
  FormPurpose,
  FormStatus,
  FormSubmissionStatus,
  KnowledgeSensitivity,
  ModelRevisionStatus,
  SubjectType,
  TaskCategory,
  TaskClaimPolicy,
  TaskDeadlinePolicy,
  TaskEdgeType,
  TaskExecutionMode,
  TaskStatus,
  TaskVerificationResult,
  Prisma,
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

const MAX_QUESTIONS = 200;
const MAX_SEARCH_CANDIDATES = 500;
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
      .nativeEnum(KnowledgeSensitivity)
      .default(KnowledgeSensitivity.INTERNAL),
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
    formKey: z.string().trim().min(1).max(1_000).optional(),
    formPurpose: z.nativeEnum(FormPurpose).default(FormPurpose.APPLICATION),
    formSourceUrl: z.string().url().max(2_000).optional(),
    formTaskId: z.string().trim().min(1),
    formTitle: z.string().trim().min(1).max(500).optional(),
    idempotencyKey: z.string().trim().min(8).max(500),
    questions: z.array(QuestionSchema).min(1).max(MAX_QUESTIONS),
    subject: SubjectSchema,
  })
  .strict();

export const ProposeFormSubmissionSchema = z
  .object({
    destination: z.string().trim().min(1).max(2_000),
    expiresAt: z.string().datetime().optional(),
    formSubmissionId: z.string().trim().min(1),
    taskExecutionAttemptId: z.string().trim().min(1),
  })
  .strict();

type SubjectInput = z.infer<typeof SubjectSchema>;
type QuestionInput = z.infer<typeof QuestionSchema>;
type FormResponseOptions = {
  clientAccessBoundary?: TaskClientAccessBoundary;
};

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeIdentity(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeIdentity))].sort();
}

const SENSITIVITY_RANK: Record<KnowledgeSensitivity, number> = {
  [KnowledgeSensitivity.PUBLIC]: 0,
  [KnowledgeSensitivity.INTERNAL]: 1,
  [KnowledgeSensitivity.CONFIDENTIAL]: 2,
  [KnowledgeSensitivity.RESTRICTED]: 3,
};

function normalizeTokens(value: string): Set<string> {
  return new Set(
    normalizeIdentity(value)
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

async function knowledgeIdentityKey(question: {
  knowledgeKey?: string | null;
  prompt: string;
}): Promise<string> {
  return sha256CanonicalJson({
    knowledgeKey: question.knowledgeKey
      ? normalizeIdentity(question.knowledgeKey)
      : null,
    prompt: question.knowledgeKey ? null : normalizeIdentity(question.prompt),
  });
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
  subject: SubjectInput,
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
  subject: SubjectInput,
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

async function resolveSubject(subject: SubjectInput) {
  if (subject.organizationId) {
    return prisma.subject.upsert({
      where: { organizationId: subject.organizationId },
      create: {
        organizationId: subject.organizationId,
        subjectType: SubjectType.ORGANIZATION,
      },
      update: { deletedAt: null, subjectType: SubjectType.ORGANIZATION },
      select: { id: true, organizationId: true, personId: true },
    });
  }
  return prisma.subject.upsert({
    where: { personId: subject.personId! },
    create: { personId: subject.personId!, subjectType: SubjectType.PERSON },
    update: { deletedAt: null, subjectType: SubjectType.PERSON },
    select: { id: true, organizationId: true, personId: true },
  });
}

async function loadFormTask(input: {
  action: TaskAccessAction;
  actorUserId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  formTaskId: string;
  subject?: SubjectInput;
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
      isPublic: false,
    },
    select: {
      deadlinePolicy: true,
      dueAt: true,
      id: true,
      ownerOrganizationId: true,
      parentTaskId: true,
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
  artifacts: {
    where: { deletedAt: null, documentRevisionId: { not: null } },
    orderBy: { createdAt: "desc" as const },
    select: {
      contentHash: true,
      documentRevision: {
        select: {
          body: true,
          contentHash: true,
          documentId: true,
          id: true,
          version: true,
        },
      },
      id: true,
    },
    take: 2,
  },
  completedAt: true,
  id: true,
  verifications: {
    where: { deletedAt: null, result: TaskVerificationResult.ACCEPTED },
    orderBy: [{ completedAt: "desc" as const }, { id: "asc" as const }],
    select: { completedAt: true, id: true, reviewerUserId: true },
    take: 1,
  },
} satisfies Prisma.TaskExecutionAttemptSelect;

const knowledgeAnswerSelect = {
  canonicalQuestion: true,
  contextTags: true,
  id: true,
  identityKey: true,
  knowledgeKey: true,
  reviewTask: {
    select: {
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
        orderBy: [{ completedAt: "desc" as const }, { id: "asc" as const }],
        select: approvedAnswerAttemptSelect,
        take: 1,
      },
      id: true,
      status: true,
      title: true,
    },
  },
  sensitivity: true,
  subjectId: true,
  validUntil: true,
} satisfies Prisma.KnowledgeAnswerSelect;

type KnowledgeAnswerRecord = Prisma.KnowledgeAnswerGetPayload<{
  select: typeof knowledgeAnswerSelect;
}>;

function currentApprovedAnswer(answer: KnowledgeAnswerRecord) {
  const attempt = answer.reviewTask.executionAttempts[0];
  const verification = attempt?.verifications[0];
  const artifact =
    attempt?.artifacts.length === 1 ? attempt.artifacts[0] : null;
  if (!attempt || !verification || !artifact?.documentRevision) return null;
  return {
    answer: artifact.documentRevision.body,
    answerDocumentId: artifact.documentRevision.documentId,
    answerRevisionId: artifact.documentRevision.id,
    answerVersion: artifact.documentRevision.version,
    approvalId: verification.id,
    approvedAt:
      verification.completedAt?.toISOString() ??
      attempt.completedAt?.toISOString() ??
      null,
    contentHash: artifact.documentRevision.contentHash ?? artifact.contentHash,
    knowledgeAnswerId: answer.id,
    reviewTaskId: answer.reviewTask.id,
  };
}

async function listKnowledgeAnswers(input: {
  asOf: Date;
  ids?: string[];
  identityKeys?: string[];
  knowledgeKey?: string;
  subjectId: string;
  take?: number;
}) {
  return prisma.knowledgeAnswer.findMany({
    where: {
      deletedAt: null,
      subjectId: input.subjectId,
      ...(input.ids ? { id: { in: input.ids } } : {}),
      ...(input.identityKeys
        ? { identityKey: { in: input.identityKeys } }
        : {}),
      ...(input.knowledgeKey
        ? { knowledgeKey: normalizeIdentity(input.knowledgeKey) }
        : {}),
      OR: [{ validUntil: null }, { validUntil: { gte: input.asOf } }],
      reviewTask: { deletedAt: null, status: TaskStatus.VERIFIED },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: knowledgeAnswerSelect,
    ...(input.take ? { take: input.take } : {}),
  });
}

export async function findReviewedAnswers(
  rawInput: unknown,
  actorUserId: string,
  options?: FormResponseOptions,
) {
  const input = FindReviewedAnswersSchema.parse(rawInput);
  await assertSubjectAccess(input.subject, actorUserId, options);
  const subject = await resolveSubject(input.subject);
  const asOf = input.asOf ? new Date(input.asOf) : new Date();
  const requestedTags = new Set(normalizeTags(input.contextTags));
  const candidates = await listKnowledgeAnswers({
    asOf,
    knowledgeKey: input.knowledgeKey,
    subjectId: subject.id,
    take: MAX_SEARCH_CANDIDATES,
  });

  return {
    answers: candidates
      .flatMap((candidate) => {
        const approved = currentApprovedAnswer(candidate);
        if (!approved) return [];
        const matchingContextTags = candidate.contextTags.filter((tag) =>
          requestedTags.has(normalizeIdentity(tag)),
        );
        const knowledgeKeyMatches =
          Boolean(input.knowledgeKey) &&
          candidate.knowledgeKey ===
            normalizeIdentity(input.knowledgeKey ?? "");
        const score =
          (knowledgeKeyMatches ? 2 : 0) +
          overlapScore(input.question, candidate.canonicalQuestion) +
          matchingContextTags.length * 0.1;
        return score > 0
          ? [
              {
                ...approved,
                canonicalQuestion: candidate.canonicalQuestion,
                contextTags: candidate.contextTags,
                knowledgeKey: candidate.knowledgeKey,
                knowledgeKeyMatches,
                matchingContextTags,
                score,
                sensitivity: candidate.sensitivity,
                validUntil: candidate.validUntil?.toISOString() ?? null,
              },
            ]
          : [];
      })
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

type CapturedField = {
  fieldKey: string;
  knowledgeKey: string | null;
  prompt: string;
  required: boolean;
};

function assertReusableSubmission(
  submission: {
    externalActionRequestId: string | null;
    requestHash: string | null;
    status: FormSubmissionStatus;
  } | null,
  requestHash: string,
) {
  if (!submission) return;
  if (submission.requestHash !== requestHash) {
    throw new Error(
      "Form preparation idempotency key was reused with different fields",
    );
  }
  if (submission.status !== FormSubmissionStatus.DRAFT) {
    throw new Error("Form submission has already been completed");
  }
  if (submission.externalActionRequestId) {
    throw new Error("Form submission has already been proposed");
  }
}

async function captureFormRevision(input: {
  actorUserId: string;
  fields: CapturedField[];
  formKey?: string;
  formPurpose: FormPurpose;
  formSourceUrl?: string;
  formTask: {
    id: string;
    ownerOrganizationId: string | null;
    title: string;
  };
  formTitle?: string;
}) {
  const title = input.formTitle ?? input.formTask.title;
  const definition = {
    fields: input.fields.map((field, position) => ({
      ...field,
      position,
      type: FormFieldType.LONG_TEXT,
    })),
    purpose: input.formPurpose,
    title,
  };
  const contentHash = await sha256CanonicalJson(definition);
  const sourceKey = `captured-form:${await sha256CanonicalJson({
    owner: input.formTask.ownerOrganizationId
      ? `organization:${input.formTask.ownerOrganizationId}`
      : `user:${input.actorUserId}`,
    source: input.formKey ?? `task:${input.formTask.id}`,
  })}`;
  const form = await prisma.form.upsert({
    where: { sourceKey },
    create: {
      createdByUserId: input.actorUserId,
      organizationId: input.formTask.ownerOrganizationId,
      purpose: input.formPurpose,
      sourceKey,
      sourceUrl: input.formSourceUrl,
      status: FormStatus.OPEN,
      title,
    },
    update: {},
    select: {
      createdByUserId: true,
      currentRevisionId: true,
      id: true,
      organizationId: true,
      purpose: true,
      status: true,
      title: true,
    },
  });
  if (
    form.organizationId !== input.formTask.ownerOrganizationId ||
    form.purpose !== input.formPurpose ||
    (!form.organizationId && form.createdByUserId !== input.actorUserId)
  ) {
    throw new Error("Form key belongs to a different form owner or purpose");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Form" WHERE "id" = ${form.id} FOR UPDATE
    `;
    let revision = await tx.formRevision.findUnique({
      where: {
        formId_contentHash: { contentHash, formId: form.id },
      },
      select: { contentHash: true, id: true, version: true },
    });
    if (!revision) {
      const latest = await tx.formRevision.aggregate({
        where: { formId: form.id },
        _max: { version: true },
      });
      revision = await tx.formRevision.create({
        data: {
          contentHash,
          createdByUserId: input.actorUserId,
          formId: form.id,
          publishedAt: new Date(),
          status: ModelRevisionStatus.PUBLISHED,
          title,
          version: (latest._max.version ?? 0) + 1,
        },
        select: { contentHash: true, id: true, version: true },
      });
      await tx.formField.createMany({
        data: definition.fields.map((field) => ({
          formRevisionId: revision!.id,
          key: field.fieldKey,
          knowledgeKey: field.knowledgeKey,
          position: field.position,
          prompt: field.prompt,
          required: field.required,
          type: field.type,
        })),
      });
    }
    if (
      form.currentRevisionId !== revision.id ||
      form.status !== FormStatus.OPEN ||
      form.title !== title
    ) {
      await tx.form.update({
        where: { id: form.id },
        data: {
          currentRevisionId: revision.id,
          status: FormStatus.OPEN,
          title,
        },
      });
    }
    const fields = await tx.formField.findMany({
      where: { deletedAt: null, formRevisionId: revision.id },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, key: true, prompt: true },
    });
    return { formId: form.id, fields, revision };
  });
}

async function ensureKnowledgeAnswer(input: {
  actorPersonId: string;
  actorUserId: string;
  formTask: {
    deadlinePolicy: TaskDeadlinePolicy;
    dueAt: Date | null;
    id: string;
    ownerOrganizationId: string | null;
    parentTaskId: string | null;
  };
  identityKey: string;
  question: QuestionInput;
  subjectId: string;
}) {
  const taskHash = await sha256CanonicalJson({
    identityKey: input.identityKey,
    subjectId: input.subjectId,
  });
  const taskKey = `reviewed-answer:${taskHash}`;
  const reviewTask = await prisma.task.upsert({
    where: { taskKey },
    create: {
      assigneePersonId: input.actorPersonId,
      category: TaskCategory.COMMUNICATION,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson: jsonValue({
        acceptanceCriteria: [
          "The answer is factually accurate and appropriate for reuse in this context.",
          "An immutable answer document revision is attached and accepted by a human reviewer.",
        ],
        expectedDeliverable: "An approved reusable answer revision",
      }),
      createdByUserId: input.actorUserId,
      deadlinePolicy:
        input.formTask.deadlinePolicy === TaskDeadlinePolicy.NONE
          ? TaskDeadlinePolicy.SOFT
          : input.formTask.deadlinePolicy,
      description: [
        input.question.prompt,
        "",
        "Review the proposed answer and correct unsupported, stale, private, or awkward claims. Accept only the exact document revision that should be reused.",
      ].join("\n"),
      dueAt: input.formTask.dueAt,
      estimatedEffortHours: 0.05,
      executionMode: TaskExecutionMode.HUMAN_OR_AGENT,
      isPublic: false,
      ownerOrganizationId: input.formTask.ownerOrganizationId,
      parentTaskId: input.formTask.id,
      status: TaskStatus.ACTIVE,
      taskKey,
      title: `Verify answer: ${input.question.prompt.slice(0, 140)}`,
    },
    update: {},
    select: { id: true, status: true, taskKey: true, title: true },
  });
  const answerIdentity = await prisma.knowledgeAnswer.upsert({
    where: {
      subjectId_identityKey: {
        identityKey: input.identityKey,
        subjectId: input.subjectId,
      },
    },
    create: {
      canonicalQuestion: input.question.prompt,
      contextTags: normalizeTags(input.question.contextTags),
      createdByUserId: input.actorUserId,
      identityKey: input.identityKey,
      knowledgeKey: input.question.knowledgeKey
        ? normalizeIdentity(input.question.knowledgeKey)
        : null,
      reviewTaskId: reviewTask.id,
      sensitivity: input.question.sensitivity,
      subjectId: input.subjectId,
      validUntil: input.question.validUntil
        ? new Date(input.question.validUntil)
        : null,
    },
    update: { deletedAt: null },
    select: { id: true },
  });
  const answer = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "KnowledgeAnswer"
      WHERE "id" = ${answerIdentity.id}
      FOR UPDATE
    `;
    const current = await tx.knowledgeAnswer.findUniqueOrThrow({
      where: { id: answerIdentity.id },
      select: {
        contextTags: true,
        id: true,
        reviewTaskId: true,
        sensitivity: true,
        validUntil: true,
      },
    });
    const requestedValidUntil = input.question.validUntil
      ? new Date(input.question.validUntil)
      : null;
    const validUntil =
      current.validUntil && requestedValidUntil
        ? new Date(
            Math.min(
              current.validUntil.getTime(),
              requestedValidUntil.getTime(),
            ),
          )
        : (current.validUntil ?? requestedValidUntil);
    const sensitivity =
      SENSITIVITY_RANK[input.question.sensitivity] >
      SENSITIVITY_RANK[current.sensitivity]
        ? input.question.sensitivity
        : current.sensitivity;
    return tx.knowledgeAnswer.update({
      where: { id: current.id },
      data: {
        contextTags: normalizeTags([
          ...current.contextTags,
          ...input.question.contextTags,
        ]),
        deletedAt: null,
        sensitivity,
        validUntil,
      },
      select: { id: true, reviewTaskId: true },
    });
  });
  if (answer.reviewTaskId !== reviewTask.id) {
    throw new Error("Reusable answer identity conflicts with its review task");
  }
  await prisma.taskEdge.upsert({
    where: {
      fromTaskId_toTaskId_edgeType: {
        edgeType: TaskEdgeType.BLOCKS,
        fromTaskId: reviewTask.id,
        toTaskId: input.formTask.id,
      },
    },
    create: {
      edgeType: TaskEdgeType.BLOCKS,
      fromTaskId: reviewTask.id,
      toTaskId: input.formTask.id,
    },
    update: { deletedAt: null },
  });
  for (const [
    index,
    sourceArtifactId,
  ] of input.question.sourceArtifactIds.entries()) {
    await prisma.taskSourceArtifact.upsert({
      where: {
        taskId_sourceArtifactId: { sourceArtifactId, taskId: reviewTask.id },
      },
      create: {
        isPrimary: index === 0,
        sourceArtifactId,
        taskId: reviewTask.id,
      },
      update: { deletedAt: null, isPrimary: index === 0 },
    });
  }
  return { answer, reviewTask };
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
  const actor = await assertSubjectAccess(input.subject, actorUserId, options);
  const subject = await resolveSubject(input.subject);
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
  const { task: formTask } = await loadFormTask({
    action: "MANAGE",
    actorUserId,
    clientAccessBoundary: options?.clientAccessBoundary,
    formTaskId: input.formTaskId,
    subject: input.subject,
  });
  const preparedFields: CapturedField[] = input.questions.map((question) => ({
    fieldKey: question.fieldKey,
    knowledgeKey: question.knowledgeKey
      ? normalizeIdentity(question.knowledgeKey)
      : null,
    prompt: question.prompt,
    required: true,
  }));
  const requestHash = await sha256CanonicalJson({
    fields: preparedFields,
    formKey: input.formKey ?? null,
    formPurpose: input.formPurpose,
    formSourceUrl: input.formSourceUrl ?? null,
    formTaskId: formTask.id,
    formTitle: input.formTitle ?? formTask.title,
    subjectId: subject.id,
  });
  let submission = await prisma.formSubmission.findUnique({
    where: {
      createdByUserId_idempotencyKey: {
        createdByUserId: actorUserId,
        idempotencyKey: input.idempotencyKey,
      },
    },
    select: {
      externalActionRequestId: true,
      id: true,
      requestHash: true,
      status: true,
    },
  });
  assertReusableSubmission(submission, requestHash);
  const captured = await captureFormRevision({
    actorUserId,
    fields: preparedFields,
    formKey: input.formKey,
    formPurpose: input.formPurpose,
    formSourceUrl: input.formSourceUrl,
    formTask,
    formTitle: input.formTitle,
  });
  const identityKeys = await Promise.all(
    input.questions.map(knowledgeIdentityKey),
  );
  const knowledgeByIdentity = new Map(
    (
      await prisma.knowledgeAnswer.findMany({
        where: {
          deletedAt: null,
          identityKey: { in: identityKeys },
          subjectId: subject.id,
        },
        select: { id: true, identityKey: true, reviewTaskId: true },
      })
    ).map((answer) => [answer.identityKey, answer]),
  );
  const draftDocuments = new Map<string, ReturnType<typeof toDocumentDto>>();

  for (const [index, question] of input.questions.entries()) {
    const identityKey = identityKeys[index]!;
    const ensured = await ensureKnowledgeAnswer({
      actorPersonId: actor.personId,
      actorUserId,
      formTask,
      identityKey,
      question,
      subjectId: subject.id,
    });
    knowledgeByIdentity.set(identityKey, {
      id: ensured.answer.id,
      identityKey,
      reviewTaskId: ensured.reviewTask.id,
    });
  }

  const knowledgeAnswers = await listKnowledgeAnswers({
    asOf: new Date(),
    identityKeys,
    subjectId: subject.id,
  });
  const knowledgeRecords = new Map(
    knowledgeAnswers.map((answer) => [answer.identityKey, answer]),
  );
  for (const [index, question] of input.questions.entries()) {
    if (!question.proposedAnswer) continue;
    const identityKey = identityKeys[index]!;
    const stable = knowledgeByIdentity.get(identityKey);
    if (!stable) throw new Error("Reusable answer was not persisted");
    const approved = knowledgeRecords.get(identityKey);
    const current = approved ? currentApprovedAnswer(approved) : null;
    if (current) {
      if (current.answer !== question.proposedAnswer) {
        throw new Error(
          `A reviewed answer already exists for ${question.fieldKey}; omit proposedAnswer to reuse it`,
        );
      }
      continue;
    }
    const document = await createDocument({
      body: question.proposedAnswer,
      createdByUserId: actorUserId,
      idempotencyKey: `${input.idempotencyKey}:answer:${stable.id}`,
      organizationId: input.subject.organizationId ?? null,
      sourceArtifactId: question.sourceArtifactIds[0] ?? null,
      taskId: stable.reviewTaskId,
      title: question.prompt,
      visibility: null,
    });
    draftDocuments.set(question.fieldKey, toDocumentDto(document));
  }
  const fieldsByKey = new Map(
    captured.fields.map((field) => [field.key, field]),
  );
  const resolved = [];
  const unresolved = [];
  const responseRows = [];

  for (const [index, question] of input.questions.entries()) {
    const identityKey = identityKeys[index]!;
    const knowledge = knowledgeRecords.get(identityKey);
    const stable = knowledgeByIdentity.get(identityKey);
    const field = fieldsByKey.get(question.fieldKey);
    if (!stable || !field)
      throw new Error("Prepared form field was not persisted");
    const approved = knowledge ? currentApprovedAnswer(knowledge) : null;
    const selected = question.answerRevisionId
      ? approved?.answerRevisionId === question.answerRevisionId
        ? approved
        : null
      : approved &&
          knowledge!.sensitivity !== KnowledgeSensitivity.CONFIDENTIAL &&
          knowledge!.sensitivity !== KnowledgeSensitivity.RESTRICTED
        ? approved
        : null;
    if (selected) {
      resolved.push({
        answerRevisionId: selected.answerRevisionId,
        fieldKey: question.fieldKey,
        knowledgeAnswerId: stable.id,
        reviewTaskId: selected.reviewTaskId,
      });
    } else {
      unresolved.push({
        draftDocument: draftDocuments.get(question.fieldKey) ?? null,
        fieldKey: question.fieldKey,
        reason: question.answerRevisionId
          ? "The supplied answer revision is not the current approved answer for this question and subject."
          : approved
            ? "This answer is sensitive; choose its exact approved revision before reuse."
            : "No approved answer revision is available.",
        task: {
          id: stable.reviewTaskId,
          status: knowledge?.reviewTask.status ?? TaskStatus.ACTIVE,
          taskKey: `reviewed-answer:${await sha256CanonicalJson({ identityKey, subjectId: subject.id })}`,
          title:
            knowledge?.reviewTask.title ??
            `Verify answer: ${question.prompt.slice(0, 140)}`,
        },
      });
    }
    responseRows.push({
      approved: selected,
      field,
      knowledgeAnswerId: stable.id,
    });
  }

  if (!submission) {
    submission = await prisma.formSubmission.upsert({
      where: {
        createdByUserId_idempotencyKey: {
          createdByUserId: actorUserId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      create: {
        createdByUserId: actorUserId,
        formRevisionId: captured.revision.id,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        subjectId: subject.id,
        taskId: formTask.id,
      },
      update: {},
      select: {
        externalActionRequestId: true,
        id: true,
        requestHash: true,
        status: true,
      },
    });
  }
  assertReusableSubmission(submission, requestHash);
  await prisma.$transaction(
    responseRows.map((row) =>
      prisma.formResponse.upsert({
        where: {
          submissionId_fieldId: {
            fieldId: row.field.id,
            submissionId: submission.id,
          },
        },
        create: {
          answerDocumentRevisionId: row.approved?.answerRevisionId ?? null,
          approvalVerificationId: row.approved?.approvalId ?? null,
          fieldId: row.field.id,
          formRevisionId: captured.revision.id,
          knowledgeAnswerId: row.knowledgeAnswerId,
          submissionId: submission.id,
          valueJson: Prisma.JsonNull,
        },
        update: {
          answerDocumentRevisionId: row.approved?.answerRevisionId ?? null,
          approvalVerificationId: row.approved?.approvalId ?? null,
          deletedAt: null,
          knowledgeAnswerId: row.knowledgeAnswerId,
          valueJson: Prisma.JsonNull,
        },
      }),
    ),
  );

  return {
    formId: captured.formId,
    formRevisionId: captured.revision.id,
    formSubmissionId: submission.id,
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
  const submission = await prisma.formSubmission.findFirst({
    where: {
      createdByUserId: actorUserId,
      deletedAt: null,
      id: input.formSubmissionId,
    },
    select: {
      formRevision: {
        select: {
          contentHash: true,
          formId: true,
          fields: {
            where: { deletedAt: null },
            orderBy: [{ position: "asc" }, { id: "asc" }],
            select: { id: true, key: true, knowledgeKey: true, prompt: true },
          },
          id: true,
          version: true,
        },
      },
      externalActionRequestId: true,
      id: true,
      responses: {
        where: { deletedAt: null },
        select: {
          answerDocumentRevisionId: true,
          approvalVerificationId: true,
          fieldId: true,
          knowledgeAnswerId: true,
        },
      },
      status: true,
      subject: { select: { organizationId: true, personId: true } },
      subjectId: true,
      taskId: true,
    },
  });
  if (!submission?.taskId || !submission.subjectId || !submission.subject) {
    throw new Error("Prepared form submission not found");
  }
  if (submission.status !== FormSubmissionStatus.DRAFT) {
    throw new Error("Form submission is no longer a draft");
  }
  if (submission.externalActionRequestId) {
    throw new Error("Form submission has already been proposed");
  }
  const subjectInput: SubjectInput = submission.subject.organizationId
    ? { organizationId: submission.subject.organizationId }
    : submission.subject.personId
      ? { personId: submission.subject.personId }
      : (() => {
          throw new Error("Prepared form submission has no supported subject");
        })();
  await assertSubjectAccess(subjectInput, actorUserId, options);
  await loadFormTask({
    action: "EXECUTE",
    actorUserId,
    clientAccessBoundary: options?.clientAccessBoundary,
    formTaskId: submission.taskId,
    subject: subjectInput,
  });
  if (submission.responses.length !== submission.formRevision.fields.length) {
    throw new Error("Form submission does not include every prepared field");
  }
  const knowledgeAnswers = await listKnowledgeAnswers({
    asOf: new Date(),
    ids: submission.responses.flatMap((response) =>
      response.knowledgeAnswerId ? [response.knowledgeAnswerId] : [],
    ),
    subjectId: submission.subjectId,
  });
  const knowledgeById = new Map(
    knowledgeAnswers.map((answer) => [answer.id, answer]),
  );
  const responseByField = new Map(
    submission.responses.map((response) => [response.fieldId, response]),
  );
  const approvedResponses = [];
  for (const field of submission.formRevision.fields) {
    const response = responseByField.get(field.id);
    const knowledge = response?.knowledgeAnswerId
      ? knowledgeById.get(response.knowledgeAnswerId)
      : null;
    const approved = knowledge ? currentApprovedAnswer(knowledge) : null;
    if (
      !response ||
      !approved ||
      response.answerDocumentRevisionId !== approved.answerRevisionId ||
      response.approvalVerificationId !== approved.approvalId
    ) {
      throw new Error(
        `Response ${field.key} is missing or no longer uses the current approved answer; prepare the form again`,
      );
    }
    if (PLACEHOLDER_PATTERN.test(approved.answer)) {
      throw new Error(
        `Response ${field.key} contains unresolved placeholder text`,
      );
    }
    approvedResponses.push({
      answer: approved.answer,
      answerContentHash: approved.contentHash,
      answerRevisionId: approved.answerRevisionId,
      approvalId: approved.approvalId,
      approvedAt: approved.approvedAt,
      fieldKey: field.key,
      knowledgeAnswerId: approved.knowledgeAnswerId,
      knowledgeKey: field.knowledgeKey,
      prompt: field.prompt,
      reviewTaskId: approved.reviewTaskId,
    });
  }
  const payload = {
    formHash: submission.formRevision.contentHash,
    formId: submission.formRevision.formId,
    formRevisionId: submission.formRevision.id,
    formRevisionVersion: submission.formRevision.version,
    formSubmissionId: submission.id,
    formTaskId: submission.taskId,
    responses: approvedResponses,
    schemaVersion: "form-submission.v1",
  };
  const request = await proposeExternalAction(
    {
      destination: input.destination,
      expiresAt: input.expiresAt,
      idempotencyKey: `form-submission:${submission.id}`,
      operation: "SUBMIT_FORM",
      payload,
      taskExecutionAttemptId: input.taskExecutionAttemptId,
      taskId: submission.taskId,
    },
    actorUserId,
    { clientAccessBoundary: options?.clientAccessBoundary },
  );
  const linked = await prisma.formSubmission.updateMany({
    where: { externalActionRequestId: null, id: submission.id },
    data: {
      externalActionRequestId: request.id,
      taskExecutionAttemptId: input.taskExecutionAttemptId,
    },
  });
  if (linked.count === 0) {
    const current = await prisma.formSubmission.findUnique({
      where: { id: submission.id },
      select: { externalActionRequestId: true },
    });
    if (current?.externalActionRequestId !== request.id) {
      throw new Error("Form submission has already been proposed");
    }
  }
  return {
    approvalRequired: true,
    externalActionRequest: request,
    formSubmissionId: submission.id,
    formTaskId: submission.taskId,
    payload,
  };
}
