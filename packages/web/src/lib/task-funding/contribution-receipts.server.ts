import {
  ContentAccessLevel,
  TaskCandidateKind,
  TaskClaimPolicy,
  TaskExecutionAttemptStatus,
  TaskFundingPaymentStatus,
  TaskFundingTargetStatus,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
  type Prisma,
  type PrismaClient,
} from "@optimitron/db";
import { buildTaskFundingReceiptTaskKey } from "@optimitron/db/task-keys";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hasContentAccess,
  resolveDocumentAccessBatch,
} from "@/lib/content-access.server";
import {
  DocumentDecisionV1Schema,
  sameDocumentRevisionPin,
  type DocumentRevisionPin,
} from "@/lib/tasks/document-review-contracts";
import {
  canUserManageTask,
  canUserViewTask,
  isTaskWithinClientAccessBoundary,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import { lockTaskFundingPaymentInTransaction } from "./payment-lock.server";

const IdSchema = z.string().trim().min(1).max(300);
const ContentHashSchema = z.string().trim().min(1).max(200);
const IsoDateTimeSchema = z.string().datetime();

const DocumentRevisionReceiptSnapshotSchema = z
  .object({
    contentHash: ContentHashSchema,
    documentId: IdSchema,
    revisionId: IdSchema,
    title: z.string().min(1),
    version: z.number().int().positive(),
  })
  .strict();

const ImpactMetricReceiptSnapshotSchema = z
  .object({
    baseValue: z.number().nullable(),
    highValue: z.number().nullable(),
    lowValue: z.number().nullable(),
    metadata: z.unknown().nullable(),
    metricKey: z.string().min(1),
    unit: z.string().min(1),
    value: z.unknown().nullable(),
  })
  .strict();

const ImpactFrameReceiptSnapshotSchema = z
  .object({
    frameKey: z.string().min(1),
    frameSlug: z.string().min(1),
    metrics: z.array(ImpactMetricReceiptSnapshotSchema),
    summary: z.unknown().nullable(),
    values: z.record(z.string(), z.number().nullable()),
  })
  .strict();

const ImpactEstimateReceiptSnapshotSchema = z
  .object({
    assumptions: z.unknown().nullable(),
    calculationVersion: z.string().min(1),
    counterfactualKey: z.string().min(1),
    estimateKind: z.string().min(1),
    estimateSetId: IdSchema,
    formulaText: z.string().nullable(),
    frames: z.array(ImpactFrameReceiptSnapshotSchema),
    methodologyKey: z.string().min(1),
    parameterInputs: z.array(
      z
        .object({
          parameterRevisionId: IdSchema,
          position: z.number().int().nonnegative(),
          symbol: z.string().min(1),
        })
        .strict(),
    ),
    parameterSetHash: ContentHashSchema,
    publicationStatus: z.string().min(1),
    sourceArtifacts: z.array(
      z
        .object({
          contentHash: z.string().nullable(),
          isPrimary: z.boolean(),
          sourceArtifactId: IdSchema,
          sourceKey: z.string().nullable(),
        })
        .strict(),
    ),
    sourceSystem: z.string().min(1),
  })
  .strict();

export const ContributionReceiptV1Schema = z
  .object({
    contributor: z
      .object({
        donorEmail: z.string().max(320).nullable(),
        donorName: z.string().nullable(),
        donorOrganizationId: z.string().nullable(),
        donorUserId: z.string().nullable(),
      })
      .strict(),
    eopMinted: z.literal(false),
    governingDocuments: z.array(DocumentRevisionReceiptSnapshotSchema).min(1),
    impactEstimate: ImpactEstimateReceiptSnapshotSchema,
    impactRealized: z.literal(false),
    intendedTask: z
      .object({
        id: IdSchema,
        taskKey: z.string().nullable(),
        title: z.string().min(1),
      })
      .strict(),
    issuedAt: IsoDateTimeSchema,
    issuedByUserId: IdSchema,
    payment: z
      .object({
        amountCents: z.number().int().positive(),
        commerceOrderId: IdSchema,
        currency: z.string().regex(/^[a-z]{3}$/u),
        paidAt: IsoDateTimeSchema,
        paymentId: IdSchema,
        source: z.string().min(1),
        status: z.literal("PAID"),
        stripeChargeId: z.string().nullable(),
        stripePaymentIntentId: z.string().nullable(),
        targetId: IdSchema,
      })
      .strict(),
    schema: z.literal("optimitron.contribution-receipt.v1"),
    taskCompleted: z.literal(false),
    terms: z
      .object({
        fundingTermsVersion: z.string().nullable(),
        termsDocument: DocumentRevisionReceiptSnapshotSchema,
      })
      .strict(),
  })
  .strict();

export type ContributionReceiptV1 = z.infer<typeof ContributionReceiptV1Schema>;

export const ContributionOutcomeAddendumKindSchema = z.enum([
  "TASK_COMPLETED",
  "IMPACT_OBSERVED",
  "REFUND",
  "CORRECTION",
]);

const OutcomeEvidenceSchema = z
  .object({
    contentHash: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).max(10_000).nullable().optional(),
    sourceArtifactId: z.string().trim().min(1).nullable().optional(),
    sourceUrl: z.string().url().nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(
        value.contentHash ||
        value.note ||
        value.sourceArtifactId ||
        value.sourceUrl,
      ),
    "Outcome evidence must identify at least one source",
  );

export const OutcomeAddendumV1Schema = z
  .object({
    correctsArtifactId: z.string().nullable(),
    eopMinted: z.literal(false),
    evidence: z.array(OutcomeEvidenceSchema),
    idempotencyKey: z.string().min(1),
    impactRealized: z.boolean(),
    kind: ContributionOutcomeAddendumKindSchema,
    observedAt: IsoDateTimeSchema,
    paymentId: IdSchema,
    paymentStatusAtObservation: z.string().min(1),
    receiptArtifactId: IdSchema,
    receiptContentHash: ContentHashSchema,
    recordedAt: IsoDateTimeSchema,
    recordedByUserId: IdSchema,
    schema: z.literal("optimitron.outcome-addendum.v1"),
    summary: z.string().trim().min(1).max(20_000),
    taskCompleted: z.boolean(),
  })
  .strict();

export type OutcomeAddendumV1 = z.infer<typeof OutcomeAddendumV1Schema>;

export const ContributionReceiptBindingV1Schema = z
  .object({
    governingDocumentRevisionIds: z.array(IdSchema).min(1).max(100),
    issuerUserId: IdSchema,
    schema: z.literal("optimitron.contribution-receipt-binding.v1"),
    termsDocumentRevisionId: IdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.governingDocumentRevisionIds).size !==
      value.governingDocumentRevisionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Governing document revision ids must be unique",
        path: ["governingDocumentRevisionIds"],
      });
    }
    if (
      !value.governingDocumentRevisionIds.includes(
        value.termsDocumentRevisionId,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The adopted funding terms must be a governing document",
        path: ["termsDocumentRevisionId"],
      });
    }
  });

