import { CronExpressionParser } from "cron-parser";

/**
 * Decide whether a trigger with the given cron `schedule` is due to fire,
 * based on its last successful fire time. Returns true when at least one
 * scheduled tick exists in the half-open interval (lastFiredAt, now].
 *
 * Behavior:
 *   - lastFiredAt == null → due (never fired before)
 *   - schedule invalid    → not due (caller logs the parse error)
 *   - any tick ≥ lastFiredAt and ≤ now → due
 *
 * Granularity is bounded by the cron handler's tick rate (currently every
 * 5 minutes via vercel.json). A `* * * * *` schedule effectively becomes
 * every-5-min for our purposes.
 */
export function isScheduleDue(
  schedule: string,
  lastFiredAt: Date | null,
  now: Date = new Date(),
): boolean {
  // cron-parser treats `currentDate` as inclusive AND rounds to seconds.
  // We want the half-open window (lastFiredAt, now], so bump by 1s when
  // lastFiredAt is provided. (1ms isn't enough — cron-parser drops the ms.)
  const currentDate = lastFiredAt
    ? new Date(lastFiredAt.getTime() + 1000)
    : new Date(0);
  let interval;
  try {
    interval = CronExpressionParser.parse(schedule, {
      currentDate,
      endDate: now,
    });
  } catch {
    return false;
  }
  try {
    const nextTick = interval.next().toDate();
    return nextTick <= now;
  } catch {
    // No more ticks in window → not due.
    return false;
  }
}
