import {
  ExternalActionRequestStatus,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskStatus,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createDocument } from "./documents.server";
import {
  findReviewedAnswers,
  prepareFormResponses,
  proposeFormSubmission,
} from "./form-responses.server";
import {
  startTaskExecution,
  submitTaskArtifact,
  submitTaskForVerification,
  verifyTaskExecution,
} from "./tasks/execution-lifecycle.server";

const TEST_PREFIX = "form_responses_";

async function cleanup() {
  await prisma.externalActionRequest.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskVerification.deleteMany({
    where: {
      taskExecutionAttempt: {
        task: {
          OR: [
            { id: { startsWith: TEST_PREFIX } },
            { parentTaskId: { startsWith: TEST_PREFIX } },
          ],
        },
      },
    },
  });
  await prisma.taskExecutionArtifact.deleteMany({
    where: {
      taskExecutionAttempt: {
        task: {
          OR: [
            { id: { startsWith: TEST_PREFIX } },
            { parentTaskId: { startsWith: TEST_PREFIX } },
          ],
        },
      },
    },
  });
  await prisma.taskExecutionAttempt.deleteMany({
    where: {
      task: {
        OR: [
          { id: { startsWith: TEST_PREFIX } },
          { parentTaskId: { startsWith: TEST_PREFIX } },
        ],
      },
    },
  });
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

async function createFixture() {
  const person = await prisma.person.create({
    data: {
      displayName: "Form Response Owner",
      id: `${TEST_PREFIX}person`,
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `${TEST_PREFIX}owner@example.test`,
      id: `${TEST_PREFIX}user`,
      personId: person.id,
    },
  });
  const organization = await prisma.organization.create({
    data: {
      creatorId: user.id,
      id: `${TEST_PREFIX}organization`,
      name: "Form Response Organization",
      slug: `${TEST_PREFIX}organization`,
      status: OrgStatus.APPROVED,
      type: OrgType.OTHER,
    },
  });
  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      role: OrganizationMemberRole.OWNER,
      userId: user.id,
    },
  });
  const applicationTask = await prisma.task.create({
    data: {
      createdByUserId: user.id,
      description: "Submit the example grant application.",
      id: `${TEST_PREFIX}task`,
      isPublic: false,
      ownerOrganizationId: organization.id,
      status: TaskStatus.ACTIVE,
      title: "Apply for the example grant",
    },
  });
  return { applicationTask, organization, person, user };
}

