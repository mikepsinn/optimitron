import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  OrgStatus,
  OrgType,
  Prisma,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TASK_FUNDING_CONVERSION_VERSION } from "../conversion.server";
import { getTaskFundingStatus } from "../status.server";

const TEST_PREFIX = "tf_status_";

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

async function createOrganization(suffix: string, name: string, creatorId: string) {
  return prisma.organization.create({
    data: {
      id: `${TEST_PREFIX}org_${suffix}`,
      name,
      slug: `${TEST_PREFIX}org-${suffix}`,
      type: OrgType.OTHER,
      status: OrgStatus.APPROVED,
      creatorId,
    },
  });
}

async function createTarget(suffix: string, targetAmountCents = 10_000n) {
  const { user } = await createUserWithPerson(`creator_${suffix}`, "Creator");
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: user.id,
      title: `Fund test task ${suffix}`,
      description: "A task with a funding target.",
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${suffix}`,
      taskId: task.id,
      targetAmountCents,
      status: TaskFundingTargetStatus.OPEN,
      createdByUserId: user.id,
    },
  });

  return { target, task, user };
}

async function createPledge(input: {
  committedAmountCents: bigint;
  pledgerKind: TaskFundingPledgerKind;
  pledgeActorKey: string;
  pledgedByUserId: string;
  pledgerPersonId?: string;
  pledgerOrganizationId?: string;
  publicDisplay?: boolean;
  publicNameSnapshot?: string;
  status?: TaskFundingPledgeStatus;
  targetId: string;
  unitKey?: string;
  unitQuantity?: string;
}) {
  return prisma.taskFundingPledge.create({
    data: {
      id: `${TEST_PREFIX}pledge_${input.pledgeActorKey.replace(":", "_")}_${input.unitKey ?? "usd"}`,
      targetId: input.targetId,
      pledgerKind: input.pledgerKind,
      pledgeActorKey: input.pledgeActorKey,
      pledgedByUserId: input.pledgedByUserId,
      pledgerPersonId: input.pledgerPersonId,
      pledgerOrganizationId: input.pledgerOrganizationId,
      publicDisplay: input.publicDisplay ?? false,
      publicNameSnapshot: input.publicNameSnapshot ?? null,
      unitKey: input.unitKey ?? "usd",
      unitQuantity: new Prisma.Decimal(input.unitQuantity ?? "1"),
      committedAmountCents: input.committedAmountCents,
      conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
      status: input.status ?? TaskFundingPledgeStatus.ACTIVE,
    },
  });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("getTaskFundingStatus", () => {
  it("returns zero totals for an open target with no active pledges", async () => {
    const { task } = await createTarget("empty", 5000n);

    const status = await getTaskFundingStatus(task.id);

    expect(status.targetUsdCents).toBe(5000n);
    expect(status.committedUsdCents).toBe(0n);
    expect(status.remainingUsdCents).toBe(5000n);
    expect(status.percentToTarget).toBe(0);
    expect(status.status).toBe(TaskFundingTargetStatus.OPEN);
    expect(status.pledgerCount).toBe(0);
    expect(status.individualCount).toBe(0);
    expect(status.organizationCount).toBe(0);
    expect(status.latestPledgeAt).toBeNull();
    expect(status.unitBreakdown).toEqual([]);
    expect("publicSupporters" in status).toBe(false);
  });

  it("aggregates mixed person and organization pledges by actor and unit", async () => {
    const { target, task } = await createTarget("mixed", 10_000n);
    const alice = await createUserWithPerson("alice", "Alice");
    const orgUser = await createUserWithPerson("org_user", "Org User");
    const org = await createOrganization("one", "One Org", orgUser.user.id);

    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${alice.person.id}`,
      pledgedByUserId: alice.user.id,
      pledgerPersonId: alice.person.id,
      unitKey: "usd",
      unitQuantity: "40",
      committedAmountCents: 4000n,
    });
    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.ORGANIZATION,
      pledgeActorKey: `organization:${org.id}`,
      pledgedByUserId: orgUser.user.id,
      pledgerOrganizationId: org.id,
      unitKey: "commerce-offer:shirt",
      unitQuantity: "2",
      committedAmountCents: 5000n,
    });

    const status = await getTaskFundingStatus(task.id);

    expect(status.committedUsdCents).toBe(9000n);
    expect(status.remainingUsdCents).toBe(1000n);
    expect(status.percentToTarget).toBe(90);
    expect(status.pledgerCount).toBe(2);
    expect(status.individualCount).toBe(1);
    expect(status.organizationCount).toBe(1);
    expect(status.latestPledgeAt).toBeInstanceOf(Date);

    const usd = status.unitBreakdown.find((unit) => unit.unitKey === "usd");
    const shirt = status.unitBreakdown.find(
      (unit) => unit.unitKey === "commerce-offer:shirt",
    );
    expect(usd?.totalQuantity.toString()).toBe("40");
    expect(usd?.totalCommittedCents).toBe(4000n);
    expect(usd?.pledgerCount).toBe(1);
    expect(shirt?.totalQuantity.toString()).toBe("2");
    expect(shirt?.totalCommittedCents).toBe(5000n);
    expect(shirt?.pledgerCount).toBe(1);
  });

  it("excludes cancelled pledges from active totals", async () => {
    const { target, task } = await createTarget("cancelled", 10_000n);
    const active = await createUserWithPerson("active", "Active");
    const cancelled = await createUserWithPerson("cancelled", "Cancelled");

    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${active.person.id}`,
      pledgedByUserId: active.user.id,
      pledgerPersonId: active.person.id,
      committedAmountCents: 3000n,
    });
    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${cancelled.person.id}`,
      pledgedByUserId: cancelled.user.id,
      pledgerPersonId: cancelled.person.id,
      committedAmountCents: 7000n,
      status: TaskFundingPledgeStatus.CANCELLED,
    });

    const status = await getTaskFundingStatus(task.id);

    expect(status.committedUsdCents).toBe(3000n);
    expect(status.pledgerCount).toBe(1);
    expect(status.individualCount).toBe(1);
  });

  it("includes only public supporters when requested", async () => {
    const { target, task } = await createTarget("supporters", 10_000n);
    const publicUser = await createUserWithPerson("public", "Public Alice");
    const privateUser = await createUserWithPerson("private", "Private Bob");

    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${publicUser.person.id}`,
      pledgedByUserId: publicUser.user.id,
      pledgerPersonId: publicUser.person.id,
      committedAmountCents: 2000n,
      publicDisplay: true,
      publicNameSnapshot: "Public Alice",
    });
    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${privateUser.person.id}`,
      pledgedByUserId: privateUser.user.id,
      pledgerPersonId: privateUser.person.id,
      committedAmountCents: 3000n,
      publicDisplay: false,
      publicNameSnapshot: "Private Bob",
    });

    const withoutSupporters = await getTaskFundingStatus(task.id);
    const withSupporters = await getTaskFundingStatus(task.id, {
      includeSupporters: true,
      limit: 10,
    });

    expect("publicSupporters" in withoutSupporters).toBe(false);
    expect(withSupporters.publicSupporters).toEqual([
      expect.objectContaining({
        pledgerKind: TaskFundingPledgerKind.PERSON,
        publicNameSnapshot: "Public Alice",
        committedAmountCents: 2000n,
      }),
    ]);
  });
});
