import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Prisma,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TASK_FUNDING_CONVERSION_VERSION } from "@/lib/task-funding/conversion.server";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

import { GET } from "../funding-status/route";

const TEST_PREFIX = "tf_status_api_";

async function cleanup() {
  await prisma.taskFundingEvent.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPledge.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingTarget.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.task.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.person.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createUserWithPerson(suffix: string, displayName: string) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_${suffix}`,
      displayName,
    },
  });
  const user = await prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${suffix}`,
      email: `${TEST_PREFIX}${suffix}@example.test`,
      personId: person.id,
    },
  });

  return { person, user };
}

async function createTaskWithTarget(input: {
  isPublic?: boolean;
  suffix: string;
  targetAmountCents?: bigint;
}) {
  const creator = await createUserWithPerson(
    `creator_${input.suffix}`,
    "Creator",
  );
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${input.suffix}`,
      createdByUserId: creator.user.id,
      title: `Funding status task ${input.suffix}`,
      description: "A task with a funding target.",
      isPublic: input.isPublic ?? true,
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${input.suffix}`,
      taskId: task.id,
      targetAmountCents: input.targetAmountCents ?? 10_000n,
      status: TaskFundingTargetStatus.OPEN,
      createdByUserId: creator.user.id,
    },
  });

  return { creator, target, task };
}

async function createPledge(input: {
  committedAmountCents: bigint;
  pledgeActorKey: string;
  publicDisplay?: boolean;
  publicNameSnapshot?: string;
  targetId: string;
  unitKey?: string;
  unitQuantity?: string;
}) {
  return prisma.taskFundingPledge.create({
    data: {
      id: `${TEST_PREFIX}pledge_${input.pledgeActorKey.replace(":", "_")}_${input.unitKey ?? "usd"}`,
      targetId: input.targetId,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: input.pledgeActorKey,
      publicDisplay: input.publicDisplay ?? false,
      publicNameSnapshot: input.publicNameSnapshot ?? null,
      unitKey: input.unitKey ?? "usd",
      unitQuantity: new Prisma.Decimal(input.unitQuantity ?? "1"),
      committedAmountCents: input.committedAmountCents,
      conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
      status: TaskFundingPledgeStatus.ACTIVE,
    },
  });
}

function request(path: string) {
  return new Request(`http://localhost${path}`);
}

function params(taskId: string) {
  return { params: Promise.resolve({ id: taskId }) };
}

beforeEach(async () => {
  mocks.requireAuth.mockReset();
  await cleanup();
});
afterAll(cleanup);

describe("GET /api/tasks/[id]/funding-status", () => {
  it("allows unauthenticated reads for public tasks", async () => {
    const { target, task } = await createTaskWithTarget({
      suffix: "public_read",
    });
    await createPledge({
      targetId: target.id,
      pledgeActorKey: "person:public_reader",
      committedAmountCents: 2500n,
      unitQuantity: "25",
    });
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await GET(
      request(`/api/tasks/${task.id}/funding-status`),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      targetUsdCents: "10000",
      committedUsdCents: "2500",
      remainingUsdCents: "7500",
      percentToTarget: 25,
      status: "OPEN",
      pledgerCount: 1,
    });
    expect(json).not.toHaveProperty("publicSupporters");
  });

  it("requires an authenticated viewer for private tasks", async () => {
    const { creator, task } = await createTaskWithTarget({
      suffix: "private_read",
      isPublic: false,
    });
    mocks.requireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    const unauthenticated = await GET(
      request(`/api/tasks/${task.id}/funding-status`),
      params(task.id),
    );

    expect(unauthenticated.status).toBe(401);

    mocks.requireAuth.mockResolvedValueOnce({ userId: creator.user.id });
    const authenticated = await GET(
      request(`/api/tasks/${task.id}/funding-status`),
      params(task.id),
    );

    expect(authenticated.status).toBe(200);
  });

  it("caps public supporter lists at 100", async () => {
    const { target, task } = await createTaskWithTarget({
      suffix: "supporter_cap",
    });
    const createdAt = new Date("2026-05-21T00:00:00.000Z");
    await prisma.taskFundingPledge.createMany({
      data: Array.from({ length: 105 }, (_, index) => ({
        id: `${TEST_PREFIX}pledge_supporter_${index}`,
        targetId: target.id,
        pledgerKind: TaskFundingPledgerKind.PERSON,
        pledgeActorKey: `person:supporter_${index}`,
        publicDisplay: true,
        publicNameSnapshot: `Supporter ${index}`,
        unitKey: "usd",
        unitQuantity: new Prisma.Decimal("1"),
        committedAmountCents: 100n,
        conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
        status: TaskFundingPledgeStatus.ACTIVE,
        createdAt: new Date(createdAt.getTime() + index),
      })),
    });

    const response = await GET(
      request(
        `/api/tasks/${task.id}/funding-status?includeSupporters=1&limit=500`,
      ),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.publicSupporters).toHaveLength(100);
  });

  it("serializes BigInt fields as strings", async () => {
    const { target, task } = await createTaskWithTarget({
      suffix: "bigint_strings",
      targetAmountCents: 1_234_567_890_123_456_789n,
    });
    await createPledge({
      targetId: target.id,
      pledgeActorKey: "person:bigint_supporter",
      publicDisplay: true,
      publicNameSnapshot: "Big Supporter",
      committedAmountCents: 333_333_333_333_333_333n,
      unitQuantity: "3333333333333333.333",
    });

    const response = await GET(
      request(`/api/tasks/${task.id}/funding-status?includeSupporters=1`),
      params(task.id),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.targetUsdCents).toBe("1234567890123456789");
    expect(json.committedUsdCents).toBe("333333333333333333");
    expect(json.remainingUsdCents).toBe("901234556790123456");
    expect(json.unitBreakdown[0].totalCommittedCents).toBe(
      "333333333333333333",
    );
    expect(json.publicSupporters[0].committedAmountCents).toBe(
      "333333333333333333",
    );
  });
});