describe.sequential("reviewed form response loop", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("turns one unresolved question into one approved reusable revision and one pending exact submission", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };
    const prepared = await prepareFormResponses(
      {
        formTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare`,
        questions: [
          {
            contextTags: ["grant"],
            fieldKey: "mission",
            knowledgeKey: "organization.mission",
            prompt: "What is your organization's mission?",
            proposedAnswer:
              "We identify and execute the highest-value ways to reduce suffering.",
          },
        ],
        subject,
      },
      fixture.user.id,
    );

    expect(prepared.readyForSubmission).toBe(false);
    expect(prepared.unresolved).toHaveLength(1);
    const unresolved = prepared.unresolved[0]!;
    expect(unresolved.draftDocument?.revisionId).toBeTruthy();

    const attempt = await startTaskExecution(
      { taskId: unresolved.task.id },
      fixture.user.id,
    );
    await submitTaskArtifact(
      {
        documentRevisionId: unresolved.draftDocument!.revisionId,
        label: "Reusable reviewed answer",
        taskExecutionAttemptId: attempt.id,
      },
      fixture.user.id,
    );
    const submitted = await submitTaskForVerification(
      {
        actualDurationSeconds: 60,
        method: "REVIEWER",
        outputSummary: "Checked the answer for factual accuracy and tone.",
        taskExecutionAttemptId: attempt.id,
      },
      fixture.user.id,
    );
    await verifyTaskExecution(
      {
        criterionResults: [
          {
            criterion:
              "The answer is factually accurate and appropriate for reuse in this context.",
            passed: true,
          },
          {
            criterion:
              "An immutable answer document revision is attached and accepted by a human reviewer.",
            passed: true,
          },
        ],
        result: "ACCEPTED",
        taskVerificationId: submitted.verification.id,
      },
      fixture.user.id,
    );

    const found = await findReviewedAnswers(
      {
        contextTags: ["grant"],
        knowledgeKey: "organization.mission",
        question: "Please describe the mission of your organization.",
        subject,
      },
      fixture.user.id,
    );
    expect(found.answers).toHaveLength(1);
    expect(found.answers[0]).toMatchObject({
      answer:
        "We identify and execute the highest-value ways to reduce suffering.",
      answerRevisionId: unresolved.draftDocument!.revisionId,
      reviewTaskId: unresolved.task.id,
    });

    const secondApplication = await prisma.task.create({
      data: {
        createdByUserId: fixture.user.id,
        description: "Submit a second example grant application.",
        id: `${TEST_PREFIX}second_task`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Apply for a second example grant",
      },
    });
    const mismatched = await prepareFormResponses(
      {
        formTaskId: secondApplication.id,
        idempotencyKey: `${TEST_PREFIX}mismatched-answer`,
        questions: [
          {
            answerRevisionId: unresolved.draftDocument!.revisionId,
            contextTags: ["grant"],
            fieldKey: "budget",
            knowledgeKey: "organization.annual-budget",
            prompt: "What is your annual budget?",
          },
        ],
        subject,
      },
      fixture.user.id,
    );
    expect(mismatched).toMatchObject({
      readyForSubmission: false,
      resolved: [],
      unresolved: [
        {
          fieldKey: "budget",
          reason:
            "The supplied answer revision is not an approved answer for this question and subject.",
        },
      ],
    });

    const reuseApplication = await prisma.task.create({
      data: {
        createdByUserId: fixture.user.id,
        description: "Reuse reviewed answers in a differently worded form.",
        id: `${TEST_PREFIX}reuse_task`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Complete another grant form",
      },
    });
    const reused = await prepareFormResponses(
      {
        formTaskId: reuseApplication.id,
        idempotencyKey: `${TEST_PREFIX}prepare-retry`,
        questions: [
          {
            contextTags: ["grant"],
            fieldKey: "mission",
            knowledgeKey: "organization.mission",
            prompt: "Please describe the mission of your organization.",
          },
        ],
        subject,
      },
      fixture.user.id,
    );
    expect(reused).toMatchObject({
      readyForSubmission: true,
      resolved: [
        {
          answerRevisionId: unresolved.draftDocument!.revisionId,
          fieldKey: "mission",
        },
      ],
      unresolved: [],
    });
    const formAttempt = await startTaskExecution(
      { taskId: reuseApplication.id },
      fixture.user.id,
    );
    await expect(
      proposeFormSubmission(
        {
          responses: [
            {
              answerRevisionId: "unrelated_revision",
              fieldKey: "mission",
              prompt: "Please describe the mission of your organization.",
            },
          ],
          destination: "https://example.test/apply",
          formTaskId: reuseApplication.id,
          idempotencyKey: `${TEST_PREFIX}wrong-answer`,
          taskExecutionAttemptId: formAttempt.id,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("does not match the prepared form");

    const proposal = await proposeFormSubmission(
      {
        responses: [
          {
            answerRevisionId: unresolved.draftDocument!.revisionId,
            fieldKey: "mission",
            prompt: "Please describe the mission of your organization.",
          },
        ],
        destination: "https://example.test/apply",
        formTaskId: reuseApplication.id,
        idempotencyKey: `${TEST_PREFIX}submit`,
        taskExecutionAttemptId: formAttempt.id,
      },
      fixture.user.id,
    );

    expect(proposal.approvalRequired).toBe(true);
    expect(proposal.externalActionRequest.status).toBe(
      ExternalActionRequestStatus.PENDING,
    );
    expect(proposal.payload.responses[0]).toMatchObject({
      answerRevisionId: unresolved.draftDocument!.revisionId,
      approvalId: expect.any(String),
      fieldKey: "mission",
      knowledgeKey: "organization.mission",
    });
    expect(proposal.payload.formHash).toEqual(expect.any(String));
    expect(proposal.externalActionRequest.taskExecutionAttemptId).toBe(
      formAttempt.id,
    );
  });

  it("refuses placeholder drafts before they enter the review queue", async () => {
    const fixture = await createFixture();
    await expect(
      prepareFormResponses(
        {
          formTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}placeholder`,
          questions: [
            {
              fieldKey: "budget",
              prompt: "What is your annual budget?",
              proposedAnswer: "TODO: insert the annual budget",
            },
          ],
          subject: { organizationId: fixture.organization.id },
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("contains unresolved placeholder text");
    await expect(
      prisma.task.count({
        where: { parentTaskId: fixture.applicationTask.id },
      }),
    ).resolves.toBe(0);
  });

  it("does not persist form responses on public tasks", async () => {
    const fixture = await createFixture();
    await prisma.task.update({
      where: { id: fixture.applicationTask.id },
      data: { isPublic: true },
    });

    await expect(
      prepareFormResponses(
        {
          formTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}public-form`,
          questions: [
            {
              fieldKey: "mission",
              prompt: "What is your mission?",
              proposedAnswer: "A reviewed answer must remain private.",
            },
          ],
          subject: { organizationId: fixture.organization.id },
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("Form task not found");

    const task = await prisma.task.findUniqueOrThrow({
      where: { id: fixture.applicationTask.id },
      select: { contextJson: true },
    });
    expect(task.contextJson).toBeNull();
  });

  it("does not reuse an approval that ambiguously covers multiple answer revisions", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };
    const prepared = await prepareFormResponses(
      {
        formTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}ambiguous-prepare`,
        questions: [
          {
            fieldKey: "mission",
            prompt: "What is your organization's mission?",
            proposedAnswer: "First candidate answer.",
          },
        ],
        subject,
      },
      fixture.user.id,
    );
    const unresolved = prepared.unresolved[0]!;
    const secondDocument = await createDocument({
      body: "Second candidate answer.",
      createdByUserId: fixture.user.id,
      idempotencyKey: `${TEST_PREFIX}ambiguous-second-answer`,
      organizationId: fixture.organization.id,
      taskId: unresolved.task.id,
      title: "Second candidate answer",
    });
    const attempt = await startTaskExecution(
      { taskId: unresolved.task.id },
      fixture.user.id,
    );
    for (const revisionId of [
      unresolved.draftDocument!.revisionId,
      secondDocument.revision.id,
    ]) {
      await submitTaskArtifact(
        {
          documentRevisionId: revisionId,
          label: "Candidate reusable answer",
          taskExecutionAttemptId: attempt.id,
        },
        fixture.user.id,
      );
    }
    const submitted = await submitTaskForVerification(
      {
        actualDurationSeconds: 60,
        method: "REVIEWER",
        outputSummary: "Reviewed both candidates.",
        taskExecutionAttemptId: attempt.id,
      },
      fixture.user.id,
    );
    await verifyTaskExecution(
      {
        criterionResults: [],
        result: "ACCEPTED",
        taskVerificationId: submitted.verification.id,
      },
      fixture.user.id,
    );

    const found = await findReviewedAnswers(
      {
        question: "What is your organization's mission?",
        subject,
      },
      fixture.user.id,
    );

    expect(found.answers).toEqual([]);
  });

  it("requires an exact revision when multiple approved answers match", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };

    for (const [index, answer] of [
      "First approved mission answer.",
      "Second approved mission answer.",
    ].entries()) {
      const reviewTask = await prisma.task.create({
        data: {
          createdByUserId: fixture.user.id,
          description: "Review one reusable mission answer.",
          contextJson: {
            reviewedAnswer: {
              canonicalQuestion: "What is your organization's mission?",
              contextTags: [],
              knowledgeKey: "organization.mission",
              originTaskId: null,
              sensitivity: "INTERNAL",
              sourceArtifactIds: [],
              subject,
              type: "REVIEWED_ANSWER",
              validUntil: null,
            },
          },
          id: `${TEST_PREFIX}answer_${index}`,
          isPublic: false,
          ownerOrganizationId: fixture.organization.id,
          status: TaskStatus.ACTIVE,
          title: `Review mission answer ${index}`,
        },
      });
      const document = await createDocument({
        body: answer,
        createdByUserId: fixture.user.id,
        idempotencyKey: `${TEST_PREFIX}answer_document_${index}`,
        organizationId: fixture.organization.id,
        taskId: reviewTask.id,
        title: `Mission answer ${index}`,
      });
      const attempt = await startTaskExecution(
        { taskId: reviewTask.id },
        fixture.user.id,
      );
      await submitTaskArtifact(
        {
          documentRevisionId: document.revision.id,
          label: "Reusable reviewed answer",
          taskExecutionAttemptId: attempt.id,
        },
        fixture.user.id,
      );
      const submitted = await submitTaskForVerification(
        {
          actualDurationSeconds: 60,
          method: "REVIEWER",
          outputSummary: "Approved for reuse.",
          taskExecutionAttemptId: attempt.id,
        },
        fixture.user.id,
      );
      await verifyTaskExecution(
        {
          criterionResults: [],
          result: "ACCEPTED",
          taskVerificationId: submitted.verification.id,
        },
        fixture.user.id,
      );
    }

    const targetForm = await prisma.task.create({
      data: {
        createdByUserId: fixture.user.id,
        description: "Prepare a form with an ambiguous reviewed answer.",
        id: `${TEST_PREFIX}ambiguous_target`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Target form",
      },
    });
    const result = await prepareFormResponses(
      {
        formTaskId: targetForm.id,
        idempotencyKey: `${TEST_PREFIX}ambiguous_target_prepare`,
        questions: [
          {
            fieldKey: "mission",
            knowledgeKey: "organization.mission",
            prompt: "Describe your mission.",
          },
        ],
        subject,
      },
      fixture.user.id,
    );

    expect(result).toMatchObject({
      readyForSubmission: false,
      unresolved: [
        {
          fieldKey: "mission",
          reason:
            "Multiple approved answers match this field; choose the exact revision to use.",
        },
      ],
    });
  });

  it("enforces delegated OAuth and subject ownership boundaries", async () => {
    const fixture = await createFixture();
    const request = {
      formTaskId: fixture.applicationTask.id,
      idempotencyKey: `${TEST_PREFIX}boundary`,
      questions: [{ fieldKey: "mission", prompt: "What is your mission?" }],
      subject: { organizationId: fixture.organization.id },
    };

    await expect(
      prepareFormResponses(request, fixture.user.id, {
        clientAccessBoundary: {
          allowPersonalPrivate: true,
          organizationIds: [],
        },
      }),
    ).rejects.toThrow("Form task not found");

    await expect(
      prepareFormResponses(
        {
          ...request,
          subject: { personId: fixture.person.id },
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("does not belong to the supplied subject");
  });

  it("does not propose a submission before the exact question set is prepared", async () => {
    const fixture = await createFixture();
    const attempt = await startTaskExecution(
      { taskId: fixture.applicationTask.id },
      fixture.user.id,
    );
    await expect(
      proposeFormSubmission(
        {
          responses: [
            {
              answerRevisionId: "revision_1",
              fieldKey: "mission",
              prompt: "What is your mission?",
            },
          ],
          destination: "https://example.test/apply",
          formTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}unprepared`,
          taskExecutionAttemptId: attempt.id,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("must be prepared before submission");
  });
});
