import {
  AgentExecutorStatus,
  ExternalActionRequestStatus,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskClaimStatus,
  TaskExecutionAttemptStatus,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { acquireLease, getTaskCoordinationContext } from "./agent-lease.server";
import {
  getTaskAuditTrail,
  startTaskExecution,
  submitTaskArtifact,
  submitTaskForVerification,
  verifyTaskExecution,
} from "./execution-lifecycle.server";
import {
  decideExternalActionRequest,
  proposeExternalAction,
  recordExternalActionResult,
} from "./external-action.server";

const TEST_PREFIX = "execution_lifecycle_";

async function cleanup() {
  await prisma.agentTaskLease.deleteMany({
    where: { taskId: { startsWith: TEST_PREFIX } },
  });
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

async function submitCompletedAttempt(
  taskId: string,
  actorUserId: string,
  options?: { actualCost?: { currency: string; minorUnits: number } },
) {
  const attempt = await startTaskExecution({ taskId }, actorUserId);
  await submitTaskArtifact(
    {
      structuredResult: { completed: true },
      taskExecutionAttemptId: attempt.id,
    },
    actorUserId,
  );
  const submission = await submitTaskForVerification(
    {
      ...(options?.actualCost ? { actualCost: options.actualCost } : {}),
      actualDurationSeconds: 120,
      method: TaskVerificationMethod.REVIEWER,
      outputSummary: "Executor submitted the result for verification.",
      taskExecutionAttemptId: attempt.id,
    },
    actorUserId,
  );
  return { attempt, submission };
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

  it("persists the agent run context on the existing execution metadata", async () => {
    const actor = await createUser("run_context");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "run_context_task",
    });
    const runContext = {
      agentRunId: "run-2026-08-09",
      baseCommit: "abc123def456",
      branch: "feature/mcp-agent-coordination",
      isolationMode: "ISOLATED_WORKTREE" as const,
      ownedFileGlobs: ["packages/web/src/lib/**", "AGENTS.md"],
      worktreePath: "C:/worktrees/mcp-agent-coordination",
    };

    const attempt = await startTaskExecution(
      { runContext, taskId: task.id },
      actor.user.id,
    );
    await acquireLease(task.id, "agent-run-context", 3_600);

    await expect(
      prisma.taskExecutionAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        select: { metadata: true },
      }),
    ).resolves.toEqual({
      metadata: {
        runContext,
        startedByUserId: actor.user.id,
      },
    });
    await expect(getTaskCoordinationContext(task.id)).resolves.toMatchObject({
      activeExecution: {
        id: attempt.id,
        runContext,
        status: TaskExecutionAttemptStatus.RUNNING,
      },
      activeLease: { agentId: "agent-run-context" },
    });
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

describe.sequential("task verification decisions", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("accepts a pending verification and copies attempt actuals onto the task", async () => {
    const { organization, owner, starter } =
      await createOrganizationWithMembers();
    const task = await createTask({
      creatorUserId: starter.user.id,
      id: "verify_accept_task",
      ownerOrganizationId: organization.id,
    });
    const { submission } = await submitCompletedAttempt(
      task.id,
      starter.user.id,
      { actualCost: { currency: "USD", minorUnits: 2500 } },
    );

    const verification = await verifyTaskExecution(
      {
        criterionResults: [
          { criterion: "A durable result was submitted", passed: true },
        ],
        result: "ACCEPTED",
        taskVerificationId: submission.verification.id,
      },
      owner.user.id,
    );

    expect(verification.result).toBe(TaskVerificationResult.ACCEPTED);
    expect(verification.selfReviewed).toBe(false);
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        select: {
          actualCashCostUsd: true,
          actualEffortSeconds: true,
          status: true,
          verifiedByUserId: true,
        },
      }),
    ).resolves.toEqual({
      actualCashCostUsd: 25,
      actualEffortSeconds: 120,
      status: TaskStatus.VERIFIED,
      verifiedByUserId: owner.user.id,
    });
  });

  it("rejects a pending verification and reopens the task for a fresh attempt", async () => {
    const { organization, owner, starter } =
      await createOrganizationWithMembers();
    const task = await createTask({
      creatorUserId: starter.user.id,
      id: "verify_reject_task",
      ownerOrganizationId: organization.id,
    });
    const { attempt, submission } = await submitCompletedAttempt(
      task.id,
      starter.user.id,
    );

    const verification = await verifyTaskExecution(
      {
        criterionResults: [
          { criterion: "A durable result was submitted", passed: false },
        ],
        result: "REJECTED",
        taskVerificationId: submission.verification.id,
      },
      owner.user.id,
    );

    expect(verification.result).toBe(TaskVerificationResult.REJECTED);
    await expect(
      prisma.taskExecutionAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskExecutionAttemptStatus.REJECTED });
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        select: { status: true, verifiedAt: true, verifiedByUserId: true },
      }),
    ).resolves.toEqual({
      status: TaskStatus.ACTIVE,
      verifiedAt: null,
      verifiedByUserId: null,
    });

    // Regression: the rejected attempt must release the active-attempt guard.
    const retry = await startTaskExecution(
      { taskId: task.id },
      starter.user.id,
    );
    expect(retry.id).not.toBe(attempt.id);
    expect(retry.status).toBe(TaskExecutionAttemptStatus.RUNNING);
  });

  it("blocks unrelated reviewers, records self-review, and refuses a second decision", async () => {
    const actor = await createUser("self_verifier");
    const unrelated = await createUser("verify_unrelated");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "self_verify_task",
    });
    const { submission } = await submitCompletedAttempt(
      task.id,
      actor.user.id,
    );

    await expect(
      verifyTaskExecution(
        {
          criterionResults: [
            { criterion: "A durable result was submitted", passed: true },
          ],
          result: "ACCEPTED",
          taskVerificationId: submission.verification.id,
        },
        unrelated.user.id,
      ),
    ).rejects.toThrow("Task verification not found");

    const verification = await verifyTaskExecution(
      {
        criterionResults: [
          { criterion: "A durable result was submitted", passed: true },
        ],
        result: "ACCEPTED",
        taskVerificationId: submission.verification.id,
      },
      actor.user.id,
    );
    expect(verification.result).toBe(TaskVerificationResult.ACCEPTED);
    expect(verification.selfReviewed).toBe(true);

    await expect(
      verifyTaskExecution(
        {
          criterionResults: [
            { criterion: "A durable result was submitted", passed: false },
          ],
          result: "REJECTED",
          taskVerificationId: submission.verification.id,
        },
        actor.user.id,
      ),
    ).rejects.toThrow("Task verification not found");
    await expect(
      prisma.taskVerification.findUniqueOrThrow({
        where: { id: submission.verification.id },
        select: { result: true },
      }),
    ).resolves.toEqual({ result: TaskVerificationResult.ACCEPTED });
  });

  it("requires acceptance criteria only for rule-based verification methods", async () => {
    const actor = await createUser("no_criteria");
    const task = await prisma.task.create({
      data: {
        createdByUserId: actor.user.id,
        description: "Task created without an acceptance-criteria snapshot.",
        id: `${TEST_PREFIX}no_criteria_task`,
        isPublic: false,
        title: "Execute no_criteria_task",
      },
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

    await expect(
      submitTaskForVerification(
        {
          actualDurationSeconds: 60,
          method: TaskVerificationMethod.DETERMINISTIC,
          outputSummary: "Rule-based submission without criteria.",
          taskExecutionAttemptId: attempt.id,
        },
        actor.user.id,
      ),
    ).rejects.toThrow("Task has no acceptance criteria snapshot");
    // The failed rule-based submission must not consume the attempt.
    await expect(
      prisma.taskExecutionAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: TaskExecutionAttemptStatus.RUNNING });

    const submission = await submitTaskForVerification(
      {
        actualDurationSeconds: 60,
        method: TaskVerificationMethod.REVIEWER,
        outputSummary: "Reviewer submission without criteria.",
        taskExecutionAttemptId: attempt.id,
      },
      actor.user.id,
    );
    expect(submission.verification.result).toBe(TaskVerificationResult.PENDING);
    expect(submission.verification.acceptanceCriteriaSnapshotJson).toEqual({
      acceptanceCriteria: [],
      expectedDeliverable: null,
    });
  });

  it("returns the audit trail to the task creator and hides it from unrelated users", async () => {
    const actor = await createUser("audit_creator");
    const unrelated = await createUser("audit_unrelated");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "audit_trail_task",
    });
    const { attempt } = await submitCompletedAttempt(task.id, actor.user.id);

    const auditTrail = await getTaskAuditTrail(task.id, actor.user.id);
    expect(auditTrail.id).toBe(task.id);
    expect(auditTrail.executionAttempts).toHaveLength(1);
    expect(auditTrail.executionAttempts[0]?.id).toBe(attempt.id);
    expect(auditTrail.executionAttempts[0]?.artifacts).toHaveLength(1);
    expect(auditTrail.executionAttempts[0]?.verifications).toHaveLength(1);

    await expect(
      getTaskAuditTrail(task.id, unrelated.user.id),
    ).rejects.toThrow("Task not found");
  });
});
