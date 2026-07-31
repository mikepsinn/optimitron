import {
  ContentAccessLevel,
  ContentVisibility,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskCandidateKind,
  TaskCommentVisibility,
  TaskExecutionAttemptStatus,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDocument, updateDocument } from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";
import { postComment } from "@/lib/tasks/task-comments.server";
import {
  DOCUMENT_REVIEW_CONTEXT_KEY,
  DOCUMENT_REVIEW_TASK_KEY_PREFIX,
} from "./document-review-contracts";
import {
  applyDocumentProposal,
  createDocumentProposal,
  decideDocumentRevision,
  getAssignedDocumentReview,
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
  await prisma.organizationMember.deleteMany({
    where: {
      OR: [
        { organizationId: { startsWith: TEST_PREFIX } },
        { userId: { startsWith: TEST_PREFIX } },
      ],
    },
  });
  await prisma.organization.deleteMany({
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

async function createOrganization(suffix: string, creatorId: string) {
  const organization = await prisma.organization.create({
    data: {
      creatorId,
      id: `${TEST_PREFIX}organization_${suffix}`,
      name: `Document review organization ${suffix}`,
      slug: `${TEST_PREFIX}organization_${suffix}`,
      status: OrgStatus.APPROVED,
      type: OrgType.OTHER,
    },
  });
  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      role: OrganizationMemberRole.OWNER,
      userId: creatorId,
    },
  });
  return organization;
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
    const unreachableReviewer = await prisma.person.create({
      data: {
        displayName: "Unreachable reviewer",
        id: `${TEST_PREFIX}person_unreachable`,
      },
    });
    await expect(
      requestDocumentReview(
        fixture.authorityTask.id,
        {
          documentRevisionId: fixture.document.revision.id,
          instructions: "This assignment must remain reachable.",
          reviewerPersonId: unreachableReviewer.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "unreachable-reviewer" },
      ),
    ).rejects.toThrow("email address or linked account");
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
    const forgedReview = await prisma.task.create({
      data: {
        contextJson: {
          [DOCUMENT_REVIEW_CONTEXT_KEY]: oldReview.request,
        },
        createdByUserId: fixture.manager.user.id,
        description: "Ordinary task with colliding metadata.",
        id: `${TEST_PREFIX}forged_review`,
        parentTaskId: fixture.authorityTask.id,
        status: TaskStatus.ACTIVE,
        taskKey: `${TEST_PREFIX}ordinary-task`,
        title: "Do not stale this ordinary task",
      },
    });
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
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: forgedReview.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskStatus.ACTIVE });

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
    await expect(
      getAssignedDocumentReview(
        review.reviewTaskId,
        fixture.secondReviewer.user.id,
      ),
    ).resolves.toMatchObject({
      canSubmit: true,
      request: { instructions: "Approve only if the revised text is sound." },
      reviewTaskId: review.reviewTaskId,
      target: {
        body: "Revised governing text.",
        revisionId: current.revisionId,
      },
    });
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
    await expect(
      prisma.taskComment.findUniqueOrThrow({
        where: { id: submitted.comment.id },
        select: { visibility: true },
      }),
    ).resolves.toEqual({ visibility: TaskCommentVisibility.INTERNAL });
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

  it("does not expose pinned document bodies to task-only managers", async () => {
    const fixture = await createFixture();
    const taskOnlyManager = await createUser("task_only_manager");
    const review = await requestDocumentReview(
      fixture.authorityTask.id,
      {
        documentRevisionId: fixture.document.revision.id,
        instructions: "Review text the task-only manager must not see.",
        reviewerPersonId: fixture.firstReviewer.person.id,
      },
      fixture.manager.user.id,
      { idempotencyKey: "manager-document-boundary" },
    );
    await prisma.taskManager.create({
      data: {
        createdByUserId: fixture.manager.user.id,
        taskId: fixture.authorityTask.id,
        userId: taskOnlyManager.user.id,
      },
    });
    await expect(
      updateDocument({
        documentId: fixture.document.document.id,
        editorUserId: fixture.manager.user.id,
        expectedVersion: fixture.document.document.version,
        taskId: null,
      }),
    ).rejects.toThrow(
      "Documents with review or decision history cannot be linked to another task",
    );

    const panel = await getDocumentReviewPanelData(
      fixture.authorityTask.id,
      taskOnlyManager.user.id,
    );
    expect(panel).toMatchObject({
      authorityTaskId: fixture.authorityTask.id,
      mode: "MANAGER",
    });
    expect(panel?.mode === "MANAGER" ? panel.reviews : null).toEqual([]);
    await expect(
      getAssignedDocumentReview(review.reviewTaskId, taskOnlyManager.user.id),
    ).rejects.toThrow("Document review not found");
  });

  it("enforces the OAuth organization boundary on exact review reads and writes", async () => {
    const manager = await createUser("boundary_manager");
    const firstReviewer = await createUser("boundary_reviewer_1");
    const secondReviewer = await createUser("boundary_reviewer_2");
    const organizationA = await createOrganization("a", manager.user.id);
    const organizationB = await createOrganization("b", manager.user.id);
    const authorityTask = await prisma.task.create({
      data: {
        createdByUserId: manager.user.id,
        description: "Organization A authority task.",
        id: `${TEST_PREFIX}boundary_authority`,
        isPublic: false,
        ownerOrganizationId: organizationA.id,
        title: "Organization A authority",
      },
    });
    const document = await createDocument({
      body: "Organization B confidential text.",
      createdByUserId: manager.user.id,
      organizationId: organizationB.id,
      taskId: authorityTask.id,
      title: "Cross-organization document",
      visibility: ContentVisibility.PRIVATE,
    });
    const review = await requestDocumentReview(
      authorityTask.id,
      {
        documentRevisionId: document.revision.id,
        instructions: "Review through the normal browser session.",
        reviewerPersonId: firstReviewer.person.id,
      },
      manager.user.id,
      { idempotencyKey: "boundary-browser-review" },
    );
    const organizationABoundary = {
      allowPersonalPrivate: false,
      organizationIds: [organizationA.id],
    };

    await expect(
      getAssignedDocumentReview(review.reviewTaskId, firstReviewer.user.id, {
        clientAccessBoundary: organizationABoundary,
      }),
    ).rejects.toThrow("Document review not found");
    await expect(
      requestDocumentReview(
        authorityTask.id,
        {
          documentRevisionId: document.revision.id,
          instructions: "This scoped client must not cross organizations.",
          reviewerPersonId: secondReviewer.person.id,
        },
        manager.user.id,
        {
          clientAccessBoundary: organizationABoundary,
          idempotencyKey: "boundary-scoped-review",
        },
      ),
    ).rejects.toThrow("Document review not found");
  });

  it("treats an organization review assignment as personal MCP access for its external reviewer", async () => {
    const manager = await createUser("external_review_manager");
    const reviewer = await createUser("external_review_reviewer");
    const organization = await createOrganization(
      "external_review",
      manager.user.id,
    );
    const authorityTask = await prisma.task.create({
      data: {
        createdByUserId: manager.user.id,
        description: "Organization review for an external assignee.",
        id: `${TEST_PREFIX}external_review_authority`,
        isPublic: false,
        ownerOrganizationId: organization.id,
        title: "External exact-revision review",
      },
    });
    const document = await createDocument({
      body: "Organization text assigned to external counsel.",
      createdByUserId: manager.user.id,
      organizationId: organization.id,
      taskId: authorityTask.id,
      title: "External review document",
      visibility: ContentVisibility.PRIVATE,
    });
    const review = await requestDocumentReview(
      authorityTask.id,
      {
        documentRevisionId: document.revision.id,
        instructions: "Review the exact assigned text.",
        reviewerPersonId: reviewer.person.id,
      },
      manager.user.id,
      { idempotencyKey: "external-review-assignment" },
    );
    const personalBoundary = {
      allowPersonalPrivate: true,
      organizationIds: [] as string[],
    };

    await expect(
      getAssignedDocumentReview(review.reviewTaskId, reviewer.user.id, {
        clientAccessBoundary: personalBoundary,
      }),
    ).resolves.toMatchObject({
      canSubmit: true,
      target: { body: "Organization text assigned to external counsel." },
    });
    await expect(
      submitDocumentReview(
        review.reviewTaskId,
        { explanation: "The assigned text is sound.", verdict: "APPROVE" },
        reviewer.user.id,
        {
          clientAccessBoundary: personalBoundary,
          idempotencyKey: "external-review-response",
        },
      ),
    ).resolves.toMatchObject({ response: { verdict: "APPROVE" } });
  });

  it("lets an organization MCP manager apply an authentic personal proposal", async () => {
    const manager = await createUser("scoped_apply_manager");
    const organization = await createOrganization(
      "scoped_apply",
      manager.user.id,
    );
    const authorityTask = await prisma.task.create({
      data: {
        createdByUserId: manager.user.id,
        description: "Organization authority with a browser proposal.",
        id: `${TEST_PREFIX}scoped_apply_authority`,
        isPublic: false,
        ownerOrganizationId: organization.id,
        title: "Apply a submitted proposal",
      },
    });
    const document = await createDocument({
      body: "Original organization text.",
      createdByUserId: manager.user.id,
      organizationId: organization.id,
      taskId: authorityTask.id,
      title: "Organization document",
      visibility: ContentVisibility.PRIVATE,
    });
    const comment = await postComment({
      authorUserId: manager.user.id,
      message: "Use the clearer wording.",
      taskId: authorityTask.id,
    });
    const proposalInput = {
      baseDocumentRevisionId: document.revision.id,
      body: "Clearer organization text.",
      sourceCommentIds: [comment.id],
      summary: "Applied the requested clarification.",
      title: "Organization document",
    };
    const proposal = await createDocumentProposal(
      authorityTask.id,
      proposalInput,
      manager.user.id,
      { idempotencyKey: "browser-personal-proposal" },
    );
    const organizationBoundary = {
      allowPersonalPrivate: false,
      organizationIds: [organization.id],
    };
    await expect(
      createDocumentProposal(authorityTask.id, proposalInput, manager.user.id, {
        clientAccessBoundary: organizationBoundary,
        idempotencyKey: "browser-personal-proposal",
      }),
    ).resolves.toMatchObject({ artifact: { id: proposal.artifact.id } });
    await expect(
      getDocumentReviewPanelData(authorityTask.id, manager.user.id, {
        clientAccessBoundary: organizationBoundary,
      }),
    ).resolves.toMatchObject({
      mode: "MANAGER",
      proposals: [{ artifactId: proposal.artifact.id }],
    });

    const apply = () =>
      applyDocumentProposal(
        authorityTask.id,
        { proposalArtifactId: proposal.artifact.id },
        manager.user.id,
        {
          clientAccessBoundary: organizationBoundary,
          idempotencyKey: "organization-scoped-apply",
        },
      );
    await expect(apply()).resolves.toMatchObject({
      application: {
        resultingDocument: { documentId: document.document.id, version: 2 },
      },
    });
    await expect(apply()).resolves.toMatchObject({
      application: {
        resultingDocument: { documentId: document.document.id, version: 2 },
      },
    });
  });

  it("does not treat caller-authored artifact metadata as governance history", async () => {
    const fixture = await createFixture();
    const now = new Date();
    const attempt = await prisma.taskExecutionAttempt.create({
      data: {
        completedAt: now,
        executorKey: `user:${fixture.manager.user.id}`,
        executorKind: TaskCandidateKind.USER,
        executorPersonId: fixture.manager.person.id,
        executorUserId: fixture.manager.user.id,
        metadata: { startedByUserId: fixture.manager.user.id },
        startedAt: now,
        status: TaskExecutionAttemptStatus.COMPLETED,
        taskId: fixture.authorityTask.id,
      },
    });
    await prisma.taskExecutionArtifact.create({
      data: {
        contentHash: "caller-controlled-lookalike",
        metadataJson: { kind: "document-proposal" },
        structuredResultJson: {
          base: { documentId: fixture.document.document.id },
        },
        submittedByUserId: fixture.manager.user.id,
        taskExecutionAttemptId: attempt.id,
      },
    });

    await expect(
      updateDocument({
        documentId: fixture.document.document.id,
        editorUserId: fixture.manager.user.id,
        expectedVersion: fixture.document.document.version,
        taskId: null,
      }),
    ).resolves.toMatchObject({ document: { taskId: null, version: 2 } });
  });

  it("does not let a proposal author review the applied version of their own text", async () => {
    const fixture = await createFixture();
    await Promise.all([
      prisma.taskManager.create({
        data: {
          createdByUserId: fixture.manager.user.id,
          taskId: fixture.authorityTask.id,
          userId: fixture.firstReviewer.user.id,
        },
      }),
      prisma.contentAccessGrant.create({
        data: {
          accessLevel: ContentAccessLevel.VIEW,
          documentId: fixture.document.document.id,
          grantedByUserId: fixture.manager.user.id,
          userId: fixture.firstReviewer.user.id,
        },
      }),
    ]);
    const comment = await postComment({
      authorUserId: fixture.firstReviewer.user.id,
      message: "Replace the original language with my proposed text.",
      taskId: fixture.authorityTask.id,
    });
    const proposal = await createDocumentProposal(
      fixture.authorityTask.id,
      {
        baseDocumentRevisionId: fixture.document.revision.id,
        body: "Text authored by the proposed reviewer.",
        sourceCommentIds: [comment.id],
        summary: "Replace the original language.",
        title: "Governing document",
      },
      fixture.firstReviewer.user.id,
      { idempotencyKey: "reviewer-authored-proposal" },
    );
    await expect(
      updateDocument({
        documentId: proposal.proposal.proposal.documentId,
        editorUserId: fixture.firstReviewer.user.id,
        expectedVersion: proposal.proposal.proposal.version,
        taskId: fixture.authorityTask.id,
      }),
    ).rejects.toThrow(
      "Documents with review or decision history cannot be linked to another task",
    );
    const applied = await applyDocumentProposal(
      fixture.authorityTask.id,
      { proposalArtifactId: proposal.artifact.id },
      fixture.manager.user.id,
      { idempotencyKey: "manager-applies-reviewer-proposal" },
    );

    await expect(
      requestDocumentReview(
        fixture.authorityTask.id,
        {
          documentRevisionId: applied.application.resultingDocument.revisionId,
          instructions: "Independently review the applied text.",
          reviewerPersonId: fixture.firstReviewer.person.id,
        },
        fixture.manager.user.id,
        { idempotencyKey: "proposal-author-self-review" },
      ),
    ).rejects.toThrow("based on their own proposal");
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
