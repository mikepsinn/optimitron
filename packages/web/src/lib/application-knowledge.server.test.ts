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
  findReusableAnswers,
  prepareApplicationQuestions,
  proposeApplicationSubmission,
} from "./application-knowledge.server";
import {
  startTaskExecution,
  submitTaskArtifact,
  submitTaskForVerification,
  verifyTaskExecution,
} from "./tasks/execution-lifecycle.server";

const TEST_PREFIX = "application_knowledge_";

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
      displayName: "Application Knowledge Owner",
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
      name: "Application Knowledge Organization",
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

describe.sequential("reviewed application knowledge loop", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("turns one unresolved question into one approved reusable revision and one pending exact submission", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };
    const prepared = await prepareApplicationQuestions(
      {
        applicationTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare`,
        questions: [
          {
            contextTags: ["grant"],
            key: "mission",
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
        label: "Reusable application answer",
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

    const found = await findReusableAnswers(
      {
        contextTags: ["grant"],
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
      questionTaskId: unresolved.task.id,
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
    const mismatched = await prepareApplicationQuestions(
      {
        applicationTaskId: secondApplication.id,
        idempotencyKey: `${TEST_PREFIX}mismatched-answer`,
        questions: [
          {
            answerRevisionId: unresolved.draftDocument!.revisionId,
            contextTags: ["grant"],
            key: "budget",
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
          key: "budget",
          reason:
            "The supplied answer revision is not an approved answer for this question and subject.",
        },
      ],
    });

    const reused = await prepareApplicationQuestions(
      {
        applicationTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare-retry`,
        questions: [
          {
            contextTags: ["grant"],
            key: "mission",
            prompt: "What is your organization's mission?",
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
          key: "mission",
        },
      ],
      unresolved: [],
    });
    await expect(
      proposeApplicationSubmission(
        {
          answers: [
            {
              answerRevisionId: "unrelated_revision",
              key: "mission",
              prompt: "What is your organization's mission?",
            },
          ],
          applicationTaskId: fixture.applicationTask.id,
          destination: "https://example.test/apply",
          idempotencyKey: `${TEST_PREFIX}wrong-answer`,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("does not match the prepared application");

    const proposal = await proposeApplicationSubmission(
      {
        answers: [
          {
            answerRevisionId: unresolved.draftDocument!.revisionId,
            key: "mission",
            prompt: "What is your organization's mission?",
          },
        ],
        applicationTaskId: fixture.applicationTask.id,
        destination: "https://example.test/apply",
        idempotencyKey: `${TEST_PREFIX}submit`,
      },
      fixture.user.id,
    );

    expect(proposal.approvalRequired).toBe(true);
    expect(proposal.externalActionRequest.status).toBe(
      ExternalActionRequestStatus.PENDING,
    );
    expect(proposal.payload.answers[0]).toMatchObject({
      answerRevisionId: unresolved.draftDocument!.revisionId,
      key: "mission",
    });
  });

  it("refuses placeholder drafts before they enter the review queue", async () => {
    const fixture = await createFixture();
    await expect(
      prepareApplicationQuestions(
        {
          applicationTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}placeholder`,
          questions: [
            {
              key: "budget",
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

  it("does not reuse an approval that ambiguously covers multiple answer revisions", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };
    const prepared = await prepareApplicationQuestions(
      {
        applicationTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}ambiguous-prepare`,
        questions: [
          {
            key: "mission",
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

    const found = await findReusableAnswers(
      {
        question: "What is your organization's mission?",
        subject,
      },
      fixture.user.id,
    );

    expect(found.answers).toEqual([]);
  });

  it("enforces delegated OAuth and subject ownership boundaries", async () => {
    const fixture = await createFixture();
    const request = {
      applicationTaskId: fixture.applicationTask.id,
      idempotencyKey: `${TEST_PREFIX}boundary`,
      questions: [{ key: "mission", prompt: "What is your mission?" }],
      subject: { organizationId: fixture.organization.id },
    };

    await expect(
      prepareApplicationQuestions(request, fixture.user.id, {
        clientAccessBoundary: {
          allowPersonalPrivate: true,
          organizationIds: [],
        },
      }),
    ).rejects.toThrow("Application task not found");

    await expect(
      prepareApplicationQuestions(
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
    await expect(
      proposeApplicationSubmission(
        {
          answers: [
            {
              answerRevisionId: "revision_1",
              key: "mission",
              prompt: "What is your mission?",
            },
          ],
          applicationTaskId: fixture.applicationTask.id,
          destination: "https://example.test/apply",
          idempotencyKey: `${TEST_PREFIX}unprepared`,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("must be prepared before submission");
  });
});
