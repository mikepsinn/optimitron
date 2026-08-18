import {
  OrgStatus,
  OrgType,
  SourceSystem,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
} from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  deleteTaskCreatedByUser,
  listTasks,
  updateTaskCreatedByUser,
} from "@/lib/tasks.server";

const TEST_PREFIX = "task_boundary_";

const PERSONAL_ONLY_BOUNDARY = {
  allowPersonalPrivate: true,
  organizationIds: [] as string[],
};

async function cleanup() {
  await prisma.task.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
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
      displayName: `Task Boundary ${suffix}`,
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

async function createOrgOwnedPrivateTask(creatorUserId: string, id: string) {
  const organization = await prisma.organization.create({
    data: {
      creatorId: creatorUserId,
      id: `${TEST_PREFIX}organization_${id}`,
      name: `Task Boundary Organization ${id}`,
      slug: `${TEST_PREFIX}organization_${id}`,
      status: OrgStatus.APPROVED,
      type: OrgType.OTHER,
    },
  });
  const task = await prisma.task.create({
    data: {
      createdByUserId: creatorUserId,
      description: "Org-owned private boundary fixture.",
      id: `${TEST_PREFIX}${id}`,
      isPublic: false,
      ownerOrganizationId: organization.id,
      title: `Boundary ${id}`,
    },
  });
  return { organization, task };
}

describe.sequential("task client access boundaries and parent scoping", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("blocks a personal-only delegated client from updating an org-owned private task", async () => {
    const actor = await createUser("updater");
    const { task } = await createOrgOwnedPrivateTask(
      actor.user.id,
      "update_task",
    );

    await expect(
      updateTaskCreatedByUser(
        task.id,
        actor.user.id,
        { title: "Delegated rename" },
        { clientAccessBoundary: PERSONAL_ONLY_BOUNDARY },
      ),
    ).rejects.toThrow("Task not found.");
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        select: { title: true },
      }),
    ).resolves.toEqual({ title: task.title });

    await expect(
      updateTaskCreatedByUser(task.id, actor.user.id, {
        title: "Session rename",
      }),
    ).resolves.toMatchObject({ title: "Session rename" });
  });

  it("blocks a personal-only delegated client from deleting an org-owned private task", async () => {
    const actor = await createUser("deleter");
    const { task } = await createOrgOwnedPrivateTask(
      actor.user.id,
      "delete_task",
    );

    await expect(
      deleteTaskCreatedByUser(task.id, actor.user.id, {
        clientAccessBoundary: PERSONAL_ONLY_BOUNDARY,
      }),
    ).rejects.toThrow("Task not found.");
    await expect(
      prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        select: { deletedAt: true },
      }),
    ).resolves.toEqual({ deletedAt: null });

    await expect(
      deleteTaskCreatedByUser(task.id, actor.user.id),
    ).resolves.toEqual({ deleted: true, id: task.id });
    const deleted = await prisma.task.findUniqueOrThrow({
      where: { id: task.id },
      select: { deletedAt: true },
    });
    expect(deleted.deletedAt).not.toBeNull();
  });

  it("nulls an inaccessible private parent so its title and impact do not leak into lists", async () => {
    const creator = await createUser("parent_creator");
    const viewer = await createUser("child_viewer");
    const parentTitle = `${TEST_PREFIX}parent_secret_program`;
    const parent = await prisma.task.create({
      data: {
        createdByUserId: creator.user.id,
        description: "Private parent with an impact estimate.",
        id: `${TEST_PREFIX}parent_task`,
        isPublic: false,
        title: parentTitle,
      },
    });
    const estimateSet = await prisma.taskImpactEstimateSet.create({
      data: {
        calculationVersion: "task-boundary-test.v1",
        counterfactualKey: "status-quo",
        estimateKind: TaskImpactEstimateKind.FORECAST,
        frames: {
          create: {
            adoptionRampYears: 0,
            annualDiscountRate: 0.03,
            benefitDurationYears: 20,
            evaluationHorizonYears: 20,
            expectedEconomicValueUsdBase: 240_000,
            frameKey: TaskImpactFrameKey.TWENTY_YEAR,
            frameSlug: "twenty-year-boundary-test",
            timeToImpactStartDays: 0,
          },
        },
        isCurrent: true,
        methodologyKey: "direct-estimate",
        parameterSetHash: `${TEST_PREFIX}parent_hash`,
        sourceSystem: SourceSystem.MANUAL,
        taskId: parent.id,
      },
    });
    await prisma.task.update({
      where: { id: parent.id },
      data: { currentImpactEstimateSetId: estimateSet.id },
    });
    const child = await prisma.task.create({
      data: {
        assigneePersonId: viewer.person.id,
        createdByUserId: creator.user.id,
        description: "Private child visible to the assignee.",
        id: `${TEST_PREFIX}child_task`,
        isPublic: false,
        parentTaskId: parent.id,
        title: `${TEST_PREFIX}child_task_title`,
      },
    });

    const viewerTasks = await listTasks({
      personId: viewer.person.id,
      userId: viewer.user.id,
      visibility: "accessible",
    });
    const childForViewer = viewerTasks.find((task) => task.id === child.id);
    expect(childForViewer).toBeDefined();
    expect(childForViewer?.parentTask).toBeNull();
    expect(childForViewer?.directImpactFrame).toBeNull();
    expect(childForViewer?.selectedImpactFrame).toBeNull();
    const serialized = JSON.stringify(childForViewer, (_key, value) =>
      typeof value === "bigint" ? value.toString() : (value as unknown),
    );
    expect(serialized).not.toContain(parentTitle);
    expect(serialized).not.toContain("Inherited from parent task");

    const creatorTasks = await listTasks({
      personId: creator.person.id,
      userId: creator.user.id,
      visibility: "accessible",
    });
    const childForCreator = creatorTasks.find((task) => task.id === child.id);
    expect(childForCreator?.parentTask?.id).toBe(parent.id);
    expect(childForCreator?.directImpactFrame).toBeNull();

    // A child no longer borrows a slice of its parent's estimate, even when
    // the viewer can see that parent. Siblings are usually alternative routes
    // to the same outcome rather than components of it, so splitting the
    // parent's value across them described nothing real: it gave an unestimated
    // task a number nobody had estimated. A task's value is now written or
    // absent. This is the accessible-parent counterpart of the leak assertions
    // above, which stay green for a different reason.
    expect(childForCreator?.selectedImpactFrame).toBeNull();
  });
});
