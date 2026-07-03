import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { createPledgeCancelToken } from "@/lib/task-funding/pledge-cancel-token";

const mocks = vi.hoisted(() => ({
  paymentMethodsDetach: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    paymentMethods: { detach: mocks.paymentMethodsDetach },
  }),
  isStripeConfigured: () => true,
}));

import { GET } from "./route";

const TEST_PREFIX = "tf_cancel_route_";

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

async function seedCardBackedPledge(input: {
  calledAt?: Date | null;
  suffix: string;
}) {
  const person = await prisma.person.create({
    data: {
      id: `${TEST_PREFIX}person_${input.suffix}`,
      displayName: `Cancel Route Pledger ${input.suffix}`,
    },
  });
  const user = await prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${input.suffix}`,
      email: `${TEST_PREFIX}${input.suffix}@example.test`,
      personId: person.id,
      stripeCustomerId: `${TEST_PREFIX}cus_${input.suffix}`,
    },
  });
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${input.suffix}`,
      createdByUserId: user.id,
      description: "A task with a cancellable assurance pledge.",
      title: `Cancel route task ${input.suffix}`,
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${input.suffix}`,
      status: TaskFundingTargetStatus.OPEN,
      targetAmountCents: 10_000n,
      taskId: task.id,
    },
  });
  const pledge = await prisma.taskFundingPledge.create({
    data: {
      id: `${TEST_PREFIX}pledge_${input.suffix}`,
      calledAt: input.calledAt ?? null,
      cardBrand: "visa",
      cardLast4: "4242",
      committedAmountCents: 5_000n,
      conversionVersion: "test",
      pledgeActorKey: `person:${person.id}`,
      pledgedByUserId: user.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      status: TaskFundingPledgeStatus.ACTIVE,
      stripePaymentMethodId: `${TEST_PREFIX}pm_${input.suffix}`,
      stripeSetupIntentId: `${TEST_PREFIX}si_${input.suffix}`,
      targetId: target.id,
      unitKey: "usd",
      unitQuantity: "50",
    },
  });
  return { pledge, task };
}

function makeCancelRequest(pledgeId: string) {
  const token = createPledgeCancelToken(pledgeId);
  return new Request(
    `http://localhost/api/task-funding/pledge/cancel?token=${encodeURIComponent(token)}`,
  );
}

describe("GET /api/task-funding/pledge/cancel", () => {
  beforeEach(async () => {
    mocks.paymentMethodsDetach.mockReset();
    mocks.paymentMethodsDetach.mockResolvedValue({ id: "pm_detached" });
    await cleanup();
  });
  afterAll(cleanup);

  it("cancels an ACTIVE uncalled pledge, detaches the card, and redirects", async () => {
    const { pledge, task } = await seedCardBackedPledge({ suffix: "open" });

    const response = await GET(makeCancelRequest(pledge.id));

    expect(response.status).toBe(303);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain(`/tasks/${task.id}`);
    expect(location).toContain("pledge_cancelled=1");

    const updated = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
    });
    expect(updated.status).toBe(TaskFundingPledgeStatus.CANCELLED);
    expect(updated.cancelledAt).not.toBeNull();
    expect(updated.stripePaymentMethodId).toBeNull();
    expect(updated.cardBrand).toBeNull();
    expect(updated.cardLast4).toBeNull();
    expect(mocks.paymentMethodsDetach).toHaveBeenCalledWith(
      `${TEST_PREFIX}pm_open`,
    );
  });

  it("refuses once charging has started (calledAt set) and changes nothing", async () => {
    const calledAt = new Date("2026-07-01T00:00:00.000Z");
    const { pledge, task } = await seedCardBackedPledge({
      calledAt,
      suffix: "called",
    });

    const response = await GET(makeCancelRequest(pledge.id));

    expect(response.status).toBe(303);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain(`/tasks/${task.id}`);
    expect(location).toContain("pledge_cancel_unavailable=1");

    const unchanged = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
    });
    expect(unchanged.status).toBe(TaskFundingPledgeStatus.ACTIVE);
    expect(unchanged.calledAt).toEqual(calledAt);
    expect(unchanged.stripePaymentMethodId).toBe(`${TEST_PREFIX}pm_called`);
    expect(mocks.paymentMethodsDetach).not.toHaveBeenCalled();
  });

  it("rejects a tampered token without touching any pledge", async () => {
    const { pledge } = await seedCardBackedPledge({ suffix: "tampered" });
    const token = createPledgeCancelToken(pledge.id);
    const signature = token.slice(token.lastIndexOf(".") + 1);
    const response = await GET(
      new Request(
        `http://localhost/api/task-funding/pledge/cancel?token=${encodeURIComponent(`${TEST_PREFIX}pledge_other.${signature}`)}`,
      ),
    );

    expect(response.status).toBe(400);
    const unchanged = await prisma.taskFundingPledge.findUniqueOrThrow({
      where: { id: pledge.id },
    });
    expect(unchanged.status).toBe(TaskFundingPledgeStatus.ACTIVE);
    expect(mocks.paymentMethodsDetach).not.toHaveBeenCalled();
  });
});
