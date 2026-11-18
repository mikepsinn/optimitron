import { randomUUID } from "node:crypto";
import path from "node:path";
import { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import { nodeFs } from "next/dist/server/lib/node-fs-methods";
import { tagsManifest } from "next/dist/server/lib/incremental-cache/tags-manifest.external";
import { beforeEach, expect, it, vi } from "vitest";
import { getTasksPageData, verifyTask } from "@/lib/tasks.server";
import { TaskClaimPolicy, TaskStatus } from "@optimitron/db";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "@/lib/tasks/task-keys";
import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";
import { executeRevalidates } from "next/dist/server/revalidation-utils";
import { getTaskTreePageData } from "@/lib/tasks/task-tree.server";
import { PUBLIC_TASK_READ_CACHE_TAG } from "@/lib/public-read-cache.server";

const db = vi.hoisted(() => ({ tasks: vi.fn(), user: vi.fn(), transaction: vi.fn() }));
vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  Object.assign(globalThis, { AsyncLocalStorage });
});
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: db.transaction,
  task: { findMany: db.tasks },
  user: { findUnique: db.user, findUniqueOrThrow: db.user },
} }));

let cache: IncrementalCache;
beforeEach(() => {
  vi.resetAllMocks();
  tagsManifest.clear();
  db.tasks.mockResolvedValue([]);
  db.user.mockResolvedValue(null);
  cache = new IncrementalCache({
    dev: false, requestHeaders: {}, fs: nodeFs,
    serverDistDir: path.join(process.cwd(), ".next", "cache-regression"),
    flushToDisk: false, maxMemoryCacheSize: 1024 * 1024,
    fetchCacheKeyPrefix: randomUUID(),
    getPrerenderManifest: () => ({ version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [],
      preview: { previewModeId: "test", previewModeEncryptionKey: "test", previewModeSigningKey: "test" },
    }),
  });
  (globalThis as typeof globalThis & { __incrementalCache: IncrementalCache }).__incrementalCache = cache;
});

it("reuses the anonymous task list across requests and refreshes on task mutations", async () => {
  const first = await getTasksPageData(null);
  expect(first.viewer).toBeNull();
  expect(first.assignedToMe).toEqual([]);
  expect(db.tasks).toHaveBeenCalledTimes(2);
  for (let i = 0; i < 20; i++) {
    cache.resetRequestCache();
    expect(await getTasksPageData()).toEqual(first);
  }
  expect(db.tasks).toHaveBeenCalledTimes(2);
  expect(db.user).not.toHaveBeenCalled();
  await cache.revalidateTag(PUBLIC_TASK_READ_CACHE_TAG);
  cache.resetRequestCache();
  await getTasksPageData(null);
  expect(db.tasks).toHaveBeenCalledTimes(4);
});

it("keeps signed-in lists live and outside the shared anonymous cache", async () => {
  db.user.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id, personId: null, availableHoursPerWeek: 5,
    interestTags: [], skillTags: [], isAdmin: false,
  }));
  await getTasksPageData(null);
  expect((await getTasksPageData("viewer-a")).viewer?.id).toBe("viewer-a");
  cache.resetRequestCache();
  expect((await getTasksPageData("viewer-b")).viewer?.id).toBe("viewer-b");
  expect(db.tasks).toHaveBeenCalledTimes(6);
  expect(db.user).toHaveBeenCalledTimes(2);
  expect((await getTasksPageData(null)).viewer).toBeNull();
  expect(db.tasks).toHaveBeenCalledTimes(6);
});

it("shares anonymous tree reads but reloads signed-in trees and invalidated trees", async () => {
  const first = await getTaskTreePageData(null);
  cache.resetRequestCache();
  expect(await getTaskTreePageData(null)).toEqual(first);
  expect(db.tasks).toHaveBeenCalledTimes(1);
  await getTaskTreePageData("viewer");
  cache.resetRequestCache();
  await getTaskTreePageData("viewer");
  expect(db.tasks).toHaveBeenCalledTimes(3);
  expect(db.user).toHaveBeenCalledTimes(2);
  await cache.revalidateTag(PUBLIC_TASK_READ_CACHE_TAG);
  cache.resetRequestCache();
  await getTaskTreePageData(null);
  expect(db.tasks).toHaveBeenCalledTimes(4);
});

it("shows a verified task in the cached public tree only after the mutation commits", async () => {
  const task = {
    id: OPTIMIZE_EARTH_ROOT_TASK_ID, title: "Public mission", status: TaskStatus.ACTIVE as TaskStatus,
    isPublic: true, parentTaskId: null, createdAt: new Date("2026-01-01"), dueAt: null,
    contextJson: null, currentImpactEstimateSet: null, incomingEdges: [], outgoingEdges: [],
    estimatedEffortHours: null, sortOrder: 0, taskKey: null,
  };
  db.tasks.mockImplementation(async () => [{ ...task }]);
  db.user.mockResolvedValue({ id: "reviewer", isAdmin: true, personId: null });
  const tx = { task: {
    findFirst: async () => ({ ...task, claimPolicy: TaskClaimPolicy.OPEN_SINGLE }),
    update: async () => ({ ...task, status: TaskStatus.VERIFIED }),
  } };
  db.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const result = await run(tx);
    expect((await getTaskTreePageData(null)).root?.status).toBe(TaskStatus.ACTIVE);
    task.status = TaskStatus.VERIFIED;
    return result;
  });
  expect((await getTaskTreePageData(null)).root?.status).toBe(TaskStatus.ACTIVE);
  const store = { incrementalCache: cache, route: "/api/tasks/task/verify" } as WorkStore;
  await workAsyncStorage.run(store, async () => {
    await verifyTask(task.id, "reviewer", { completionEvidence: "Completed work" });
    await executeRevalidates(store);
  });
  cache.resetRequestCache();
  expect((await getTaskTreePageData(null)).root?.status).toBe(TaskStatus.VERIFIED);
});
