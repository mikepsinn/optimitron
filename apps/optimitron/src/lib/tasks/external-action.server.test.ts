import {
  ExternalActionRequestStatus,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  decideExternalActionRequest,
  expireExternalActionRequest,
  finalizeApprovedExternalAction,
  listExternalActionRequestsForHuman,
  proposeExternalAction,
  recordExternalActionResult,
} from "./external-action.server";

const TEST_PREFIX = "external_action_boundary_";

async function cleanup() {
  await prisma.externalActionRequest.deleteMany({
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
      displayName: `External Action ${suffix}`,
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
  ownerOrganizationId?: string;
}) {
  return prisma.task.create({
    data: {
      createdByUserId: input.creatorUserId,
      description: "External action boundary fixture.",
      id: `${TEST_PREFIX}${input.id}`,
      isPublic: false,
      ownerOrganizationId: input.ownerOrganizationId,
      title: `Act on ${input.id}`,
    },
  });
}

async function createOrganization(
  creatorUserId: string,
  members: Array<{ role: OrganizationMemberRole; userId: string }>,
) {
  const organization = await prisma.organization.create({
    data: {
      creatorId: creatorUserId,
      id: `${TEST_PREFIX}organization`,
      name: "External Action Boundary Organization",
      slug: `${TEST_PREFIX}organization`,
      status: OrgStatus.APPROVED,
      type: OrgType.OTHER,
    },
  });
  await prisma.organizationMember.createMany({
    data: members.map((member) => ({
      organizationId: organization.id,
      role: member.role,
      userId: member.userId,
    })),
  });
  return organization;
}

async function proposeRequest(
  taskId: string,
  actorUserId: string,
  suffix: string,
) {
  return proposeExternalAction(
    {
      destination: `https://example.test/${suffix}`,
      idempotencyKey: `${TEST_PREFIX}${suffix}`,
      operation: `submit_${suffix}`,
      payload: { answer: suffix },
      taskId,
    },
    actorUserId,
  );
}

describe.sequential("external action request boundaries", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("approves a pending request and pins the approved payload hash", async () => {
    const actor = await createUser("proposer");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "approve_task",
    });
    const request = await proposeRequest(task.id, actor.user.id, "approve");
    expect(request.status).toBe(ExternalActionRequestStatus.PENDING);

    const decided = await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      actor.user.id,
    );

    expect(decided.status).toBe(ExternalActionRequestStatus.APPROVED);
    expect(decided.approvedPayloadHash).toBe(request.payloadHash);
    expect(decided.approvedByUserId).toBe(actor.user.id);
    expect(decided.approvedAt).not.toBeNull();
  });

  it("refuses to re-decide a request that already reached a terminal decision", async () => {
    const actor = await createUser("redecider");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "redecide_task",
    });

    const approved = await proposeRequest(
      task.id,
      actor.user.id,
      "redecide_approved",
    );
    await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: approved.id },
      actor.user.id,
    );
    await expect(
      decideExternalActionRequest(
        { decision: "REJECT", externalActionRequestId: approved.id },
        actor.user.id,
      ),
    ).rejects.toThrow("External action request not found");
    await expect(
      prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: approved.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: ExternalActionRequestStatus.APPROVED });

    const rejected = await proposeRequest(
      task.id,
      actor.user.id,
      "redecide_rejected",
    );
    const rejection = await decideExternalActionRequest(
      { decision: "REJECT", externalActionRequestId: rejected.id },
      actor.user.id,
    );
    expect(rejection.status).toBe(ExternalActionRequestStatus.REJECTED);
    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: rejected.id },
        actor.user.id,
      ),
    ).rejects.toThrow("External action request not found");
    await expect(
      prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: rejected.id },
        select: { approvedAt: true, status: true },
      }),
    ).resolves.toEqual({
      approvedAt: null,
      status: ExternalActionRequestStatus.REJECTED,
    });
  });

  it("expires a pending request whose approval window has passed instead of approving it", async () => {
    const actor = await createUser("expirer");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "expired_task",
    });
    const request = await prisma.externalActionRequest.create({
      data: {
        destination: "https://example.test/expired",
        expiresAt: new Date(Date.now() - 60 * 60 * 1_000),
        idempotencyKey: `${TEST_PREFIX}expired`,
        operation: "submit_expired",
        payloadHash: `${TEST_PREFIX}expired_hash`,
        payloadJson: { answer: "expired" },
        requestedByUserId: actor.user.id,
        status: ExternalActionRequestStatus.PENDING,
        taskId: task.id,
      },
    });

    const decided = await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      actor.user.id,
    );

    expect(decided.status).toBe(ExternalActionRequestStatus.EXPIRED);
    expect(decided.approvedAt).toBeNull();
    expect(decided.approvedPayloadHash).toBeNull();
  });

  // An agent proposes and a human decides, so approval cannot be limited to
  // the requester. It is limited to MANAGE access on the task.
  it("lets manage-access holders decide, but not users without task access", async () => {
    const requester = await createUser("manage_requester");
    const directManager = await createUser("direct_manager");
    const outsider = await createUser("outsider");
    const task = await createTask({
      creatorUserId: requester.user.id,
      id: "manage_access_task",
    });
    await prisma.taskManager.create({
      data: {
        createdByUserId: requester.user.id,
        role: "manager",
        taskId: task.id,
        userId: directManager.user.id,
      },
    });
    const request = await proposeRequest(
      task.id,
      requester.user.id,
      "manage_access",
    );

    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: request.id },
        outsider.user.id,
      ),
    ).rejects.toThrow("External action request not found");
    await expect(
      listExternalActionRequestsForHuman({
        actorUserId: outsider.user.id,
        statuses: [ExternalActionRequestStatus.PENDING],
        taskId: task.id,
      }),
    ).resolves.toEqual([]);

    const listedForDirectManager = await listExternalActionRequestsForHuman({
      actorUserId: directManager.user.id,
      statuses: [ExternalActionRequestStatus.PENDING],
      taskId: task.id,
    });
    expect(listedForDirectManager.map((row) => row.id)).toContain(request.id);

    const decided = await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      directManager.user.id,
    );
    expect(decided.status).toBe(ExternalActionRequestStatus.APPROVED);
    expect(decided.approvedByUserId).toBe(directManager.user.id);
  });

  it("keeps blocked operations pending even for task managers", async () => {
    const manager = await createUser("blocked_operation_manager");
    const task = await createTask({
      creatorUserId: manager.user.id,
      id: "blocked_operation_task",
    });
    const request = await proposeRequest(
      task.id,
      manager.user.id,
      "blocked_operation",
    );

    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: request.id },
        manager.user.id,
        { blockedOperations: [request.operation] },
      ),
    ).rejects.toThrow("External action request not found");
    await expect(
      prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: request.id },
        select: { approvedAt: true, status: true },
      }),
    ).resolves.toEqual({
      approvedAt: null,
      status: ExternalActionRequestStatus.PENDING,
    });
  });

  it("does not grant routine approval access from platform admin status", async () => {
    const requester = await createUser("admin_case_requester");
    const platformAdmin = await createUser("platform_admin");
    await prisma.user.update({
      where: { id: platformAdmin.user.id },
      data: { isAdmin: true },
    });
    const task = await createTask({
      creatorUserId: requester.user.id,
      id: "platform_admin_task",
    });
    const request = await proposeRequest(
      task.id,
      requester.user.id,
      "platform_admin",
    );

    await expect(
      listExternalActionRequestsForHuman({
        actorUserId: platformAdmin.user.id,
        taskId: task.id,
      }),
    ).resolves.toEqual([]);
    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: request.id },
        platformAdmin.user.id,
      ),
    ).rejects.toThrow("External action request not found");
  });

  it("authorizes retries only for MANAGE holders on approved requests", async () => {
    const requester = await createUser("retry_requester");
    const manager = await createUser("retry_manager");
    const outsider = await createUser("retry_outsider");
    const task = await createTask({
      creatorUserId: requester.user.id,
      id: "retry_authorization_task",
    });
    await prisma.taskManager.create({
      data: {
        createdByUserId: requester.user.id,
        taskId: task.id,
        userId: manager.user.id,
      },
    });
    const request = await proposeRequest(
      task.id,
      requester.user.id,
      "retry_authorization",
    );
    await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      requester.user.id,
    );

    await expect(
      decideExternalActionRequest(
        { decision: "RETRY", externalActionRequestId: request.id },
        outsider.user.id,
      ),
    ).rejects.toThrow("External action request not found");

    const retry = await decideExternalActionRequest(
      { decision: "RETRY", externalActionRequestId: request.id },
      manager.user.id,
    );
    expect(retry.status).toBe(ExternalActionRequestStatus.APPROVED);
    expect(retry.approvedPayloadHash).toBe(request.payloadHash);
  });

  it("hides org-owned requests from delegated clients unless the organization is granted", async () => {
    const owner = await createUser("boundary_owner");
    const organization = await createOrganization(owner.user.id, [
      { role: OrganizationMemberRole.OWNER, userId: owner.user.id },
    ]);
    const task = await createTask({
      creatorUserId: owner.user.id,
      id: "boundary_task",
      ownerOrganizationId: organization.id,
    });
    const request = await proposeRequest(task.id, owner.user.id, "boundary");
    const personalOnlyBoundary = {
      allowPersonalPrivate: true,
      organizationIds: [] as string[],
    };
    const orgGrantedBoundary = {
      allowPersonalPrivate: false,
      organizationIds: [organization.id],
    };

    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: request.id },
        owner.user.id,
        { clientAccessBoundary: personalOnlyBoundary },
      ),
    ).rejects.toThrow("External action request not found");
    await expect(
      listExternalActionRequestsForHuman({
        actorUserId: owner.user.id,
        clientAccessBoundary: personalOnlyBoundary,
      }),
    ).resolves.toEqual([]);

    const listed = await listExternalActionRequestsForHuman({
      actorUserId: owner.user.id,
      clientAccessBoundary: orgGrantedBoundary,
    });
    expect(listed.map((row) => row.id)).toContain(request.id);

    const decided = await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      owner.user.id,
      { clientAccessBoundary: orgGrantedBoundary },
    );
    expect(decided.status).toBe(ExternalActionRequestStatus.APPROVED);
  });

  it("heals a receipted send that raced approval expiry", async () => {
    const actor = await createUser("expiry_race");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "expiry_race_task",
    });
    const request = await proposeRequest(task.id, actor.user.id, "expiry_race");
    await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      actor.user.id,
    );
    await expireExternalActionRequest(request.id);

    await expect(
      finalizeApprovedExternalAction({
        executedByUserId: actor.user.id,
        externalActionRequestId: request.id,
        failureMessage: "no durable send evidence",
        result: "FAILED",
      }),
    ).rejects.toThrow("External action request is no longer executable");

    const healed = await finalizeApprovedExternalAction({
      executedByUserId: actor.user.id,
      externalActionRequestId: request.id,
      receipt: {
        emailLogId: "email_log_expiry_race",
        providerMessageId: "provider_expiry_race",
        taskCommunicationId: "communication_expiry_race",
      },
      result: "EXECUTED",
    });
    expect(healed.status).toBe(ExternalActionRequestStatus.EXECUTED);
    expect(healed.executionReceiptJson).toEqual({
      emailLogId: "email_log_expiry_race",
      providerMessageId: "provider_expiry_race",
      taskCommunicationId: "communication_expiry_race",
    });
  });

  it("returns the terminal row unchanged when a recorded result is replayed", async () => {
    const actor = await createUser("replayer");
    const task = await createTask({
      creatorUserId: actor.user.id,
      id: "replay_task",
    });
    const request = await proposeRequest(task.id, actor.user.id, "replay");
    await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      actor.user.id,
    );

    const executed = await recordExternalActionResult(
      {
        externalActionRequestId: request.id,
        receipt: { receiptId: "original" },
        result: "EXECUTED",
      },
      actor.user.id,
    );
    expect(executed.status).toBe(ExternalActionRequestStatus.EXECUTED);
    expect(executed.executionReceiptJson).toEqual({ receiptId: "original" });
    expect(executed.executedAt).not.toBeNull();
    await expect(
      prisma.externalActionRequest.findUniqueOrThrow({
        where: { id: request.id },
        select: { executedByAgentExecutorId: true, executedByUserId: true },
      }),
    ).resolves.toEqual({
      executedByAgentExecutorId: null,
      executedByUserId: actor.user.id,
    });

    const replayed = await recordExternalActionResult(
      {
        externalActionRequestId: request.id,
        receipt: { receiptId: "replay" },
        result: "EXECUTED",
      },
      actor.user.id,
    );
    expect(replayed.status).toBe(ExternalActionRequestStatus.EXECUTED);
    expect(replayed.executionReceiptJson).toEqual({ receiptId: "original" });
    expect(replayed.executedAt?.getTime()).toBe(executed.executedAt?.getTime());
  });
});
