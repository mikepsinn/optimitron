export interface DatedTaskSeriesRecord {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  createdByUserId?: string | null;
  dueAt?: Date | string | null;
  id: string;
  isPublic?: boolean | null;
  ownerOrganizationId?: string | null;
  parentTaskId?: string | null;
  status?: string | null;
  taskKey?: string | null;
  title?: string;
}

export function parseDatedTaskKey(taskKey: string | null | undefined) {
  const match = taskKey?.match(/^(.*)-(\d{4}-\d{2}-\d{2})$/);
  if (!match?.[1] || !match[2]) return null;
  const date = new Date(`${match[2]}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== match[2]
  ) {
    return null;
  }
  return { dateKey: match[2], seriesPrefix: match[1] };
}

function parseDate(value: Date | string | null | undefined) {
  if (value instanceof Date)
    return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function seriesGroupKey(task: DatedTaskSeriesRecord, seriesPrefix: string) {
  return JSON.stringify([
    seriesPrefix,
    task.createdByUserId ?? null,
    task.ownerOrganizationId ?? null,
    task.assigneeOrganizationId ?? null,
    task.assigneePersonId ?? null,
    task.isPublic ?? null,
  ]);
}

export function getSupersededDatedTaskIds(
  tasks: readonly DatedTaskSeriesRecord[],
  now: Date,
) {
  const groups = new Map<
    string,
    Array<{ dateKey: string; dueAt: Date | null; id: string }>
  >();

  for (const task of tasks) {
    if (task.status && task.status !== "ACTIVE") continue;
    const parsed = parseDatedTaskKey(task.taskKey);
    if (!parsed) continue;
    const key = seriesGroupKey(task, parsed.seriesPrefix);
    const group = groups.get(key) ?? [];
    group.push({
      dateKey: parsed.dateKey,
      dueAt: parseDate(task.dueAt),
      id: task.id,
    });
    groups.set(key, group);
  }

  const superseded = new Set<string>();
  for (const group of groups.values()) {
    const latestDateKey = group.reduce(
      (latest, task) => (task.dateKey > latest ? task.dateKey : latest),
      "",
    );
    for (const task of group) {
      if (
        task.dateKey < latestDateKey &&
        task.dueAt != null &&
        task.dueAt.getTime() <= now.getTime()
      ) {
        superseded.add(task.id);
      }
    }
  }
  return superseded;
}
