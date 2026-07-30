import {
  ContentVisibility,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDocument, updateDocument } from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";
import { postComment } from "@/lib/tasks/task-comments.server";
import { DOCUMENT_REVIEW_TASK_KEY_PREFIX } from "./document-review-contracts";
import {
  applyDocumentProposal,
  createDocumentProposal,
  decideDocumentRevision,
  getDocumentReviewPanelData,
  requestDocumentReview,
  submitDocumentReview,
} from "./document-review.server";

const TEST_PREFIX = "document_review_kernel_";

async function cleanup() {
  const taskWhere = {
    OR: [
      { id: { startsWith: TEST_PREFIX } },
      { parentTaskId: { startsWith: TEST_PREFIX } },
    ],
  };
  await prisma.taskVerification.deleteMany({
    where: { taskExecutionAttempt: { task: taskWhere } },
  });
  await prisma.taskExecutionArtifact.deleteMany({
    where: { taskExecutionAttempt: { task: taskWhere } },
  });
  await prisma.taskExecutionAttempt.deleteMany({
    where: { task: taskWhere },
  });
  await prisma.taskComment.deleteMany({ where: { task: taskWhere } });
  await prisma.document.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({
    where: { parentTaskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createUser(suffix: string) {
  const person = await prisma.person.create({
    data: {
      displayName: `Document review ${suffix}`,
      id: `${TEST_PREFIX}person_${suffix}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}${suffix}@example.test`,
      id: `${TEST_PREFIX}user_${suffix}`,
      personId: person.id,
    },
  });
  return { person, user };
}

async function createFixture() {
  const manager = await createUser("manager");
  const firstReviewer = await createUser("reviewer_1");
  const secondReviewer = await createUser("reviewer_2");
  const authorityTask = await prisma.task.create({
    data: {
      createdByUserId: manager.user.id,
      description: "Own the exact-revision document decision workflow.",
      id: `${TEST_PREFIX}authority`,
      isPublic: false,
      title: "Decide the governing document",
    },
  });
  const document = await createDocument({
    body: "Original governing text.",
    createdByUserId: manager.user.id,
    taskId: authorityTask.id,
    title: "Governing document",
    visibility: ContentVisibility.PRIVATE,
  });
  return {
    authorityTask,
    document,
    firstReviewer,
    manager,
    secondReviewer,
  };
}

async function removeForcedArtifactFailure() {
  await prisma.$executeRawUnsafe(
    'DROP TRIGGER IF EXISTS "document_review_kernel_fail_artifact" ON "TaskExecutionArtifact"',
  );
  await prisma.$executeRawUnsafe(
    'DROP FUNCTION IF EXISTS "document_review_kernel_fail_artifact"()',
  );
}

async function installForcedArtifactFailure() {
  await removeForcedArtifactFailure();
  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION "document_review_kernel_fail_artifact"()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW."label" = 'Document review response'
        AND EXISTS (
          SELECT 1
          FROM "TaskExecutionAttempt" attempt
          JOIN "Task" task ON task."id" = attempt."taskId"
          WHERE attempt."id" = NEW."taskExecutionAttemptId"
            AND (
              attempt."taskId" LIKE '${TEST_PREFIX}%'
              OR task."parentTaskId" LIKE '${TEST_PREFIX}%'
            )
        )
      THEN
        RAISE EXCEPTION 'forced document-review artifact failure';
      END IF;
      RETURN NEW;
    END;
    $$
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER "document_review_kernel_fail_artifact"
    BEFORE INSERT ON "TaskExecutionArtifact"
    FOR EACH ROW
    EXECUTE FUNCTION "document_review_kernel_fail_artifact"()
  `);
}

describe.sequential("document governance kernel integration", () => {
  beforeEach(cleanup);
  afterAll(async () => {
    await removeForcedArtifactFailure();
    await cleanup();
  });

  it("turns comments into an optimistic proposal, stales old reviews, and adopts an independent approval", async () => {
    const fixture = await createFixture();
    await expect(
      requestDocumentReview(
        fixture.authorityTask.id,
        {
          documentRevisionId: fixture.document.revision.id,
          instructions: "Check this exact revision.",
          reviewerPersonId: fixture.manager.person.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "self-review" },
      ),
    ).rejects.toThrow("cannot review their own");

    const oldReview = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Check this exact revision before it changes.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "old-review" },
    );
    const comment = await postComment({
      authorUserId: fixture.manager.user.id,
      message: "Replace 'Original' with 'Revised' and explain the change.",
      taskId: fixture.authorityTask.id,
    });
    const proposalResult = await createDocumentProposal(
      fixture.authorityTask.id,
      {
        baseDocumentRevisionId: fixture.document.revision.id,
        body: "Revised governing text.",
        sourceCommentIds: [comment.id],
        summary: "Applied the requested wording change.",
        title: "Governing document",
      },
      fixture.manager.user.id,
      { idempotencyKey: "proposal" },
    );
    const proposalDocument = await prisma.document.findUniqueOrThrow({
      where: { id: proposalResult.proposal.proposal.documentId },
      select: { taskId: true, visibility: true },
    });
    expect(proposalDocument).toEqual({
      taskId: null,
      visibility: ContentVisibility.PRIVATE,
    });
    expect(proposalResult.proposal.sourceComments).toEqual([
      {
        commentId: comment.id,
        contentHash: expect.any(String),
        taskId: fixture.authorityTask.id,
      },
    ]);
    const pendingPanel = await getDocumentReviewPanelData(
      fixture.authorityTask.id,
      fixture.manager.user.id,
    );
    expect(pendingPanel?.mode).toBe("MANAGER");
    if (pendingPanel?.mode !== "MANAGER") {
      throw new Error("Expected manager panel");
    }
    expect(pendingPanel.proposals.map((item) => item.artifactId)).toEqual([
      proposalResult.artifact.id,
    ]);
    expect(pendingPanel.proposals[0]?.proposed).toMatchObject({
      body: "Revised governing text.",
      title: "Governing document",
    });
    await expect(
      getDocumentReviewPanelData(
        fixture.authorityTask.id,
        fixture.firstReviewer.user.id,
      ),
    ).resolves.toBeNull();

    const applied = await applyDocumentProposal(
      fixture.authorityTask.id,
      { proposalArtifactId: proposalResult.artifact.id },
      fixture.manager.user.id,
      { idempotencyKey: "apply" },
    );
    const replay = await applyDocumentProposal(
      fixture.authorityTask.id,
      { proposalArtifactId: proposalResult.artifact.id },
      fixture.manager.user.id,
      { idempotencyKey: "apply" },
    );
    expect(replay.artifact.id).toBe(applied.artifact.id);
    expect(replay.application.resultingDocument).toEqual(
      applied.application.resultingDocument,
    );
    const appliedPanel = await getDocumentReviewPanelData(
      fixture.authorityTask.id,
      fixture.manager.user.id,
    );
    expect(
      appliedPanel?.mode === "MANAGER" ? appliedPanel.proposals : null,
    ).toEqual([]);
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: oldReview.reviewTaskId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskStatus.STALE });

    const current = applied.application.resultingDocument;
    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: current.revisionId,
        instructions: "Approve only if the revised text is sound.",
        reviewerPersonId: fixture.secondReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "current-review" },
    );
    const reviewerPanel = await getDocumentReviewPanelData(
      review.reviewTaskId,
      fixture.secondReviewer.user.id,
    );
    expect(reviewerPanel?.mode).toBe("REVIEWER");
    expect(
      reviewerPanel?.mode === "REVIEWER" ? reviewerPanel.review.target : null,
    ).toMatchObject({
      body: "Revised governing text.",
      revisionId: current.revisionId,
      stale: false,
    });
    const submitted = await submitDocumentReview(
      review.reviewTaskId,
      {
        explanation: "The revised text matches the requested change.",
        verdict: "APPROVE",
      },
      fixture.secondReviewer.user.id,
      { idempotencyKey: "approval" },
    );
    const persistedReview = await prisma.task.findUniqueOrThrow({
      where: { id: review.reviewTaskId },
      select: {
        status: true,
        executionAttempts: {
          select: {
            verifications: {
              select: { method: true, result: true },
            },
          },
        },
      },
    });
    expect(persistedReview.status).toBe(TaskStatus.VERIFIED);
    expect(persistedReview.executionAttempts[0]?.verifications[0]).toEqual({
      method: TaskVerificationMethod.DETERMINISTIC,
      result: TaskVerificationResult.ACCEPTED,
    });

    const decision = await decideDocumentRevision(
      fixture.authorityTask.id,
      {
        action: "ADOPT",
        documentRevisionId: current.revisionId,
        reviewArtifactId: submitted.artifact.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "adopt" },
    );
    expect(decision.decision).toMatchObject({
      action: "ADOPT",
      reason: null,
      scope: "INTERNAL",
      target: current,
    });
    await expect(
      decideDocumentRevision(
        fixture.authorityTask.id,
        {
          action: "REJECT",
          documentRevisionId: current.revisionId,
          reason: "Attempted conflicting terminal decision.",
          reviewArtifactId: submitted.artifact.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "reject-after-adopt" },
      ),
    ).rejects.toThrow("already has an internal decision");
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: fixture.authorityTask.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskStatus.ACTIVE });
  });

  it("ignores forged duplicates and keeps unrelated children out of the manager review list", async () => {
    const fixture = await createFixture();
    const contentHash = fixture.document.revision.contentHash;
    if (!contentHash)
      throw new Error("Fixture revision must have a content hash");
    const target = {
      contentHash,
      documentId: fixture.document.document.id,
      revisionId: fixture.document.revision.id,
      version: fixture.document.revision.version,
    };
    await prisma.task.create({
      data: {
        assigneePersonId: fixture.firstReviewer.person.id,
        contextJson: {
          documentReview: {
            authorityTaskId: fixture.authorityTask.id,
            instructions: "Forged review lookalike.",
            requestedAt: "2026-07-29T12:00:00.000Z",
            requestedByUserId: fixture.manager.user.id,
            schema: "optimitron.review-request.v1",
            target,
          },
        },
        createdByUserId: fixture.manager.user.id,
        description: "This task has no authentic immutable binding.",
        id: `${TEST_PREFIX}forged_review`,
        isPublic: false,
        parentTaskId: fixture.authorityTask.id,
        taskKey: `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${fixture.authorityTask.id}:forged`,
        title: "Forged review",
      },
    });

    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Perform the authentic exact-revision review.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "authentic-after-forgery" },
    );
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: review.reviewTaskId },
        select: { title: true },
      }),
    ).resolves.toEqual({ title: "Review: Governing document" });
    await expect(
      requestDocumentReview(
        fixture.authorityTask.id,
        {
          documentRevisionId: fixture.document.revision.id,
          instructions: "Attempt a duplicate authentic review.",
          reviewerPersonId: fixture.firstReviewer.person.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "authentic-duplicate" },
      ),
    ).rejects.toThrow("already has a review task");

    await prisma.task.create({
      data: {
        createdByUserId: fixture.manager.user.id,
        description: "Ordinary work under the same authority task.",
        id: `${TEST_PREFIX}unrelated_child`,
        isPublic: false,
        parentTaskId: fixture.authorityTask.id,
        taskKey: `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${fixture.authorityTask.id}:ordinary-without-context`,
        title: "Unrelated child task",
      },
    });
    const ordinaryPanel = await getDocumentReviewPanelData(
      `${TEST_PREFIX}unrelated_child`,
      fixture.manager.user.id,
    );
    expect(ordinaryPanel).toMatchObject({
      authorityTaskId: `${TEST_PREFIX}unrelated_child`,
      mode: "MANAGER",
    });
    const panel = await getDocumentReviewPanelData(
      fixture.authorityTask.id,
      fixture.manager.user.id,
    );
    expect(panel?.mode).toBe("MANAGER");
    expect(
      panel?.mode === "MANAGER"
        ? panel.reviews.map((item) => item.reviewTaskId)
        : null,
    ).toEqual([review.reviewTaskId]);
  });

  it("records a reasoned REJECT without mutating the document head", async () => {
    const fixture = await createFixture();
    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Reject the revision if it is not ready.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "reject-review" },
    );
    const submitted = await submitDocumentReview(
      review.reviewTaskId,
      {
        explanation: "The text needs a defined effective date.",
        verdict: "CHANGES_REQUESTED",
      },
      fixture.firstReviewer.user.id,
      { idempotencyKey: "changes-requested" },
    );
    const before = await prisma.document.findUniqueOrThrow({
      where: { id: fixture.document.document.id },
      select: { currentRevisionId: true, version: true },
    });
    const rejected = await decideDocumentRevision(
      fixture.authorityTask.id,
      {
        action: "REJECT",
        documentRevisionId: fixture.document.revision.id,
        reason: "Revise the text to define an effective date.",
        reviewArtifactId: submitted.artifact.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "reject" },
    );
    expect(rejected.decision).toMatchObject({
      action: "REJECT",
      reason: "Revise the text to define an effective date.",
    });
    await expect(
      prisma.document.findUniqueOrThrow({
        where: { id: fixture.document.document.id },
        select: { currentRevisionId: true, version: true },
      }),
    ).resolves.toEqual(before);
    await expect(
      decideDocumentRevision(
        fixture.authorityTask.id,
        {
          action: "ADOPT",
          documentRevisionId: fixture.document.revision.id,
          reviewArtifactId: submitted.artifact.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "adopt-non-approval" },
      ),
    ).rejects.toThrow("requires an APPROVE verdict");
  });

  it("rejects an optimistic apply when a snapshotted comment is edited and restored", async () => {
    const fixture = await createFixture();
    const comment = await postComment({
      authorUserId: fixture.manager.user.id,
      message: "Make the requested wording change.",
      taskId: fixture.authorityTask.id,
    });
    const proposal = await createDocumentProposal(
      fixture.authorityTask.id,
      {
        baseDocumentRevisionId: fixture.document.revision.id,
        body: "Changed governing text.",
        sourceCommentIds: [comment.id],
        summary: "Applied the requested wording change.",
        title: "Governing document",
      },
      fixture.manager.user.id,
      { idempotencyKey: "comment-drift-proposal" },
    );
    await prisma.taskComment.update({
      where: { id: comment.id },
      data: {
        editedAt: new Date(),
        message: "Make the requested wording change.",
        version: { increment: 1 },
      },
    });
    const before = await prisma.document.findUniqueOrThrow({
      where: { id: fixture.document.document.id },
      select: { currentRevisionId: true, version: true },
    });
    await expect(
      applyDocumentProposal(
        fixture.authorityTask.id,
        { proposalArtifactId: proposal.artifact.id },
        fixture.manager.user.id,
        { idempotencyKey: "comment-drift-apply" },
      ),
    ).rejects.toThrow("source comment changed");
    await expect(
      prisma.document.findUniqueOrThrow({
        where: { id: fixture.document.document.id },
        select: { currentRevisionId: true, version: true },
      }),
    ).resolves.toEqual(before);
    await expect(
      prisma.taskExecutionAttempt.count({
        where: {
          metadata: {
            equals: "document-proposal-application",
            path: ["kind"],
          },
          taskId: fixture.authorityTask.id,
        },
      }),
    ).resolves.toBe(0);
  });

  it("propagates revision integrity failures through reviewer and manager panels", async () => {
    const fixture = await createFixture();
    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Review the exact persisted bytes.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "integrity-review" },
    );
    await prisma.documentRevision.update({
      where: { id: fixture.document.revision.id },
      data: { body: "Tampered without updating the content hash." },
    });
    await expect(
      getDocumentReviewPanelData(
        review.reviewTaskId,
        fixture.firstReviewer.user.id,
      ),
    ).rejects.toThrow("Document revision integrity check failed");
    await prisma.documentRevision.update({
      where: { id: fixture.document.revision.id },
      data: { body: "Original governing text." },
    });

    const comment = await postComment({
      authorUserId: fixture.manager.user.id,
      message: "Clarify the governing text.",
      taskId: fixture.authorityTask.id,
    });
    const proposal = await createDocumentProposal(
      fixture.authorityTask.id,
      {
        baseDocumentRevisionId: fixture.document.revision.id,
        body: "Clarified governing text.",
        sourceCommentIds: [comment.id],
        summary: "Clarified the requested wording.",
        title: "Governing document",
      },
      fixture.manager.user.id,
      { idempotencyKey: "integrity-proposal" },
    );
    await prisma.documentRevision.update({
      where: { id: proposal.proposal.proposal.revisionId },
      data: { body: "Tampered proposal body." },
    });
    await expect(
      getDocumentReviewPanelData(
        fixture.authorityTask.id,
        fixture.manager.user.id,
      ),
    ).rejects.toThrow("Document revision integrity check failed");
  });

  it("omits a proposal whose private document changed after artifact creation", async () => {
    const fixture = await createFixture();
    const comment = await postComment({
      authorUserId: fixture.manager.user.id,
      message: "Clarify the governing text.",
      taskId: fixture.authorityTask.id,
    });
    const proposal = await createDocumentProposal(
      fixture.authorityTask.id,
      {
        baseDocumentRevisionId: fixture.document.revision.id,
        body: "Clarified governing text.",
        sourceCommentIds: [comment.id],
        summary: "Clarified the requested wording.",
        title: "Governing document",
      },
      fixture.manager.user.id,
      { idempotencyKey: "tamper-proposal" },
    );
    await updateDocument({
      body: "Changed after proposal creation.",
      documentId: proposal.proposal.proposal.documentId,
      editorUserId: fixture.manager.user.id,
      expectedVersion: 1,
    });
    const panel = await getDocumentReviewPanelData(
      fixture.authorityTask.id,
      fixture.manager.user.id,
    );
    expect(panel?.mode === "MANAGER" ? panel.proposals : null).toEqual([]);
  });

  it("rolls back the rationale comment and execution rows when artifact creation fails", async () => {
    const fixture = await createFixture();
    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Request changes with a reason if needed.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "rollback-review" },
    );
    await installForcedArtifactFailure();
    try {
      await expect(
        submitDocumentReview(
          review.reviewTaskId,
          {
            explanation: "Define the effective date before adoption.",
            verdict: "CHANGES_REQUESTED",
          },
          fixture.firstReviewer.user.id,
          { idempotencyKey: "rollback-submission" },
        ),
      ).rejects.toThrow("forced document-review artifact failure");
    } finally {
      await removeForcedArtifactFailure();
    }

    const [task, commentCount, attemptCount, artifactCount, verificationCount] =
      await Promise.all([
        prisma.task.findUniqueOrThrow({
          where: { id: review.reviewTaskId },
          select: { status: true },
        }),
        prisma.taskComment.count({ where: { taskId: review.reviewTaskId } }),
        prisma.taskExecutionAttempt.count({
          where: { taskId: review.reviewTaskId },
        }),
        prisma.taskExecutionArtifact.count({
          where: {
            taskExecutionAttempt: { taskId: review.reviewTaskId },
          },
        }),
        prisma.taskVerification.count({
          where: {
            taskExecutionAttempt: { taskId: review.reviewTaskId },
          },
        }),
      ]);
    expect(task.status).toBe(TaskStatus.ACTIVE);
    expect({
      artifactCount,
      attemptCount,
      commentCount,
      verificationCount,
    }).toEqual({
      artifactCount: 0,
      attemptCount: 0,
      commentCount: 0,
      verificationCount: 0,
    });
  });
});
