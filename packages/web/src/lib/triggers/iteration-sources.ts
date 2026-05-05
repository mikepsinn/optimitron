import { TaskStatus } from "@optimitron/db";
import type { Prisma, PrismaClient } from "@optimitron/db";

/**
 * Iteration sources for cron-driven trigger fires.
 *
 * The `/api/cron/run-due-triggers` route reads each due trigger and looks up
 * its `iterationSource` here. The resolver returns an array of records; the
 * trigger is fired once per record with the record injected at a known key
 * in the context (e.g. `context.task` for "overdue-tasks").
 *
 * Adding a new iteration source is a code change here — that's intentional.
 * The framework keeps "what queries the data" in code (small, named, typed)
 * and "what to do with each record" in DB rows (templated, MCP-editable).
 *
 * Naming: `iterationSource` strings are kebab-case nouns describing the
 * record set ("overdue-tasks", "users-pending-digest").
 */

export type IterationDb =
  | PrismaClient
  | Pick<Prisma.TransactionClient, "task" | "user">;

export interface IterationRecord {
  /// The key under which the record will be injected into the trigger context.
  /// e.g. `task` for "overdue-tasks" → `context.task = <Task row>`.
  contextKey: string;
  /// The record itself.
  record: unknown;
  /// Number of prior communication sends for this record's identity, used
  /// for sendCount-range filtering on TaskCommunicationSpawnSpec. Resolvers
  /// that don't drive communications can return 0.
  priorSendCount: number;
}

export type IterationResolver = (db: IterationDb) => Promise<IterationRecord[]>;

const noneResolver: IterationResolver = async () => [
  // One synthetic record so the trigger fires exactly once. The empty
  // contextKey skips injection — the trigger gets the bare context.
  { contextKey: "", record: null, priorSendCount: 0 },
];

const overdueTasksResolver: IterationResolver = async (db) => {
  const now = new Date();
  const overdue = await db.task.findMany({
    where: {
      deletedAt: null,
      dueAt: { lt: now },
      status: { notIn: [TaskStatus.VERIFIED, TaskStatus.STALE] },
    },
    select: {
      id: true,
      taskKey: true,
      title: true,
      createdByUserId: true,
      assigneePersonId: true,
      assigneeOrganizationId: true,
      parentTaskId: true,
      dueAt: true,
      createdAt: true,
    },
  });
  // priorSendCount per task is computed inline by the cron handler from
  // TaskCommunication rows — the resolver itself doesn't know which trigger
  // is asking, so it returns 0 here and the handler enriches.
  return overdue.map((task) => ({
    contextKey: "task",
    record: task,
    priorSendCount: 0,
  }));
};

const REGISTRY: Record<string, IterationResolver> = {
  none: noneResolver,
  "overdue-tasks": overdueTasksResolver,
};

export function resolveIterationSource(key: string | null | undefined): IterationResolver | null {
  if (!key || key === "none") return noneResolver;
  return REGISTRY[key] ?? null;
}

export function listIterationSourceKeys(): string[] {
  return Object.keys(REGISTRY);
}
