import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  CommerceOrderStatus,
  OrgStatus,
  OrgType,
  Prisma,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TASK_FUNDING_CONVERSION_VERSION } from "../conversion.server";
import {
  formatRelativeTime,
  getTaskFundingBackerWall,
  getTaskFundingStatus,
  TASK_FUNDING_BACKER_WALL_LIMIT,
} from "../status.server";

const TEST_PREFIX = "tf_status_";

async function cleanup() {
  await prisma.taskFundingEvent.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPayment.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.taskFundingPledge.deleteMany({
    where: { targetId: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOrder.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
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
  createdAt?: Date;
  pledgerKind: TaskFundingPledgerKind;
  pledgeActorKey: string;
  pledgedByUserId: string;
  pledgerPersonId?: string;
  pledgerOrganizationId?: string;
  publicDisplay?: boolean;
  publicNameSnapshot?: string;
  status?: TaskFundingPledgeStatus;
  stripeSetupIntentId?: string;
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
      stripeSetupIntentId: input.stripeSetupIntentId ?? null,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });
}

async function createFundingPayment(input: {
  amountCents: number;
  createdAt?: Date;
  donorName?: string | null;
  publicDisplay?: boolean;
  publicNameSnapshot?: string | null;
  status?: TaskFundingPaymentStatus;
  suffix: string;
  targetId: string;
  taskId: string;
}) {
  const status = input.status ?? TaskFundingPaymentStatus.PAID;
  const order = await prisma.commerceOrder.create({
    data: {
      id: `${TEST_PREFIX}order_${input.suffix}`,
      currency: "usd",
      donationCents: input.amountCents,
      purposeKey: "task-funding",
      status:
        status === TaskFundingPaymentStatus.PAID
          ? CommerceOrderStatus.PAID
          : CommerceOrderStatus.FAILED,
      subtotalCents: input.amountCents,
      totalCents: input.amountCents,
    },
  });

  return prisma.taskFundingPayment.create({
    data: {
      id: `${TEST_PREFIX}payment_${input.suffix}`,
      amountCents: input.amountCents,
      commerceOrderId: order.id,
      currency: "usd",
      donorName: input.donorName ?? null,
      publicDisplay: input.publicDisplay ?? false,
      publicNameSnapshot: input.publicNameSnapshot ?? null,
      status,
      stripeCheckoutSessionId: `${TEST_PREFIX}cs_${input.suffix}`,
      stripeTransferGroup: `${TEST_PREFIX}transfer_group_${input.suffix}`,
      targetId: input.targetId,
      taskId: input.taskId,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
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

  it("includes paid task funding payments and excludes failed or refunded payments", async () => {
    const { target, task } = await createTarget("paid_payments", 10_000n);

    await createFundingPayment({
      amountCents: 4000,
      publicDisplay: true,
      publicNameSnapshot: "Paid Alice",
      suffix: "paid",
      targetId: target.id,
      taskId: task.id,
    });
    await createFundingPayment({
      amountCents: 3000,
      status: TaskFundingPaymentStatus.FAILED,
      suffix: "failed",
      targetId: target.id,
      taskId: task.id,
    });
    await createFundingPayment({
      amountCents: 2000,
      status: TaskFundingPaymentStatus.REFUNDED,
      suffix: "refunded",
      targetId: target.id,
      taskId: task.id,
    });

    const status = await getTaskFundingStatus(task.id, {
      includeSupporters: true,
    });

    expect(status.committedUsdCents).toBe(4000n);
    expect(status.paidUsdCents).toBe(4000n);
    expect(status.pledgedUsdCents).toBe(0n);
    expect(status.remainingUsdCents).toBe(6000n);
    expect(status.pledgerCount).toBe(1);
    expect(status.publicSupporters).toEqual([
      expect.objectContaining({
        committedAmountCents: 4000n,
        pledgerKind: TaskFundingPledgerKind.PERSON,
        publicNameSnapshot: "Paid Alice",
      }),
    ]);
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

describe("getTaskFundingBackerWall", () => {
  const base = new Date("2026-07-01T12:00:00Z");
  const minutesAfterBase = (minutes: number) =>
    new Date(base.getTime() + minutes * 60_000);

  it("returns public paid payments and card-backed pledges, newest first", async () => {
    const { target, task } = await createTarget("wall", 100_000n);
    const pledger = await createUserWithPerson("wall_pledger", "Wall Pledger");

    await createFundingPayment({
      amountCents: 1000,
      createdAt: minutesAfterBase(4),
      publicDisplay: true,
      publicNameSnapshot: "Ada L.",
      suffix: "wall_snapshot",
      targetId: target.id,
      taskId: task.id,
    });
    // No snapshot -> falls back to donorName.
    await createFundingPayment({
      amountCents: 1000,
      createdAt: minutesAfterBase(1),
      donorName: "Grace H.",
      publicDisplay: true,
      suffix: "wall_donor_name",
      targetId: target.id,
      taskId: task.id,
    });
    // Excluded: not opted in.
    await createFundingPayment({
      amountCents: 1000,
      createdAt: minutesAfterBase(5),
      publicDisplay: false,
      publicNameSnapshot: "Hidden Harriet",
      suffix: "wall_private",
      targetId: target.id,
      taskId: task.id,
    });
    // Excluded: no name at all.
    await createFundingPayment({
      amountCents: 1000,
      createdAt: minutesAfterBase(6),
      publicDisplay: true,
      suffix: "wall_nameless",
      targetId: target.id,
      taskId: task.id,
    });
    // Excluded: not PAID.
    await createFundingPayment({
      amountCents: 1000,
      createdAt: minutesAfterBase(7),
      publicDisplay: true,
      publicNameSnapshot: "Failed Fred",
      status: TaskFundingPaymentStatus.FAILED,
      suffix: "wall_failed",
      targetId: target.id,
      taskId: task.id,
    });
    // Card-backed ACTIVE pledge -> included.
    await createPledge({
      committedAmountCents: 2000n,
      createdAt: minutesAfterBase(3),
      pledgeActorKey: "person:wall_active",
      pledgedByUserId: pledger.user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      publicDisplay: true,
      publicNameSnapshot: "Joan C.",
      stripeSetupIntentId: `${TEST_PREFIX}seti_active`,
      targetId: target.id,
    });
    // Card-backed FULFILLED pledge -> included.
    await createPledge({
      committedAmountCents: 2000n,
      createdAt: minutesAfterBase(2),
      pledgeActorKey: "person:wall_fulfilled",
      pledgedByUserId: pledger.user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      publicDisplay: true,
      publicNameSnapshot: "Mary J.",
      status: TaskFundingPledgeStatus.FULFILLED,
      stripeSetupIntentId: `${TEST_PREFIX}seti_fulfilled`,
      targetId: target.id,
    });
    // Excluded: soft pledge, no card saved.
    await createPledge({
      committedAmountCents: 2000n,
      createdAt: minutesAfterBase(8),
      pledgeActorKey: "person:wall_soft",
      pledgedByUserId: pledger.user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      publicDisplay: true,
      publicNameSnapshot: "Soft Sam",
      targetId: target.id,
    });
    // Excluded: cancelled.
    await createPledge({
      committedAmountCents: 2000n,
      createdAt: minutesAfterBase(9),
      pledgeActorKey: "person:wall_cancelled",
      pledgedByUserId: pledger.user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      publicDisplay: true,
      publicNameSnapshot: "Cancelled Carl",
      status: TaskFundingPledgeStatus.CANCELLED,
      stripeSetupIntentId: `${TEST_PREFIX}seti_cancelled`,
      targetId: target.id,
    });
    // Excluded: card-backed but not opted in.
    await createPledge({
      committedAmountCents: 2000n,
      createdAt: minutesAfterBase(10),
      pledgeActorKey: "person:wall_private",
      pledgedByUserId: pledger.user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      publicDisplay: false,
      publicNameSnapshot: "Private Pat",
      stripeSetupIntentId: `${TEST_PREFIX}seti_private`,
      targetId: target.id,
    });

    const wall = await getTaskFundingBackerWall(task.id);

    expect(wall).toEqual([
      { at: minutesAfterBase(4), kind: "paid", name: "Ada L." },
      { at: minutesAfterBase(3), kind: "pledged", name: "Joan C." },
      { at: minutesAfterBase(2), kind: "pledged", name: "Mary J." },
      { at: minutesAfterBase(1), kind: "paid", name: "Grace H." },
    ]);
  });

  it("caps the merged wall at the limit, keeping the newest entries", async () => {
    const { target, task } = await createTarget("wall_cap", 100_000n);
    const pledger = await createUserWithPerson("wall_cap_pledger", "Cap Pledger");
    const total = TASK_FUNDING_BACKER_WALL_LIMIT + 2;

    for (let i = 1; i <= total; i += 1) {
      if (i % 2 === 0) {
        await createFundingPayment({
          amountCents: 1000,
          createdAt: minutesAfterBase(i),
          publicDisplay: true,
          publicNameSnapshot: `Backer ${i}`,
          suffix: `wall_cap_${i}`,
          targetId: target.id,
          taskId: task.id,
        });
      } else {
        await createPledge({
          committedAmountCents: 1000n,
          createdAt: minutesAfterBase(i),
          pledgeActorKey: `person:wall_cap_${i}`,
          pledgedByUserId: pledger.user.id,
          pledgerKind: TaskFundingPledgerKind.PERSON,
          publicDisplay: true,
          publicNameSnapshot: `Backer ${i}`,
          stripeSetupIntentId: `${TEST_PREFIX}seti_cap_${i}`,
          targetId: target.id,
        });
      }
    }

    const wall = await getTaskFundingBackerWall(task.id);

    expect(wall).toHaveLength(TASK_FUNDING_BACKER_WALL_LIMIT);
    expect(wall.map((entry) => entry.name)).toEqual(
      Array.from(
        { length: TASK_FUNDING_BACKER_WALL_LIMIT },
        (_, index) => `Backer ${total - index}`,
      ),
    );
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-03T12:00:00Z");
  const secondsAgo = (seconds: number) =>
    new Date(now.getTime() - seconds * 1000);

  it("never renders zero or negative times", () => {
    expect(formatRelativeTime(now, now)).toBe("just now");
    expect(formatRelativeTime(now, secondsAgo(59))).toBe("just now");
    // Clock-skewed future timestamps clamp to "just now".
    expect(formatRelativeTime(now, secondsAgo(-1))).toBe("just now");
    expect(formatRelativeTime(now, secondsAgo(-3600))).toBe("just now");
  });

  it("formats unit boundaries with singular and plural labels", () => {
    expect(formatRelativeTime(now, secondsAgo(60))).toBe("1 minute ago");
    expect(formatRelativeTime(now, secondsAgo(119))).toBe("1 minute ago");
    expect(formatRelativeTime(now, secondsAgo(120))).toBe("2 minutes ago");
    expect(formatRelativeTime(now, secondsAgo(3599))).toBe("59 minutes ago");
    expect(formatRelativeTime(now, secondsAgo(3600))).toBe("1 hour ago");
    expect(formatRelativeTime(now, secondsAgo(86_399))).toBe("23 hours ago");
    expect(formatRelativeTime(now, secondsAgo(86_400))).toBe("1 day ago");
    expect(formatRelativeTime(now, secondsAgo(6 * 86_400))).toBe("6 days ago");
    expect(formatRelativeTime(now, secondsAgo(7 * 86_400))).toBe("1 week ago");
    expect(formatRelativeTime(now, secondsAgo(30 * 86_400))).toBe("1 month ago");
    expect(formatRelativeTime(now, secondsAgo(365 * 86_400))).toBe("1 year ago");
    expect(formatRelativeTime(now, secondsAgo(2 * 365 * 86_400))).toBe(
      "2 years ago",
    );
  });
});
