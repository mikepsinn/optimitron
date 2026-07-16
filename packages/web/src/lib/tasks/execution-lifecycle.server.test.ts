import {
  AgentExecutorStatus,
  ExternalActionRequestStatus,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskClaimStatus,
  TaskExecutionAttemptStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  startTaskExecution,
  submitTaskArtifact,
  submitTaskForVerification,
} from "./execution-lifecycle.server";
import {
  decideExternalActionRequest,
  proposeExternalAction,
  recordExternalActionResult,
} from "./external-action.server";

const TEST_PREFIX = "execution_lifecycle_";

async function cleanup() {
  await prisma.externalActionRequest.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskVerification.deleteMany({
    where: {
      taskExecutionAttempt: { taskId: { startsWith: TEST_PREFIX } },
    },
  });
  await prisma.taskExecutionArtifact.deleteMany({
    where: {
      taskExecutionAttempt: { taskId: { startsWith: TEST_PREFIX } },
    },
  });
  await prisma.taskExecutionAttempt.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskClaim.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
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
  await prisma.agentExecutor.deleteMany({
    where: { agentKey: { startsWith: TEST_PREFIX } },
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
      displayName: `Execution ${suffix}`,
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

async function createTask(input: {
  creatorUserId: string;
  id: string;
  isPublic?: boolean;
  ownerOrganizationId?: string;
}) {
  return prisma.task.create({
    data: {
      contextJson: {
        acceptanceCriteria: ["A durable result was submitted"],
        expectedDeliverable: "A durable result",
      },
      createdByUserId: input.creatorUserId,
      description: "Execution lifecycle regression fixture.",
      id: `${TEST_PREFIX}${input.id}`,
      isPublic: input.isPublic ?? false,
      ownerOrganizationId: input.ownerOrganizationId,
      title: `Execute ${input.id}`,
    },
  });
}

async function createOrganizationWithMembers() {
  const owner = await createUser("owner");
  const starter = await createUser("starter");
  const outsider = await createUser("outsider");
  const organization = await prisma.organization.create({
    data: {
      creatorId: owner.user.id,
      id: `${TEST_PREFIX}organization`,
      name: "Execution Lifecycle Organization",
      slug: `${TEST_PREFIX}organization`,
      status: OrgStatus.APPROVED,
      type: OrgType.OTHER,
    },
  });
  await prisma.organizationMember.createMany({
    data: [
      {
        organizationId: organization.id,
        role: OrganizationMemberRole.OWNER,
        userId: owner.user.id,
      },
      {
        organizationId: organization.id,
        role: OrganizationMemberRole.MEMBER,
        userId: starter.user.id,
      },
      {
        organizationId: organization.id,
        role: OrganizationMemberRole.MEMBER,
        userId: outsider.user.id,
      },
    ],
  });
  const agent = await prisma.agentExecutor.create({
    data: {
      agentKey: `${TEST_PREFIX}agent`,
      displayName: "Execution Lifecycle Agent",
      status: AgentExecutorStatus.ACTIVE,
    },
  });
  return { agent, organization, outsider, owner, starter };
}

describe.sequential("private execution lifecycle boundaries", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("creates only one active attempt under concurrent starts", async () => {
    const actor = await createUser("concurrency");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "concurrency_task",
    });

    const results = await Promise.allSettled([
      startTaskExecution({ taskId: task.id }, actor.user.id),
      startTaskExecution({ taskId: task.id }, actor.user.id),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(
      1,
    );
    await expect(
      prisma.taskExecutionAttempt.count({
        where: {
          deletedAt: null,
          status: TaskExecutionAttemptStatus.RUNNING,
          taskId: task.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it("lets a public claimant contribute to the attempt linked to their claim", async () => {
    const creator = await createUser("public_creator");
    const claimant = await createUser("public_claimant");
    const task = await createTask({
      creatorUserId: creator.user.id,
      id: "public_claim_task",
      isPublic: true,
    });
    const claim = await prisma.taskClaim.create({
      data: {
        status: TaskClaimStatus.IN_PROGRESS,
        taskId: task.id,
        userId: claimant.user.id,
      },
    });

    const attempt = await startTaskExecution(
      { taskId: task.id },
      claimant.user.id,
    );
    await expect(
      prisma.taskExecutionAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        select: { taskClaimId: true },
      }),
    ).resolves.toEqual({ taskClaimId: claim.id });

    await submitTaskArtifact(
      {
        structuredResult: { completed: true },
        taskExecutionAttemptId: attempt.id,
      },
      claimant.user.id,
    );
    const submission = await submitTaskForVerification(
      {
        actualDurationSeconds: 60,
        method: TaskVerificationMethod.REVIEWER,
        outputSummary: "Claimant submitted the result.",
        taskExecutionAttemptId: attempt.id,
      },
      claimant.user.id,
    );

    expect(submission.verification.result).toBe(TaskVerificationResult.PENDING);
  });

  it("rejects artifact submission after the parent task is soft-deleted", async () => {
    const actor = await createUser("deleted_artifact");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "deleted_artifact_task",
    });
    const attempt = await startTaskExecution(
      { taskId: task.id },
      actor.user.id,
    );
    await prisma.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date() },
    });

    await expect(
      submitTaskArtifact(
        {
          structuredResult: { completed: true },
          taskExecutionAttemptId: attempt.id,
        },
        actor.user.id,
      ),
    ).rejects.toThrow("Task execution attempt not found");
  });

  it("rejects verification submission after the parent task is soft-deleted", async () => {
    const actor = await createUser("deleted_verification");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "deleted_verification_task",
    });
    const attempt = await startTaskExecution(
      { taskId: task.id },
      actor.user.id,
    );
    await submitTaskArtifact(
      {
        structuredResult: { completed: true },
        taskExecutionAttemptId: attempt.id,
      },
      actor.user.id,
    );
    await prisma.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date() },
    });

    await expect(
      submitTaskForVerification(
        {
          actualDurationSeconds: 60,
          outputSummary: "The deleted task must not accept verification.",
          taskExecutionAttemptId: attempt.id,
        },
        actor.user.id,
      ),
    ).rejects.toThrow("Task execution attempt not found");
  });

  it("lets a linked public claimant propose an external action but rejects an unrelated user", async () => {
    const creator = await createUser("claim_action_creator");
    const claimant = await createUser("claim_action_claimant");
    const unrelated = await createUser("claim_action_unrelated");
    const task = await createTask({
      creatorUserId: creator.user.id,
      id: "claim_action_task",
      isPublic: true,
    });
    await prisma.taskClaim.create({
      data: {
        status: TaskClaimStatus.IN_PROGRESS,
        taskId: task.id,
        userId: claimant.user.id,
      },
    });
    const attempt = await startTaskExecution(
      { taskId: task.id },
      claimant.user.id,
    );

    await expect(
      proposeExternalAction(
        {
          destination: "https://example.test/claimant-submit",
          idempotencyKey: `${TEST_PREFIX}claimant_external_action`,
          operation: "submit_claimant_form",
          payload: { answer: "claimant" },
          taskExecutionAttemptId: attempt.id,
          taskId: task.id,
        },
        claimant.user.id,
      ),
    ).resolves.toMatchObject({
      requestedByUserId: claimant.user.id,
      taskExecutionAttemptId: attempt.id,
      taskId: task.id,
    });
    await expect(
      proposeExternalAction(
        {
          destination: "https://example.test/unrelated-submit",
          idempotencyKey: `${TEST_PREFIX}unrelated_external_action`,
          operation: "submit_unrelated_form",
          payload: { answer: "unrelated" },
          taskExecutionAttemptId: attempt.id,
          taskId: task.id,
        },
        unrelated.user.id,
      ),
    ).rejects.toThrow("Task not found");
  });

  it("rejects an unrelated organization member without attributing their artifact to the agent", async () => {
    const { agent, organization, outsider, starter } =
      await createOrganizationWithMembers();
    const task = await createTask({
      creatorUserId: starter.user.id,
      id: "agent_contribution_task",
      ownerOrganizationId: organization.id,
    });
    const attempt = await startTaskExecution(
      { agentExecutorId: agent.id, taskId: task.id },
      starter.user.id,
    );

    await expect(
      submitTaskArtifact(
        {
          structuredResult: { forged: true },
          taskExecutionAttemptId: attempt.id,
        },
        outsider.user.id,
      ),
    ).rejects.toThrow("Task execution attempt not found");
    await submitTaskArtifact(
      {
        structuredResult: { completed: true },
        taskExecutionAttemptId: attempt.id,
      },
      starter.user.id,
    );

    await expect(
      prisma.taskExecutionArtifact.findFirstOrThrow({
        where: { taskExecutionAttemptId: attempt.id },
        select: {
          submittedByAgentExecutorId: true,
          submittedByUserId: true,
        },
      }),
    ).resolves.toEqual({
      submittedByAgentExecutorId: agent.id,
      submittedByUserId: null,
    });
    await expect(
      submitTaskForVerification(
        {
          actualDurationSeconds: 60,
          outputSummary: "Unrelated member tried to submit the result.",
          taskExecutionAttemptId: attempt.id,
        },
        outsider.user.id,
      ),
    ).rejects.toThrow("Task execution attempt not found");
  });

  it("allows only the originating executor client to record an approved external action result", async () => {
    const { agent, organization, outsider, owner } =
      await createOrganizationWithMembers();
    const task = await createTask({
      creatorUserId: owner.user.id,
      id: "external_action_task",
      ownerOrganizationId: organization.id,
    });
    const attempt = await startTaskExecution(
      { agentExecutorId: agent.id, taskId: task.id },
      owner.user.id,
    );
    const request = await proposeExternalAction(
      {
        destination: "https://example.test/submit",
        idempotencyKey: `${TEST_PREFIX}external_action_request`,
        operation: "submit_form",
        payload: { answer: "approved" },
        taskExecutionAttemptId: attempt.id,
        taskId: task.id,
      },
      owner.user.id,
    );
    await decideExternalActionRequest(
      {
        decision: "APPROVE",
        externalActionRequestId: request.id,
      },
      owner.user.id,
    );

    await expect(
      recordExternalActionResult(
        {
          externalActionRequestId: request.id,
          receipt: { receiptId: "forged" },
          result: "EXECUTED",
        },
        outsider.user.id,
      ),
    ).rejects.toThrow("External action request not found");

    const executed = await recordExternalActionResult(
      {
        externalActionRequestId: request.id,
        receipt: { receiptId: "real" },
        result: "EXECUTED",
      },
      owner.user.id,
    );
    expect(executed.status).toBe(ExternalActionRequestStatus.EXECUTED);
    await expect(
      prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: request.id },
        select: {
          executedByAgentExecutorId: true,
          executedByUserId: true,
          status: true,
        },
      }),
    ).resolves.toEqual({
      executedByAgentExecutorId: agent.id,
      executedByUserId: null,
      status: ExternalActionRequestStatus.EXECUTED,
    });
  });
});
