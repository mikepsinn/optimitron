import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  OrgStatus,
  OrgType,
  Prisma,
  PrismaClient,
  TaskFundingEventType,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TASK_FUNDING_CONVERSION_VERSION } from "../conversion.server";
import { createOrReplaceTaskFundingPledge } from "../pledges.server";

const TEST_PREFIX = "tf_pledges_";

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
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
  await prisma.person.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
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

async function createOrganization(suffix: string, creatorId: string) {
  const org = await prisma.organization.create({
    data: {
      id: `${TEST_PREFIX}org_${suffix}`,
      name: `Pledge Org ${suffix}`,
      slug: `${TEST_PREFIX}org-${suffix}`,
      type: OrgType.OTHER,
      status: OrgStatus.APPROVED,
      creatorId,
    },
  });
  await prisma.organizationMember.create({
    data: { organizationId: org.id, userId: creatorId, role: "owner" },
  });
  return org;
}

async function createTarget(suffix: string, targetAmountCents = 10_000n) {
  const creator = await createUserWithPerson(`creator_${suffix}`, "Creator");
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: creator.user.id,
      title: `Fund pledge task ${suffix}`,
      description: "A task with a funding target.",
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${suffix}`,
      taskId: task.id,
      targetAmountCents,
      status: TaskFundingTargetStatus.OPEN,
      createdByUserId: creator.user.id,
    },
  });

  return { creator, target, task };
}

function personPledgeInput(input: {
  amountCents: string;
  idempotencyKey?: string;
  mode?: "replace" | "increment";
  taskId: string;
  user: Awaited<ReturnType<typeof createUserWithPerson>>;
}) {
  return {
    taskId: input.taskId,
    pledgerKind: "PERSON" as const,
    pledgerPersonId: input.user.person.id,
    pledgedByUserId: input.user.user.id,
    publicDisplay: false,
    idempotencyKey: input.idempotencyKey,
    mode: input.mode ?? ("replace" as const),
    conversionInput: {
      unitKind: "USD" as const,
      amountCents: input.amountCents,
    },
  };
}

beforeEach(cleanup);
afterAll(cleanup);

describe("createOrReplaceTaskFundingPledge", () => {
  it("replaces the active pledge for the same target actor and unit", async () => {
    const { task } = await createTarget("replace");
    const alice = await createUserWithPerson("alice", "Alice");

    const first = await createOrReplaceTaskFundingPledge(
      personPledgeInput({ taskId: task.id, user: alice, amountCents: "1000" }),
    );
    const second = await createOrReplaceTaskFundingPledge(
      personPledgeInput({ taskId: task.id, user: alice, amountCents: "2500" }),
    );

    expect(second.pledge.id).toBe(first.pledge.id);
    expect(second.pledge.committedAmountCents).toBe(2500n);
    expect(second.pledge.unitQuantity.toString()).toBe("25");
    expect(second.fundingStatus.committedUsdCents).toBe(2500n);
    await expect(
      prisma.taskFundingPledge.count({
        where: { targetId: first.pledge.targetId, status: TaskFundingPledgeStatus.ACTIVE },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.taskFundingEvent.findMany({
        where: { targetId: first.pledge.targetId },
        orderBy: { createdAt: "asc" },
        select: { eventType: true },
      }),
    ).resolves.toEqual([
      { eventType: TaskFundingEventType.PLEDGE_CREATED },
      { eventType: TaskFundingEventType.PLEDGE_UPDATED },
    ]);
  });

  it("rejects duplicate idempotency keys", async () => {
    const { task } = await createTarget("idempotency");
    const alice = await createUserWithPerson("alice", "Alice");

    await createOrReplaceTaskFundingPledge(
      personPledgeInput({
        taskId: task.id,
        user: alice,
        amountCents: "1000",
        idempotencyKey: `${TEST_PREFIX}idem_duplicate`,
      }),
    );

    await expect(
      createOrReplaceTaskFundingPledge(
        personPledgeInput({
          taskId: task.id,
          user: alice,
          amountCents: "1500",
          idempotencyKey: `${TEST_PREFIX}idem_duplicate`,
        }),
      ),
    ).rejects.toThrow(/idempotency/i);
  });

  it("records the threshold transition only on the first crossing", async () => {
    const { task, target } = await createTarget("threshold_once", 1000n);
    const alice = await createUserWithPerson("alice", "Alice");

    const crossed = await createOrReplaceTaskFundingPledge(
      personPledgeInput({ taskId: task.id, user: alice, amountCents: "1000" }),
    );
    const later = await createOrReplaceTaskFundingPledge(
      personPledgeInput({ taskId: task.id, user: alice, amountCents: "1500" }),
    );

    expect(crossed.thresholdTransition.triggered).toBe(true);
    expect(crossed.thresholdTransition.thresholdMetAt).toBeInstanceOf(Date);
    expect(later.thresholdTransition.triggered).toBe(false);
    await expect(
      prisma.taskFundingTarget.findUnique({
        where: { id: target.id },
        select: { status: true, thresholdMetAt: true, thresholdMetByPledgeId: true },
      }),
    ).resolves.toMatchObject({
      status: TaskFundingTargetStatus.THRESHOLD_MET,
      thresholdMetByPledgeId: crossed.pledge.id,
    });
    await expect(
      prisma.taskFundingEvent.count({
        where: {
          targetId: target.id,
          eventType: TaskFundingEventType.THRESHOLD_MET,
        },
      }),
    ).resolves.toBe(1);
  });

  it("creates exactly one threshold event when parallel pledges both cross the target", async () => {
    const { target, task } = await createTarget("concurrent", 1000n);
    const seeded = await createUserWithPerson("seeded", "Seeded");
    const alice = await createUserWithPerson("alice", "Alice");
    const bob = await createUserWithPerson("bob", "Bob");

    await prisma.taskFundingPledge.create({
      data: {
        id: `${TEST_PREFIX}pledge_seeded`,
        targetId: target.id,
        pledgerKind: TaskFundingPledgerKind.PERSON,
        pledgeActorKey: `person:${seeded.person.id}`,
        pledgedByUserId: seeded.user.id,
        pledgerPersonId: seeded.person.id,
        unitKey: "usd",
        unitQuantity: new Prisma.Decimal("9"),
        committedAmountCents: 900n,
        conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
        status: TaskFundingPledgeStatus.ACTIVE,
      },
    });

    const quietPrisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
      log: [],
    });
    try {
      await Promise.all([
        createOrReplaceTaskFundingPledge(
          personPledgeInput({ taskId: task.id, user: alice, amountCents: "200" }),
          quietPrisma,
        ),
        createOrReplaceTaskFundingPledge(
          personPledgeInput({ taskId: task.id, user: bob, amountCents: "200" }),
          quietPrisma,
        ),
      ]);
    } finally {
      await quietPrisma.$disconnect();
    }

    const events = await prisma.taskFundingEvent.findMany({
      where: {
        targetId: target.id,
        eventType: TaskFundingEventType.THRESHOLD_MET,
      },
    });
    const updatedTarget = await prisma.taskFundingTarget.findUniqueOrThrow({
      where: { id: target.id },
      select: { status: true, thresholdMetAt: true },
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.dedupeKey).toBe(`threshold-met:${target.id}`);
    expect(updatedTarget.status).toBe(TaskFundingTargetStatus.THRESHOLD_MET);
    expect(updatedTarget.thresholdMetAt).toBeInstanceOf(Date);
  });

  it("rejects increment mode until additive pledges have a real UX", async () => {
    const { task } = await createTarget("increment");
    const alice = await createUserWithPerson("alice", "Alice");

    await expect(
      createOrReplaceTaskFundingPledge(
        personPledgeInput({
          taskId: task.id,
          user: alice,
          amountCents: "1000",
          mode: "increment",
        }),
      ),
    ).rejects.toThrow(/increment.*not supported/i);
  });

  it("creates organization pledges through the same replacement path", async () => {
    const { task } = await createTarget("organization");
    const owner = await createUserWithPerson("owner", "Owner");
    const org = await createOrganization("org", owner.user.id);

    const result = await createOrReplaceTaskFundingPledge({
      taskId: task.id,
      pledgerKind: "ORGANIZATION",
      pledgerOrganizationId: org.id,
      pledgedByUserId: owner.user.id,
      publicDisplay: true,
      mode: "replace",
      conversionInput: {
        unitKind: "USD",
        amountCents: "3000",
      },
    });

    expect(result.pledge.pledgeActorKey).toBe(`organization:${org.id}`);
    expect(result.pledge.publicNameSnapshot).toBe(org.name);
    expect(result.fundingStatus.organizationCount).toBe(1);
  });
});
