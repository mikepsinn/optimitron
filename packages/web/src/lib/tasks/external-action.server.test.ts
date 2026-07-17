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

  it("lets only the requester decide, even among users with manage access", async () => {
    const owner = await createUser("org_owner");
    const member = await createUser("org_member");
    const admin = await createUser("org_admin");
    const organization = await createOrganization(owner.user.id, [
      { role: OrganizationMemberRole.OWNER, userId: owner.user.id },
      { role: OrganizationMemberRole.MEMBER, userId: member.user.id },
      { role: OrganizationMemberRole.ADMIN, userId: admin.user.id },
    ]);
    const task = await createTask({
      creatorUserId: member.user.id,
      id: "requester_only_task",
      ownerOrganizationId: organization.id,
    });
    const request = await proposeRequest(
      task.id,
      member.user.id,
      "requester_only",
    );

    await expect(
      decideExternalActionRequest(
        { decision: "APPROVE", externalActionRequestId: request.id },
        admin.user.id,
      ),
    ).rejects.toThrow("External action request not found");

    const decided = await decideExternalActionRequest(
      { decision: "APPROVE", externalActionRequestId: request.id },
      member.user.id,
    );
    expect(decided.status).toBe(ExternalActionRequestStatus.APPROVED);
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
    expect(replayed.executedAt?.getTime()).toBe(
      executed.executedAt?.getTime(),
    );
  });
});
