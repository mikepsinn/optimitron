import { TaskFundingPaymentStatus, TaskStatus } from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { describe, expect, it, vi } from "vitest";
import {
  appendContributionOutcomeAddendum,
  configureContributionReceiptBindingInTransaction,
  getContributionReceiptIds,
  getContributionReceiptForViewer,
  issueContributionReceipt,
  issueContributionReceiptInTransaction,
  issuePaidContributionReceiptInTransaction,
  readContributionReceiptBinding,
  resolveContributionReceiptBinding,
} from "../contribution-receipts.server";

function buildFixture() {
  const artifacts = new Map<string, Record<string, unknown>>();
  const createdTasks: Array<Record<string, unknown>> = [];
  const taskUpdates: Array<Record<string, unknown>> = [];
  const attempts: Array<Record<string, unknown>> = [];
  const verifications: Array<Record<string, unknown>> = [];
  const payment = {
    amountCents: 25_000,
    commerceOrderId: "order_1",
    currency: "usd",
    donorEmail: "person@example.com",
    donorName: "Example Person",
    donorOrganizationId: null,
    donorUser: { personId: "person_1" },
    donorUserId: "donor_user_1",
    id: "payment_1",
    paidAt: new Date("2026-07-20T12:00:00.000Z"),
    source: "CHECKOUT",
    status: TaskFundingPaymentStatus.PAID,
    stripeChargeId: "ch_1",
    stripePaymentIntentId: "pi_1",
    target: {
      metadata: {
        contributionReceipt: {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          issuerUserId: "issuer_1",
          schema: "optimitron.contribution-receipt-binding.v1",
          termsDocumentRevisionId: "revision_terms",
        },
      },
      termsVersion: "terms-v1",
    },
    targetId: "target_1",
    task: {
      currentImpactEstimateSet: {
        assumptionsJson: { attribution: "marginal" },
        calculationVersion: "impact-v1",
        counterfactualKey: "no-funded-work",
        estimateKind: "EX_ANTE",
        formulaText: "probability * benefit",
        frames: [
          {
            adoptionRampYears: 1,
            annualDiscountRate: 0.03,
            benefitDurationYears: 5,
            delayDalysLostPerDayBase: null,
            delayDalysLostPerDayHigh: null,
            delayDalysLostPerDayLow: null,
            delayEconomicValueUsdLostPerDayBase: null,
            delayEconomicValueUsdLostPerDayHigh: null,
            delayEconomicValueUsdLostPerDayLow: null,
            estimatedCashCostUsdBase: 250,
            estimatedCashCostUsdHigh: 300,
            estimatedCashCostUsdLow: 200,
            estimatedEffortHoursBase: 10,
            estimatedEffortHoursHigh: 12,
            estimatedEffortHoursLow: 8,
            evaluationHorizonYears: 5,
            expectedDalysAvertedBase: 2,
            expectedDalysAvertedHigh: 3,
            expectedDalysAvertedLow: 1,
            expectedEconomicValueUsdBase: 1_000,
            expectedEconomicValueUsdHigh: 1_500,
            expectedEconomicValueUsdLow: 500,
            frameKey: "CUSTOM",
            frameSlug: "five-year",
            medianHealthyLifeYearsEffectBase: null,
            medianHealthyLifeYearsEffectHigh: null,
            medianHealthyLifeYearsEffectLow: null,
            medianIncomeGrowthEffectPpPerYearBase: null,
            medianIncomeGrowthEffectPpPerYearHigh: null,
            medianIncomeGrowthEffectPpPerYearLow: null,
            metrics: [],
            successProbabilityBase: 0.5,
            successProbabilityHigh: 0.7,
            successProbabilityLow: 0.3,
            summaryStatsJson: null,
            timeToImpactStartDays: 30,
          },
        ],
        id: "impact_set_1",
        inputs: [
          { parameterRevisionId: "parameter_1", position: 0, symbol: "p" },
        ],
        methodologyKey: "expected-impact",
        parameterSetHash: "sha256:parameters",
        publicationStatus: "PUBLISHED",
        sourceArtifacts: [
          {
            isPrimary: true,
            sourceArtifact: {
              contentHash: "sha256:source",
              id: "source_1",
              sourceKey: "source:one",
            },
          },
        ],
        sourceSystem: "MANUAL",
      },
      contextJson: {},
      fundingTarget: null as null | { id: string; metadata: unknown },
      id: "funded_task_1",
      isPublic: true,
      jurisdictionId: null,
      ownerOrganizationId: "org_1",
      status: TaskStatus.ACTIVE as (typeof TaskStatus)[keyof typeof TaskStatus],
      taskKey: "work:one",
      title: "Complete useful work",
    },
    taskId: "funded_task_1",
  };
  const revisions = [
    {
      contentHash: "sha256:terms",
      document: { taskId: "funded_task_1" },
      documentId: "document_terms",
      id: "revision_terms",
      title: "Funding terms",
      version: 2,
    },
    {
      contentHash: "sha256:authority",
      document: { taskId: "funded_task_1" },
      documentId: "document_authority",
      id: "revision_authority",
      title: "Authority",
      version: 1,
    },
  ];

  const tx = {
    $executeRaw: vi.fn(async () => 1),
    $queryRaw: vi.fn(async () => [{ id: payment.id }]),
    document: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
        revisions
          .filter((revision) => where.id.in.includes(revision.documentId))
          .map((revision) => ({
            accessGrants: [],
            createdByUserId: "issuer_1",
            id: revision.documentId,
            organizationId: null,
            parentDocumentId: null,
            task: { isPublic: true },
            visibility: "PRIVATE",
          })),
      ),
    },
    documentRevision: {
      findMany: vi.fn(async () => revisions),
    },
    organizationMember: {
      findMany: vi.fn(async () => []),
    },
    task: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        createdTasks.push(data);
        return data;
      }),
      findFirst: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === payment.task.id) return payment.task;
        const created = createdTasks.find((task) => task.id === where.id);
        if (!created) return null;
        const update = taskUpdates.at(-1);
        return {
          ...created,
          createdAt: new Date("2026-07-21T12:00:00.000Z"),
          verifiedAt: update?.verifiedAt ?? null,
        };
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        taskUpdates.push(data);
        return data;
      }),
    },
    taskExecutionArtifact: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const stored = {
          ...data,
          createdAt: new Date("2026-07-21T12:00:00.000Z"),
          deletedAt: null,
        };
        artifacts.set(data.id as string, stored);
        return { contentHash: data.contentHash, id: data.id };
      }),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          const stored = artifacts.get(where.id as string);
          if (!stored) return null;
          if (
            where.taskExecutionAttemptId &&
            stored.taskExecutionAttemptId !== where.taskExecutionAttemptId
          ) {
            return null;
          }
          return stored;
        },
      ),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          artifacts.get(where.id) ?? null,
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const excludedId = (where.id as { not?: string } | undefined)?.not;
        return [...artifacts.values()].filter(
          (artifact) =>
            artifact.id !== excludedId &&
            artifact.taskExecutionAttemptId === where.taskExecutionAttemptId &&
            !artifact.deletedAt,
        );
      }),
    },
    taskExecutionAttempt: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        attempts.push(data);
        return data;
      }),
      findMany: vi.fn(async () =>
        Promise.all(
          revisions.map(async (revision) => {
            const decision = {
              acceptedReviewArtifactIds: [`accepted-review:${revision.id}`],
              adoptedDocument: {
                contentHash: revision.contentHash,
                documentId: revision.documentId,
                revisionId: revision.id,
                version: revision.version,
              },
              authorityTaskId: payment.task.id,
              decidedAt: "2026-07-20T10:00:00.000Z",
              decidedByUserId: "issuer_1",
              schema: "optimitron.document-decision.v1",
              waivers: [],
            };
            return {
              artifacts: [
                {
                  contentHash: await sha256CanonicalJson(decision),
                  metadataJson: { kind: "document-decision" },
                  structuredResultJson: decision,
                  submittedByUserId: "issuer_1",
                },
              ],
              executorUserId: "issuer_1",
              metadata: { kind: "document-decision" },
            };
          }),
        ),
      ),
    },
    taskFundingPayment: {
      findFirst: vi.fn(async () => payment),
    },
    taskFundingTarget: {
      update: vi.fn(
        async ({ data }: { data: Record<string, unknown> }) => data,
      ),
    },
    taskVerification: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        verifications.push(data);
        return data;
      }),
    },
    user: {
      findFirst: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          where.id === "donor_user_1" || where.id === "same_person_user"
            ? { id: where.id, personId: "person_1" }
            : where.id === "reassigned_user"
              ? { id: where.id, personId: "person_2" }
            : { id: where.id, personId: null },
      ),
    },
  };
  const db = {
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
    task: tx.task,
    taskExecutionArtifact: tx.taskExecutionArtifact,
    user: tx.user,
  };

  const canManageTask = vi.fn(async () => true);

  return {
    artifacts,
    attempts,
    createdTasks,
    canManageTask,
    db,
    payment,
    revisions,
    taskUpdates,
    tx,
    verifications,
  };
}

