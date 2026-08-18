import { TaskEdgeType } from "@optimitron/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  applyPrivateTaskBundle,
  reviewPrivateTaskBundle,
} from "./private-task-bundle.server";

const TEST_PREFIX = "private_bundle_";
const SELECTION_ID = `${TEST_PREFIX}selection_1`;

async function cleanup() {
  await prisma.task.deleteMany({
    where: { createdByUserId: { startsWith: TEST_PREFIX } },
  });
  await prisma.sourceArtifact.deleteMany({
    where: { ownerUserId: { startsWith: TEST_PREFIX } },
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
      displayName: `Private Bundle ${suffix}`,
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

async function createPrivateRoot(creatorUserId: string) {
  return prisma.task.create({
    data: {
      createdByUserId: creatorUserId,
      description: "Private root for conversation-to-work imports.",
      id: `${TEST_PREFIX}root`,
      isPublic: false,
      title: "Private bundle root",
    },
  });
}

function candidateBase(ref: string, title: string) {
  return {
    acceptanceCriteria: ["The deliverable is saved"],
    description: `Private candidate ${ref}.`,
    eligibleExecutorTypes: ["HUMAN"],
    estimatedCostUsd: { base: 10, high: 20, low: 0 },
    estimatedDurationSeconds: { base: 3_600, high: 7_200, low: 1_800 },
    expectedDeliverable: "A saved deliverable",
    expectedValueUsd: { base: 500, high: 900, low: 100 },
    groundedByAnchors: [`msg-${ref}`],
    objectiveServed: "Ship the private launch",
    privacyClassification: "PERSONAL_PRIVATE",
    projectOrWorkflow: "Private launch",
    ref,
    successProbability: { base: 0.6, high: 0.9, low: 0.3 },
    title,
  };
}

function buildBundle(rootTaskId: string) {
  return {
    candidates: [
      candidateBase("a", `${TEST_PREFIX}Draft launch email`),
      {
        ...candidateBase("b", `${TEST_PREFIX}Send launch email`),
        dependencyRefs: ["a"],
        parentRef: "a",
      },
    ],
    rootTaskId,
    source: {
      channel: "SLACK",
      messageAnchors: ["msg-a", "msg-b"],
      selectionHash: "0123456789abcdef0123456789abcdef",
      selectionId: SELECTION_ID,
      title: `${TEST_PREFIX}Slack selection`,
      userSelected: true,
    },
  };
}

function importedTaskKey(actorUserId: string, candidateRef: string) {
  return `private-import:${actorUserId}:${SELECTION_ID}:${candidateRef}`;
}

describe.sequential("private task bundle review and apply", () => {
  beforeEach(cleanup);
  afterAll(cleanup);

  it("applies a reviewed bundle as private tasks scoped under the root", async () => {
    const actor = await createUser("importer");
    const root = await createPrivateRoot(actor.user.id);
    const bundle = buildBundle(root.id);

    const review = await reviewPrivateTaskBundle(bundle, actor.user.id);
    expect(review.errors).toEqual([]);
    expect(review.root?.id).toBe(root.id);
    expect(review.create.map((action) => action.candidateRef).sort()).toEqual([
      "a",
      "b",
    ]);
    const reviewHash = review.reviewHash;
    if (!reviewHash) throw new Error("Review hash missing");

    const applied = await applyPrivateTaskBundle(
      bundle,
      reviewHash,
      actor.user.id,
    );
    expect(applied.created).toHaveLength(2);
    expect(applied.reviewHash).toBe(reviewHash);

    const taskA = await prisma.task.findUniqueOrThrow({
      where: { taskKey: importedTaskKey(actor.user.id, "a") },
      select: {
        createdByUserId: true,
        id: true,
        isPublic: true,
        ownerOrganizationId: true,
        parentTaskId: true,
      },
    });
    const taskB = await prisma.task.findUniqueOrThrow({
      where: { taskKey: importedTaskKey(actor.user.id, "b") },
      select: { id: true, isPublic: true, parentTaskId: true },
    });
    expect(taskA).toMatchObject({
      createdByUserId: actor.user.id,
      isPublic: false,
      ownerOrganizationId: null,
      parentTaskId: root.id,
    });
    expect(taskB).toMatchObject({
      isPublic: false,
      parentTaskId: taskA.id,
    });
    await expect(
      prisma.taskEdge.findFirstOrThrow({
        where: {
          deletedAt: null,
          edgeType: TaskEdgeType.BLOCKS,
          fromTaskId: taskA.id,
          toTaskId: taskB.id,
        },
        select: { id: true },
      }),
    ).resolves.toBeTruthy();

    const sourceLink = await prisma.taskSourceArtifact.findFirstOrThrow({
      where: { deletedAt: null, taskId: taskA.id },
      select: {
        isPrimary: true,
        sourceArtifact: {
          select: { isPublic: true, ownerUserId: true, sourceKey: true },
        },
      },
    });
    expect(sourceLink.isPrimary).toBe(true);
    expect(sourceLink.sourceArtifact.isPublic).toBe(false);
    expect(sourceLink.sourceArtifact.ownerUserId).toBe(actor.user.id);
    expect(
      sourceLink.sourceArtifact.sourceKey.startsWith("private-selection:"),
    ).toBe(true);
  });

  it("rejects an apply whose review hash does not match the submitted bundle", async () => {
    const actor = await createUser("hash_checker");
    const root = await createPrivateRoot(actor.user.id);
    const bundle = buildBundle(root.id);

    const review = await reviewPrivateTaskBundle(bundle, actor.user.id);
    const reviewHash = review.reviewHash;
    if (!reviewHash) throw new Error("Review hash missing");

    await expect(
      applyPrivateTaskBundle(bundle, "0".repeat(64), actor.user.id),
    ).rejects.toThrow("Private task bundle changed after review; review it again");

    const tamperedBundle = buildBundle(root.id);
    tamperedBundle.candidates[0].title = `${TEST_PREFIX}Tampered title`;
    await expect(
      applyPrivateTaskBundle(tamperedBundle, reviewHash, actor.user.id),
    ).rejects.toThrow("Private task bundle changed after review; review it again");
    await expect(
      prisma.task.count({
        where: { taskKey: { startsWith: `private-import:${actor.user.id}:` } },
      }),
    ).resolves.toBe(0);
  });

  it("requires a fresh review to re-apply and updates instead of duplicating", async () => {
    const actor = await createUser("reapplier");
    const root = await createPrivateRoot(actor.user.id);
    const bundle = buildBundle(root.id);

    const firstReview = await reviewPrivateTaskBundle(bundle, actor.user.id);
    const firstHash = firstReview.reviewHash;
    if (!firstHash) throw new Error("Review hash missing");
    await applyPrivateTaskBundle(bundle, firstHash, actor.user.id);

    // The applied tasks change the plan, so the original hash is stale.
    await expect(
      applyPrivateTaskBundle(bundle, firstHash, actor.user.id),
    ).rejects.toThrow("Private task bundle changed after review; review it again");

    const secondReview = await reviewPrivateTaskBundle(bundle, actor.user.id);
    expect(secondReview.reviewHash).not.toBe(firstHash);
    expect(secondReview.create).toEqual([]);
    expect(
      secondReview.update.map((action) => action.candidateRef).sort(),
    ).toEqual(["a", "b"]);
    const secondHash = secondReview.reviewHash;
    if (!secondHash) throw new Error("Review hash missing");

    const reapplied = await applyPrivateTaskBundle(
      bundle,
      secondHash,
      actor.user.id,
    );
    expect(reapplied.created).toEqual([]);
    expect(reapplied.updated).toHaveLength(2);
    await expect(
      prisma.task.count({
        where: {
          taskKey: {
            in: [
              importedTaskKey(actor.user.id, "a"),
              importedTaskKey(actor.user.id, "b"),
            ],
          },
        },
      }),
    ).resolves.toBe(2);
  });
});