export type ContributionReceiptBindingV1 = z.infer<
  typeof ContributionReceiptBindingV1Schema
>;

/**
 * Funding is deliberately fail-closed. A manager must freeze this binding in
 * TaskFundingTarget.metadata before Stripe can collect money. The receipt
 * issuer revalidates access, task ownership, and adoption provenance when the
 * payment settles; this parser only establishes the immutable input contract.
 */
export function readContributionReceiptBinding(
  metadata: unknown,
): ContributionReceiptBindingV1 | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const parsed = ContributionReceiptBindingV1Schema.safeParse(
    (metadata as Record<string, unknown>).contributionReceipt,
  );
  return parsed.success ? parsed.data : null;
}

export function requireContributionReceiptBinding(
  metadata: unknown,
): ContributionReceiptBindingV1 {
  const binding = readContributionReceiptBinding(metadata);
  if (!binding) {
    throw new Error(
      "Task funding requires adopted terms and governing document revisions before payment",
    );
  }
  return binding;
}

export function resolveContributionReceiptBinding(
  fundingTargetMetadata: unknown,
  taskContextJson: unknown,
): ContributionReceiptBindingV1 {
  return (
    readContributionReceiptBinding(fundingTargetMetadata) ??
    requireContributionReceiptBinding(taskContextJson)
  );
}

export const IssueContributionReceiptInputSchema = z
  .object({
    governingDocumentRevisionIds: z.array(IdSchema).min(1).max(100),
    paymentId: IdSchema,
    termsDocumentRevisionId: IdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      new Set(value.governingDocumentRevisionIds).size !==
      value.governingDocumentRevisionIds.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Governing document revision ids must be unique",
        path: ["governingDocumentRevisionIds"],
      });
    }
    if (
      !value.governingDocumentRevisionIds.includes(
        value.termsDocumentRevisionId,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The adopted funding terms must be a governing document",
        path: ["termsDocumentRevisionId"],
      });
    }
  });

export const AppendContributionOutcomeAddendumInputSchema = z
  .object({
    correctsArtifactId: IdSchema.nullable().optional(),
    evidence: z.array(OutcomeEvidenceSchema).max(100).default([]),
    idempotencyKey: z.string().trim().min(1).max(300),
    impactRealized: z.boolean(),
    kind: ContributionOutcomeAddendumKindSchema,
    observedAt: z.coerce.date(),
    paymentId: IdSchema,
    summary: z.string().trim().min(1).max(20_000),
    taskCompleted: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.impactRealized || value.kind === "IMPACT_OBSERVED") &&
      value.evidence.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Impact observations require outcome evidence",
        path: ["evidence"],
      });
    }
    if (value.kind === "TASK_COMPLETED" && !value.taskCompleted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Task completion addenda must record taskCompleted as true",
        path: ["taskCompleted"],
      });
    }
    if (
      (value.kind === "REFUND" || value.kind === "CORRECTION") &&
      value.taskCompleted
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Refund and correction addenda cannot assert that work was completed",
        path: ["taskCompleted"],
      });
    }
    if (value.kind === "CORRECTION" && !value.correctsArtifactId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Corrections must identify the artifact they correct",
        path: ["correctsArtifactId"],
      });
    }
  });

type ContributionReceiptDb = Pick<
  PrismaClient,
  "$transaction" | "task" | "taskExecutionArtifact"
>;

export interface ContributionReceiptOptions {
  canManageTask?: typeof canUserManageTask;
  canViewTask?: typeof canUserViewTask;
  clientAccessBoundary?: TaskClientAccessBoundary;
  db?: ContributionReceiptDb;
  now?: Date;
  resolveDocumentAccessBatch?: typeof resolveDocumentAccessBatch;
}

const RECEIPT_NOT_FOUND_MESSAGE = "Task funding receipt not found";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function assertCanManageReceiptTask(
  task: {
    id: string;
    isPublic: boolean;
    ownerOrganizationId: string | null;
  },
  actorUserId: string,
  options: ContributionReceiptOptions,
) {
  if (
    options.clientAccessBoundary &&
    !isTaskWithinClientAccessBoundary(task, options.clientAccessBoundary)
  ) {
    throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  }
  const canManage = options.canManageTask ?? canUserManageTask;
  if (!(await canManage(task.id, actorUserId))) {
    throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  }
}

export function getContributionReceiptIds(paymentId: string) {
  const id = IdSchema.parse(paymentId);
  return {
    artifactId: `task-funding-receipt-artifact:${id}`,
    attemptId: `task-funding-receipt-attempt:${id}`,
    taskId: `task-funding-receipt:${id}`,
    taskKey: buildTaskFundingReceiptTaskKey(id),
    verificationId: `task-funding-receipt-verification:${id}`,
  } as const;
}

function documentSnapshot(revision: {
  contentHash: string | null;
  documentId: string;
  id: string;
  title: string;
  version: number;
}) {
  if (!revision.contentHash) {
    throw new Error(`Document revision ${revision.id} has no content hash`);
  }
  return DocumentRevisionReceiptSnapshotSchema.parse({
    contentHash: revision.contentHash,
    documentId: revision.documentId,
    revisionId: revision.id,
    title: revision.title,
    version: revision.version,
  });
}

