import {
  ContentAccessLevel,
  ContentVisibility,
  ExternalActionRequestStatus,
  TaskCommunicationStatus,
  TaskStatus,
  TaskVerificationResult,
} from "@optimitron/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDocument, getDocumentForViewer } from "@/lib/documents.server";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import {
  adoptDocumentRevision,
  applyDocumentProposal,
  getDocumentReviewPanelData,
  getPinnedDocumentRevisionForReviewer,
  hasAssignedDocumentReviewRevisionAccess,
  requestDocumentReview,
  submitDocumentReview,
} from "@/lib/tasks/document-review.server";
import { verifyTaskExecution } from "@/lib/tasks/execution-lifecycle.server";
import { approveOutboundMessageBatch } from "@/lib/tasks/outbound-message-batch.server";
import { proposePrivateReviewInvitation } from "@/lib/tasks/private-review-invitations.server";

const TEST_PREFIX = "document_review_integration_";
const MANAGER_PERSON_ID = `${TEST_PREFIX}manager_person`;
const MANAGER_USER_ID = `${TEST_PREFIX}manager_user`;
const FIRST_REVIEWER_PERSON_ID = `${TEST_PREFIX}first_reviewer_person`;
const FIRST_REVIEWER_USER_ID = `${TEST_PREFIX}first_reviewer_user`;
const SECOND_REVIEWER_PERSON_ID = `${TEST_PREFIX}second_reviewer_person`;
const SECOND_REVIEWER_USER_ID = `${TEST_PREFIX}second_reviewer_user`;
const AUTHORITY_TASK_ID = `${TEST_PREFIX}authority_task`;
const BATCH_KEY = `${TEST_PREFIX}invitation_batch`;
const INITIAL_TITLE = "Authoritative formation record";
const INITIAL_BODY = "Filed formation record, exact imported text.";
const ORIGINAL_NEXTAUTH_URL = process.env.NEXTAUTH_URL;

function assertDisposableTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const parsed = new URL(databaseUrl);
  if (
    !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
    parsed.pathname !== "/test"
  ) {
    throw new Error(
      `Refusing document-review integration test against ${parsed.hostname}${parsed.pathname}`,
    );
  }
}

async function cleanup() {
  const userWhere = { id: { startsWith: TEST_PREFIX } } as const;
  const personWhere = { id: { startsWith: TEST_PREFIX } } as const;

  await prisma.document.updateMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
    data: { currentRevisionId: null },
  });
  await prisma.document.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.updateMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
    data: { parentTaskId: null },
  });
  await prisma.task.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.subject.deleteMany({
    where: {
      OR: [
        { personId: { startsWith: TEST_PREFIX } },
        { userId: { startsWith: TEST_PREFIX } },
      ],
    },
  });
  await prisma.user.deleteMany({ where: userWhere });
  await prisma.person.deleteMany({ where: personWhere });
}

async function createLinkedUser(input: {
  displayName: string;
  email: string;
  personId: string;
  userId: string;
}) {
  const person = await prisma.person.create({
    data: {
      displayName: input.displayName,
      email: input.email,
      id: input.personId,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: input.email,
      id: input.userId,
      personId: person.id,
    },
  });
  return { person, user };
}

async function acceptReviewDelivery(verificationId: string) {
  return verifyTaskExecution(
    {
      criterionResults: [
        {
          criterion:
            "The reviewer completed the requested exact-revision review",
          passed: true,
        },
      ],
      result: "ACCEPTED",
      taskVerificationId: verificationId,
    },
    MANAGER_USER_ID,
    { allowDocumentReview: true },
  );
}

beforeAll(async () => {
  assertDisposableTestDatabase();
  process.env.NEXTAUTH_URL = "https://optimitron.example.test";
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  if (ORIGINAL_NEXTAUTH_URL === undefined) {
    delete process.env.NEXTAUTH_URL;
  } else {
    process.env.NEXTAUTH_URL = ORIGINAL_NEXTAUTH_URL;
  }
});

