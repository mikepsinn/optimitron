import { getTaskAncestors, getTaskDetailData } from "@/lib/tasks.server";
import {
  getTaskActivityTimeline,
  getTaskCommentFeed,
} from "@/lib/tasks/task-comments.server";
import { TASK_NOT_FOUND_MESSAGE } from "@/lib/tasks/task-visibility.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PERSON_PROFILE_CACHE_TAG } from "@/lib/person-profile-cache";
import {
  cachePublicRead,
  PUBLIC_TASK_READ_CACHE_TAG,
} from "@/lib/public-read-cache.server";

// Only anonymous read models belong here. Signed-in pages call the live readers.
export const getCachedPublicTaskDetailData = cachePublicRead(
  (id: string) => getTaskDetailData(id, null),
  "public-task-detail-v1",
  [PUBLIC_TASK_READ_CACHE_TAG, PUBLIC_PERSON_PROFILE_CACHE_TAG],
);

// The feed/timeline helpers throw the shared "Task not found" for tasks the
// viewer can't see. The page already renders TaskAccessGate when `data` is
// null, so swallow ONLY that specific throw into an empty feed — any other
// rejection (DB error, bug in assertUserCanViewTask) should surface as a 500
// instead of a silent, indistinguishable "no comments yet".
export const EMPTY_COMMENT_FEED = { comments: [], nextCursor: null, total: 0 };

export function isTaskNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === TASK_NOT_FOUND_MESSAGE;
}

export const getPublicTaskPageData = cachePublicRead(
  async (id: string) => {
    const [data, commentFeed, activityTimeline, ancestors] = await Promise.all([
      getCachedPublicTaskDetailData(id),
      getTaskCommentFeed({
        taskId: id,
        sort: "new",
        limit: 100,
        currentUserId: null,
      }).catch((error) => {
        if (isTaskNotFoundError(error)) return EMPTY_COMMENT_FEED;
        throw error;
      }),
      getTaskActivityTimeline(id, 50, null).catch((error) => {
        if (isTaskNotFoundError(error)) return [];
        throw error;
      }),
      getTaskAncestors(id, null),
    ]);

    const [wishoniaUserId, fundingTarget] = data
      ? await Promise.all([
          getWishoniaUserId().catch(() => null),
          prisma.taskFundingTarget.findFirst({
            where: { taskId: data.task.id, deletedAt: null },
            select: { id: true },
          }),
        ])
      : [null, null];
    return {
      data,
      commentFeed,
      activityTimeline,
      ancestors,
      wishoniaUserId,
      hasFundingTarget: fundingTarget != null,
    };
  },
  "public-task-page-v1",
  [PUBLIC_TASK_READ_CACHE_TAG, PUBLIC_PERSON_PROFILE_CACHE_TAG],
);