describe("issueContributionReceipt", () => {
  it("reads only a complete immutable funding-target receipt binding", () => {
    expect(
      readContributionReceiptBinding({
        contributionReceipt: {
          governingDocumentRevisionIds: ["revision_terms"],
          issuerUserId: "issuer_1",
          schema: "optimitron.contribution-receipt-binding.v1",
          termsDocumentRevisionId: "revision_terms",
        },
      }),
    ).toMatchObject({ issuerUserId: "issuer_1" });
    expect(
      readContributionReceiptBinding({
        contributionReceipt: {
          governingDocumentRevisionIds: ["revision_authority"],
          issuerUserId: "issuer_1",
          schema: "optimitron.contribution-receipt-binding.v1",
          termsDocumentRevisionId: "revision_terms",
        },
      }),
    ).toBeNull();
  });

  it("uses a pending adopted binding until the first funding target copies it", () => {
    const pending = {
      contributionReceipt: {
        governingDocumentRevisionIds: ["revision_terms"],
        issuerUserId: "issuer_1",
        schema: "optimitron.contribution-receipt-binding.v1" as const,
        termsDocumentRevisionId: "revision_terms",
      },
    };
    const frozen = {
      contributionReceipt: {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        issuerUserId: "issuer_2",
        schema: "optimitron.contribution-receipt-binding.v1" as const,
        termsDocumentRevisionId: "revision_terms",
      },
    };

    expect(resolveContributionReceiptBinding(null, pending)).toMatchObject({
      issuerUserId: "issuer_1",
    });
    expect(resolveContributionReceiptBinding(frozen, pending)).toMatchObject({
      governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
      issuerUserId: "issuer_2",
    });
  });

  it("freezes adopted funding terms before a funding target exists", async () => {
    const fixture = buildFixture();

    const binding = await configureContributionReceiptBindingInTransaction(
      {
        governingDocumentRevisionIds: ["revision_terms", "revision_authority"],
        taskId: "funded_task_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      fixture.tx as never,
      { canManageTask: fixture.canManageTask },
    );

    expect(binding).toMatchObject({
      governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
      issuerUserId: "issuer_1",
      termsDocumentRevisionId: "revision_terms",
    });
    expect(fixture.taskUpdates.at(-1)).toMatchObject({
      contextJson: { contributionReceipt: binding },
    });
  });

  it("refuses to configure a first binding after a legacy target has a payment", async () => {
    const fixture = buildFixture();
    fixture.payment.task.fundingTarget = {
      id: "target_legacy_paid",
      metadata: {},
    };

    await expect(
      configureContributionReceiptBindingInTransaction(
        {
          governingDocumentRevisionIds: [
            "revision_terms",
            "revision_authority",
          ],
          taskId: "funded_task_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        fixture.tx as never,
        { canManageTask: fixture.canManageTask },
      ),
    ).rejects.toThrow(
      "target with existing payments cannot receive its first receipt binding",
    );
    expect(fixture.tx.taskFundingTarget.update).not.toHaveBeenCalled();
    expect(fixture.taskUpdates).toEqual([]);
  });

  it("freezes the paid contribution, documents, and impact estimate once", async () => {
    const fixture = buildFixture();
    const now = new Date("2026-07-21T12:00:00.000Z");
    const input = {
      governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
      paymentId: "payment_1",
      termsDocumentRevisionId: "revision_terms",
    };

    const first = await issueContributionReceipt(input, "issuer_1", {
      canManageTask: fixture.canManageTask,
      db: fixture.db as never,
      now,
    });
    const second = await issueContributionReceipt(input, "issuer_1", {
      canManageTask: fixture.canManageTask,
      db: fixture.db as never,
      now: new Date("2026-07-22T12:00:00.000Z"),
    });

    expect(first.created).toBe(true);
    expect(second).toMatchObject({
      contentHash: first.contentHash,
      created: false,
      receiptArtifactId: first.receiptArtifactId,
    });
    expect(first.receipt).toMatchObject({
      eopMinted: false,
      impactEstimate: {
        calculationVersion: "impact-v1",
        estimateSetId: "impact_set_1",
        parameterSetHash: "sha256:parameters",
      },
      impactRealized: false,
      payment: {
        amountCents: 25_000,
        paymentId: "payment_1",
        status: "PAID",
      },
      taskCompleted: false,
      terms: {
        fundingTermsVersion: "terms-v1",
        termsDocument: { revisionId: "revision_terms" },
      },
    });
    expect(fixture.createdTasks).toHaveLength(1);
    expect(fixture.createdTasks[0]).toMatchObject({
      assigneePersonId: "person_1",
      id: "task-funding-receipt:payment_1",
      isPublic: false,
      parentTaskId: "funded_task_1",
      status: TaskStatus.ACTIVE,
    });
    expect(fixture.attempts).toHaveLength(1);
    expect(fixture.verifications).toHaveLength(1);
    expect(fixture.taskUpdates).toEqual([
      expect.objectContaining({ status: TaskStatus.VERIFIED }),
    ]);
  });

  it("can create the receipt inside an existing payment transaction", async () => {
    const fixture = buildFixture();
    const direct = await issueContributionReceiptInTransaction(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      fixture.tx as never,
      { canManageTask: fixture.canManageTask },
    );

    expect(direct.created).toBe(true);
    expect(fixture.artifacts.has(direct.receiptArtifactId)).toBe(true);
  });

  it("issues from the frozen funding-target binding inside settlement", async () => {
    const fixture = buildFixture();
    const result = await issuePaidContributionReceiptInTransaction(
      "payment_1",
      fixture.tx as never,
      { canManageTask: fixture.canManageTask },
    );

    expect(result.created).toBe(true);
    expect(
      result.receipt.governingDocuments.map((row) => row.revisionId),
    ).toEqual(["revision_authority", "revision_terms"]);
  });

  it("rejects a first receipt whose governing revisions bypass the frozen target binding", async () => {
    const fixture = buildFixture();

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: ["revision_terms"],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("does not match the frozen funding binding");
    expect(fixture.artifacts.size).toBe(0);
  });

  it("rejects a first receipt issued by a manager other than the frozen issuer", async () => {
    const fixture = buildFixture();
    const metadata = fixture.payment.target.metadata as {
      contributionReceipt: { issuerUserId: string };
    };
    metadata.contributionReceipt.issuerUserId = "issuer_2";

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("does not match the frozen funding binding");
    expect(fixture.artifacts.size).toBe(0);
  });

  it("fails closed when a legacy paid target has no frozen receipt binding", async () => {
    const fixture = buildFixture();
    fixture.payment.target.metadata = {} as never;

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow(
      "requires adopted terms and governing document revisions before payment",
    );
    expect(fixture.artifacts.size).toBe(0);
  });

  it("detects paid timestamp drift between an immutable receipt and its ledger row", async () => {
    const fixture = buildFixture();
    const input = {
      governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
      paymentId: "payment_1",
      termsDocumentRevisionId: "revision_terms",
    };
    await issueContributionReceipt(input, "issuer_1", {
      canManageTask: fixture.canManageTask,
      db: fixture.db as never,
    });
    fixture.payment.paidAt = new Date("2026-07-23T12:00:00.000Z");

    await expect(
      issueContributionReceipt(input, "issuer_1", {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      }),
    ).rejects.toThrow("payment facts do not match the funding ledger");
  });

  it("rejects arbitrary document revisions that are not attached to the funded task", async () => {
    const fixture = buildFixture();
    fixture.tx.documentRevision.findMany.mockResolvedValueOnce([
      {
        ...fixture.revisions[0],
        document: { taskId: "unrelated_private_task" },
      },
      ...fixture.revisions.slice(1),
    ] as never);

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("not attached to the funded task");
  });

  it("requires exact adoption provenance for every governing revision", async () => {
    const fixture = buildFixture();
    fixture.tx.taskExecutionAttempt.findMany.mockResolvedValueOnce([]);

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("no valid adoption decision");
  });

  it("requires the issuer to be able to access every pinned document", async () => {
    const fixture = buildFixture();

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
          resolveDocumentAccessBatch: vi.fn(
            async (documentIds: string[]) =>
              new Map(documentIds.map((id) => [id, null])),
          ) as never,
        },
      ),
    ).rejects.toThrow("not accessible");
  });

  it("refuses to issue a receipt without a pinned current impact estimate", async () => {
    const fixture = buildFixture();
    fixture.payment.task.currentImpactEstimateSet = null as never;

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("no current impact estimate");
    expect(fixture.artifacts.size).toBe(0);
  });

  it("requires management access to the funded task", async () => {
    const fixture = buildFixture();

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: vi.fn(async () => false),
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Task funding receipt not found");
    expect(fixture.artifacts.size).toBe(0);
  });

  it("enforces the OAuth client's private-task boundary", async () => {
    const fixture = buildFixture();
    fixture.payment.task.isPublic = false;

    await expect(
      issueContributionReceipt(
        {
          governingDocumentRevisionIds: [
            "revision_authority",
            "revision_terms",
          ],
          paymentId: "payment_1",
          termsDocumentRevisionId: "revision_terms",
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          clientAccessBoundary: {
            allowPersonalPrivate: false,
            organizationIds: ["another_org"],
          },
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Task funding receipt not found");
    expect(fixture.canManageTask).not.toHaveBeenCalled();
    expect(fixture.artifacts.size).toBe(0);
  });
});

describe("appendContributionOutcomeAddendum", () => {
  it("appends outcome evidence without changing the original receipt", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );
    fixture.payment.task.status = TaskStatus.VERIFIED;
    const receiptId = getContributionReceiptIds("payment_1").artifactId;
    const original = structuredClone(fixture.artifacts.get(receiptId));

    const first = await appendContributionOutcomeAddendum(
      {
        evidence: [{ note: "Accepted verification on the funded task." }],
        idempotencyKey: "task-completed-v1",
        impactRealized: false,
        kind: "TASK_COMPLETED",
        observedAt: "2026-07-25T12:00:00.000Z",
        paymentId: "payment_1",
        summary: "The funded task was verified.",
        taskCompleted: true,
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );
    const second = await appendContributionOutcomeAddendum(
      {
        evidence: [{ note: "Accepted verification on the funded task." }],
        idempotencyKey: "task-completed-v1",
        impactRealized: false,
        kind: "TASK_COMPLETED",
        observedAt: "2026-07-25T12:00:00.000Z",
        paymentId: "payment_1",
        summary: "The funded task was verified.",
        taskCompleted: true,
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(first.addendum).toMatchObject({
      eopMinted: false,
      impactRealized: false,
      kind: "TASK_COMPLETED",
      receiptArtifactId: receiptId,
      taskCompleted: true,
    });
    expect(fixture.artifacts.get(receiptId)).toEqual(original);
    expect(fixture.artifacts.size).toBe(2);

    await expect(
      appendContributionOutcomeAddendum(
        {
          evidence: [{ note: "Accepted verification on the funded task." }],
          idempotencyKey: "task-completed-v1",
          impactRealized: false,
          kind: "TASK_COMPLETED",
          observedAt: "2026-07-25T12:00:00.000Z",
          paymentId: "payment_1",
          summary: "A different payload must not reuse the same key.",
          taskCompleted: true,
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("idempotency key was reused");
  });

  it("requires the payment ledger to show a refund before appending one", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    await expect(
      appendContributionOutcomeAddendum(
        {
          idempotencyKey: "refund-v1",
          impactRealized: false,
          kind: "REFUND",
          observedAt: "2026-07-25T12:00:00.000Z",
          paymentId: "payment_1",
          summary: "Payment refunded.",
          taskCompleted: false,
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("has not been refunded");
  });

  it("requires VERIFIED work whenever any addendum asserts task completion", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    await expect(
      appendContributionOutcomeAddendum(
        {
          evidence: [{ note: "Measured outcome evidence." }],
          idempotencyKey: "impact-with-completion-v1",
          impactRealized: true,
          kind: "IMPACT_OBSERVED",
          observedAt: "2026-07-25T12:00:00.000Z",
          paymentId: "payment_1",
          summary: "Impact was measured after claimed completion.",
          taskCompleted: true,
        },
        "issuer_1",
        {
          canManageTask: fixture.canManageTask,
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Funded task has not been verified");
  });

  it.each(["REFUND", "CORRECTION"] as const)(
    "does not let a %s addendum assert completion",
    async (kind) => {
      const fixture = buildFixture();
      await expect(
        appendContributionOutcomeAddendum(
          {
            correctsArtifactId:
              kind === "CORRECTION"
                ? getContributionReceiptIds("payment_1").artifactId
                : undefined,
            idempotencyKey: `${kind.toLowerCase()}-false-completion-v1`,
            impactRealized: false,
            kind,
            observedAt: "2026-07-25T12:00:00.000Z",
            paymentId: "payment_1",
            summary: "This ledger event is not completion evidence.",
            taskCompleted: true,
          },
          "issuer_1",
          {
            canManageTask: fixture.canManageTask,
            db: fixture.db as never,
          },
        ),
      ).rejects.toThrow(
        "Refund and correction addenda cannot assert that work was completed",
      );
    },
  );

  it("does not allow a non-manager to append an outcome", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    await expect(
      appendContributionOutcomeAddendum(
        {
          idempotencyKey: "unauthorized-correction",
          impactRealized: false,
          kind: "CORRECTION",
          correctsArtifactId: getContributionReceiptIds("payment_1").artifactId,
          observedAt: "2026-07-25T12:00:00.000Z",
          paymentId: "payment_1",
          summary: "This actor must not be able to append it.",
          taskCompleted: false,
        },
        "other_user",
        {
          canManageTask: vi.fn(async () => false),
          db: fixture.db as never,
        },
      ),
    ).rejects.toThrow("Task funding receipt not found");
    expect(fixture.artifacts.size).toBe(1);
  });
});

describe("getContributionReceiptForViewer", () => {
  it("returns the immutable receipt and addenda to its donor or a task manager", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );
    await appendContributionOutcomeAddendum(
      {
        evidence: [{ note: "Observed outcome source." }],
        idempotencyKey: "impact-observed-v1",
        impactRealized: true,
        kind: "IMPACT_OBSERVED",
        observedAt: "2026-07-25T12:00:00.000Z",
        paymentId: "payment_1",
        summary: "An outcome was measured after the funded work.",
        taskCompleted: false,
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    const donorView = await getContributionReceiptForViewer(
      "payment_1",
      "donor_user_1",
      {
        canManageTask: vi.fn(async () => false),
        db: fixture.db as never,
      },
    );
    const managerView = await getContributionReceiptForViewer(
      "payment_1",
      "manager_user_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    expect(donorView.receipt.payment.paymentId).toBe("payment_1");
    expect(donorView.receiptTask).toMatchObject({
      id: "task-funding-receipt:payment_1",
      isPublic: false,
    });
    expect(donorView.addenda).toHaveLength(1);
    expect(donorView.addenda[0]?.addendum.kind).toBe("IMPACT_OBSERVED");
    expect(managerView.receiptArtifact).toEqual(donorView.receiptArtifact);
  });

  it("hides a receipt from viewers without donor or manager access", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    await expect(
      getContributionReceiptForViewer("payment_1", "stranger_user", {
        canManageTask: vi.fn(async () => false),
        db: fixture.db as never,
      }),
    ).rejects.toThrow("Task funding receipt not found");
  });

  it("does not expose a receipt to an ordinary member of its owner organization", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );

    // The receipt task is owned by org_1, but ordinary organization membership
    // is not authority to read another donor's financial receipt.
    await expect(
      getContributionReceiptForViewer("payment_1", "org_member_user", {
        canManageTask: vi.fn(async () => false),
        db: fixture.db as never,
      }),
    ).rejects.toThrow("Task funding receipt not found");
  });

  it("uses immutable donor identity instead of the mutable task assignee", async () => {
    const fixture = buildFixture();
    await issueContributionReceipt(
      {
        governingDocumentRevisionIds: ["revision_authority", "revision_terms"],
        paymentId: "payment_1",
        termsDocumentRevisionId: "revision_terms",
      },
      "issuer_1",
      {
        canManageTask: fixture.canManageTask,
        db: fixture.db as never,
      },
    );
    const receiptTask = fixture.createdTasks.find(
      (task) => task.id === "task-funding-receipt:payment_1",
    );
    expect(receiptTask).toBeDefined();
    if (receiptTask) receiptTask.assigneePersonId = "person_2";

    await expect(
      getContributionReceiptForViewer("payment_1", "reassigned_user", {
        canManageTask: vi.fn(async () => false),
        db: fixture.db as never,
      }),
    ).rejects.toThrow("Task funding receipt not found");
    await expect(
      getContributionReceiptForViewer("payment_1", "same_person_user", {
        canManageTask: vi.fn(async () => false),
        db: fixture.db as never,
      }),
    ).resolves.toMatchObject({
      receipt: { payment: { paymentId: "payment_1" } },
    });
  });
});
