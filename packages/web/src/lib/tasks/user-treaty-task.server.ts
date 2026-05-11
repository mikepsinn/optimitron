/**
 * Per-user 1% Treaty Humanity Management onboarding tree.
 *
 * The actual spawning is handled by the `user-onboarding:treaty` TaskTrigger
 * blueprint (synced by `pnpm db:sync:managed-data -- --apply`). This file is a
 * thin adapter that fires the trigger and reconstructs the legacy return
 * shape (`{ created, taskId, subtaskIds, subtaskStatuses }`) so existing
 * callers don't have to change.
 *
 * To change the onboarding tree (titles, descriptions, subtask kinds,
 * action links, completion gate, etc.), edit the trigger blueprints under
 * `src/lib/triggers/blueprints/`
 * or update the trigger row over MCP via `updateTaskTrigger`. Don't add
 * spawn logic here.
 */

import { TaskCommentKind, TaskCommentSource, TaskStatus } from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { buildTriggerContext, fireTaskTrigger } from "@/lib/triggers";
import {
  getUserTreatySubtaskKey as getUserTreatySubtaskKeyShared,
  getUserTreatyTaskKey as getUserTreatyTaskKeyShared,
} from "@/lib/tasks/task-keys";

export const USER_TREATY_TASK_TITLE =
  "Get 4 billion people to vote on the 1% Treaty";
export const PROMOTION_TO_HUMANITY_MANAGER_TASK_TITLE =
  "Promote to Humanity Manager";

export type UserTreatySubtaskKind =
  | "completeTraining"
  | "signTreatyPersonally"
  | "shareReferralUrl"
  | "phoneScript"
  | "assignFirstHuman"
  | "assignSecondHuman";

export type UserTreatySubtaskIds = Record<UserTreatySubtaskKind, string>;
export type UserTreatySubtaskStatuses = Record<
  UserTreatySubtaskKind,
  TaskStatus
>;

const REQUIRED_SUBTASK_KINDS: readonly UserTreatySubtaskKind[] = [
  "signTreatyPersonally",
  "shareReferralUrl",
  "phoneScript",
  "assignFirstHuman",
  "assignSecondHuman",
  "completeTraining",
];

const WISHONIA_WELCOME_COMMENT = [
  "Welcome. I'm Wishonia.",
  "",
  "On Earth, 60 million humans die every year, mostly from things we already know how to fix. The 1% Treaty redirects 1% of military spending into pragmatic clinical trials. It would prevent ~10.7 billion deaths over the coming century, divided across a majority of humans on Earth.",
  "",
  "Your Humanity Management objective: get 4 billion people to vote on the 1% Treaty. Start small: share your referral URL, then give two humans their voting tasks.",
  "",
  "Each named invitation becomes your local follow-up task. When that human votes, the task completes. Their own training tree belongs to them; the referral graph keeps the lineage.",
  "",
  "It's almost like treating people like humans works better. Weird.",
].join("\n");

export function getUserTreatyTaskKey(userId: string) {
  return getUserTreatyTaskKeyShared(userId);
}

export function getUserTreatySubtaskKey(
  userId: string,
  kind: UserTreatySubtaskKind,
) {
  return getUserTreatySubtaskKeyShared(userId, kind);
}

export interface EnsureUserTreatyTaskResult {
  /// True when the parent HMT root was newly created on this call (first
  /// signup), false on subsequent idempotent calls. Mirrors legacy semantic.
  created: boolean;
  taskId: string;
  subtaskIds: UserTreatySubtaskIds;
  subtaskStatuses: UserTreatySubtaskStatuses;
}

/**
 * Idempotent — fires the `user-onboarding:treaty` trigger which spawns or
 * refreshes the per-user onboarding tree. Safe to call multiple times for
 * the same user; spawn logic upserts by taskKey.
 *
 * Throws if the trigger blueprint hasn't been synced.
 */
export async function ensureUserTreatyTask(
  input: {
    now?: Date;
    personId: string | null;
    userId: string;
  },
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<EnsureUserTreatyTaskResult> {
  const result = await fireTaskTrigger(
    "user-onboarding:treaty",
    buildTriggerContext({
      user: { id: input.userId, personId: input.personId ?? null },
    }),
    { actorUserId: input.userId, db },
  );

  if (result.result === "filteredOut" || result.result === "failed") {
    throw new Error(
      `user-onboarding:treaty trigger did not run (${result.result}: ${result.reason ?? result.error ?? "unknown"}). Did managed data sync run? Try: pnpm db:sync:managed-data -- --apply`,
    );
  }

  const parent = result.spawnedSpecs.find((s) => s.isParent);
  if (!parent) {
    throw new Error(
      "user-onboarding:treaty trigger has no parent spec. Re-run pnpm db:sync:managed-data -- --apply.",
    );
  }

  const childByKind = new Map(
    result.spawnedSpecs.filter((s) => !s.isParent).map((s) => [s.kind, s]),
  );

  const subtaskIds = {} as UserTreatySubtaskIds;
  const subtaskStatuses = {} as UserTreatySubtaskStatuses;
  for (const kind of REQUIRED_SUBTASK_KINDS) {
    const c = childByKind.get(kind);
    if (!c) {
      throw new Error(
        `user-onboarding:treaty trigger missing required spec '${kind}'. Re-run pnpm db:sync:managed-data -- --apply.`,
      );
    }
    subtaskIds[kind] = c.taskId;
    subtaskStatuses[kind] = c.status;
  }

  return {
    created: parent.wasCreated,
    taskId: parent.taskId,
    subtaskIds,
    subtaskStatuses,
  };
}

export const WISHONIA_AUTHOR_NAME = "Wishonia";

export function buildWishoniaWelcomeComment() {
  return {
    authorNameOverride: WISHONIA_AUTHOR_NAME,
    kind: TaskCommentKind.COMMENT,
    message: WISHONIA_WELCOME_COMMENT,
    source: TaskCommentSource.SYSTEM,
  };
}
