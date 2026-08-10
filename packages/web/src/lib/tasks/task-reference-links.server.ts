import { prisma } from "@/lib/prisma";
import { getTaskVisibilityWhere } from "@/lib/tasks/task-visibility.server";
import {
  extractTaskReferenceIds,
  type TaskReferenceLink,
} from "@/lib/tasks/task-reference-links";

export async function resolveTaskReferenceLinks(input: {
  markdown: string;
  personId?: string | null;
  userId?: string | null;
}): Promise<TaskReferenceLink[]> {
  const taskIds = extractTaskReferenceIds(input.markdown);
  if (taskIds.length === 0) return [];

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        getTaskVisibilityWhere({
          personId: input.personId,
          userId: input.userId,
          visibility: "accessible",
        }),
        { id: { in: taskIds } },
      ],
    },
    select: { id: true, title: true },
  });
  const taskById = new Map(tasks.map((task) => [task.id, task]));

  return taskIds.flatMap((id) => {
    const task = taskById.get(id);
    return task
      ? [{ href: `/tasks/${task.id}`, id: task.id, title: task.title }]
      : [];
  });
}
