import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
import { TASK_FUNDING_CONVERSION_VERSION } from "@/lib/task-funding/conversion.server";
import { TaskFundingProgress } from "../TaskFundingProgress";

const TEST_PREFIX = "tf_progress_component_";

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

async function createTarget(input: {
  status?: TaskFundingTargetStatus;
  suffix: string;
  targetAmountCents: bigint;
}) {
  const { user } = await createUserWithPerson(`creator_${input.suffix}`, "Creator");
  const task = await prisma.task.create({
    data: {
      id: `${TEST_PREFIX}task_${input.suffix}`,
      createdByUserId: user.id,
      title: `Funding progress task ${input.suffix}`,
      description: "A task with a funding target.",
    },
  });
  const target = await prisma.taskFundingTarget.create({
    data: {
      id: `${TEST_PREFIX}target_${input.suffix}`,
      taskId: task.id,
      targetAmountCents: input.targetAmountCents,
      status: input.status ?? TaskFundingTargetStatus.OPEN,
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
      unitKey: input.unitKey ?? "usd",
      unitQuantity: new Prisma.Decimal(input.unitQuantity ?? "1"),
      committedAmountCents: input.committedAmountCents,
      conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
      status: TaskFundingPledgeStatus.ACTIVE,
    },
  });
}

async function renderProgress(
  props: Parameters<typeof TaskFundingProgress>[0],
) {
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  return renderToStaticMarkup(await TaskFundingProgress(props));
}

beforeEach(cleanup);
afterAll(cleanup);

describe("TaskFundingProgress", () => {
  it("renders zeros for an open target with no pledges", async () => {
    const { task } = await createTarget({
      suffix: "empty",
      targetAmountCents: 5000n,
    });

    const html = await renderProgress({ taskId: task.id });

    expect(html).toContain("$0 of $50 paid or pledged");
    expect(html).toContain("$50 remaining");
    expect(html).toContain("0%");
    expect(html).toContain("OPEN");
    expect(html).toContain("0 supporters");
  });

  it("renders the individual and organization breakdown", async () => {
    const { target, task } = await createTarget({
      suffix: "mixed",
      targetAmountCents: 10_000n,
    });
    const alice = await createUserWithPerson("alice", "Alice");
    const owner = await createUserWithPerson("owner", "Owner");
    const org = await createOrganization("one", "One Org", owner.user.id);

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
      pledgedByUserId: owner.user.id,
      pledgerOrganizationId: org.id,
      unitKey: "commerce-offer:shirt",
      unitQuantity: "2",
      committedAmountCents: 5000n,
    });

    const html = await renderProgress({
      showBreakdown: true,
      showUnitBreakdown: true,
      taskId: task.id,
    });

    expect(html).toContain("$90 of $100 paid or pledged");
    expect(html).toContain("$10 remaining");
    expect(html).toContain("90%");
    expect(html).toContain("2 supporters");
    expect(html).toContain("Individuals");
    expect(html).toContain("1");
    expect(html).toContain("Organizations");
    expect(html).toContain("commerce-offer:shirt");
    expect(html).toContain("2");
  });

  it("shows the threshold-met badge", async () => {
    const { target, task } = await createTarget({
      suffix: "threshold_met",
      targetAmountCents: 1000n,
      status: TaskFundingTargetStatus.THRESHOLD_MET,
    });
    const alice = await createUserWithPerson("alice_met", "Alice");
    await createPledge({
      targetId: target.id,
      pledgerKind: TaskFundingPledgerKind.PERSON,
      pledgeActorKey: `person:${alice.person.id}`,
      pledgedByUserId: alice.user.id,
      pledgerPersonId: alice.person.id,
      committedAmountCents: 1000n,
    });

    const html = await renderProgress({ taskId: task.id });

    expect(html).toContain("THRESHOLD_MET");
    expect(html).toContain("Threshold met");
  });
});
