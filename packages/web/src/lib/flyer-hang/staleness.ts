import { FLYER_HANG_STALE_AFTER_DAYS } from "./constants";

export function flyerHangStaleAfterMs(days = FLYER_HANG_STALE_AFTER_DAYS) {
  return days * 86_400_000;
}

export function getFlyerHangFreshness(input: {
  lastHungAt: Date | string | null | undefined;
  now?: Date;
  staleAfterDays?: number;
}) {
  const now = input.now ?? new Date();
  const staleAfterMs = flyerHangStaleAfterMs(
    input.staleAfterDays ?? FLYER_HANG_STALE_AFTER_DAYS,
  );
  if (!input.lastHungAt) {
    return {
      isStale: true,
      lastHungAt: null as Date | null,
      staleAgeDays: null as number | null,
      status: "never_hung" as const,
    };
  }
  const lastHungAt =
    input.lastHungAt instanceof Date
      ? input.lastHungAt
      : new Date(input.lastHungAt);
  const ageMs = now.getTime() - lastHungAt.getTime();
  const staleAgeDays = ageMs / 86_400_000;
  const isStale = ageMs >= staleAfterMs;
  return {
    isStale,
    lastHungAt,
    staleAgeDays,
    status: isStale ? ("stale" as const) : ("fresh" as const),
  };
}

export function compareFlyerHangPriority(a: {
  distanceKm: number;
  isStale: boolean;
  lastHungAt: Date | null;
}, b: {
  distanceKm: number;
  isStale: boolean;
  lastHungAt: Date | null;
}) {
  if (a.isStale !== b.isStale) return a.isStale ? -1 : 1;
  if (a.lastHungAt == null && b.lastHungAt != null) return -1;
  if (a.lastHungAt != null && b.lastHungAt == null) return 1;
  if (a.lastHungAt && b.lastHungAt) {
    const ageDiff = a.lastHungAt.getTime() - b.lastHungAt.getTime();
    if (ageDiff !== 0) return ageDiff; // older hang first among stale/fresh peers
  }
  return a.distanceKm - b.distanceKm;
}
