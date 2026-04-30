/**
 * Generic cron tick: read every enabled TaskTrigger with a non-null
 * `schedule`, decide which are due since their last successful fire, run
 * the trigger's `iterationSource` to get records to act on, and fire the
 * trigger once per record.
 *
 * Hit by Vercel cron every 5 min (see vercel.json). New cron-driven
 * triggers are added by writing a TaskTrigger row — no new route needed.
 *
 * Adding a new iteration shape (e.g. "users-pending-digest") IS a code
 * change in `iteration-sources.ts`. That's the right split: data queries
 * live in code (small, named, typed), behavior lives in DB rows.
 */

import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { fireTaskTrigger } from "@/lib/triggers/fire";
import { resolveIterationSource } from "@/lib/triggers/iteration-sources";
import { isScheduleDue } from "@/lib/triggers/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = createLogger("run-due-triggers");

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const triggers = await prisma.taskTrigger.findMany({
    where: {
      deletedAt: null,
      enabled: true,
      schedule: { not: null },
    },
    select: {
      id: true,
      triggerKey: true,
      schedule: true,
      iterationSource: true,
    },
  });

  const summary: Array<{ triggerKey: string; due: boolean; fired: number; reason?: string }> = [];

  for (const trigger of triggers) {
    if (!trigger.schedule) continue;

    const lastFire = await prisma.taskTriggerFire.findFirst({
      where: {
        triggerId: trigger.id,
        result: { in: ["spawned", "verified", "communicated", "alreadyFired"] },
      },
      orderBy: { firedAt: "desc" },
      select: { firedAt: true },
    });

    const due = isScheduleDue(trigger.schedule, lastFire?.firedAt ?? null, now);
    if (!due) {
      summary.push({ triggerKey: trigger.triggerKey, due: false, fired: 0 });
      continue;
    }

    const resolver = resolveIterationSource(trigger.iterationSource);
    if (!resolver) {
      log.error("Unknown iterationSource", {
        triggerKey: trigger.triggerKey,
        iterationSource: trigger.iterationSource,
      });
      summary.push({
        triggerKey: trigger.triggerKey,
        due: true,
        fired: 0,
        reason: `unknown iterationSource: ${trigger.iterationSource}`,
      });
      continue;
    }

    let records;
    try {
      records = await resolver(prisma);
    } catch (err) {
      log.error("Iteration source threw", {
        triggerKey: trigger.triggerKey,
        error: err instanceof Error ? err.message : String(err),
      });
      summary.push({
        triggerKey: trigger.triggerKey,
        due: true,
        fired: 0,
        reason: "iteration-source threw",
      });
      continue;
    }

    let fired = 0;
    for (const { contextKey, record, priorSendCount } of records) {
      const context = contextKey
        ? { [contextKey]: record, priorSendCount }
        : { priorSendCount };
      try {
        const result = await fireTaskTrigger(trigger.triggerKey, context);
        if (
          result.result === "spawned" ||
          result.result === "verified" ||
          result.result === "communicated"
        ) {
          fired++;
        }
      } catch (err) {
        log.error("fireTaskTrigger threw inside cron loop", {
          triggerKey: trigger.triggerKey,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    summary.push({ triggerKey: trigger.triggerKey, due: true, fired });
  }

  log.info("run-due-triggers tick complete", { summary });
  return NextResponse.json({ ranAt: now.toISOString(), triggers: summary });
}
