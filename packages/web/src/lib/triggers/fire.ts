import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { matchesEventFilter } from "./event-filter";
import {
  dryRunFire,
  fireSpawnCommunication,
  fireSpawnTasks,
  fireVerifyTask,
} from "./fire-handlers";
import { render } from "./template";
import {
  finished,
  type FireDb,
  type FireOptions as TriggerFireOptions,
  type FireResult as TriggerFireResult,
} from "./fire-types";

export type { FireOptions, FireResult, SpawnedSpec } from "./fire-types";

/**
 * Fire a TaskTrigger by triggerKey with the given event context.
 *
 * Behavior depends on trigger.triggerKind:
 *   "spawnTasks"         -> upsert one Task per TaskSpawnSpec
 *   "verifyTask"         -> mark the target task VERIFIED if its gate is met
 *   "spawnCommunication" -> create TaskComment + TaskCommunication records
 *
 * Idempotency: the trigger's idempotencyKeyTemplate is rendered against
 * context. Cached successful fires short-circuit only for trigger kinds where
 * re-running would be unsafe or pointless; task spawning itself remains
 * idempotent through taskKey upserts so new specs can lazily backfill.
 */
export async function fireTaskTrigger(
  triggerKey: string,
  context: unknown,
  options: TriggerFireOptions = {},
): Promise<TriggerFireResult> {
  const actorUserId = options.actorUserId ?? null;
  const callerDb = options.db ?? prisma;
  const trigger = await callerDb.taskTrigger.findUnique({
    where: { triggerKey },
    include: {
      spawnSpecs: { orderBy: { sortOrder: "asc" } },
      communicationSpawnSpecs: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!trigger || trigger.deletedAt) {
    return finished("filteredOut", triggerKey, { reason: `trigger not found: ${triggerKey}` });
  }
  if (!trigger.enabled && !options.dryRun) {
    return finished("filteredOut", triggerKey, {
      triggerId: trigger.id,
      reason: `disabled${trigger.disabledReason ? `: ${trigger.disabledReason}` : ""}`,
    });
  }
  if (!matchesEventFilter(trigger.eventFilter, context)) {
    return finished("filteredOut", triggerKey, {
      triggerId: trigger.id,
      reason: "eventFilter rejected",
    });
  }

  const idempRender = render(trigger.idempotencyKeyTemplate, context);
  const idempotencyKey = idempRender.rendered;
  if (!idempotencyKey || idempRender.missingPaths.length > 0) {
    return finished("failed", triggerKey, {
      triggerId: trigger.id,
      idempotencyKey,
      error: `idempotencyKeyTemplate rendered empty or missing paths: ${idempRender.missingPaths.join(",")}`,
    });
  }

  if (!options.dryRun) {
    const shouldShortCircuit =
      trigger.triggerKind === "verifyTask" ||
      (trigger.triggerKind === "spawnCommunication" && !trigger.schedule);
    if (shouldShortCircuit) {
      const prior = await callerDb.taskTriggerFire.findFirst({
        where: {
          triggerId: trigger.id,
          idempotencyKey,
          ...(trigger.triggerKind === "verifyTask"
            ? { result: "verified" }
            : { result: { notIn: ["failed", "filteredOut", "rateLimited"] } }),
        },
        orderBy: { firedAt: "desc" },
      });
      if (prior) {
        return {
          result: "alreadyFired",
          triggerId: trigger.id,
          triggerKey,
          idempotencyKey,
          spawnedSpecs: [],
          spawnedTaskIds: prior.spawnedTaskIds,
          spawnedTaskKeys: prior.spawnedTaskKeys,
        };
      }
    }
  }

  try {
    if (options.dryRun) {
      return await dryRunFire(trigger, context, idempotencyKey, actorUserId);
    }

    const runWith = async (tx: FireDb): Promise<TriggerFireResult> => {
      let res: TriggerFireResult;
      switch (trigger.triggerKind) {
        case "spawnTasks":
          res = await fireSpawnTasks(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        case "verifyTask":
          res = await fireVerifyTask(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        case "spawnCommunication":
          res = await fireSpawnCommunication(tx, trigger, context, idempotencyKey, actorUserId);
          break;
        default:
          res = finished("failed", triggerKey, {
            triggerId: trigger.id,
            idempotencyKey,
            error: `unknown triggerKind: ${trigger.triggerKind}`,
          });
      }

      if (res.result !== "filteredOut" && res.result !== "rateLimited") {
        await tx.taskTriggerFire.upsert({
          where: {
            triggerId_idempotencyKey: { triggerId: trigger.id, idempotencyKey },
          },
          create: {
            triggerId: trigger.id,
            idempotencyKey,
            actorUserId,
            context: context as Prisma.InputJsonValue,
            result: res.result,
            error: res.error ?? null,
            spawnedTaskKeys: res.spawnedTaskKeys,
            spawnedTaskIds: res.spawnedTaskIds,
          },
          update: {
            actorUserId,
            context: context as Prisma.InputJsonValue,
            result: res.result,
            error: res.error ?? null,
            spawnedTaskKeys: res.spawnedTaskKeys,
            spawnedTaskIds: res.spawnedTaskIds,
            firedAt: new Date(),
          },
        });
      }
      return res;
    };

    if (options.db) {
      return await runWith(options.db as FireDb);
    }
    if (trigger.triggerKind === "spawnCommunication") {
      return await runWith(prisma);
    }
    return await prisma.$transaction((tx) => runWith(tx));
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.taskTriggerFire
      .upsert({
        where: {
          triggerId_idempotencyKey: { triggerId: trigger.id, idempotencyKey },
        },
        create: {
          triggerId: trigger.id,
          idempotencyKey,
          actorUserId,
          context: context as Prisma.InputJsonValue,
          result: "failed",
          error,
          spawnedTaskKeys: [],
          spawnedTaskIds: [],
        },
        update: {
          result: "failed",
          error,
          firedAt: new Date(),
        },
      })
      .catch(() => {
        /* swallow audit-log failure to surface the original */
      });
    return {
      result: "failed",
      triggerId: trigger.id,
      triggerKey,
      idempotencyKey,
      spawnedSpecs: [],
      spawnedTaskIds: [],
      spawnedTaskKeys: [],
      error,
    };
  }
}

/**
 * Fire all enabled triggers matching `eventName` with the given context.
 * Used at event sites: post-signin hook, MCP dispatcher, cron, etc.
 */
export async function fireTaskTriggersForEvent(
  eventName: string,
  context: unknown,
  options: TriggerFireOptions = {},
): Promise<TriggerFireResult[]> {
  const callerDb = options.db ?? prisma;
  const triggers = await callerDb.taskTrigger.findMany({
    where: { eventName, enabled: true, deletedAt: null },
    select: { triggerKey: true },
  });
  return Promise.all(triggers.map((t) => fireTaskTrigger(t.triggerKey, context, options)));
}
