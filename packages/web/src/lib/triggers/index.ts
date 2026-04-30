/**
 * Public entrypoint for the TaskTrigger framework.
 *
 * Usage at event sites:
 *
 *   import { fireTaskTriggersForEvent } from "@/lib/triggers";
 *
 *   await fireTaskTriggersForEvent("user.signup", { user });
 *   await fireTaskTriggersForEvent("referral.sent", { user, recipient, inviteToken });
 *   await fireTaskTriggersForEvent("task.statusChanged.VERIFIED", { task, user });
 *
 * Usage to fire a single specific trigger (cron / manual / per-record loops):
 *
 *   import { fireTaskTrigger } from "@/lib/triggers";
 *
 *   await fireTaskTrigger("treaty:signer", { slot, paramSetHash });
 *   await fireTaskTrigger("task:overdue-reminder", { task, sendCount });
 *
 * By default the helpers open their own `prisma.$transaction`. Pass
 * `{ db: tx }` when the trigger must share a caller transaction, for example
 * when a spawned task ID is written into another row in the same commit.
 */

export {
  fireTaskTrigger,
  fireTaskTriggersForEvent,
  type FireOptions,
  type FireResult,
} from "./fire";

export { buildTriggerContext, buildTriggerParams } from "./context";
