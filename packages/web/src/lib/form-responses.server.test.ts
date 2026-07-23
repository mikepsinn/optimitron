import {
  ExternalActionRequestStatus,
  FormSubmissionStatus,
  KnowledgeSensitivity,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskEdgeType,
  TaskStatus,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  findReviewedAnswers,
  prepareFormResponses,
  proposeFormSubmission,
} from "./form-responses.server";
import {
  decideExternalActionRequest,
  recordExternalActionResult,
} from "./tasks/external-action.server";
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
  await prisma.formResponse.deleteMany({
    where: {
      submission: {
        OR: [
          { taskId: { startsWith: TEST_PREFIX } },
          {
            formRevision: {
              form: { createdByUserId: { startsWith: TEST_PREFIX } },
            },
          },
        ],
      },
    },
  });
  await prisma.formSubmission.deleteMany({
    where: {
      OR: [
        { taskId: { startsWith: TEST_PREFIX } },
        { idempotencyKey: { startsWith: TEST_PREFIX } },
        {
          formRevision: {
            form: { createdByUserId: { startsWith: TEST_PREFIX } },
          },
        },
      ],
    },
  });
  await prisma.form.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
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
  await prisma.subject.deleteMany({
    where: {
      OR: [
        { personId: { startsWith: TEST_PREFIX } },
        { organizationId: { startsWith: TEST_PREFIX } },
      ],
    },
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
    data: { displayName: "Form Response Owner", id: `${TEST_PREFIX}person` },
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

async function approvePreparedAnswer(input: {
  answerRevisionId: string;
  reviewTaskId: string;
  userId: string;
}) {
  const attempt = await startTaskExecution(
    { taskId: input.reviewTaskId },
    input.userId,
  );
  await submitTaskArtifact(
    {
      documentRevisionId: input.answerRevisionId,
      label: "Reusable reviewed answer",
      taskExecutionAttemptId: attempt.id,
    },
    input.userId,
  );
  const submitted = await submitTaskForVerification(
    {
      actualDurationSeconds: 60,
      method: "REVIEWER",
      outputSummary: "Checked the answer for accuracy and tone.",
      taskExecutionAttemptId: attempt.id,
    },
    input.userId,
  );
  await verifyTaskExecution(
    {
      criterionResults: [],
      result: "ACCEPTED",
      taskVerificationId: submitted.verification.id,
    },
    input.userId,
  );
}

describe.sequential("reviewed form response loop", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("reuses one approved knowledge answer across forms and proposes the stored submission", async () => {
    const fixture = await createFixture();
    const subject = { organizationId: fixture.organization.id };
    const question = {
      contextTags: ["grant"],
      fieldKey: "mission",
      knowledgeKey: "organization.mission",
      prompt: "What is your organization's mission?",
    };
    const first = await prepareFormResponses(
      {
        formTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare_first`,
        questions: [
          {
            ...question,
            proposedAnswer:
              "We identify and execute the highest-value ways to reduce suffering.",
          },
        ],
        subject,
      },
      fixture.user.id,
    );
    expect(first.readyForSubmission).toBe(false);
    const unresolved = first.unresolved[0]!;
    expect(unresolved.draftDocument?.revisionId).toBeTruthy();
    await approvePreparedAnswer({
      answerRevisionId: unresolved.draftDocument!.revisionId,
      reviewTaskId: unresolved.task.id,
      userId: fixture.user.id,
    });

    const prepared = await prepareFormResponses(
      {
        formTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare_first`,
        questions: [question],
        subject,
      },
      fixture.user.id,
    );
    expect(prepared).toMatchObject({
      formSubmissionId: first.formSubmissionId,
      readyForSubmission: true,
      unresolved: [],
    });
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

    const secondTask = await prisma.task.create({
      data: {
        createdByUserId: fixture.user.id,
        description: "Submit another application.",
        id: `${TEST_PREFIX}second_task`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Apply for another grant",
      },
    });
    const secondQuestion = {
      contextTags: ["application"],
      fieldKey: "mission_statement",
      knowledgeKey: "organization.mission",
      prompt: "Please describe your organization's mission.",
      sensitivity: KnowledgeSensitivity.RESTRICTED,
      validUntil: "2030-01-01T00:00:00.000Z",
    };
    const reused = await prepareFormResponses(
      {
        formTaskId: secondTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare_second`,
        questions: [secondQuestion],
        subject,
      },
      fixture.user.id,
    );
    expect(reused).toMatchObject({
      readyForSubmission: false,
      resolved: [],
      unresolved: [
        {
          reason:
            "This answer is sensitive; choose its exact approved revision before reuse.",
        },
      ],
    });
    await expect(
      prisma.knowledgeAnswer.findFirstOrThrow({
        where: { subject: { organizationId: fixture.organization.id } },
        select: { contextTags: true, sensitivity: true, validUntil: true },
      }),
    ).resolves.toMatchObject({
      contextTags: ["application", "grant"],
      sensitivity: KnowledgeSensitivity.RESTRICTED,
      validUntil: new Date("2030-01-01T00:00:00.000Z"),
    });
    const explicitlyApproved = await prepareFormResponses(
      {
        formTaskId: secondTask.id,
        idempotencyKey: `${TEST_PREFIX}prepare_second`,
        questions: [
          {
            ...secondQuestion,
            answerRevisionId: unresolved.draftDocument!.revisionId,
          },
        ],
        subject,
      },
      fixture.user.id,
    );
    expect(explicitlyApproved.readyForSubmission).toBe(true);
    await expect(
      prisma.knowledgeAnswer.count({
        where: { subject: { organizationId: fixture.organization.id } },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.taskEdge.count({
        where: {
          edgeType: TaskEdgeType.BLOCKS,
          fromTaskId: unresolved.task.id,
          toTaskId: { in: [fixture.applicationTask.id, secondTask.id] },
        },
      }),
    ).resolves.toBe(2);

    const execution = await startTaskExecution(
      { taskId: secondTask.id },
      fixture.user.id,
    );
    const proposal = await proposeFormSubmission(
      {
        destination: "https://example.test/apply",
        formSubmissionId: explicitlyApproved.formSubmissionId,
        taskExecutionAttemptId: execution.id,
      },
      fixture.user.id,
    );
    expect(proposal.externalActionRequest.status).toBe(
      ExternalActionRequestStatus.PENDING,
    );
    expect(proposal.payload.responses[0]).toMatchObject({
      answerRevisionId: unresolved.draftDocument!.revisionId,
      fieldKey: "mission_statement",
      knowledgeKey: "organization.mission",
    });
    await expect(
      proposeFormSubmission(
        {
          destination: "https://example.test/apply",
          formSubmissionId: explicitlyApproved.formSubmissionId,
          taskExecutionAttemptId: execution.id,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("Form submission has already been proposed");
    await expect(
      prisma.formSubmission.findUniqueOrThrow({
        where: { id: reused.formSubmissionId },
        select: {
          externalActionRequestId: true,
          responses: { select: { valueJson: true } },
          status: true,
        },
      }),
    ).resolves.toMatchObject({
      externalActionRequestId: proposal.externalActionRequest.id,
      responses: [{ valueJson: null }],
      status: FormSubmissionStatus.DRAFT,
    });
    await decideExternalActionRequest(
      {
        decision: "APPROVE",
        externalActionRequestId: proposal.externalActionRequest.id,
      },
      fixture.user.id,
    );
    await recordExternalActionResult(
      {
        externalActionRequestId: proposal.externalActionRequest.id,
        receipt: { confirmation: "submitted" },
        result: "EXECUTED",
      },
      fixture.user.id,
    );
    await expect(
      prisma.formSubmission.findUniqueOrThrow({
        where: { id: reused.formSubmissionId },
        select: { status: true, submittedAt: true },
      }),
    ).resolves.toMatchObject({
      status: FormSubmissionStatus.SUBMITTED,
      submittedAt: expect.any(Date),
    });
  });

  it("deduplicates the same unresolved answer before either form is completed", async () => {
    const fixture = await createFixture();
    const secondTask = await prisma.task.create({
      data: {
        createdByUserId: fixture.user.id,
        description: "Submit another application in parallel.",
        id: `${TEST_PREFIX}parallel_task`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Parallel application",
      },
    });
    const request = {
      questions: [
        {
          contextTags: ["grant"],
          fieldKey: "mission",
          knowledgeKey: "organization.mission",
          prompt: "What is your mission?",
        },
      ],
      subject: { organizationId: fixture.organization.id },
    };
    const first = await prepareFormResponses(
      {
        ...request,
        formTaskId: fixture.applicationTask.id,
        idempotencyKey: `${TEST_PREFIX}parallel_first`,
      },
      fixture.user.id,
    );
    const second = await prepareFormResponses(
      {
        ...request,
        formTaskId: secondTask.id,
        idempotencyKey: `${TEST_PREFIX}parallel_second`,
      },
      fixture.user.id,
    );
    expect(second.unresolved[0]!.task.id).toBe(first.unresolved[0]!.task.id);
    await expect(
      prepareFormResponses(
        {
          ...request,
          formTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}parallel_first`,
          questions: [
            {
              fieldKey: "different",
              knowledgeKey: "organization.different",
              prompt: "What is something else?",
            },
          ],
        },
        fixture.user.id,
      ),
    ).rejects.toThrow(
      "Form preparation idempotency key was reused with different fields",
    );
    await expect(
      prisma.knowledgeAnswer.count({
        where: { subject: { organizationId: fixture.organization.id } },
      }),
    ).resolves.toBe(1);
  });

  it("lets another organization admin revise an organization-owned form", async () => {
    const fixture = await createFixture();
    const first = await prepareFormResponses(
      {
        formKey: "shared-funder-form",
        formTaskId: fixture.applicationTask.id,
        formTitle: "Shared funder form",
        idempotencyKey: `${TEST_PREFIX}shared_first`,
        questions: [
          {
            fieldKey: "mission",
            knowledgeKey: "organization.mission",
            prompt: "What is your mission?",
          },
        ],
        subject: { organizationId: fixture.organization.id },
      },
      fixture.user.id,
    );
    const adminPerson = await prisma.person.create({
      data: {
        displayName: "Second Form Admin",
        id: `${TEST_PREFIX}admin_person`,
      },
    });
    const adminUser = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}admin@example.test`,
        id: `${TEST_PREFIX}admin_user`,
        personId: adminPerson.id,
      },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: fixture.organization.id,
        role: OrganizationMemberRole.ADMIN,
        userId: adminUser.id,
      },
    });
    const adminTask = await prisma.task.create({
      data: {
        createdByUserId: adminUser.id,
        description: "Revise the shared funder form for the organization.",
        id: `${TEST_PREFIX}admin_task`,
        isPublic: false,
        ownerOrganizationId: fixture.organization.id,
        status: TaskStatus.ACTIVE,
        title: "Update the shared funder form",
      },
    });

    const revised = await prepareFormResponses(
      {
        formKey: "shared-funder-form",
        formTaskId: adminTask.id,
        formTitle: "Updated shared funder form",
        idempotencyKey: `${TEST_PREFIX}shared_second`,
        questions: [
          {
            fieldKey: "mission",
            knowledgeKey: "organization.mission",
            prompt: "Describe the organization's mission.",
          },
        ],
        subject: { organizationId: fixture.organization.id },
      },
      adminUser.id,
    );

    expect(revised.formId).toBe(first.formId);
    expect(revised.formRevisionId).not.toBe(first.formRevisionId);
    await expect(
      prisma.form.findUniqueOrThrow({
        where: { id: first.formId },
        select: {
          currentRevisionId: true,
          revisions: { select: { createdByUserId: true } },
          title: true,
        },
      }),
    ).resolves.toMatchObject({
      currentRevisionId: revised.formRevisionId,
      revisions: expect.arrayContaining([
        expect.objectContaining({ createdByUserId: adminUser.id }),
      ]),
      title: "Updated shared funder form",
    });
  });

  it("rejects placeholder drafts and public task storage", async () => {
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
    await prisma.task.update({
      where: { id: fixture.applicationTask.id },
      data: { isPublic: true },
    });
    await expect(
      prepareFormResponses(
        {
          formTaskId: fixture.applicationTask.id,
          idempotencyKey: `${TEST_PREFIX}public`,
          questions: [{ fieldKey: "mission", prompt: "What is your mission?" }],
          subject: { organizationId: fixture.organization.id },
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("Form task not found");
  });

  it("enforces delegated OAuth, subject ownership, and prepared-submission boundaries", async () => {
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
        { ...request, subject: { personId: fixture.person.id } },
        fixture.user.id,
      ),
    ).rejects.toThrow("does not belong to the supplied subject");
    await expect(
      proposeFormSubmission(
        {
          destination: "https://example.test/apply",
          formSubmissionId: `${TEST_PREFIX}missing_submission`,
          taskExecutionAttemptId: `${TEST_PREFIX}missing_attempt`,
        },
        fixture.user.id,
      ),
    ).rejects.toThrow("Prepared form submission not found");
  });
});
