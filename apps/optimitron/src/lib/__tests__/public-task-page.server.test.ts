import { randomUUID } from "node:crypto";
import path from "node:path";
import { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import { nodeFs } from "next/dist/server/lib/node-fs-methods";
import { tagsManifest } from "next/dist/server/lib/incremental-cache/tags-manifest.external";
import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";
import { executeRevalidates, withExecuteRevalidates } from "next/dist/server/revalidation-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCachedPublicTaskDetailData,
  getPublicTaskPageData,
} from "@/lib/public-task-page.server";
import { invalidatePublicTaskReads, invalidatePublicTaskReplies, PUBLIC_TASK_READ_CACHE_TAG } from "@/lib/public-read-cache.server";
import { PUBLIC_PERSON_PROFILE_CACHE_TAG } from "@/lib/person-profile-cache";
import { getCachedPersonTaskProfileData, getCachedRepresentedPersonProfileData } from "@/lib/public-person-profile.server";

const readers = vi.hoisted(() => ({
  detail: vi.fn(),
  ancestors: vi.fn(),
  comments: vi.fn(),
  activity: vi.fn(),
  wishonia: vi.fn(),
  fundingTarget: vi.fn(),
  personTasks: vi.fn(),
  representedPerson: vi.fn(),
}));
vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  Object.assign(globalThis, { AsyncLocalStorage });
});
vi.mock("@/lib/tasks.server", () => ({
  getTaskDetailData: readers.detail,
  getTaskAncestors: readers.ancestors,
  getPersonTaskProfileData: readers.personTasks,
}));
vi.mock("@/lib/represented-people.server", () => ({
  getRepresentedPersonProfileData: readers.representedPerson,
}));
vi.mock("@/lib/tasks/task-comments.server", () => ({
  getTaskCommentFeed: readers.comments,
  getTaskActivityTimeline: readers.activity,
}));
vi.mock("@/lib/tasks/task-visibility.server", () => ({
  TASK_NOT_FOUND_MESSAGE: "Task not found",
}));
vi.mock("@/lib/wishonia.server", () => ({
  getWishoniaUserId: readers.wishonia,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { taskFundingTarget: { findFirst: readers.fundingTarget } },
}));

let cache: IncrementalCache;
beforeEach(() => {
  vi.resetAllMocks();
  tagsManifest.clear();
  cache = new IncrementalCache({
    dev: false,
    requestHeaders: {},
    fs: nodeFs,
    serverDistDir: path.join(process.cwd(), ".next", "cache-regression"),
    flushToDisk: false,
    maxMemoryCacheSize: 1024 * 1024,
    fetchCacheKeyPrefix: randomUUID(),
    getPrerenderManifest: () => ({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: {
        previewModeId: "test",
        previewModeEncryptionKey: "test",
        previewModeSigningKey: "test",
      },
    }),
  });
  (
    globalThis as typeof globalThis & { __incrementalCache: IncrementalCache }
  ).__incrementalCache = cache;
  readers.detail.mockImplementation(async (id: string) => ({
    task: {
      id,
      dueAt: new Date("2026-10-01T00:00:00Z"),
      compensationMaxAmountMinorUnits: 100n,
    },
  }));
  readers.ancestors.mockResolvedValue([]);
  readers.comments.mockResolvedValue({
    comments: [],
    total: 0,
    nextCursor: null,
  });
  readers.activity.mockResolvedValue([]);
  readers.wishonia.mockResolvedValue("wishonia");
  readers.fundingTarget.mockResolvedValue(null);
});

