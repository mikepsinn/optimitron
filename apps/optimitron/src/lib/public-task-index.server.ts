import { prisma } from "@/lib/prisma";
import { getTaskVisibilityWhere } from "@/lib/tasks/task-visibility.server";
import {
  cachePublicRead,
  PUBLIC_TASK_READ_CACHE_TAG,
  PUBLIC_TASK_REVALIDATE_SECONDS,
} from "@/lib/public-read-cache.server";

// One bounded catalog read handles every missing/private ID. Do not cache a
// separate database lookup for each arbitrary path a crawler invents.
const getPublicTaskIds = cachePublicRead(
  async () => new Set((await prisma.task.findMany({
    where: getTaskVisibilityWhere({ visibility: "public" }),
    select: { id: true },
  })).map(({ id }) => id)),
  "public-task-ids-v1",
  [PUBLIC_TASK_READ_CACHE_TAG],
  PUBLIC_TASK_REVALIDATE_SECONDS,
);

export async function isPublicTaskId(id: string): Promise<boolean> {
  return Boolean(id.trim()) && (await getPublicTaskIds()).has(id.trim());
}