function impactValues(frame: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(frame)
      .filter(
        ([key, value]) =>
          (key.endsWith("Low") ||
            key.endsWith("Base") ||
            key.endsWith("High") ||
            [
              "adoptionRampYears",
              "annualDiscountRate",
              "benefitDurationYears",
              "evaluationHorizonYears",
              "timeToImpactStartDays",
            ].includes(key)) &&
          (typeof value === "number" || value === null),
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, number | null>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

type ReceiptDocumentRevision = {
  contentHash: string | null;
  document: { taskId: string | null };
  documentId: string;
  id: string;
  title: string;
  version: number;
};

async function assertReceiptDocumentProvenance(
  tx: Prisma.TransactionClient,
  input: {
    actorUserId: string;
    fundedTaskId: string;
    governingRevisionIds: readonly string[];
    revisions: readonly ReceiptDocumentRevision[];
  },
  options: ContributionReceiptOptions,
) {
  for (const revision of input.revisions) {
    if (revision.document.taskId !== input.fundedTaskId) {
      throw new Error(
        `Document revision ${revision.id} is not attached to the funded task`,
      );
    }
  }

  const documentIds = [
    ...new Set(input.revisions.map((row) => row.documentId)),
  ];
  const resolveAccess =
    options.resolveDocumentAccessBatch ?? resolveDocumentAccessBatch;
  const accessByDocument = await resolveAccess(
    documentIds,
    input.actorUserId,
    tx,
  );
  const inaccessible = documentIds.find(
    (documentId) =>
      !hasContentAccess(
        accessByDocument.get(documentId) ?? null,
        ContentAccessLevel.VIEW,
      ),
  );
  if (inaccessible) {
    throw new Error("One or more governing documents are not accessible");
  }

  const pins = new Map<string, DocumentRevisionPin>();
  for (const revision of input.revisions) {
    if (!revision.contentHash) {
      throw new Error(`Document revision ${revision.id} has no content hash`);
    }
    pins.set(revision.id, {
      contentHash: revision.contentHash,
      documentId: revision.documentId,
      revisionId: revision.id,
      version: revision.version,
    });
  }

  const decisionAttempts = await tx.taskExecutionAttempt.findMany({
    where: {
      deletedAt: null,
      metadata: { equals: "document-decision", path: ["kind"] },
      status: TaskExecutionAttemptStatus.COMPLETED,
      taskId: input.fundedTaskId,
    },
    select: {
      artifacts: {
        where: {
          deletedAt: null,
          metadataJson: { equals: "document-decision", path: ["kind"] },
        },
        select: {
          contentHash: true,
          metadataJson: true,
          structuredResultJson: true,
          submittedByUserId: true,
        },
      },
      executorUserId: true,
      metadata: true,
    },
  });
  const adoptedRevisionIds = new Set<string>();
  for (const attempt of decisionAttempts) {
    if (asRecord(attempt.metadata)?.kind !== "document-decision") continue;
    for (const artifact of attempt.artifacts) {
      if (asRecord(artifact.metadataJson)?.kind !== "document-decision") {
        continue;
      }
      const parsed = DocumentDecisionV1Schema.safeParse(
        artifact.structuredResultJson,
      );
      if (!parsed.success) continue;
      const decision = parsed.data;
      const expectedPin = pins.get(decision.adoptedDocument.revisionId);
      if (
        !expectedPin ||
        decision.authorityTaskId !== input.fundedTaskId ||
        attempt.executorUserId !== decision.decidedByUserId ||
        artifact.submittedByUserId !== decision.decidedByUserId ||
        !sameDocumentRevisionPin(decision.adoptedDocument, expectedPin) ||
        artifact.contentHash !== (await sha256CanonicalJson(decision))
      ) {
        continue;
      }
      adoptedRevisionIds.add(expectedPin.revisionId);
    }
  }

  const missingAdoption = input.governingRevisionIds.find(
    (revisionId) => !adoptedRevisionIds.has(revisionId),
  );
  if (missingAdoption) {
    throw new Error(
      `Governing document revision ${missingAdoption} has no valid adoption decision for the funded task`,
    );
  }
}

function sameContributionReceiptBinding(
  left: ContributionReceiptBindingV1,
  right: ContributionReceiptBindingV1,
) {
  return (
    left.issuerUserId === right.issuerUserId &&
    left.termsDocumentRevisionId === right.termsDocumentRevisionId &&
    left.governingDocumentRevisionIds.length ===
      right.governingDocumentRevisionIds.length &&
    left.governingDocumentRevisionIds.every(
      (revisionId, index) =>
        revisionId === right.governingDocumentRevisionIds[index],
    )
  );
}

/**
 * Funding-target creation and binding changes share the same per-task lock as
 * funding allocation. The advisory lock also covers the no-target-yet case,
 * where a row lock cannot prevent two concurrent first writers.
 */
export async function lockContributionReceiptBindingInTransaction(
  taskId: string,
  tx: Prisma.TransactionClient,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${taskId}, 0))`;
}

async function assertTargetHasNoPaymentsBeforeFirstBinding(
  targetId: string,
  tx: Prisma.TransactionClient,
) {
  const payment = await tx.taskFundingPayment.findFirst({
    where: { deletedAt: null, targetId },
    select: { id: true },
  });
  if (payment) {
    throw new Error(
      "A funding target with existing payments cannot receive its first receipt binding",
    );
  }
}

/**
 * Create (or restore) a funding target while freezing its receipt binding.
 * Callers may have read task context before entering their transaction, so the
 * target is re-read under the advisory lock before any metadata is written.
 */
export async function upsertTaskFundingTargetWithReceiptBindingInTransaction(
  rawInput: {
    binding: ContributionReceiptBindingV1;
    createdBy: string;
    currency: string;
    targetAmountCents: bigint;
    taskId: string;
  },
  tx: Prisma.TransactionClient,
) {
  const binding = ContributionReceiptBindingV1Schema.parse(rawInput.binding);
  await lockContributionReceiptBindingInTransaction(rawInput.taskId, tx);

  const current = await tx.taskFundingTarget.findUnique({
    where: { taskId: rawInput.taskId },
    select: {
      id: true,
      metadata: true,
      targetAmountCents: true,
    },
  });
  const currentMetadata = asRecord(current?.metadata) ?? {};
  const existingBinding = readContributionReceiptBinding(currentMetadata);
  if (
    current &&
    "contributionReceipt" in currentMetadata &&
    !existingBinding
  ) {
    throw new Error(
      "The existing funding round has an invalid frozen receipt binding",
    );
  }
  if (existingBinding) {
    if (!sameContributionReceiptBinding(existingBinding, binding)) {
      throw new Error(
        "The existing funding round is already bound to different adopted terms",
      );
    }
  } else {
    if (current) {
      await assertTargetHasNoPaymentsBeforeFirstBinding(current.id, tx);
    }
    const task = await tx.task.findFirst({
      where: { deletedAt: null, id: rawInput.taskId },
      select: { contextJson: true },
    });
    if (!task) throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
    const authoritativeBinding = requireContributionReceiptBinding(
      task.contextJson,
    );
    if (!sameContributionReceiptBinding(authoritativeBinding, binding)) {
      throw new Error(
        "The task's adopted receipt binding changed before funding started",
      );
    }
  }

  if (current) {
    return tx.taskFundingTarget.update({
      where: { id: current.id },
      data: {
        deletedAt: null,
        metadata: jsonValue({
          ...currentMetadata,
          contributionReceipt: binding,
          createdBy: currentMetadata.createdBy ?? rawInput.createdBy,
        }),
      },
      select: { id: true, targetAmountCents: true },
    });
  }

  return tx.taskFundingTarget.create({
    data: {
      currency: rawInput.currency,
      metadata: jsonValue({
        contributionReceipt: binding,
        createdBy: rawInput.createdBy,
      }),
      status: TaskFundingTargetStatus.OPEN,
      targetAmountCents: rawInput.targetAmountCents,
      taskId: rawInput.taskId,
    },
    select: { id: true, targetAmountCents: true },
  });
}

/**
 * Freeze the adopted document set that every later payment on this funding
 * round must copy into its receipt. Task context holds the pending binding
 * before a target exists; an existing target is immutable once bound.
 */
export async function configureContributionReceiptBindingInTransaction(
  rawInput: {
    governingDocumentRevisionIds: readonly string[];
    taskId: string;
    termsDocumentRevisionId: string;
  },
  actorUserId: string,
  tx: Prisma.TransactionClient,
  options: ContributionReceiptOptions = {},
) {
  const binding = ContributionReceiptBindingV1Schema.parse({
    governingDocumentRevisionIds: [
      ...new Set(rawInput.governingDocumentRevisionIds),
    ].sort(),
    issuerUserId: actorUserId,
    schema: "optimitron.contribution-receipt-binding.v1",
    termsDocumentRevisionId: rawInput.termsDocumentRevisionId,
  });
  await lockContributionReceiptBindingInTransaction(rawInput.taskId, tx);
  const task = await tx.task.findFirst({
    where: { deletedAt: null, id: rawInput.taskId },
    select: {
      contextJson: true,
      fundingTarget: { select: { id: true, metadata: true } },
      id: true,
      isPublic: true,
      ownerOrganizationId: true,
    },
  });
  if (!task) throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  await assertCanManageReceiptTask(task, actorUserId, options);

  const revisions = await tx.documentRevision.findMany({
    where: {
      deletedAt: null,
      id: { in: binding.governingDocumentRevisionIds },
      document: { deletedAt: null },
    },
    select: {
      contentHash: true,
      document: { select: { taskId: true } },
      documentId: true,
      id: true,
      title: true,
      version: true,
    },
  });
  if (revisions.length !== binding.governingDocumentRevisionIds.length) {
    throw new Error("One or more governing document revisions were not found");
  }
  await assertReceiptDocumentProvenance(
    tx,
    {
      actorUserId,
      fundedTaskId: task.id,
      governingRevisionIds: binding.governingDocumentRevisionIds,
      revisions,
    },
    options,
  );

  const existingTargetBinding = readContributionReceiptBinding(
    task.fundingTarget?.metadata,
  );
  const existingTargetMetadata = asRecord(task.fundingTarget?.metadata) ?? {};
  if (
    task.fundingTarget &&
    "contributionReceipt" in existingTargetMetadata &&
    !existingTargetBinding
  ) {
    throw new Error(
      "The existing funding round has an invalid frozen receipt binding",
    );
  }
  if (
    existingTargetBinding &&
    !sameContributionReceiptBinding(existingTargetBinding, binding)
  ) {
    throw new Error(
      "The existing funding round is already bound to different adopted terms",
    );
  }
  if (task.fundingTarget && !existingTargetBinding) {
    await assertTargetHasNoPaymentsBeforeFirstBinding(
      task.fundingTarget.id,
      tx,
    );
  }

  await tx.task.update({
    where: { id: task.id },
    data: {
      contextJson: jsonValue({
        ...(asRecord(task.contextJson) ?? {}),
        contributionReceipt: binding,
      }),
    },
  });
  if (task.fundingTarget && !existingTargetBinding) {
    await tx.taskFundingTarget.update({
      where: { id: task.fundingTarget.id },
      data: {
        metadata: jsonValue({
          ...existingTargetMetadata,
          contributionReceipt: binding,
        }),
      },
    });
  }
  return binding;
}

function assertContributionReceiptMatchesPaymentLedger(
  receipt: ContributionReceiptV1,
  payment: {
    amountCents: number;
    commerceOrderId: string;
    currency: string;
    donorEmail: string | null;
    donorName: string | null;
    donorOrganizationId: string | null;
    donorUserId: string | null;
    paidAt: Date | null;
    source: string;
    stripeChargeId: string | null;
    stripePaymentIntentId: string | null;
    targetId: string;
    taskId: string;
  },
) {
  const matches =
    payment.paidAt !== null &&
    receipt.intendedTask.id === payment.taskId &&
    receipt.contributor.donorEmail === payment.donorEmail &&
    receipt.contributor.donorName === payment.donorName &&
    receipt.contributor.donorOrganizationId === payment.donorOrganizationId &&
    receipt.contributor.donorUserId === payment.donorUserId &&
    receipt.payment.amountCents === payment.amountCents &&
    receipt.payment.commerceOrderId === payment.commerceOrderId &&
    receipt.payment.currency === payment.currency.toLowerCase() &&
    receipt.payment.paidAt === payment.paidAt.toISOString() &&
    receipt.payment.source === payment.source &&
    receipt.payment.stripeChargeId === payment.stripeChargeId &&
    receipt.payment.stripePaymentIntentId === payment.stripePaymentIntentId &&
    receipt.payment.targetId === payment.targetId;
  if (!matches) {
    throw new Error(
      "Contribution receipt payment facts do not match the funding ledger",
    );
  }
}

async function issueContributionReceiptInTransactionCore(
  input: z.infer<typeof IssueContributionReceiptInputSchema>,
  issuerUserId: string,
  tx: Prisma.TransactionClient,
  options: ContributionReceiptOptions,
  now: Date,
) {
  const ids = getContributionReceiptIds(input.paymentId);
  await lockTaskFundingPaymentInTransaction(input.paymentId, tx);
  const existing = await tx.taskExecutionArtifact.findUnique({
    where: { id: ids.artifactId },
    select: { contentHash: true, id: true, structuredResultJson: true },
  });
  if (existing) {
    const receiptTask = await tx.task.findFirst({
      where: { deletedAt: null, id: ids.taskId },
      select: { parentTaskId: true },
    });
    if (!receiptTask?.parentTaskId) {
      throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
    }
    const fundedTask = await tx.task.findFirst({
      where: { deletedAt: null, id: receiptTask.parentTaskId },
      select: { id: true, isPublic: true, ownerOrganizationId: true },
    });
    if (!fundedTask) throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
    await assertCanManageReceiptTask(fundedTask, issuerUserId, options);
    const receipt = ContributionReceiptV1Schema.parse(
      existing.structuredResultJson,
    );
    const payment = await tx.taskFundingPayment.findFirst({
      where: { deletedAt: null, id: input.paymentId },
      select: {
        amountCents: true,
        commerceOrderId: true,
        currency: true,
        donorEmail: true,
        donorName: true,
        donorOrganizationId: true,
        donorUserId: true,
        paidAt: true,
        source: true,
        stripeChargeId: true,
        stripePaymentIntentId: true,
        targetId: true,
        taskId: true,
      },
    });
    if (!payment) throw new Error("Contribution receipt identity conflict");
    assertContributionReceiptMatchesPaymentLedger(receipt, payment);
    if (receipt.intendedTask.id !== fundedTask.id) {
      throw new Error("Contribution receipt does not match funded task");
    }
    const expectedContentHash = await sha256CanonicalJson(receipt);
    if (receipt.payment.paymentId !== input.paymentId) {
      throw new Error("Contribution receipt identity conflict");
    }
    if (
      receipt.terms.termsDocument.revisionId !==
        input.termsDocumentRevisionId ||
      receipt.governingDocuments.length !==
        input.governingDocumentRevisionIds.length ||
      receipt.governingDocuments.some(
        (document, index) =>
          document.revisionId !== input.governingDocumentRevisionIds[index],
      )
    ) {
      throw new Error("Contribution receipt document binding conflict");
    }
    if (existing.contentHash !== expectedContentHash) {
      throw new Error("Contribution receipt content hash does not match");
    }
    return {
      contentHash: existing.contentHash,
      created: false,
      receipt,
      receiptArtifactId: existing.id,
      receiptTaskId: ids.taskId,
    };
  }

  const [issuer, payment] = await Promise.all([
    tx.user.findFirst({
      where: { deletedAt: null, id: issuerUserId },
      select: { id: true },
    }),
    tx.taskFundingPayment.findFirst({
      where: {
        deletedAt: null,
        id: input.paymentId,
        status: TaskFundingPaymentStatus.PAID,
      },
      select: {
        amountCents: true,
        commerceOrderId: true,
        currency: true,
        donorEmail: true,
        donorName: true,
        donorOrganizationId: true,
        donorUser: { select: { personId: true } },
        donorUserId: true,
        id: true,
        paidAt: true,
        source: true,
        stripeChargeId: true,
        stripePaymentIntentId: true,
        target: { select: { metadata: true, termsVersion: true } },
        targetId: true,
        task: {
          select: {
            currentImpactEstimateSet: {
              select: {
                assumptionsJson: true,
                calculationVersion: true,
                counterfactualKey: true,
                estimateKind: true,
                formulaText: true,
                frames: {
                  where: { deletedAt: null },
                  orderBy: [{ frameSlug: "asc" }],
                  select: {
                    adoptionRampYears: true,
                    annualDiscountRate: true,
                    benefitDurationYears: true,
                    delayDalysLostPerDayBase: true,
                    delayDalysLostPerDayHigh: true,
                    delayDalysLostPerDayLow: true,
                    delayEconomicValueUsdLostPerDayBase: true,
                    delayEconomicValueUsdLostPerDayHigh: true,
                    delayEconomicValueUsdLostPerDayLow: true,
                    estimatedCashCostUsdBase: true,
                    estimatedCashCostUsdHigh: true,
                    estimatedCashCostUsdLow: true,
                    estimatedEffortHoursBase: true,
                    estimatedEffortHoursHigh: true,
                    estimatedEffortHoursLow: true,
                    evaluationHorizonYears: true,
                    expectedDalysAvertedBase: true,
                    expectedDalysAvertedHigh: true,
                    expectedDalysAvertedLow: true,
                    expectedEconomicValueUsdBase: true,
                    expectedEconomicValueUsdHigh: true,
                    expectedEconomicValueUsdLow: true,
                    frameKey: true,
                    frameSlug: true,
                    medianHealthyLifeYearsEffectBase: true,
                    medianHealthyLifeYearsEffectHigh: true,
                    medianHealthyLifeYearsEffectLow: true,
                    medianIncomeGrowthEffectPpPerYearBase: true,
                    medianIncomeGrowthEffectPpPerYearHigh: true,
                    medianIncomeGrowthEffectPpPerYearLow: true,
                    metrics: {
                      where: { deletedAt: null },
                      orderBy: [{ metricKey: "asc" }],
                      select: {
                        baseValue: true,
                        highValue: true,
                        lowValue: true,
                        metadataJson: true,
                        metricKey: true,
                        unit: true,
                        valueJson: true,
                      },
                    },
                    successProbabilityBase: true,
                    successProbabilityHigh: true,
                    successProbabilityLow: true,
                    summaryStatsJson: true,
                    timeToImpactStartDays: true,
                  },
                },
                id: true,
                inputs: {
                  where: { deletedAt: null },
                  orderBy: [{ position: "asc" }],
                  select: {
                    parameterRevisionId: true,
                    position: true,
                    symbol: true,
                  },
                },
                methodologyKey: true,
                parameterSetHash: true,
                publicationStatus: true,
                sourceArtifacts: {
                  where: { deletedAt: null },
                  orderBy: [{ isPrimary: "desc" }, { sourceArtifactId: "asc" }],
                  select: {
                    isPrimary: true,
                    sourceArtifact: {
                      select: {
                        contentHash: true,
                        id: true,
                        sourceKey: true,
                      },
                    },
                  },
                },
                sourceSystem: true,
              },
            },
            id: true,
            isPublic: true,
            jurisdictionId: true,
            ownerOrganizationId: true,
            taskKey: true,
            title: true,
          },
        },
        taskId: true,
      },
    }),
  ]);
  if (!issuer) throw new Error("Receipt issuer not found");
  if (!payment || !payment.paidAt) {
    throw new Error("Paid task funding payment not found");
  }
  await assertCanManageReceiptTask(payment.task, issuerUserId, options);
  const requestedBinding = ContributionReceiptBindingV1Schema.parse({
    governingDocumentRevisionIds: input.governingDocumentRevisionIds,
    issuerUserId,
    schema: "optimitron.contribution-receipt-binding.v1",
    termsDocumentRevisionId: input.termsDocumentRevisionId,
  });
  const frozenBinding = requireContributionReceiptBinding(
    payment.target.metadata,
  );
  if (!sameContributionReceiptBinding(frozenBinding, requestedBinding)) {
    throw new Error(
      "Contribution receipt request does not match the frozen funding binding",
    );
  }
  const estimate = payment.task.currentImpactEstimateSet;
  if (!estimate) {
    throw new Error("Funded task has no current impact estimate to freeze");
  }

  const requestedRevisionIds = [
    ...new Set([
      input.termsDocumentRevisionId,
      ...input.governingDocumentRevisionIds,
    ]),
  ];
  const revisions = await tx.documentRevision.findMany({
    where: {
      deletedAt: null,
      document: { deletedAt: null },
      id: { in: requestedRevisionIds },
    },
    orderBy: [{ id: "asc" }],
    select: {
      contentHash: true,
      document: { select: { taskId: true } },
      documentId: true,
      id: true,
      title: true,
      version: true,
    },
  });
  if (revisions.length !== requestedRevisionIds.length) {
    throw new Error("One or more governing document revisions were not found");
  }
  await assertReceiptDocumentProvenance(
    tx,
    {
      actorUserId: issuerUserId,
      fundedTaskId: payment.task.id,
      governingRevisionIds: input.governingDocumentRevisionIds,
      revisions,
    },
    options,
  );
  const snapshotsById = new Map(
    revisions.map((revision) => [revision.id, documentSnapshot(revision)]),
  );
  const termsDocument = snapshotsById.get(input.termsDocumentRevisionId);
  if (!termsDocument) throw new Error("Terms document revision not found");

  const receipt = ContributionReceiptV1Schema.parse({
    contributor: {
      donorEmail: payment.donorEmail,
      donorName: payment.donorName,
      donorOrganizationId: payment.donorOrganizationId,
      donorUserId: payment.donorUserId,
    },
    eopMinted: false,
    governingDocuments: input.governingDocumentRevisionIds
      .map((revisionId) => snapshotsById.get(revisionId))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    impactEstimate: {
      assumptions: estimate.assumptionsJson,
      calculationVersion: estimate.calculationVersion,
      counterfactualKey: estimate.counterfactualKey,
      estimateKind: estimate.estimateKind,
      estimateSetId: estimate.id,
      formulaText: estimate.formulaText,
      frames: estimate.frames.map((frame) => ({
        frameKey: frame.frameKey,
        frameSlug: frame.frameSlug,
        metrics: frame.metrics.map((metric) => ({
          baseValue: metric.baseValue,
          highValue: metric.highValue,
          lowValue: metric.lowValue,
          metadata: metric.metadataJson,
          metricKey: metric.metricKey,
          unit: metric.unit,
          value: metric.valueJson,
        })),
        summary: frame.summaryStatsJson,
        values: impactValues(frame as unknown as Record<string, unknown>),
      })),
      methodologyKey: estimate.methodologyKey,
      parameterInputs: estimate.inputs,
      parameterSetHash: estimate.parameterSetHash,
      publicationStatus: estimate.publicationStatus,
      sourceArtifacts: estimate.sourceArtifacts.map((link) => ({
        contentHash: link.sourceArtifact.contentHash,
        isPrimary: link.isPrimary,
        sourceArtifactId: link.sourceArtifact.id,
        sourceKey: link.sourceArtifact.sourceKey,
      })),
      sourceSystem: estimate.sourceSystem,
    },
    impactRealized: false,
    intendedTask: {
      id: payment.task.id,
      taskKey: payment.task.taskKey,
      title: payment.task.title,
    },
    issuedAt: now.toISOString(),
    issuedByUserId: issuerUserId,
    payment: {
      amountCents: payment.amountCents,
      commerceOrderId: payment.commerceOrderId,
      currency: payment.currency.toLowerCase(),
      paidAt: payment.paidAt.toISOString(),
      paymentId: payment.id,
      source: payment.source,
      status: "PAID",
      stripeChargeId: payment.stripeChargeId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      targetId: payment.targetId,
    },
    schema: "optimitron.contribution-receipt.v1",
    taskCompleted: false,
    terms: {
      fundingTermsVersion: payment.target.termsVersion,
      termsDocument,
    },
  });
  const contentHash = await sha256CanonicalJson(receipt);

  await tx.task.create({
    data: {
      assigneeOrganizationId: payment.donorOrganizationId,
      assigneePersonId: payment.donorUser?.personId ?? null,
      category: "GOVERNANCE",
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      completedAt: null,
      createdByUserId: issuerUserId,
      description: `Immutable receipt for a contribution to "${payment.task.title}". The funded work is not complete, its modeled impact has not been realized, and no Earth Optimization Points were minted.`,
      id: ids.taskId,
      impactStatement:
        "This preserves what was funded without claiming that the work or impact already happened.",
      isPublic: false,
      jurisdictionId: payment.task.jurisdictionId,
      ownerOrganizationId: payment.task.ownerOrganizationId,
      parentTaskId: payment.task.id,
      status: TaskStatus.ACTIVE,
      taskKey: ids.taskKey,
      title: `Contribution receipt: ${payment.task.title}`,
    },
  });
  await tx.taskExecutionAttempt.create({
    data: {
      completedAt: now,
      executorKey: `user:${issuerUserId}`,
      executorKind: TaskCandidateKind.USER,
      executorUserId: issuerUserId,
      id: ids.attemptId,
      jurisdictionId: payment.task.jurisdictionId,
      outputSummary: "Issued immutable contribution receipt.",
      startedAt: now,
      status: TaskExecutionAttemptStatus.COMPLETED,
      taskId: ids.taskId,
    },
  });
  const artifact = await tx.taskExecutionArtifact.create({
    data: {
      contentHash,
      id: ids.artifactId,
      label: "Contribution receipt",
      metadataJson: jsonValue({
        paymentId: payment.id,
        schema: receipt.schema,
      }),
      structuredResultJson: jsonValue(receipt),
      submittedByUserId: issuerUserId,
      taskExecutionAttemptId: ids.attemptId,
    },
    select: { contentHash: true, id: true },
  });
  await tx.taskVerification.create({
    data: {
      acceptanceCriteriaSnapshotJson: jsonValue({
        criteria: [
          "Payment was recorded as paid",
          "Terms and governing document revisions were pinned by content hash",
          "The current impact estimate version was copied into the receipt",
          "The receipt does not claim completed work, realized impact, or minted EOP",
        ],
        schema: receipt.schema,
      }),
      completedAt: now,
      criterionResultsJson: jsonValue([
        { criterion: "payment-paid", passed: true },
        { criterion: "documents-pinned", passed: true },
        { criterion: "impact-estimate-pinned", passed: true },
        { criterion: "no-premature-outcomes", passed: true },
      ]),
      evidenceJson: jsonValue({ artifactIds: [artifact.id] }),
      id: ids.verificationId,
      method: TaskVerificationMethod.DETERMINISTIC,
      result: TaskVerificationResult.ACCEPTED,
      reviewerUserId: issuerUserId,
      ruleKey: "optimitron.contribution-receipt.v1",
      ruleVersion: "1",
      selfReviewed: true,
      taskExecutionAttemptId: ids.attemptId,
    },
  });
  await tx.task.update({
    where: { id: ids.taskId },
    data: {
      completedAt: now,
      status: TaskStatus.VERIFIED,
      verifiedAt: now,
      verifiedByUserId: issuerUserId,
    },
  });

  return {
    contentHash,
    created: true,
    receipt,
    receiptArtifactId: artifact.id,
    receiptTaskId: ids.taskId,
  };
}

export async function issueContributionReceiptInTransaction(
  rawInput: unknown,
  actorUserId: string,
  tx: Prisma.TransactionClient,
  options: Omit<ContributionReceiptOptions, "db"> = {},
) {
  const input = IssueContributionReceiptInputSchema.parse(rawInput);
  const issuerUserId = IdSchema.parse(actorUserId);
  return issueContributionReceiptInTransactionCore(
    input,
    issuerUserId,
    tx,
    options,
    options.now ?? new Date(),
  );
}

export async function issueContributionReceipt(
  rawInput: unknown,
  actorUserId: string,
  options: ContributionReceiptOptions = {},
) {
  const input = IssueContributionReceiptInputSchema.parse(rawInput);
  const issuerUserId = IdSchema.parse(actorUserId);
  const now = options.now ?? new Date();
  const db = options.db ?? prisma;

  return db.$transaction((tx) =>
    issueContributionReceiptInTransactionCore(
      input,
      issuerUserId,
      tx,
      options,
      now,
    ),
  );
}

/**
 * Settlement-only entrypoint. The binding is read from the funding target in
 * the same transaction that marks the payment PAID, so a missing or invalid
 * binding rolls the payment state transition back.
 */
export async function issuePaidContributionReceiptInTransaction(
  paymentId: string,
  tx: Prisma.TransactionClient,
  options: Omit<ContributionReceiptOptions, "db"> = {},
) {
  const normalizedPaymentId = IdSchema.parse(paymentId);
  const payment = await tx.taskFundingPayment.findFirst({
    where: { deletedAt: null, id: normalizedPaymentId },
    select: { target: { select: { metadata: true } } },
  });
  if (!payment) throw new Error("Task funding payment not found");
  const binding = requireContributionReceiptBinding(payment.target.metadata);
  return issueContributionReceiptInTransaction(
    {
      governingDocumentRevisionIds: binding.governingDocumentRevisionIds,
      paymentId: normalizedPaymentId,
      termsDocumentRevisionId: binding.termsDocumentRevisionId,
    },
    binding.issuerUserId,
    tx,
    options,
  );
}

export async function appendContributionOutcomeAddendum(
  rawInput: unknown,
  actorUserId: string,
  options: ContributionReceiptOptions = {},
) {
  const input = AppendContributionOutcomeAddendumInputSchema.parse(rawInput);
  const recorderUserId = IdSchema.parse(actorUserId);
  const ids = getContributionReceiptIds(input.paymentId);
  const now = options.now ?? new Date();
  const db = options.db ?? prisma;
  const idempotencyHash = await sha256CanonicalJson(input.idempotencyKey);
  const requestHash = await sha256CanonicalJson({
    ...input,
    actorUserId: recorderUserId,
    observedAt: input.observedAt.toISOString(),
  });
  const addendumArtifactId = `task-funding-addendum:${input.paymentId}:${idempotencyHash.slice(-32)}`;

  return db.$transaction(async (tx) => {
    const existing = await tx.taskExecutionArtifact.findUnique({
      where: { id: addendumArtifactId },
      select: {
        contentHash: true,
        id: true,
        metadataJson: true,
        structuredResultJson: true,
      },
    });
    const [recorder, receiptArtifact, payment] = await Promise.all([
      tx.user.findFirst({
        where: { deletedAt: null, id: recorderUserId },
        select: { id: true },
      }),
      tx.taskExecutionArtifact.findUnique({
        where: { id: ids.artifactId },
        select: {
          contentHash: true,
          id: true,
          structuredResultJson: true,
          taskExecutionAttemptId: true,
        },
      }),
      tx.taskFundingPayment.findFirst({
        where: { deletedAt: null, id: input.paymentId },
        select: {
          id: true,
          status: true,
          task: {
            select: {
              id: true,
              isPublic: true,
              ownerOrganizationId: true,
              status: true,
            },
          },
        },
      }),
    ]);
    if (!recorder) throw new Error("Addendum recorder not found");
    if (!receiptArtifact) throw new Error("Contribution receipt not found");
    if (!payment) throw new Error("Task funding payment not found");
    await assertCanManageReceiptTask(payment.task, recorderUserId, options);

    const receipt = ContributionReceiptV1Schema.parse(
      receiptArtifact.structuredResultJson,
    );
    const receiptHash = await sha256CanonicalJson(receipt);
    if (receiptHash !== receiptArtifact.contentHash) {
      throw new Error("Contribution receipt content hash does not match");
    }
    if (receipt.payment.paymentId !== payment.id) {
      throw new Error("Contribution receipt does not match payment");
    }
    if (existing) {
      const metadata = z
        .object({ requestHash: ContentHashSchema })
        .passthrough()
        .parse(existing.metadataJson);
      if (metadata.requestHash !== requestHash) {
        throw new Error("Outcome addendum idempotency key was reused");
      }
      const addendum = OutcomeAddendumV1Schema.parse(
        existing.structuredResultJson,
      );
      const existingContentHash = await sha256CanonicalJson(addendum);
      if (existing.contentHash !== existingContentHash) {
        throw new Error("Outcome addendum content hash does not match");
      }
      return {
        addendum,
        addendumArtifactId: existing.id,
        contentHash: existing.contentHash,
        created: false,
      };
    }
    if (input.taskCompleted && payment.task.status !== TaskStatus.VERIFIED) {
      throw new Error("Funded task has not been verified");
    }
    if (
      input.kind === "REFUND" &&
      payment.status !== TaskFundingPaymentStatus.REFUNDED
    ) {
      throw new Error("Task funding payment has not been refunded");
    }
    if (input.correctsArtifactId) {
      const corrected = await tx.taskExecutionArtifact.findFirst({
        where: {
          deletedAt: null,
          id: input.correctsArtifactId,
          taskExecutionAttemptId: receiptArtifact.taskExecutionAttemptId,
        },
        select: { id: true },
      });
      if (!corrected) {
        throw new Error("Corrected receipt artifact was not found");
      }
    }

    const addendum = OutcomeAddendumV1Schema.parse({
      correctsArtifactId: input.correctsArtifactId ?? null,
      eopMinted: false,
      evidence: input.evidence,
      idempotencyKey: input.idempotencyKey,
      impactRealized: input.impactRealized,
      kind: input.kind,
      observedAt: input.observedAt.toISOString(),
      paymentId: payment.id,
      paymentStatusAtObservation: payment.status,
      receiptArtifactId: receiptArtifact.id,
      receiptContentHash: receiptArtifact.contentHash,
      recordedAt: now.toISOString(),
      recordedByUserId: recorderUserId,
      schema: "optimitron.outcome-addendum.v1",
      summary: input.summary,
      taskCompleted: input.taskCompleted,
    });
    const contentHash = await sha256CanonicalJson(addendum);
    const artifact = await tx.taskExecutionArtifact.create({
      data: {
        contentHash,
        id: addendumArtifactId,
        label: "Contribution outcome addendum",
        metadataJson: jsonValue({
          idempotencyKey: input.idempotencyKey,
          kind: addendum.kind,
          paymentId: payment.id,
          requestHash,
          schema: addendum.schema,
        }),
        structuredResultJson: jsonValue(addendum),
        submittedByUserId: recorderUserId,
        taskExecutionAttemptId: receiptArtifact.taskExecutionAttemptId,
      },
      select: { id: true },
    });

    return {
      addendum,
      addendumArtifactId: artifact.id,
      contentHash,
      created: true,
    };
  });
}

/**
 * Returns the immutable receipt thread to either its assigned donor or a
 * manager of the funded task. Denials deliberately look like missing data.
 */
export async function getContributionReceiptForViewer(
  paymentId: string,
  actorUserId: string,
  options: ContributionReceiptOptions = {},
) {
  const viewerUserId = IdSchema.parse(actorUserId);
  const ids = getContributionReceiptIds(paymentId);
  const db = options.db ?? prisma;

  const [receiptTask, receiptArtifact] = await Promise.all([
    db.task.findFirst({
      where: { deletedAt: null, id: ids.taskId },
      select: {
        createdAt: true,
        description: true,
        id: true,
        isPublic: true,
        ownerOrganizationId: true,
        parentTaskId: true,
        status: true,
        title: true,
        verifiedAt: true,
      },
    }),
    db.taskExecutionArtifact.findUnique({
      where: { id: ids.artifactId },
      select: {
        contentHash: true,
        createdAt: true,
        deletedAt: true,
        id: true,
        structuredResultJson: true,
        taskExecutionAttemptId: true,
      },
    }),
  ]);
  if (!receiptTask || !receiptArtifact || receiptArtifact.deletedAt) {
    throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  }
  if (
    options.clientAccessBoundary &&
    !isTaskWithinClientAccessBoundary(receiptTask, options.clientAccessBoundary)
  ) {
    throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  }

  const canView = options.canViewTask ?? canUserViewTask;
  const canManage = options.canManageTask ?? canUserManageTask;
  const [canViewReceipt, canManageFundedTask] = await Promise.all([
    canView(receiptTask.id, viewerUserId),
    receiptTask.parentTaskId
      ? canManage(receiptTask.parentTaskId, viewerUserId)
      : Promise.resolve(false),
  ]);
  if (!canViewReceipt && !canManageFundedTask) {
    throw new Error(RECEIPT_NOT_FOUND_MESSAGE);
  }

  const receipt = ContributionReceiptV1Schema.parse(
    receiptArtifact.structuredResultJson,
  );
  if (
    receipt.payment.paymentId !== paymentId ||
    receipt.intendedTask.id !== receiptTask.parentTaskId
  ) {
    throw new Error("Contribution receipt provenance does not match");
  }
  const receiptContentHash = await sha256CanonicalJson(receipt);
  if (receiptArtifact.contentHash !== receiptContentHash) {
    throw new Error("Contribution receipt content hash does not match");
  }

  const addendumArtifacts = await db.taskExecutionArtifact.findMany({
    where: {
      deletedAt: null,
      id: { not: receiptArtifact.id },
      taskExecutionAttemptId: receiptArtifact.taskExecutionAttemptId,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      contentHash: true,
      createdAt: true,
      id: true,
      structuredResultJson: true,
    },
  });
  const addenda = await Promise.all(
    addendumArtifacts.map(async (artifact) => {
      const addendum = OutcomeAddendumV1Schema.parse(
        artifact.structuredResultJson,
      );
      if (
        addendum.paymentId !== receipt.payment.paymentId ||
        addendum.receiptArtifactId !== receiptArtifact.id ||
        addendum.receiptContentHash !== receiptArtifact.contentHash
      ) {
        throw new Error("Outcome addendum does not match contribution receipt");
      }
      const contentHash = await sha256CanonicalJson(addendum);
      if (artifact.contentHash !== contentHash) {
        throw new Error("Outcome addendum content hash does not match");
      }
      return {
        addendum,
        artifactId: artifact.id,
        contentHash: artifact.contentHash,
        createdAt: artifact.createdAt,
      };
    }),
  );

  return {
    addenda,
    receipt,
    receiptArtifact: {
      contentHash: receiptArtifact.contentHash,
      createdAt: receiptArtifact.createdAt,
      id: receiptArtifact.id,
    },
    receiptTask,
  };
}