describe("anonymous task reads through Next's real persistent cache", () => {
  it("shares metadata and page reads across requests while preserving Dates and BigInts", async () => {
    const metadata = await getCachedPublicTaskDetailData("public-task");
    const first = await getPublicTaskPageData("public-task");
    cache.resetRequestCache();
    const second = await getPublicTaskPageData("public-task");
    expect(second).toEqual(first);
    expect(second.data).toEqual(metadata);
    expect(second.data?.task.dueAt?.getUTCFullYear()).toBe(2026);
    expect(second.data?.task.compensationMaxAmountMinorUnits).toBe(100n);
    expect(second.hasFundingTarget).toBe(false);
    for (const reader of [readers.detail, readers.ancestors, readers.comments, readers.activity, readers.wishonia, readers.fundingTarget])
      expect(reader).toHaveBeenCalledTimes(1);
    expect(readers.detail).toHaveBeenCalledWith("public-task", null);
    expect(readers.comments).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserId: null }),
    );
    await getPublicTaskPageData("another-task");
    expect(readers.detail).toHaveBeenCalledTimes(2);
  });

  it("withdraws cached metadata, comments, and page data together after deletion or privacy changes", async () => {
    await getPublicTaskPageData("public-task");
    readers.detail.mockResolvedValue(null);
    readers.comments.mockRejectedValue(new Error("Task not found"));
    readers.activity.mockRejectedValue(new Error("Task not found"));
    await cache.revalidateTag(PUBLIC_TASK_READ_CACHE_TAG);
    cache.resetRequestCache();
    expect(await getCachedPublicTaskDetailData("public-task")).toBeNull();
    expect(await getPublicTaskPageData("public-task")).toEqual({
      data: null,
      commentFeed: { comments: [], total: 0, nextCursor: null },
      activityTimeline: [],
      ancestors: [],
      wishoniaUserId: null,
      hasFundingTarget: false,
    });
  });

  it("discovers the first funding target after checkout invalidates the cached absence", async () => {
    expect((await getPublicTaskPageData("public-task")).hasFundingTarget).toBe(false);
    readers.fundingTarget.mockResolvedValue({ id: "new-target" });
    await cache.revalidateTag(PUBLIC_TASK_READ_CACHE_TAG);
    cache.resetRequestCache();
    expect((await getPublicTaskPageData("public-task")).hasFundingTarget).toBe(true);
  });

  it("does not cache a database failure as an empty feed", async () => {
    readers.comments.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(getPublicTaskPageData("public-task")).rejects.toThrow(
      "database unavailable",
    );
    readers.comments.mockResolvedValue({
      comments: [{ id: "comment" }],
      total: 1,
      nextCursor: null,
    });
    cache.resetRequestCache();
    expect((await getPublicTaskPageData("public-task")).commentFeed.total).toBe(
      1,
    );
  });

  it("withdraws both cached profile models after a public profile becomes private", async () => {
    const profile = { person: { id: "public-person", displayName: "Ada" } };
    readers.personTasks.mockResolvedValue(profile);
    readers.representedPerson.mockResolvedValue(profile);
    expect(await getCachedPersonTaskProfileData("public-person")).toEqual(profile);
    expect(await getCachedRepresentedPersonProfileData("public-person")).toEqual(profile);
    readers.personTasks.mockResolvedValue(null);
    readers.representedPerson.mockResolvedValue(null);
    cache.resetRequestCache();
    expect(await getCachedPersonTaskProfileData("public-person")).toEqual(profile);
    expect(await getCachedRepresentedPersonProfileData("public-person")).toEqual(profile);
    await cache.revalidateTag(PUBLIC_PERSON_PROFILE_CACHE_TAG);
    cache.resetRequestCache();
    expect(await getCachedPersonTaskProfileData("public-person")).toBeNull();
    expect(await getCachedRepresentedPersonProfileData("public-person")).toBeNull();
  });

  it("refreshes a reply committed after the original comment invalidation was flushed", async () => {
    const store = { incrementalCache: cache, route: "/api/tasks/task/comments" } as WorkStore;
    await workAsyncStorage.run(store, async () => {
      invalidatePublicTaskReads();
      await executeRevalidates(store);
    });
    expect((await getPublicTaskPageData("public-task")).commentFeed.total).toBe(0);
    readers.comments.mockResolvedValue({ comments: [{ id: "reply" }], total: 1, nextCursor: null });
    // This is the same revalidation lifecycle Next uses to execute after().
    await workAsyncStorage.run(store, () => withExecuteRevalidates(store, async () => {
      invalidatePublicTaskReads();
      invalidatePublicTaskReplies();
    }));
    cache.resetRequestCache();
    expect((await getPublicTaskPageData("public-task")).commentFeed.comments).toEqual([{ id: "reply" }]);
  });
});
