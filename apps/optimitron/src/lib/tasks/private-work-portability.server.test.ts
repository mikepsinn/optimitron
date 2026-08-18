import { SourceArtifactType, SourceSystem } from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  deletePrivateSourceSelection,
  exportPrivateWork,
} from "./private-work-portability.server";

const TEST_PREFIX = "private_portability_";

async function cleanup() {
  await prisma.task.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.sourceArtifact.deleteMany({
    where: {
      OR: [
        { ownerUserId: { startsWith: TEST_PREFIX } },
        { sourceKey: { contains: TEST_PREFIX } },
      ],
    },
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
      displayName: `Portability ${suffix}`,
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

async function createPrivateTask(input: {
  creatorUserId: string;
  id: string;
  parentTaskId?: string;
}) {
  return prisma.task.create({
    data: {
      createdByUserId: input.creatorUserId,
      description: "Private work portability fixture.",
      id: `${TEST_PREFIX}${input.id}`,
      isPublic: false,
      parentTaskId: input.parentTaskId,
      title: `Portability ${input.id}`,
    },
  });
}

async function createSourceArtifact(input: {
  isPublic: boolean;
  ownerUserId: string;
  sourceKey: string;
}) {
  return prisma.sourceArtifact.create({
    data: {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      externalKey: `${TEST_PREFIX}selection`,
      isPublic: input.isPublic,
      ownerUserId: input.ownerUserId,
      payloadJson: { userSelected: true },
      sourceKey: input.sourceKey,
      sourceSystem: SourceSystem.EXTERNAL,
      title: `Portability source ${input.sourceKey}`,
    },
  });
}

describe.sequential("private work portability boundaries", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("exports only the actor's accessible private tree and visible sources", async () => {
    const actor = await createUser("exporter");
    const other = await createUser("other");
    const root = await createPrivateTask({
      creatorUserId: actor.user.id,
      id: "export_root",
    });
    const ownChild = await createPrivateTask({
      creatorUserId: actor.user.id,
      id: "export_own_child",
      parentTaskId: root.id,
    });
    const foreignChild = await createPrivateTask({
      creatorUserId: other.user.id,
      id: "export_foreign_child",
      parentTaskId: root.id,
    });
    const ownSource = await createSourceArtifact({
      isPublic: false,
      ownerUserId: actor.user.id,
      sourceKey: `private-selection:${TEST_PREFIX}export_own`,
    });
    const foreignSource = await createSourceArtifact({
      isPublic: false,
      ownerUserId: other.user.id,
      sourceKey: `private-selection:${TEST_PREFIX}export_foreign`,
    });
    await prisma.taskSourceArtifact.createMany({
      data: [
        { sourceArtifactId: ownSource.id, taskId: ownChild.id },
        { sourceArtifactId: foreignSource.id, taskId: ownChild.id },
      ],
    });

    const exported = await exportPrivateWork(
      { rootTaskId: root.id },
      actor.user.id,
    );

    const exportedTaskIds = exported.tasks.map((task) => task.id);
    expect(exportedTaskIds).toContain(root.id);
    expect(exportedTaskIds).toContain(ownChild.id);
    expect(exportedTaskIds).not.toContain(foreignChild.id);

    const exportedChild = exported.tasks.find(
      (task) => task.id === ownChild.id,
    );
    const exportedSourceIds =
      exportedChild?.sourceArtifacts.map((link) => link.sourceArtifact.id) ??
      [];
    expect(exportedSourceIds).toContain(ownSource.id);
    expect(exportedSourceIds).not.toContain(foreignSource.id);

    await expect(
      exportPrivateWork({ rootTaskId: root.id }, other.user.id),
    ).rejects.toThrow("Task not found");
  });

  it("deletes only manageable private-selection sources and leaves the rest intact", async () => {
    const actor = await createUser("deleter");
    const other = await createUser("foreign");
    const task = await createPrivateTask({
      creatorUserId: actor.user.id,
      id: "delete_task",
    });
    const ownSelection = await createSourceArtifact({
      isPublic: false,
      ownerUserId: actor.user.id,
      sourceKey: `private-selection:${TEST_PREFIX}delete_own`,
    });
    const publicSource = await createSourceArtifact({
      isPublic: true,
      ownerUserId: actor.user.id,
      sourceKey: `private-selection:${TEST_PREFIX}delete_public`,
    });
    const foreignSource = await createSourceArtifact({
      isPublic: false,
      ownerUserId: other.user.id,
      sourceKey: `private-selection:${TEST_PREFIX}delete_foreign`,
    });
    const wrongPrefixSource = await createSourceArtifact({
      isPublic: false,
      ownerUserId: actor.user.id,
      sourceKey: `task-import:${TEST_PREFIX}delete_wrong_prefix`,
    });
    const link = await prisma.taskSourceArtifact.create({
      data: { sourceArtifactId: ownSelection.id, taskId: task.id },
    });

    await expect(
      deletePrivateSourceSelection(
        { sourceArtifactId: publicSource.id },
        actor.user.id,
      ),
    ).rejects.toThrow("Source artifact not found");
    await expect(
      deletePrivateSourceSelection(
        { sourceArtifactId: foreignSource.id },
        actor.user.id,
      ),
    ).rejects.toThrow("Source artifact not found");
    await expect(
      deletePrivateSourceSelection(
        { sourceArtifactId: wrongPrefixSource.id },
        actor.user.id,
      ),
    ).rejects.toThrow("Source artifact not found");
    await expect(
      prisma.sourceArtifact.findMany({
        where: {
          deletedAt: null,
          id: {
            in: [publicSource.id, foreignSource.id, wrongPrefixSource.id],
          },
        },
        select: { id: true },
      }),
    ).resolves.toHaveLength(3);

    const result = await deletePrivateSourceSelection(
      { sourceArtifactId: ownSelection.id },
      actor.user.id,
    );
    expect(result.sourceArtifactId).toBe(ownSelection.id);
    expect(result.unlinkedTaskIds).toEqual([task.id]);

    const scrubbed = await prisma.sourceArtifact.findUniqueOrThrow({
      where: { id: ownSelection.id },
      select: {
        deletedAt: true,
        externalKey: true,
        sourceRef: true,
        sourceUrl: true,
        title: true,
      },
    });
    expect(scrubbed.deletedAt).not.toBeNull();
    expect(scrubbed.externalKey).toBeNull();
    expect(scrubbed.sourceRef).toBeNull();
    expect(scrubbed.sourceUrl).toBeNull();
    expect(scrubbed.title).toBe("Deleted private source selection");
    const linkRow = await prisma.taskSourceArtifact.findUniqueOrThrow({
      where: { id: link.id },
      select: { deletedAt: true },
    });
    expect(linkRow.deletedAt).not.toBeNull();
  });
});
