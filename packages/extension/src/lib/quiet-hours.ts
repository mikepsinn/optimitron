/**
 * Quiet-hours window for agenda notifications: 23:30–08:30 America/Chicago.
 * During quiet hours the background worker updates the badge only — no
 * chrome.notifications. Pure: takes the instant explicitly.
 */

export const AGENDA_QUIET_START = "23:30";
export const AGENDA_QUIET_END = "08:30";
export const AGENDA_QUIET_TIME_ZONE = "America/Chicago";

/** "HH:MM" for the given instant in the given IANA time zone. */
export function zonedHHMM(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  // Some ICU versions render midnight as "24" with hour12: false.
  return `${hour === "24" ? "00" : hour}:${minute}`;
}

/**
 * True when `date` falls inside [start, end) — a window that may wrap
 * midnight (23:30–08:30 does). Start inclusive, end exclusive, so 08:30
 * itself is already outside quiet hours.
 */
export function isWithinWindow(
  hhmm: string,
  start: string,
  end: string,
): boolean {
  if (start <= end) return hhmm >= start && hhmm < end;
  return hhmm >= start || hhmm < end;
}

export function isQuietHours(
  date: Date,
  options?: { end?: string; start?: string; timeZone?: string },
): boolean {
  const hhmm = zonedHHMM(date, options?.timeZone ?? AGENDA_QUIET_TIME_ZONE);
  return isWithinWindow(
    hhmm,
    options?.start ?? AGENDA_QUIET_START,
    options?.end ?? AGENDA_QUIET_END,
  );
}
