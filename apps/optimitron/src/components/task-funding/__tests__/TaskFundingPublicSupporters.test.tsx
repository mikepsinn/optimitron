import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  Prisma,
  TaskFundingPledgeStatus,
  TaskFundingPledgerKind,
  TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { TASK_FUNDING_CONVERSION_VERSION } from "@/lib/task-funding/conversion.server";
import { TaskFundingPublicSupporters } from "../TaskFundingPublicSupporters";

const TEST_PREFIX = "tf_supporters_component_";

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

async function createTarget(suffix: string) {
  const { user } = await createUserWithPerson(`creator_${suffix}`, "Creator");
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${suffix}`,
      createdByUserId: user.id,
      title: `Funding supporters task ${suffix}`,
      description: "A task with a funding target.",
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${suffix}`,
      taskId: task.id,
      targetAmountCents: 10_000n,
      status: TaskFundingTargetStatus.OPEN,
      createdByUserId: user.id,
    },
  });

  return { target, task, user };
}

async function createPledge(input: {
  committedAmountCents?: bigint;
  createdAt?: Date;
  pledgeActorKey: string;
  publicDisplay?: boolean;
  publicNameSnapshot?: string;
  status?: TaskFundingPledgeStatus;
  targetId: string;
}) {
  return prisma.taskFundingPledge.create({
    data: {
      id: `${TEST_PREFIX}pledge_${input.pledgeActorKey.replace(":", "_")}`,
      targetId: input.targetId,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: input.pledgeActorKey,
      publicDisplay: input.publicDisplay ?? false,
      publicNameSnapshot: input.publicNameSnapshot ?? null,
      unitKey: "usd",
      unitQuantity: new Prisma.Decimal("1"),
      committedAmountCents: input.committedAmountCents ?? 100n,
      conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
      status: input.status ?? TaskFundingPledgeStatus.ACTIVE,
      createdAt: input.createdAt,
    },
  });
}

async function renderSupporters(
  props: Parameters<typeof TaskFundingPublicSupporters>[0],
) {
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  return renderToStaticMarkup(await TaskFundingPublicSupporters(props));
}

beforeEach(cleanup);
afterAll(cleanup);

describe("TaskFundingPublicSupporters", () => {
  it("renders only opted-in public supporters", async () => {
    const { target, task } = await createTarget("opted_in");

    await createPledge({
      targetId: target.id,
      pledgeActorKey: "person:public_alice",
      publicDisplay: true,
      publicNameSnapshot: "Public Alice",
      committedAmountCents: 2000n,
    });
    await createPledge({
      targetId: target.id,
      pledgeActorKey: "person:private_bob",
      publicDisplay: false,
      publicNameSnapshot: "Private Bob",
      committedAmountCents: 3000n,
    });

    const html = await renderSupporters({ taskId: task.id });

    expect(html).toContain("Public Alice");
    expect(html).toContain("$20");
    expect(html).not.toContain("Private Bob");
  });

  it("caps the rendered supporter list at 100", async () => {
    const { target, task } = await createTarget("limit");
    const baseTime = new Date("2026-05-21T00:00:00.000Z").getTime();

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
        createdAt: new Date(baseTime + index),
      })),
    });

    const html = await renderSupporters({ limit: 500, taskId: task.id });

    expect(html.match(/data-task-funding-supporter/g)).toHaveLength(100);
    expect(html).toContain("Supporter 104");
    expect(html).not.toContain("Supporter 0");
  });

  it("renders the supplied empty state when no supporters are public", async () => {
    const { task } = await createTarget("empty");

    const html = await renderSupporters({
      emptyState: <p>Bring the first pledge.</p>,
      taskId: task.id,
    });

    expect(html).toContain("Bring the first pledge.");
    expect(html).not.toContain("No public supporters yet.");
  });
});