describe.sequential("document review local-database integration", () => {
  it("moves an imported revision through frozen outreach, first-login access, proposal, re-review, and adoption", async () => {
    const manager = await createLinkedUser({
      displayName: "EOS document manager",
      email: `${TEST_PREFIX}manager@example.test`,
      personId: MANAGER_PERSON_ID,
      userId: MANAGER_USER_ID,
    });
    await prisma.person.create({
      data: {
        displayName: "External first reviewer",
        email: `${TEST_PREFIX}first-reviewer@example.test`,
        id: FIRST_REVIEWER_PERSON_ID,
        sourceUrl: "https://directory.example.test/first-reviewer",
      },
    });
    await createLinkedUser({
      displayName: "Independent second reviewer",
      email: `${TEST_PREFIX}second-reviewer@example.test`,
      personId: SECOND_REVIEWER_PERSON_ID,
      userId: SECOND_REVIEWER_USER_ID,
    });
    await prisma.task.create({
      data: {
        createdByUserId: manager.user.id,
        description: "Import, review, and adopt the authoritative record.",
        id: AUTHORITY_TASK_ID,
        isPublic: false,
        title: "Adopt the authoritative formation record",
      },
    });

    const imported = await createDocument({
      body: INITIAL_BODY,
      createdByUserId: MANAGER_USER_ID,
      idempotencyKey: `${TEST_PREFIX}document_import`,
      sourceKey: `${TEST_PREFIX}authoritative_filing_v1`,
      sourceUrl: "https://records.example.test/eos/formation-v1",
      taskId: AUTHORITY_TASK_ID,
      title: INITIAL_TITLE,
      visibility: ContentVisibility.PRIVATE,
    });
    expect(imported.document).toMatchObject({
      sourceKey: `${TEST_PREFIX}authoritative_filing_v1`,
      sourceUrl: "https://records.example.test/eos/formation-v1",
      version: 1,
    });
    expect(imported.revision.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const firstRequest = await requestDocumentReview(
      AUTHORITY_TASK_ID,
      {
        checklist: [
          {
            criterion: "Confirm the filed authority clause and address",
            id: "authority",
            required: true,
          },
        ],
        documentRevisionId: imported.revision.id,
        instructions: "Review only the exact imported revision.",
        required: true,
        reviewerPersonId: FIRST_REVIEWER_PERSON_ID,
      },
      MANAGER_USER_ID,
      {
        idempotencyKey: `${TEST_PREFIX}first_review`,
        now: new Date("2026-07-27T12:00:00.000Z"),
      },
    );
    expect(firstRequest.request.target).toEqual({
      contentHash: imported.revision.contentHash,
      documentId: imported.document.id,
      revisionId: imported.revision.id,
      version: 1,
    });
    await expect(
      prisma.task.findUnique({
        where: { id: firstRequest.reviewTaskId },
        select: {
          assigneePersonId: true,
          claimPolicy: true,
          isPublic: true,
          parentTaskId: true,
        },
      }),
    ).resolves.toMatchObject({
      assigneePersonId: FIRST_REVIEWER_PERSON_ID,
      claimPolicy: "ASSIGNED_ONLY",
      isPublic: false,
      parentTaskId: AUTHORITY_TASK_ID,
    });

    const invitationInput = {
      batchKey: BATCH_KEY,
      kind: "INVITATION" as const,
      recipientPersonId: FIRST_REVIEWER_PERSON_ID,
      revision: {
        contentHash: imported.revision.contentHash!,
        documentId: imported.document.id,
        documentRevisionId: imported.revision.id,
        documentVersion: imported.revision.version,
      },
      taskId: firstRequest.reviewTaskId,
    };
    const invitations = await Promise.all([
      proposePrivateReviewInvitation(invitationInput, MANAGER_USER_ID, {
        now: new Date("2026-07-27T12:05:00.000Z"),
      }),
      proposePrivateReviewInvitation(invitationInput, MANAGER_USER_ID, {
        now: new Date("2026-07-27T12:05:00.000Z"),
      }),
    ]);
    expect(invitations.map((result) => result.status).sort()).toEqual([
      "existing",
      "pending_approval",
    ]);
    const invitationDrafts = invitations.filter(
      (
        result,
      ): result is Extract<
        (typeof invitations)[number],
        { status: "existing" | "pending_approval" }
      > => result.status === "existing" || result.status === "pending_approval",
    );
    expect(invitationDrafts).toHaveLength(2);
    expect(
      new Set(invitationDrafts.map((result) => result.communicationId)),
    ).toEqual(new Set([invitationDrafts[0]!.communicationId]));
    const invitation = invitationDrafts.find(
      (result) => result.status === "pending_approval",
    );
    if (!invitation) throw new Error("Expected one new review invitation");
    expect(invitation.status).toBe("pending_approval");
    await expect(
      prisma.taskCommunication.count({
        where: {
          deletedAt: null,
          metadataJson: {
            equals: `private-review:v1:invitation:${firstRequest.reviewTaskId}:${FIRST_REVIEWER_PERSON_ID}:${imported.revision.id}`,
            path: ["reviewInvitationKey"],
          },
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.externalActionRequest.count({
        where: { taskId: firstRequest.reviewTaskId },
      }),
    ).resolves.toBe(1);
    const frozenBeforeApproval =
      await prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: invitation.externalActionRequestId },
      });
    const draftBeforeApproval =
      await prisma.taskCommunication.findUniqueOrThrow({
        where: { id: invitation.communicationId },
      });
    expect(frozenBeforeApproval.status).toBe(
      ExternalActionRequestStatus.PENDING,
    );
    expect(JSON.stringify(frozenBeforeApproval.payloadJson)).not.toContain(
      INITIAL_BODY,
    );
    expect(JSON.stringify(draftBeforeApproval.metadataJson)).not.toContain(
      INITIAL_BODY,
    );

    await expect(
      approveOutboundMessageBatch(
        {
          batchKey: BATCH_KEY,
          requests: [
            {
              expectedPayloadHash: invitation.payloadHash,
              externalActionRequestId: invitation.externalActionRequestId,
            },
          ],
        },
        MANAGER_USER_ID,
        { now: new Date("2026-07-27T12:10:00.000Z") },
      ),
    ).resolves.toMatchObject({ status: "approved" });
    const frozenAfterApproval =
      await prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: invitation.externalActionRequestId },
      });
    const draftAfterApproval = await prisma.taskCommunication.findUniqueOrThrow(
      {
        where: { id: invitation.communicationId },
      },
    );
    expect(frozenAfterApproval).toMatchObject({
      approvedPayloadHash: frozenBeforeApproval.payloadHash,
      executedAt: null,
      executionReceiptJson: null,
      payloadHash: frozenBeforeApproval.payloadHash,
      payloadJson: frozenBeforeApproval.payloadJson,
      status: ExternalActionRequestStatus.APPROVED,
    });
    expect(draftAfterApproval.status).toBe(TaskCommunicationStatus.DRAFT);

    await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}first-reviewer@example.test`,
        id: FIRST_REVIEWER_USER_ID,
      },
    });
    const linkedPerson = await ensurePersonForUser(FIRST_REVIEWER_USER_ID);
    expect(linkedPerson.id).toBe(FIRST_REVIEWER_PERSON_ID);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: FIRST_REVIEWER_USER_ID },
        select: { personId: true },
      }),
    ).resolves.toEqual({ personId: FIRST_REVIEWER_PERSON_ID });

    await expect(
      getPinnedDocumentRevisionForReviewer(
        firstRequest.reviewTaskId,
        FIRST_REVIEWER_USER_ID,
      ),
    ).resolves.toMatchObject({
      body: INITIAL_BODY,
      revisionId: imported.revision.id,
      stale: false,
      version: 1,
    });
    const firstReviewerView = await getDocumentForViewer(
      imported.revision.id,
      FIRST_REVIEWER_USER_ID,
    );
    expect(firstReviewerView).toMatchObject({
      effectivePermission: ContentAccessLevel.COMMENT,
      revision: { body: INITIAL_BODY, id: imported.revision.id },
      viewerCanEdit: false,
    });
    expect(firstReviewerView?.versions).toHaveLength(1);

    const firstResponseInput = {
      checklistResponses: [
        {
          comment: "The filed office address is missing.",
          criterionId: "authority",
          result: "FAIL" as const,
        },
      ],
      explanation: "Add the filed office address before adoption.",
      proposal: {
        body: `${INITIAL_BODY}\n\nRegistered office: 123 Example Street.`,
        title: INITIAL_TITLE,
      },
      verdict: "CHANGES_REQUESTED" as const,
    };
    const concurrentResponses = await Promise.allSettled([
      submitDocumentReview(
        firstRequest.reviewTaskId,
        firstResponseInput,
        FIRST_REVIEWER_USER_ID,
        { now: new Date("2026-07-27T13:00:00.000Z") },
      ),
      submitDocumentReview(
        firstRequest.reviewTaskId,
        firstResponseInput,
        FIRST_REVIEWER_USER_ID,
        { now: new Date("2026-07-27T13:00:00.000Z") },
      ),
    ]);
    const fulfilledResponses = concurrentResponses.filter(
      (result) => result.status === "fulfilled",
    );
    const rejectedResponses = concurrentResponses.filter(
      (result) => result.status === "rejected",
    );
    expect(fulfilledResponses).toHaveLength(1);
    expect(rejectedResponses).toHaveLength(1);
    expect(rejectedResponses[0]).toMatchObject({
      reason: {
        code: "DOCUMENT_REVIEW_CONFLICT",
        message: "A review response has already been submitted",
        status: 409,
      },
    });
    const firstResponse = fulfilledResponses[0]!.value;
    expect(firstResponse.response.proposalDocument).toBeDefined();
    await expect(
      prisma.taskExecutionAttempt.count({
        where: { deletedAt: null, taskId: firstRequest.reviewTaskId },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.document.count({
        where: { deletedAt: null, taskId: firstRequest.reviewTaskId },
      }),
    ).resolves.toBe(1);
    await expect(
      acceptReviewDelivery(firstResponse.verification.id),
    ).resolves.toMatchObject({
      result: TaskVerificationResult.ACCEPTED,
      selfReviewed: false,
    });

    const applied = await applyDocumentProposal(
      AUTHORITY_TASK_ID,
      {
        expectedDocumentVersion: 1,
        reviewTaskId: firstRequest.reviewTaskId,
      },
      MANAGER_USER_ID,
      { now: new Date("2026-07-27T14:00:00.000Z") },
    );
    const secondRevisionId = applied.application.resultingDocument.revisionId;
    expect(applied.application.resultingDocument).toMatchObject({
      documentId: imported.document.id,
      version: 2,
    });
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: firstRequest.reviewTaskId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskStatus.STALE });
    await expect(
      getDocumentReviewPanelData(firstRequest.reviewTaskId, MANAGER_USER_ID),
    ).resolves.toMatchObject({
      mode: "MANAGER",
      reviews: [{ reviewTaskId: firstRequest.reviewTaskId, state: "STALE" }],
    });

    expect(
      await getDocumentForViewer(imported.document.id, FIRST_REVIEWER_USER_ID),
    ).toBeNull();
    await expect(
      getDocumentForViewer(imported.revision.id, FIRST_REVIEWER_USER_ID),
    ).resolves.toMatchObject({
      revision: { body: INITIAL_BODY, id: imported.revision.id },
      versions: [{ id: imported.revision.id }],
    });
    await expect(
      hasAssignedDocumentReviewRevisionAccess({
        documentId: imported.document.id,
        revisionId: secondRevisionId,
        userId: FIRST_REVIEWER_USER_ID,
      }),
    ).resolves.toBe(false);

    const secondRequest = await requestDocumentReview(
      AUTHORITY_TASK_ID,
      {
        checklist: [
          {
            criterion: "Confirm the revised authority clause and address",
            id: "authority-v2",
            required: true,
          },
        ],
        documentRevisionId: secondRevisionId,
        instructions: "Review only canonical revision 2.",
        required: true,
        reviewerPersonId: SECOND_REVIEWER_PERSON_ID,
      },
      MANAGER_USER_ID,
      {
        idempotencyKey: `${TEST_PREFIX}second_review`,
        now: new Date("2026-07-27T14:05:00.000Z"),
      },
    );
    await expect(
      getDocumentReviewPanelData(
        secondRequest.reviewTaskId,
        FIRST_REVIEWER_USER_ID,
      ),
    ).resolves.toBeNull();
    await expect(
      hasAssignedDocumentReviewRevisionAccess({
        documentId: imported.document.id,
        revisionId: secondRevisionId,
        userId: SECOND_REVIEWER_USER_ID,
      }),
    ).resolves.toBe(true);

    const secondResponse = await submitDocumentReview(
      secondRequest.reviewTaskId,
      {
        checklistResponses: [{ criterionId: "authority-v2", result: "PASS" }],
        explanation: "The revised exact revision is ready to adopt.",
        verdict: "APPROVE",
      },
      SECOND_REVIEWER_USER_ID,
      { now: new Date("2026-07-27T15:00:00.000Z") },
    );
    await acceptReviewDelivery(secondResponse.verification.id);

    const adoption = await adoptDocumentRevision(
      AUTHORITY_TASK_ID,
      { documentRevisionId: secondRevisionId, waivers: [] },
      MANAGER_USER_ID,
      {
        idempotencyKey: `${TEST_PREFIX}adopt_revision_2`,
        now: new Date("2026-07-27T16:00:00.000Z"),
      },
    );
    expect(adoption.decision).toMatchObject({
      acceptedReviewArtifactIds: [secondResponse.artifact.id],
      adoptedDocument: {
        documentId: imported.document.id,
        revisionId: secondRevisionId,
        version: 2,
      },
      authorityTaskId: AUTHORITY_TASK_ID,
      schema: "optimitron.document-decision.v1",
      waivers: [],
    });
    await expect(
      getDocumentReviewPanelData(AUTHORITY_TASK_ID, MANAGER_USER_ID),
    ).resolves.toMatchObject({
      decisions: [
        {
          artifactId: adoption.artifact.id,
          decision: { adoptedDocument: { revisionId: secondRevisionId } },
        },
      ],
      mode: "MANAGER",
    });
  });
});
